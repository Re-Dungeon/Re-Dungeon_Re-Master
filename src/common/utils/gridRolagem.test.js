import { describe, expect, it } from 'vitest';

import {
  autorDoToken,
  extrairExpressaoDeDados,
  preparar,
  rotuloDeRolagem,
} from './gridRolagem';

describe('extrairExpressaoDeDados', () => {
  it('pega a expressão e ignora o texto em volta', () => {
    expect(extrairExpressaoDeDados('2d6+3 de fogo')).toBe('2d6+3');
    expect(extrairExpressaoDeDados('d20')).toBe('d20');
    expect(extrairExpressaoDeDados('1d8 + 2 (cortante)')).toBe('1d8+2');
  });

  it('pega só a primeira e não casa colado em letra', () => {
    expect(extrairExpressaoDeDados('3d6, d8 extra')).toBe('3d6');
    expect(extrairExpressaoDeDados('mão2d6')).toBeNull();
    expect(extrairExpressaoDeDados('sem dados')).toBeNull();
    expect(extrairExpressaoDeDados(null)).toBeNull();
  });
});

describe('preparar', () => {
  it('interpreta com ou sem "/r"', () => {
    expect(preparar('2d6+3')).toEqual({
      grupos: [{ quantidade: 2, faces: 6 }],
      termos: [3],
    });
    expect(preparar('/r 2d6+3')).toEqual(preparar('2d6+3'));
  });

  it('devolve erro para expressão inválida ou sem dado', () => {
    expect(preparar('')).toHaveProperty('erro');
    expect(preparar('12')).toHaveProperty('erro');
    expect(preparar('abc')).toHaveProperty('erro');
  });
});

describe('rotuloDeRolagem', () => {
  it('prefixa pelo tipo', () => {
    expect(rotuloDeRolagem('ataque', 'Golpe Duplo')).toBe('Ataque: Golpe Duplo');
    expect(rotuloDeRolagem('defesa', 'Esquiva')).toBe('Defesa: Esquiva');
    expect(rotuloDeRolagem('arte', 'Bola de Fogo')).toBe('Arte: Bola de Fogo');
  });
});

describe('autorDoToken', () => {
  const minha = { id: 'p1', linkImagem: 'https://x.com/ficha.png' };
  const outra = { id: 'p2', linkImagem: 'https://x.com/outra.png' };

  it('jogador com token da própria ficha fala como o token', () => {
    const token = {
      nome: 'Wesley',
      tipo: 'jogador',
      refId: 'p1',
      imagemUrl: 'https://x.com/tok.png',
    };
    expect(
      autorDoToken(token, { uid: 'u1', personagensDoUsuario: [minha, outra] }),
    ).toEqual({
      uid: 'u1',
      personagemId: 'p1',
      autorNome: 'Wesley',
      autorAvatar: 'https://x.com/tok.png',
      isMestre: false,
    });
  });

  it('sem imagem no token usa a da ficha', () => {
    const token = { nome: 'Wesley', tipo: 'jogador', refId: 'p1', imagemUrl: null };
    expect(
      autorDoToken(token, { uid: 'u1', personagensDoUsuario: [minha] }).autorAvatar,
    ).toBe('https://x.com/ficha.png');
  });

  it('token sem ficha minha usa o personagem padrão, ou null', () => {
    const token = { nome: 'Lobo', tipo: 'avulso', refId: null, imagemUrl: null };
    const usuario = { uid: 'u1', personagensDoUsuario: [minha] };
    expect(autorDoToken(token, usuario)).toBeNull();
    expect(autorDoToken(token, { ...usuario, personagemPadraoId: 'p1' })).toMatchObject({
      personagemId: 'p1',
      autorNome: 'Lobo',
      isMestre: false,
    });
  });

  it('mestre em NPC, criatura e avulso usa a persona do tipo', () => {
    const personas = [{ id: 'npc:n1', avatar: 'https://x.com/npc.png', persona: 'npc' }];
    const base = { uid: 'm1', mestre: true, personas };
    expect(
      autorDoToken({ nome: 'Guarda', tipo: 'npc', refId: 'n1', imagemUrl: null }, base),
    ).toEqual({
      uid: 'm1',
      personagemId: null,
      autorNome: 'Guarda',
      autorAvatar: 'https://x.com/npc.png',
      isMestre: true,
      persona: 'npc',
    });
    expect(
      autorDoToken(
        { nome: 'Lobo', tipo: 'criatura', refId: 'c1', imagemUrl: null },
        base,
      ),
    ).toMatchObject({
      persona: 'criatura',
      autorAvatar: null,
    });
    expect(
      autorDoToken(
        { nome: 'Fumaça', tipo: 'avulso', refId: null, imagemUrl: null },
        base,
      ),
    ).toMatchObject({
      persona: 'mestre',
    });
  });

  it('mestre em token de jogador não rola', () => {
    const token = { nome: 'Wesley', tipo: 'jogador', refId: 'p1' };
    expect(
      autorDoToken(token, { uid: 'm1', mestre: true, personagensDoUsuario: [minha] }),
    ).toBeNull();
  });

  it('sem token ou sem uid devolve null', () => {
    expect(autorDoToken(null, { uid: 'u1' })).toBeNull();
    expect(autorDoToken({ nome: 'A', tipo: 'npc' }, {})).toBeNull();
  });
});
