import { describe, it, expect } from 'vitest';
import { ordenarPorNome, ORDEM_ASC, ORDEM_DESC } from './ordenacao';

describe('ordenarPorNome', () => {
  const lista = [{ nome: 'Elfo' }, { nome: 'Anão' }, { nome: 'Orc' }];

  it('ordena de A a Z por padrão', () => {
    expect(ordenarPorNome(lista).map(i => i.nome)).toEqual([
      'Anão',
      'Elfo',
      'Orc',
    ]);
  });

  it('ordena de A a Z explicitamente', () => {
    expect(ordenarPorNome(lista, ORDEM_ASC).map(i => i.nome)).toEqual([
      'Anão',
      'Elfo',
      'Orc',
    ]);
  });

  it('ordena de Z a A quando ordem é desc', () => {
    expect(ordenarPorNome(lista, ORDEM_DESC).map(i => i.nome)).toEqual([
      'Orc',
      'Elfo',
      'Anão',
    ]);
  });

  it('não muta a lista original', () => {
    const copia = [...lista];
    ordenarPorNome(lista, ORDEM_DESC);
    expect(lista).toEqual(copia);
  });

  it('retorna lista vazia quando não recebe itens', () => {
    expect(ordenarPorNome()).toEqual([]);
  });
});
