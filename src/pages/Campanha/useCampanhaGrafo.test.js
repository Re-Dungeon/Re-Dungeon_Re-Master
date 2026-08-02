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

const notifyError = vi.fn();
vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({ notifyError }),
}));

import useCampanhaGrafo from './useCampanhaGrafo';

const CAMPANHA = { id: 'c1', universoId: 'u1', mestreId: 'm1' };

// getRmCenas já recebe campanhaId/universoId/mestreId e filtra no servidor
// (Firestore Rules) — o mock só devolve cenas da campanha ativa, como a
// query real faria.
const CENAS_MOCK = [
  {
    id: 'cena1',
    campanhaId: 'c1',
    titulo: 'Chegada',
    estado: 'concluido',
    posicaoCanvas: { x: 10, y: 20 },
  },
  {
    id: 'cena2',
    campanhaId: 'c1',
    titulo: 'Prefeito',
    estado: 'em_andamento',
    posicaoCanvas: null,
  },
];

const CONEXOES_MOCK = [
  {
    id: 'conexao1',
    campanhaId: 'c1',
    origemCenaId: 'cena1',
    destinoCenaId: 'cena2',
  },
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
      expect.objectContaining({
        id: 'conexao1',
        source: 'cena1',
        target: 'cena2',
      }),
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

  it('persistirPosicaoCena avisa o mestre (notifyError) quando o Firestore falha, sem propagar a exceção', async () => {
    updateRmCena.mockRejectedValue(new Error('permission-denied'));
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.persistirPosicaoCena('cena1', { x: 5, y: 5 });
    });

    expect(notifyError).toHaveBeenCalledWith(
      'Não foi possível salvar a nova posição da cena.',
    );
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

  it('expõe o erro quando o Firestore falha, sem travar em loading', async () => {
    const falha = new Error('permission-denied');
    getRmCenas.mockRejectedValue(falha);
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(falha);
  });

  it('recarregar tenta de novo e limpa o erro quando dá certo', async () => {
    getRmCenas.mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    getRmCenas.mockResolvedValue(CENAS_MOCK);
    await act(async () => {
      await result.current.recarregar();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.cenas).toHaveLength(2);
  });
});

describe('useCampanhaGrafo — desempenho com campanha sintética grande', () => {
  const NUM_CENAS = 150;

  beforeEach(() => {
    vi.clearAllMocks();
    const cenasSinteticas = Array.from({ length: NUM_CENAS }, (_, i) => ({
      id: `cena-${i}`,
      campanhaId: 'c1',
      titulo: `Cena ${i}`,
      estado: 'nao_iniciado',
      posicaoCanvas: null,
    }));
    // Cada cena (exceto a última) conecta com a próxima, mais um pulo extra
    // a cada 5 cenas — grafo não-linear, mais realista que uma corrente simples.
    const conexoesSinteticas = [];
    for (let i = 0; i < NUM_CENAS - 1; i += 1) {
      conexoesSinteticas.push({
        id: `conexao-linear-${i}`,
        campanhaId: 'c1',
        origemCenaId: `cena-${i}`,
        destinoCenaId: `cena-${i + 1}`,
      });
      if (i % 5 === 0 && i + 5 < NUM_CENAS) {
        conexoesSinteticas.push({
          id: `conexao-pulo-${i}`,
          campanhaId: 'c1',
          origemCenaId: `cena-${i}`,
          destinoCenaId: `cena-${i + 5}`,
        });
      }
    }
    getRmCenas.mockResolvedValue(cenasSinteticas);
    getRmCenaConexoes.mockResolvedValue(conexoesSinteticas);
  });

  it('carrega e calcula o layout de 150+ cenas sem travar, com posições numéricas válidas', async () => {
    const inicio = performance.now();
    const { result } = renderHook(() => useCampanhaGrafo(CAMPANHA));

    await waitFor(() => expect(result.current.loading).toBe(false), {
      timeout: 5000,
    });
    const duracaoMs = performance.now() - inicio;

    expect(result.current.error).toBeNull();
    expect(result.current.nodes).toHaveLength(NUM_CENAS);
    expect(result.current.edges.length).toBeGreaterThan(NUM_CENAS - 1);
    result.current.nodes.forEach(node => {
      expect(Number.isFinite(node.position.x)).toBe(true);
      expect(Number.isFinite(node.position.y)).toBe(true);
    });
    // Generoso de propósito (CI/máquinas variam) — o objetivo é pegar uma
    // regressão grosseira no cálculo do layout, não cravar um benchmark fino.
    expect(duracaoMs).toBeLessThan(5000);
  });
});
