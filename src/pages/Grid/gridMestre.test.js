import { describe, it, expect } from 'vitest';
import { ACOES_CAMADA } from 'common/utils/gridCamadas';
import {
  ACOES_ATALHO,
  FERRAMENTAS,
  acaoDoAtalho,
  DESFAZER_CAMADAS_MAX,
  DURACAO_CONDICAO_MAX,
  celulasParaRevelarEmVolta,
  dadosDoSnapshot,
  edicaoMudaCamada,
  empilharDesfazer,
  snapshotDaCamada,
  alvoEhDigitacao,
  duracaoComCondicao,
  patchDeCondicoesDoToken,
  patchesDeExpiracaoDeCondicoes,
  rodadaFimDaDuracao,
  chaveDasFichasDoGrupo,
  linhasDoGrupo,
  haDialogoAberto,
  ocultoAlvoDosTokens,
  OPCOES_ACAO,
  OPCOES_FERRAMENTA,
  OPCOES_FORMA,
  celulasDoGesto,
  formasDaFerramenta,
  OPCOES_CORRIDA,
  OPCOES_TAMANHO_TOKEN,
  OPCOES_TRAVAMENTO,
  ajustarRecurso,
  auraEscolhida,
  reacaoDoToken,
  recursoDigitado,
  opcoesDeDonos,
  tokensDeJogadoresFaltantes,
  QUANTIDADE_TOKENS_MAX,
  retangulosSeCruzam,
  copiaDoToken,
  montarTokensEmLote,
  nomesNumerados,
  alternarSelecao,
  inserirVariosNoCombate,
  patchesDeCondicaoEmLote,
  patchesDeDanoEmLote,
  patchesDeOcultoEmLote,
  removerVariosDoCombate,
} from './gridMestre';

describe('retangulosSeCruzam', () => {
  const painel = { left: 12, top: 12, right: 312, bottom: 500 };

  it('token por baixo do painel cruza; ao lado não', () => {
    expect(
      retangulosSeCruzam({ left: 100, top: 100, right: 148, bottom: 148 }, painel),
    ).toBe(true);
    expect(
      retangulosSeCruzam({ left: 300, top: 100, right: 348, bottom: 148 }, painel),
    ).toBe(true);
    expect(
      retangulosSeCruzam({ left: 400, top: 100, right: 448, bottom: 148 }, painel),
    ).toBe(false);
    expect(
      retangulosSeCruzam({ left: 312, top: 100, right: 360, bottom: 148 }, painel),
    ).toBe(false);
  });

  it('retângulo vazio (jsdom) ou ausente nunca cruza', () => {
    const zero = { left: 0, top: 0, right: 0, bottom: 0 };
    expect(retangulosSeCruzam(zero, zero)).toBe(false);
    expect(retangulosSeCruzam(null, painel)).toBe(false);
  });
});

describe('opcoesDeDonos', () => {
  it('agrupa os personagens por dono e ignora quem não tem uid', () => {
    expect(
      opcoesDeDonos([
        { uid: 'u2', label: 'Zara' },
        { uid: 'u1', label: 'Aldric' },
        { uid: 'u2', label: 'Lobo' },
        { uid: null, label: 'Sem dono' },
      ]),
    ).toEqual([
      { uid: 'u1', label: 'Aldric' },
      { uid: 'u2', label: 'Zara, Lobo' },
    ]);
  });

  it('mantém donos já atribuídos que saíram da campanha', () => {
    expect(
      opcoesDeDonos([{ uid: 'u1', label: 'Aldric' }], ['u1', 'u9']),
    ).toEqual([
      { uid: 'u1', label: 'Aldric' },
      { uid: 'u9', label: 'Jogador fora da campanha' },
    ]);
  });
});

describe('OPCOES_TAMANHO_TOKEN', () => {
  it('vai de 1×1 a 10×10', () => {
    expect(OPCOES_TAMANHO_TOKEN).toHaveLength(10);
    expect(OPCOES_TAMANHO_TOKEN[2]).toEqual({ value: 3, label: '3×3' });
  });
});

describe('tokensDeJogadoresFaltantes', () => {
  const limites = { colunas: 3, linhas: 3 };
  const JOGADORES = [
    { refId: 'p1', label: 'Aldric', avatar: 'https://ex.com/a.png', uid: 'u1' },
    { refId: 'p2', label: 'Zara', avatar: null, uid: 'u2' },
    { refId: 'p3', label: 'Sem dono', avatar: null, uid: null },
  ];

  it('cria um token por jogador ausente, atribuído ao dono, em células livres', () => {
    const tokens = tokensDeJogadoresFaltantes(
      JOGADORES,
      [
        { tipo: 'jogador', refId: 'p1', col: 0, lin: 0, tamanho: 1 },
        { tipo: 'npc', refId: 'p2', col: 1, lin: 0, tamanho: 1 },
      ],
      limites,
    );
    expect(tokens).toEqual([
      {
        nome: 'Zara',
        imagemUrl: null,
        tipo: 'jogador',
        refId: 'p2',
        donos: ['u2'],
        tamanho: 1,
        oculto: false,
        col: 2,
        lin: 0,
      },
      expect.objectContaining({ refId: 'p3', donos: [], col: 0, lin: 1 }),
    ]);
  });

  it('respeita o limite de tokens por cena', () => {
    const cheia = Array.from({ length: 199 }, (_, i) => ({
      tipo: 'avulso',
      col: i % 30,
      lin: Math.floor(i / 30),
      tamanho: 1,
    }));
    expect(
      tokensDeJogadoresFaltantes(JOGADORES, cheia, { colunas: 30, linhas: 20 }),
    ).toHaveLength(1);
  });
});

describe('combate do token', () => {
  const pv = { atual: 10, max: 20 };

  it('ajustarRecurso fica entre 0 e o máximo', () => {
    expect(ajustarRecurso(pv, 1)).toEqual({ atual: 11, max: 20 });
    expect(ajustarRecurso({ atual: 0, max: 20 }, -1)).toEqual({
      atual: 0,
      max: 20,
    });
    expect(ajustarRecurso({ atual: 20, max: 20 }, 1)).toEqual({
      atual: 20,
      max: 20,
    });
    expect(ajustarRecurso(null, 1)).toBeNull();
  });

  it('recursoDigitado: max vazio ou 0 remove; max novo cria cheio', () => {
    expect(recursoDigitado(pv, 'max', '')).toBeNull();
    expect(recursoDigitado(pv, 'max', '0')).toBeNull();
    expect(recursoDigitado(null, 'max', '15')).toEqual({ atual: 15, max: 15 });
    expect(recursoDigitado(pv, 'max', '5')).toEqual({ atual: 5, max: 5 });
    expect(recursoDigitado(pv, 'atual', '7')).toEqual({ atual: 7, max: 20 });
    expect(recursoDigitado(pv, 'atual', '99')).toEqual({ atual: 20, max: 20 });
    expect(recursoDigitado(pv, 'atual', 'abc')).toBe(pv);
    // Com sinal é relativo ao atual (dano/cura), limitado a 0..max.
    expect(recursoDigitado({ atual: 12, max: 20 }, 'atual', '-7')).toEqual({
      atual: 5,
      max: 20,
    });
    expect(recursoDigitado({ atual: 12, max: 20 }, 'atual', '+5')).toEqual({
      atual: 17,
      max: 20,
    });
    expect(recursoDigitado({ atual: 12, max: 20 }, 'atual', '-99')).toEqual({
      atual: 0,
      max: 20,
    });
    expect(recursoDigitado(null, 'atual', '3')).toBeNull();
  });

  it('auraEscolhida: sem cor = sem aura; raio limitado', () => {
    expect(auraEscolhida('', 3)).toBeNull();
    expect(auraEscolhida('#e05555', '2')).toEqual({ raio: 2, cor: '#e05555' });
    expect(auraEscolhida('#e05555', '0')).toEqual({ raio: 1, cor: '#e05555' });
    expect(auraEscolhida('#e05555', '5000')).toEqual({
      raio: 999,
      cor: '#e05555',
    });
    expect(auraEscolhida('#e05555', 'x')).toEqual({ raio: 1, cor: '#e05555' });
  });
});

describe('combate (Fase 3A)', () => {
  it('OPCOES_TRAVAMENTO e OPCOES_CORRIDA têm os valores da regra', () => {
    expect(OPCOES_TRAVAMENTO.map(o => o.value)).toEqual([
      'livre',
      'turno',
      'congelado',
    ]);
    expect(OPCOES_CORRIDA).toEqual([
      { value: 2, label: '2×' },
      { value: 1.5, label: '1,5×' },
    ]);
  });

  describe('reacaoDoToken', () => {
    const fichas = { pj1: { secundariosTotais: { reacao: 9 } } };
    const fontes = {
      npcs: [{ refId: 'n1', reacao: 7 }],
      criaturas: [{ refId: 'cr1', reacao: null }],
      jogadores: [{ refId: 'pj1', reacao: 6 }],
    };

    it('jogador usa a ficha ao vivo', () => {
      expect(reacaoDoToken({ refId: 'pj1' }, { fichas, fontes })).toBe(9);
    });

    it('NPC usa a Reação da persona da mesa', () => {
      expect(reacaoDoToken({ refId: 'n1' }, { fichas, fontes })).toBe(7);
    });

    it('sem refId ou sem dados: null (o mestre informa)', () => {
      expect(reacaoDoToken({ refId: null }, { fichas, fontes })).toBeNull();
      expect(reacaoDoToken({ refId: 'cr1' }, { fichas, fontes })).toBeNull();
      expect(reacaoDoToken({ refId: 'x' })).toBeNull();
    });
  });
});

describe('ferramentas do mapa', () => {
  it('lista as quatro ferramentas, Mover primeiro', () => {
    expect(OPCOES_FERRAMENTA.map(opcao => opcao.value)).toEqual([
      FERRAMENTAS.MOVER,
      FERRAMENTAS.PAREDES,
      FERRAMENTAS.NEVOA,
      FERRAMENTAS.MARCADORES,
    ]);
  });

  it('formas: pincel, retângulo e sala (a sala só na névoa)', () => {
    expect(OPCOES_FORMA.map(opcao => opcao.value)).toEqual([
      'pincel',
      'retangulo',
      'sala',
    ]);
    expect(
      formasDaFerramenta(FERRAMENTAS.NEVOA).map(opcao => opcao.value),
    ).toContain('sala');
    expect(
      formasDaFerramenta(FERRAMENTAS.PAREDES).map(opcao => opcao.value),
    ).toEqual(['pincel', 'retangulo']);
  });

  it('celulasDoGesto: sala expande pelas paredes, demais formas ficam como estão', () => {
    const paredes = new Set(['2,0', '2,1', '2,2']);
    const limites = { colunas: 3, linhas: 3 };
    const sala = celulasDoGesto({
      forma: 'sala',
      celulas: [{ col: 0, lin: 0 }],
      bloqueadas: paredes,
      limites,
    });
    expect(sala.estourou).toBe(false);
    expect(sala.celulas).toHaveLength(6);
    const pincel = [{ col: 0, lin: 0 }];
    expect(
      celulasDoGesto({ forma: 'pincel', celulas: pincel, bloqueadas: paredes, limites }),
    ).toEqual({ celulas: pincel, estourou: false });
    const grande = celulasDoGesto({
      forma: 'sala',
      celulas: [{ col: 0, lin: 0 }],
      bloqueadas: new Set(),
      limites: { colunas: 100, linhas: 100 },
    });
    expect(grande).toEqual({ celulas: [], estourou: true });
  });

  it('ações: névoa revela (adicionar) e cobre (remover); paredes adicionam e apagam', () => {
    const nevoa = OPCOES_ACAO[FERRAMENTAS.NEVOA];
    expect(nevoa.find(opcao => opcao.label === 'Revelar').value).toBe(
      ACOES_CAMADA.ADICIONAR,
    );
    expect(nevoa.find(opcao => opcao.label === 'Cobrir').value).toBe(
      ACOES_CAMADA.REMOVER,
    );
    expect(OPCOES_ACAO[FERRAMENTAS.PAREDES].map(opcao => opcao.value)).toEqual([
      ACOES_CAMADA.ADICIONAR,
      ACOES_CAMADA.REMOVER,
    ]);
  });
});

describe('várias cópias de token', () => {
  const limites = { colunas: 5, linhas: 5 };

  it('nomesNumerados: Goblin, Goblin 2, Goblin 3 e continua do maior usado', () => {
    expect(nomesNumerados('Goblin', [], 3)).toEqual([
      'Goblin',
      'Goblin 2',
      'Goblin 3',
    ]);
    expect(nomesNumerados('Goblin', ['Goblin', 'Goblin 4', 'Orc'], 2)).toEqual([
      'Goblin 5',
      'Goblin 6',
    ]);
    expect(nomesNumerados('Goblin', ['Goblin'], 1)).toEqual(['Goblin 2']);
    expect(nomesNumerados('Orc (chefe)', ['Orc (chefe)'], 1)).toEqual([
      'Orc (chefe) 2',
    ]);
    expect(nomesNumerados('  ', [], 1)).toEqual(['Token']);
    expect(nomesNumerados('x', [], 999)).toHaveLength(QUANTIDADE_TOKENS_MAX);
  });

  it('nomesNumerados respeita o tamanho máximo do nome', () => {
    const longo = 'a'.repeat(100);
    const [, segundo] = nomesNumerados(longo, [], 2);
    expect(segundo.length).toBeLessThanOrEqual(100);
    expect(segundo.endsWith(' 2')).toBe(true);
  });

  it('montarTokensEmLote não empilha as cópias', () => {
    const tokens = montarTokensEmLote(
      { nome: 'Goblin', tipo: 'npc', tamanho: 1 },
      3,
      [{ id: 't', nome: 'Herói', col: 0, lin: 0, tamanho: 1 }],
      limites,
    );
    expect(tokens.map(token => token.nome)).toEqual([
      'Goblin',
      'Goblin 2',
      'Goblin 3',
    ]);
    expect(tokens.map(token => [token.col, token.lin])).toEqual([
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
  });

  it('copiaDoToken mantém os campos de jogo e tira rastro/datas/posição', () => {
    const original = {
      id: 'a',
      nome: 'Goblin',
      tipo: 'npc',
      tamanho: 1,
      col: 0,
      lin: 0,
      donos: [],
      oculto: true,
      pv: { atual: 3, max: 7 },
      condicoes: ['c1'],
      rastro: [0, 0, 1, 1],
      movidoEm: 5,
      createdAt: 1,
      updatedAt: 2,
    };
    const copia = copiaDoToken(original, [original], limites);
    expect(copia).toEqual({
      nome: 'Goblin 2',
      tipo: 'npc',
      tamanho: 1,
      col: 1,
      lin: 0,
      donos: [],
      oculto: true,
      pv: { atual: 3, max: 7 },
      condicoes: ['c1'],
    });
  });
});

describe('alternarSelecao', () => {
  it('com 1 token vale selecionadoId; com ≥ 2, selecionadosIds', () => {
    expect(alternarSelecao({}, 'a')).toEqual({
      selecionadoId: 'a',
      selecionadosIds: [],
    });
    // Shift-clique em outro token parte do selecionado atual.
    expect(alternarSelecao({ selecionadoId: 'a' }, 'b')).toEqual({
      selecionadoId: null,
      selecionadosIds: ['a', 'b'],
    });
    expect(alternarSelecao({ selecionadosIds: ['a', 'b'] }, 'c')).toEqual({
      selecionadoId: null,
      selecionadosIds: ['a', 'b', 'c'],
    });
  });

  it('alternar de novo tira o token; sobrando 1 volta ao selecionado único', () => {
    expect(alternarSelecao({ selecionadosIds: ['a', 'b', 'c'] }, 'b')).toEqual({
      selecionadoId: null,
      selecionadosIds: ['a', 'c'],
    });
    expect(alternarSelecao({ selecionadosIds: ['a', 'b'] }, 'b')).toEqual({
      selecionadoId: 'a',
      selecionadosIds: [],
    });
    expect(alternarSelecao({ selecionadoId: 'a' }, 'a')).toEqual({
      selecionadoId: null,
      selecionadosIds: [],
    });
  });
});

describe('patchesDeDanoEmLote', () => {
  const GOBLINS = [
    { id: 'g1', tipo: 'criatura', pv: { atual: 10, max: 12 } },
    { id: 'g2', tipo: 'npc', pv: { atual: 3, max: 8 } },
    { id: 'g3', tipo: 'avulso', pv: { atual: 8, max: 8 } },
  ];

  it('"-5" tira do PV atual de cada um, sem passar de 0', () => {
    const { patches } = patchesDeDanoEmLote(GOBLINS, '-5');
    expect(patches).toEqual([
      { id: 'g1', patch: { pv: { atual: 5, max: 12 } } },
      { id: 'g2', patch: { pv: { atual: 0, max: 8 } } },
      { id: 'g3', patch: { pv: { atual: 3, max: 8 } } },
    ]);
  });

  it('"+5" cura limitado ao máximo; quem não muda não gera patch', () => {
    const { patches } = patchesDeDanoEmLote(GOBLINS, '+5');
    expect(patches).toEqual([
      { id: 'g1', patch: { pv: { atual: 12, max: 12 } } },
      { id: 'g2', patch: { pv: { atual: 8, max: 8 } } },
    ]);
  });

  it('número sem sinal define o valor (limitado a 0..max)', () => {
    const { patches } = patchesDeDanoEmLote(GOBLINS, '6');
    expect(patches.map(p => [p.id, p.patch.pv.atual])).toEqual([
      ['g1', 6],
      ['g2', 6],
      ['g3', 6],
    ]);
    // 99 vira o máximo de cada um; quem já estava cheio (g3) não muda.
    expect(
      patchesDeDanoEmLote(GOBLINS, '99').patches.map(p => [
        p.id,
        p.patch.pv.atual,
      ]),
    ).toEqual([
      ['g1', 12],
      ['g2', 8],
    ]);
  });

  it('ignora jogadores e tokens sem PV, contando cada grupo', () => {
    const resultado = patchesDeDanoEmLote(
      [
        { id: 'j1', tipo: 'jogador', pv: { atual: 5, max: 5 } },
        { id: 'a1', tipo: 'avulso' },
        GOBLINS[0],
      ],
      '-1',
    );
    expect(resultado.jogadores).toBe(1);
    expect(resultado.semPv).toBe(1);
    expect(resultado.patches).toEqual([
      { id: 'g1', patch: { pv: { atual: 9, max: 12 } } },
    ]);
  });

  it('texto vazio ou inválido não gera patch (mas ainda conta os ignorados)', () => {
    expect(patchesDeDanoEmLote(GOBLINS, '').patches).toEqual([]);
    expect(patchesDeDanoEmLote(GOBLINS, 'abc').patches).toEqual([]);
    expect(
      patchesDeDanoEmLote([{ id: 'j', tipo: 'jogador' }], '').jogadores,
    ).toBe(1);
  });
});

describe('patchesDeCondicaoEmLote', () => {
  it('adiciona a condição a quem não a tem, mantendo as outras', () => {
    const { patches } = patchesDeCondicaoEmLote(
      [
        { id: 'g1', tipo: 'criatura', condicoes: ['c2'] },
        { id: 'g2', tipo: 'criatura', condicoes: ['c1'] },
        { id: 'g3', tipo: 'npc' },
      ],
      'c1',
      true,
    );
    expect(patches).toEqual([
      { id: 'g1', patch: { condicoes: ['c2', 'c1'] } },
      { id: 'g3', patch: { condicoes: ['c1'] } },
    ]);
  });

  it('remove só de quem a tem', () => {
    const { patches } = patchesDeCondicaoEmLote(
      [
        { id: 'g1', tipo: 'criatura', condicoes: ['c1', 'c2'] },
        { id: 'g2', tipo: 'criatura', condicoes: ['c2'] },
      ],
      'c1',
      false,
    );
    expect(patches).toEqual([{ id: 'g1', patch: { condicoes: ['c2'] } }]);
  });

  it('ignora jogadores e conta quem já está com o máximo de condições', () => {
    const cheio = Array.from({ length: 20 }, (_, i) => `x${i}`);
    const resultado = patchesDeCondicaoEmLote(
      [
        { id: 'j1', tipo: 'jogador' },
        { id: 'g1', tipo: 'criatura', condicoes: cheio },
      ],
      'c1',
      true,
    );
    expect(resultado).toEqual({ patches: [], jogadores: 1, cheios: 1 });
  });
});

describe('patchesDeOcultoEmLote', () => {
  it('muda só quem está diferente, inclusive jogadores', () => {
    const tokens = [
      { id: 'a', tipo: 'jogador', oculto: false },
      { id: 'b', tipo: 'criatura', oculto: true },
      { id: 'c', tipo: 'npc' },
    ];
    expect(patchesDeOcultoEmLote(tokens, true)).toEqual([
      { id: 'a', patch: { oculto: true } },
      { id: 'c', patch: { oculto: true } },
    ]);
    expect(patchesDeOcultoEmLote(tokens, false)).toEqual([
      { id: 'b', patch: { oculto: false } },
    ]);
  });
});

describe('inserirVariosNoCombate / removerVariosDoCombate', () => {
  const item = (tokenId, iniciativa) => ({
    tokenId,
    iniciativa,
    d20: null,
    reacao: 0,
  });
  const COMBATE = {
    ordem: [item('a', 20), item('b', 10)],
    indice: 1,
    rodada: 2,
  };

  it('insere vários na ordem certa, acompanhando o token da vez', () => {
    const resultado = inserirVariosNoCombate(COMBATE, [
      item('c', 15),
      item('d', 5),
      item('a', 1),
    ]);
    expect(resultado.patch.ordem.map(i => i.tokenId)).toEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
    // O token da vez ("b") foi de 1 para 2.
    expect(resultado.patch.indice).toBe(2);
    expect(resultado.mudouTurno).toBe(false);
  });

  it('null se ninguém novo entra', () => {
    expect(inserirVariosNoCombate(COMBATE, [item('a', 1)])).toBeNull();
  });

  it('tira vários de uma vez; sair o token da vez passa o turno', () => {
    const tokens = [{ id: 'c', col: 2, lin: 3 }];
    const combate = {
      ordem: [item('a', 20), item('b', 10), item('c', 5)],
      indice: 1,
      rodada: 1,
    };
    const resultado = removerVariosDoCombate(combate, ['a', 'b'], tokens);
    expect(resultado.patch.ordem.map(i => i.tokenId)).toEqual(['c']);
    expect(resultado.patch.indice).toBe(0);
    expect(resultado.patch.inicioTurno).toEqual({ col: 2, lin: 3 });
    expect(resultado.mudouTurno).toBe(true);
  });

  it('encerra se saem todos e devolve null se ninguém participa', () => {
    expect(removerVariosDoCombate(COMBATE, ['a', 'b'], [])).toEqual({
      encerrar: true,
    });
    expect(removerVariosDoCombate(COMBATE, ['z'], [])).toBeNull();
  });
});

describe('acaoDoAtalho', () => {
  const tecla = (key, extra = {}) => acaoDoAtalho({ key, ...extra });

  it('N avança e Shift+N volta o turno', () => {
    expect(tecla('n')).toEqual({ acao: ACOES_ATALHO.PROXIMO_TURNO });
    expect(tecla('N', { shiftKey: true })).toEqual({
      acao: ACOES_ATALHO.TURNO_ANTERIOR,
    });
  });

  it('H, Delete e as ferramentas V/W/F/M', () => {
    expect(tecla('h')).toEqual({ acao: ACOES_ATALHO.OCULTAR });
    expect(tecla('Delete')).toEqual({ acao: ACOES_ATALHO.EXCLUIR });
    expect(tecla('v')).toEqual({
      acao: ACOES_ATALHO.FERRAMENTA,
      ferramenta: FERRAMENTAS.MOVER,
    });
    expect(tecla('W').ferramenta).toBe(FERRAMENTAS.PAREDES);
    expect(tecla('f').ferramenta).toBe(FERRAMENTAS.NEVOA);
    expect(tecla('m').ferramenta).toBe(FERRAMENTAS.MARCADORES);
  });

  it('Ctrl+Z (ou ⌘+Z) desfaz; Ctrl+Shift+Z não', () => {
    expect(tecla('z', { ctrlKey: true })).toEqual({
      acao: ACOES_ATALHO.DESFAZER,
    });
    expect(tecla('z', { metaKey: true })).toEqual({
      acao: ACOES_ATALHO.DESFAZER,
    });
    expect(tecla('z', { ctrlKey: true, shiftKey: true })).toBeNull();
    expect(tecla('z')).toBeNull();
  });

  it('"?" abre a ajuda', () => {
    expect(tecla('?', { shiftKey: true })).toEqual({
      acao: ACOES_ATALHO.AJUDA,
    });
  });

  it('ignora modificadores nas demais teclas, repetição e teclas soltas', () => {
    expect(tecla('n', { ctrlKey: true })).toBeNull();
    expect(tecla('h', { altKey: true })).toBeNull();
    expect(tecla('h', { shiftKey: true })).toBeNull();
    expect(tecla('w', { metaKey: true })).toBeNull();
    expect(tecla('n', { repeat: true })).toBeNull();
    expect(tecla('x')).toBeNull();
    expect(tecla('Enter')).toBeNull();
    expect(acaoDoAtalho()).toBeNull();
  });
});

describe('alvoEhDigitacao e haDialogoAberto', () => {
  it('campos de texto, select e contentEditable são digitação', () => {
    expect(alvoEhDigitacao(document.createElement('input'))).toBe(true);
    expect(alvoEhDigitacao(document.createElement('textarea'))).toBe(true);
    expect(alvoEhDigitacao(document.createElement('select'))).toBe(true);
    const combo = document.createElement('div');
    combo.setAttribute('role', 'combobox');
    expect(alvoEhDigitacao(combo)).toBe(true);
    expect(alvoEhDigitacao(document.createElement('button'))).toBe(false);
    expect(alvoEhDigitacao(null)).toBe(false);
    expect(alvoEhDigitacao(window)).toBe(false);
  });

  it('role="dialog" bloqueia, mas o cartão do marcador não', () => {
    const cartao = document.createElement('div');
    cartao.setAttribute('role', 'dialog');
    cartao.setAttribute('data-marcador-cartao', '');
    document.body.appendChild(cartao);
    expect(haDialogoAberto()).toBe(false);
    const dialogo = document.createElement('div');
    dialogo.setAttribute('role', 'dialog');
    document.body.appendChild(dialogo);
    expect(haDialogoAberto()).toBe(true);
    cartao.remove();
    dialogo.remove();
    expect(haDialogoAberto()).toBe(false);
  });
});

describe('ocultoAlvoDosTokens', () => {
  it('oculta, a menos que todos já estejam ocultos', () => {
    expect(ocultoAlvoDosTokens([{ oculto: false }])).toBe(true);
    expect(ocultoAlvoDosTokens([{ oculto: true }, { oculto: false }])).toBe(
      true,
    );
    expect(ocultoAlvoDosTokens([{ oculto: true }, { oculto: true }])).toBe(
      false,
    );
    expect(ocultoAlvoDosTokens([])).toBe(true);
  });
});

describe('linhasDoGrupo', () => {
  const JOGADORES = [
    { refId: 'p2', uid: 'u2', label: 'Brina', avatar: 'https://ex.com/b.png' },
    { refId: 'p1', uid: 'u1', label: 'Aldric', avatar: null },
  ];
  const FICHA = {
    status: { hp: { atual: 4, maximo: 10 } },
    condicoesAtivas: [
      { condicaoId: 'c1', stack: 3 },
      { condicaoId: 'fora-do-catalogo', stack: 1 },
    ],
    prontidaoAtual: 2,
    prontidaoMaximaEfetiva: 5,
  };
  const CATALOGO = new Map([['c1', { id: 'c1', nome: 'Sangrando' }]]);

  it('uma linha por jogável, em ordem alfabética, com o token da cena', () => {
    const token = { id: 't9', tipo: 'jogador', refId: 'p1' };
    const linhas = linhasDoGrupo(JOGADORES, {
      fichas: { p1: FICHA },
      tokens: [{ id: 'x', tipo: 'npc', refId: 'p1' }, token],
      catalogoPorId: CATALOGO,
    });
    expect(linhas.map(l => l.nome)).toEqual(['Aldric', 'Brina']);
    const [aldric, brina] = linhas;
    expect(aldric.token).toBe(token);
    expect(aldric.recursos.pv).toEqual({ atual: 4, max: 10 });
    expect(aldric.pp).toEqual({ atual: 2, max: 5 });
    expect(aldric.condicoes).toEqual([
      { id: 'c1', nome: 'Sangrando', icone: null, stack: 3 },
    ]);
    expect(aldric.semFicha).toBe(false);
    // Sem ficha ao vivo e sem token na cena: linha vazia.
    expect(brina).toMatchObject({
      semFicha: true,
      recursos: null,
      pp: null,
      condicoes: [],
      token: null,
      avatar: 'https://ex.com/b.png',
    });
  });
});

describe('chaveDasFichasDoGrupo', () => {
  it('ids únicos e ordenados, sem vazios', () => {
    expect(
      chaveDasFichasDoGrupo([
        { refId: 'b' },
        { refId: 'a' },
        { refId: 'b' },
        { refId: null },
      ]),
    ).toBe('a|b');
    expect(chaveDasFichasDoGrupo([])).toBe('');
  });
});

describe('duração das condições (condicoesDuracao)', () => {
  const NPC = {
    id: 'n1',
    nome: 'Goblin',
    tipo: 'npc',
    condicoes: ['a', 'b', 'c'],
    condicoesDuracao: { a: 2, b: 5 },
  };

  it('rodadaFimDaDuracao: R + N − 1, sem combate a partir da rodada 1', () => {
    expect(rodadaFimDaDuracao('3', 4)).toBe(6);
    expect(rodadaFimDaDuracao(1, 4)).toBe(4);
    expect(rodadaFimDaDuracao('3')).toBe(3);
    expect(rodadaFimDaDuracao('3', null)).toBe(3);
    expect(rodadaFimDaDuracao('', 2)).toBeNull();
    expect(rodadaFimDaDuracao('0', 2)).toBeNull();
    expect(rodadaFimDaDuracao('abc', 2)).toBeNull();
    expect(rodadaFimDaDuracao('500', 1)).toBe(DURACAO_CONDICAO_MAX);
  });

  it('duracaoComCondicao põe, troca e tira a chave (vazio = sem prazo)', () => {
    expect(duracaoComCondicao(NPC, 'c', '2', 3)).toEqual({ a: 2, b: 5, c: 4 });
    expect(duracaoComCondicao(NPC, 'a', '1', 3)).toEqual({ a: 3, b: 5 });
    expect(duracaoComCondicao(NPC, 'a', '', 3)).toEqual({ b: 5 });
    // Não muda o token.
    expect(NPC.condicoesDuracao).toEqual({ a: 2, b: 5 });
  });

  it('patchDeCondicoesDoToken tira a duração de quem saiu', () => {
    expect(patchDeCondicoesDoToken(NPC, ['a', 'c'])).toEqual({
      condicoes: ['a', 'c'],
      condicoesDuracao: { a: 2 },
    });
    // Sem duração afetada, o campo nem entra no patch.
    expect(patchDeCondicoesDoToken(NPC, ['a', 'b'])).toEqual({
      condicoes: ['a', 'b'],
    });
    expect(
      patchDeCondicoesDoToken({ ...NPC, condicoesDuracao: undefined }, ['x']),
    ).toEqual({ condicoes: ['x'] });
  });

  it('patchesDeExpiracaoDeCondicoes: vence quando a rodada passa do fim', () => {
    const jogador = { id: 'j', tipo: 'jogador', condicoesDuracao: { a: 1 } };
    // Rodada 2: "a" (fim 2) ainda vale.
    expect(patchesDeExpiracaoDeCondicoes([NPC, jogador], 2)).toEqual({
      patches: [],
      expiradas: [],
    });
    // Rodada 3: "a" venceu; "b" (fim 5) e "c" (sem prazo) ficam.
    expect(patchesDeExpiracaoDeCondicoes([NPC, jogador], 3)).toEqual({
      patches: [
        {
          id: 'n1',
          patch: { condicoes: ['b', 'c'], condicoesDuracao: { b: 5 } },
        },
      ],
      expiradas: [{ tokenId: 'n1', nome: 'Goblin', ids: ['a'] }],
    });
    // Rodada 6: as duas com prazo venceram.
    const { patches } = patchesDeExpiracaoDeCondicoes([NPC], 6);
    expect(patches[0].patch).toEqual({
      condicoes: ['c'],
      condicoesDuracao: {},
    });
    // Sem combate (rodada nula) nada vence; idempotente depois de gravar.
    expect(patchesDeExpiracaoDeCondicoes([NPC], null).patches).toEqual([]);
    expect(
      patchesDeExpiracaoDeCondicoes([{ ...NPC, ...patches[0].patch }], 6)
        .patches,
    ).toEqual([]);
  });

  it('remover uma condição em lote leva a duração junto', () => {
    const { patches } = patchesDeCondicaoEmLote([NPC], 'a', false);
    expect(patches).toEqual([
      {
        id: 'n1',
        patch: { condicoes: ['b', 'c'], condicoesDuracao: { b: 5 } },
      },
    ]);
  });
});

describe('desfazer das camadas e revelar em volta (puro)', () => {
  const camadas = {
    bloqueadas: new Set(['1,1', '2,1']),
    nevoa: { ativa: true, reveladas: new Set(['0,0']) },
  };

  it('snapshotDaCamada copia o conjunto da camada pedida', () => {
    const paredes = snapshotDaCamada('paredes', camadas);
    expect(paredes).toEqual({ camada: 'paredes', celulas: camadas.bloqueadas });
    expect(paredes.celulas).not.toBe(camadas.bloqueadas);
    expect([...snapshotDaCamada('nevoa', camadas).celulas]).toEqual(['0,0']);
    expect(snapshotDaCamada('nevoa', null).celulas.size).toBe(0);
  });

  it('empilharDesfazer guarda só as últimas 20', () => {
    let pilha = [];
    for (let i = 1; i <= 25; i += 1) {
      pilha = empilharDesfazer(pilha, { id: i });
    }
    expect(pilha).toHaveLength(DESFAZER_CAMADAS_MAX);
    expect(pilha[0].id).toBe(6);
    expect(pilha[19].id).toBe(25);
    expect(empilharDesfazer([{ id: 1 }, { id: 2 }], { id: 3 }, 2)).toEqual([
      { id: 2 },
      { id: 3 },
    ]);
  });

  it('dadosDoSnapshot: paredes só com trechos; névoa mantém o "ativa" de agora', () => {
    const entrada = snapshotDaCamada('paredes', camadas);
    expect(dadosDoSnapshot(entrada, camadas)).toEqual({ trechos: '1:1-2' });
    const nevoa = { camada: 'nevoa', celulas: new Set(['3,2']) };
    expect(dadosDoSnapshot(nevoa, camadas)).toEqual({
      ativa: true,
      trechos: '2:3',
    });
    expect(
      dadosDoSnapshot(nevoa, { nevoa: { ativa: false, reveladas: new Set() } }),
    ).toEqual({ ativa: false, trechos: '2:3' });
  });

  it('edicaoMudaCamada ignora o que já está assim e o que cai fora do mundo', () => {
    const atuais = new Set(['0,0', '1,0']);
    const limites = { colunas: 5, linhas: 5 };
    expect(
      edicaoMudaCamada(atuais, 'adicionar', [{ col: 0, lin: 0 }], limites),
    ).toBe(false);
    expect(
      edicaoMudaCamada(atuais, 'remover', [{ col: 4, lin: 4 }], limites),
    ).toBe(false);
    expect(
      edicaoMudaCamada(atuais, 'adicionar', [{ col: 9, lin: 9 }], limites),
    ).toBe(false);
    expect(
      edicaoMudaCamada(atuais, 'adicionar', [{ col: 2, lin: 0 }], limites),
    ).toBe(true);
    expect(
      edicaoMudaCamada(atuais, 'remover', [{ col: 1, lin: 0 }], limites),
    ).toBe(true);
  });

  it('celulasParaRevelarEmVolta: quadrados do raio em metros, recortado pelo mapa', () => {
    const limites = { colunas: 30, linhas: 20 };
    // 3 m ÷ 1,5 m = 2 quadrados: 5×5 em volta de (5,5).
    const celulas = celulasParaRevelarEmVolta(
      [{ col: 5, lin: 5, tamanho: 1 }],
      3,
      1.5,
      limites,
    );
    expect(celulas).toHaveLength(25);
    expect(celulas[0]).toEqual({ col: 3, lin: 3 });
    expect(celulas[24]).toEqual({ col: 7, lin: 7 });
    // No canto do mapa o raio é recortado.
    expect(
      celulasParaRevelarEmVolta([{ col: 0, lin: 0 }], 1.5, 1.5, limites),
    ).toEqual([
      { col: 0, lin: 0 },
      { col: 1, lin: 0 },
      { col: 0, lin: 1 },
      { col: 1, lin: 1 },
    ]);
  });

  it('celulasParaRevelarEmVolta: token grande conta a partir da borda; vários se unem', () => {
    const limites = { colunas: 30, linhas: 20 };
    // 2×2 em (5,5), 1 quadrado de raio: de 4 a 7 nas duas direções.
    expect(
      celulasParaRevelarEmVolta(
        [{ col: 5, lin: 5, tamanho: 2 }],
        1.5,
        1.5,
        limites,
      ),
    ).toHaveLength(16);
    // Dois tokens vizinhos não repetem células.
    expect(
      celulasParaRevelarEmVolta(
        [
          { col: 5, lin: 5 },
          { col: 6, lin: 5 },
        ],
        1.5,
        1.5,
        limites,
      ),
    ).toHaveLength(12);
    expect(celulasParaRevelarEmVolta([], 6, 1.5, limites)).toEqual([]);
  });
});
