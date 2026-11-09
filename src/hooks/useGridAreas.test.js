import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  addGridArea,
  removeGridArea,
  removeGridAreas,
  subscribeGridAreas,
  updateGridArea,
} from 'service/storage';
import { AREAS_POR_CENA_MAX, AREAS_POR_PESSOA_MAX } from 'common/utils/gridAreas';
import useGridAreas from './useGridAreas';

vi.mock('service/storage', () => ({
  subscribeGridAreas: vi.fn(),
  addGridArea: vi.fn(),
  updateGridArea: vi.fn(),
  removeGridArea: vi.fn(),
  removeGridAreas: vi.fn(),
}));

const doc = (id, extra = {}) => ({
  id,
  uid: 'u1',
  forma: 'cone',
  origem: { col: 1, lin: 1 },
  alvo: { col: 4, lin: 1 },
  metros: 9,
  cor: '#e05555',
  createdAt: { seconds: 10, nanoseconds: 0 },
  ...extra,
});

let emitir;
let falhar;
const onErro = vi.fn();

const renderAreas = (opcoes = {}, cenaId = 'cena') =>
  renderHook(
    ({ cena, ...props }) =>
      useGridAreas('c', cena, {
        ativo: true,
        uid: 'u1',
        nome: 'Aldric',
        onErro,
        ...props,
      }),
    { initialProps: { cena: cenaId, ...opcoes } },
  );

describe('useGridAreas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    subscribeGridAreas.mockImplementation((_c, _cena, onChange, onError) => {
      emitir = onChange;
      falhar = onError;
      return vi.fn();
    });
    addGridArea.mockResolvedValue('novo');
    updateGridArea.mockResolvedValue();
    removeGridArea.mockResolvedValue();
    removeGridAreas.mockResolvedValue();
  });

  it('assina a cena, normaliza, descarta inválidas e ordena por createdAt', () => {
    const { result } = renderAreas();
    expect(subscribeGridAreas).toHaveBeenCalledWith(
      'c',
      'cena',
      expect.any(Function),
      expect.any(Function),
    );
    act(() =>
      emitir([
        doc('b', { createdAt: { seconds: 20, nanoseconds: 0 } }),
        doc('ruim', { forma: 'estrela' }),
        doc('a'),
        doc('pendente', { createdAt: null }),
      ]),
    );
    expect(result.current.areas.map(area => area.id)).toEqual(['a', 'b', 'pendente']);
  });

  it('inativo não assina; trocar de cena esvazia', () => {
    renderAreas({ ativo: false });
    expect(subscribeGridAreas).not.toHaveBeenCalled();
    const { result, rerender } = renderAreas();
    act(() => emitir([doc('a')]));
    expect(result.current.areas).toHaveLength(1);
    rerender({ cena: 'outra' });
    expect(result.current.areas).toEqual([]);
  });

  it('criar grava a área com autor e nome; raio sem alvo', async () => {
    const { result } = renderAreas();
    let ok;
    await act(async () => {
      ok = await result.current.criar({
        forma: 'raio',
        origem: { col: 2, lin: 2 },
        alvo: { col: 3, lin: 3 },
        metros: 6,
        cor: '#4caf50',
      });
    });
    expect(ok).toBe(true);
    expect(addGridArea).toHaveBeenCalledWith('c', 'cena', {
      uid: 'u1',
      nome: 'Aldric',
      forma: 'raio',
      origem: { col: 2, lin: 2 },
      metros: 6,
      cor: '#4caf50',
    });
  });

  it('criar recusa acima dos limites por pessoa e por cena', async () => {
    const nova = { forma: 'raio', origem: { col: 0, lin: 0 }, metros: 3, cor: '#e05555' };
    const { result } = renderAreas();
    act(() =>
      emitir(Array.from({ length: AREAS_POR_PESSOA_MAX }, (_, i) => doc(`m${i}`))),
    );
    let ok;
    await act(async () => {
      ok = await result.current.criar(nova);
    });
    expect(ok).toBe(false);
    expect(addGridArea).not.toHaveBeenCalled();
    expect(onErro).toHaveBeenCalledTimes(1);

    onErro.mockClear();
    act(() =>
      emitir(
        Array.from({ length: AREAS_POR_CENA_MAX }, (_, i) =>
          doc(`o${i}`, { uid: 'outro' }),
        ),
      ),
    );
    await act(async () => {
      ok = await result.current.criar(nova);
    });
    expect(ok).toBe(false);
    expect(addGridArea).not.toHaveBeenCalled();
    expect(onErro).toHaveBeenCalledTimes(1);
  });

  it('atualizar e remover chamam o storage; erro de escrita avisa', async () => {
    const { result } = renderAreas();
    act(() => emitir([doc('a')]));
    await act(async () => {
      await result.current.atualizar('a', { origem: { col: 3, lin: 3 }, alvo: null });
      await result.current.remover('a');
    });
    expect(updateGridArea).toHaveBeenCalledWith('c', 'cena', 'a', {
      origem: { col: 3, lin: 3 },
      alvo: null,
    });
    expect(removeGridArea).toHaveBeenCalledWith('c', 'cena', 'a');

    removeGridArea.mockRejectedValueOnce(new Error('x'));
    let ok;
    await act(async () => {
      ok = await result.current.remover('a');
    });
    expect(ok).toBe(false);
    expect(onErro).toHaveBeenCalledWith('Não foi possível remover a área.');
  });

  it('atualizar ignora área desconhecida', async () => {
    const { result } = renderAreas();
    act(() => emitir([doc('a')]));
    await act(async () => {
      await result.current.atualizar('zzz', { origem: { col: 0, lin: 0 } });
    });
    expect(updateGridArea).not.toHaveBeenCalled();
  });

  it('removerTodas só funciona com veTudo', async () => {
    const semPoder = renderAreas();
    act(() => emitir([doc('a'), doc('b')]));
    await act(async () => {
      await semPoder.result.current.removerTodas();
    });
    expect(removeGridAreas).not.toHaveBeenCalled();

    const mestre = renderAreas({ veTudo: true });
    act(() => emitir([doc('a'), doc('b')]));
    await act(async () => {
      await mestre.result.current.removerTodas();
    });
    expect(removeGridAreas).toHaveBeenCalledWith('c', 'cena', ['a', 'b']);
  });

  it('permission-denied é silencioso para o jogador e avisa o mestre', () => {
    renderAreas();
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).not.toHaveBeenCalled();
    act(() => falhar({ code: 'unavailable' }));
    expect(onErro).toHaveBeenCalledTimes(1);
    onErro.mockClear();
    renderAreas({ veTudo: true });
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).toHaveBeenCalledTimes(1);
  });
});
