import { describe, it, expect } from 'vitest';
import {
  PERSONA_MESTRE,
  autorDaPersona,
  montarJogadoresDaMesa,
  montarPersonasDoMestre,
} from './chatPersonas';

const CAMPANHA = { id: 'c1', universoId: 'u1' };

const PERSONAGENS = [
  {
    id: 'n1',
    tipo: 'NPC',
    nome: 'Zelda',
    universo: 'u1',
    campanhas: ['c1'],
    linkImagem: 'https://ex.com/z.png',
  },
  {
    id: 'n2',
    tipo: 'NPC',
    nome: 'Bartolomeu',
    universo: 'u1',
    campanhas: ['c1'],
  },
  {
    id: 'n3',
    tipo: 'NPC',
    nome: 'De outra mesa',
    universo: 'u1',
    campanhas: ['c2'],
  },
  {
    id: 'cr1',
    tipo: 'Criatura',
    nome: 'Rato Gigante',
    universo: 'u1',
    campanhas: ['c1'],
  },
  {
    id: 'cr2',
    tipo: 'Criatura',
    nome: 'Outro universo',
    universo: 'u2',
    campanhas: ['c1'],
  },
  {
    id: 'pj',
    uid: 'jogador-1',
    tipo: 'Personagem Jogável',
    nome: 'Aldric',
    universo: 'u1',
    campanhas: ['c1'],
  },
];

describe('montarPersonasDoMestre', () => {
  it('lista só NPCs e Criaturas da campanha, ordenados por nome', () => {
    const { npcs, criaturas } = montarPersonasDoMestre({
      personagens: PERSONAGENS,
      npcClones: [],
      criaturaClones: [],
      campanha: CAMPANHA,
    });

    expect(npcs.map(p => p.label)).toEqual(['Bartolomeu', 'Zelda']);
    expect(criaturas).toEqual([
      {
        id: 'criatura:cr1',
        refId: 'cr1',
        label: 'Rato Gigante',
        avatar: null,
        persona: 'criatura',
      },
    ]);
  });

  it('nome e imagem do clone da campanha vencem os do personagem de origem', () => {
    const { npcs } = montarPersonasDoMestre({
      personagens: PERSONAGENS,
      npcClones: [
        {
          origemPersonagemId: 'n2',
          nome: 'Bartolomeu, o taverneiro',
          linkImagem: 'https://ex.com/bart.png',
        },
        { origemPersonagemId: 'n1', nome: '', linkImagem: '' },
      ],
      criaturaClones: [],
      campanha: CAMPANHA,
    });

    expect(npcs).toEqual([
      {
        id: 'npc:n2',
        refId: 'n2',
        label: 'Bartolomeu, o taverneiro',
        avatar: 'https://ex.com/bart.png',
        persona: 'npc',
      },
      {
        id: 'npc:n1',
        refId: 'n1',
        label: 'Zelda',
        avatar: 'https://ex.com/z.png',
        persona: 'npc',
      },
    ]);
  });
});

describe('autorDaPersona', () => {
  it('mestre puro', () => {
    expect(autorDaPersona('m1', PERSONA_MESTRE)).toEqual({
      uid: 'm1',
      isMestre: true,
      persona: 'mestre',
      autorNome: 'Mestre',
      autorAvatar: null,
    });
  });

  it('NPC leva nome e avatar dele', () => {
    const npc = {
      id: 'npc:n1',
      label: 'Zelda',
      avatar: 'https://ex.com/z.png',
      persona: 'npc',
    };
    expect(autorDaPersona('m1', npc)).toMatchObject({
      persona: 'npc',
      autorNome: 'Zelda',
      autorAvatar: 'https://ex.com/z.png',
    });
  });
});

describe('montarJogadoresDaMesa', () => {
  it('lista os personagens jogáveis da campanha com o uid do dono', () => {
    expect(
      montarJogadoresDaMesa({
        personagens: PERSONAGENS,
        clones: [{ origemPersonagemId: 'pj', nome: 'Aldric, o Bravo' }],
        campanha: CAMPANHA,
      }),
    ).toEqual([
      {
        id: 'jogador:pj',
        refId: 'pj',
        label: 'Aldric, o Bravo',
        avatar: null,
        persona: 'jogador',
        uid: 'jogador-1',
      },
    ]);
  });
});
