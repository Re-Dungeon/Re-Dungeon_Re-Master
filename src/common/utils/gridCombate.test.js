import { describe, expect, it } from 'vitest';

import {
  ALCANCE_QUADRADOS_MAX,
  COMBATE_PARTICIPANTES_MAX,
  avancarTurno,
  compararIniciativa,
  derrotadosDosTokens,
  distanciasDeMovimento,
  faixaDaDistancia,
  faixaDoCombate,
  faixasDoAlcance,
  inserirNoCombate,
  montarInicioDoCombate,
  moverNoCombate,
  normalizarCombate,
  origemDoAlcance,
  quadradosDeMovimento,
  reacaoDaFicha,
  removerDoCombate,
  rolarIniciativa,
  tokenDerrotado,
  trocarTurno,
} from './gridCombate';

// uint32 em sequência: rolarFace(20) devolve (valor % 20) + 1.
const sequencia = valores => {
  let indice = 0;
  return () => valores[indice++ % valores.length];
};

const entrada = (tokenId, iniciativa, reacao = 0, d20 = 10) => ({
  tokenId,
  iniciativa,
  d20,
  reacao,
});

const TOKENS = [
  { id: 'a', nome: 'Aldric', tipo: 'jogador', col: 1, lin: 1, oculto: false },
  { id: 'b', nome: 'Brina', tipo: 'jogador', col: 2, lin: 2, oculto: false },
  { id: 'g', nome: 'Goblin', tipo: 'criatura', col: 5, lin: 5, oculto: true },
];

const combate = (ordem, indice = 0, rodada = 1, extra = {}) =>
  normalizarCombate({ ordem, indice, rodada, inicioTurno: null, ...extra });

describe('reacaoDaFicha', () => {
  it('usa o total salvo da ficha', () => {
    expect(reacaoDaFicha({ secundariosTotais: { reacao: '11' } })).toBe(11);
  });

  it('sem nada na ficha, a fórmula dá 6; sem ficha, null', () => {
    expect(reacaoDaFicha({})).toBe(6);
    expect(reacaoDaFicha(null)).toBeNull();
  });

  it('soma base/extra/bônus, cultivo (por rank) e os ajustes da Reação', () => {
    const ficha = {
      atributosBase: { agilidade: 100, percepcao: 50, sorte: 20 },
      atributosExtra: { agilidade: 20 },
      cultivoBonus: {
        primarios: { agilidade: { r1: 5, r2: 5 } },
        secundarios: { reacao: { r1: 2 } },
      },
      secundariosBonus: { reacao: 1 },
    };
    // AGI 130, PER 50, SOR 20 → ceil((65 + 15 + 4) / 250 × 6) = 3 → 3 + 6 + 3.
    expect(reacaoDaFicha(ficha)).toBe(12);
  });

  it('prefere os primários totais salvos', () => {
    expect(
      reacaoDaFicha({
        atributosTotais: { agilidade: 250, percepcao: 250, sorte: 250 },
        atributosBase: { agilidade: 1 },
      }),
    ).toBe(12);
  });
});

describe('rolarIniciativa', () => {
  it('ordena por total, depois Reação, depois sorteio (randomFn injetado)', () => {
    const ordem = rolarIniciativa(
      [
        { tokenId: 'a', reacao: 2 },
        { tokenId: 'b', reacao: 5 },
        { tokenId: 'c', reacao: 5 },
        { tokenId: 'd', reacao: 5 },
        { tokenId: 'e', reacao: 3 },
      ],
      // [d20, sorteio] por participante.
      sequencia([17, 0, 9, 1, 11, 0, 11, 5, 13, 9]),
    );
    expect(ordem).toEqual([
      { tokenId: 'a', iniciativa: 20, d20: 18, reacao: 2 },
      { tokenId: 'd', iniciativa: 17, d20: 12, reacao: 5 },
      { tokenId: 'c', iniciativa: 17, d20: 12, reacao: 5 },
      { tokenId: 'e', iniciativa: 17, d20: 14, reacao: 3 },
      { tokenId: 'b', iniciativa: 15, d20: 10, reacao: 5 },
    ]);
  });

  it('Reação ausente vale 0', () => {
    expect(rolarIniciativa([{ tokenId: 'x' }], sequencia([0, 0]))).toEqual([
      { tokenId: 'x', iniciativa: 1, d20: 1, reacao: 0 },
    ]);
  });

  it('empate no total: a maior Reação vem primeiro e a ordem de entrada é estável', () => {
    const lista = [entrada('a', 15, 2), entrada('b', 15, 6), entrada('c', 15, 6)];
    expect([...lista].sort(compararIniciativa).map(item => item.tokenId)).toEqual(['b', 'c', 'a']);
  });

  it('compararIniciativa: maior total, depois maior Reação', () => {
    expect(compararIniciativa(entrada('a', 10), entrada('b', 9))).toBeLessThan(
      0,
    );
    expect(
      compararIniciativa(entrada('a', 10, 1), entrada('b', 10, 3)),
    ).toBeGreaterThan(0);
  });
});

describe('normalizarCombate', () => {
  it('descarta entradas ruins e repetidas, limita índice e rodada, gera a chave do turno', () => {
    const normalizado = normalizarCombate({
      ordem: [
        entrada('a', 15.4, 2, 25),
        null,
        { tokenId: 3 },
        entrada('b', '12', 1),
        entrada('a', 1),
      ],
      indice: 7,
      rodada: 0,
      inicioTurno: { col: 2, lin: 9 },
      turnoEm: { seconds: 4, nanoseconds: 2 },
    });
    expect(normalizado).toEqual({
      ordem: [entrada('a', 15, 2, null), entrada('b', 12, 1)],
      indice: 1,
      rodada: 1,
      inicioTurno: { col: 2, lin: 9 },
      chaveTurno: '4:2',
      tokenDaVezId: 'b',
    });
  });

  it('sem ordem válida não há combate; inícioTurno inválido vira null', () => {
    expect(normalizarCombate(null)).toBeNull();
    expect(normalizarCombate({ ordem: [{}] })).toBeNull();
    expect(
      normalizarCombate({
        ordem: [entrada('a', 1)],
        inicioTurno: { col: -1, lin: 0 },
      }).inicioTurno,
    ).toBeNull();
  });

  it('limita o número de participantes', () => {
    const ordem = Array.from(
      { length: COMBATE_PARTICIPANTES_MAX + 5 },
      (_, i) => entrada(`t${i}`, i),
    );
    expect(normalizarCombate({ ordem }).ordem).toHaveLength(
      COMBATE_PARTICIPANTES_MAX,
    );
  });
});

describe('avancarTurno / trocarTurno', () => {
  const tres = [entrada('a', 20), entrada('b', 15), entrada('g', 10)];

  it('+1 avança; no último volta ao primeiro com rodada nova', () => {
    expect(avancarTurno(combate(tres, 0, 2), 1)).toEqual({
      indice: 1,
      rodada: 2,
      novaRodada: false,
    });
    expect(avancarTurno(combate(tres, 2, 2), 1)).toEqual({
      indice: 0,
      rodada: 3,
      novaRodada: true,
    });
  });

  it('−1 volta, cruzando a rodada; na rodada 1 índice 0 não há anterior', () => {
    expect(avancarTurno(combate(tres, 0, 3), -1)).toEqual({
      indice: 2,
      rodada: 2,
      novaRodada: false,
    });
    expect(avancarTurno(combate(tres, 0, 1), -1)).toBeNull();
  });

  it('trocarTurno: próximo visível leva nome e origem do alcance', () => {
    expect(trocarTurno(combate(tres, 0), 1, TOKENS)).toEqual({
      patch: { indice: 1, rodada: 1, inicioTurno: { col: 2, lin: 2 } },
      mensagem: { evento: 'turno', rodada: 1, nome: 'Brina', oculto: false },
    });
  });

  it('trocarTurno: próximo oculto ou ausente → oponente oculto (sem origem se ausente)', () => {
    expect(trocarTurno(combate(tres, 1), 1, TOKENS)).toEqual({
      patch: { indice: 2, rodada: 1, inicioTurno: { col: 5, lin: 5 } },
      mensagem: { evento: 'turno', rodada: 1, nome: null, oculto: true },
    });
    const semOculto = TOKENS.filter(token => !token.oculto);
    expect(trocarTurno(combate(tres, 1), 1, semOculto)).toEqual({
      patch: { indice: 2, rodada: 1, inicioTurno: null },
      mensagem: { evento: 'turno', rodada: 1, nome: null, oculto: true },
    });
  });

  it('trocarTurno: virar a rodada gera o evento "rodada"', () => {
    expect(trocarTurno(combate(tres, 2, 4), 1, TOKENS).mensagem).toEqual({
      evento: 'rodada',
      rodada: 5,
      nome: 'Aldric',
      oculto: false,
    });
  });

  describe('NPC/Criatura derrotado (PV 0) perde a vez', () => {
    const quatro = [
      entrada('a', 20),
      entrada('n1', 15),
      entrada('n2', 12),
      entrada('b', 10),
    ];
    const mortos = ids => new Set(ids);

    it('tokenDerrotado: só NPC/Criatura com PV atual 0; jogador, avulso e sem PV não', () => {
      const pv0 = { atual: 0, max: 10 };
      expect(tokenDerrotado({ tipo: 'npc', pv: pv0 })).toBe(true);
      expect(tokenDerrotado({ tipo: 'criatura', pv: pv0 })).toBe(true);
      expect(tokenDerrotado({ tipo: 'criatura', pv: { atual: 1, max: 10 } })).toBe(false);
      expect(tokenDerrotado({ tipo: 'jogador', pv: pv0 })).toBe(false);
      expect(tokenDerrotado({ tipo: 'avulso', pv: pv0 })).toBe(false);
      expect(tokenDerrotado({ tipo: 'npc' })).toBe(false);
      expect(tokenDerrotado(undefined)).toBe(false);
      expect(
        [...derrotadosDosTokens([{ id: 'x', tipo: 'npc', pv: pv0 }, { id: 'y', tipo: 'jogador', pv: pv0 }])],
      ).toEqual(['x']);
    });

    it('+1 pula os derrotados', () => {
      expect(avancarTurno(combate(quatro, 0), 1, { derrotados: mortos(['n1', 'n2']) })).toEqual({
        indice: 3,
        rodada: 1,
        novaRodada: false,
      });
    });

    it('+1 pula e passa a rodada ao dar a volta', () => {
      expect(avancarTurno(combate(quatro, 2, 4), 1, { derrotados: mortos(['b', 'a']) })).toEqual({
        indice: 1,
        rodada: 5,
        novaRodada: true,
      });
    });

    it('−1 pula os derrotados; na rodada 1 sem ninguém antes de pé, null', () => {
      expect(avancarTurno(combate(quatro, 3), -1, { derrotados: mortos(['n1', 'n2']) })).toEqual({
        indice: 0,
        rodada: 1,
        novaRodada: false,
      });
      expect(avancarTurno(combate(quatro, 2, 1), -1, { derrotados: mortos(['n1', 'a']) })).toBeNull();
      expect(avancarTurno(combate(quatro, 2, 2), -1, { derrotados: mortos(['n1', 'a']) })).toEqual({
        indice: 3,
        rodada: 1,
        novaRodada: false,
      });
    });

    it('o único de pé volta a si mesmo na rodada seguinte', () => {
      expect(
        avancarTurno(combate(quatro, 3, 2), 1, { derrotados: mortos(['a', 'n1', 'n2']) }),
      ).toEqual({ indice: 3, rodada: 3, novaRodada: true });
    });

    it('todos derrotados: vale o passo simples, sem laço infinito', () => {
      const todos = mortos(['a', 'n1', 'n2', 'b']);
      expect(avancarTurno(combate(quatro, 0), 1, { derrotados: todos })).toEqual({
        indice: 1,
        rodada: 1,
        novaRodada: false,
      });
      expect(avancarTurno(combate(quatro, 0, 1), -1, { derrotados: todos })).toBeNull();
    });

    it('trocarTurno calcula os derrotados dos tokens e a mensagem é do próximo de pé', () => {
      const tokens = [
        { id: 'a', nome: 'Aldric', tipo: 'jogador', col: 0, lin: 0, pv: { atual: 0, max: 9 } },
        { id: 'n1', nome: 'Orc', tipo: 'npc', col: 1, lin: 1, pv: { atual: 0, max: 9 } },
        { id: 'n2', nome: 'Lobo', tipo: 'criatura', col: 2, lin: 2, pv: { atual: 0, max: 9 } },
        { id: 'b', nome: 'Brina', tipo: 'jogador', col: 3, lin: 3 },
      ];
      expect(trocarTurno(combate(quatro, 0), 1, tokens)).toEqual({
        patch: { indice: 3, rodada: 1, inicioTurno: { col: 3, lin: 3 } },
        mensagem: { evento: 'turno', rodada: 1, nome: 'Brina', oculto: false },
      });
      // Jogador com PV 0 continua na vez dele.
      expect(trocarTurno(combate(quatro, 3), 1, tokens).patch.indice).toBe(0);
    });

    it('faixaDoCombate marca o derrotado', () => {
      const tokens = [
        { id: 'a', nome: 'A', tipo: 'jogador', pv: { atual: 0, max: 9 } },
        { id: 'n1', nome: 'Orc', tipo: 'npc', pv: { atual: 0, max: 9 } },
      ];
      const faixa = faixaDoCombate(combate([entrada('a', 9), entrada('n1', 5)]), tokens, {
        veTudo: true,
      });
      expect(faixa.itens.map(item => item.derrotado)).toEqual([false, true]);
    });
  });
});

describe('montarInicioDoCombate', () => {
  it('estado na rodada 1 e mensagem sem os ocultos na iniciativa', () => {
    const ordem = [entrada('g', 22, 4, 18), entrada('a', 17, -1, 18)];
    expect(montarInicioDoCombate(ordem, TOKENS)).toEqual({
      estado: { ordem, indice: 0, rodada: 1, inicioTurno: { col: 5, lin: 5 } },
      mensagem: {
        evento: 'inicio',
        rodada: 1,
        nome: null,
        oculto: true,
        iniciativa: [{ nome: 'Aldric', total: 17, d20: 18, reacao: -1 }],
      },
    });
  });
});

describe('participantes', () => {
  const tres = [entrada('a', 20), entrada('b', 15), entrada('g', 10)];

  it('inserir antes do token da vez desloca o índice (e entra depois dos empates)', () => {
    expect(inserirNoCombate(combate(tres, 1), entrada('n', 15, 0))).toEqual({
      patch: {
        ordem: [
          entrada('a', 20),
          entrada('b', 15),
          entrada('n', 15, 0),
          entrada('g', 10),
        ],
        indice: 1,
      },
      mudouTurno: false,
    });
    expect(
      inserirNoCombate(combate(tres, 1), entrada('n', 30)).patch.indice,
    ).toBe(2);
    expect(
      inserirNoCombate(combate(tres, 1), entrada('n', 1)).patch.ordem[3]
        .tokenId,
    ).toBe('n');
    expect(inserirNoCombate(combate(tres, 1), entrada('a', 1))).toBeNull();
  });

  it('remover antes do token da vez recua o índice', () => {
    expect(removerDoCombate(combate(tres, 2), 'a', TOKENS)).toEqual({
      patch: {
        ordem: [entrada('b', 15), entrada('g', 10)],
        indice: 1,
        rodada: 1,
      },
      mudouTurno: false,
    });
    expect(removerDoCombate(combate(tres, 2), 'x', TOKENS)).toBeNull();
  });

  it('remover o token da vez passa a vez; sendo o último, vira a rodada', () => {
    expect(removerDoCombate(combate(tres, 1, 2), 'b', TOKENS)).toEqual({
      patch: {
        ordem: [entrada('a', 20), entrada('g', 10)],
        indice: 1,
        rodada: 2,
        inicioTurno: { col: 5, lin: 5 },
      },
      mudouTurno: true,
    });
    expect(removerDoCombate(combate(tres, 2, 2), 'g', TOKENS)).toEqual({
      patch: {
        ordem: [entrada('a', 20), entrada('b', 15)],
        indice: 0,
        rodada: 3,
        inicioTurno: { col: 1, lin: 1 },
      },
      mudouTurno: true,
    });
  });

  it('tirar o último participante encerra', () => {
    expect(removerDoCombate(combate([entrada('a', 1)]), 'a', TOKENS)).toEqual({
      encerrar: true,
    });
  });

  it('subir/descer mantém o token da vez', () => {
    expect(moverNoCombate(combate(tres, 1), 'b', -1)).toEqual({
      patch: {
        ordem: [entrada('b', 15), entrada('a', 20), entrada('g', 10)],
        indice: 0,
      },
      mudouTurno: false,
    });
    expect(moverNoCombate(combate(tres, 1), 'g', -1).patch.indice).toBe(2);
    expect(moverNoCombate(combate(tres, 1), 'a', -1)).toBeNull();
    expect(moverNoCombate(combate(tres, 1), 'g', 1)).toBeNull();
  });
});

describe('faixaDoCombate', () => {
  const ordem = [entrada('a', 20), entrada('g', 15), entrada('b', 10)];

  it('mestre vê todos, com o atual marcado', () => {
    const faixa = faixaDoCombate(combate(ordem, 1, 3), TOKENS, {
      veTudo: true,
    });
    expect(faixa.rodada).toBe(3);
    expect(faixa.vezDoMestre).toBe(false);
    expect(
      faixa.itens.map(item => [item.tokenId, item.atual, item.oculto]),
    ).toEqual([
      ['a', false, false],
      ['g', true, true],
      ['b', false, false],
    ]);
  });

  it('jogador não vê o oculto e, na vez dele, vê "vez do mestre"', () => {
    const visiveis = TOKENS.filter(token => !token.oculto);
    const faixa = faixaDoCombate(combate(ordem, 1), visiveis);
    expect(faixa.itens.map(item => item.tokenId)).toEqual(['a', 'b']);
    expect(faixa.vezDoMestre).toBe(true);
    expect(faixaDoCombate(combate(ordem, 0), visiveis).vezDoMestre).toBe(false);
    expect(faixaDoCombate(null, visiveis)).toBeNull();
  });
});

describe('alcance de movimento', () => {
  it('quadradosDeMovimento: 9 m / 1,5 m → 6 e 12 (2×) ou 9 (1,5×), até o máximo', () => {
    expect(quadradosDeMovimento(9, 1.5, 2)).toEqual({ mover: 6, correr: 12 });
    expect(quadradosDeMovimento(9, 1.5, 1.5)).toEqual({ mover: 6, correr: 9 });
    expect(quadradosDeMovimento(10, 1.5, 2)).toEqual({ mover: 6, correr: 13 });
    expect(quadradosDeMovimento(999, 1.5, 2)).toEqual({
      mover: ALCANCE_QUADRADOS_MAX,
      correr: ALCANCE_QUADRADOS_MAX,
    });
  });

  it('origemDoAlcance: início do turno do token da vez, senão a posição atual', () => {
    const emCombate = combate([entrada('a', 1), entrada('b', 0)], 0, 1, {
      inicioTurno: { col: 0, lin: 0 },
    });
    expect(origemDoAlcance(TOKENS[0], emCombate)).toEqual({ col: 0, lin: 0 });
    expect(origemDoAlcance(TOKENS[1], emCombate)).toEqual({ col: 2, lin: 2 });
    expect(origemDoAlcance(TOKENS[0], null)).toEqual({ col: 1, lin: 1 });
  });

  it('distanciasDeMovimento: quadrado Chebyshev em volta da origem', () => {
    const distancias = distanciasDeMovimento({
      origem: { col: 5, lin: 5 },
      alcance: 2,
      limites: { colunas: 20, linhas: 20 },
    });
    expect(distancias.size).toBe(25);
    expect(distancias.get('5,5')).toBe(0);
    expect(distancias.get('7,7')).toBe(2);
    expect(distancias.has('8,5')).toBe(false);
  });

  it('recorta no canto do mapa e respeita o tamanho do token na borda', () => {
    expect(
      distanciasDeMovimento({
        origem: { col: 0, lin: 0 },
        alcance: 2,
        limites: { colunas: 20, linhas: 20 },
      }).size,
    ).toBe(9);
    const grande = distanciasDeMovimento({
      origem: { col: 8, lin: 8 },
      tamanho: 2,
      alcance: 1,
      limites: { colunas: 10, linhas: 10 },
    });
    expect([...grande.keys()].sort()).toEqual(['7,7', '7,8', '8,7', '8,8']);
  });

  it('com células bloqueadas, contorna a parede', () => {
    const base = {
      origem: { col: 0, lin: 0 },
      alcance: 10,
      limites: { colunas: 5, linhas: 4 },
    };
    expect(distanciasDeMovimento(base).get('4,0')).toBe(4);
    const parede = distanciasDeMovimento({
      ...base,
      bloqueadas: new Set(['2,0', '2,1', '2,2']),
    });
    expect(parede.get('4,0')).toBe(6);
    expect(parede.has('2,1')).toBe(false);
  });

  it('com paredes, recusa a diagonal entre dois lados bloqueados e aceita com um livre', () => {
    const base = {
      origem: { col: 0, lin: 0 },
      alcance: 1,
      limites: { colunas: 5, linhas: 5 },
    };
    const fechada = distanciasDeMovimento({
      ...base,
      bloqueadas: new Set(['1,0', '0,1']),
    });
    expect(fechada.has('1,1')).toBe(false);
    const umLado = distanciasDeMovimento({
      ...base,
      bloqueadas: new Set(['1,0']),
    });
    expect(umLado.get('1,1')).toBe(1);
    expect(distanciasDeMovimento(base).get('1,1')).toBe(1);
  });

  it('faixasDoAlcance: trechos por linha, verde até Mover e amarelo até Correr', () => {
    const distancias = distanciasDeMovimento({
      origem: { col: 2, lin: 2 },
      alcance: 2,
      limites: { colunas: 10, linhas: 10 },
    });
    const faixas = faixasDoAlcance(distancias, { mover: 1, correr: 2 });
    expect(faixas.mover).toEqual([
      { col: 1, lin: 1, colunas: 3 },
      { col: 1, lin: 2, colunas: 3 },
      { col: 1, lin: 3, colunas: 3 },
    ]);
    expect(faixas.correr).toContainEqual({ col: 0, lin: 0, colunas: 5 });
    expect(faixas.correr).toContainEqual({ col: 0, lin: 2, colunas: 1 });
    expect(faixas.correr).toContainEqual({ col: 4, lin: 2, colunas: 1 });
    expect(faixas.correr).toHaveLength(8);
  });

  it('faixasDoAlcance: token maior cobre a área inteira de cada âncora', () => {
    const distancias = distanciasDeMovimento({
      origem: { col: 0, lin: 0 },
      tamanho: 2,
      alcance: 1,
      limites: { colunas: 10, linhas: 10 },
    });
    expect(
      faixasDoAlcance(distancias, { mover: 1, correr: 1, tamanho: 2 }),
    ).toEqual({
      mover: [
        { col: 0, lin: 0, colunas: 3 },
        { col: 0, lin: 1, colunas: 3 },
        { col: 0, lin: 2, colunas: 3 },
      ],
      correr: [],
    });
  });

  it('faixaDaDistancia', () => {
    expect(faixaDaDistancia(6, { mover: 6, correr: 12 })).toBe('mover');
    expect(faixaDaDistancia(7, { mover: 6, correr: 12 })).toBe('correr');
    expect(faixaDaDistancia(13, { mover: 6, correr: 12 })).toBe('alem');
  });
});
