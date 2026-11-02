import { describe, it, expect } from 'vitest';
import {
  OPCOES_TAMANHO_TOKEN,
  ajustarRecurso,
  auraEscolhida,
  recursoDigitado,
  opcoesDeDonos,
  tokensDeJogadoresFaltantes,
} from './gridMestre';

describe('opcoesDeDonos', () => {
  it('agrupa os personagens por dono e ignora quem não tem uid', () => {
    expect(
      opcoesDeDonos([
        { uid: 'u2', label: 'Zara' },
        { uid: 'u1', label: 'Aldric' },
        { uid: 'u2', label: 'Lobo' },
        { uid: null, label: 'Sem dono' },
      ]),
    ).toEqual([
      { uid: 'u1', label: 'Aldric' },
      { uid: 'u2', label: 'Zara, Lobo' },
    ]);
  });

  it('mantém donos já atribuídos que saíram da campanha', () => {
    expect(
      opcoesDeDonos([{ uid: 'u1', label: 'Aldric' }], ['u1', 'u9']),
    ).toEqual([
      { uid: 'u1', label: 'Aldric' },
      { uid: 'u9', label: 'Jogador fora da campanha' },
    ]);
  });
});

describe('OPCOES_TAMANHO_TOKEN', () => {
  it('vai de 1×1 a 10×10', () => {
    expect(OPCOES_TAMANHO_TOKEN).toHaveLength(10);
    expect(OPCOES_TAMANHO_TOKEN[2]).toEqual({ value: 3, label: '3×3' });
  });
});

describe('tokensDeJogadoresFaltantes', () => {
  const limites = { colunas: 3, linhas: 3 };
  const JOGADORES = [
    { refId: 'p1', label: 'Aldric', avatar: 'https://ex.com/a.png', uid: 'u1' },
    { refId: 'p2', label: 'Zara', avatar: null, uid: 'u2' },
    { refId: 'p3', label: 'Sem dono', avatar: null, uid: null },
  ];

  it('cria um token por jogador ausente, atribuído ao dono, em células livres', () => {
    const tokens = tokensDeJogadoresFaltantes(
      JOGADORES,
      [
        { tipo: 'jogador', refId: 'p1', col: 0, lin: 0, tamanho: 1 },
        { tipo: 'npc', refId: 'p2', col: 1, lin: 0, tamanho: 1 },
      ],
      limites,
    );
    expect(tokens).toEqual([
      {
        nome: 'Zara',
        imagemUrl: null,
        tipo: 'jogador',
        refId: 'p2',
        donos: ['u2'],
        tamanho: 1,
        oculto: false,
        col: 2,
        lin: 0,
      },
      expect.objectContaining({ refId: 'p3', donos: [], col: 0, lin: 1 }),
    ]);
  });

  it('respeita o limite de tokens por cena', () => {
    const cheia = Array.from({ length: 199 }, (_, i) => ({
      tipo: 'avulso',
      col: i % 30,
      lin: Math.floor(i / 30),
      tamanho: 1,
    }));
    expect(
      tokensDeJogadoresFaltantes(JOGADORES, cheia, { colunas: 30, linhas: 20 }),
    ).toHaveLength(1);
  });
});

describe('combate do token', () => {
  const pv = { atual: 10, max: 20 };

  it('ajustarRecurso fica entre 0 e o máximo', () => {
    expect(ajustarRecurso(pv, 1)).toEqual({ atual: 11, max: 20 });
    expect(ajustarRecurso({ atual: 0, max: 20 }, -1)).toEqual({
      atual: 0,
      max: 20,
    });
    expect(ajustarRecurso({ atual: 20, max: 20 }, 1)).toEqual({
      atual: 20,
      max: 20,
    });
    expect(ajustarRecurso(null, 1)).toBeNull();
  });

  it('recursoDigitado: max vazio ou 0 remove; max novo cria cheio', () => {
    expect(recursoDigitado(pv, 'max', '')).toBeNull();
    expect(recursoDigitado(pv, 'max', '0')).toBeNull();
    expect(recursoDigitado(null, 'max', '15')).toEqual({ atual: 15, max: 15 });
    expect(recursoDigitado(pv, 'max', '5')).toEqual({ atual: 5, max: 5 });
    expect(recursoDigitado(pv, 'atual', '7')).toEqual({ atual: 7, max: 20 });
    expect(recursoDigitado(pv, 'atual', '99')).toEqual({ atual: 20, max: 20 });
    expect(recursoDigitado(pv, 'atual', 'abc')).toBe(pv);
    expect(recursoDigitado(null, 'atual', '3')).toBeNull();
  });

  it('auraEscolhida: sem cor = sem aura; raio limitado', () => {
    expect(auraEscolhida('', 3)).toBeNull();
    expect(auraEscolhida('#e05555', '2')).toEqual({ raio: 2, cor: '#e05555' });
    expect(auraEscolhida('#e05555', '0')).toEqual({ raio: 1, cor: '#e05555' });
    expect(auraEscolhida('#e05555', '5000')).toEqual({
      raio: 999,
      cor: '#e05555',
    });
    expect(auraEscolhida('#e05555', 'x')).toEqual({ raio: 1, cor: '#e05555' });
  });
});
