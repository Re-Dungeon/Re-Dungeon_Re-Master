import { describe, expect, it } from 'vitest';

import { PING_COORDENADA_MAX } from 'common/utils/grid';
import {
  DESENHO_PONTOS_MAX,
  ajustarTraco,
  normalizarDesenho,
  ordenarDesenhos,
  pontosDoDesenho,
  simplificarTraco,
} from 'common/utils/gridDesenho';

const p = (x, y) => ({ x, y });

describe('simplificarTraco', () => {
  it('reta vira dois pontos', () => {
    const reta = Array.from({ length: 20 }, (_, i) => p(i * 10, i * 5));
    expect(simplificarTraco(reta, 1)).toEqual([p(0, 0), p(190, 95)]);
  });

  it('L mantém o canto', () => {
    const l = [p(0, 0), p(50, 0), p(100, 0), p(100, 50), p(100, 100)];
    expect(simplificarTraco(l, 1)).toEqual([p(0, 0), p(100, 0), p(100, 100)]);
  });

  it('curva mantém mais pontos com tolerância menor', () => {
    const curva = Array.from({ length: 60 }, (_, i) => {
      const t = (i / 59) * Math.PI;
      return p(Math.cos(t) * 100, Math.sin(t) * 100);
    });
    const fina = simplificarTraco(curva, 0.5);
    const grossa = simplificarTraco(curva, 20);
    expect(fina.length).toBeGreaterThan(grossa.length);
    expect(grossa.length).toBeGreaterThanOrEqual(2);
    expect(fina[0]).toEqual(curva[0]);
    expect(fina[fina.length - 1]).toEqual(curva[59]);
  });

  it('é iterativo: aguenta zigue-zague do tamanho máximo bruto', () => {
    const grande = Array.from({ length: 2000 }, (_, i) =>
      p(i, i % 2 ? 100 : 0),
    );
    expect(simplificarTraco(grande, 1).length).toBeGreaterThan(2);
  });

  it('0, 1 e 2 pontos voltam iguais', () => {
    expect(simplificarTraco([], 1)).toEqual([]);
    expect(simplificarTraco(undefined, 1)).toEqual([]);
    expect(simplificarTraco([p(1, 2)], 1)).toEqual([p(1, 2)]);
    expect(simplificarTraco([p(1, 2), p(3, 4)], 1)).toEqual([p(1, 2), p(3, 4)]);
  });

  it('pontos repetidos não quebram (segmento de comprimento zero)', () => {
    expect(simplificarTraco([p(5, 5), p(5, 5), p(5, 5)], 1)).toEqual([
      p(5, 5),
      p(5, 5),
    ]);
  });
});

describe('ajustarTraco', () => {
  it('devolve array plano arredondado', () => {
    expect(ajustarTraco([p(0.4, 0.6), p(100.5, 50)], { zoom: 1 })).toEqual([
      0, 1, 101, 50,
    ]);
  });

  it('respeita o máximo de pontos', () => {
    const ruido = Array.from({ length: 2000 }, (_, i) =>
      p(i, (i * 7919) % 300),
    );
    const plano = ajustarTraco(ruido, { zoom: 1 });
    expect(plano.length).toBeLessThanOrEqual(DESENHO_PONTOS_MAX * 2);
    expect(plano.length % 2).toBe(0);
    const pequeno = ajustarTraco(ruido, { zoom: 1, max: 10 });
    expect(pequeno.length).toBeLessThanOrEqual(20);
  });

  it('ponto único vira dois pontos iguais', () => {
    expect(ajustarTraco([p(10, 20)], { zoom: 2 })).toEqual([10, 20, 10, 20]);
  });

  it('limita às coordenadas da regra', () => {
    expect(ajustarTraco([p(-50, 999999), p(10, 10)], { zoom: 1 })).toEqual([
      0,
      PING_COORDENADA_MAX,
      10,
      10,
    ]);
  });

  it('zoom maior preserva mais detalhe', () => {
    const onda = Array.from({ length: 100 }, (_, i) =>
      p(i, Math.sin(i / 3) * 2),
    );
    const longe = ajustarTraco(onda, { zoom: 0.2 });
    const perto = ajustarTraco(onda, { zoom: 8 });
    expect(perto.length).toBeGreaterThanOrEqual(longe.length);
  });

  it('entrada vazia ou inválida dá lista vazia', () => {
    expect(ajustarTraco([], { zoom: 1 })).toEqual([]);
    expect(ajustarTraco([p(NaN, 1)], { zoom: 1 })).toEqual([]);
    expect(ajustarTraco(undefined)).toEqual([]);
  });
});

describe('normalizarDesenho', () => {
  const base = {
    id: 'd1',
    uid: 'u1',
    cor: '#e05555',
    pontos: [0, 0, 10, 10],
    createdAt: 3,
  };

  it('converte e marca o próprio', () => {
    expect(normalizarDesenho(base, 'u1')).toEqual({ ...base, proprio: true });
    expect(normalizarDesenho(base, 'u2').proprio).toBe(false);
    expect(normalizarDesenho(base, undefined).proprio).toBe(false);
  });

  it('descarta pontos ímpares, curtos ou não finitos', () => {
    expect(normalizarDesenho({ ...base, pontos: [0, 0, 10] }, 'u1')).toBeNull();
    expect(normalizarDesenho({ ...base, pontos: [0, 0] }, 'u1')).toBeNull();
    expect(
      normalizarDesenho({ ...base, pontos: [0, 0, NaN, 1] }, 'u1'),
    ).toBeNull();
    expect(
      normalizarDesenho({ ...base, pontos: [0, 0, '1', 1] }, 'u1'),
    ).toBeNull();
    expect(normalizarDesenho({ ...base, pontos: 'x' }, 'u1')).toBeNull();
    expect(normalizarDesenho(null, 'u1')).toBeNull();
  });

  it('cor inválida cai no padrão', () => {
    expect(normalizarDesenho({ ...base, cor: 'azul' }, 'u1').cor).toBe(
      '#ffffff',
    );
  });
});

describe('ordenarDesenhos', () => {
  it('antigo primeiro, pendente por último', () => {
    const lista = ordenarDesenhos([
      { id: 'c', createdAt: null },
      { id: 'b', createdAt: { toMillis: () => 20 } },
      { id: 'a', createdAt: 10 },
    ]);
    expect(lista.map(d => d.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('pontosDoDesenho', () => {
  it('monta o atributo points do polyline', () => {
    expect(pontosDoDesenho({ pontos: [0, 0, 10, 10, 20, 5] })).toBe(
      '0,0 10,10 20,5',
    );
  });

  it('ignora sobra ímpar e entrada ausente', () => {
    expect(pontosDoDesenho({ pontos: [1, 2, 3] })).toBe('1,2');
    expect(pontosDoDesenho(null)).toBe('');
  });
});
