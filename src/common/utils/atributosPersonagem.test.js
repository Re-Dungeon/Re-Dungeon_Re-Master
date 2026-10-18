import { describe, it, expect } from 'vitest';
import {
  resolverValorAtributoPrimario,
  resolverValorAtributoSecundario,
} from './atributosPersonagem';

const ALIASES_FORCA = ['forca', 'for', 'forcaBase'];
const ALIASES_ATAQUE = ['ataque', 'ataqueBase', 'ataqueBonus'];

describe('resolverValorAtributoPrimario', () => {
  it('prioriza o total já calculado mesmo quando o campo base também existe', () => {
    const personagem = { forca: 8, totais: { forca: 31 } };
    expect(resolverValorAtributoPrimario(personagem, ALIASES_FORCA)).toBe('31');
  });

  it('soma base + bônus + extra quando não há total direto', () => {
    const personagem = {
      atributosBase: { forca: 8 },
      atributosBonus: { forca: 5 },
      atributosExtra: { forca: 2 },
    };
    expect(resolverValorAtributoPrimario(personagem, ALIASES_FORCA)).toBe('15');
  });

  it('usa atributosTotais (já inclui o cultivo) em vez de só base + bônus + extra', () => {
    const personagem = {
      atributosBase: { forca: 34 },
      atributosTotais: { forca: 44 },
      cultivoBonus: { primarios: { forca: { reinoA: 10 } } },
    };
    expect(resolverValorAtributoPrimario(personagem, ALIASES_FORCA)).toBe('44');
  });

  it('inclui o bônus de cultivo na soma quando não há total pronto', () => {
    const personagem = {
      atributosBase: { forca: 34 },
      atributosExtra: { forca: 2 },
      cultivoBonus: { primarios: { forca: { reinoA: 10, reinoB: 4 } } },
    };
    expect(resolverValorAtributoPrimario(personagem, ALIASES_FORCA)).toBe('50');
  });

  it('cai para o campo cru quando não há total nem componentes', () => {
    const personagem = { forca: 8 };
    expect(resolverValorAtributoPrimario(personagem, ALIASES_FORCA)).toBe('8');
  });

  it('retorna traço quando nenhum valor existe', () => {
    expect(resolverValorAtributoPrimario({}, ALIASES_FORCA)).toBe('—');
  });
});

describe('resolverValorAtributoSecundario', () => {
  it('prioriza secundariosTotais mesmo quando o campo base também existe', () => {
    const personagem = { ataque: 3, secundariosTotais: { ataque: 12 } };
    expect(resolverValorAtributoSecundario(personagem, ALIASES_ATAQUE)).toBe(
      '12',
    );
  });

  it('soma secundariosBase + atributosBonus quando não há total direto', () => {
    const personagem = {
      secundariosBase: { ataque: 4 },
      atributosBonus: { ataque: 3 },
    };
    expect(resolverValorAtributoSecundario(personagem, ALIASES_ATAQUE)).toBe(
      '7',
    );
  });

  it('inclui o bônus de cultivo na soma quando não há total pronto', () => {
    const personagem = {
      secundariosBase: { ataque: 4 },
      cultivoBonus: { secundarios: { ataque: { reinoA: 3 } } },
    };
    expect(resolverValorAtributoSecundario(personagem, ALIASES_ATAQUE)).toBe(
      '7',
    );
  });

  it('cai para o resolvedor primário quando não há total nem componentes', () => {
    const personagem = { ataque: 4 };
    expect(resolverValorAtributoSecundario(personagem, ALIASES_ATAQUE)).toBe(
      '4',
    );
  });
});
