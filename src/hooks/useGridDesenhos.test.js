import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  addGridDesenho,
  removeGridDesenhos,
  subscribeGridDesenhos,
} from 'service/storage';
import {
  DESENHO_REVISAO_MS,
  DESENHO_VALIDADE_MS,
  DESENHOS_POR_USUARIO_MAX,
} from 'common/utils/gridDesenho';
import useGridDesenhos from './useGridDesenhos';

vi.mock('service/storage', () => ({
  subscribeGridDesenhos: vi.fn(),
  addGridDesenho: vi.fn(),
  removeGridDesenhos: vi.fn(),
}));

const onErro = vi.fn();
let falhar;
let emitir;
// `ordem` só ordena: o traço nasce há ~1 min (bem dentro da validade).
const doc = (id, uid, ordem) => ({
  id,
  uid,
  cor: '#ffffff',
  pontos: [0, 0, 5, 5],
  createdAt: Date.now() - 60_000 + ordem,
});

const emitirDocs = docs =>
  subscribeGridDesenhos.mockImplementation((_c, _cena, onChange, onError) => {
    falhar = onError;
    emitir = onChange;
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
      { aoCriarLocal: expect.any(Function) },
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

  it('o limite rolante por pessoa é 20', () => {
    expect(DESENHOS_POR_USUARIO_MAX).toBe(20);
  });

  it('esconde os traços já vencidos que vieram na consulta', () => {
    emitirDocs([
      doc('novo', 'u1', 5),
      { ...doc('velho', 'u1', 0), createdAt: Date.now() - DESENHO_VALIDADE_MS - 1000 },
      { ...doc('pendente', 'u1', 0), createdAt: null },
    ]);
    const { result } = renderDesenhos();
    expect(result.current.desenhos.map(d => d.id).sort()).toEqual(['novo', 'pendente']);
  });

  describe('com o relógio', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('o traço some sozinho ao passar da validade, sem nova leitura', () => {
      emitirDocs([{ ...doc('d1', 'u1', 0), createdAt: Date.now() - DESENHO_VALIDADE_MS + 90_000 }]);
      const { result } = renderDesenhos();
      expect(result.current.desenhos.map(d => d.id)).toEqual(['d1']);
      act(() => {
        vi.advanceTimersByTime(DESENHO_REVISAO_MS);
      });
      expect(result.current.desenhos.map(d => d.id)).toEqual(['d1']);
      act(() => {
        vi.advanceTimersByTime(DESENHO_REVISAO_MS);
      });
      expect(result.current.desenhos).toEqual([]);
      expect(subscribeGridDesenhos).toHaveBeenCalledTimes(1);
    });
  });

  it('o traço que acabo de criar aparece antes da confirmação do servidor', async () => {
    emitirDocs([]);
    let liberar;
    addGridDesenho.mockImplementation(
      (_c, _cena, _dados, _ids, { aoCriarLocal }) => {
        aoCriarLocal('novo-id');
        return new Promise(resolve => {
          liberar = () => resolve('novo-id');
        });
      },
    );
    const { result } = renderDesenhos();
    let promessa;
    act(() => {
      promessa = result.current.desenhar({ cor: '#e05555', pontos: [0, 0, 9, 9] });
    });
    expect(result.current.desenhos.map(d => [d.id, d.proprio])).toEqual([['novo-id', true]]);
    await act(async () => {
      liberar();
      await promessa;
    });
    // A consulta traz o doc: não duplica.
    act(() => emitir([doc('novo-id', 'u1', 0)]));
    expect(result.current.desenhos.map(d => d.id)).toEqual(['novo-id']);
  });

  it('se a gravação falhar, o traço otimista some', async () => {
    emitirDocs([]);
    addGridDesenho.mockImplementation(async (_c, _cena, _dados, _ids, { aoCriarLocal }) => {
      aoCriarLocal('x');
      throw new Error('falhou');
    });
    const { result } = renderDesenhos();
    await act(async () => {
      await result.current.desenhar({ cor: '#ffffff', pontos: [0, 0, 1, 1] });
    });
    expect(result.current.desenhos).toEqual([]);
  });
});
