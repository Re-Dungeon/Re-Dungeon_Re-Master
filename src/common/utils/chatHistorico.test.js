import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HISTORICO_MAX,
  lerHistorico,
  navegarHistorico,
  registrarNoHistorico,
  salvarHistorico,
} from './chatHistorico';

describe('registrarNoHistorico', () => {
  it('acrescenta no fim, com trim', () => {
    expect(registrarNoHistorico(['oi'], '  /r 1d20 ')).toEqual(['oi', '/r 1d20']);
  });

  it('ignora vazio e repetição imediata', () => {
    expect(registrarNoHistorico(['oi'], '   ')).toEqual(['oi']);
    expect(registrarNoHistorico(['oi'], 'oi')).toEqual(['oi']);
    expect(registrarNoHistorico(['oi', 'tchau'], 'oi')).toEqual(['oi', 'tchau', 'oi']);
  });

  it('mantém no máximo HISTORICO_MAX itens, descartando os mais antigos', () => {
    const cheio = Array.from({ length: HISTORICO_MAX }, (_, i) => `m${i}`);
    const novo = registrarNoHistorico(cheio, 'nova');
    expect(novo).toHaveLength(HISTORICO_MAX);
    expect(novo[0]).toBe('m1');
    expect(novo[HISTORICO_MAX - 1]).toBe('nova');
  });

  it('aceita histórico inválido', () => {
    expect(registrarNoHistorico(null, 'oi')).toEqual(['oi']);
  });
});

describe('navegarHistorico', () => {
  const historico = ['a', 'b', 'c'];

  it('↑ a partir do campo livre vai para o mais recente e para no primeiro', () => {
    expect(navegarHistorico({ historico, indice: null, direcao: 'cima' })).toEqual({ indice: 2, texto: 'c' });
    expect(navegarHistorico({ historico, indice: 1, direcao: 'cima' })).toEqual({ indice: 0, texto: 'a' });
    expect(navegarHistorico({ historico, indice: 0, direcao: 'cima' })).toEqual({ indice: 0, texto: 'a' });
  });

  it('↓ avança e, depois do mais recente, limpa o campo', () => {
    expect(navegarHistorico({ historico, indice: 0, direcao: 'baixo' })).toEqual({ indice: 1, texto: 'b' });
    expect(navegarHistorico({ historico, indice: 2, direcao: 'baixo' })).toEqual({ indice: null, texto: '' });
  });

  it('↓ fora do histórico e histórico vazio não fazem nada', () => {
    expect(navegarHistorico({ historico, indice: null, direcao: 'baixo' })).toEqual({ indice: null, texto: null });
    expect(navegarHistorico({ historico: [], indice: null, direcao: 'cima' })).toEqual({ indice: null, texto: null });
  });
});

describe('lerHistorico / salvarHistorico', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('grava e lê pela chave', () => {
    salvarHistorico('k', ['oi', '/r 1d20']);
    expect(lerHistorico('k')).toEqual(['oi', '/r 1d20']);
    expect(lerHistorico('outra')).toEqual([]);
  });

  it('sem chave não lê nem grava', () => {
    salvarHistorico(undefined, ['oi']);
    expect(lerHistorico(undefined)).toEqual([]);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('JSON corrompido ou formato errado vira lista vazia', () => {
    window.sessionStorage.setItem('k', '{quebrado');
    expect(lerHistorico('k')).toEqual([]);
    window.sessionStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(lerHistorico('k')).toEqual([]);
    window.sessionStorage.setItem('k', JSON.stringify(['ok', 3, '']));
    expect(lerHistorico('k')).toEqual(['ok']);
  });

  it('sessionStorage lançando erro não quebra', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => salvarHistorico('k', ['oi'])).not.toThrow();
    expect(lerHistorico('k')).toEqual([]);
  });
});
