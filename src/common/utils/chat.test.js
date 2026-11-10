import { describe, expect, it } from 'vitest';

import {
  CHAT_TEXTO_MAX,
  ROTULO_ROLAGEM_MAX,
  destinatariosDasMensagens,
  interpretarComandoSussurro,
  montarMensagemSussurro,
  normalizarRotulo,
  campanhaIdsDosPersonagens,
  descreverMensagemCombate,
  formatarIniciativa,
  formatarHorarioMensagem,
  isTextoMensagemValido,
  isUrlImagemValida,
  mesclarComAntigas,
  mesclarMensagens,
  montarMensagemCombate,
  montarMensagemImagem,
  montarMensagemMacro,
  montarMensagemRolagem,
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
    expect(montarMensagemTexto({ ...jogador, persona: 'npc' }, 'oi').persona).toBe(
      'jogador',
    );
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
    const mestre = { uid: 'uid-m', autorNome: 'Mestre', isMestre: true, persona: 'deus' };
    expect(montarMensagemTexto(mestre, 'x').persona).toBe('mestre');
  });

  it('monta mensagem de imagem do mestre sem personagem', () => {
    const mestre = {
      uid: 'uid-m',
      personagemId: 'ignorado',
      autorNome: 'Mestre',
      isMestre: true,
    };
    expect(montarMensagemImagem(mestre, ' https://exemplo.com/mapa.gif ')).toEqual({
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

describe('montarMensagemRolagem', () => {
  const rolagem = {
    grupos: [{ quantidade: 1, faces: 6, resultados: [6] }],
    termos: [8],
    modificador: 8,
    total: 14,
  };
  const autor = { uid: 'u1', personagemId: 'p1', autorNome: 'Wesley Chase' };

  it('rolagem pública não leva o campo secreta', () => {
    const mensagem = montarMensagemRolagem(autor, rolagem);
    expect(mensagem).toMatchObject({
      tipo: 'rolagem',
      texto: '',
      url: null,
      rolagem,
      persona: 'jogador',
    });
    expect(mensagem).not.toHaveProperty('secreta');
  });

  it('rolagem secreta leva secreta: true', () => {
    expect(montarMensagemRolagem(autor, rolagem, true).secreta).toBe(true);
  });

  it('com rótulo, grava o rótulo normalizado', () => {
    expect(
      montarMensagemRolagem(autor, rolagem, false, '  Ataque:   Golpe Duplo ').rotulo,
    ).toBe('Ataque: Golpe Duplo');
  });

  it('rótulo ausente ou vazio é omitido', () => {
    expect(montarMensagemRolagem(autor, rolagem)).not.toHaveProperty('rotulo');
    expect(montarMensagemRolagem(autor, rolagem, false, '   ')).not.toHaveProperty(
      'rotulo',
    );
    expect(montarMensagemRolagem(autor, rolagem, false, null)).not.toHaveProperty(
      'rotulo',
    );
  });

  it('trunca o rótulo em ROTULO_ROLAGEM_MAX', () => {
    const mensagem = montarMensagemRolagem(autor, rolagem, false, 'x'.repeat(300));
    expect(mensagem.rotulo).toHaveLength(ROTULO_ROLAGEM_MAX);
  });

  it('rótulo combinado com secreta', () => {
    const mensagem = montarMensagemRolagem(autor, rolagem, true, 'Arte: Bola de Fogo');
    expect(mensagem).toMatchObject({ secreta: true, rotulo: 'Arte: Bola de Fogo' });
  });
});

describe('normalizarRotulo', () => {
  it('normaliza espaços e devolve null para vazio', () => {
    expect(normalizarRotulo(' a  b ')).toBe('a b');
    expect(normalizarRotulo(undefined)).toBeNull();
    expect(normalizarRotulo('')).toBeNull();
  });
});

describe('montarMensagemMacro', () => {
  it('leva o nome da macro e o texto gerado', () => {
    const autor = { uid: 'u1', personagemId: 'p1', autorNome: 'Wesley Chase' };
    expect(montarMensagemMacro(autor, 'dano_impacto', 'DANO FINAL: 32')).toMatchObject({
      tipo: 'macro',
      macroNome: 'dano_impacto',
      texto: 'DANO FINAL: 32',
      url: null,
      persona: 'jogador',
    });
    expect(montarMensagemMacro(autor, '', 'x'.repeat(5000)).texto).toHaveLength(4000);
  });
});

describe('mesclarMensagens', () => {
  it('intercala públicas e secretas por horário; sem horário vai para o fim', () => {
    const em = minuto => ({ toMillis: () => minuto * 60000 });
    const publicas = [
      { id: 'p1', createdAt: em(1) },
      { id: 'p3', createdAt: em(3) },
      { id: 'p-pendente', createdAt: null },
    ];
    const secretas = [{ id: 's2', createdAt: new Date(2 * 60000) }];
    expect(mesclarMensagens(publicas, secretas).map(m => m.id)).toEqual([
      'p1',
      's2',
      'p3',
      'p-pendente',
    ]);
  });
});

describe('mesclarComAntigas', () => {
  const em = minuto => ({ toMillis: () => minuto * 60000 });

  it('sem antigas devolve a própria janela', () => {
    const recentes = [{ id: 'c', createdAt: em(3) }];
    expect(mesclarComAntigas(recentes, [])).toBe(recentes);
  });

  it('põe as antigas antes das recentes, em ordem cronológica', () => {
    const recentes = [
      { id: 'c', createdAt: em(3) },
      { id: 'd', createdAt: em(4) },
    ];
    const antigas = [
      { id: 'a', createdAt: em(1) },
      { id: 'b', createdAt: em(2) },
    ];
    expect(mesclarComAntigas(recentes, antigas).map(m => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('não repete mensagens que já estão na janela ao vivo (a janela vence)', () => {
    const recentes = [{ id: 'b', createdAt: em(2), texto: 'ao vivo' }];
    const antigas = [
      { id: 'a', createdAt: em(1) },
      { id: 'b', createdAt: em(2), texto: 'antiga' },
    ];
    const mescladas = mesclarComAntigas(recentes, antigas);
    expect(mescladas.map(m => m.id)).toEqual(['a', 'b']);
    expect(mescladas[1].texto).toBe('ao vivo');
  });
});

describe('rotuloPersona', () => {
  it('etiqueta só mensagens do mestre como NPC/Criatura', () => {
    expect(rotuloPersona({ isMestre: true, persona: 'npc' })).toBe('NPC');
    expect(rotuloPersona({ isMestre: true, persona: 'criatura' })).toBe('Criatura');
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
    expect(normalizarAvatar(`https://exemplo.com/${'a'.repeat(2000)}`)).toBeNull();
  });
});

describe('formatarHorarioMensagem', () => {
  const agora = new Date(2026, 9, 18, 20, 0);

  it('mostra só a hora para mensagens de hoje', () => {
    expect(formatarHorarioMensagem(new Date(2026, 9, 18, 9, 5), agora)).toBe('09:05');
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
    { id: 'compSemCampanha', companheiroDe: 'a' },
    { id: 'sem' },
  ];

  it('filtra personagens jogáveis e companheiros vinculados à campanha', () => {
    expect(personagensNaCampanha(personagens, 'c1').map(p => p.id)).toEqual([
      'a',
      'b',
      'comp',
      'compSemCampanha',
    ]);
    expect(personagensNaCampanha(personagens, 'c3')).toEqual([]);
  });

  it('lista ids únicos de campanhas dos personagens jogáveis e companheiros', () => {
    expect(campanhaIdsDosPersonagens(personagens)).toEqual(['c1', 'c2']);
  });
});

describe('mensagens de combate', () => {
  const mestre = { uid: 'm1', autorNome: 'Mestre', isMestre: true };

  it('montarMensagemCombate: tipo combate, texto vazio e o evento com a cena', () => {
    expect(
      montarMensagemCombate(mestre, {
        evento: 'inicio',
        cenaId: 'cena-1',
        rodada: 1,
        nome: 'Wesley',
        iniciativa: [{ nome: 'Wesley', total: 17, d20: 12, reacao: 5, lixo: 1 }],
      }),
    ).toEqual({
      uid: 'm1',
      personagemId: null,
      autorNome: 'Mestre',
      autorAvatar: null,
      isMestre: true,
      persona: 'mestre',
      tipo: 'combate',
      texto: '',
      url: null,
      combate: {
        evento: 'inicio',
        cenaId: 'cena-1',
        rodada: 1,
        nome: 'Wesley',
        oculto: false,
        iniciativa: [{ nome: 'Wesley', total: 17, d20: 12, reacao: 5 }],
      },
    });
  });

  it('corta nome (100) e iniciativa (200); sem nome = oculto; fim sem nome nem rodada', () => {
    const longa = Array.from({ length: 250 }, (_, i) => ({
      nome: `T${i}`,
      total: i,
      d20: 1,
      reacao: 0,
    }));
    const inicio = montarMensagemCombate(mestre, {
      evento: 'inicio',
      cenaId: 'c',
      rodada: 1,
      nome: 'x'.repeat(150),
      iniciativa: longa,
    });
    expect(inicio.combate.nome).toHaveLength(100);
    expect(inicio.combate.iniciativa).toHaveLength(200);
    expect(
      montarMensagemCombate(mestre, { evento: 'turno', cenaId: 'c', rodada: 2 }).combate,
    ).toEqual({
      evento: 'turno',
      cenaId: 'c',
      rodada: 2,
      nome: null,
      oculto: true,
    });
    expect(montarMensagemCombate(mestre, { evento: 'fim', cenaId: 'c' }).combate).toEqual(
      {
        evento: 'fim',
        cenaId: 'c',
      },
    );
  });

  it('formatarIniciativa mostra a Reação com sinal', () => {
    expect(formatarIniciativa({ nome: 'Wesley', total: 17, d20: 12, reacao: 5 })).toBe(
      'Wesley 17 (d20 12 + Reação 5)',
    );
    expect(formatarIniciativa({ nome: 'Goblin', total: 9, d20: 11, reacao: -2 })).toBe(
      'Goblin 9 (d20 11 − Reação 2)',
    );
  });

  it('descreverMensagemCombate: os quatro eventos e o oponente oculto', () => {
    expect(
      descreverMensagemCombate({
        evento: 'inicio',
        rodada: 1,
        nome: 'Wesley',
        iniciativa: [{ nome: 'Wesley', total: 17, d20: 12, reacao: 5 }],
      }),
    ).toEqual({
      titulo: 'Combate iniciado',
      iniciativa: ['Wesley 17 (d20 12 + Reação 5)'],
      linhas: ['Rodada 1 · Turno de Wesley'],
    });
    expect(
      descreverMensagemCombate({ evento: 'rodada', rodada: 3, nome: null, oculto: true }),
    ).toEqual({
      titulo: 'Rodada 3',
      iniciativa: null,
      linhas: ['Turno de um oponente oculto'],
    });
    expect(descreverMensagemCombate({ evento: 'turno', nome: 'Brina' }).titulo).toBe(
      'Turno de Brina',
    );
    expect(descreverMensagemCombate({ evento: 'fim' })).toEqual({
      titulo: 'Combate encerrado',
      iniciativa: null,
      linhas: [],
    });
  });
});

describe('interpretarComandoSussurro', () => {
  const jogadores = [
    { uid: 'u-wesley', nome: 'Wesley Chase' },
    { uid: 'u-ana', nome: 'Ana' },
    { uid: 'u-clara', nome: 'Ana Clara' },
    { uid: 'u-bia', nome: 'Beatriz Álvares' },
    { uid: 'u-bia', nome: 'Bia' },
    { uid: 'u-bruno', nome: 'Bruno' },
  ];

  it('ignora o que não é /w', () => {
    expect(interpretarComandoSussurro('oi pessoal')).toBeNull();
    expect(interpretarComandoSussurro('/r 1d20')).toBeNull();
    expect(interpretarComandoSussurro('/wx abc', jogadores)).toBeNull();
    expect(interpretarComandoSussurro('')).toBeNull();
  });

  describe('jogador (vai sempre para o mestre)', () => {
    it('aceita "/w mestre texto" e "/w texto"', () => {
      expect(interpretarComandoSussurro('/w mestre posso tentar?')).toEqual({
        jogadorUid: null,
        paraNome: 'Mestre',
        texto: 'posso tentar?',
      });
      expect(interpretarComandoSussurro('/w  Mestre   oi ')).toEqual({
        jogadorUid: null,
        paraNome: 'Mestre',
        texto: 'oi',
      });
      expect(interpretarComandoSussurro('/w vou olhar o baú')).toEqual({
        jogadorUid: null,
        paraNome: 'Mestre',
        texto: 'vou olhar o baú',
      });
      expect(interpretarComandoSussurro('/sussurro psiu')).toMatchObject({ texto: 'psiu' });
    });

    it('"mestre," colado na pontuação faz parte da mensagem', () => {
      expect(interpretarComandoSussurro('/w mestre, e agora?')).toMatchObject({
        texto: 'mestre, e agora?',
      });
    });

    it('sem mensagem devolve erro', () => {
      expect(interpretarComandoSussurro('/w').erro).toMatch(/Escreva a mensagem/);
      expect(interpretarComandoSussurro('/w mestre').erro).toMatch(/Escreva a mensagem/);
    });
  });

  describe('mestre', () => {
    it('casa por prefixo, sem acento nem caixa', () => {
      expect(interpretarComandoSussurro('/w wes cuidado com o altar', jogadores)).toEqual({
        jogadorUid: 'u-wesley',
        paraNome: 'Wesley Chase',
        texto: 'cuidado com o altar',
      });
      expect(interpretarComandoSussurro('/w beatriz alvares psiu', jogadores)).toMatchObject({
        jogadorUid: 'u-bia',
        paraNome: 'Beatriz Álvares',
        texto: 'psiu',
      });
    });

    it('nome com espaços (o mais longo vence) e nome exato vence o prefixo', () => {
      expect(
        interpretarComandoSussurro('/w Wesley Chase siga a luz', jogadores),
      ).toMatchObject({ jogadorUid: 'u-wesley', texto: 'siga a luz' });
      expect(interpretarComandoSussurro('/w ana oi', jogadores)).toMatchObject({
        jogadorUid: 'u-ana',
        texto: 'oi',
      });
      expect(interpretarComandoSussurro('/w ana clara oi', jogadores)).toMatchObject({
        jogadorUid: 'u-clara',
        texto: 'oi',
      });
    });

    it('aceita dois pontos/vírgula depois do nome', () => {
      expect(interpretarComandoSussurro('/w Bruno: vem cá', jogadores)).toMatchObject({
        jogadorUid: 'u-bruno',
        texto: 'vem cá',
      });
    });

    it('o mesmo jogador com dois nomes não é ambíguo', () => {
      expect(interpretarComandoSussurro('/w b oi', jogadores).erro).toMatch(/combina com/);
      expect(interpretarComandoSussurro('/w be oi', jogadores)).toMatchObject({
        jogadorUid: 'u-bia',
      });
    });

    it('nome ambíguo, desconhecido ou sem mensagem devolvem erro amigável', () => {
      const ambiguo = interpretarComandoSussurro('/w an oi', jogadores);
      expect(ambiguo.erro).toBe(
        '"an" combina com Ana e Ana Clara. Digite mais letras do nome.',
      );
      expect(interpretarComandoSussurro('/w zeca oi', jogadores).erro).toBe(
        'Não encontrei "zeca" entre os jogadores. Use /w Nome mensagem.',
      );
      expect(interpretarComandoSussurro('/w Bruno', jogadores).erro).toBe(
        'Escreva a mensagem do sussurro para Bruno.',
      );
      expect(interpretarComandoSussurro('/w', jogadores).erro).toBe('Use /w Nome mensagem.');
      expect(interpretarComandoSussurro('/w bruno oi', []).erro).toMatch(
        /Não há jogadores/,
      );
    });
  });
});

describe('montarMensagemSussurro', () => {
  const autor = {
    uid: 'u1',
    personagemId: 'p1',
    autorNome: 'Wesley',
    autorAvatar: null,
    isMestre: false,
  };

  it('é um texto marcado como sussurro, com o nome do destinatário', () => {
    expect(montarMensagemSussurro(autor, '  psiu  ', 'Mestre')).toEqual({
      uid: 'u1',
      personagemId: 'p1',
      autorNome: 'Wesley',
      autorAvatar: null,
      isMestre: false,
      persona: 'jogador',
      tipo: 'texto',
      texto: 'psiu',
      url: null,
      sussurro: true,
      paraNome: 'Mestre',
    });
  });

  it('limita o nome do destinatário e tem padrão', () => {
    expect(montarMensagemSussurro(autor, 'x', 'a'.repeat(300)).paraNome).toHaveLength(200);
    expect(montarMensagemSussurro(autor, 'x', '').paraNome).toBe('Mestre');
  });

  it('o mestre fala com a persona dele', () => {
    const mestre = { uid: 'm1', autorNome: 'Mestre', isMestre: true, persona: 'npc' };
    expect(montarMensagemSussurro(mestre, 'oi', 'Wesley')).toMatchObject({
      isMestre: true,
      persona: 'npc',
      personagemId: null,
      sussurro: true,
      paraNome: 'Wesley',
    });
  });
});

describe('destinatariosDasMensagens', () => {
  it('lista os jogadores que já falaram (sem repetir, sem o mestre)', () => {
    expect(
      destinatariosDasMensagens([
        { uid: 'u1', autorNome: 'Wesley', isMestre: false },
        { uid: 'u1', autorNome: 'wesley', isMestre: false },
        { uid: 'u2', autorNome: 'Ana', isMestre: false },
        { uid: 'm1', autorNome: 'Mestre', isMestre: true },
        { uid: 'u3', isMestre: false },
      ]),
    ).toEqual([
      { uid: 'u1', nome: 'Wesley' },
      { uid: 'u2', nome: 'Ana' },
    ]);
    expect(destinatariosDasMensagens(undefined)).toEqual([]);
  });
});
