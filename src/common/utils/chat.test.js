import { describe, expect, it } from 'vitest';

import {
  CHAT_TEXTO_MAX,
  campanhaIdsDosPersonagens,
  formatarHorarioMensagem,
  isTextoMensagemValido,
  isUrlImagemValida,
  montarMensagemImagem,
  montarMensagemTexto,
  normalizarAvatar,
  personagensNaCampanha,
  rotuloPersona,
} from './chat';

describe('isUrlImagemValida', () => {
  it.each([
    'https://exemplo.com/foto.png',
    'https://exemplo.com/a/b/GIF.GIF',
    'https://exemplo.com/foto.jpeg?versao=2',
    'https://exemplo.com/foto.webp',
    'https://media.giphy.com/media/abc123/giphy.gif',
    'https://media2.giphy.com/media/abc123/giphy.webp?cid=x',
    'https://i.giphy.com/abc123',
    'https://media.tenor.com/abcDEF/AAAAC/gato.gif',
  ])('aceita URL direta de imagem: %s', url => {
    expect(isUrlImagemValida(url)).toBe(true);
  });

  it.each([
    ['página do tenor', 'https://tenor.com/view/gato-dancando-gif-123'],
    ['página do giphy', 'https://giphy.com/gifs/gato-abc123'],
    ['http sem TLS', 'http://exemplo.com/foto.png'],
    ['sem extensão de imagem', 'https://exemplo.com/foto'],
    ['javascript:', 'javascript:alert(1)'],
    ['texto solto', 'olá mundo'],
    ['vazia', '   '],
  ])('rejeita %s', (_descricao, url) => {
    expect(isUrlImagemValida(url)).toBe(false);
  });

  it('rejeita valores que não são string', () => {
    expect(isUrlImagemValida(null)).toBe(false);
    expect(isUrlImagemValida(undefined)).toBe(false);
  });
});

describe('isTextoMensagemValido', () => {
  it('rejeita mensagem vazia ou só com espaços', () => {
    expect(isTextoMensagemValido('')).toBe(false);
    expect(isTextoMensagemValido('   \n ')).toBe(false);
  });

  it('respeita o limite de caracteres', () => {
    expect(isTextoMensagemValido('a'.repeat(CHAT_TEXTO_MAX))).toBe(true);
    expect(isTextoMensagemValido('a'.repeat(CHAT_TEXTO_MAX + 1))).toBe(false);
  });
});

describe('montarMensagem*', () => {
  const jogador = {
    uid: 'uid-1',
    personagemId: 'p-1',
    autorNome: 'Aldric',
    autorAvatar: 'https://exemplo.com/aldric.png',
  };

  it('monta mensagem de texto do jogador com o texto aparado', () => {
    expect(montarMensagemTexto(jogador, '  Olá mesa!  ')).toEqual({
      uid: 'uid-1',
      personagemId: 'p-1',
      autorNome: 'Aldric',
      autorAvatar: 'https://exemplo.com/aldric.png',
      isMestre: false,
      persona: 'jogador',
      tipo: 'texto',
      texto: 'Olá mesa!',
      url: null,
    });
  });

  it('jogador nunca assume persona do mestre', () => {
    expect(
      montarMensagemTexto({ ...jogador, persona: 'npc' }, 'oi').persona,
    ).toBe('jogador');
  });

  it('mestre falando como NPC leva nome, avatar e persona do NPC', () => {
    const npc = {
      uid: 'uid-m',
      autorNome: 'Bartolomeu, o taverneiro',
      autorAvatar: 'https://exemplo.com/bart.png',
      isMestre: true,
      persona: 'npc',
    };
    expect(montarMensagemTexto(npc, 'O que vai ser?')).toMatchObject({
      isMestre: true,
      personagemId: null,
      persona: 'npc',
      autorNome: 'Bartolomeu, o taverneiro',
      autorAvatar: 'https://exemplo.com/bart.png',
    });
  });

  it('persona desconhecida do mestre vira "mestre"', () => {
    const mestre = {
      uid: 'uid-m',
      autorNome: 'Mestre',
      isMestre: true,
      persona: 'deus',
    };
    expect(montarMensagemTexto(mestre, 'x').persona).toBe('mestre');
  });

  it('monta mensagem de imagem do mestre sem personagem', () => {
    const mestre = {
      uid: 'uid-m',
      personagemId: 'ignorado',
      autorNome: 'Mestre',
      isMestre: true,
    };
    expect(
      montarMensagemImagem(mestre, ' https://exemplo.com/mapa.gif '),
    ).toEqual({
      uid: 'uid-m',
      personagemId: null,
      autorNome: 'Mestre',
      autorAvatar: null,
      isMestre: true,
      persona: 'mestre',
      tipo: 'imagem',
      texto: '',
      url: 'https://exemplo.com/mapa.gif',
    });
  });
});

describe('rotuloPersona', () => {
  it('etiqueta só mensagens do mestre como NPC/Criatura', () => {
    expect(rotuloPersona({ isMestre: true, persona: 'npc' })).toBe('NPC');
    expect(rotuloPersona({ isMestre: true, persona: 'criatura' })).toBe(
      'Criatura',
    );
    expect(rotuloPersona({ isMestre: true, persona: 'mestre' })).toBeNull();
    expect(rotuloPersona({ isMestre: true })).toBeNull();
    expect(rotuloPersona({ isMestre: false, persona: 'npc' })).toBeNull();
  });
});

describe('normalizarAvatar', () => {
  it('mantém link http(s) e descarta data: URL, vazio ou longo demais', () => {
    expect(normalizarAvatar('https://exemplo.com/a.png')).toBe(
      'https://exemplo.com/a.png',
    );
    expect(normalizarAvatar('data:image/png;base64,AAAA')).toBeNull();
    expect(normalizarAvatar('')).toBeNull();
    expect(
      normalizarAvatar(`https://exemplo.com/${'a'.repeat(2000)}`),
    ).toBeNull();
  });
});

describe('formatarHorarioMensagem', () => {
  const agora = new Date(2026, 9, 18, 20, 0);

  it('mostra só a hora para mensagens de hoje', () => {
    expect(formatarHorarioMensagem(new Date(2026, 9, 18, 9, 5), agora)).toBe(
      '09:05',
    );
  });

  it('mostra dia/mês para mensagens de outros dias', () => {
    expect(formatarHorarioMensagem(new Date(2026, 9, 3, 14, 30), agora)).toBe(
      '03/10 14:30',
    );
  });

  it('aceita Timestamp do Firestore (toDate) e ignora valor ausente', () => {
    const timestamp = { toDate: () => new Date(2026, 9, 18, 18, 45) };
    expect(formatarHorarioMensagem(timestamp, agora)).toBe('18:45');
    expect(formatarHorarioMensagem(null, agora)).toBe('');
  });
});

describe('personagensNaCampanha / campanhaIdsDosPersonagens', () => {
  const personagens = [
    { id: 'a', tipo: 'Personagem Jogável', campanhas: ['c1', 'c2'] },
    { id: 'b', campanhas: ['c1'] },
    { id: 'npc', tipo: 'NPC', campanhas: ['c1', 'c3'] },
    { id: 'comp', companheiroDe: 'a', campanhas: ['c1'] },
    { id: 'sem' },
  ];

  it('filtra só personagens jogáveis (tipo ausente conta) na campanha', () => {
    expect(personagensNaCampanha(personagens, 'c1').map(p => p.id)).toEqual([
      'a',
      'b',
    ]);
    expect(personagensNaCampanha(personagens, 'c3')).toEqual([]);
  });

  it('lista ids únicos de campanhas dos personagens jogáveis', () => {
    expect(campanhaIdsDosPersonagens(personagens)).toEqual(['c1', 'c2']);
  });
});
