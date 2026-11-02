import { describe, expect, it } from 'vitest';

import {
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
    });
    expect(
      normalizarConfigGrid({ ...valores, imagemUrl: '   ' }).imagemUrl,
    ).toBeNull();
  });

  it('metros por quadrado: padrão 1,5, aceita vírgula e valida a faixa', () => {
    expect(GRID_CONFIG_PADRAO.metrosPorQuadrado).toBe(1.5);
    expect(configDoGrid({ celula: 50 }).metrosPorQuadrado).toBe(1.5);
    const metros = valor =>
      normalizarConfigGrid({ ...valores, metrosPorQuadrado: valor })
        .metrosPorQuadrado;
    expect(metros('2,5')).toBe(2.5);
    expect(metros(3)).toBe(3);
    expect(metros(null)).toBe(1.5);
    const base = normalizarConfigGrid(valores);
    expect(
      validarConfigGrid({ ...base, metrosPorQuadrado: metros('') }),
    ).toMatch(/Metros/);
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: 0.05 })).toMatch(
      /Metros/,
    );
    expect(validarConfigGrid({ ...base, metrosPorQuadrado: 101 })).toMatch(
      /Metros/,
    );
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
    expect(
      validarConfigGrid({ ...base, imagemUrl: 'http://x.com/a.png' }),
    ).toMatch(/https/);
    expect(validarConfigGrid({ ...base, celula: 5 })).toMatch(/célula/);
    expect(validarConfigGrid({ ...base, celula: 401 })).toMatch(/célula/);
    expect(validarConfigGrid({ ...base, deslocamentoX: -1 })).toMatch(
      /deslocamento/,
    );
    expect(validarConfigGrid({ ...base, corGrade: 'red' })).toMatch(/Cor/);
    expect(validarConfigGrid({ ...base, opacidadeGrade: 2 })).toMatch(
      /Opacidade/,
    );
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
    expect(celulaMaisProxima(config, 110, 170, limites)).toEqual({
      col: 2,
      lin: 3,
    });
    // Solto um pouco além da metade da célula → arredonda para a próxima.
    expect(celulaMaisProxima(config, 140, 170, limites)).toEqual({
      col: 3,
      lin: 3,
    });
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
      vistaFocadaNoToken({
        ...base,
        token: { col: 0, lin: 0 },
        zoomEncaixe: 1.5,
      }).zoom,
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
    expect(
      primeiraCelulaLivre([{ col: 0, lin: 0, tamanho: 4 }], 1, limites),
    ).toEqual({
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
    expect(
      montarCena({ nome: '  Taverna ', imagemUrl: 'https://ex.com/t.png' }),
    ).toEqual({
      ...GRID_CONFIG_PADRAO,
      nome: 'Taverna',
      imagemUrl: 'https://ex.com/t.png',
    });
    expect(
      montarCena({ nome: 'X', imagemUrl: 'ftp://x' }).imagemUrl,
    ).toBeNull();
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
    expect(avancarCaminho(inicio, celula(1, 0))).toEqual(
      celulas([0, 0], [1, 0]),
    );
    // Salto de 4 células (ponteiro rápido) vira 4 passos.
    expect(avancarCaminho(inicio, celula(4, 0))).toEqual(
      celulas([0, 0], [1, 0], [2, 0], [3, 0], [4, 0]),
    );
    // Voltar a uma célula do caminho corta o que veio depois dela.
    const ida = celulas([0, 0], [1, 0], [2, 0], [2, 1]);
    expect(avancarCaminho(ida, celula(2, 0))).toEqual(
      celulas([0, 0], [1, 0], [2, 0]),
    );
    expect(avancarCaminho(ida, celula(0, 0))).toEqual(celulas([0, 0]));
    // Laço fechado por um salto que passa por (1,1) no meio; (0,1) já é
    // vizinho de (0,0), então (1,1) também sai.
    expect(
      avancarCaminho(celulas([0, 0], [1, 1], [2, 1], [3, 1]), celula(0, 1)),
    ).toEqual(celulas([0, 0], [0, 1]));
    // Arrasto quase diagonal: o ponteiro cruza a coluna antes da linha e passa
    // por (1,0) a caminho de (1,1) — a quina não conta como passo.
    const quina = avancarCaminho(celulas([0, 0]), celula(1, 0));
    expect(avancarCaminho(quina, celula(1, 1))).toEqual(
      celulas([0, 0], [1, 1]),
    );
    const diagonal = [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
      [3, 2],
      [3, 3],
    ].reduce(
      (caminho, [c, l]) => avancarCaminho(caminho, celula(c, l)),
      celulas([0, 0]),
    );
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
    expect(
      encadearRastro(celulas([0, 0], [1, 0]), celulas([1, 0], [2, 0])),
    ).toEqual(celulas([0, 0], [1, 0], [2, 0]));
    // Não começa onde o anterior terminou → substitui.
    expect(
      encadearRastro(celulas([0, 0], [1, 0]), celulas([5, 5], [6, 5])),
    ).toEqual(celulas([5, 5], [6, 5]));
    expect(encadearRastro(null, celulas([1, 1], [1, 2]))).toEqual(
      celulas([1, 1], [1, 2]),
    );
    expect(
      montarRastro(celulas([0, 0], [1, 0]), celulas([1, 0], [2, 0])),
    ).toEqual(celulas([0, 0], [2, 0]));
    // Ida e volta mantém as duas pernas.
    const idaEVolta = montarRastro(
      celulas([0, 0], [1, 0]),
      celulas([1, 0], [0, 0]),
    );
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
    expect(
      normalizarRastro([{ col: 1, lin: 1, extra: true }, celula(2, 2)]),
    ).toEqual(celulas([1, 1], [2, 2]));
    const longo = Array.from({ length: 60 }, (_, i) => celula(i, 0));
    expect(normalizarRastro(longo)).toHaveLength(RASTRO_VERTICES_MAX);
  });

  it('rastrosIguais', () => {
    expect(
      rastrosIguais(celulas([1, 1], [2, 2]), celulas([1, 1], [2, 2])),
    ).toBe(true);
    expect(
      rastrosIguais(celulas([1, 1], [2, 2]), celulas([1, 1], [2, 3])),
    ).toBe(false);
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
    expect(
      chaveDoMovimento({ seconds: 10, nanoseconds: 5, toMillis: () => 10000 }),
    ).toBe('10:5');
    expect(chaveDoMovimento(new Date(1234))).toBe('1234');
    expect(chaveDoMovimento({ toMillis: () => 99 })).toBe('99');
  });

  it('detectarMovimentos', () => {
    const t1 = { seconds: 1, nanoseconds: 0 };
    const t2 = { seconds: 2, nanoseconds: 0 };
    // Carga inicial: só registra.
    const inicial = detectarMovimentos(null, [
      { id: 'a', movidoEm: t1 },
      { id: 'b' },
    ]);
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
    const novo = detectarMovimentos(confirmado.vistos, [
      { id: 'c', movidoEm: t2 },
    ]);
    expect(novo.movidos).toEqual([]);
    expect([...novo.vistos.keys()]).toEqual(['c']);
  });
});
