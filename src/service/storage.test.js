import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, ...segments) => ({
    __collection: segments.join('/'),
  })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, ...segments) => ({
    __doc: segments.slice(0, -1).join('/'),
    id: segments[segments.length - 1],
  })),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
  query: vi.fn((coll, ...constraints) => ({ __query: coll, constraints })),
  where: vi.fn((field, op, value) => ({ __where: [field, op, value] })),
}));

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  getRmCampanhas,
  addRmCampanha,
  removeRmCampanha,
  updateRmCampanha,
  getUserPermissions,
  getPersonagens,
  getPersonagensJogaveis,
  getPersonagemSubcolecao,
  getAptidao,
  getRaca,
  getClasse,
  getVeiaAstral,
  getCondicoes,
  getRmCampanhaNpcs,
  addRmCampanhaNpc,
  removeRmCampanhaNpc,
  updateRmCampanhaNpc,
  getRmCampanhaJogadores,
  addRmCampanhaJogador,
  removeRmCampanhaJogador,
  updateRmCampanhaJogador,
  getRmCampanhaCriaturas,
  addRmCampanhaCriatura,
  removeRmCampanhaCriatura,
  updateRmCampanhaCriatura,
  getRmMapasPorCampanha,
  addRmMapa,
  removeRmMapa,
  updateRmMapa,
  getRmMissoesPorCampanha,
  addRmMissao,
  removeRmMissao,
  updateRmMissao,
  getCardfluxCartas,
  getRmCardfluxEstadosPorCampanha,
  addRmCardfluxEstado,
  updateRmCardfluxEstado,
  getRmCardfluxExploracoesPorCampanha,
  getRmCardfluxExploracoes,
  addRmCardfluxExploracao,
  removeRmCardfluxExploracao,
  updateRmCardfluxExploracao,
  getRmNotasPorCampanha,
  addRmNota,
  removeRmNota,
  updateRmNota,
  getRmSessaoLogsPorCampanha,
  addRmSessaoLog,
  getRmMusicasBibliotecaPorMestre,
  addRmMusicaBiblioteca,
  removeRmMusicaBiblioteca,
  getRmMusicasPastasPorMestre,
  getRmPlaylistsPorMestre,
  addRmPlaylist,
} from './storage';

describe('storage.js — CRUD de rmCampanhas (padrão Firestore repetido em toda entidade rm*)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRmCampanhas busca a coleção certa e mapeia docs para {id, ...data}', async () => {
    getDocs.mockResolvedValue({
      docs: [
        { id: 'abc', data: () => ({ nome: 'Ascensão Carmesim' }) },
        { id: 'def', data: () => ({ nome: 'Ruínas do Norte' }) },
      ],
    });

    const result = await getRmCampanhas();

    expect(collection).toHaveBeenCalledWith({}, 'rmCampanhas');
    expect(result).toEqual([
      { id: 'abc', nome: 'Ascensão Carmesim' },
      { id: 'def', nome: 'Ruínas do Norte' },
    ]);
  });

  it('addRmCampanha grava com createdAt e retorna o item com o id gerado', async () => {
    addDoc.mockResolvedValue({ id: 'novo-id' });

    const result = await addRmCampanha({ nome: 'Nova Campanha' });

    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCampanhas' },
      { nome: 'Nova Campanha', createdAt: '__serverTimestamp__' },
    );
    expect(result).toEqual({ id: 'novo-id', nome: 'Nova Campanha' });
  });

  it('removeRmCampanha deleta o doc pelo id na coleção certa', async () => {
    await removeRmCampanha('id-123');

    expect(doc).toHaveBeenCalledWith({}, 'rmCampanhas', 'id-123');
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: 'rmCampanhas',
      id: 'id-123',
    });
  });

  it('updateRmCampanha atualiza com updatedAt', async () => {
    await updateRmCampanha('id-123', { nome: 'Campanha Renomeada' });

    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCampanhas', id: 'id-123' },
      { nome: 'Campanha Renomeada', updatedAt: '__serverTimestamp__' },
    );
  });

  it('propaga e loga erros do Firestore em vez de engoli-los silenciosamente', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const firestoreError = new Error('permission-denied');
    getDocs.mockRejectedValue(firestoreError);

    await expect(getRmCampanhas()).rejects.toThrow('permission-denied');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('rmCampanhas'),
      firestoreError,
    );

    consoleError.mockRestore();
  });
});

describe('storage.js — Biblioteca Global de Músicas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRmMusicasBibliotecaPorMestre, getRmMusicasPastasPorMestre e getRmPlaylistsPorMestre consultam pelo mestreId', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getRmMusicasBibliotecaPorMestre('mestre-1');
    await getRmMusicasPastasPorMestre('mestre-1');
    await getRmPlaylistsPorMestre('mestre-1');

    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  it('addRmMusicaBiblioteca normaliza link do YouTube e grava os campos essenciais', async () => {
    addDoc.mockResolvedValue({ id: 'musica-1' });

    await addRmMusicaBiblioteca({
      nome: '  Cavaleiro da Noite  ',
      url: 'https://www.youtube.com/watch?v=abc123DEFgH&list=xxx',
      pastaId: 'pasta-1',
      tags: ['fantasia', ' boss ', 'fantasia'],
      mestreId: 'mestre-1',
    });

    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmMusicasBiblioteca' },
      expect.objectContaining({
        nome: 'Cavaleiro da Noite',
        url: 'https://www.youtube.com/watch?v=abc123DEFgH&list=xxx',
        videoId: 'abc123DEFgH',
        pastaId: 'pasta-1',
        mestreId: 'mestre-1',
        tags: ['fantasia', 'boss'],
        createdAt: '__serverTimestamp__',
      }),
    );
  });

  it('removeRmMusicaBiblioteca remove a referência da música em playlists do mesmo mestre', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'playlist-1',
          data: () => ({
            mestreId: 'mestre-1',
            musicas: [{ musicaId: 'musica-1' }, { musicaId: 'musica-2' }],
          }),
        },
      ],
    });

    await removeRmMusicaBiblioteca('musica-1', 'mestre-1');

    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmPlaylists', id: 'playlist-1' },
      {
        musicas: [{ musicaId: 'musica-2' }],
        updatedAt: '__serverTimestamp__',
      },
    );
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: 'rmMusicasBiblioteca',
      id: 'musica-1',
    });
  });

  it('addRmPlaylist valida referências, preserva link da capa e a ordem das músicas', async () => {
    addDoc.mockResolvedValue({ id: 'playlist-1' });

    await addRmPlaylist({
      nome: 'Campanha do Castelo',
      linkImagem: 'https://exemplo.com/capa-playlist.jpg',
      mestreId: 'mestre-1',
      musicas: [{ musicaId: 'm1', ordem: 0 }, { musicaId: 'm2', ordem: 1 }, { musicaId: '' }],
    });

    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmPlaylists' },
      expect.objectContaining({
        nome: 'Campanha do Castelo',
        linkImagem: 'https://exemplo.com/capa-playlist.jpg',
        mestreId: 'mestre-1',
        musicas: [{ musicaId: 'm1', ordem: 0 }, { musicaId: 'm2', ordem: 1 }],
        createdAt: '__serverTimestamp__',
      }),
    );
  });
});

describe('storage.js — personagens (somente leitura) e CRUD de rmCampanhaNpcs/rmCampanhaJogadores/rmCampanhaCriaturas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPersonagens busca só tipo NPC/Criatura (list falha inteira se a query puder incluir uma ficha privada de outro usuário)', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getPersonagens();

    expect(collection).toHaveBeenCalledWith({}, 'personagens');
    expect(where).toHaveBeenCalledWith('tipo', 'in', ['NPC', 'Criatura']);
    expect(getDocs).toHaveBeenCalledWith(
      expect.objectContaining({
        __query: { __collection: 'personagens' },
        constraints: [{ __where: ['tipo', 'in', ['NPC', 'Criatura']] }],
      }),
    );
  });

  it('getPersonagensJogaveis busca só tipo Personagem Jogável', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getPersonagensJogaveis();

    expect(collection).toHaveBeenCalledWith({}, 'personagens');
    expect(where).toHaveBeenCalledWith('tipo', 'in', ['Personagem Jogável']);
  });

  it('getPersonagemSubcolecao busca a subcoleção certa dentro do personagem', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getPersonagemSubcolecao('p1', 'aptidoesAdquiridas');

    expect(collection).toHaveBeenCalledWith(
      {},
      'personagens',
      'p1',
      'aptidoesAdquiridas',
    );
  });

  it('rmCampanhaNpcs: get/add/remove/update usam a subcoleção "rmCampanhas/{campanhaId}/npcs"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'npc-1' });

    await getRmCampanhaNpcs('c1', 'u1', 'mestre-1');
    await addRmCampanhaNpc('c1', { nome: 'Grumnak' });
    await removeRmCampanhaNpc('c1', 'npc-1');
    await updateRmCampanhaNpc('c1', 'npc-1', { nome: 'Grumnak, o Orc' });

    expect(collection).toHaveBeenCalledWith({}, 'rmCampanhas', 'c1', 'npcs');
    expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCampanhas/c1/npcs' },
      { nome: 'Grumnak', createdAt: '__serverTimestamp__' },
    );
    expect(doc).toHaveBeenCalledWith({}, 'rmCampanhas', 'c1', 'npcs', 'npc-1');
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: 'rmCampanhas/c1/npcs',
      id: 'npc-1',
    });
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCampanhas/c1/npcs', id: 'npc-1' },
      { nome: 'Grumnak, o Orc', updatedAt: '__serverTimestamp__' },
    );
  });

  it('rmCampanhaJogadores: get/add/remove/update usam a subcoleção "rmCampanhas/{campanhaId}/jogadores"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'jogador-1' });

    await getRmCampanhaJogadores('c1', 'u1', 'mestre-1');
    await addRmCampanhaJogador('c1', { nome: 'Lyra' });
    await removeRmCampanhaJogador('c1', 'jogador-1');
    await updateRmCampanhaJogador('c1', 'jogador-1', {
      nome: 'Lyra, a Cartomante',
    });

    expect(collection).toHaveBeenCalledWith(
      {},
      'rmCampanhas',
      'c1',
      'jogadores',
    );
    expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCampanhas/c1/jogadores' },
      { nome: 'Lyra', createdAt: '__serverTimestamp__' },
    );
    expect(doc).toHaveBeenCalledWith(
      {},
      'rmCampanhas',
      'c1',
      'jogadores',
      'jogador-1',
    );
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: 'rmCampanhas/c1/jogadores',
      id: 'jogador-1',
    });
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCampanhas/c1/jogadores', id: 'jogador-1' },
      { nome: 'Lyra, a Cartomante', updatedAt: '__serverTimestamp__' },
    );
  });

  it('rmCampanhaCriaturas: get/add/remove/update usam a subcoleção "rmCampanhas/{campanhaId}/criaturas"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'criatura-1' });

    await getRmCampanhaCriaturas('c1', 'u1', 'mestre-1');
    await addRmCampanhaCriatura('c1', { nome: 'Fera das Sombras' });
    await removeRmCampanhaCriatura('c1', 'criatura-1');
    await updateRmCampanhaCriatura('c1', 'criatura-1', {
      nome: 'Fera Sombria',
    });

    expect(collection).toHaveBeenCalledWith(
      {},
      'rmCampanhas',
      'c1',
      'criaturas',
    );
    expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCampanhas/c1/criaturas' },
      { nome: 'Fera das Sombras', createdAt: '__serverTimestamp__' },
    );
    expect(doc).toHaveBeenCalledWith(
      {},
      'rmCampanhas',
      'c1',
      'criaturas',
      'criatura-1',
    );
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: 'rmCampanhas/c1/criaturas',
      id: 'criatura-1',
    });
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCampanhas/c1/criaturas', id: 'criatura-1' },
      { nome: 'Fera Sombria', updatedAt: '__serverTimestamp__' },
    );
  });
});

describe.each([
  {
    colecao: 'rmMapas',
    add: addRmMapa,
    remove: removeRmMapa,
    update: updateRmMapa,
  },
  {
    colecao: 'rmMissoes',
    add: addRmMissao,
    remove: removeRmMissao,
    update: updateRmMissao,
  },
  {
    colecao: 'rmNotas',
    add: addRmNota,
    remove: removeRmNota,
    update: updateRmNota,
  },
])('storage.js — CRUD de $colecao (M6)', ({ colecao, add, remove, update }) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`add grava na coleção "${colecao}" com createdAt`, async () => {
    addDoc.mockResolvedValue({ id: 'novo-id' });

    await add({ nome: 'Item' });

    expect(addDoc).toHaveBeenCalledWith(
      { __collection: colecao },
      { nome: 'Item', createdAt: '__serverTimestamp__' },
    );
  });

  it(`remove deleta o doc pelo id na coleção "${colecao}"`, async () => {
    await remove('id-123');

    expect(doc).toHaveBeenCalledWith({}, colecao, 'id-123');
    expect(deleteDoc).toHaveBeenCalledWith({ __doc: colecao, id: 'id-123' });
  });

  it(`update atualiza com updatedAt na coleção "${colecao}"`, async () => {
    await update('id-123', { nome: 'Renomeado' });

    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: colecao, id: 'id-123' },
      { nome: 'Renomeado', updatedAt: '__serverTimestamp__' },
    );
  });
});

describe.each([
  { colecao: 'rmMapas', get: getRmMapasPorCampanha },
  { colecao: 'rmMissoes', get: getRmMissoesPorCampanha },
  { colecao: 'rmNotas', get: getRmNotasPorCampanha },
])(
  'storage.js — $colecaoPorCampanha filtra por campanhaId/universoId/mestreId via query/where',
  ({ colecao, get }) => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    // As três dimensões precisam estar na query (não só campanhaId): a
    // regra de segurança lê `universoId`/`mestreId` do documento, e uma
    // query de "list" só passa nas Firestore Rules se o próprio `where()`
    // já garantir isso para qualquer documento que a query pudesse
    // retornar — sem os três filtros, o Firestore nega o pedido inteiro
    // pra qualquer usuário não-admin.
    it(`busca a coleção "${colecao}" com where em campanhaId, universoId e mestreId`, async () => {
      getDocs.mockResolvedValue({ docs: [] });

      await get('c1', 'u1', 'mestre-1');

      expect(collection).toHaveBeenCalledWith({}, colecao);
      expect(where).toHaveBeenCalledWith('campanhaId', '==', 'c1');
      expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
      expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
      expect(getDocs).toHaveBeenCalledWith(
        expect.objectContaining({
          __query: { __collection: colecao },
          constraints: [
            { __where: ['campanhaId', '==', 'c1'] },
            { __where: ['universoId', '==', 'u1'] },
            { __where: ['mestreId', '==', 'mestre-1'] },
          ],
        }),
      );
    });
  },
);

describe('storage.js — cardflux (somente leitura) e CRUD de rmCardfluxEstados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCardfluxCartas busca a coleção "cardflux" filtrada por universo', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getCardfluxCartas('u1');

    expect(collection).toHaveBeenCalledWith({}, 'cardflux');
    expect(where).toHaveBeenCalledWith('universo', '==', 'u1');
    expect(getDocs).toHaveBeenCalledWith(
      expect.objectContaining({
        __query: { __collection: 'cardflux' },
        constraints: [{ __where: ['universo', '==', 'u1'] }],
      }),
    );
  });

  it('rmCardfluxEstados: get/add/update usam a coleção "rmCardfluxEstados"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'estado-1' });

    await getRmCardfluxEstadosPorCampanha('c1', 'u1', 'mestre-1');
    await addRmCardfluxEstado({
      campanhaId: 'c1',
      cartaId: 'carta-1',
      estadoNoBaralho: 'comprada',
    });
    await updateRmCardfluxEstado('estado-1', { estadoNoBaralho: 'descartada' });

    expect(collection).toHaveBeenCalledWith({}, 'rmCardfluxEstados');
    expect(where).toHaveBeenCalledWith('campanhaId', '==', 'c1');
    expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCardfluxEstados' },
      {
        campanhaId: 'c1',
        cartaId: 'carta-1',
        estadoNoBaralho: 'comprada',
        createdAt: '__serverTimestamp__',
      },
    );
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCardfluxEstados', id: 'estado-1' },
      { estadoNoBaralho: 'descartada', updatedAt: '__serverTimestamp__' },
    );
  });

  it('rmCardfluxExploracoes: get/add/remove/update usam a coleção "rmCardfluxExploracoes"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'exploracao-1' });

    await getRmCardfluxExploracoesPorCampanha('c1', 'u1', 'mestre-1');
    await getRmCardfluxExploracoes('u1', 'mestre-1');
    const salvo = await addRmCardfluxExploracao({
      id: 'exp-1791774466839-4a66a3',
      nome: 'Floresta',
      campanhaId: 'c1',
      mestreId: 'mestre-1',
      universoId: 'u1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 50,
      modo: 'predefinida',
      quadrantes: [[{ estado: 'oculto' }]],
    });
    await removeRmCardfluxExploracao('exploracao-1');
    await updateRmCardfluxExploracao('exploracao-1', { status: 'encerrada' });

    expect(salvo.id).toBe('exploracao-1');
    expect(salvo.id).not.toBe('exp-1791774466839-4a66a3');
    expect(collection).toHaveBeenCalledWith({}, 'rmCardfluxExploracoes');
    expect(where).toHaveBeenCalledWith('campanhaId', '==', 'c1');
    expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCardfluxExploracoes' },
      {
        nome: 'Floresta',
        campanhaId: 'c1',
        mestreId: 'mestre-1',
        universoId: 'u1',
        baralhos: ['D1'],
        linhas: 2,
        colunas: 2,
        densidade: 50,
        modo: 'predefinida',
        quadrantes: [
          {
            id: '0-0',
            linha: 0,
            coluna: 0,
            x: 0,
            y: 0,
            estado: 'oculto',
            cartaId: null,
            resultado: null,
            observacao: '',
            anotacao: '',
            historico: [],
            revelaEm: null,
            fixo: false,
            bloqueado: false,
            comum: false,
          },
        ],
        createdAt: '__serverTimestamp__',
      },
    );
    expect(deleteDoc).toHaveBeenCalledWith({
      __doc: 'rmCardfluxExploracoes',
      id: 'exploracao-1',
    });
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCardfluxExploracoes', id: 'exploracao-1' },
      { status: 'encerrada', updatedAt: '__serverTimestamp__' },
    );
  });

  it('rmCardfluxExploracoes: mantém a identidade do documento Firestore em create, load e update', async () => {
    addDoc.mockResolvedValue({ id: 'firestore-doc-id-123' });
    getDocs.mockResolvedValue({
      docs: [{ id: 'firestore-doc-id-123', data: () => ({ nome: 'Floresta', status: 'ativa' }) }],
    });

    const salvo = await addRmCardfluxExploracao({
      id: 'exp-1791774466839-4a66a3',
      nome: 'Floresta',
      campanhaId: 'c1',
      mestreId: 'mestre-1',
      universoId: 'u1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 50,
      modo: 'predefinida',
      quadrantes: [[{ estado: 'oculto' }]],
    });

    const carregadas = await getRmCardfluxExploracoesPorCampanha('c1', 'u1', 'mestre-1');

    await updateRmCardfluxExploracao(salvo.id, { status: 'encerrada' });

    expect(salvo.id).toBe('firestore-doc-id-123');
    expect(salvo.id).not.toBe('exp-1791774466839-4a66a3');
    expect(carregadas[0].id).toBe('firestore-doc-id-123');
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCardfluxExploracoes', id: 'firestore-doc-id-123' },
      { status: 'encerrada', updatedAt: '__serverTimestamp__' },
    );
  });

  it('rmCardfluxExploracoes: prioriza o id real do documento mesmo quando o payload legado possui um id de campo', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'doc-real-456',
          data: () => ({
            id: 'id-velho-da-colecao',
            nome: 'Floresta',
            status: 'ativa',
            campanhaId: 'c1',
            universoId: 'u1',
            mestreId: 'mestre-1',
          }),
        },
      ],
    });

    const itens = await getRmCardfluxExploracoesPorCampanha('c1', 'u1', 'mestre-1');

    expect(itens[0].id).toBe('doc-real-456');
    expect(itens[0].id).not.toBe('id-velho-da-colecao');
  });
});

describe('storage.js — getUserPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna isAdmin/universos padrão quando o documento não existe', async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    const result = await getUserPermissions('uid-sem-doc');

    expect(result).toEqual({ isAdmin: false, universos: [] });
  });

  it('retorna isAdmin/universos do documento quando ele existe', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ isAdmin: true, universos: ['universo-1'] }),
    });

    const result = await getUserPermissions('uid-admin');

    expect(result).toEqual({ isAdmin: true, universos: ['universo-1'] });
  });

  it('normaliza universos ausente/inválido para array vazio', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ isAdmin: false }),
    });

    const result = await getUserPermissions('uid-sem-universos');

    expect(result).toEqual({ isAdmin: false, universos: [] });
  });
});

describe.each([
  ['getAptidao', getAptidao, 'aptidoes'],
  ['getRaca', getRaca, 'racas'],
  ['getClasse', getClasse, 'classes'],
  ['getVeiaAstral', getVeiaAstral, 'veiasAstrais'],
])('storage.js — %s', (nomeFuncao, getFuncao, colecao) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`busca o doc na coleção "${colecao}" e retorna {id, ...data}`, async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'ref-1',
      data: () => ({ nome: 'Nome de Referência' }),
    });

    const result = await getFuncao('ref-1');

    expect(doc).toHaveBeenCalledWith({}, colecao, 'ref-1');
    expect(result).toEqual({ id: 'ref-1', nome: 'Nome de Referência' });
  });

  it('retorna null quando o doc não existe', async () => {
    getDoc.mockResolvedValue({ exists: () => false });

    const result = await getFuncao('ref-inexistente');

    expect(result).toBeNull();
  });
});

describe('storage.js — getCondicoes (busca por universos-lista + universo-singular, mescladas por id)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca a coleção "condicoes" pelos dois campos e mescla os docs sem duplicar', async () => {
    getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'atordoado',
            data: () => ({ nome: 'Atordoado', universos: ['u1'] }),
          },
          {
            id: 'envenenado',
            data: () => ({ nome: 'Envenenado', universos: ['u1', 'u2'] }),
          },
        ],
      })
      .mockResolvedValueOnce({
        docs: [
          // Doc legado (só `universo`) e um repetido (já veio pela lista) —
          // não deve aparecer duplicado no resultado final.
          {
            id: 'sangrando',
            data: () => ({ nome: 'Sangrando', universo: 'u1' }),
          },
          {
            id: 'atordoado',
            data: () => ({ nome: 'Atordoado', universos: ['u1'] }),
          },
        ],
      });

    const result = await getCondicoes('u1');

    expect(where).toHaveBeenCalledWith('universos', 'array-contains', 'u1');
    expect(where).toHaveBeenCalledWith('universo', '==', 'u1');
    expect(result).toHaveLength(3);
    expect(result.map(c => c.id).sort()).toEqual([
      'atordoado',
      'envenenado',
      'sangrando',
    ]);
  });
});

describe('storage.js — rmSessaoLogs (registro cronológico automático, append-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getRmSessaoLogsPorCampanha busca "rmSessaoLogs" filtrado por campanhaId/universoId/mestreId', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getRmSessaoLogsPorCampanha('c1', 'u1', 'mestre-1');

    expect(collection).toHaveBeenCalledWith({}, 'rmSessaoLogs');
    expect(where).toHaveBeenCalledWith('campanhaId', '==', 'c1');
    expect(where).toHaveBeenCalledWith('universoId', '==', 'u1');
    expect(where).toHaveBeenCalledWith('mestreId', '==', 'mestre-1');
  });

  it('addRmSessaoLog grava na coleção "rmSessaoLogs" com createdAt', async () => {
    addDoc.mockResolvedValue({ id: 'log-1' });

    await addRmSessaoLog({
      campanhaId: 'c1',
      tipo: 'cena_atual',
      mensagem: 'x',
    });

    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmSessaoLogs' },
      {
        campanhaId: 'c1',
        tipo: 'cena_atual',
        mensagem: 'x',
        createdAt: '__serverTimestamp__',
      },
    );
  });
});
