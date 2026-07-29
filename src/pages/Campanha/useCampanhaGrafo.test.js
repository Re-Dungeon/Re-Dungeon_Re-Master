import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const getRmCenas = vi.fn();
const getRmCenaConexoes = vi.fn();
const addRmCenaConexao = vi.fn();
const removeRmCenaConexao = vi.fn();
const updateRmCena = vi.fn();
const removeRmCena = vi.fn();
vi.mock('service/storage', () => ({
  getRmCenas: (...args) => getRmCenas(...args),
  getRmCenaConexoes: (...args) => getRmCenaConexoes(...args),
  addRmCenaConexao: (...args) => addRmCenaConexao(...args),
  removeRmCenaConexao: (...args) => removeRmCenaConexao(...args),
  updateRmCena: (...args) => updateRmCena(...args),
  removeRmCena: (...args) => removeRmCena(...args),
}));

import useCampanhaGrafo from './useCampanhaGrafo';

const CAMPANHA = { id: 'c1', universoId: 'u1', mestreId: 'm1' };

const CENAS_MOCK = [
  { id: 'cena1', campanhaId: 'c1', titulo: 'Chegada', estado: 'concluido', posicaoCanvas: { x: 10, y: 20 } },
  { id: 'cena2', campanhaId: 'c1', titulo: 'Prefeito', estado: 'em_andamento', posicaoCanvas: null },
  { id: 'cenaOutraCampanha', campanhaId: 'outra', titulo: 'Fora', estado: 'nao_iniciado' },
];

const CONEXOES_MOCK = [
  { id: 'conexao1', campanhaId: 'c1', origemCenaId: 'cena1', destinoCenaId: 'cena2' },
];

describe('useCampanhaGrafo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRmCenas.mockResolvedValue(CENAS_MOCK);
    getRmCenaConexoes.mockResolvedValue(CONEXOES_MOCK);
  });

  it('carrega apenas cenas/conexões da campanha informada', async () => {
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cenas).toHaveLength(2);
    expect(result.current.conexoes).toHaveLength(1);
  });

  it('usa posicaoCanvas salva quando existe e calcula layout automático quando não existe', async () => {
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));

    await waitFor(() => expect(result.current.loading).toBe(false));

    const node1 = result.current.nodes.find(n => n.id === 'cena1');
    const node2 = result.current.nodes.find(n => n.id === 'cena2');
    expect(node1.position).toEqual({ x: 10, y: 20 });
    expect(node2.position).not.toEqual({ x: 0, y: 0 });
    expect(typeof node2.position.x).toBe('number');
  });

  it('mapeia conexões para o formato de aresta do React Flow', async () => {
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.edges).toEqual([
      expect.objectContaining({ id: 'conexao1', source: 'cena1', target: 'cena2' }),
    ]);
  });

  it('moveCenaLocal atualiza a posição imediatamente sem chamar o Firestore', async () => {
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.moveCenaLocal('cena1', { x: 99, y: 99 });
    });

    expect(result.current.nodes.find(n => n.id === 'cena1').position).toEqual({
      x: 99,
      y: 99,
    });
    expect(updateRmCena).not.toHaveBeenCalled();
  });

  it('persistirPosicaoCena grava posicaoCanvas no Firestore', async () => {
    updateRmCena.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.persistirPosicaoCena('cena1', { x: 5, y: 5 });
    });

    expect(updateRmCena).toHaveBeenCalledWith('cena1', {
      posicaoCanvas: { x: 5, y: 5 },
    });
  });

  it('createConexao grava uma nova conexão com os IDs derivados da campanha', async () => {
    addRmCenaConexao.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createConexao('cena2', 'cena1');
    });

    expect(addRmCenaConexao).toHaveBeenCalledWith({
      campanhaId: 'c1',
      universoId: 'u1',
      mestreId: 'm1',
      origemCenaId: 'cena2',
      destinoCenaId: 'cena1',
    });
  });

  it('createConexao ignora conexão para si mesma e conexão duplicada', async () => {
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.createConexao('cena1', 'cena1');
    });
    await act(async () => {
      await result.current.createConexao('cena1', 'cena2');
    });

    expect(addRmCenaConexao).not.toHaveBeenCalled();
  });

  it('removeCena remove as conexões ligadas antes de remover a cena', async () => {
    removeRmCenaConexao.mockResolvedValue(undefined);
    removeRmCena.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeCena('cena1');
    });

    expect(removeRmCenaConexao).toHaveBeenCalledWith('conexao1');
    expect(removeRmCena).toHaveBeenCalledWith('cena1');
  });

  it('sem campanha ativa, não busca dados e encerra o loading', async () => {
    const { result } = renderHook(() => useCampanhaGrafo(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(getRmCenas).not.toHaveBeenCalled();
    expect(result.current.cenas).toEqual([]);
  });
});
