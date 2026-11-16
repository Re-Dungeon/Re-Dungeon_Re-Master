import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addDoc, deleteDoc, getDocs, updateDoc } from 'firebase/firestore';

vi.mock('./firebase', () => ({ auth: { currentUser: null }, db: {} }));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((_db, ...segmentos) => ({ path: segmentos.join('/') })),
    doc: vi.fn((_db, ...segmentos) => ({ path: segmentos.join('/') })),
    query: vi.fn((ref, ...restricoes) => ({ ref, restricoes })),
    where: vi.fn((campo, op, valor) => ({ campo, op, valor })),
    serverTimestamp: vi.fn(() => 'ts'),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
  };
});

import {
  addChatMacro,
  getChatMacros,
  limparCacheMacros,
  removeChatMacro,
  updateChatMacro,
} from './storage';

const snapshotDe = nomes => ({
  docs: nomes.map(nome => ({ id: nome, data: () => ({ nome }) })),
});

describe('getChatMacros (cache por campanha)', () => {
  beforeEach(() => {
    limparCacheMacros();
    vi.mocked(getDocs).mockReset();
    vi.mocked(getDocs).mockResolvedValue(snapshotDe(['m1']));
    vi.mocked(addDoc).mockResolvedValue({ id: 'novo' });
    vi.mocked(updateDoc).mockResolvedValue();
    vi.mocked(deleteDoc).mockResolvedValue();
  });

  it('a segunda leitura da mesma campanha não vai ao Firestore', async () => {
    const primeira = await getChatMacros('c1');
    const segunda = await getChatMacros('c1');
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(segunda).toEqual(primeira);
    // Cópia: alterar o resultado não suja o cache.
    primeira[0].nome = 'alterado';
    expect((await getChatMacros('c1'))[0].nome).toBe('m1');
  });

  it('aberturas simultâneas dividem a mesma leitura', async () => {
    await Promise.all([getChatMacros('c1'), getChatMacros('c1')]);
    expect(getDocs).toHaveBeenCalledTimes(1);
  });

  it('campanha e modo (somente mestre) têm entradas separadas', async () => {
    await getChatMacros('c1');
    await getChatMacros('c2');
    await getChatMacros('c1', { incluirSomenteMestre: true });
    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['addChatMacro', () => addChatMacro('c1', { nome: 'x' })],
    ['updateChatMacro', () => updateChatMacro('c1', 'm1', { nome: 'y' })],
    ['removeChatMacro', () => removeChatMacro('c1', 'm1')],
  ])('%s invalida o cache da campanha', async (_nome, escrever) => {
    await getChatMacros('c1');
    await getChatMacros('c2');
    await escrever();
    await getChatMacros('c1');
    await getChatMacros('c2');
    // c1 relida (2 leituras), c2 continua em cache (1 leitura).
    expect(getDocs).toHaveBeenCalledTimes(3);
  });

  it('uma falha não fica em cache', async () => {
    vi.mocked(getDocs).mockRejectedValueOnce(new Error('negado'));
    await expect(getChatMacros('c1')).rejects.toThrow('negado');
    await expect(getChatMacros('c1')).resolves.toHaveLength(1);
    expect(getDocs).toHaveBeenCalledTimes(2);
  });
});
