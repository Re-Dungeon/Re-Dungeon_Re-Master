import { describe, expect, it } from 'vitest';

import {
  ajustarRecursoAtual,
  recursoDigitadoAtual,
  valorDigitadoDoRecurso,
  GRID_CONFIG_PADRAO,
  GRID_SEM_IMAGEM,
  RASTRO_VERTICES_MAX,
  TIPOS_TOKEN,
  avancarCaminho,
  celulaMaisProxima,
  celulaNoPonto,
  centroDaCelula,
  chaveDoMovimento,
  configDoGrid,
  detectarMovimentos,
  distanciaChebyshev,
  distanciaDoRastro,
  encadearRastro,
  formatarDistancia,
  formatarMetros,
  limitarRastro,
  linhaChebyshev,
  mesmaCelula,
  montarRastro,
  normalizarRastro,
  rastrosIguais,
  simplificarCaminho,
  dimensoesDoMundo,
  limitarPosicao,
  montarCena,
  montarToken,
  nomeDaCena,
  nomeDaCopia,
  ordenarCenas,
  vistaFocadaNoToken,
  validarNomeCena,
  normalizarConfigGrid,
  ordenarTokens,
  podeMoverToken,
  posicaoEmPx,
  primeiraCelulaLivre,
  validarConfigGrid,
  validarToken,
  COR_PING_MESTRE,
  CORES_PING,
  PING_COORDENADA_MAX,
  RECURSO_MAX,
  TOKEN_CONDICOES_MAX,
  areaDaAura,
  centralizarVista,
  condicoesDoToken,
  corDaBarra,
  corDoPing,
  DESLOCAMENTO_PADRAO,
  TRAVAMENTOS,
  deslocamentoDoToken,
  detalhesDosTokens,
  normalizarCondicoesDuracao,
  normalizarDeslocamento,
  rodadasRestantes,
  normalizarMultiplicadorCorrida,
  normalizarTravamento,
  prontidaoDaFicha,
  detectarPings,
  distanciaEntreTokens,
  escolherReferencia,
  fracaoDaBarra,
  normalizarAura,
  normalizarCondicoesDoToken,
  normalizarModoRecursos,
  normalizarPing,
  normalizarRecurso,
  recursosDaFicha,
  recursosDoToken,
  recursosIniciais,
} from './grid';

const config = {
  ...GRID_CONFIG_PADRAO,
  celula: 50,
  deslocamentoX: 10,
  deslocamentoY: 20,
};

describe('configDoGrid', () => {
  it('sem doc usa o padrão', () => {
    expect(configDoGrid(null)).toEqual(GRID_CONFIG_PADRAO);
  });

  it('mantém só os campos conhecidos', () => {
    const resultado = configDoGrid({ celula: 70, updatedAt: 'x', lixo: 1 });
    expect(resultado.celula).toBe(70);
    expect(resultado).not.toHaveProperty('lixo');
    expect(resultado).not.toHaveProperty('updatedAt');
  });
});

describe('normalizarConfigGrid / validarConfigGrid', () => {
  const valores = {
    imagemUrl: '  https://exemplo.com/mapa.png ',
    celula: '64',
    deslocamentoX: '3',
    deslocamentoY: '',
    mostrarGrade: true,
    corGrade: '#00ff00',
    opacidadeGrade: 0.5,
  };

  it('normaliza números e URL', () => {
    expect(normalizarConfigGrid(valores)).toEqual({
      imagemUrl: 'https://exemplo.com/mapa.png',
      celula: 64,
      deslocamentoX: 3,
      deslocamentoY: 0,
      mostrarGrade: true,
      corGrade: '#00ff00',
      opacidadeGrade: 0.5,
      metrosPorQuadrado: 1.5,
      multiplicadorCorrida: 2,
    });
    expect(normalizarConfigGrid({ ...valores, imagemUrl: '   ' }).imagemUrl).toBeNull();
  });

  it('metros por quadrado: padrão 1,5, aceita vírgula e valida a faixa', () => {
    expect(GRID_CONFIG_PADRAO.metrosPorQuadrado).toBe(1.5);
    expect(configDoGrid({ celula: 50 }).metrosPorQuadrado).toBe(1.5);
    const metros = valor =>
      normalizarConfigGrid({ ...valores, metrosPorQuadrado: valor }).metrosPorQuadrado;
    expect(metros('2,5')).toBe(2.5);
    expect(metros(3)).toBe(3);
    expect(metros(null)).toBe(1.5);
    const base = normalizarConfigGrid(valores);
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: metros('') })).toMatch(
      /Metros/,
    );
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: 0.05 })).toMatch(/Metros/);
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: 101 })).toMatch(/Metros/);
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: 0.1 })).toBeNull();
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: 100 })).toBeNull();
    // Cena antiga, sem o campo: vale o padrão.
    const antiga = { ...base };
    delete antiga.metrosPorQuadrado;
    expect(validarConfigGrid(antiga)).toBeNull();
  });

  it('aceita config válida (com e sem imagem)', () => {
    expect(validarConfigGrid(normalizarConfigGrid(valores))).toBeNull();
    expect(validarConfigGrid(GRID_CONFIG_PADRAO)).toBeNull();
  });

  it('recusa link não-https, célula fora da faixa, cor e opacidade inválidas', () => {
    const base = normalizarConfigGrid(valores);
    expect(validarConfigGrid({ ...base, imagemUrl: 'http://x.com/a.png' })).toMatch(
      /https/,
    );
    expect(validarConfigGrid({ ...base, celula: 5 })).toMatch(/célula/);
    expect(validarConfigGrid({ ...base, celula: 401 })).toMatch(/célula/);
    expect(validarConfigGrid({ ...base, deslocamentoX: -1 })).toMatch(/deslocamento/);
    expect(validarConfigGrid({ ...base, corGrade: 'red' })).toMatch(/Cor/);
    expect(validarConfigGrid({ ...base, opacidadeGrade: 2 })).toMatch(/Opacidade/);
  });
});

describe('dimensoesDoMundo / posições', () => {
  it('com imagem conta as células a partir do deslocamento', () => {
    expect(dimensoesDoMundo(config, { largura: 1010, altura: 520 })).toEqual({
      largura: 1010,
      altura: 520,
      colunas: 20,
      linhas: 10,
    });
  });

  it('sem imagem usa a área padrão', () => {
    const mundo = dimensoesDoMundo(config, null);
    expect(mundo.colunas).toBe(GRID_SEM_IMAGEM.colunas);
    expect(mundo.largura).toBe(10 + GRID_SEM_IMAGEM.colunas * 50);
  });

  it('converte célula ↔ px', () => {
    expect(posicaoEmPx(config, 2, 3)).toEqual({ x: 110, y: 170 });
    const limites = { colunas: 20, linhas: 10 };
    expect(celulaMaisProxima(config, 110, 170, limites)).toEqual({ col: 2, lin: 3 });
    // Solto um pouco além da metade da célula → arredonda para a próxima.
    expect(celulaMaisProxima(config, 140, 170, limites)).toEqual({ col: 3, lin: 3 });
  });

  it('foca no token com célula de pelo menos 44px de tela, centrado no viewport', () => {
    const viewport = { largura: 360, altura: 600 };
    const vista = vistaFocadaNoToken({
      config,
      token: { col: 2, lin: 3 },
      viewport,
      zoomEncaixe: 0.3,
      zoomMax: 4,
    });
    expect(vista.zoom).toBeCloseTo(44 / 50);
    // Centro do token (110 + 25, 170 + 25) cai no centro do viewport.
    expect(vista.x + 135 * vista.zoom).toBeCloseTo(180);
    expect(vista.y + 195 * vista.zoom).toBeCloseTo(300);
  });

  it('ao focar, não afasta além do encaixe, respeita o zoom máximo e o tamanho do token', () => {
    const viewport = { largura: 400, altura: 400 };
    const base = { config, viewport, zoomMax: 4 };
    expect(
      vistaFocadaNoToken({ ...base, token: { col: 0, lin: 0 }, zoomEncaixe: 1.5 }).zoom,
    ).toBe(1.5);
    expect(
      vistaFocadaNoToken({
        ...base,
        token: { col: 0, lin: 0 },
        zoomEncaixe: 0.1,
        zoomMax: 0.5,
      }).zoom,
    ).toBe(0.5);
    // Token 2×2 em (0,0): centro em (10 + 50, 20 + 50).
    const grande = vistaFocadaNoToken({
      ...base,
      token: { col: 0, lin: 0, tamanho: 2 },
      zoomEncaixe: 1,
    });
    expect(grande.x + 60 * grande.zoom).toBeCloseTo(200);
    expect(grande.y + 70 * grande.zoom).toBeCloseTo(200);
  });

  it('mantém o token inteiro dentro do grid', () => {
    const limites = { colunas: 20, linhas: 10 };
    expect(limitarPosicao(-3, 50, limites)).toEqual({ col: 0, lin: 9 });
    expect(limitarPosicao(19, 9, limites, 3)).toEqual({ col: 17, lin: 7 });
    expect(limitarPosicao(5, 5, { colunas: 2, linhas: 2 }, 4)).toEqual({
      col: 0,
      lin: 0,
    });
  });
});

describe('podeMoverToken', () => {
  const token = { donos: ['u1'] };

  it('mestre move qualquer token', () => {
    expect(podeMoverToken({ donos: [] }, 'm1', true)).toBe(true);
  });

  it('jogador só move os atribuídos a ele', () => {
    expect(podeMoverToken(token, 'u1', false)).toBe(true);
    expect(podeMoverToken(token, 'u2', false)).toBe(false);
    expect(podeMoverToken({}, 'u1', false)).toBe(false);
    expect(podeMoverToken(token, null, false)).toBe(false);
  });
});

describe('primeiraCelulaLivre', () => {
  const limites = { colunas: 4, linhas: 3 };

  it('grid vazio → canto', () => {
    expect(primeiraCelulaLivre([], 1, limites)).toEqual({ col: 0, lin: 0 });
  });

  it('pula células ocupadas, considerando o tamanho', () => {
    const tokens = [{ col: 0, lin: 0, tamanho: 2 }];
    expect(primeiraCelulaLivre(tokens, 1, limites)).toEqual({ col: 2, lin: 0 });
    expect(primeiraCelulaLivre(tokens, 2, limites)).toEqual({ col: 2, lin: 0 });
    expect(
      primeiraCelulaLivre([...tokens, { col: 2, lin: 0, tamanho: 2 }], 2, {
        colunas: 4,
        linhas: 4,
      }),
    ).toEqual({ col: 0, lin: 2 });
  });

  it('grid lotado → canto', () => {
    expect(primeiraCelulaLivre([{ col: 0, lin: 0, tamanho: 4 }], 1, limites)).toEqual({
      col: 0,
      lin: 0,
    });
  });
});

describe('montarToken / validarToken', () => {
  it('normaliza nome, imagem e donos', () => {
    const token = montarToken({
      nome: '  Goblin ',
      imagemUrl: 'javascript:alert(1)',
      tipo: TIPOS_TOKEN.CRIATURA,
      donos: ['u1', 'u1', null, 'u2'],
    });
    expect(token).toEqual({
      nome: 'Goblin',
      imagemUrl: null,
      tipo: 'criatura',
      refId: null,
      donos: ['u1', 'u2'],
      tamanho: 1,
      oculto: false,
      col: 0,
      lin: 0,
    });
    expect(validarToken(token)).toBeNull();
  });

  it('com recursos, grava só os recursos presentes', () => {
    const base = { nome: 'Ogro', tipo: TIPOS_TOKEN.CRIATURA };
    expect(montarToken({ ...base, recursos: null })).toEqual(montarToken(base));
    expect(
      montarToken({
        ...base,
        recursos: { pv: { atual: 20, max: 20 }, fadiga: { atual: 5, max: 5 } },
      }),
    ).toEqual({
      ...montarToken(base),
      pv: { atual: 20, max: 20 },
      fadiga: { atual: 5, max: 5 },
    });
  });

  it('recusa nome vazio, tipo e tamanho inválidos', () => {
    const base = montarToken({ nome: 'X', tipo: TIPOS_TOKEN.AVULSO });
    expect(validarToken({ ...base, nome: '' })).toMatch(/nome/);
    expect(validarToken({ ...base, tipo: 'dragao' })).toMatch(/Tipo/);
    expect(validarToken({ ...base, tamanho: 11 })).toMatch(/tamanho/);
    expect(validarToken({ ...base, tamanho: 1.5 })).toMatch(/tamanho/);
    expect(validarToken({ ...base, col: -1 })).toMatch(/Posição/);
  });
});

describe('cenas', () => {
  it('montarCena usa a configuração padrão e descarta imagem inválida', () => {
    expect(montarCena({ nome: '  Taverna ', imagemUrl: 'https://ex.com/t.png' })).toEqual(
      {
        ...GRID_CONFIG_PADRAO,
        nome: 'Taverna',
        imagemUrl: 'https://ex.com/t.png',
      },
    );
    expect(montarCena({ nome: 'X', imagemUrl: 'ftp://x' }).imagemUrl).toBeNull();
  });

  it('valida o nome', () => {
    expect(validarNomeCena('  ')).toMatch(/nome/);
    expect(validarNomeCena('a'.repeat(101))).toMatch(/100/);
    expect(validarNomeCena('Masmorra')).toBeNull();
  });

  it('nome exibido e nome da cópia', () => {
    expect(nomeDaCena({ nome: '' })).toBe('Cena sem nome');
    expect(nomeDaCopia('Taverna')).toBe('Taverna (cópia)');
    expect(nomeDaCopia('a'.repeat(100))).toHaveLength(100);
  });

  it('ordena pela criação; a recém-criada (sem data ainda) vai para o fim', () => {
    const ordenadas = ordenarCenas([
      { id: 'nova', nome: 'Nova', createdAt: null },
      { id: 'b', nome: 'B', createdAt: { toMillis: () => 20 } },
      { id: 'a', nome: 'A', createdAt: new Date(10) },
    ]);
    expect(ordenadas.map(cena => cena.id)).toEqual(['a', 'b', 'nova']);
  });
});

describe('ordenarTokens', () => {
  it('maiores primeiro, depois por nome', () => {
    const ordenados = ordenarTokens([
      { nome: 'b', tamanho: 1 },
      { nome: 'Dragão', tamanho: 3 },
      { nome: 'a', tamanho: 1 },
    ]);
    expect(ordenados.map(token => token.nome)).toEqual(['Dragão', 'a', 'b']);
  });
});

const celula = (col, lin) => ({ col, lin });
const celulas = (...pares) => pares.map(([col, lin]) => celula(col, lin));

describe('distância e caminho', () => {
  it('distanciaChebyshev: diagonal conta 1', () => {
    expect(distanciaChebyshev(celula(0, 0), celula(3, 1))).toBe(3);
    expect(distanciaChebyshev(celula(2, 2), celula(2, 2))).toBe(0);
    expect(distanciaChebyshev(celula(0, 0), celula(2, 2))).toBe(2);
    expect(mesmaCelula(celula(1, 2), celula(1, 2))).toBe(true);
    expect(mesmaCelula(celula(1, 2), null)).toBe(false);
  });

  it('linhaChebyshev: passos adjacentes até o destino (inclusive)', () => {
    expect(linhaChebyshev(celula(0, 0), celula(3, 1))).toEqual(
      celulas([1, 0], [2, 1], [3, 1]),
    );
    const inversa = linhaChebyshev(celula(3, 1), celula(0, 0));
    expect(inversa).toHaveLength(3);
    expect(inversa[inversa.length - 1]).toEqual(celula(0, 0));
    [celula(3, 1), ...inversa].forEach((passo, i, todos) => {
      if (i > 0) expect(distanciaChebyshev(todos[i - 1], passo)).toBe(1);
    });
    expect(linhaChebyshev(celula(4, 4), celula(4, 4))).toEqual([]);
  });

  it('avancarCaminho: acrescenta, interpola saltos e corta laços', () => {
    const inicio = celulas([0, 0]);
    expect(avancarCaminho(inicio, celula(1, 0))).toEqual(celulas([0, 0], [1, 0]));
    // Salto de 4 células (ponteiro rápido) vira 4 passos.
    expect(avancarCaminho(inicio, celula(4, 0))).toEqual(
      celulas([0, 0], [1, 0], [2, 0], [3, 0], [4, 0]),
    );
    // Voltar a uma célula do caminho corta o que veio depois dela.
    const ida = celulas([0, 0], [1, 0], [2, 0], [2, 1]);
    expect(avancarCaminho(ida, celula(2, 0))).toEqual(celulas([0, 0], [1, 0], [2, 0]));
    expect(avancarCaminho(ida, celula(0, 0))).toEqual(celulas([0, 0]));
    // Laço fechado por um salto que passa por (1,1) no meio; (0,1) já é
    // vizinho de (0,0), então (1,1) também sai.
    expect(avancarCaminho(celulas([0, 0], [1, 1], [2, 1], [3, 1]), celula(0, 1))).toEqual(
      celulas([0, 0], [0, 1]),
    );
    // Arrasto quase diagonal: o ponteiro cruza a coluna antes da linha e passa
    // por (1,0) a caminho de (1,1) — a quina não conta como passo.
    const quina = avancarCaminho(celulas([0, 0]), celula(1, 0));
    expect(avancarCaminho(quina, celula(1, 1))).toEqual(celulas([0, 0], [1, 1]));
    const diagonal = [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
      [3, 2],
      [3, 3],
    ].reduce((caminho, [c, l]) => avancarCaminho(caminho, celula(c, l)), celulas([0, 0]));
    expect(diagonal).toEqual(celulas([0, 0], [1, 1], [2, 2], [3, 3]));
    // Mesma célula do fim → mesma referência.
    expect(avancarCaminho(ida, celula(2, 1))).toBe(ida);
    expect(avancarCaminho([], celula(3, 3))).toEqual(celulas([3, 3]));
  });

  it('simplificarCaminho: colapsa trechos retos/diagonais sem mudar a distância', () => {
    const caminho = celulas([0, 0], [1, 0], [2, 0], [3, 1], [4, 2], [4, 3]);
    const simples = simplificarCaminho(caminho);
    expect(simples).toEqual(celulas([0, 0], [2, 0], [4, 2], [4, 3]));
    expect(distanciaDoRastro(simples)).toBe(5);
    expect(distanciaDoRastro(caminho)).toBe(5);
    expect(simplificarCaminho(celulas([1, 1], [1, 1], [2, 1], [2, 1]))).toEqual(
      celulas([1, 1], [2, 1]),
    );
    expect(simplificarCaminho(celulas([5, 5]))).toEqual(celulas([5, 5]));
    // Ida e volta não é colapsada.
    expect(simplificarCaminho(celulas([0, 0], [1, 0], [0, 0]))).toEqual(
      celulas([0, 0], [1, 0], [0, 0]),
    );
  });

  it('distanciaDoRastro e limitarRastro', () => {
    expect(distanciaDoRastro(celulas([0, 0], [3, 1], [3, 4]))).toBe(6);
    expect(distanciaDoRastro(null)).toBe(0);
    expect(distanciaDoRastro(celulas([2, 2]))).toBe(0);
    const longo = Array.from({ length: 60 }, (_, i) => celula(i, i % 2));
    const limitado = limitarRastro(longo);
    expect(limitado).toHaveLength(RASTRO_VERTICES_MAX);
    expect(limitado[0]).toEqual(longo[10]);
    expect(limitado[limitado.length - 1]).toEqual(longo[59]);
  });

  it('encadearRastro / montarRastro', () => {
    expect(encadearRastro(celulas([0, 0], [1, 0]), celulas([1, 0], [2, 0]))).toEqual(
      celulas([0, 0], [1, 0], [2, 0]),
    );
    // Não começa onde o anterior terminou → substitui.
    expect(encadearRastro(celulas([0, 0], [1, 0]), celulas([5, 5], [6, 5]))).toEqual(
      celulas([5, 5], [6, 5]),
    );
    expect(encadearRastro(null, celulas([1, 1], [1, 2]))).toEqual(
      celulas([1, 1], [1, 2]),
    );
    expect(montarRastro(celulas([0, 0], [1, 0]), celulas([1, 0], [2, 0]))).toEqual(
      celulas([0, 0], [2, 0]),
    );
    // Ida e volta mantém as duas pernas.
    const idaEVolta = montarRastro(celulas([0, 0], [1, 0]), celulas([1, 0], [0, 0]));
    expect(distanciaDoRastro(idaEVolta)).toBe(2);
    expect(montarRastro(null, celulas([2, 3], [3, 3], [4, 4]))).toEqual(
      celulas([2, 3], [3, 3], [4, 4]),
    );
  });

  it('normalizarRastro sanitiza o que vem do Firestore', () => {
    expect(normalizarRastro(null)).toBeNull();
    expect(normalizarRastro('x')).toBeNull();
    expect(normalizarRastro(celulas([1, 1]))).toBeNull();
    expect(normalizarRastro([celula(1, 1), { col: 'a', lin: 2 }])).toBeNull();
    expect(normalizarRastro([celula(1, 1), null])).toBeNull();
    expect(normalizarRastro(celulas([1, 1], [501, 2]))).toBeNull();
    expect(normalizarRastro(celulas([1, 1], [-1, 2]))).toBeNull();
    expect(normalizarRastro(celulas([1, 1.5], [2, 2]))).toBeNull();
    expect(normalizarRastro([{ col: 1, lin: 1, extra: true }, celula(2, 2)])).toEqual(
      celulas([1, 1], [2, 2]),
    );
    const longo = Array.from({ length: 60 }, (_, i) => celula(i, 0));
    expect(normalizarRastro(longo)).toHaveLength(RASTRO_VERTICES_MAX);
  });

  it('rastrosIguais', () => {
    expect(rastrosIguais(celulas([1, 1], [2, 2]), celulas([1, 1], [2, 2]))).toBe(true);
    expect(rastrosIguais(celulas([1, 1], [2, 2]), celulas([1, 1], [2, 3]))).toBe(false);
    expect(rastrosIguais(celulas([1, 1]), celulas([1, 1], [2, 2]))).toBe(false);
    expect(rastrosIguais(null, celulas([1, 1]))).toBe(false);
    expect(rastrosIguais(null, null)).toBe(true);
  });

  it('centroDaCelula e celulaNoPonto', () => {
    expect(centroDaCelula(config, 2, 3)).toEqual({ x: 135, y: 195 });
    expect(centroDaCelula(config, 0, 0, 2)).toEqual({ x: 60, y: 70 });
    const limites = { colunas: 20, linhas: 10 };
    expect(celulaNoPonto(config, 135, 195, limites)).toEqual(celula(2, 3));
    // Até a borda da célula ainda é ela (floor, não arredonda).
    expect(celulaNoPonto(config, 159, 219, limites)).toEqual(celula(2, 3));
    expect(celulaNoPonto(config, -50, 9999, limites)).toEqual(celula(0, 9));
  });

  it('formata metros e distância', () => {
    expect(formatarDistancia(4, 1.5)).toBe('4 q · 6 m');
    expect(formatarDistancia(3, 1.5)).toBe('3 q · 4,5 m');
    expect(formatarDistancia(3)).toBe('3 q · 4,5 m');
    expect(formatarDistancia(2, 2)).toBe('2 q · 4 m');
    expect(formatarMetros(3 * 0.1)).toBe('0,3');
    expect(formatarMetros(3 * 1.25)).toBe('3,75');
    expect(formatarMetros(1 / 3)).toBe('0,33');
  });

  it('chaveDoMovimento', () => {
    expect(chaveDoMovimento(null)).toBeNull();
    expect(chaveDoMovimento(undefined)).toBeNull();
    expect(chaveDoMovimento({ seconds: 10, nanoseconds: 5, toMillis: () => 10000 })).toBe(
      '10:5',
    );
    expect(chaveDoMovimento(new Date(1234))).toBe('1234');
    expect(chaveDoMovimento({ toMillis: () => 99 })).toBe('99');
  });

  it('detectarMovimentos', () => {
    const t1 = { seconds: 1, nanoseconds: 0 };
    const t2 = { seconds: 2, nanoseconds: 0 };
    // Carga inicial: só registra.
    const inicial = detectarMovimentos(null, [{ id: 'a', movidoEm: t1 }, { id: 'b' }]);
    expect(inicial.movidos).toEqual([]);

    const mudou = detectarMovimentos(inicial.vistos, [
      { id: 'a', movidoEm: t2 },
      { id: 'b' },
    ]);
    expect(mudou.movidos.map(token => token.id)).toEqual(['a']);

    // Escrita pendente (movidoEm null) mantém o anterior e não conta.
    const pendente = detectarMovimentos(mudou.vistos, [
      { id: 'a', movidoEm: null },
      { id: 'b', movidoEm: null },
    ]);
    expect(pendente.movidos).toEqual([]);
    expect(pendente.vistos.get('a')).toBe('2:0');

    // Confirmação do servidor: a com horário novo e b (antes sem movidoEm).
    const confirmado = detectarMovimentos(pendente.vistos, [
      { id: 'a', movidoEm: { seconds: 3, nanoseconds: 0 } },
      { id: 'b', movidoEm: t1 },
    ]);
    expect(confirmado.movidos.map(token => token.id)).toEqual(['a', 'b']);

    // Token novo (revelado agora) não conta; o ausente sai do mapa.
    const novo = detectarMovimentos(confirmado.vistos, [{ id: 'c', movidoEm: t2 }]);
    expect(novo.movidos).toEqual([]);
    expect([...novo.vistos.keys()]).toEqual(['c']);
  });
});

describe('recursos', () => {
  it('normalizarRecurso converte strings, arredonda e limita', () => {
    expect(normalizarRecurso({ atual: '7.6', max: '20' })).toEqual({ atual: 8, max: 20 });
    expect(normalizarRecurso({ atual: 30, max: 20 })).toEqual({ atual: 20, max: 20 });
    expect(normalizarRecurso({ atual: -3, max: 20 })).toEqual({ atual: 0, max: 20 });
    expect(normalizarRecurso({ max: 12 })).toEqual({ atual: 12, max: 12 });
    expect(normalizarRecurso({ atual: 5, max: 200000 })).toEqual({
      atual: 5,
      max: RECURSO_MAX,
    });
    expect(normalizarRecurso({ atual: 1, max: 0 })).toBeNull();
    expect(normalizarRecurso({ atual: 1, max: 'x' })).toBeNull();
    expect(normalizarRecurso({ atual: 1 })).toBeNull();
    expect(normalizarRecurso(null)).toBeNull();
  });

  it('recursosDaFicha lê hp, o legado saude e os máximos em formatos diferentes', () => {
    expect(
      recursosDaFicha({
        status: { hp: { atual: 12 }, energia: { atual: 3 }, fadiga: { atual: '4' } },
        statusMaximos: { hp: 20, energia: 10, fadiga: 6 },
      }),
    ).toEqual({
      pv: { atual: 12, max: 20 },
      energia: { atual: 3, max: 10 },
      fadiga: { atual: 4, max: 6 },
    });
    expect(
      recursosDaFicha({
        status: { saude: { atual: 5 } },
        statusMaximos: { saude: { maximo: 9 } },
      }).pv,
    ).toEqual({ atual: 5, max: 9 });
    // Sem statusMaximos: o máximo guardado no próprio status.
    expect(recursosDaFicha({ status: { hp: { atual: 2, maximo: 8 } } }).pv).toEqual({
      atual: 2,
      max: 8,
    });
    expect(recursosDaFicha({})).toEqual({ pv: null, energia: null, fadiga: null });
    expect(recursosDaFicha(null)).toEqual({ pv: null, energia: null, fadiga: null });
  });

  it('recursosIniciais começa cheio e omite os ausentes', () => {
    expect(
      recursosIniciais({
        status: { hp: { atual: 3 } },
        statusMaximos: { hp: 20, fadiga: 5 },
      }),
    ).toEqual({ pv: { atual: 20, max: 20 }, fadiga: { atual: 5, max: 5 } });
    expect(recursosIniciais({ status: {} })).toBeNull();
  });

  it('normalizarModoRecursos tem "oculto" como padrão', () => {
    expect(normalizarModoRecursos('barra')).toBe('barra');
    expect(normalizarModoRecursos('numeros')).toBe('numeros');
    expect(normalizarModoRecursos('outro')).toBe('oculto');
    expect(normalizarModoRecursos(undefined)).toBe('oculto');
  });

  describe('recursosDoToken', () => {
    const FICHA = { status: { hp: { atual: 6 } }, statusMaximos: { hp: 10 } };
    const JOGADOR = { id: 't1', tipo: 'jogador', refId: 'p1', donos: ['u1'] };
    const NPC = { id: 't2', tipo: 'npc', pv: { atual: 10, max: 20 } };

    it('jogador: barras para todos, números só para o dono e o mestre', () => {
      expect(recursosDoToken(JOGADOR, FICHA, { uid: 'u1' })).toEqual({
        pv: { atual: 6, max: 10 },
        energia: null,
        fadiga: null,
        numeros: true,
      });
      expect(recursosDoToken(JOGADOR, FICHA, { uid: 'u9', veTudo: true }).numeros).toBe(
        true,
      );
      expect(recursosDoToken(JOGADOR, FICHA, { uid: 'u2' }).numeros).toBe(false);
      expect(recursosDoToken(JOGADOR, null, { uid: 'u1' })).toBeNull();
    });

    it('npc: oculto por padrão para jogadores, tudo para o mestre', () => {
      expect(recursosDoToken(NPC, null, { uid: 'u1' })).toBeNull();
      expect(recursosDoToken(NPC, null, { uid: 'm', veTudo: true })).toEqual({
        pv: { atual: 10, max: 20 },
        energia: null,
        fadiga: null,
        numeros: true,
      });
      expect(
        recursosDoToken({ ...NPC, mostrarRecursos: 'barra' }, null, { uid: 'u1' })
          .numeros,
      ).toBe(false);
      expect(
        recursosDoToken({ ...NPC, mostrarRecursos: 'numeros' }, null, { uid: 'u1' })
          .numeros,
      ).toBe(true);
    });

    it('sem nenhum recurso não mostra nada', () => {
      expect(
        recursosDoToken({ id: 't3', tipo: 'criatura' }, null, { veTudo: true }),
      ).toBe(null);
    });
  });

  it('fracaoDaBarra: PV/Energia esvaziam, Fadiga enche com o cansaço', () => {
    expect(fracaoDaBarra('pv', { atual: 6, max: 10 })).toBe(0.6);
    expect(fracaoDaBarra('energia', { atual: 0, max: 10 })).toBe(0);
    expect(fracaoDaBarra('fadiga', { atual: 10, max: 10 })).toBe(0);
    expect(fracaoDaBarra('fadiga', { atual: 0, max: 10 })).toBe(1);
    expect(fracaoDaBarra('fadiga', { atual: 7, max: 10 })).toBeCloseTo(0.3);
    expect(fracaoDaBarra('pv', null)).toBe(0);
  });

  it('corDaBarra: PV verde cheia e vermelha vazia', () => {
    expect(corDaBarra('pv', 1)).toBe('hsl(120, 70%, 45%)');
    expect(corDaBarra('pv', 0)).toBe('hsl(0, 70%, 45%)');
    expect(corDaBarra('fadiga', 0)).toBe('hsl(48, 90%, 50%)');
    expect(corDaBarra('fadiga', 1)).toBe('hsl(8, 90%, 50%)');
    expect(corDaBarra('energia', 0.5)).toBe('#5b9cf5');
  });
});

describe('condições do token', () => {
  const CATALOGO = new Map([
    ['c1', { id: 'c1', nome: 'Envenenado', linkImagem: 'https://ex.com/v.png' }],
    ['c2', { id: 'c2', Nome: 'Atordoado', linkImagem: 'http://ex.com/a.png' }],
    ['c3', { id: 'c3' }],
  ]);

  it('normalizarCondicoesDoToken tira inválidos e repetidos e limita', () => {
    expect(normalizarCondicoesDoToken(['c1', 'c1', '', 7, null, 'c2'])).toEqual([
      'c1',
      'c2',
    ]);
    expect(normalizarCondicoesDoToken('c1')).toEqual([]);
    const muitas = Array.from({ length: 30 }, (_, i) => `c${i}`);
    expect(normalizarCondicoesDoToken(muitas)).toHaveLength(TOKEN_CONDICOES_MAX);
  });

  it('jogador: condicoesAtivas da ficha, com stack', () => {
    const ficha = {
      condicoesAtivas: [
        { condicaoId: 'c1', stack: 2 },
        { condicaoId: 'sumiu', stack: 1 },
      ],
    };
    expect(condicoesDoToken({ tipo: 'jogador' }, ficha, CATALOGO)).toEqual([
      { id: 'c1', nome: 'Envenenado', icone: 'https://ex.com/v.png', stack: 2 },
    ]);
  });

  it('npc: ids do token; fallback de Nome e ícone não https vira null', () => {
    expect(
      condicoesDoToken({ tipo: 'npc', condicoes: ['c2', 'c3', 'x'] }, null, CATALOGO),
    ).toEqual([
      { id: 'c2', nome: 'Atordoado', icone: null, stack: null },
      { id: 'c3', nome: 'Condição', icone: null, stack: null },
    ]);
    expect(condicoesDoToken({ tipo: 'npc', condicoes: ['c1'] }, null, null)).toEqual([]);
  });

  it('detalhesDosTokens omite tokens sem nada a mostrar', () => {
    const tokens = [
      { id: 't1', tipo: 'jogador', refId: 'p1', donos: ['u1'] },
      { id: 't2', tipo: 'npc', condicoes: ['c1'] },
      { id: 't3', tipo: 'criatura' },
      { id: 't4', tipo: 'jogador', refId: 'p-sem-ficha', donos: [] },
    ];
    const detalhes = detalhesDosTokens(tokens, {
      fichas: { p1: { status: { hp: { atual: 1 } }, statusMaximos: { hp: 2 } } },
      catalogoPorId: CATALOGO,
      uid: 'u1',
    });
    expect(Object.keys(detalhes)).toEqual(['t1', 't2']);
    expect(detalhes.t1.recursos.pv).toEqual({ atual: 1, max: 2 });
    expect(detalhes.t1.condicoes).toEqual([]);
    expect(detalhes.t2).toEqual({
      recursos: null,
      condicoes: [
        { id: 'c1', nome: 'Envenenado', icone: 'https://ex.com/v.png', stack: null },
      ],
    });
  });
});

describe('distanciaEntreTokens / escolherReferencia', () => {
  const t = (col, lin, tamanho = 1) => ({ col, lin, tamanho });

  it('mede borda a borda', () => {
    expect(distanciaEntreTokens(t(2, 2), t(2, 2))).toBe(0);
    expect(distanciaEntreTokens(t(2, 2), t(3, 2))).toBe(1);
    expect(distanciaEntreTokens(t(2, 2), t(3, 3))).toBe(1);
    expect(distanciaEntreTokens(t(0, 0), t(3, 1))).toBe(3);
    expect(distanciaEntreTokens(t(0, 0, 2), t(2, 0))).toBe(1);
    expect(distanciaEntreTokens(t(2, 0), t(0, 0, 2))).toBe(1);
    expect(distanciaEntreTokens(t(0, 0, 3), t(1, 1))).toBe(0);
    // 3×3 em (0,0) ocupa 0–2; 3×3 em (6,1) ocupa 6–8: vão de 3 colunas.
    expect(distanciaEntreTokens(t(0, 0, 3), t(6, 1, 3))).toBe(4);
    // Sem tamanho = 1×1.
    expect(distanciaEntreTokens({ col: 0, lin: 0 }, { col: 5, lin: 2 })).toBe(5);
  });

  it('escolherReferencia: selecionado, último movido, primeiro do jogador', () => {
    const tokens = [
      { id: 'a', donos: [] },
      { id: 'b', donos: ['u1'] },
      { id: 'c', donos: ['u1'] },
    ];
    const podeMover = token => token.donos.includes('u1');
    expect(escolherReferencia(tokens, { selecionadoId: 'a', podeMover }).id).toBe('a');
    expect(escolherReferencia(tokens, { ultimoId: 'c', podeMover }).id).toBe('c');
    // Último que não pode mais mover: volta ao primeiro dele.
    expect(escolherReferencia(tokens, { ultimoId: 'a', podeMover }).id).toBe('b');
    expect(
      escolherReferencia(tokens, { mestre: true, podeMover: () => true }),
    ).toBeNull();
    expect(
      escolherReferencia(tokens, { mestre: true, ultimoId: 'a', podeMover: () => true })
        .id,
    ).toBe('a');
    expect(escolherReferencia([], { podeMover })).toBeNull();
  });
});

describe('aura', () => {
  it('normalizarAura aceita raio inteiro 1–999 e cor #RRGGBB', () => {
    expect(normalizarAura({ raio: 2, cor: '#e05555' })).toEqual({
      raio: 2,
      cor: '#e05555',
    });
    expect(normalizarAura({ raio: 0, cor: '#e05555' })).toBeNull();
    expect(normalizarAura({ raio: 1000, cor: '#e05555' })).toBeNull();
    expect(normalizarAura({ raio: 1.5, cor: '#e05555' })).toBeNull();
    expect(normalizarAura({ raio: 2, cor: 'red' })).toBeNull();
    expect(normalizarAura(null)).toBeNull();
  });

  it('areaDaAura: quadrado em volta do token, recortado ao mundo', () => {
    const limites = { colunas: 10, linhas: 8 };
    expect(areaDaAura({ col: 3, lin: 3, tamanho: 2 }, { raio: 1 }, limites)).toEqual({
      col: 2,
      lin: 2,
      colunas: 4,
      linhas: 4,
    });
    expect(areaDaAura({ col: 0, lin: 7, tamanho: 1 }, { raio: 3 }, limites)).toEqual({
      col: 0,
      lin: 4,
      colunas: 4,
      linhas: 4,
    });
  });
});

describe('sinais (pings)', () => {
  const t = segundos => ({ seconds: segundos, nanoseconds: 0 });

  it('corDoPing: dourado para o mestre, cor estável da paleta para os jogadores', () => {
    expect(corDoPing('mestre', 'mestre')).toBe(COR_PING_MESTRE);
    expect(corDoPing('u1', 'mestre')).toBe(corDoPing('u1', 'outro'));
    expect(CORES_PING).toContain(corDoPing('u1'));
    expect(CORES_PING).toContain(corDoPing('outro-uid-qualquer'));
  });

  it('normalizarPing limita coordenadas e valida nome', () => {
    expect(
      normalizarPing({ uid: 'u1', x: 10.4, y: -5, puxar: 'sim', nome: ' Aldric ' }),
    ).toEqual({ uid: 'u1', x: 10, y: 0, puxar: false, nome: 'Aldric', criadoEm: null });
    expect(
      normalizarPing({ uid: 'u1', x: 1e9, y: 2, puxar: true, nome: 'x'.repeat(101) }),
    ).toEqual({
      uid: 'u1',
      x: PING_COORDENADA_MAX,
      y: 2,
      puxar: true,
      nome: null,
      criadoEm: null,
    });
    expect(normalizarPing({ uid: 'u1', x: 'a', y: 2 })).toBeNull();
    expect(normalizarPing({ uid: 'u1', y: 2 })).toBeNull();
    expect(normalizarPing({ x: 1, y: 2 })).toBeNull();
  });

  it('detectarPings: carga inicial só registra; chave nova é sinal', () => {
    const inicial = detectarPings(null, [{ uid: 'u1', criadoEm: t(1) }]);
    expect(inicial.novos).toEqual([]);

    const mesmo = detectarPings(inicial.vistos, [{ uid: 'u1', criadoEm: t(1) }]);
    expect(mesmo.novos).toEqual([]);

    const novo = detectarPings(mesmo.vistos, [{ uid: 'u1', criadoEm: t(2) }]);
    expect(novo.novos.map(p => p.uid)).toEqual(['u1']);

    // Pendente (null) mantém a chave anterior.
    const pendente = detectarPings(novo.vistos, [{ uid: 'u1', criadoEm: null }]);
    expect(pendente.novos).toEqual([]);
    expect(pendente.vistos.get('u1')).toBe('2:0');
  });

  it('detectarPings: uid novo depois da carga é sinal (só quando confirmado)', () => {
    const inicial = detectarPings(null, []);
    const confirmado = detectarPings(inicial.vistos, [{ uid: 'u2', criadoEm: t(5) }]);
    expect(confirmado.novos.map(p => p.uid)).toEqual(['u2']);

    const pendente = detectarPings(inicial.vistos, [{ uid: 'u3', criadoEm: null }]);
    expect(pendente.novos).toEqual([]);
    const depois = detectarPings(pendente.vistos, [{ uid: 'u3', criadoEm: t(6) }]);
    expect(depois.novos.map(p => p.uid)).toEqual(['u3']);
  });

  it('centralizarVista mantém o zoom', () => {
    expect(
      centralizarVista(
        { zoom: 2, x: 0, y: 0 },
        { x: 100, y: 50 },
        { largura: 800, altura: 600 },
      ),
    ).toEqual({ zoom: 2, x: 200, y: 200 });
  });
});

describe('combate (Fase 3A): travamento, corrida, deslocamento e PP', () => {
  const meu = { id: 't1', donos: ['u1'] };

  it('podeMoverToken segue o travamento da cena', () => {
    const { LIVRE, TURNO, CONGELADO } = TRAVAMENTOS;
    expect(podeMoverToken(meu, 'u1', false, { travamento: LIVRE })).toBe(true);
    expect(podeMoverToken(meu, 'u1', false, { travamento: CONGELADO })).toBe(false);
    // Só na sua vez: fora de combate (sem token da vez) é livre.
    expect(podeMoverToken(meu, 'u1', false, { travamento: TURNO })).toBe(true);
    expect(
      podeMoverToken(meu, 'u1', false, { travamento: TURNO, tokenDaVezId: 't1' }),
    ).toBe(true);
    expect(
      podeMoverToken(meu, 'u1', false, { travamento: TURNO, tokenDaVezId: 't9' }),
    ).toBe(false);
    // Livre ignora a vez; o mestre ignora tudo; token alheio nunca.
    expect(podeMoverToken(meu, 'u1', false, { tokenDaVezId: 't9' })).toBe(true);
    expect(
      podeMoverToken({ id: 't2', donos: [] }, 'm', true, { travamento: CONGELADO }),
    ).toBe(true);
    expect(
      podeMoverToken({ id: 't2', donos: [] }, 'u1', false, { travamento: LIVRE }),
    ).toBe(false);
  });

  it('normalizarTravamento e normalizarMultiplicadorCorrida', () => {
    expect(normalizarTravamento('turno')).toBe('turno');
    expect(normalizarTravamento('x')).toBe('livre');
    expect(normalizarTravamento(undefined)).toBe('livre');
    expect(normalizarMultiplicadorCorrida('1,5')).toBe(1.5);
    expect(normalizarMultiplicadorCorrida(2)).toBe(2);
    expect(normalizarMultiplicadorCorrida(3)).toBe(2);
    expect(normalizarMultiplicadorCorrida(null)).toBe(2);
  });

  it('config: padrão 2×; validar recusa fora da lista', () => {
    expect(GRID_CONFIG_PADRAO.multiplicadorCorrida).toBe(2);
    expect(configDoGrid({ multiplicadorCorrida: 1.5 }).multiplicadorCorrida).toBe(1.5);
    expect(
      validarConfigGrid({ ...GRID_CONFIG_PADRAO, multiplicadorCorrida: 1.5 }),
    ).toBeNull();
    expect(validarConfigGrid({ ...GRID_CONFIG_PADRAO, multiplicadorCorrida: 3 })).toBe(
      'Correr: 2× ou 1,5×.',
    );
    // O travamento não faz parte da config ("Salvar grid" não sobrescreve).
    expect(configDoGrid({ travamento: 'turno' })).not.toHaveProperty('travamento');
  });

  it('normalizarDeslocamento / deslocamentoDoToken', () => {
    expect(normalizarDeslocamento('7,5')).toBe(7.5);
    expect(normalizarDeslocamento(12.345)).toBe(12.35);
    expect(normalizarDeslocamento(0)).toBe(0);
    expect(normalizarDeslocamento('')).toBeNull();
    expect(normalizarDeslocamento('abc')).toBeNull();
    expect(normalizarDeslocamento(-1)).toBeNull();
    expect(normalizarDeslocamento(1000)).toBeNull();
    expect(deslocamentoDoToken({})).toBe(DESLOCAMENTO_PADRAO);
    expect(deslocamentoDoToken({ deslocamento: 6 })).toBe(6);
    expect(deslocamentoDoToken({ deslocamento: 'x' })).toBe(9);
  });

  it('prontidaoDaFicha: cópias top-level primeiro, depois estadoCombate/total', () => {
    expect(prontidaoDaFicha({ prontidaoAtual: 5, prontidaoMaximaEfetiva: 20 })).toEqual({
      atual: 5,
      max: 20,
    });
    expect(
      prontidaoDaFicha({
        estadoCombate: { ppAtual: 7 },
        secundariosTotais: { prontidao: 30 },
      }),
    ).toEqual({ atual: 7, max: 30 });
    expect(prontidaoDaFicha({ prontidaoAtual: 50, prontidao: 10 })).toEqual({
      atual: 10,
      max: 10,
    });
    expect(prontidaoDaFicha({})).toBeNull();
  });

  it('detalhesDosTokens: PP só para o dono e o mestre', () => {
    const tokens = [
      { id: 'meu', tipo: 'jogador', refId: 'p1', donos: ['u1'] },
      { id: 'outro', tipo: 'jogador', refId: 'p2', donos: ['u2'] },
    ];
    const fichas = {
      p1: { prontidaoAtual: 3, prontidaoMaximaEfetiva: 10 },
      p2: { prontidaoAtual: 4, prontidaoMaximaEfetiva: 10 },
    };
    const doJogador = detalhesDosTokens(tokens, { fichas, uid: 'u1' });
    expect(doJogador.meu).toEqual({
      recursos: null,
      condicoes: [],
      pp: { atual: 3, max: 10 },
    });
    expect(doJogador.outro).toBeUndefined();
    const doMestre = detalhesDosTokens(tokens, { fichas, uid: 'm', veTudo: true });
    expect(doMestre.outro.pp).toEqual({ atual: 4, max: 10 });
  });
});

describe('edição do valor atual de recursos', () => {
  const pv = { atual: 5, max: 10 };

  it('ajustarRecursoAtual soma o passo e limita a 0..max', () => {
    expect(ajustarRecursoAtual(pv, 1)).toBe(6);
    expect(ajustarRecursoAtual(pv, -1)).toBe(4);
    expect(ajustarRecursoAtual(pv, 50)).toBe(10);
    expect(ajustarRecursoAtual({ atual: 0, max: 10 }, -1)).toBe(0);
    expect(ajustarRecursoAtual(null, 1)).toBeNull();
    expect(ajustarRecursoAtual(pv, 'x')).toBeNull();
  });

  it('recursoDigitadoAtual limita, arredonda e rejeita texto inválido', () => {
    expect(recursoDigitadoAtual(pv, '7')).toBe(7);
    expect(recursoDigitadoAtual(pv, ' 99 ')).toBe(10);
    expect(recursoDigitadoAtual(pv, '-3')).toBe(2);
    expect(recursoDigitadoAtual(pv, '-30')).toBe(0);
    expect(recursoDigitadoAtual(pv, '+3')).toBe(8);
    expect(recursoDigitadoAtual(pv, '+30')).toBe(10);
    expect(recursoDigitadoAtual(pv, '2,6')).toBe(3);
    expect(recursoDigitadoAtual(pv, '')).toBeNull();
    expect(recursoDigitadoAtual(pv, '  ')).toBeNull();
    expect(recursoDigitadoAtual(pv, 'abc')).toBeNull();
    expect(recursoDigitadoAtual(null, '3')).toBeNull();
  });

  it('valorDigitadoDoRecurso: com sinal soma ao atual, sem sinal é o valor novo', () => {
    expect(valorDigitadoDoRecurso(12, '-7')).toBe(5);
    expect(valorDigitadoDoRecurso(12, '+ 5')).toBe(17);
    expect(valorDigitadoDoRecurso(12, '-20')).toBe(-8);
    expect(valorDigitadoDoRecurso(12, '4')).toBe(4);
    expect(valorDigitadoDoRecurso(12, '-2,6')).toBe(9);
    expect(valorDigitadoDoRecurso(12, '-')).toBeNull();
    expect(valorDigitadoDoRecurso(12, '+')).toBeNull();
    expect(valorDigitadoDoRecurso(12, '')).toBeNull();
    expect(valorDigitadoDoRecurso(12, null)).toBeNull();
    expect(valorDigitadoDoRecurso(12, 'x')).toBeNull();
    expect(valorDigitadoDoRecurso(undefined, '-3')).toBeNull();
  });
});

describe('duração das condições do token', () => {
  const CATALOGO = new Map([
    ['c1', { id: 'c1', nome: 'Envenenado' }],
    ['c2', { id: 'c2', nome: 'Atordoado' }],
  ]);

  it('normalizarCondicoesDuracao: só pares válidos (rodadaFim inteiro ≥ 1)', () => {
    expect(normalizarCondicoesDuracao(null)).toEqual({});
    expect(normalizarCondicoesDuracao(['c1'])).toEqual({});
    expect(
      normalizarCondicoesDuracao({ c1: 3, c2: 0, c3: 1.5, c4: '2', ' ': 2, c5: 1 }),
    ).toEqual({ c1: 3, c5: 1 });
    const muitas = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`c${i}`, 2]));
    expect(Object.keys(normalizarCondicoesDuracao(muitas))).toHaveLength(
      TOKEN_CONDICOES_MAX,
    );
  });

  it('rodadasRestantes conta a rodada atual; sem combate, a rodada 1', () => {
    expect(rodadasRestantes(5, 4)).toBe(2);
    expect(rodadasRestantes(5, 5)).toBe(1);
    expect(rodadasRestantes(5, 6)).toBeNull();
    expect(rodadasRestantes(5, null)).toBe(5);
    expect(rodadasRestantes(undefined, 2)).toBeNull();
  });

  it('npc: restam só nas condições com duração; jogador ignora o campo', () => {
    const npc = {
      tipo: 'npc',
      condicoes: ['c1', 'c2'],
      condicoesDuracao: { c1: 6 },
    };
    expect(condicoesDoToken(npc, null, CATALOGO, { rodada: 4 })).toEqual([
      { id: 'c1', nome: 'Envenenado', icone: null, stack: null, restam: 3 },
      { id: 'c2', nome: 'Atordoado', icone: null, stack: null },
    ]);
    // Sem combate: a duração inteira (rodada 1).
    expect(condicoesDoToken(npc, null, CATALOGO)[0].restam).toBe(6);
    // Vencida e ainda não limpa: sem "restam".
    expect(condicoesDoToken(npc, null, CATALOGO, { rodada: 7 })[0]).not.toHaveProperty(
      'restam',
    );
    const ficha = { condicoesAtivas: [{ condicaoId: 'c1', stack: 1 }] };
    expect(
      condicoesDoToken(
        { tipo: 'jogador', condicoesDuracao: { c1: 9 } },
        ficha,
        CATALOGO,
        { rodada: 1 },
      )[0],
    ).not.toHaveProperty('restam');
  });

  it('detalhesDosTokens leva a rodada até as condições', () => {
    const tokens = [
      { id: 't', tipo: 'npc', condicoes: ['c1'], condicoesDuracao: { c1: 3 } },
    ];
    const detalhes = detalhesDosTokens(tokens, {
      catalogoPorId: CATALOGO,
      rodada: 2,
    });
    expect(detalhes.t.condicoes[0].restam).toBe(2);
  });
});
