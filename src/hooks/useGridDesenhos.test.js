import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  addGridDesenho,
  removeGridDesenhos,
  subscribeGridDesenhos,
} from 'service/storage';
import { DESENHOS_POR_USUARIO_MAX } from 'common/utils/gridDesenho';
import useGridDesenhos from './useGridDesenhos';

vi.mock('service/storage', () => ({
  subscribeGridDesenhos: vi.fn(),
  addGridDesenho: vi.fn(),
  removeGridDesenhos: vi.fn(),
}));

const onErro = vi.fn();
let falhar;
const doc = (id, uid, createdAt) => ({
  id,
  uid,
  cor: '#ffffff',
  pontos: [0, 0, 5, 5],
  createdAt,
});

const emitirDocs = docs =>
  subscribeGridDesenhos.mockImplementation((_c, _cena, onChange, onError) => {
    falhar = onError;
    onChange(docs);
    return vi.fn();
  });

const renderDesenhos = (opcoes = {}) =>
  renderHook(() =>
    useGridDesenhos('c1', 'cena-1', { ativo: true, uid: 'u1', onErro, ...opcoes }),
  );

describe('useGridDesenhos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emitirDocs([
      doc('d2', 'u2', 20),
      doc('d1', 'u1', 10),
      { id: 'ruim', uid: 'u1', pontos: [1, 2, 3] },
    ]);
    addGridDesenho.mockResolvedValue('novo');
    removeGridDesenhos.mockResolvedValue();
  });

  it('normaliza, ordena e marca os próprios', () => {
    const { result } = renderDesenhos();
    expect(result.current.desenhos.map(d => [d.id, d.proprio])).toEqual([
      ['d1', true],
      ['d2', false],
    ]);
  });

  it('desenhar grava o traço sem apagar nada abaixo do limite', async () => {
    const { result } = renderDesenhos();
    await act(async () => {
      await result.current.desenhar({ cor: '#e05555', pontos: [0, 0, 9, 9] });
    });
    expect(addGridDesenho).toHaveBeenCalledWith(
      'c1',
      'cena-1',
      { uid: 'u1', cor: '#e05555', pontos: [0, 0, 9, 9] },
      [],
    );
  });

  it('com o limite atingido, apaga os meus mais antigos na mesma escrita', async () => {
    emitirDocs([
      doc('outro', 'u2', 1),
      ...Array.from({ length: DESENHOS_POR_USUARIO_MAX }, (_, i) =>
        doc(`m${i}`, 'u1', 100 + i),
      ),
    ]);
    const { result } = renderDesenhos();
    await act(async () => {
      await result.current.desenhar({ cor: '#ffffff', pontos: [0, 0, 1, 1] });
    });
    expect(addGridDesenho.mock.calls[0][3]).toEqual(['m0']);
  });

  it('apagarMeus só leva os meus; apagarTodos só existe para o mestre', async () => {
    const { result } = renderDesenhos();
    expect(result.current.apagarTodos).toBeUndefined();
    await act(async () => {
      await result.current.apagarMeus();
    });
    expect(removeGridDesenhos).toHaveBeenCalledWith('c1', 'cena-1', ['d1']);

    const mestre = renderDesenhos({ veTudo: true });
    await act(async () => {
      await mestre.result.current.apagarTodos();
    });
    expect(removeGridDesenhos).toHaveBeenLastCalledWith('c1', 'cena-1', ['d1', 'd2']);
  });

  it('sem desenhos meus não chama o storage', async () => {
    emitirDocs([doc('d2', 'u2', 20)]);
    const { result } = renderDesenhos();
    await act(async () => {
      await result.current.apagarMeus();
    });
    expect(removeGridDesenhos).not.toHaveBeenCalled();
  });

  it('falha ao salvar avisa; permission-denied só avisa o mestre', async () => {
    addGridDesenho.mockRejectedValueOnce(new Error('falhou'));
    const { result } = renderDesenhos();
    let ok;
    await act(async () => {
      ok = await result.current.desenhar({ cor: '#ffffff', pontos: [0, 0, 1, 1] });
    });
    expect(ok).toBe(false);
    expect(onErro).toHaveBeenCalledWith('Não foi possível salvar o desenho.');
    onErro.mockClear();
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).not.toHaveBeenCalled();
    renderDesenhos({ veTudo: true });
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).toHaveBeenCalledTimes(1);
  });
});
