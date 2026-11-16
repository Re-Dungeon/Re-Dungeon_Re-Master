import { beforeEach, describe, expect, it, vi } from 'vitest';
import { limit, onSnapshot, orderBy, writeBatch } from 'firebase/firestore';

import { DESENHO_VALIDADE_MS } from 'common/utils/gridDesenho';

vi.mock('./firebase', () => ({ auth: { currentUser: null }, db: {} }));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((_db, ...segmentos) => ({ path: segmentos.join('/') })),
    doc: vi.fn((ref, ...segmentos) => ({
      path: [ref?.path, ...segmentos].filter(Boolean).join('/'),
      id: segmentos.at(-1) ?? 'novo-id',
    })),
    query: vi.fn((ref, ...restricoes) => ({ ref, restricoes })),
    where: vi.fn((campo, op, valor) => ({ campo, op, valor })),
    orderBy: vi.fn((campo, direcao) => ({ orderBy: campo, direcao })),
    limit: vi.fn(n => ({ limit: n })),
    serverTimestamp: vi.fn(() => 'ts'),
    onSnapshot: vi.fn(() => vi.fn()),
    writeBatch: vi.fn(),
  };
});

import { addGridDesenho, subscribeGridDesenhos } from './storage';

const criarLote = (falhas = []) => {
  const lote = {
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(async () => {
      const erro = falhas.shift();
      if (erro) throw erro;
    }),
  };
  return lote;
};

describe('subscribeGridDesenhos', () => {
  it('só lê traços recentes (createdAt > agora − validade), os mais novos primeiro', () => {
    const antes = Date.now();
    subscribeGridDesenhos('c1', 'cena', vi.fn(), vi.fn());
    const depois = Date.now();
    const [consulta] = vi.mocked(onSnapshot).mock.calls.at(-1);
    const [filtro, ordem, teto] = consulta.restricoes;
    expect(filtro.campo).toBe('createdAt');
    expect(filtro.op).toBe('>');
    const corte = filtro.valor.toMillis();
    expect(corte).toBeGreaterThanOrEqual(antes - DESENHO_VALIDADE_MS);
    expect(corte).toBeLessThanOrEqual(depois - DESENHO_VALIDADE_MS);
    expect(ordem).toEqual({ orderBy: 'createdAt', direcao: 'desc' });
    expect(teto).toEqual({ limit: 300 });
    expect(orderBy).toHaveBeenCalled();
    expect(limit).toHaveBeenCalled();
  });
});

describe('addGridDesenho', () => {
  beforeEach(() => vi.mocked(writeBatch).mockReset());

  it('grava expiraEm (agora + validade) e apaga o excedente no mesmo lote', async () => {
    const lote = criarLote();
    vi.mocked(writeBatch).mockReturnValue(lote);
    const aoCriarLocal = vi.fn();
    const antes = Date.now();
    await addGridDesenho(
      'c1',
      'cena',
      { uid: 'u1', cor: '#fff000', pontos: [0, 0, 1, 1] },
      ['velho'],
      {
        aoCriarLocal,
      },
    );
    const dados = lote.set.mock.calls[0][1];
    expect(dados).toMatchObject({
      uid: 'u1',
      cor: '#fff000',
      pontos: [0, 0, 1, 1],
      createdAt: 'ts',
    });
    expect(dados.expiraEm.toMillis()).toBeGreaterThanOrEqual(
      antes + DESENHO_VALIDADE_MS,
    );
    expect(lote.delete).toHaveBeenCalledTimes(1);
    expect(lote.commit).toHaveBeenCalledTimes(1);
    expect(aoCriarLocal).toHaveBeenCalledTimes(1);
  });

  it('erro que não é de permissão não é repetido', async () => {
    const lote = criarLote([
      Object.assign(new Error('rede'), { code: 'unavailable' }),
    ]);
    vi.mocked(writeBatch).mockReturnValue(lote);
    await expect(
      addGridDesenho('c1', 'cena', {
        uid: 'u1',
        cor: '#fff000',
        pontos: [0, 0, 1, 1],
      }),
    ).rejects.toThrow('rede');
    expect(lote.commit).toHaveBeenCalledTimes(1);
  });

  it('com regras antigas (permission-denied) repete sem expiraEm e lembra disso', async () => {
    const negado = Object.assign(new Error('negado'), {
      code: 'permission-denied',
    });
    const primeiro = criarLote([negado]);
    const segundo = criarLote();
    const lotes = [primeiro, segundo];
    vi.mocked(writeBatch).mockImplementation(() => lotes.shift());
    await addGridDesenho(
      'c1',
      'cena',
      { uid: 'u1', cor: '#fff000', pontos: [0, 0, 1, 1] },
      ['x'],
    );
    // 1ª tentativa tinha expiraEm; a repetição não, mas mantém o apagar do excedente.
    expect(vi.mocked(writeBatch)).toHaveBeenCalledTimes(2);
    expect(primeiro.set.mock.calls[0][1]).toHaveProperty('expiraEm');
    expect(segundo.set.mock.calls[0][1]).not.toHaveProperty('expiraEm');
    expect(segundo.delete).toHaveBeenCalledTimes(1);

    const proximo = criarLote();
    vi.mocked(writeBatch).mockReturnValue(proximo);
    await addGridDesenho('c1', 'cena', {
      uid: 'u1',
      cor: '#fff000',
      pontos: [0, 0, 1, 1],
    });
    expect(proximo.set.mock.calls[0][1]).not.toHaveProperty('expiraEm');
    expect(proximo.commit).toHaveBeenCalledTimes(1);
  });
});
