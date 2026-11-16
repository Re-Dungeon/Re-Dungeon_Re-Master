import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteField,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

vi.mock('./firebase', () => ({ auth: { currentUser: null }, db: {} }));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((_db, ...segmentos) => ({ path: segmentos.join('/') })),
    doc: vi.fn((ref, ...segmentos) => ({
      path: [ref?.path, ...segmentos].filter(Boolean).join('/'),
    })),
    serverTimestamp: vi.fn(() => 'ts'),
    deleteField: vi.fn(() => 'apagar'),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    runTransaction: vi.fn(),
  };
});

import { setGridCenaAtiva, updateGridCena } from './storage';

const negado = () =>
  Object.assign(new Error('negado'), { code: 'permission-denied' });

describe('setGridCenaAtiva — cópia do travamento em grid/atual', () => {
  beforeEach(() => {
    vi.mocked(setDoc).mockReset().mockResolvedValue();
    vi.mocked(getDoc).mockReset();
    vi.mocked(deleteField).mockClear();
  });

  it('ativar uma cena grava o travamento dela junto da cena ativa', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      data: () => ({ travamento: 'turno' }),
    });
    await setGridCenaAtiva('c1', 'cenaA');
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(setDoc.mock.calls[0][1]).toEqual({
      cenaAtivaId: 'cenaA',
      travamento: 'turno',
      updatedAt: 'ts',
    });
    expect(setDoc.mock.calls[0][2]).toEqual({ merge: true });
  });

  it('cena sem travamento vira "livre"', async () => {
    vi.mocked(getDoc).mockResolvedValue({ data: () => ({ nome: 'X' }) });
    await setGridCenaAtiva('c1', 'cenaA');
    expect(setDoc.mock.calls[0][1].travamento).toBe('livre');
  });

  it('sem cena ativa apaga a cópia e nem lê a cena', async () => {
    await setGridCenaAtiva('c1', null);
    expect(getDoc).not.toHaveBeenCalled();
    expect(setDoc.mock.calls[0][1]).toEqual({
      cenaAtivaId: null,
      travamento: 'apagar',
      updatedAt: 'ts',
    });
  });

  it('regras antigas (permission-denied): repete sem o travamento', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      data: () => ({ travamento: 'congelado' }),
    });
    vi.mocked(setDoc).mockRejectedValueOnce(negado());
    await setGridCenaAtiva('c1', 'cenaA');
    expect(setDoc).toHaveBeenCalledTimes(2);
    expect(setDoc.mock.calls[1][1]).toEqual({
      cenaAtivaId: 'cenaA',
      updatedAt: 'ts',
    });
  });

  it('outro erro é propagado', async () => {
    vi.mocked(getDoc).mockResolvedValue({ data: () => ({}) });
    vi.mocked(setDoc).mockRejectedValueOnce(new Error('rede'));
    await expect(setGridCenaAtiva('c1', 'cenaA')).rejects.toThrow('rede');
    expect(setDoc).toHaveBeenCalledTimes(1);
  });
});

describe('updateGridCena — travamento da cena ativa', () => {
  const executar = atual => {
    const transacao = {
      get: vi.fn().mockResolvedValue({
        exists: () => Boolean(atual),
        data: () => atual,
      }),
      update: vi.fn(),
      set: vi.fn(),
    };
    vi.mocked(runTransaction).mockImplementation(async (_db, callback) => {
      await callback(transacao);
    });
    return transacao;
  };

  beforeEach(() => {
    vi.mocked(runTransaction).mockReset();
    vi.mocked(updateDoc).mockReset().mockResolvedValue();
  });

  it('patch sem travamento é um updateDoc simples', async () => {
    await updateGridCena('c1', 'cenaA', { nome: 'Nova' });
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0][1]).toEqual({
      nome: 'Nova',
      updatedAt: 'ts',
    });
    expect(runTransaction).not.toHaveBeenCalled();
  });

  it('travamento da cena ATIVA também atualiza grid/atual', async () => {
    const transacao = executar({ cenaAtivaId: 'cenaA' });
    await updateGridCena('c1', 'cenaA', { travamento: 'congelado' });
    expect(transacao.update).toHaveBeenCalledTimes(1);
    expect(transacao.set).toHaveBeenCalledTimes(1);
    expect(transacao.set.mock.calls[0][1]).toEqual({
      travamento: 'congelado',
      updatedAt: 'ts',
    });
    expect(transacao.set.mock.calls[0][2]).toEqual({ merge: true });
  });

  it('travamento de cena que NÃO está ativa só muda a cena', async () => {
    const transacao = executar({ cenaAtivaId: 'outra' });
    await updateGridCena('c1', 'cenaA', { travamento: 'turno' });
    expect(transacao.update).toHaveBeenCalledTimes(1);
    expect(transacao.set).not.toHaveBeenCalled();
  });

  it('sem grid/atual só muda a cena', async () => {
    const transacao = executar(null);
    await updateGridCena('c1', 'cenaA', { travamento: 'turno' });
    expect(transacao.set).not.toHaveBeenCalled();
  });

  it('regras antigas (permission-denied): ainda grava a cena', async () => {
    vi.mocked(runTransaction).mockRejectedValueOnce(negado());
    await updateGridCena('c1', 'cenaA', { travamento: 'turno' });
    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc.mock.calls[0][1]).toEqual({
      travamento: 'turno',
      updatedAt: 'ts',
    });
  });
});
