import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  moverGridToken,
  setGridPing,
  subscribeGridCena,
  subscribeGridCenaAtiva,
  subscribeGridPings,
  subscribeGridTokens,
  subscribePersonagem,
} from 'service/storage';
import useGridCampanha from './useGridCampanha';

vi.mock('service/storage', () => ({
  moverGridToken: vi.fn(),
  subscribeGridCena: vi.fn(),
  subscribeGridCenaAtiva: vi.fn(),
  subscribeGridTokens: vi.fn(),
  subscribeGridPings: vi.fn(() => () => {}),
  setGridPing: vi.fn(),
  subscribePersonagem: vi.fn(() => () => {}),
}));
vi.mock('hooks/useMembroDoChat', () => ({ default: vi.fn(() => true) }));

// Timestamp do Firestore (só o que chaveDoMovimento lê).
const horario = segundos => ({ seconds: segundos, nanoseconds: 0 });

const ALDRIC = {
  id: 't1',
  nome: 'Aldric',
  tipo: 'jogador',
  col: 1,
  lin: 1,
  tamanho: 1,
  donos: ['u1'],
  oculto: false,
  movidoEm: horario(1),
  rastro: [
    { col: 0, lin: 1 },
    { col: 1, lin: 1 },
  ],
};
const OGRO = {
  id: 't2',
  nome: 'Ogro',
  tipo: 'criatura',
  col: 4,
  lin: 1,
  tamanho: 2,
  donos: [],
  oculto: false,
};
const SOMBRA = {
  id: 't3',
  nome: 'Sombra',
  tipo: 'criatura',
  col: 6,
  lin: 6,
  tamanho: 1,
  donos: [],
  oculto: true,
};

let emitirTokens;
let mudarCenaAtiva;

const renderGrid = (opcoes = {}) =>
  renderHook(() =>
    useGridCampanha('camp-1', { uid: 'u1', personagemId: 'p1', ...opcoes }),
  );

// Snapshot ao vivo dos tokens da cena.
const emitir = tokens => act(() => emitirTokens(tokens));

const ogroMovido = (segundos = 5) => ({
  ...OGRO,
  col: 7,
  movidoEm: horario(segundos),
  rastro: [
    { col: 4, lin: 1 },
    { col: 7, lin: 1 },
  ],
});

describe('useGridCampanha — rastros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    subscribeGridCenaAtiva.mockImplementation((_campanhaId, onChange) => {
      mudarCenaAtiva = onChange;
      onChange('cena-1');
      return vi.fn();
    });
    subscribeGridCena.mockImplementation((_campanhaId, cenaId, onChange) => {
      onChange({ id: cenaId, nome: cenaId, celula: 50 });
      return vi.fn();
    });
    subscribeGridTokens.mockImplementation(
      (_campanhaId, cenaId, opcoes, onChange) => {
        emitirTokens = onChange;
        if (cenaId === 'cena-1') {
          onChange(
            opcoes.incluirOcultos ? [ALDRIC, OGRO, SOMBRA] : [ALDRIC, OGRO],
          );
        } else onChange([]);
        return vi.fn();
      },
    );
    moverGridToken.mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carga inicial (mesmo com movidoEm) não mostra rastro', () => {
    const { result } = renderGrid();
    expect(result.current.tokens).toHaveLength(2);
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('movimento ao vivo mostra o rastro, esmaece em 8 s e some em 10 s', () => {
    const { result } = renderGrid();
    emitir([ALDRIC, ogroMovido()]);

    expect(result.current.rastrosAtivos).toEqual([
      {
        tokenId: 't2',
        chave: expect.any(String),
        pontos: [
          { col: 4, lin: 1 },
          { col: 7, lin: 1 },
        ],
        saindo: false,
      },
    ]);

    act(() => vi.advanceTimersByTime(7999));
    expect(result.current.rastrosAtivos[0].saindo).toBe(false);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.rastrosAtivos[0].saindo).toBe(true);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('escrita pendente (movidoEm null) não conta como movimento', () => {
    const { result } = renderGrid();
    emitir([ALDRIC, { ...ogroMovido(), movidoEm: null }]);
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('rastro inválido ou que não termina na posição do token é ignorado', () => {
    const { result } = renderGrid();
    emitir([
      ALDRIC,
      {
        ...ogroMovido(),
        rastro: [
          { col: 'x', lin: 1 },
          { col: 7, lin: 1 },
        ],
      },
    ]);
    emitir([ALDRIC, { ...ogroMovido(6), col: 9 }]);
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('próximo movimento substitui o rastro e recomeça os 10 s', () => {
    const { result } = renderGrid();
    emitir([ALDRIC, ogroMovido()]);
    const primeiro = result.current.rastrosAtivos[0].chave;

    act(() => vi.advanceTimersByTime(6000));
    emitir([
      ALDRIC,
      {
        ...OGRO,
        col: 2,
        lin: 5,
        movidoEm: horario(6),
        rastro: [
          { col: 2, lin: 2 },
          { col: 2, lin: 5 },
        ],
      },
    ]);
    const [segundo] = result.current.rastrosAtivos;
    expect(segundo.chave).not.toBe(primeiro);
    expect(segundo.pontos).toEqual([
      { col: 2, lin: 2 },
      { col: 2, lin: 5 },
    ]);

    act(() => vi.advanceTimersByTime(6000));
    expect(result.current.rastrosAtivos).toHaveLength(1);
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('token que muda de lugar sem movimento novo perde o rastro', () => {
    const { result } = renderGrid();
    const movido = ogroMovido();
    emitir([ALDRIC, movido]);
    expect(result.current.rastrosAtivos).toHaveLength(1);

    emitir([ALDRIC, { ...movido, col: 8 }]);
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('trocar de cena limpa os rastros', () => {
    const { result } = renderGrid();
    emitir([ALDRIC, ogroMovido()]);
    expect(result.current.rastrosAtivos).toHaveLength(1);

    act(() => mudarCenaAtiva('cena-2'));
    expect(result.current.cenaId).toBe('cena-2');
    expect(result.current.rastrosAtivos).toEqual([]);
  });

  it('meu movimento aparece na hora e a confirmação do servidor não pisca de novo', async () => {
    const { result } = renderGrid();
    const caminho = [
      { col: 1, lin: 1 },
      { col: 2, lin: 2 },
      { col: 3, lin: 2 },
    ];
    let gravacao;
    act(() => {
      gravacao = result.current.mover(ALDRIC, 3, 2, caminho);
    });
    expect(result.current.rastrosAtivos).toEqual([
      expect.objectContaining({
        tokenId: 't1',
        pontos: caminho,
        saindo: false,
      }),
    ]);
    const { chave } = result.current.rastrosAtivos[0];
    expect(moverGridToken).toHaveBeenCalledWith(
      'camp-1',
      'cena-1',
      't1',
      3,
      2,
      caminho,
    );
    await act(() => gravacao);

    // Snapshot local (pendente) e depois o confirmado.
    const movido = { ...ALDRIC, col: 3, lin: 2, rastro: caminho };
    emitir([{ ...movido, movidoEm: null }, OGRO]);
    emitir([{ ...movido, movidoEm: horario(9) }, OGRO]);
    expect(result.current.rastrosAtivos).toHaveLength(1);
    expect(result.current.rastrosAtivos[0].chave).toBe(chave);
    expect(result.current.erro).toBeNull();
  });

  it('caminho que não liga a origem ao destino vira linha reta', async () => {
    const { result } = renderGrid();
    await act(() =>
      result.current.mover(ALDRIC, 1, 3, [
        { col: 5, lin: 5 },
        { col: 1, lin: 3 },
      ]),
    );
    expect(moverGridToken).toHaveBeenCalledWith(
      'camp-1',
      'cena-1',
      't1',
      1,
      3,
      [
        { col: 1, lin: 1 },
        { col: 1, lin: 3 },
      ],
    );
  });

  it('dois movimentos seguidos (setas) encadeiam o rastro', async () => {
    const { result } = renderGrid();
    await act(() => result.current.mover(ALDRIC, 1, 2));
    await act(() => result.current.mover({ ...ALDRIC, lin: 2 }, 1, 3));

    expect(moverGridToken).toHaveBeenLastCalledWith(
      'camp-1',
      'cena-1',
      't1',
      1,
      3,
      [
        { col: 1, lin: 1 },
        { col: 1, lin: 3 },
      ],
    );
    expect(result.current.rastrosAtivos).toHaveLength(1);
    expect(result.current.rastrosAtivos[0].pontos).toEqual([
      { col: 1, lin: 1 },
      { col: 1, lin: 3 },
    ]);
  });

  it('regra sem rastro (permission-denied): regrava só col/lin, sem erro, e não tenta mais', async () => {
    moverGridToken
      .mockRejectedValueOnce(
        Object.assign(new Error('negado'), { code: 'permission-denied' }),
      )
      .mockResolvedValue();
    const { result } = renderGrid();

    await act(() => result.current.mover(ALDRIC, 1, 2));
    expect(moverGridToken).toHaveBeenCalledTimes(2);
    expect(moverGridToken).toHaveBeenNthCalledWith(
      1,
      'camp-1',
      'cena-1',
      't1',
      1,
      2,
      [
        { col: 1, lin: 1 },
        { col: 1, lin: 2 },
      ],
    );
    expect(moverGridToken).toHaveBeenNthCalledWith(
      2,
      'camp-1',
      'cena-1',
      't1',
      1,
      2,
    );
    expect(result.current.erro).toBeNull();
    // O rastro continua na tela (local).
    expect(result.current.rastrosAtivos).toHaveLength(1);

    await act(() => result.current.mover({ ...ALDRIC, lin: 2 }, 2, 2));
    expect(moverGridToken).toHaveBeenLastCalledWith(
      'camp-1',
      'cena-1',
      't1',
      2,
      2,
    );
  });

  it('falha ao mover apaga o rastro local e mostra o erro', async () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => {});
    moverGridToken.mockRejectedValue(new Error('offline'));
    const { result } = renderGrid();

    await act(() => result.current.mover(ALDRIC, 1, 2));
    expect(result.current.rastrosAtivos).toEqual([]);
    expect(result.current.erro).toBe('Não foi possível mover "Aldric".');
    espiao.mockRestore();
  });

  it('token oculto (mestre): rastro só local, nada de rastro gravado', async () => {
    const { result } = renderGrid({ isMestre: true });
    expect(result.current.tokens).toHaveLength(3);

    await act(() => result.current.mover(SOMBRA, 6, 8));
    expect(moverGridToken).toHaveBeenCalledWith('camp-1', 'cena-1', 't3', 6, 8);
    expect(result.current.rastrosAtivos).toEqual([
      expect.objectContaining({
        tokenId: 't3',
        pontos: [
          { col: 6, lin: 6 },
          { col: 6, lin: 8 },
        ],
      }),
    ]);

    // O snapshot do movimento (sem movidoEm novo) não apaga o rastro local.
    emitir([ALDRIC, OGRO, { ...SOMBRA, lin: 8 }]);
    expect(result.current.rastrosAtivos).toHaveLength(1);
  });

  it('jogador não move token alheio (nem mostra rastro)', async () => {
    const { result } = renderGrid();
    await act(() => result.current.mover(OGRO, 5, 1));
    expect(moverGridToken).not.toHaveBeenCalled();
    expect(result.current.rastrosAtivos).toEqual([]);
  });
});

describe('useGridCampanha — sinais e detalhes dos tokens', () => {
  const ALDRIC_JOGADOR = { ...ALDRIC, refId: 'p1' };
  const OGRO_NPC = {
    ...OGRO,
    pv: { atual: 10, max: 20 },
    mostrarRecursos: 'barra',
  };
  const FICHA = {
    status: { hp: { atual: 4 } },
    statusMaximos: { hp: 8 },
    condicoesAtivas: [{ condicaoId: 'c1', stack: 2 }],
  };
  const CATALOGO = [{ id: 'c1', nome: 'Envenenado' }];
  let emitirPings;

  beforeEach(() => {
    vi.clearAllMocks();
    subscribeGridCenaAtiva.mockImplementation((_campanhaId, onChange) => {
      onChange('cena-1');
      return vi.fn();
    });
    subscribeGridCena.mockImplementation((_campanhaId, cenaId, onChange) => {
      onChange({ id: cenaId, nome: cenaId, celula: 50 });
      return vi.fn();
    });
    subscribeGridTokens.mockImplementation(
      (_campanhaId, _cenaId, _opcoes, onChange) => {
        onChange([ALDRIC_JOGADOR, OGRO_NPC]);
        return vi.fn();
      },
    );
    subscribePersonagem.mockImplementation((_id, onChange) => {
      onChange(FICHA);
      return vi.fn();
    });
    subscribeGridPings.mockImplementation((_campanhaId, _cenaId, onChange) => {
      emitirPings = onChange;
      onChange([]);
      return vi.fn();
    });
    setGridPing.mockResolvedValue();
  });

  it('detalhes: token jogador a partir da ficha ao vivo, npc pelo modo do token', () => {
    const { result } = renderGrid({ catalogoCondicoes: CATALOGO });
    expect(subscribePersonagem).toHaveBeenCalledTimes(1);
    expect(subscribePersonagem).toHaveBeenCalledWith(
      'p1',
      expect.any(Function),
      expect.any(Function),
    );
    expect(result.current.detalhes.t1).toEqual({
      recursos: {
        pv: { atual: 4, max: 8 },
        energia: null,
        fadiga: null,
        numeros: true,
      },
      condicoes: [{ id: 'c1', nome: 'Envenenado', icone: null, stack: 2 }],
    });
    // 'barra': o jogador vê a barra, sem números.
    expect(result.current.detalhes.t2.recursos.numeros).toBe(false);
    expect(result.current.veTudo).toBe(false);
  });

  it('mestre vê os números do npc', () => {
    const { result } = renderGrid({ isMestre: true });
    expect(result.current.detalhes.t2.recursos.numeros).toBe(true);
    expect(result.current.veTudo).toBe(true);
  });

  it('expõe os sinais recebidos e pingar grava o meu', () => {
    const { result } = renderGrid({ nome: 'Aldric', mestreId: 'm1' });
    expect(subscribeGridPings).toHaveBeenCalledWith(
      'camp-1',
      'cena-1',
      expect.any(Function),
      expect.any(Function),
    );
    act(() =>
      emitirPings([
        { uid: 'm1', x: 5, y: 6, puxar: true, criadoEm: horario(3) },
      ]),
    );
    expect(result.current.pings).toEqual([
      expect.objectContaining({
        uid: 'm1',
        x: 5,
        y: 6,
        puxar: true,
        cor: '#e8cb85',
      }),
    ]);

    act(() => {
      result.current.pingar({ x: 10, y: 20, puxar: true });
    });
    // Jogador não puxa a vista.
    expect(setGridPing).toHaveBeenCalledWith('camp-1', 'cena-1', 'u1', {
      x: 10,
      y: 20,
      puxar: false,
      nome: 'Aldric',
    });
  });
});
