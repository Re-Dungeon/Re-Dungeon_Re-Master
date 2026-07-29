import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db, name) => ({ __collection: name })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn((_db, name, id) => ({ __doc: name, id })),
  updateDoc: vi.fn(),
  serverTimestamp: vi.fn(() => '__serverTimestamp__'),
}));

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  getRmCampanhas,
  addRmCampanha,
  removeRmCampanha,
  updateRmCampanha,
  getUserPermissions,
  getPersonagens,
  getRmNpcs,
  addRmNpc,
  removeRmNpc,
  updateRmNpc,
  getRmCriaturas,
  addRmCriatura,
  removeRmCriatura,
  updateRmCriatura,
  getRmMapas,
  addRmMapa,
  removeRmMapa,
  updateRmMapa,
  getRmMissoes,
  addRmMissao,
  removeRmMissao,
  updateRmMissao,
  getRmCardfluxBaralhos,
  addRmCardfluxBaralho,
  removeRmCardfluxBaralho,
  updateRmCardfluxBaralho,
  getRmCardfluxCartas,
  addRmCardfluxCarta,
  removeRmCardfluxCarta,
  updateRmCardfluxCarta,
  getRmNotas,
  addRmNota,
  removeRmNota,
  updateRmNota,
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

describe('storage.js — personagens (somente leitura) e CRUD de rmNpcs/rmCriaturas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPersonagens busca a coleção "personagens"', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await getPersonagens();

    expect(collection).toHaveBeenCalledWith({}, 'personagens');
  });

  it('rmNpcs: get/add/remove/update usam a coleção "rmNpcs"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'npc-1' });

    await getRmNpcs();
    await addRmNpc({ nome: 'Grumnak' });
    await removeRmNpc('npc-1');
    await updateRmNpc('npc-1', { nome: 'Grumnak, o Orc' });

    expect(collection).toHaveBeenCalledWith({}, 'rmNpcs');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmNpcs' },
      { nome: 'Grumnak', createdAt: '__serverTimestamp__' },
    );
    expect(doc).toHaveBeenCalledWith({}, 'rmNpcs', 'npc-1');
    expect(deleteDoc).toHaveBeenCalledWith({ __doc: 'rmNpcs', id: 'npc-1' });
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmNpcs', id: 'npc-1' },
      { nome: 'Grumnak, o Orc', updatedAt: '__serverTimestamp__' },
    );
  });

  it('rmCriaturas: get/add/remove/update usam a coleção "rmCriaturas"', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    addDoc.mockResolvedValue({ id: 'criatura-1' });

    await getRmCriaturas();
    await addRmCriatura({ nome: 'Fera das Sombras' });
    await removeRmCriatura('criatura-1');
    await updateRmCriatura('criatura-1', { nome: 'Fera Sombria' });

    expect(collection).toHaveBeenCalledWith({}, 'rmCriaturas');
    expect(addDoc).toHaveBeenCalledWith(
      { __collection: 'rmCriaturas' },
      { nome: 'Fera das Sombras', createdAt: '__serverTimestamp__' },
    );
    expect(doc).toHaveBeenCalledWith({}, 'rmCriaturas', 'criatura-1');
    expect(deleteDoc).toHaveBeenCalledWith({ __doc: 'rmCriaturas', id: 'criatura-1' });
    expect(updateDoc).toHaveBeenCalledWith(
      { __doc: 'rmCriaturas', id: 'criatura-1' },
      { nome: 'Fera Sombria', updatedAt: '__serverTimestamp__' },
    );
  });
});

describe.each([
  {
    colecao: 'rmMapas',
    get: getRmMapas,
    add: addRmMapa,
    remove: removeRmMapa,
    update: updateRmMapa,
  },
  {
    colecao: 'rmMissoes',
    get: getRmMissoes,
    add: addRmMissao,
    remove: removeRmMissao,
    update: updateRmMissao,
  },
  {
    colecao: 'rmCardfluxBaralhos',
    get: getRmCardfluxBaralhos,
    add: addRmCardfluxBaralho,
    remove: removeRmCardfluxBaralho,
    update: updateRmCardfluxBaralho,
  },
  {
    colecao: 'rmCardfluxCartas',
    get: getRmCardfluxCartas,
    add: addRmCardfluxCarta,
    remove: removeRmCardfluxCarta,
    update: updateRmCardfluxCarta,
  },
  {
    colecao: 'rmNotas',
    get: getRmNotas,
    add: addRmNota,
    remove: removeRmNota,
    update: updateRmNota,
  },
])('storage.js — CRUD de $colecao (M6)', ({ colecao, get, add, remove, update }) => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`get busca a coleção "${colecao}"`, async () => {
    getDocs.mockResolvedValue({ docs: [] });

    await get();

    expect(collection).toHaveBeenCalledWith({}, colecao);
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
