import { describe, expect, it } from 'vitest';

import {
  GRID_CONFIG_PADRAO,
  GRID_SEM_IMAGEM,
  TIPOS_TOKEN,
  celulaMaisProxima,
  configDoGrid,
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
    });
    expect(
      normalizarConfigGrid({ ...valores, imagemUrl: '   ' }).imagemUrl,
    ).toBeNull();
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
