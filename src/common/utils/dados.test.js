import { describe, expect, it } from 'vitest';

import {
  criticoDoResultado,
  detalheRolagem,
  ehComandoRolagem,
  especificacaoDoModal,
  interpretarComandoRolagem,
  resumoRolagem,
  rolarEspecificacao,
  rolarFace,
  validarEspecificacao,
} from './dados';

// Gera uint32 a partir de uma lista fixa (determinístico).
const sequencia = valores => {
  let i = 0;
  return () => valores[i++];
};

describe('rolarFace', () => {
  it('mapeia uint32 para 1..faces', () => {
    expect(rolarFace(6, () => 0)).toBe(1);
    expect(rolarFace(6, () => 5)).toBe(6);
    expect(rolarFace(20, () => 39)).toBe(20);
  });

  it('descarta as sobras do topo do intervalo (sem viés)', () => {
    // 2^32 % 6 = 4 → os 4 maiores uint32 são rejeitados.
    const topo = 2 ** 32 - 1;
    expect(rolarFace(6, sequencia([topo, topo - 3, 2]))).toBe(3);
  });

  it('com o crypto real fica sempre dentro da faixa', () => {
    for (let i = 0; i < 2000; i += 1) {
      const valor = rolarFace(100);
      expect(valor).toBeGreaterThanOrEqual(1);
      expect(valor).toBeLessThanOrEqual(100);
    }
  });
});

describe('interpretarComandoRolagem', () => {
  it('ignora texto comum', () => {
    expect(interpretarComandoRolagem('olá mesa')).toBeNull();
    expect(interpretarComandoRolagem('/rir')).toBeNull();
    expect(ehComandoRolagem('/R 1d6')).toBe(true);
  });

  it('interpreta 1d6+5-3', () => {
    expect(interpretarComandoRolagem('/r 1d6+5-3')).toEqual({
      secreta: false,
      grupos: [{ quantidade: 1, faces: 6 }],
      termos: [5, -3],
    });
  });

  it('aceita vários bônus/obstáculos, espaços, /roll e d20 sem quantidade', () => {
    expect(interpretarComandoRolagem('/roll d20 + 1 + 2 + 2 - 1 - 2')).toEqual({
      secreta: false,
      grupos: [{ quantidade: 1, faces: 20 }],
      termos: [1, 2, 2, -1, -2],
    });
  });

  it('aceita dados diferentes, com modificador em qualquer posição', () => {
    expect(interpretarComandoRolagem('/r 3+2d6-1+1d4')).toEqual({
      secreta: false,
      grupos: [
        { quantidade: 2, faces: 6 },
        { quantidade: 1, faces: 4 },
      ],
      termos: [3, -1],
    });
  });

  it('/rs e /gr são secretas', () => {
    expect(interpretarComandoRolagem('/rs 1d20+3').secreta).toBe(true);
    expect(interpretarComandoRolagem('/GR 1d20').secreta).toBe(true);
  });

  it.each([
    ['sem dados', '/r'],
    ['só modificador', '/r 5+3'],
    ['dado não permitido', '/r 1d7'],
    ['dado subtraído', '/r 1d20-1d4'],
    ['lixo no meio', '/r 1d6+abc'],
    ['falta operador', '/r 1d6 2'],
    ['dados demais', '/r 101d6'],
    ['termo grande demais', '/r 1d6+1000'],
  ])('rejeita %s', (_descricao, comando) => {
    expect(interpretarComandoRolagem(comando)).toHaveProperty('erro');
  });
});

describe('validarEspecificacao', () => {
  it('limita grupos e total de dados', () => {
    const onzeGrupos = Array.from({ length: 11 }, () => ({
      quantidade: 1,
      faces: 6,
    }));
    expect(validarEspecificacao({ grupos: onzeGrupos, termos: [] })).toMatch(
      /grupos/,
    );
    expect(
      validarEspecificacao({
        grupos: [
          { quantidade: 60, faces: 6 },
          { quantidade: 41, faces: 4 },
        ],
        termos: [],
      }),
    ).toMatch(/100 dados/);
    expect(
      validarEspecificacao({
        grupos: [{ quantidade: 1, faces: 6 }],
        termos: [8],
      }),
    ).toBeNull();
  });
});

describe('especificacaoDoModal', () => {
  it('converte linhas + bônus/obstáculo, omitindo zeros', () => {
    expect(
      especificacaoDoModal({
        linhas: [{ faces: 6, quantidade: 1 }],
        bonus: 8,
        obstaculo: 0,
      }),
    ).toEqual({
      secreta: false,
      grupos: [{ faces: 6, quantidade: 1 }],
      termos: [8],
    });
    expect(
      especificacaoDoModal({
        linhas: [{ faces: 20, quantidade: 2 }],
        bonus: 0,
        obstaculo: 3,
        secreta: true,
      }),
    ).toEqual({
      secreta: true,
      grupos: [{ faces: 20, quantidade: 2 }],
      termos: [-3],
    });
  });
});

describe('rolarEspecificacao + formatação', () => {
  it('reproduz o exemplo "1d6 + 8 = 14 {[6] + 8}"', () => {
    const rolagem = rolarEspecificacao(
      { grupos: [{ quantidade: 1, faces: 6 }], termos: [8] },
      () => 5,
    );
    expect(rolagem).toEqual({
      grupos: [{ quantidade: 1, faces: 6, resultados: [6] }],
      termos: [8],
      modificador: 8,
      total: 14,
    });
    expect(resumoRolagem(rolagem)).toBe('1d6 + 8');
    expect(detalheRolagem(rolagem)).toBe('{[6] + 8}');
  });

  it('dados misturados com bônus e obstáculo', () => {
    // d6: 3→4, 2→3 ; d4: 1→2
    const rolagem = rolarEspecificacao(
      {
        grupos: [
          { quantidade: 2, faces: 6 },
          { quantidade: 1, faces: 4 },
        ],
        termos: [3, -1],
      },
      sequencia([3, 2, 1]),
    );
    expect(rolagem.total).toBe(4 + 3 + 2 + 2);
    expect(resumoRolagem(rolagem)).toBe('2d6 + 1d4 + 2');
    expect(detalheRolagem(rolagem)).toBe('{[4, 3] + [2] + 3 - 1}');
  });

  it('modificador negativo e sem modificador', () => {
    const negativo = rolarEspecificacao(
      { grupos: [{ quantidade: 1, faces: 20 }], termos: [-2] },
      () => 10,
    );
    expect(resumoRolagem(negativo)).toBe('1d20 - 2');
    expect(detalheRolagem(negativo)).toBe('{[11] - 2}');
    const puro = rolarEspecificacao(
      { grupos: [{ quantidade: 3, faces: 6 }], termos: [] },
      sequencia([3, 2, 3]),
    );
    expect(resumoRolagem(puro)).toBe('3d6');
    expect(detalheRolagem(puro)).toBe('{[4, 3, 4]}');
  });
});

describe('criticoDoResultado', () => {
  it('só destaca 20 e 1 naturais no d20', () => {
    expect(criticoDoResultado(20, 20)).toBe('sucesso');
    expect(criticoDoResultado(20, 1)).toBe('falha');
    expect(criticoDoResultado(20, 10)).toBeNull();
    expect(criticoDoResultado(6, 6)).toBeNull();
  });
});
