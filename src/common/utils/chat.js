// Funções puras do chat de campanha (rmCampanhas/{id}/chatMensagens).
// Mantidas em sincronia com a cópia do site dos jogadores
// (Ficha-RPG---Re-Dungeon-, mesmo arquivo/mesmos testes) e com o bloco do
// chat no `firestore.rules` — os limites aqui (tamanho do
// texto/URL, valores de `tipo`) são os mesmos que a regra exige.

export const CHAT_TEXTO_MAX = 2000;
export const CHAT_URL_MAX = 2000;

export const TIPOS_MENSAGEM = {
  TEXTO: 'texto',
  IMAGEM: 'imagem',
  ROLAGEM: 'rolagem',
  MACRO: 'macro',
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

export const PERSONAS_DO_MESTRE = [
  PERSONAS.MESTRE,
  PERSONAS.NPC,
  PERSONAS.CRIATURA,
];

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
  HOSTS_MIDIA_DIRETA.includes(hostname) ||
  /^media\d+\.giphy\.com$/.test(hostname);

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
export const montarMensagemRolagem = (autor, rolagem, secreta = false) => ({
  ...camposAutor(autor),
  tipo: TIPOS_MENSAGEM.ROLAGEM,
  texto: '',
  url: null,
  rolagem,
  ...(secreta ? { secreta: true } : {}),
});

export const montarMensagemMacro = (autor, macroNome, texto) => ({
  ...camposAutor(autor),
  tipo: TIPOS_MENSAGEM.MACRO,
  texto: String(texto ?? '').slice(0, CHAT_MACRO_TEXTO_MAX),
  url: null,
  macroNome: String(macroNome ?? '').slice(0, MACRO_NOME_MAX) || 'macro',
});

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

const paraDate = valor => {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor.toDate === 'function') return valor.toDate();
  return null;
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

// Mesmo critério de pages/Jogadores/jogadoresUtils.js para "jogador
// na campanha": personagem jogável (tipo ausente = jogável, docs antigos) cuja
// lista `campanhas` contém a campanha. Companheiros ficam de fora.
const TIPO_JOGAVEL = 'Personagem Jogável';

const ehJogavel = personagem =>
  (personagem.tipo ?? TIPO_JOGAVEL) === TIPO_JOGAVEL &&
  !personagem.companheiroDe;

export const personagensNaCampanha = (personagens, campanhaId) =>
  personagens.filter(
    personagem =>
      ehJogavel(personagem) &&
      (personagem.campanhas ?? []).includes(campanhaId),
  );

export const campanhaIdsDosPersonagens = personagens =>
  Array.from(
    new Set(
      personagens
        .filter(ehJogavel)
        .flatMap(personagem => personagem.campanhas ?? []),
    ),
  );
