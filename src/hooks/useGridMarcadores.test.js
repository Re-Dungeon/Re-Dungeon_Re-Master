import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  addGridMarcador,
  removeGridMarcador,
  subscribeGridMarcadores,
  updateGridMarcador,
} from 'service/storage';
import { MARCADORES_POR_CENA_MAX } from 'common/utils/gridMarcadores';
import useGridMarcadores from './useGridMarcadores';

vi.mock('service/storage', () => ({
  subscribeGridMarcadores: vi.fn(),
  addGridMarcador: vi.fn(),
  updateGridMarcador: vi.fn(),
  removeGridMarcador: vi.fn(),
}));

const DOCS = [
  {
    id: 'b',
    col: 2,
    lin: 2,
    icone: 'perigo',
    cor: '#e05555',
    titulo: 'B',
    createdAt: 20,
  },
  {
    id: 'a',
    col: 1,
    lin: 1,
    tamanho: 1,
    icone: 'porta',
    cor: '#ffffff',
    titulo: 'A',
    createdAt: 10,
  },
  { id: 'x', col: 'ruim', titulo: 'inválido' },
];
const onErro = vi.fn();
let falhar;

const renderMarcadores = (opcoes = {}) =>
  renderHook(() =>
    useGridMarcadores('c1', 'cena-1', {
      ativo: true,
      veTudo: true,
      onErro,
      ...opcoes,
    }),
  );

describe('useGridMarcadores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeGridMarcadores.mockImplementation(
      (_c, _cena, _op, onChange, onError) => {
        falhar = onError;
        onChange(DOCS);
        return vi.fn();
      },
    );
    addGridMarcador.mockResolvedValue('novo');
    updateGridMarcador.mockResolvedValue();
    removeGridMarcador.mockResolvedValue();
  });

  it('normaliza e ordena; jogador consulta sem secretos, mestre com todos', () => {
    const { result } = renderMarcadores({ veTudo: false });
    expect(result.current.marcadores.map(m => m.id)).toEqual(['a', 'b']);
    expect(subscribeGridMarcadores).toHaveBeenLastCalledWith(
      'c1',
      'cena-1',
      { incluirSecretos: false },
      expect.any(Function),
      expect.any(Function),
    );
    renderMarcadores();
    expect(subscribeGridMarcadores).toHaveBeenLastCalledWith(
      'c1',
      'cena-1',
      { incluirSecretos: true },
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('criarMarcador valida, grava e devolve o id', async () => {
    const { result } = renderMarcadores();
    let id;
    await act(async () => {
      id = await result.current.criarMarcador({
        col: 3,
        lin: 4,
        tamanho: 3,
        icone: 'tesouro',
        cor: '#4caf50',
        titulo: ' Baú ',
        secreto: true,
      });
    });
    expect(id).toBe('novo');
    expect(addGridMarcador).toHaveBeenCalledWith('c1', 'cena-1', {
      col: 3,
      lin: 4,
      tamanho: 3,
      icone: 'tesouro',
      cor: '#4caf50',
      titulo: 'Baú',
      texto: '',
      secreto: true,
    });

    await act(async () => {
      id = await result.current.criarMarcador({ col: 3, lin: 4, titulo: '  ' });
    });
    expect(id).toBeNull();
    expect(onErro).toHaveBeenCalledWith('Dê um título ao marcador.');
    expect(addGridMarcador).toHaveBeenCalledTimes(1);
  });

  it('respeita o limite por cena', async () => {
    subscribeGridMarcadores.mockImplementation((_c, _cena, _op, onChange) => {
      onChange(
        Array.from({ length: MARCADORES_POR_CENA_MAX }, (_, i) => ({
          id: `m${i}`,
          col: i % 10,
          lin: 0,
          titulo: 'm',
        })),
      );
      return vi.fn();
    });
    const { result } = renderMarcadores();
    let id;
    await act(async () => {
      id = await result.current.criarMarcador({
        col: 1,
        lin: 1,
        tamanho: 1,
        titulo: 'mais um',
      });
    });
    expect(id).toBeNull();
    expect(addGridMarcador).not.toHaveBeenCalled();
    expect(onErro).toHaveBeenCalled();
  });

  it('salvarMarcador mescla o patch; apagarMarcador remove', async () => {
    const { result } = renderMarcadores();
    let ok;
    await act(async () => {
      ok = await result.current.salvarMarcador('a', {
        titulo: 'Novo',
        secreto: true,
      });
    });
    expect(ok).toBe(true);
    expect(updateGridMarcador).toHaveBeenCalledWith('c1', 'cena-1', 'a', {
      col: 1,
      lin: 1,
      tamanho: 1,
      icone: 'porta',
      cor: '#ffffff',
      titulo: 'Novo',
      texto: '',
      secreto: true,
    });
    await act(async () => {
      ok = await result.current.apagarMarcador('a');
    });
    expect(ok).toBe(true);
    expect(removeGridMarcador).toHaveBeenCalledWith('c1', 'cena-1', 'a');
  });

  it('jogador não grava; permission-denied só avisa o mestre', async () => {
    const jogador = renderMarcadores({ veTudo: false });
    let id;
    await act(async () => {
      id = await jogador.result.current.criarMarcador({
        col: 1,
        lin: 1,
        tamanho: 1,
        titulo: 'x',
      });
    });
    expect(id).toBeNull();
    expect(addGridMarcador).not.toHaveBeenCalled();
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).not.toHaveBeenCalled();
    renderMarcadores();
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).toHaveBeenCalledTimes(1);
  });
});
