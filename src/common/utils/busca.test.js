import { describe, it, expect } from 'vitest';
import { filtrarPorNome, normalizarBusca } from './busca';

describe('normalizarBusca', () => {
  it('remove acentos, caixa e espaços das pontas', () => {
    expect(normalizarBusca('  Ágata Çedilha ')).toBe('agata cedilha');
  });

  it('aceita valores vazios', () => {
    expect(normalizarBusca(undefined)).toBe('');
    expect(normalizarBusca(null)).toBe('');
  });
});

describe('filtrarPorNome', () => {
  const lista = [
    { id: 1, nome: 'Ágata, a Sombria' },
    { id: 2, nome: 'Bartolomeu' },
    { id: 3, nome: 'Rato Gigante' },
    { id: 4 },
  ];

  it('devolve a lista inteira com termo vazio ou só espaços', () => {
    expect(filtrarPorNome(lista, '')).toBe(lista);
    expect(filtrarPorNome(lista, '   ')).toBe(lista);
  });

  it('ignora acento e caixa', () => {
    expect(filtrarPorNome(lista, 'agata').map(i => i.id)).toEqual([1]);
    expect(filtrarPorNome(lista, 'BARTO').map(i => i.id)).toEqual([2]);
  });

  it('casa por trecho no meio do nome', () => {
    expect(filtrarPorNome(lista, 'gigan').map(i => i.id)).toEqual([3]);
  });

  it('não quebra com itens sem nome e devolve vazio quando nada casa', () => {
    expect(filtrarPorNome(lista, 'zzz')).toEqual([]);
  });

  it('aceita vários nomes por item (ex.: ficha e clone)', () => {
    const itens = [
      { id: 'a', nome: 'Original', clone: { nome: 'Apelido' } },
      { id: 'b', nome: 'Outro' },
    ];
    const obter = item => [item.nome, item.clone?.nome];
    expect(filtrarPorNome(itens, 'apel', obter).map(i => i.id)).toEqual(['a']);
  });
});
