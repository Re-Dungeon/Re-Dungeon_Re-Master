// Funções puras do chat de campanha (rmCampanhas/{id}/chatMensagens).
// Mantidas em sincronia com a cópia do Re:Master (mesmo arquivo/mesmos testes)
// e com o bloco do chat no `firestore.rules` — os limites aqui (tamanho do
// texto/URL, valores de `tipo`) são os mesmos que a regra exige.

// Janela ao vivo do chat (as últimas N mensagens; service/storage) e tamanho de
// cada página de "Carregar anteriores".
export const CHAT_JANELA_MENSAGENS = 100;
export const CHAT_PAGINA_ANTERIORES = 50;

export const CHAT_TEXTO_MAX = 2000;
export const CHAT_URL_MAX = 2000;

export const TIPOS_MENSAGEM = {
  TEXTO: 'texto',
  IMAGEM: 'imagem',
  ROLAGEM: 'rolagem',
  MACRO: 'macro',
  COMBATE: 'combate',
};

// Mensagem gerada por `enviar(texto)` de uma macro Lua — limite maior que o
// do texto digitado (relatórios como o "dano_impacto" passam de 2000).
export const CHAT_MACRO_TEXTO_MAX = 4000;
export const MACRO_NOME_MAX = 100;

// Quem "fala" na mensagem. O mestre pode interpretar NPCs e Criaturas da
// campanha (Re:Master) — a mensagem continua `isMestre: true` e a regra só
// aceita essas personas vindas do mestre; jogador é sempre 'jogador'.
export const PERSONAS = {
  MESTRE: 'mestre',
  NPC: 'npc',
  CRIATURA: 'criatura',
  JOGADOR: 'jogador',
};

export const PERSONAS_DO_MESTRE = [PERSONAS.MESTRE, PERSONAS.NPC, PERSONAS.CRIATURA];

const ROTULO_PERSONA = {
  [PERSONAS.NPC]: 'NPC',
  [PERSONAS.CRIATURA]: 'Criatura',
};

// Etiqueta exibida ao lado do nome quando o mestre fala como NPC/Criatura
// (null para mestre "puro" e jogadores — inclusive mensagens antigas sem
// `persona`).
export const rotuloPersona = mensagem =>
  (mensagem.isMestre && ROTULO_PERSONA[mensagem.persona]) || null;

const EXTENSOES_IMAGEM = /\.(gif|png|jpe?g|webp)$/i;

// Hosts que servem o arquivo de mídia direto mesmo sem extensão no caminho
// (ex.: https://media.giphy.com/media/<id>/giphy.gif costuma ter, mas variantes
// como `.../giphy.webp?cid=...` ou `i.giphy.com/<id>` às vezes não).
const HOSTS_MIDIA_DIRETA = [
  'media.giphy.com',
  'i.giphy.com',
  'media.tenor.com',
  'c.tenor.com',
];

const ehHostMidiaDireta = hostname =>
  HOSTS_MIDIA_DIRETA.includes(hostname) || /^media\d+\.giphy\.com$/.test(hostname);

// Só aceita URL direta do arquivo de imagem — páginas como tenor.com/view/...
// ou giphy.com/gifs/... são HTML e não renderizam num <img>.
export const isUrlImagemValida = url => {
  if (typeof url !== 'string') return false;
  const valor = url.trim();
  if (!valor || valor.length > CHAT_URL_MAX) return false;

  let parsed;
  try {
    parsed = new URL(valor);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;

  return (
    EXTENSOES_IMAGEM.test(parsed.pathname) ||
    ehHostMidiaDireta(parsed.hostname.toLowerCase())
  );
};

export const normalizarTextoMensagem = texto =>
  typeof texto === 'string' ? texto.trim() : '';

export const isTextoMensagemValido = texto => {
  const normalizado = normalizarTextoMensagem(texto);
  return normalizado.length > 0 && normalizado.length <= CHAT_TEXTO_MAX;
};

// O avatar vem de `personagem.linkImagem`, que pode ser qualquer coisa (até
// uma data: URL enorme) — a regra só aceita até CHAT_URL_MAX, então descarta
// em vez de deixar a mensagem inteira ser recusada.
export const normalizarAvatar = avatar =>
  typeof avatar === 'string' &&
  /^https?:\/\//i.test(avatar) &&
  avatar.length <= CHAT_URL_MAX
    ? avatar
    : null;

// `autor` = { uid, personagemId, autorNome, autorAvatar, isMestre, persona } — os dados
// do personagem são denormalizados na mensagem (nome/avatar no momento do envio).
const personaDoAutor = (isMestre, persona) => {
  if (!isMestre) return PERSONAS.JOGADOR;
  return PERSONAS_DO_MESTRE.includes(persona) ? persona : PERSONAS.MESTRE;
};

const camposAutor = ({
  uid,
  personagemId = null,
  autorNome,
  autorAvatar = null,
  isMestre = false,
  persona,
}) => ({
  uid,
  personagemId: isMestre ? null : personagemId,
  autorNome: String(autorNome ?? '').slice(0, 200) || 'Jogador',
  autorAvatar: normalizarAvatar(autorAvatar),
  isMestre: Boolean(isMestre),
  persona: personaDoAutor(isMestre, persona),
});

export const montarMensagemTexto = (autor, texto) => ({
  ...camposAutor(autor),
  tipo: TIPOS_MENSAGEM.TEXTO,
  texto: normalizarTextoMensagem(texto),
  url: null,
});

export const montarMensagemImagem = (autor, url) => ({
  ...camposAutor(autor),
  tipo: TIPOS_MENSAGEM.IMAGEM,
  texto: '',
  url: url.trim(),
});

// `rolagem` = resultado de rolarEspecificacao (common/utils/dados.js). Rolagens
// secretas vão para chatSecretas/{uid}/rolagens (não para chatMensagens) e
// levam `secreta: true` — a regra exige o campo só nesse caminho.
//
// `rotulo` (opcional, ex.: "Ataque: Golpe Duplo") diz de onde veio a rolagem —
// vem do "Rolar…" de um token do grid; vazio é omitido.
export const ROTULO_ROLAGEM_MAX = 100;

export const normalizarRotulo = rotulo =>
  String(rotulo ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, ROTULO_ROLAGEM_MAX) || null;

export const montarMensagemRolagem = (autor, rolagem, secreta = false, rotulo = null) => {
  const rotuloNormalizado = normalizarRotulo(rotulo);
  return {
    ...camposAutor(autor),
    tipo: TIPOS_MENSAGEM.ROLAGEM,
    texto: '',
    url: null,
    rolagem,
    ...(rotuloNormalizado ? { rotulo: rotuloNormalizado } : {}),
    ...(secreta ? { secreta: true } : {}),
  };
};

export const montarMensagemMacro = (autor, macroNome, texto) => ({
  ...camposAutor(autor),
  tipo: TIPOS_MENSAGEM.MACRO,
  texto: String(texto ?? '').slice(0, CHAT_MACRO_TEXTO_MAX),
  url: null,
  macroNome: String(macroNome ?? '').slice(0, MACRO_NOME_MAX) || 'macro',
});

// ── Mensagens de combate do grid (common/utils/gridCombate.js) ───────────
// Cartão estreito no centro do chat: início (com a iniciativa), "Rodada N",
// "Turno de X" e "Combate encerrado". `combate.cenaId` deixa a regra conferir
// que o jogador só anuncia a troca de turno que ele mesmo gravou na mesma
// escrita. Oculto: sem nome ("Turno de um oponente oculto").
export const EVENTOS_COMBATE = {
  INICIO: 'inicio',
  RODADA: 'rodada',
  TURNO: 'turno',
  FIM: 'fim',
};
export const COMBATE_NOME_MAX = 100;
export const COMBATE_INICIATIVA_MAX = 200;

const EVENTOS_COM_TURNO = [
  EVENTOS_COMBATE.INICIO,
  EVENTOS_COMBATE.RODADA,
  EVENTOS_COMBATE.TURNO,
];

// "Wesley 17 (d20 12 + Reação 5)"
export const formatarIniciativa = ({ nome, total, d20, reacao }) =>
  `${nome} ${total} (d20 ${d20} ${reacao < 0 ? '−' : '+'} Reação ${Math.abs(reacao)})`;

export const montarMensagemCombate = (
  autor,
  { evento, cenaId, rodada = null, nome = null, oculto = false, iniciativa = null },
) => ({
  ...camposAutor(autor),
  tipo: TIPOS_MENSAGEM.COMBATE,
  texto: '',
  url: null,
  combate: {
    evento,
    cenaId,
    ...(rodada ? { rodada } : {}),
    ...(EVENTOS_COM_TURNO.includes(evento)
      ? {
          nome: nome ? String(nome).slice(0, COMBATE_NOME_MAX) : null,
          oculto: Boolean(oculto || !nome),
        }
      : {}),
    ...(iniciativa
      ? {
          iniciativa: iniciativa.slice(0, COMBATE_INICIATIVA_MAX).map(item => ({
            nome: String(item.nome ?? '').slice(0, COMBATE_NOME_MAX),
            total: item.total,
            d20: item.d20,
            reacao: item.reacao,
          })),
        }
      : {}),
  },
});

const turnoDe = combate =>
  combate.nome ? `Turno de ${combate.nome}` : 'Turno de um oponente oculto';

// `mensagem.combate` → { titulo, iniciativa: string[] | null, linhas: string[] }.
export const descreverMensagemCombate = combate => {
  const dados = combate ?? {};
  switch (dados.evento) {
    case EVENTOS_COMBATE.INICIO:
      return {
        titulo: 'Combate iniciado',
        iniciativa: Array.isArray(dados.iniciativa)
          ? dados.iniciativa.map(formatarIniciativa)
          : null,
        linhas: [`Rodada ${dados.rodada ?? 1} · ${turnoDe(dados)}`],
      };
    case EVENTOS_COMBATE.RODADA:
      return {
        titulo: `Rodada ${dados.rodada ?? ''}`.trim(),
        iniciativa: null,
        linhas: [turnoDe(dados)],
      };
    case EVENTOS_COMBATE.TURNO:
      return { titulo: turnoDe(dados), iniciativa: null, linhas: [] };
    case EVENTOS_COMBATE.FIM:
      return { titulo: 'Combate encerrado', iniciativa: null, linhas: [] };
    default:
      return { titulo: 'Combate', iniciativa: null, linhas: [] };
  }
};

const instanteDaMensagem = mensagem => {
  const { createdAt } = mensagem;
  if (!createdAt) return Number.MAX_SAFE_INTEGER; // ainda sem timestamp = acabou de ser enviada
  if (createdAt instanceof Date) return createdAt.getTime();
  if (typeof createdAt.toMillis === 'function') return createdAt.toMillis();
  return Number.MAX_SAFE_INTEGER;
};

// Junta as mensagens públicas com as rolagens secretas visíveis ao usuário
// numa só linha do tempo (mais antiga primeiro). Ordenação estável: empates
// mantêm públicas antes das secretas.
export const mesclarMensagens = (publicas, secretas) =>
  [...publicas, ...secretas]
    .map((mensagem, indice) => ({ mensagem, indice }))
    .sort(
      (a, b) =>
        instanteDaMensagem(a.mensagem) - instanteDaMensagem(b.mensagem) ||
        a.indice - b.indice,
    )
    .map(({ mensagem }) => mensagem);

// Junta a janela ao vivo com as mensagens antigas já carregadas ("Carregar
// anteriores"), sem repetir ids (a janela vence) e em ordem cronológica. Sem
// antigas devolve a própria janela.
export const mesclarComAntigas = (recentes, antigas) => {
  if (!antigas?.length) return recentes;
  const ids = new Set(recentes.map(mensagem => mensagem.id));
  const extras = antigas.filter(mensagem => !ids.has(mensagem.id));
  return extras.length ? mesclarMensagens(extras, recentes) : recentes;
};

const paraDate = valor => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor.toDate === 'function') return valor.toDate();
  if (valor instanceof Number || typeof valor === 'number') {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  if (typeof valor === 'string') {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? null : data;
  }
  return null;
};

export const ehMesmoDiaLocal = (createdAt, agora = new Date()) => {
  const data = paraDate(createdAt);
  if (!data) return true;
  return (
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth() &&
    data.getDate() === agora.getDate()
  );
};

export const filtrarMensagensHistorico = (mensagens, mostrarHistorico = false, agora = new Date()) => {
  if (!Array.isArray(mensagens)) return [];
  if (mostrarHistorico) return mensagens;
  return mensagens.filter(mensagem => ehMesmoDiaLocal(mensagem?.createdAt, agora));
};

const doisDigitos = numero => String(numero).padStart(2, '0');

// "14:05" se a mensagem é de hoje, senão "03/10 14:05". `agora` é injetável
// para o teste ser determinístico.
export const formatarHorarioMensagem = (createdAt, agora = new Date()) => {
  const data = paraDate(createdAt);
  if (!data) return '';
  const hora = `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
  const mesmoDia =
    data.getFullYear() === agora.getFullYear() &&
    data.getMonth() === agora.getMonth() &&
    data.getDate() === agora.getDate();
  return mesmoDia
    ? hora
    : `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)} ${hora}`;
};

// Mesmo critério do Re:Master para "jogador na campanha": personagem jogável
// (tipo ausente = jogável, docs antigos) cuja lista `campanhas` contém a
// campanha. Companheiros vinculados também entram na mesa, mas NPC/Criatura
// continuam bloqueados — o vínculo é ao personagem base e não a um tipo de
// ficha jogável.
const TIPO_JOGAVEL = 'Personagem Jogável';

const campanhasDoPersonagem = personagem =>
  Array.isArray(personagem?.campanhas) ? personagem.campanhas.filter(Boolean) : [];

const ehJogavel = personagem =>
  (personagem?.tipo ?? TIPO_JOGAVEL) === TIPO_JOGAVEL && !personagem?.companheiroDe;

const ehCompanheiro = personagem => Boolean(personagem?.companheiroDe);

export const personagensNaCampanha = (personagens = [], campanhaId) => {
  const lista = Array.isArray(personagens) ? personagens : [];
  return lista.filter(personagem => {
    if (ehJogavel(personagem)) {
      return campanhasDoPersonagem(personagem).includes(campanhaId);
    }
    if (!ehCompanheiro(personagem)) {
      return false;
    }
    if (campanhasDoPersonagem(personagem).includes(campanhaId)) {
      return true;
    }
    const base = lista.find(item => item?.id === personagem.companheiroDe);
    return Boolean(base) && campanhasDoPersonagem(base).includes(campanhaId);
  });
};

export const campanhaIdsDosPersonagens = personagens => {
  const lista = Array.isArray(personagens) ? personagens : [];
  const ids = new Set();

  lista.forEach(personagem => {
    if (!ehJogavel(personagem) && !ehCompanheiro(personagem)) {
      return;
    }
    campanhasDoPersonagem(personagem).forEach(campanhaId => ids.add(campanhaId));

    if (!ehCompanheiro(personagem)) {
      return;
    }

    const base = lista.find(item => item?.id === personagem.companheiroDe);
    if (base) {
      campanhasDoPersonagem(base).forEach(campanhaId => ids.add(campanhaId));
    }
  });

  return Array.from(ids);
};
