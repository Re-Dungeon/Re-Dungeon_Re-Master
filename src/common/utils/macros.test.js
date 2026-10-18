import { describe, expect, it } from 'vitest';

import {
  MACRO_CODIGO_MAX,
  encontrarMacroPorNome,
  interpretarComandoMacro,
  ordenarMacros,
  proximaOrdem,
  reordenarMacros,
  validarMacro,
} from './macros';

const MACROS = [
  { id: 'b', nome: 'Dano_Impacto', ordem: 2 },
  { id: 'a', nome: 'iniciativa', ordem: 1 },
  { id: 'c', nome: 'cura', ordem: 2 },
];

describe('ordenarMacros / proximaOrdem', () => {
  it('ordena por ordem e desempata por nome', () => {
    expect(ordenarMacros(MACROS).map(m => m.id)).toEqual(['a', 'c', 'b']);
    expect(proximaOrdem(MACROS)).toBe(3);
    expect(proximaOrdem([])).toBe(1);
  });
});

describe('comando /m', () => {
  it('interpreta o nome e ignora texto comum', () => {
    expect(interpretarComandoMacro('/m dano_impacto')).toEqual({
      nome: 'dano_impacto',
    });
    expect(interpretarComandoMacro('/M  cura  ')).toEqual({ nome: 'cura' });
    expect(interpretarComandoMacro('/m')).toHaveProperty('erro');
    expect(interpretarComandoMacro('/mestre')).toBeNull();
    expect(interpretarComandoMacro('oi')).toBeNull();
  });

  it('encontra a macro sem diferenciar maiúsculas', () => {
    expect(encontrarMacroPorNome(MACROS, ' dano_impacto ').id).toBe('b');
    expect(encontrarMacroPorNome(MACROS, 'inexistente')).toBeNull();
  });
});

describe('validarMacro', () => {
  it('exige nome e código e respeita limites', () => {
    expect(validarMacro({ nome: '', codigo: 'x' })).toMatch(/nome/);
    expect(validarMacro({ nome: 'a', codigo: '  ' })).toMatch(/código/);
    expect(validarMacro({ nome: 'a'.repeat(101), codigo: 'x' })).toMatch(/100/);
    expect(
      validarMacro({ nome: 'a', codigo: 'x'.repeat(MACRO_CODIGO_MAX + 1) }),
    ).toMatch(/50 KB/);
    expect(
      validarMacro({ nome: 'cura', descricao: '', codigo: 'enviar("x")' }),
    ).toBeNull();
  });
});

describe('reordenarMacros', () => {
  const ordenadas = ordenarMacros(MACROS); // a(1), c(2), b(2)

  it('troca de posição e renumera só o que mudou', () => {
    // a(1), c(2), b(2) → sobe b: a(1), b(2), c(3) — b já tinha ordem 2.
    expect(reordenarMacros(ordenadas, 2, -1)).toEqual([{ id: 'c', ordem: 3 }]);
    // a(1), c(2), b(2) → desce a: c(1), a(2), b(3).
    expect(reordenarMacros(ordenadas, 0, 1)).toEqual([
      { id: 'c', ordem: 1 },
      { id: 'a', ordem: 2 },
      { id: 'b', ordem: 3 },
    ]);
  });

  it('não sai dos limites da lista', () => {
    expect(reordenarMacros(ordenadas, 0, -1)).toEqual([]);
    expect(reordenarMacros(ordenadas, 2, 1)).toEqual([]);
  });
});
