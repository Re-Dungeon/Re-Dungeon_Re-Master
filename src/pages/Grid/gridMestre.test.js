import { describe, it, expect } from 'vitest';
import { ACOES_CAMADA } from 'common/utils/gridCamadas';
import {
  FERRAMENTAS,
  OPCOES_ACAO,
  OPCOES_FERRAMENTA,
  OPCOES_FORMA,
  OPCOES_CORRIDA,
  OPCOES_TAMANHO_TOKEN,
  OPCOES_TRAVAMENTO,
  ajustarRecurso,
  auraEscolhida,
  reacaoDoToken,
  recursoDigitado,
  opcoesDeDonos,
  tokensDeJogadoresFaltantes,
  QUANTIDADE_TOKENS_MAX,
  copiaDoToken,
  montarTokensEmLote,
  nomesNumerados,
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
    // Com sinal é relativo ao atual (dano/cura), limitado a 0..max.
    expect(recursoDigitado({ atual: 12, max: 20 }, 'atual', '-7')).toEqual({
      atual: 5,
      max: 20,
    });
    expect(recursoDigitado({ atual: 12, max: 20 }, 'atual', '+5')).toEqual({
      atual: 17,
      max: 20,
    });
    expect(recursoDigitado({ atual: 12, max: 20 }, 'atual', '-99')).toEqual({
      atual: 0,
      max: 20,
    });
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

describe('combate (Fase 3A)', () => {
  it('OPCOES_TRAVAMENTO e OPCOES_CORRIDA têm os valores da regra', () => {
    expect(OPCOES_TRAVAMENTO.map(o => o.value)).toEqual([
      'livre',
      'turno',
      'congelado',
    ]);
    expect(OPCOES_CORRIDA).toEqual([
      { value: 2, label: '2×' },
      { value: 1.5, label: '1,5×' },
    ]);
  });

  describe('reacaoDoToken', () => {
    const fichas = { pj1: { secundariosTotais: { reacao: 9 } } };
    const fontes = {
      npcs: [{ refId: 'n1', reacao: 7 }],
      criaturas: [{ refId: 'cr1', reacao: null }],
      jogadores: [{ refId: 'pj1', reacao: 6 }],
    };

    it('jogador usa a ficha ao vivo', () => {
      expect(reacaoDoToken({ refId: 'pj1' }, { fichas, fontes })).toBe(9);
    });

    it('NPC usa a Reação da persona da mesa', () => {
      expect(reacaoDoToken({ refId: 'n1' }, { fichas, fontes })).toBe(7);
    });

    it('sem refId ou sem dados: null (o mestre informa)', () => {
      expect(reacaoDoToken({ refId: null }, { fichas, fontes })).toBeNull();
      expect(reacaoDoToken({ refId: 'cr1' }, { fichas, fontes })).toBeNull();
      expect(reacaoDoToken({ refId: 'x' })).toBeNull();
    });
  });
});

describe('ferramentas do mapa', () => {
  it('lista as quatro ferramentas, Mover primeiro', () => {
    expect(OPCOES_FERRAMENTA.map(opcao => opcao.value)).toEqual([
      FERRAMENTAS.MOVER,
      FERRAMENTAS.PAREDES,
      FERRAMENTAS.NEVOA,
      FERRAMENTAS.MARCADORES,
    ]);
  });

  it('formas: pincel e retângulo', () => {
    expect(OPCOES_FORMA.map(opcao => opcao.value)).toEqual([
      'pincel',
      'retangulo',
    ]);
  });

  it('ações: névoa revela (adicionar) e cobre (remover); paredes adicionam e apagam', () => {
    const nevoa = OPCOES_ACAO[FERRAMENTAS.NEVOA];
    expect(nevoa.find(opcao => opcao.label === 'Revelar').value).toBe(
      ACOES_CAMADA.ADICIONAR,
    );
    expect(nevoa.find(opcao => opcao.label === 'Cobrir').value).toBe(
      ACOES_CAMADA.REMOVER,
    );
    expect(OPCOES_ACAO[FERRAMENTAS.PAREDES].map(opcao => opcao.value)).toEqual([
      ACOES_CAMADA.ADICIONAR,
      ACOES_CAMADA.REMOVER,
    ]);
  });
});

describe('várias cópias de token', () => {
  const limites = { colunas: 5, linhas: 5 };

  it('nomesNumerados: Goblin, Goblin 2, Goblin 3 e continua do maior usado', () => {
    expect(nomesNumerados('Goblin', [], 3)).toEqual([
      'Goblin',
      'Goblin 2',
      'Goblin 3',
    ]);
    expect(nomesNumerados('Goblin', ['Goblin', 'Goblin 4', 'Orc'], 2)).toEqual([
      'Goblin 5',
      'Goblin 6',
    ]);
    expect(nomesNumerados('Goblin', ['Goblin'], 1)).toEqual(['Goblin 2']);
    expect(nomesNumerados('Orc (chefe)', ['Orc (chefe)'], 1)).toEqual([
      'Orc (chefe) 2',
    ]);
    expect(nomesNumerados('  ', [], 1)).toEqual(['Token']);
    expect(nomesNumerados('x', [], 999)).toHaveLength(QUANTIDADE_TOKENS_MAX);
  });

  it('nomesNumerados respeita o tamanho máximo do nome', () => {
    const longo = 'a'.repeat(100);
    const [, segundo] = nomesNumerados(longo, [], 2);
    expect(segundo.length).toBeLessThanOrEqual(100);
    expect(segundo.endsWith(' 2')).toBe(true);
  });

  it('montarTokensEmLote não empilha as cópias', () => {
    const tokens = montarTokensEmLote(
      { nome: 'Goblin', tipo: 'npc', tamanho: 1 },
      3,
      [{ id: 't', nome: 'Herói', col: 0, lin: 0, tamanho: 1 }],
      limites,
    );
    expect(tokens.map(token => token.nome)).toEqual([
      'Goblin',
      'Goblin 2',
      'Goblin 3',
    ]);
    expect(tokens.map(token => [token.col, token.lin])).toEqual([
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
  });

  it('copiaDoToken mantém os campos de jogo e tira rastro/datas/posição', () => {
    const original = {
      id: 'a',
      nome: 'Goblin',
      tipo: 'npc',
      tamanho: 1,
      col: 0,
      lin: 0,
      donos: [],
      oculto: true,
      pv: { atual: 3, max: 7 },
      condicoes: ['c1'],
      rastro: [0, 0, 1, 1],
      movidoEm: 5,
      createdAt: 1,
      updatedAt: 2,
    };
    const copia = copiaDoToken(original, [original], limites);
    expect(copia).toEqual({
      nome: 'Goblin 2',
      tipo: 'npc',
      tamanho: 1,
      col: 1,
      lin: 0,
      donos: [],
      oculto: true,
      pv: { atual: 3, max: 7 },
      condicoes: ['c1'],
    });
  });
});
