import { describe, expect, it } from 'vitest';

import {
  COR_MARCADOR_PADRAO,
  ICONES_MARCADOR,
  MARCADOR_TEXTO_MAX,
  MARCADOR_TITULO_MAX,
  montarMarcador,
  normalizarMarcador,
  normalizarMarcadores,
  validarMarcador,
} from 'common/utils/gridMarcadores';

const valido = {
  col: 3,
  lin: 4,
  icone: 'tesouro',
  cor: '#e05555',
  titulo: 'Baú',
  texto: 'Trancado',
  secreto: true,
};

describe('montarMarcador', () => {
  it('apara textos, aplica fallbacks e padrão não secreto', () => {
    const m = montarMarcador({
      col: 1,
      lin: 2,
      icone: 'xyz',
      cor: 'vermelho',
      titulo: '  Porta  ',
    });
    expect(m).toEqual({
      col: 1,
      lin: 2,
      tamanho: 1,
      icone: 'alfinete',
      cor: COR_MARCADOR_PADRAO,
      titulo: 'Porta',
      texto: '',
      secreto: false,
    });
  });

  it('tamanho: mantém 1..10 inteiro; ausente/inválido vira 1', () => {
    expect(montarMarcador({ ...valido, tamanho: 3 }).tamanho).toBe(3);
    expect(montarMarcador({ ...valido, tamanho: 10 }).tamanho).toBe(10);
    [undefined, 0, 11, 2.5, '3', null].forEach(t =>
      expect(montarMarcador({ ...valido, tamanho: t }).tamanho).toBe(1),
    );
  });

  it('corta título e texto nos limites', () => {
    const m = montarMarcador({
      ...valido,
      titulo: 'a'.repeat(100),
      texto: 'b'.repeat(900),
    });
    expect(m.titulo).toHaveLength(MARCADOR_TITULO_MAX);
    expect(m.texto).toHaveLength(MARCADOR_TEXTO_MAX);
  });

  it('mantém ícone, cor e secreto válidos', () => {
    expect(montarMarcador(valido)).toMatchObject({
      icone: 'tesouro',
      cor: '#e05555',
      secreto: true,
    });
  });
});

describe('validarMarcador', () => {
  it('aceita um marcador válido', () => {
    expect(validarMarcador(valido)).toBeNull();
  });

  it('recusa posição fora do mundo ou não inteira', () => {
    expect(validarMarcador({ ...valido, col: -1 })).toMatch(/Coluna/);
    expect(validarMarcador({ ...valido, col: 501 })).toMatch(/Coluna/);
    expect(validarMarcador({ ...valido, lin: 1.5 })).toMatch(/Linha/);
  });

  it('valida o tamanho 1..10 (ausente passa)', () => {
    expect(validarMarcador({ ...valido, tamanho: 1 })).toBeNull();
    expect(validarMarcador({ ...valido, tamanho: 10 })).toBeNull();
    expect(validarMarcador({ ...valido, tamanho: 0 })).toMatch(/tamanho/);
    expect(validarMarcador({ ...valido, tamanho: 11 })).toMatch(/tamanho/);
    expect(validarMarcador({ ...valido, tamanho: 1.5 })).toMatch(/tamanho/);
  });

  it('recusa ícone e cor inválidos', () => {
    expect(validarMarcador({ ...valido, icone: 'x' })).toMatch(/ícone/);
    expect(validarMarcador({ ...valido, cor: 'red' })).toMatch(/cor/);
  });

  it('exige título e respeita limites', () => {
    expect(validarMarcador({ ...valido, titulo: '   ' })).toMatch(/título/);
    expect(validarMarcador({ ...valido, titulo: 'a'.repeat(61) })).toMatch(
      /60/,
    );
    expect(validarMarcador({ ...valido, texto: 'a'.repeat(501) })).toMatch(
      /500/,
    );
    expect(validarMarcador({ ...valido, titulo: 'a'.repeat(60) })).toBeNull();
  });

  it('recusa secreto não booleano e entrada não objeto', () => {
    expect(validarMarcador({ ...valido, secreto: 'sim' })).toBeTruthy();
    expect(validarMarcador(null)).toBeTruthy();
  });

  it('todos os ícones do catálogo passam', () => {
    ICONES_MARCADOR.forEach(({ id }) => {
      expect(validarMarcador({ ...valido, icone: id })).toBeNull();
    });
  });
});

describe('normalizarMarcador', () => {
  it('converte um doc completo (tamanho ausente vira 1)', () => {
    expect(normalizarMarcador({ id: 'a', ...valido, createdAt: 5 })).toEqual({
      id: 'a',
      ...valido,
      tamanho: 1,
      createdAt: 5,
    });
  });

  it('mantém tamanho válido e corrige o inválido para 1', () => {
    expect(normalizarMarcador({ id: 'a', ...valido, tamanho: 4 }).tamanho).toBe(
      4,
    );
    expect(
      normalizarMarcador({ id: 'a', ...valido, tamanho: 99 }).tamanho,
    ).toBe(1);
    expect(
      normalizarMarcador({ id: 'a', ...valido, tamanho: 'x' }).tamanho,
    ).toBe(1);
  });

  it('descarta posição inválida', () => {
    expect(normalizarMarcador({ id: 'a', ...valido, col: 'x' })).toBeNull();
    expect(normalizarMarcador({ id: 'a', ...valido, lin: 501 })).toBeNull();
    expect(normalizarMarcador(null)).toBeNull();
  });

  it('usa fallbacks para ícone/cor e textos ausentes', () => {
    expect(
      normalizarMarcador({ id: 'a', col: 0, lin: 0, icone: '?', cor: 'x' }),
    ).toMatchObject({
      icone: 'alfinete',
      cor: COR_MARCADOR_PADRAO,
      titulo: '',
      texto: '',
      secreto: false,
      createdAt: null,
    });
  });
});

describe('normalizarMarcadores', () => {
  it('descarta inválidos e ordena por criação, pendente por último', () => {
    const lista = normalizarMarcadores([
      { id: 'pendente', ...valido, createdAt: null },
      { id: 'novo', ...valido, createdAt: { toMillis: () => 200 } },
      { id: 'lixo', ...valido, col: -3 },
      { id: 'velho', ...valido, createdAt: new Date(100) },
    ]);
    expect(lista.map(m => m.id)).toEqual(['velho', 'novo', 'pendente']);
  });

  it('aceita entrada vazia', () => {
    expect(normalizarMarcadores(undefined)).toEqual([]);
  });
});
