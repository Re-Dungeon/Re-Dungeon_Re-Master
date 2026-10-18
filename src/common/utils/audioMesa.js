// Música da mesa (YouTube) — rmCampanhas/{id}/audio/atual. O mestre grava o
// estado ({videoId, estado, posicaoBase, repetir} + referenciaEm = horário do
// servidor na gravação) e cada cliente calcula onde a faixa deve estar AGORA
// (`posicaoAtual`), então quem chega depois entra no mesmo ponto. Os limites
// espelham o bloco "Música da mesa" do firestore.rules. Mantido em sincronia
// com a cópia do site dos jogadores.

export const AUDIO_ESTADOS = {
  TOCANDO: 'tocando',
  PAUSADO: 'pausado',
  PARADO: 'parado',
};

// Maior posição aceita (s) — a regra recusa além disso.
export const AUDIO_POSICAO_MAX = 86400;
export const VOLUME_PADRAO = 50;

export const AUDIO_PARADO = {
  videoId: null,
  estado: AUDIO_ESTADOS.PARADO,
  posicaoBase: 0,
  repetir: true,
};

const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const HOSTS_YOUTUBE = [
  'youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
];

const limitarPosicao = segundos =>
  Math.min(
    Math.max(Math.round((Number(segundos) || 0) * 100) / 100, 0),
    AUDIO_POSICAO_MAX,
  );

// "90", "1m30s", "1h2m3s" → segundos (inválido → 0).
const segundosDoTempo = valor => {
  if (!valor) return 0;
  if (/^\d+$/.test(valor)) return Number(valor);
  const partes = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(valor);
  if (!partes) return 0;
  const [, horas = 0, minutos = 0, segundos = 0] = partes;
  return Number(horas) * 3600 + Number(minutos) * 60 + Number(segundos);
};

// Link do YouTube → { videoId, inicio } ou null. Aceita watch?v=, youtu.be/,
// /shorts/, /embed/, /live/ e music.youtube.com; `t=`/`start=` viram o início.
// Link de playlist só vale pelo vídeo que ele indicar (`v=`).
export const extrairVideoYoutube = link => {
  if (typeof link !== 'string') return null;
  let url;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.replace(/^(www\.|m\.)/, '');

  let videoId = null;
  if (host === 'youtu.be') {
    [videoId] = url.pathname.slice(1).split('/');
  } else if (HOSTS_YOUTUBE.includes(host)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v');
    else
      videoId =
        /^\/(?:shorts|embed|live|v)\/([^/]+)/.exec(url.pathname)?.[1] ?? null;
  }
  if (!videoId || !ID_VIDEO.test(videoId)) return null;

  const tempo =
    url.searchParams.get('t') ?? url.searchParams.get('start') ?? '';
  return { videoId, inicio: limitarPosicao(segundosDoTempo(tempo)) };
};

// Posição (s) em que a faixa deve estar em `agoraMs` para todos. `duracao`
// (s, 0 = desconhecida/ao vivo) faz a volta quando `repetir`, ou para no fim.
export const posicaoAtual = (audio, agoraMs, duracao = 0) => {
  if (!audio?.videoId) return 0;
  let posicao = audio.posicaoBase ?? 0;
  if (
    audio.estado === AUDIO_ESTADOS.TOCANDO &&
    Number.isFinite(audio.referenciaEm)
  ) {
    posicao += Math.max(0, (agoraMs - audio.referenciaEm) / 1000);
  }
  if (duracao > 0)
    posicao = audio.repetir ? posicao % duracao : Math.min(posicao, duracao);
  return posicao;
};

// Faixa terminou para todos (sem repetir, passou do fim).
export const audioTerminou = (audio, agoraMs, duracao) =>
  Boolean(audio?.videoId) &&
  !audio.repetir &&
  duracao > 0 &&
  audio.estado === AUDIO_ESTADOS.TOCANDO &&
  posicaoAtual({ ...audio, repetir: true }, agoraMs, 0) >= duracao;

// Payloads gravados pelo mestre (o storage acrescenta referenciaEm/updatedAt
// com o horário do servidor). Toda mudança "rebaseia" a posição para agora.
export const montarAudioTocar = ({ videoId, inicio = 0 }, repetir = true) => ({
  videoId,
  estado: AUDIO_ESTADOS.TOCANDO,
  posicaoBase: limitarPosicao(inicio),
  repetir: Boolean(repetir),
});

const rebasear = (audio, agoraMs, duracao, mudancas) => ({
  videoId: audio.videoId,
  estado: audio.estado,
  posicaoBase: limitarPosicao(posicaoAtual(audio, agoraMs, duracao)),
  repetir: Boolean(audio.repetir),
  ...mudancas,
});

export const montarAudioPausado = (audio, agoraMs, duracao) =>
  rebasear(audio, agoraMs, duracao, { estado: AUDIO_ESTADOS.PAUSADO });

export const montarAudioRetomado = (audio, agoraMs, duracao) =>
  rebasear(audio, agoraMs, duracao, { estado: AUDIO_ESTADOS.TOCANDO });

export const montarAudioRepetir = (audio, agoraMs, duracao, repetir) =>
  rebasear(audio, agoraMs, duracao, { repetir: Boolean(repetir) });

// Código de erro do player do YouTube → mensagem.
export const mensagemErroYoutube = codigo => {
  if (codigo === 101 || codigo === 150) {
    return 'Este vídeo não permite ser tocado fora do YouTube.';
  }
  if (codigo === 100) return 'Vídeo não encontrado (removido ou privado).';
  if (codigo === 2) return 'Link do YouTube inválido.';
  return 'O YouTube não conseguiu tocar este vídeo.';
};
