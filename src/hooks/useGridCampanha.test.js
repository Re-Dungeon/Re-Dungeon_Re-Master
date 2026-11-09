import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import {
  alterarGridCombate,
  moverGridToken,
  setGridPing,
  subscribeGridCena,
  subscribeGridCenaAtiva,
  addGridDesenho,
  setGridCamada,
  subscribeGridCamadas,
  subscribeGridCombate,
  subscribeGridAreas,
  subscribeGridDesenhos,
  removeGridAreas,
  subscribeGridMarcadores,
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
  subscribeGridCombate: vi.fn(() => () => {}),
  alterarGridCombate: vi.fn(),
  subscribeGridCamadas: vi.fn(() => () => {}),
  setGridCamada: vi.fn(() => Promise.resolve()),
  subscribeGridMarcadores: vi.fn(() => () => {}),
  addGridMarcador: vi.fn(() => Promise.resolve('m1')),
  updateGridMarcador: vi.fn(() => Promise.resolve()),
  removeGridMarcador: vi.fn(() => Promise.resolve()),
  subscribeGridDesenhos: vi.fn(() => () => {}),
  addGridDesenho: vi.fn(() => Promise.resolve('d1')),
  removeGridDesenhos: vi.fn(() => Promise.resolve()),
  subscribeGridAreas: vi.fn(() => () => {}),
  addGridArea: vi.fn(() => Promise.resolve()),
  updateGridArea: vi.fn(() => Promise.resolve()),
  removeGridArea: vi.fn(() => Promise.resolve()),
  removeGridAreas: vi.fn(() => Promise.resolve()),
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
    subscribeGridTokens.mockImplementation((_campanhaId, cenaId, opcoes, onChange) => {
      emitirTokens = onChange;
      if (cenaId === 'cena-1') {
        onChange(opcoes.incluirOcultos ? [ALDRIC, OGRO, SOMBRA] : [ALDRIC, OGRO]);
      } else onChange([]);
      return vi.fn();
    });
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
      expect.objectContaining({ tokenId: 't1', pontos: caminho, saindo: false }),
    ]);
    const { chave } = result.current.rastrosAtivos[0];
    expect(moverGridToken).toHaveBeenCalledWith('camp-1', 'cena-1', 't1', 3, 2, caminho);
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
    expect(moverGridToken).toHaveBeenCalledWith('camp-1', 'cena-1', 't1', 1, 3, [
      { col: 1, lin: 1 },
      { col: 1, lin: 3 },
    ]);
  });

  it('dois movimentos seguidos (setas) encadeiam o rastro', async () => {
    const { result } = renderGrid();
    await act(() => result.current.mover(ALDRIC, 1, 2));
    await act(() => result.current.mover({ ...ALDRIC, lin: 2 }, 1, 3));

    expect(moverGridToken).toHaveBeenLastCalledWith('camp-1', 'cena-1', 't1', 1, 3, [
      { col: 1, lin: 1 },
      { col: 1, lin: 3 },
    ]);
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
    expect(moverGridToken).toHaveBeenNthCalledWith(1, 'camp-1', 'cena-1', 't1', 1, 2, [
      { col: 1, lin: 1 },
      { col: 1, lin: 2 },
    ]);
    expect(moverGridToken).toHaveBeenNthCalledWith(2, 'camp-1', 'cena-1', 't1', 1, 2);
    expect(result.current.erro).toBeNull();
    // O rastro continua na tela (local).
    expect(result.current.rastrosAtivos).toHaveLength(1);

    await act(() => result.current.mover({ ...ALDRIC, lin: 2 }, 2, 2));
    expect(moverGridToken).toHaveBeenLastCalledWith('camp-1', 'cena-1', 't1', 2, 2);
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
  const OGRO_NPC = { ...OGRO, pv: { atual: 10, max: 20 }, mostrarRecursos: 'barra' };
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
    subscribeGridTokens.mockImplementation((_campanhaId, _cenaId, _opcoes, onChange) => {
      onChange([ALDRIC_JOGADOR, OGRO_NPC]);
      return vi.fn();
    });
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
      recursos: { pv: { atual: 4, max: 8 }, energia: null, fadiga: null, numeros: true },
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
      emitirPings([{ uid: 'm1', x: 5, y: 6, puxar: true, criadoEm: horario(3) }]),
    );
    expect(result.current.pings).toEqual([
      expect.objectContaining({ uid: 'm1', x: 5, y: 6, puxar: true, cor: '#e8cb85' }),
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

describe('useGridCampanha — combate e travamento', () => {
  const BRINA = {
    ...OGRO,
    id: 't4',
    nome: 'Brina',
    tipo: 'jogador',
    donos: ['u1'],
    col: 9,
  };
  const ALDRIC_JOGADOR = { ...ALDRIC, refId: 'p1' };
  const FICHA = { uid: 'u1', prontidaoAtual: 12, prontidaoMaximaEfetiva: 30 };
  let cena;
  let combateDoc;

  beforeEach(() => {
    vi.clearAllMocks();
    cena = { nome: 'Arena', celula: 50 };
    combateDoc = null;
    subscribeGridCenaAtiva.mockImplementation((_campanhaId, onChange) => {
      onChange('cena-1');
      return vi.fn();
    });
    subscribeGridCena.mockImplementation((_campanhaId, cenaId, onChange) => {
      onChange({ id: cenaId, ...cena });
      return vi.fn();
    });
    subscribeGridTokens.mockImplementation((_campanhaId, _cenaId, _opcoes, onChange) => {
      onChange([ALDRIC_JOGADOR, OGRO, BRINA]);
      return vi.fn();
    });
    subscribePersonagem.mockImplementation((_id, onChange) => {
      onChange(FICHA);
      return vi.fn();
    });
    subscribeGridPings.mockImplementation(() => vi.fn());
    subscribeGridCombate.mockImplementation((_campanhaId, _cenaId, onChange) => {
      onChange(combateDoc);
      return vi.fn();
    });
    alterarGridCombate.mockResolvedValue(true);
  });

  const emCombate = indice => ({
    ordem: [
      { tokenId: 't1', iniciativa: 20, d20: 15, reacao: 5 },
      { tokenId: 't2', iniciativa: 10, d20: 8, reacao: 2 },
    ],
    indice,
    rodada: 1,
    inicioTurno: null,
    turnoEm: horario(2),
  });

  it('sem combate e livre: move os próprios tokens; congelado: nenhum', () => {
    const { result } = renderGrid();
    expect(result.current.travamento).toBe('livre');
    expect(result.current.combate).toBeNull();
    expect(result.current.podeMover(ALDRIC_JOGADOR)).toBe(true);
    expect(result.current.podeMover(OGRO)).toBe(false);

    cena = { ...cena, travamento: 'congelado' };
    const congelado = renderGrid();
    expect(congelado.result.current.travamento).toBe('congelado');
    expect(congelado.result.current.podeMover(ALDRIC_JOGADOR)).toBe(false);
    expect(renderGrid({ isMestre: true }).result.current.podeMover(OGRO)).toBe(true);
  });

  it('"só na sua vez": em combate, só o token da vez; fora de combate, livre', () => {
    cena = { ...cena, travamento: 'turno' };
    expect(renderGrid().result.current.podeMover(BRINA)).toBe(true);

    combateDoc = emCombate(0);
    const { result } = renderGrid();
    expect(result.current.podeMover(ALDRIC_JOGADOR)).toBe(true);
    // Token meu fora da vez (nem participa): parado.
    expect(result.current.podeMover(BRINA)).toBe(false);

    combateDoc = emCombate(1);
    expect(renderGrid().result.current.podeMover(ALDRIC_JOGADOR)).toBe(false);
  });

  it('expõe combate, token da vez, meuTurno, fichas e o PP no detalhe do dono', async () => {
    combateDoc = emCombate(0);
    const autor = { uid: 'u1', personagemId: 'p1', autorNome: 'Aldric', isMestre: false };
    const { result } = renderGrid({ autorCombate: autor });
    expect(result.current.combate).toMatchObject({ indice: 0, tokenDaVezId: 't1' });
    expect(result.current.tokenDaVez.id).toBe('t1');
    expect(result.current.meuTurno).toBe(true);
    expect(result.current.fichas).toEqual({ p1: FICHA });
    expect(result.current.detalhes.t1.pp).toEqual({ atual: 12, max: 30 });

    await act(async () => {
      await result.current.encerrarTurno();
    });
    const calcular = alterarGridCombate.mock.calls[0][2];
    expect(alterarGridCombate.mock.calls[0].slice(0, 2)).toEqual(['camp-1', 'cena-1']);
    expect(calcular(emCombate(0))).toMatchObject({
      patch: { indice: 1 },
      mensagem: { autorNome: 'Aldric', combate: { evento: 'turno', nome: 'Ogro' } },
    });
  });
});

describe('useGridCampanha — mapa (Fase 3B)', () => {
  const PAREDE = { trechos: '1:2' }; // célula col 2, lin 1

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
    subscribeGridTokens.mockImplementation((_campanhaId, _cenaId, _opcoes, onChange) => {
      onChange([ALDRIC]);
      return vi.fn();
    });
    subscribeGridCamadas.mockImplementation((_campanhaId, _cenaId, onChange) => {
      onChange({ paredes: PAREDE, nevoa: { ativa: true, trechos: '0:0' } });
      return vi.fn();
    });
    subscribeGridMarcadores.mockImplementation(
      (_campanhaId, _cenaId, _opcoes, onChange) => {
        onChange([
          { id: 'm1', col: 1, lin: 1, icone: 'porta', cor: '#ffffff', titulo: 'Porta' },
        ]);
        return vi.fn();
      },
    );
    subscribeGridDesenhos.mockImplementation((_campanhaId, _cenaId, onChange) => {
      onChange([{ id: 'd1', uid: 'u1', cor: '#ffffff', pontos: [0, 0, 5, 5] }]);
      return vi.fn();
    });
    moverGridToken.mockResolvedValue();
  });

  it('expõe camadas, marcadores e desenhos; apagarTodos só para o mestre', () => {
    const { result } = renderGrid();
    expect(result.current.camadas.bloqueadas.has('2,1')).toBe(true);
    expect(result.current.camadas.nevoa.ativa).toBe(true);
    expect(result.current.camadas.nevoa.reveladas.has('0,0')).toBe(true);
    expect(result.current.marcadores).toHaveLength(1);
    expect(result.current.desenhos[0]).toMatchObject({ id: 'd1', proprio: true });
    expect(result.current.apagarTodosDesenhos).toBeUndefined();
    expect(subscribeGridMarcadores).toHaveBeenCalledWith(
      'camp-1',
      'cena-1',
      { incluirSecretos: false },
      expect.any(Function),
      expect.any(Function),
    );
    expect(renderGrid({ isMestre: true }).result.current.apagarTodosDesenhos).toEqual(
      expect.any(Function),
    );
  });

  it('expõe as áreas da cena e as ações; removerTodas só para o mestre', async () => {
    subscribeGridAreas.mockImplementation((_campanhaId, _cenaId, onChange) => {
      onChange([
        {
          id: 'a1',
          uid: 'u1',
          forma: 'raio',
          origem: { col: 2, lin: 2 },
          metros: 3,
          cor: '#e05555',
        },
      ]);
      return vi.fn();
    });
    const { result } = renderGrid();
    expect(subscribeGridAreas).toHaveBeenCalledWith(
      'camp-1',
      'cena-1',
      expect.any(Function),
      expect.any(Function),
    );
    expect(result.current.areas).toHaveLength(1);
    expect(result.current.areas[0]).toMatchObject({ id: 'a1', forma: 'raio', alvo: null });
    expect(result.current.acoesAreas.criar).toEqual(expect.any(Function));
    await act(() => result.current.acoesAreas.removerTodas());
    expect(removeGridAreas).not.toHaveBeenCalled();
    const mestre = renderGrid({ isMestre: true }).result;
    await act(() => mestre.current.acoesAreas.removerTodas());
    expect(removeGridAreas).toHaveBeenCalledWith('camp-1', 'cena-1', ['a1']);
  });

  it('mover: parede no caminho barra o jogador e não o mestre', async () => {
    const caminho = [
      { col: 1, lin: 1 },
      { col: 2, lin: 1 },
    ];
    const jogador = renderGrid().result;
    await act(() => jogador.current.mover(ALDRIC, 2, 1, caminho));
    expect(moverGridToken).not.toHaveBeenCalled();
    // Caminho livre (contorna a parede): grava.
    await act(() =>
      jogador.current.mover(ALDRIC, 1, 2, [
        { col: 1, lin: 1 },
        { col: 1, lin: 2 },
      ]),
    );
    expect(moverGridToken).toHaveBeenCalledTimes(1);

    const mestre = renderGrid({ isMestre: true }).result;
    await act(() => mestre.current.mover(ALDRIC, 2, 1, caminho));
    expect(moverGridToken).toHaveBeenCalledTimes(2);
  });

  it('desenhar e editarCamada chegam ao storage; permission-denied do jogador é silencioso', async () => {
    const mestre = renderGrid({ isMestre: true }).result;
    await act(() => mestre.current.desenhar({ cor: '#ffffff', pontos: [0, 0, 9, 9] }));
    expect(addGridDesenho).toHaveBeenCalledWith(
      'camp-1',
      'cena-1',
      { uid: 'u1', cor: '#ffffff', pontos: [0, 0, 9, 9] },
      [],
    );
    await act(() =>
      mestre.current.editarCamada('paredes', 'adicionar', [{ col: 3, lin: 1 }]),
    );
    expect(setGridCamada).toHaveBeenCalledWith('camp-1', 'cena-1', 'paredes', {
      trechos: '1:2-3',
    });

    const jogador = renderGrid().result;
    const aoFalhar = subscribeGridDesenhos.mock.calls.at(-1)[3];
    act(() => aoFalhar({ code: 'permission-denied' }));
    expect(jogador.current.erro).toBeNull();
  });
});
