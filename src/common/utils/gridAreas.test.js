import { describe, expect, it } from 'vitest';

import {
  AREA_QUADRADOS_MAX,
  celulasDaArea,
  descreverAtingidos,
  direcaoDaArea,
  montarArea,
  normalizarArea,
  normalizarMetrosDaArea,
  podeEditarArea,
  quadradosDaArea,
  rotuloDaArea,
  tokensAtingidos,
  trechosDasCelulas,
} from './gridAreas';

const O = { col: 10, lin: 10 };
const chaves = celulas => celulas.map(c => `${c.col},${c.lin}`);

describe('normalizarMetrosDaArea / quadradosDaArea', () => {
  it('aceita vírgula e arredonda a 2 casas', () => {
    expect(normalizarMetrosDaArea('4,5')).toBe(4.5);
    expect(normalizarMetrosDaArea(3.456)).toBe(3.46);
  });

  it('rejeita vazio, zero, negativo, texto e acima do máximo', () => {
    ['', '  ', '0', '-2', 'abc', null, undefined, 1001].forEach(valor =>
      expect(normalizarMetrosDaArea(valor)).toBeNull(),
    );
    expect(normalizarMetrosDaArea(1000)).toBe(1000);
  });

  it('converte metros em quadrados com clamp', () => {
    expect(quadradosDaArea(9, 1.5)).toBe(6);
    expect(quadradosDaArea(0.1, 1.5)).toBe(1);
    expect(quadradosDaArea(1000, 1.5)).toBe(AREA_QUADRADOS_MAX);
  });
});

describe('normalizarArea / montarArea', () => {
  const base = {
    id: 'a',
    uid: 'u',
    forma: 'cone',
    origem: O,
    alvo: { col: 12, lin: 10 },
    metros: 6,
    cor: '#e05555',
  };

  it('normaliza um doc válido', () => {
    expect(normalizarArea(base)).toEqual({ ...base, nome: '' });
  });

  it('raio não tem alvo', () => {
    expect(normalizarArea({ ...base, forma: 'raio' }).alvo).toBeNull();
  });

  it('rejeita forma, metros e origem inválidos', () => {
    expect(normalizarArea({ ...base, forma: 'estrela' })).toBeNull();
    expect(normalizarArea({ ...base, metros: 0 })).toBeNull();
    expect(normalizarArea({ ...base, metros: 5000 })).toBeNull();
    expect(normalizarArea({ ...base, origem: { col: -1, lin: 0 } })).toBeNull();
    expect(normalizarArea({ ...base, origem: null })).toBeNull();
    expect(normalizarArea(null)).toBeNull();
  });

  it('montarArea omite alvo em raio e nome vazio, e corta o nome', () => {
    const raio = montarArea({
      forma: 'raio',
      origem: O,
      alvo: { col: 1, lin: 1 },
      metros: 3,
      cor: '#fff000',
      uid: 'u',
    });
    expect(raio).not.toHaveProperty('alvo');
    expect(raio).not.toHaveProperty('nome');
    const cone = montarArea({
      forma: 'cone',
      origem: O,
      alvo: { col: 1, lin: 1 },
      metros: 3,
      cor: '#fff000',
      uid: 'u',
      nome: 'x'.repeat(200),
    });
    expect(cone.alvo).toEqual({ col: 1, lin: 1 });
    expect(cone.nome).toHaveLength(100);
  });
});

describe('direcaoDaArea', () => {
  it('vetor origem→alvo; vazio ou igual vira leste', () => {
    expect(direcaoDaArea(O, { col: 8, lin: 13 })).toEqual({ dx: -2, dy: 3 });
    expect(direcaoDaArea(O, null)).toEqual({ dx: 1, dy: 0 });
    expect(direcaoDaArea(O, O)).toEqual({ dx: 1, dy: 0 });
  });
});

describe('celulasDaArea', () => {
  const area = (forma, alvo, metros) => ({ forma, origem: O, alvo, metros });

  it('raio 1 = 9 células e raio 2 = 25, incluindo a origem', () => {
    const r1 = celulasDaArea(area('raio', null, 1), 1);
    const r2 = celulasDaArea(area('raio', null, 2), 1);
    expect(r1).toHaveLength(9);
    expect(r2).toHaveLength(25);
    expect(chaves(r1)).toContain('10,10');
  });

  it('quadrado 3 para SE = 9 células com o canto na origem; NO espelha', () => {
    const se = celulasDaArea(area('quadrado', { col: 12, lin: 12 }, 3), 1);
    expect(se).toHaveLength(9);
    expect(chaves(se)).toContain('10,10');
    expect(chaves(se)).toContain('12,12');
    const no = celulasDaArea(area('quadrado', { col: 8, lin: 8 }, 3), 1);
    expect(no).toHaveLength(9);
    expect(chaves(no)).toContain('8,8');
    expect(chaves(no)).toContain('10,10');
    expect(chaves(no)).not.toContain('11,11');
  });

  it('linha para leste n=4 = 4 células sem a origem', () => {
    const linha = celulasDaArea(area('linha', { col: 20, lin: 10 }, 4), 1);
    expect(chaves(linha)).toEqual(['11,10', '12,10', '13,10', '14,10']);
  });

  it('linha rumo a (3,1) com n=6 termina em (6,2)', () => {
    const linha = celulasDaArea(
      { forma: 'linha', origem: { col: 0, lin: 0 }, alvo: { col: 3, lin: 1 }, metros: 6 },
      1,
    );
    expect(linha).toHaveLength(6);
    expect(linha[5]).toEqual({ col: 6, lin: 2 });
  });

  it('linha vertical', () => {
    const linha = celulasDaArea(area('linha', { col: 10, lin: 5 }, 3), 1);
    expect(chaves(linha)).toEqual(['10,7', '10,8', '10,9']);
    expect(linha.every(c => c.col === 10 && c.lin < 10)).toBe(true);
    expect(linha).toHaveLength(3);
  });

  it('cone para leste n=2 = 8 células (sem a origem)', () => {
    const cone = celulasDaArea(area('cone', { col: 20, lin: 10 }, 2), 1);
    expect(cone).toHaveLength(8);
    expect(chaves(cone)).not.toContain('10,10');
    expect(chaves(cone)).toContain('11,9');
    expect(chaves(cone)).toContain('12,12');
    expect(chaves(cone)).not.toContain('12,13');
  });

  it('cone na diagonal vira um quadrante n×n menos a origem (Chebyshev, consciente)', () => {
    const cone = celulasDaArea(area('cone', { col: 14, lin: 14 }, 2), 1);
    // quadrante SE 3×3 (dc,dl ∈ 0..2) sem a origem = 8 células
    expect(cone).toHaveLength(8);
    expect(chaves(cone).sort()).toEqual(
      ['10,11', '10,12', '11,10', '11,11', '11,12', '12,10', '12,11', '12,12'].sort(),
    );
  });

  it('recorta nas bordas', () => {
    const celulas = celulasDaArea(
      { forma: 'raio', origem: { col: 0, lin: 0 }, metros: 2 },
      1,
      { colunas: 10, linhas: 10 },
    );
    expect(celulas).toHaveLength(9);
    expect(celulas.every(c => c.col >= 0 && c.lin >= 0)).toBe(true);
    const direita = celulasDaArea(
      { forma: 'raio', origem: { col: 9, lin: 9 }, metros: 2 },
      1,
      { colunas: 10, linhas: 10 },
    );
    expect(direita.every(c => c.col <= 9 && c.lin <= 9)).toBe(true);
  });

  it('vem ordenado por (lin, col)', () => {
    const celulas = celulasDaArea(area('raio', null, 1), 1);
    expect(chaves(celulas)[0]).toBe('9,9');
    expect(chaves(celulas)[8]).toBe('11,11');
  });
});

describe('trechosDasCelulas', () => {
  it('funde vizinhas da mesma linha e separa o resto', () => {
    const trechos = trechosDasCelulas([
      { col: 3, lin: 1 },
      { col: 1, lin: 0 },
      { col: 2, lin: 0 },
      { col: 3, lin: 0 },
      { col: 5, lin: 0 },
    ]);
    expect(trechos).toEqual([
      { col: 1, lin: 0, colunas: 3 },
      { col: 5, lin: 0, colunas: 1 },
      { col: 3, lin: 1, colunas: 1 },
    ]);
  });
});

describe('tokensAtingidos / descreverAtingidos', () => {
  it('token 2×2 tocando uma só célula é atingido', () => {
    const celulas = [{ col: 5, lin: 5 }];
    const grande = { id: 'g', col: 4, lin: 4, tamanho: 2, nome: 'Grande' };
    const longe = { id: 'l', col: 7, lin: 7, tamanho: 1, nome: 'Longe' };
    expect(tokensAtingidos(celulas, [grande, longe]).map(t => t.id)).toEqual(['g']);
  });

  it('descreve nenhum, lista curta e excedente', () => {
    expect(descreverAtingidos([])).toBe('Atinge: ninguém');
    const t = nome => ({ nome });
    expect(descreverAtingidos([t('A'), t('B')])).toBe('Atinge: A, B');
    expect(descreverAtingidos([t('A'), t('B'), t('C'), t('D'), t('E')])).toBe(
      'Atinge: A, B, C, +2',
    );
  });

  it('oculto só aparece (marcado) para quem vê tudo', () => {
    const tokens = [{ nome: 'A' }, { nome: 'Espreitador', oculto: true }];
    expect(descreverAtingidos(tokens, { veTudo: true })).toBe(
      'Atinge: A, Espreitador (oculto)',
    );
    expect(descreverAtingidos(tokens, { veTudo: false })).toBe('Atinge: A');
  });
});

describe('rotuloDaArea / podeEditarArea', () => {
  it('rotula forma, metros e quadrados', () => {
    expect(rotuloDaArea({ forma: 'cone', metros: 9 }, 1.5)).toBe('Cone · 9 m (6 q)');
    expect(rotuloDaArea({ forma: 'raio', metros: 4.5 }, 1.5)).toBe('Raio · 4,5 m (3 q)');
  });

  it('autor ou quem vê tudo edita', () => {
    expect(podeEditarArea({ uid: 'a' }, 'a', false)).toBe(true);
    expect(podeEditarArea({ uid: 'a' }, 'b', false)).toBe(false);
    expect(podeEditarArea({ uid: 'a' }, 'b', true)).toBe(true);
    expect(podeEditarArea({ uid: 'a' }, null, false)).toBe(false);
  });
});
