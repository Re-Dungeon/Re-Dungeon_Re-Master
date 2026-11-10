import { describe, expect, it } from 'vitest';

import {
  ACOES_CAMADA,
  aplicarCelulas,
  areaBloqueada,
  caminhoBloqueado,
  caminhoSvgDeTrechos,
  celulasDaSala,
  celulasDoPincel,
  celulasDoRetangulo,
  chaveDaCelula,
  codificarTrechos,
  decodificarTrechos,
  destinoBloqueado,
  filtrarTokensPelaNevoa,
  normalizarNevoa,
  normalizarParedes,
  passoBloqueado,
  segmentosDeContorno,
  tokenCobertoPelaNevoa,
  trechosDasCelulas,
} from './gridCamadas';

const conjunto = (...pares) =>
  new Set(pares.map(([col, lin]) => chaveDaCelula(col, lin)));
const LIMITES = { colunas: 10, linhas: 10 };

describe('trechos', () => {
  it('codifica e decodifica ida e volta', () => {
    const celulas = conjunto(
      [5, 3],
      [8, 3],
      [9, 3],
      [10, 3],
      [11, 3],
      [12, 3],
      [0, 4],
    );
    const texto = codificarTrechos(celulas);
    expect(texto).toBe('3:5,8-12;4:0');
    expect(decodificarTrechos(texto)).toEqual(celulas);
    expect(codificarTrechos(new Set())).toBe('');
  });

  it('descarta lixo e o que está fora dos limites, e recorta trechos longos', () => {
    const texto = 'x;3:2-4,abc,7-5,1-2-3;-1:2;4:8-20;12:0;:3;5:';
    expect([...decodificarTrechos(texto, LIMITES)].sort()).toEqual(
      ['2,3', '3,3', '4,3', '8,4', '9,4'].sort(),
    );
    expect(decodificarTrechos(null).size).toBe(0);
    expect(decodificarTrechos(42).size).toBe(0);
  });

  it('limita ao mundo padrão de 500 × 500 e mescla trechos repetidos', () => {
    expect(decodificarTrechos('0:499-9999').size).toBe(1);
    expect(decodificarTrechos('500:0').size).toBe(0);
    expect(codificarTrechos(decodificarTrechos('1:0-2;1:2-4;1:5'))).toBe(
      '1:0-5',
    );
  });

  it('normaliza os documentos', () => {
    expect(normalizarParedes({ trechos: '0:1' })).toEqual(conjunto([1, 0]));
    expect(normalizarParedes(null).size).toBe(0);
    expect(normalizarNevoa({ ativa: true, trechos: '2:3' })).toEqual({
      ativa: true,
      reveladas: conjunto([3, 2]),
    });
    expect(normalizarNevoa({ ativa: 'sim' }).ativa).toBe(false);
    expect(normalizarNevoa(undefined).reveladas.size).toBe(0);
  });

  it('trechosDasCelulas agrupa por linha e recorta ao mundo', () => {
    const celulas = conjunto([0, 0], [1, 0], [3, 0], [0, 2], [11, 2]);
    expect(trechosDasCelulas(celulas)).toEqual([
      { lin: 0, col: 0, colunas: 2 },
      { lin: 0, col: 3, colunas: 1 },
      { lin: 2, col: 0, colunas: 1 },
      { lin: 2, col: 11, colunas: 1 },
    ]);
    expect(trechosDasCelulas(celulas, LIMITES)).toHaveLength(3);
  });
});

describe('pincel, retângulo e aplicação', () => {
  it('pincel 1, 2 e 3', () => {
    expect(celulasDoPincel({ col: 4, lin: 4 }, 1, LIMITES)).toEqual([
      { col: 4, lin: 4 },
    ]);
    expect(celulasDoPincel({ col: 4, lin: 4 }, 2, LIMITES)).toEqual([
      { col: 4, lin: 4 },
      { col: 5, lin: 4 },
      { col: 4, lin: 5 },
      { col: 5, lin: 5 },
    ]);
    const tres = celulasDoPincel({ col: 4, lin: 4 }, 3, LIMITES);
    expect(tres).toHaveLength(9);
    expect(tres[0]).toEqual({ col: 3, lin: 3 });
    expect(tres[8]).toEqual({ col: 5, lin: 5 });
  });

  it('pincel recorta nas bordas', () => {
    expect(celulasDoPincel({ col: 0, lin: 0 }, 3, LIMITES)).toHaveLength(4);
    expect(celulasDoPincel({ col: 9, lin: 9 }, 2, LIMITES)).toEqual([
      { col: 9, lin: 9 },
    ]);
    expect(celulasDoPincel({ col: 12, lin: 0 }, 1, LIMITES)).toEqual([]);
  });

  it('retângulo invertido e recortado', () => {
    const celulas = celulasDoRetangulo(
      { col: 3, lin: 2 },
      { col: 1, lin: 1 },
      LIMITES,
    );
    expect(celulas).toHaveLength(6);
    expect(celulas).toContainEqual({ col: 1, lin: 1 });
    expect(celulas).toContainEqual({ col: 3, lin: 2 });
    expect(
      celulasDoRetangulo({ col: 8, lin: 8 }, { col: 15, lin: 15 }, LIMITES),
    ).toHaveLength(4);
    expect(
      celulasDoRetangulo({ col: -2, lin: 0 }, { col: 0, lin: 0 }, LIMITES),
    ).toEqual([{ col: 0, lin: 0 }]);
  });

  it('aplicarCelulas devolve um Set novo', () => {
    const base = conjunto([1, 1]);
    const mais = aplicarCelulas(
      base,
      [{ col: 2, lin: 2 }],
      ACOES_CAMADA.ADICIONAR,
    );
    expect(mais).toEqual(conjunto([1, 1], [2, 2]));
    expect(base.size).toBe(1);
    const menos = aplicarCelulas(
      mais,
      [{ col: 1, lin: 1 }],
      ACOES_CAMADA.REMOVER,
    );
    expect(menos).toEqual(conjunto([2, 2]));
  });
});

describe('paredes', () => {
  it('areaBloqueada e destinoBloqueado olham a área inteira do token', () => {
    const paredes = conjunto([3, 3]);
    expect(areaBloqueada(paredes, 3, 3)).toBe(true);
    expect(areaBloqueada(paredes, 2, 2, 2)).toBe(true);
    expect(areaBloqueada(paredes, 1, 1, 2)).toBe(false);
    expect(areaBloqueada(null, 3, 3)).toBe(false);
    expect(destinoBloqueado(2, 3, 2, paredes)).toBe(true);
    expect(destinoBloqueado(0, 0, 1, paredes)).toBe(false);
  });

  it('passo reto', () => {
    const paredes = conjunto([1, 0]);
    expect(
      passoBloqueado({ col: 0, lin: 0 }, { col: 1, lin: 0 }, 1, paredes),
    ).toBe(true);
    expect(
      passoBloqueado({ col: 0, lin: 0 }, { col: 0, lin: 1 }, 1, paredes),
    ).toBe(false);
    expect(
      passoBloqueado({ col: 0, lin: 0 }, { col: 1, lin: 0 }, 1, null),
    ).toBe(false);
  });

  it('passo diagonal: 0, 1 ou 2 lados bloqueados', () => {
    const de = { col: 0, lin: 0 };
    const para = { col: 1, lin: 1 };
    expect(passoBloqueado(de, para, 1, conjunto([5, 5]))).toBe(false);
    expect(passoBloqueado(de, para, 1, conjunto([1, 0]))).toBe(false);
    expect(passoBloqueado(de, para, 1, conjunto([0, 1]))).toBe(false);
    expect(passoBloqueado(de, para, 1, conjunto([1, 0], [0, 1]))).toBe(true);
    expect(passoBloqueado(de, para, 1, conjunto([1, 1]))).toBe(true);
  });

  it('token 2×2 considera a área inteira', () => {
    const paredes = conjunto([3, 1]);
    expect(
      passoBloqueado({ col: 0, lin: 0 }, { col: 1, lin: 0 }, 2, paredes),
    ).toBe(false);
    expect(
      passoBloqueado({ col: 1, lin: 0 }, { col: 2, lin: 0 }, 2, paredes),
    ).toBe(true);
  });

  it('caminho atravessando parede é bloqueado', () => {
    const paredes = conjunto([2, 0]);
    const livre = [
      { col: 0, lin: 0 },
      { col: 0, lin: 1 },
      { col: 1, lin: 1 },
    ];
    const barrado = [
      { col: 0, lin: 0 },
      { col: 1, lin: 0 },
      { col: 2, lin: 0 },
    ];
    expect(caminhoBloqueado(livre, 1, paredes)).toBe(false);
    expect(caminhoBloqueado(barrado, 1, paredes)).toBe(true);
    expect(caminhoBloqueado([{ col: 0, lin: 0 }], 1, paredes)).toBe(false);
    expect(caminhoBloqueado(barrado, 1, null)).toBe(false);
  });

  it('origem em parede não bloqueia a saída', () => {
    const paredes = conjunto([0, 0]);
    expect(
      caminhoBloqueado(
        [
          { col: 0, lin: 0 },
          { col: 1, lin: 0 },
        ],
        1,
        paredes,
      ),
    ).toBe(false);
  });

  it('interpola saltos de mais de uma célula', () => {
    const paredes = conjunto([2, 0]);
    expect(
      caminhoBloqueado(
        [
          { col: 0, lin: 0 },
          { col: 4, lin: 0 },
        ],
        1,
        paredes,
      ),
    ).toBe(true);
    expect(
      caminhoBloqueado(
        [
          { col: 0, lin: 0 },
          { col: 4, lin: 1 },
        ],
        1,
        conjunto([2, 3]),
      ),
    ).toBe(false);
  });
});

describe('névoa', () => {
  const nevoa = { ativa: true, reveladas: conjunto([2, 2]) };

  it('token coberto, revelado e parcialmente revelado', () => {
    expect(tokenCobertoPelaNevoa({ col: 0, lin: 0 }, nevoa)).toBe(true);
    expect(tokenCobertoPelaNevoa({ col: 2, lin: 2 }, nevoa)).toBe(false);
    expect(tokenCobertoPelaNevoa({ col: 1, lin: 1, tamanho: 2 }, nevoa)).toBe(
      false,
    );
    expect(tokenCobertoPelaNevoa({ col: 3, lin: 3, tamanho: 2 }, nevoa)).toBe(
      true,
    );
  });

  it('névoa desligada ou ausente não cobre', () => {
    expect(
      tokenCobertoPelaNevoa({ col: 0, lin: 0 }, { ...nevoa, ativa: false }),
    ).toBe(false);
    expect(tokenCobertoPelaNevoa({ col: 0, lin: 0 }, null)).toBe(false);
  });

  it('filtrar mantém os próprios tokens', () => {
    const tokens = [
      { id: 'a', col: 0, lin: 0 },
      { id: 'b', col: 2, lin: 2 },
      { id: 'c', col: 5, lin: 5 },
    ];
    const ehMeu = token => token.id === 'c';
    expect(filtrarTokensPelaNevoa(tokens, nevoa, ehMeu).map(t => t.id)).toEqual(
      ['b', 'c'],
    );
    expect(
      filtrarTokensPelaNevoa(tokens, { ...nevoa, ativa: false }, ehMeu),
    ).toBe(tokens);
  });
});

describe('celulasDaSala', () => {
  // Sala 3×3 (colunas 1..3, linhas 1..3) cercada por paredes de 0..4.
  const cercar = () => {
    const paredes = new Set();
    for (let i = 0; i <= 4; i += 1) {
      paredes.add(chaveDaCelula(i, 0));
      paredes.add(chaveDaCelula(i, 4));
      paredes.add(chaveDaCelula(0, i));
      paredes.add(chaveDaCelula(4, i));
    }
    return paredes;
  };
  const chaves = celulas => celulas.map(c => chaveDaCelula(c.col, c.lin)).sort();

  it('sala fechada: cobre só o interior, de qualquer célula dele', () => {
    const paredes = cercar();
    const { celulas, estourou } = celulasDaSala({ col: 2, lin: 2 }, paredes, {
      cols: 20,
      lins: 20,
    });
    expect(estourou).toBe(false);
    expect(celulas).toHaveLength(9);
    expect(chaves(celulas)).toEqual(
      chaves(celulasDoRetangulo({ col: 1, lin: 1 }, { col: 3, lin: 3 })),
    );
    expect(chaves(celulasDaSala({ col: 1, lin: 3 }, paredes, { cols: 20, lins: 20 }).celulas)).toEqual(
      chaves(celulas),
    );
  });

  it('a diagonal entre duas paredes não vaza (4 direções)', () => {
    const paredes = new Set([chaveDaCelula(1, 0), chaveDaCelula(0, 1)]);
    const { celulas } = celulasDaSala({ col: 0, lin: 0 }, paredes, { cols: 5, lins: 5 });
    expect(chaves(celulas)).toEqual(['0,0']);
  });

  it('porta aberta: a sala vaza para o mapa e estoura o limite', () => {
    const paredes = cercar();
    paredes.delete(chaveDaCelula(4, 2));
    const resultado = celulasDaSala({ col: 2, lin: 2 }, paredes, {
      cols: 60,
      lins: 60,
      limite: 100,
    });
    expect(resultado).toEqual({ celulas: [], estourou: true });
    // Com o limite folgado o mapa todo (menos as paredes) é a "sala".
    const folgado = celulasDaSala({ col: 2, lin: 2 }, paredes, { cols: 12, lins: 12, limite: 2000 });
    expect(folgado.estourou).toBe(false);
    expect(folgado.celulas.length).toBeGreaterThan(9);
  });

  it('exatamente no limite ainda vale; um a mais estoura', () => {
    const paredes = cercar();
    expect(celulasDaSala({ col: 2, lin: 2 }, paredes, { cols: 20, lins: 20, limite: 9 }).estourou).toBe(false);
    expect(celulasDaSala({ col: 2, lin: 2 }, paredes, { cols: 20, lins: 20, limite: 8 }).estourou).toBe(true);
  });

  it('para na borda do mapa', () => {
    const { celulas, estourou } = celulasDaSala({ col: 0, lin: 0 }, new Set(), {
      cols: 3,
      lins: 2,
    });
    expect(estourou).toBe(false);
    expect(chaves(celulas)).toEqual(['0,0', '0,1', '1,0', '1,1', '2,0', '2,1']);
  });

  it('célula inicial sobre parede ou fora do mapa: nada', () => {
    const paredes = cercar();
    expect(celulasDaSala({ col: 0, lin: 0 }, paredes, { cols: 20, lins: 20 })).toEqual({
      celulas: [],
      estourou: false,
    });
    expect(celulasDaSala({ col: 25, lin: 0 }, paredes, { cols: 20, lins: 20 }).celulas).toEqual([]);
    expect(celulasDaSala(null, paredes).celulas).toEqual([]);
  });

  it('sem paredes e mapa grande demais: estoura em vez de cobrir tudo', () => {
    expect(celulasDaSala({ col: 5, lin: 5 }, new Set(), { cols: 100, lins: 100 })).toEqual({
      celulas: [],
      estourou: true,
    });
  });
});

describe('desenho', () => {
  it('segmentosDeContorno: quadrado tem 4 arestas', () => {
    const segmentos = segmentosDeContorno(conjunto([2, 3]));
    expect(segmentos).toHaveLength(4);
    expect(segmentos).toContainEqual({ c1: 2, l1: 3, c2: 3, l2: 3 });
    expect(segmentos).toContainEqual({ c1: 2, l1: 4, c2: 3, l2: 4 });
    expect(segmentos).toContainEqual({ c1: 2, l1: 3, c2: 2, l2: 4 });
    expect(segmentos).toContainEqual({ c1: 3, l1: 3, c2: 3, l2: 4 });
  });

  it('segmentosDeContorno: dois lado a lado fundem; L tem só o contorno externo', () => {
    expect(segmentosDeContorno(conjunto([0, 0], [1, 0]))).toHaveLength(4);
    const ele = segmentosDeContorno(conjunto([0, 0], [0, 1], [1, 1]));
    expect(ele).toHaveLength(6);
    expect(ele).toContainEqual({ c1: 0, l1: 0, c2: 0, l2: 2 });
    expect(ele).toContainEqual({ c1: 0, l1: 2, c2: 2, l2: 2 });
    expect(ele).toContainEqual({ c1: 1, l1: 1, c2: 2, l2: 1 });
    expect(segmentosDeContorno(new Set())).toEqual([]);
  });

  it('caminhoSvgDeTrechos: um retângulo por trecho em px do mundo', () => {
    const config = { celula: 50, deslocamentoX: 10, deslocamentoY: 20 };
    expect(
      caminhoSvgDeTrechos(config, [
        { col: 1, lin: 2, colunas: 3 },
        { col: 0, lin: 0, colunas: 1 },
      ]),
    ).toBe('M 60 120 h 150 v 50 h -150 z M 10 20 h 50 v 50 h -50 z');
    expect(caminhoSvgDeTrechos(config, [])).toBe('');
  });
});
