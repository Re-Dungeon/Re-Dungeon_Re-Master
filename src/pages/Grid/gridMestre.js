// Ajudas puras da tela Grid do mestre (o modelo do grid em si fica em
// common/utils/grid.js, compartilhado com o site dos jogadores).
import {
  AURA_RAIO_MAX,
  AURA_RAIO_MIN,
  MODOS_RECURSOS,
  GRID_TOKENS_POR_CENA_MAX,
  MULTIPLICADORES_CORRIDA,
  TIPOS_TOKEN,
  TOKEN_CONDICOES_MAX,
  TRAVAMENTOS,
  montarToken,
  normalizarAura,
  normalizarCondicoesDoToken,
  valorDigitadoDoRecurso,
  normalizarRecurso,
  primeiraCelulaLivre,
  TOKEN_NOME_MAX,
} from 'common/utils/grid';
import {
  inserirNoCombate,
  reacaoDaFicha,
  removerDoCombate,
} from 'common/utils/gridCombate';
import { ACOES_CAMADA } from 'common/utils/gridCamadas';

// Jogadores que podem receber tokens: um por uid (dono da ficha), com os
// nomes dos personagens dele na campanha. `donosAtuais` garante que um uid já
// atribuído continue aparecendo mesmo se a ficha saiu da campanha.
export const opcoesDeDonos = (jogadores, donosAtuais = []) => {
  const porUid = new Map();
  jogadores.forEach(jogador => {
    if (!jogador.uid) return;
    porUid.set(jogador.uid, [
      ...(porUid.get(jogador.uid) ?? []),
      jogador.label,
    ]);
  });
  const opcoes = [...porUid].map(([uid, nomes]) => ({
    uid,
    label: nomes.join(', '),
  }));
  donosAtuais
    .filter(uid => !porUid.has(uid))
    .forEach(uid => opcoes.push({ uid, label: 'Jogador fora da campanha' }));
  return opcoes.sort((a, b) => a.label.localeCompare(b.label));
};

export const OPCOES_TAMANHO_TOKEN = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}×${i + 1}`,
}));

// "Adicionar todos os jogadores": um token 1×1 por personagem jogável da
// campanha que ainda não tem token de jogador nesta cena, já atribuído ao
// dono da ficha, cada um na primeira célula livre (respeitando o limite de
// tokens por cena).
export const jogadoresSemToken = (jogadores, tokens) => {
  const presentes = new Set(
    tokens
      .filter(token => token.tipo === TIPOS_TOKEN.JOGADOR && token.refId)
      .map(token => token.refId),
  );
  return jogadores.filter(jogador => !presentes.has(jogador.refId));
};

export const tokensDeJogadoresFaltantes = (jogadores, tokens, limites) => {
  const vagas = Math.max(GRID_TOKENS_POR_CENA_MAX - tokens.length, 0);
  const ocupados = [...tokens];
  return jogadoresSemToken(jogadores, tokens)
    .slice(0, vagas)
    .map(jogador => {
      const token = montarToken({
        nome: jogador.label,
        imagemUrl: jogador.avatar,
        tipo: TIPOS_TOKEN.JOGADOR,
        refId: jogador.refId,
        donos: jogador.uid ? [jogador.uid] : [],
        ...primeiraCelulaLivre(ocupados, 1, limites),
      });
      ocupados.push(token);
      return token;
    });
};

// ── Combate do token (TokenCombate) ─────────────────────────────────────
// PV/Energia/Fadiga de npc/criatura/avulso ficam no token como
// `{atual, max}` (common/utils/grid.js — normalizarRecurso); null = sem barra.

// Botões −/+: muda `atual` e mantém dentro de 0..max.
export const ajustarRecurso = (recurso, delta) =>
  recurso
    ? normalizarRecurso({ ...recurso, atual: recurso.atual + delta })
    : null;

// Campo `atual` ou `max` digitado → recurso novo. `max` vazio ou 0 remove a
// barra (null); `atual` vazio = cheio. `max` menor que `atual` puxa o atual.
// No `atual`, "+5"/"-7" soma ao valor atual (dano/cura rápidos).
export const recursoDigitado = (recurso, campo, texto) => {
  const valor = String(texto ?? '').trim();
  // Texto que não é número não muda nada.
  if (valor !== '' && !Number.isFinite(Number(valor))) return recurso ?? null;
  if (campo === 'max') {
    if (valor === '' || Number(valor) === 0) return null;
    return normalizarRecurso({ atual: recurso?.atual ?? valor, max: valor });
  }
  if (!recurso) return null;
  if (valor === '') return normalizarRecurso({ ...recurso, atual: valor });
  const novo = valorDigitadoDoRecurso(recurso.atual, valor);
  return novo === null
    ? recurso
    : normalizarRecurso({ ...recurso, atual: novo });
};

export const OPCOES_MOSTRAR_RECURSOS = [
  { value: MODOS_RECURSOS.OCULTO, label: 'Ocultos' },
  { value: MODOS_RECURSOS.BARRA, label: 'Só barras' },
  { value: MODOS_RECURSOS.NUMEROS, label: 'Barras e números' },
];

// Aura escolhida no painel: cor '' = sem aura (null); raio digitado é
// limitado a AURA_RAIO_MIN..AURA_RAIO_MAX (vazio/inválido = 1).
export const auraEscolhida = (cor, raioTexto) => {
  if (!cor) return null;
  const raio = Math.round(Number(raioTexto));
  return normalizarAura({
    cor,
    raio: Number.isFinite(raio)
      ? Math.min(Math.max(raio, AURA_RAIO_MIN), AURA_RAIO_MAX)
      : AURA_RAIO_MIN,
  });
};

// ── Combate da cena (Fase 3A) ───────────────────────────────────────────
// "Movimento" da cena: quem pode mover tokens (também fora de combate).
export const OPCOES_TRAVAMENTO = [
  { value: TRAVAMENTOS.LIVRE, label: 'Livre' },
  { value: TRAVAMENTOS.TURNO, label: 'Só na sua vez' },
  { value: TRAVAMENTOS.CONGELADO, label: 'Congelado' },
];

// "Correr" da cena: quantas vezes o deslocamento (config do grid).
export const OPCOES_CORRIDA = MULTIPLICADORES_CORRIDA.map(valor => ({
  value: valor,
  label: `${String(valor).replace('.', ',')}×`,
}));

// Reação do token para a iniciativa: jogador pela ficha ao vivo
// (`fichas[refId]`), NPC/Criatura pela ficha do catálogo guardada na persona
// (`fontes.npcs/criaturas/jogadores`). null = sem dados (o mestre informa).
export const reacaoDoToken = (token, { fichas = {}, fontes = {} } = {}) => {
  if (!token?.refId) return null;
  const daFicha = reacaoDaFicha(fichas[token.refId]);
  if (daFicha !== null && daFicha !== undefined) return daFicha;
  const persona = [
    ...(fontes.npcs ?? []),
    ...(fontes.criaturas ?? []),
    ...(fontes.jogadores ?? []),
  ].find(fonte => fonte.refId === token.refId);
  return Number.isFinite(persona?.reacao) ? persona.reacao : null;
};

// ── Ferramentas do mapa (Fase 3B) ───────────────────────────────────────
// Seletor da barra do Grid: com outra ferramenta além de Mover, o mapa edita
// paredes, névoa ou marcadores em vez de mover tokens.
export const FERRAMENTAS = {
  MOVER: 'mover',
  PAREDES: 'paredes',
  NEVOA: 'nevoa',
  MARCADORES: 'marcadores',
};

export const OPCOES_FERRAMENTA = [
  { value: FERRAMENTAS.MOVER, label: 'Mover' },
  { value: FERRAMENTAS.PAREDES, label: 'Paredes' },
  { value: FERRAMENTAS.NEVOA, label: 'Névoa' },
  { value: FERRAMENTAS.MARCADORES, label: 'Marcadores' },
];

export const FORMAS_PINCEL = { PINCEL: 'pincel', RETANGULO: 'retangulo' };

export const OPCOES_FORMA = [
  { value: FORMAS_PINCEL.PINCEL, label: 'Pincel' },
  { value: FORMAS_PINCEL.RETANGULO, label: 'Retângulo' },
];

// Paredes: adicionar/apagar. Névoa: revelar = adicionar às células reveladas,
// cobrir = remover delas (ACOES_CAMADA em common/utils/gridCamadas.js).
export const OPCOES_ACAO = {
  [FERRAMENTAS.PAREDES]: [
    { value: ACOES_CAMADA.ADICIONAR, label: 'Adicionar' },
    { value: ACOES_CAMADA.REMOVER, label: 'Apagar' },
  ],
  [FERRAMENTAS.NEVOA]: [
    { value: ACOES_CAMADA.ADICIONAR, label: 'Revelar' },
    { value: ACOES_CAMADA.REMOVER, label: 'Cobrir' },
  ],
};

export const OPCOES_FERRAMENTA_PADRAO = {
  forma: FORMAS_PINCEL.PINCEL,
  acao: ACOES_CAMADA.ADICIONAR,
  tamanho: 1,
};

// ── Várias cópias de um token ────────────────────────────────────────────
export const QUANTIDADE_TOKENS_MAX = 20;

const escaparRegex = texto => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Nomes para `quantidade` tokens novos com o nome `base`, sem repetir os da
// cena: "Goblin", "Goblin 2", "Goblin 3"… Se "Goblin" já está na cena, as
// cópias continuam do maior número usado. Respeita TOKEN_NOME_MAX.
export const nomesNumerados = (base, nomesExistentes, quantidade = 1) => {
  const limpo = String(base ?? '').trim() || 'Token';
  const total = Math.max(
    1,
    Math.min(Number(quantidade) || 1, QUANTIDADE_TOKENS_MAX),
  );
  const padrao = new RegExp(`^${escaparRegex(limpo)}(?: (\\d+))?$`);
  const numerosUsados = (nomesExistentes ?? [])
    .map(nome =>
      String(nome ?? '')
        .trim()
        .match(padrao),
    )
    .filter(Boolean)
    .map(match => (match[1] ? Number(match[1]) : 1));
  const nomes = [];
  let proximo = numerosUsados.length ? Math.max(...numerosUsados) + 1 : 1;
  for (let i = 0; i < total; i += 1) {
    const sufixo = proximo === 1 ? '' : ` ${proximo}`;
    nomes.push(`${limpo.slice(0, TOKEN_NOME_MAX - sufixo.length)}${sufixo}`);
    proximo += 1;
  }
  return nomes;
};

// Tokens prontos para gravar de uma vez: cada cópia na primeira célula livre
// considerando as anteriores (não se empilham). `dados` = o que o diálogo
// manda para montarToken (sem col/lin).
export const montarTokensEmLote = (
  dados,
  quantidade,
  tokensDaCena,
  limites,
) => {
  const nomes = nomesNumerados(
    dados.nome,
    (tokensDaCena ?? []).map(token => token.nome),
    quantidade,
  );
  const ocupados = [...(tokensDaCena ?? [])];
  return nomes.map(nome => {
    const posicao = primeiraCelulaLivre(ocupados, dados.tamanho ?? 1, limites);
    const token = montarToken({ ...dados, nome, ...posicao });
    ocupados.push(token);
    return token;
  });
};

// Cópia de um token da cena ("Duplicar"): mesmos campos de jogo (recursos,
// condições, aura, visibilidade…), nome numerado e a primeira célula livre.
// Rastro de movimento e datas não vão junto.
const CAMPOS_FORA_DA_COPIA = [
  'id',
  'col',
  'lin',
  'rastro',
  'movidoEm',
  'createdAt',
  'updatedAt',
];

export const copiaDoToken = (token, tokensDaCena, limites) => {
  const [nome] = nomesNumerados(
    token.nome,
    (tokensDaCena ?? []).map(item => item.nome),
    1,
  );
  const campos = Object.fromEntries(
    Object.entries(token).filter(
      ([chave]) => !CAMPOS_FORA_DA_COPIA.includes(chave),
    ),
  );
  return {
    ...campos,
    nome,
    ...primeiraCelulaLivre(tokensDaCena ?? [], token.tamanho ?? 1, limites),
  };
};

// ── Seleção múltipla e ações em lote ─────────────────────────────────────
// Shift/Ctrl-clique alterna o token na seleção. A seleção é sempre: nada, ou
// 1 token (`selecionadoId`, abre o TokenPainel), ou ≥ 2 tokens
// (`selecionadosIds`, abre as AcoesEmLote). Devolve o novo par
// `{ selecionadoId, selecionadosIds }` depois de alternar `tokenId`.
export const alternarSelecao = (
  { selecionadoId = null, selecionadosIds = [] },
  tokenId,
) => {
  let base = [];
  if (selecionadosIds.length) base = selecionadosIds;
  else if (selecionadoId) base = [selecionadoId];
  const lista = base.includes(tokenId)
    ? base.filter(id => id !== tokenId)
    : [...base, tokenId];
  if (lista.length >= 2) return { selecionadoId: null, selecionadosIds: lista };
  return { selecionadoId: lista[0] ?? null, selecionadosIds: [] };
};

// PV, condições e recursos de token de jogador vêm da ficha dele (não são
// do token): o lote os ignora.
const ehJogador = token => token.tipo === TIPOS_TOKEN.JOGADOR;

// Dano/cura em lote: `texto` como no campo "PV atual" do token ("-7" tira,
// "+5" soma, "12" define), limitado a 0..max. Só quem tem `pv` próprio no
// token e muda de valor gera patch; jogadores e tokens sem barra de PV são
// contados à parte.
// Resultado: { patches: [{ id, patch: { pv } }], jogadores, semPv }.
export const patchesDeDanoEmLote = (tokens, texto) => {
  const resultado = { patches: [], jogadores: 0, semPv: 0 };
  const digitado = String(texto ?? '').trim();
  tokens.forEach(token => {
    if (ehJogador(token)) {
      resultado.jogadores += 1;
      return;
    }
    const pv = normalizarRecurso(token.pv);
    if (!pv) {
      resultado.semPv += 1;
      return;
    }
    if (digitado === '') return;
    const novo = recursoDigitado(pv, 'atual', digitado);
    if (novo && novo.atual !== pv.atual) {
      resultado.patches.push({ id: token.id, patch: { pv: novo } });
    }
  });
  return resultado;
};

// Adicionar/remover uma condição do catálogo em vários tokens. Só npc/
// criatura/avulso (a do jogador está na ficha). Quem já está no estado
// pedido (ou, ao adicionar, já tem o máximo de condições) não gera patch.
// Resultado: { patches: [{ id, patch: { condicoes } }], jogadores, cheios }.
export const patchesDeCondicaoEmLote = (tokens, condicaoId, adicionar) => {
  const resultado = { patches: [], jogadores: 0, cheios: 0 };
  tokens.forEach(token => {
    if (ehJogador(token)) {
      resultado.jogadores += 1;
      return;
    }
    if (!condicaoId) return;
    const ids = normalizarCondicoesDoToken(token.condicoes);
    const tem = ids.includes(condicaoId);
    if (adicionar) {
      if (tem) return;
      if (ids.length >= TOKEN_CONDICOES_MAX) {
        resultado.cheios += 1;
        return;
      }
      resultado.patches.push({
        id: token.id,
        patch: { condicoes: [...ids, condicaoId] },
      });
    } else if (tem) {
      resultado.patches.push({
        id: token.id,
        patch: { condicoes: ids.filter(id => id !== condicaoId) },
      });
    }
  });
  return resultado;
};

// Ocultar/revelar: vale para todos os tipos; só muda quem está diferente.
export const patchesDeOcultoEmLote = (tokens, oculto) =>
  tokens
    .filter(token => Boolean(token.oculto) !== oculto)
    .map(token => ({ id: token.id, patch: { oculto } }));

// Vários tokens entrando no combate numa escrita só: `entradas` já rolados
// (rolarIniciativa), aplicados um a um sobre o estado do servidor. Quem já
// participa é ignorado. null se ninguém entrou.
export const inserirVariosNoCombate = (combate, entradas) => {
  let atual = combate;
  let entrou = false;
  entradas.forEach(entrada => {
    const resultado = inserirNoCombate(atual, entrada);
    if (!resultado) return;
    atual = { ...atual, ...resultado.patch };
    entrou = true;
  });
  if (!entrou) return null;
  return {
    patch: { ordem: atual.ordem, indice: atual.indice },
    mudouTurno: false,
  };
};

// Vários tokens saindo do combate numa escrita só. null = ninguém da seleção
// participa; { encerrar: true } = saíram todos (o combate acaba); senão o
// resultado de `removerDoCombate` acumulado ({ patch, mudouTurno }).
export const removerVariosDoCombate = (combate, tokenIds, tokens) => {
  let atual = combate;
  let patch = null;
  let mudouTurno = false;
  for (const tokenId of tokenIds) {
    const resultado = removerDoCombate(atual, tokenId, tokens);
    if (resultado) {
      if (resultado.encerrar) return { encerrar: true };
      patch = { ...patch, ...resultado.patch };
      mudouTurno = mudouTurno || resultado.mudouTurno;
      atual = { ...atual, ...resultado.patch };
    }
  }
  return patch ? { patch, mudouTurno } : null;
};

// ── Atalhos de teclado do Grid ───────────────────────────────────────────
export const ACOES_ATALHO = {
  PROXIMO_TURNO: 'proximoTurno',
  TURNO_ANTERIOR: 'turnoAnterior',
  OCULTAR: 'ocultar',
  EXCLUIR: 'excluir',
  FERRAMENTA: 'ferramenta',
  DESFAZER: 'desfazer',
  AJUDA: 'ajuda',
};

const ATALHO_DE_FERRAMENTA = {
  v: FERRAMENTAS.MOVER,
  w: FERRAMENTAS.PAREDES,
  f: FERRAMENTAS.NEVOA,
  m: FERRAMENTAS.MARCADORES,
};

// Lista mostrada no diálogo "Atalhos do teclado".
export const ATALHOS_GRID = [
  { teclas: 'N', descricao: 'Próximo turno (em combate)' },
  { teclas: 'Shift + N', descricao: 'Turno anterior (em combate)' },
  { teclas: 'H', descricao: 'Ocultar ou revelar o(s) token(s) selecionado(s)' },
  { teclas: 'Delete', descricao: 'Excluir o(s) token(s) selecionado(s)' },
  { teclas: 'V', descricao: 'Ferramenta Mover' },
  { teclas: 'W', descricao: 'Ferramenta Paredes' },
  { teclas: 'F', descricao: 'Ferramenta Névoa' },
  { teclas: 'M', descricao: 'Ferramenta Marcadores' },
  {
    teclas: 'Ctrl + Z',
    descricao: 'Desfazer a última edição de paredes/névoa',
  },
  { teclas: 'Esc', descricao: 'Limpar a seleção' },
  { teclas: '?', descricao: 'Mostrar esta lista' },
];

// Tecla pressionada → { acao, ferramenta? } ou null (sem atalho). Só `Ctrl/⌘+Z`
// aceita modificador; `Shift` só vale em N (turno anterior) e em "?". Teclas
// repetidas (segurar) não disparam de novo.
export const acaoDoAtalho = ({
  key,
  ctrlKey = false,
  metaKey = false,
  altKey = false,
  shiftKey = false,
  repeat = false,
} = {}) => {
  if (repeat || typeof key !== 'string') return null;
  const tecla = key.length === 1 ? key.toLowerCase() : key;
  const comando = ctrlKey || metaKey;
  if (comando) {
    if (tecla === 'z' && !altKey && !shiftKey) {
      return { acao: ACOES_ATALHO.DESFAZER };
    }
    return null;
  }
  if (altKey) return null;
  if (tecla === '?') return { acao: ACOES_ATALHO.AJUDA };
  if (tecla === 'n') {
    return {
      acao: shiftKey ? ACOES_ATALHO.TURNO_ANTERIOR : ACOES_ATALHO.PROXIMO_TURNO,
    };
  }
  if (shiftKey) return null;
  if (tecla === 'h') return { acao: ACOES_ATALHO.OCULTAR };
  if (tecla === 'Delete') return { acao: ACOES_ATALHO.EXCLUIR };
  if (ATALHO_DE_FERRAMENTA[tecla]) {
    return {
      acao: ACOES_ATALHO.FERRAMENTA,
      ferramenta: ATALHO_DE_FERRAMENTA[tecla],
    };
  }
  return null;
};

const TAGS_DE_DIGITACAO = ['INPUT', 'TEXTAREA', 'SELECT'];

// O foco está num campo de digitação? (os atalhos ficam desligados)
export const alvoEhDigitacao = alvo =>
  Boolean(alvo) &&
  (TAGS_DE_DIGITACAO.includes(alvo.tagName) ||
    alvo.isContentEditable === true ||
    alvo.getAttribute?.('role') === 'textbox' ||
    alvo.getAttribute?.('role') === 'combobox');

// Há diálogo ou menu aberto por cima da página? (o cartão do marcador no mapa
// também usa role="dialog", mas não bloqueia os atalhos).
export const haDialogoAberto = (doc = document) =>
  Boolean(
    doc.querySelector(
      '[role="dialog"]:not([data-marcador-cartao]), [role="menu"], [role="listbox"]',
    ),
  );

// "H": se todos os tokens já estão ocultos, revela; senão oculta todos.
export const ocultoAlvoDosTokens = tokens =>
  !(tokens.length > 0 && tokens.every(token => token.oculto));
