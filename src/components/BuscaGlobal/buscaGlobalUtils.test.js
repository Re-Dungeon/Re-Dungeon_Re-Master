import { describe, it, expect } from 'vitest';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  montarItensBuscaveis,
  filtrarItensBuscaveis,
} from './buscaGlobalUtils';

describe('montarItensBuscaveis', () => {
  it('achata as listas de cada entidade num único array, com rota e tipo corretos', () => {
    const itens = montarItensBuscaveis({
      npcs: [{ id: 'npc1', nome: 'Grumnak' }],
      criaturas: [{ id: 'crt1', nome: 'Rato Gigante' }],
      cenas: [{ id: 'cena1', titulo: 'Chegada na Cidade' }],
      mapas: [{ id: 'mapa1', nome: 'Mapa da Cidade' }],
      missoes: [{ id: 'missao1', titulo: 'Resgatar o Prefeito' }],
      notas: [{ id: 'nota1', titulo: 'Ideia para a sessão' }],
    });

    expect(itens).toEqual([
      { id: 'npc1', tipo: 'NPC', titulo: 'Grumnak', rota: ROUTE_PATHS.NPCS },
      {
        id: 'crt1',
        tipo: 'Criatura',
        titulo: 'Rato Gigante',
        rota: ROUTE_PATHS.CRIATURAS,
      },
      {
        id: 'cena1',
        tipo: 'Cena',
        titulo: 'Chegada na Cidade',
        rota: ROUTE_PATHS.CENAS,
        state: { selecionarCenaId: 'cena1' },
      },
      {
        id: 'mapa1',
        tipo: 'Mapa',
        titulo: 'Mapa da Cidade',
        rota: ROUTE_PATHS.MAPAS,
      },
      {
        id: 'missao1',
        tipo: 'Missão',
        titulo: 'Resgatar o Prefeito',
        rota: ROUTE_PATHS.MISSOES,
      },
      {
        id: 'nota1',
        tipo: 'Nota',
        titulo: 'Ideia para a sessão',
        rota: ROUTE_PATHS.NOTAS,
      },
    ]);
  });

  it('lida com listas ausentes/vazias sem quebrar', () => {
    expect(montarItensBuscaveis()).toEqual([]);
    expect(montarItensBuscaveis({})).toEqual([]);
  });
});

describe('filtrarItensBuscaveis', () => {
  const itens = [
    { id: '1', tipo: 'NPC', titulo: 'Grumnak, o Orc' },
    { id: '2', tipo: 'Cena', titulo: 'Chegada na Cidade' },
    { id: '3', tipo: 'Missão', titulo: 'Ação no Porto' },
  ];

  it('não retorna nada com termo vazio ou de 1 caractere', () => {
    expect(filtrarItensBuscaveis('', itens)).toEqual([]);
    expect(filtrarItensBuscaveis('g', itens)).toEqual([]);
  });

  it('filtra por substring, ignorando maiúsculas/minúsculas', () => {
    expect(filtrarItensBuscaveis('grum', itens)).toEqual([itens[0]]);
    expect(filtrarItensBuscaveis('CIDADE', itens)).toEqual([itens[1]]);
  });

  it('ignora acentos na busca e no item', () => {
    expect(filtrarItensBuscaveis('acao', itens)).toEqual([itens[2]]);
  });

  it('retorna vazio quando nada casa', () => {
    expect(filtrarItensBuscaveis('inexistente', itens)).toEqual([]);
  });
});
