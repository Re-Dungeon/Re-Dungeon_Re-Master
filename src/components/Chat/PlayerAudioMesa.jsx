import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import useMediaQuery from '@mui/material/useMediaQuery';

import {
  AUDIO_ESTADOS,
  audioTerminou,
  mensagemErroYoutube,
  posicaoAtual,
} from 'common/utils/audioMesa';
import { carregarApiYoutube } from 'common/utils/youtubeApi';

// Player do YouTube da música da mesa, escondido fora da tela (só o áudio
// importa). Recebe `audio.player` de hooks/useAudioMesa.js: segue o estado
// gravado pelo mestre (carrega, toca, pausa, para), corrige a posição quando
// se afasta do ponto da mesa, aplica volume/mudo de quem está vendo e devolve
// título/duração/bloqueio/erro por `onStatus`. A página o monta fora do
// ChatSala, para seguir tocando com o painel de chat fechado. Cópia idêntica
// no site dos jogadores.

// YT.PlayerState
const ENCERRADO = 0;
const TOCANDO = 1;
const PAUSADO = 2;
const CARREGANDO = 3;
const PREPARADO = 5;

// Diferença tolerada (s) entre o player e a posição da mesa.
const TOLERANCIA_S = 2;
const INTERVALO_CORRECAO_MS = 4000;
// Pediu para tocar e não começou nesse tempo → navegador bloqueou o autoplay.
const ESPERA_BLOQUEIO_MS = 2500;

// O YouTube às vezes contorna o bloqueio de autoplay tocando SEM som: se o
// player está mudo e quem vê não pediu mudo, conta como bloqueado.
const silenciadoPeloNavegador = (player, mudoPedido) =>
  !mudoPedido && Boolean(player.isMuted?.());

const estiloEscondido = {
  position: 'fixed',
  left: -10000,
  top: 0,
  width: 200,
  height: 200,
  overflow: 'hidden',
  pointerEvents: 'none',
};

// Plano B do desbloqueio: alguns navegadores só liberam o som com um toque
// DENTRO do player do YouTube — ele aparece num canto até a música começar.
const estiloParaTocar = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 1500,
  width: 216, // 200 do player + padding (box-sizing: border-box)
  padding: 8,
  borderRadius: 12,
  background: 'rgba(10, 9, 19, 0.95)',
  border: '1px solid var(--border-hover)',
  boxShadow: 'var(--shadow-md)',
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  textAlign: 'center',
};

const estiloPlayerParaTocar = {
  width: 200,
  height: 200,
  borderRadius: 8,
  overflow: 'hidden',
};

// Celular: a caixa de 216px cobriria o compositor (Enviar). Vira um botão ♪
// de 44px no canto superior direito, abaixo das barras da mesa; tocar nele
// abre a caixa ali mesmo. O player (iframe) nunca desmonta — só muda o estilo.
const TOPO_CELULAR = 132;

const estiloParaTocarCelular = {
  ...estiloParaTocar,
  right: 8,
  bottom: 'auto',
  top: TOPO_CELULAR,
};

const estiloRecolhidoCelular = {
  position: 'fixed',
  right: 8,
  top: TOPO_CELULAR,
  zIndex: 1500,
  width: 44,
  height: 44,
  borderRadius: '50%',
  overflow: 'hidden',
  background: 'rgba(10, 9, 19, 0.95)',
  border: '1px solid var(--border-hover)',
  boxShadow: 'var(--shadow-md)',
};

const estiloBotaoCelular = {
  position: 'absolute',
  inset: 0,
  zIndex: 1,
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(10, 9, 19, 0.95)',
  color: 'var(--color-primary)',
  fontSize: '1.3rem',
  cursor: 'pointer',
};

const estiloMinimizar = {
  position: 'absolute',
  top: 2,
  right: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '1.1rem',
  lineHeight: 1,
  padding: 4,
  cursor: 'pointer',
};

const PlayerAudioMesa = ({
  atual = null,
  volume,
  mudo,
  controleRef,
  onStatus,
}) => {
  const hospedeiroRef = useRef(null);
  const playerRef = useRef(null);
  const verificacaoRef = useRef(null);
  const atualRef = useRef(atual);
  const mudoRef = useRef(mudo);
  const aoMudarEstadoRef = useRef(null);
  const [pronto, setPronto] = useState(false);
  // Liberar por clique não bastou: mostra o player para um toque direto.
  const [pedirToque, setPedirToque] = useState(false);
  const celular = useMediaQuery('(max-width: 599.95px)');
  // Celular: a caixa "toque para ouvir" começa recolhida no botão ♪.
  const [expandidoCelular, setExpandidoCelular] = useState(false);

  const temFaixa = Boolean(atual?.videoId);

  const verificarBloqueio = useCallback(
    (aposClique = false) => {
      clearTimeout(verificacaoRef.current);
      verificacaoRef.current = setTimeout(() => {
        const player = playerRef.current;
        const audio = atualRef.current;
        if (!player || audio?.estado !== AUDIO_ESTADOS.TOCANDO) return;
        const estado = player.getPlayerState?.();
        if (
          (estado !== TOCANDO && estado !== CARREGANDO) ||
          silenciadoPeloNavegador(player, mudoRef.current)
        ) {
          onStatus({ videoId: audio.videoId, bloqueado: true });
          if (aposClique) setPedirToque(true);
        }
      }, ESPERA_BLOQUEIO_MS);
    },
    [onStatus],
  );

  useLayoutEffect(() => {
    atualRef.current = atual;
    mudoRef.current = mudo;
    aoMudarEstadoRef.current = estado => {
      const player = playerRef.current;
      if (!player) return;
      const dados = player.getVideoData?.() ?? {};
      const info = {
        videoId: dados.video_id || atualRef.current?.videoId || null,
        titulo: dados.title || null,
        duracao: player.getDuration?.() || 0,
      };
      if (estado === TOCANDO) {
        if (!silenciadoPeloNavegador(player, mudoRef.current))
          setPedirToque(false);
        onStatus({
          ...info,
          bloqueado: silenciadoPeloNavegador(player, mudoRef.current),
          erro: null,
        });
      } else if (estado === PREPARADO || estado === PAUSADO) {
        onStatus(info);
      } else if (estado === ENCERRADO) {
        const audio = atualRef.current;
        if (audio?.repetir && audio.estado === AUDIO_ESTADOS.TOCANDO) {
          player.seekTo(0, true);
          player.playVideo();
        }
      }
    };
  });

  // Cria o player na primeira faixa (só então baixa a API do YouTube).
  useEffect(() => {
    if (!temFaixa || playerRef.current) return undefined;
    let cancelado = false;
    carregarApiYoutube()
      .then(YT => {
        if (cancelado || playerRef.current || !hospedeiroRef.current) return;
        // O YouTube troca o elemento alvo por um <iframe>: usa um filho criado
        // aqui, fora do controle do React.
        const alvo = document.createElement('div');
        hospedeiroRef.current.appendChild(alvo);
        playerRef.current = new YT.Player(alvo, {
          width: 200,
          height: 200,
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 1,
            playsinline: 1,
            rel: 0,
          },
          events: {
            onReady: () => setPronto(true),
            onStateChange: evento => aoMudarEstadoRef.current?.(evento.data),
            onError: evento =>
              onStatus({
                videoId: atualRef.current?.videoId ?? null,
                erro: mensagemErroYoutube(evento.data),
              }),
          },
        });
      })
      .catch(error => {
        if (!cancelado)
          onStatus({
            videoId: atualRef.current?.videoId ?? null,
            erro: error.message,
          });
      });
    return () => {
      cancelado = true;
    };
  }, [temFaixa, onStatus]);

  // Desmontou (saiu da mesa): o áudio para para esta pessoa.
  useEffect(
    () => () => {
      clearTimeout(verificacaoRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    },
    [],
  );

  // Liberar o som num clique (autoplay bloqueado pelo navegador).
  useEffect(() => {
    if (!pronto) return undefined;
    const controle = {
      tocar: () => {
        const player = playerRef.current;
        if (!player || atualRef.current?.estado !== AUDIO_ESTADOS.TOCANDO)
          return;
        if (!mudoRef.current) player.unMute();
        player.playVideo();
        verificarBloqueio(true);
      },
    };
    controleRef.current = controle;
    return () => {
      if (controleRef.current === controle) {
        controleRef.current = null;
      }
    };
  }, [pronto, controleRef, verificarBloqueio]);

  // Segue o estado da mesa.
  useEffect(() => {
    const player = playerRef.current;
    if (!pronto || !player) return;
    if (!atual?.videoId) {
      clearTimeout(verificacaoRef.current);
      player.stopVideo();
      return;
    }
    const agora = Date.now();
    const carregado = player.getVideoData?.()?.video_id;
    const duracao =
      carregado === atual.videoId ? player.getDuration?.() || 0 : 0;
    const posicao = posicaoAtual(atual, agora, duracao);
    const deveTocar =
      atual.estado === AUDIO_ESTADOS.TOCANDO &&
      !audioTerminou(atual, agora, duracao);

    if (carregado !== atual.videoId) {
      if (deveTocar) {
        player.loadVideoById({ videoId: atual.videoId, startSeconds: posicao });
        verificarBloqueio();
      } else {
        player.cueVideoById({ videoId: atual.videoId, startSeconds: posicao });
      }
      return;
    }
    if (!deveTocar) {
      clearTimeout(verificacaoRef.current);
      player.pauseVideo();
      if (atual.estado === AUDIO_ESTADOS.PAUSADO) player.seekTo(posicao, true);
      return;
    }
    if (Math.abs(player.getCurrentTime() - posicao) > TOLERANCIA_S)
      player.seekTo(posicao, true);
    if (player.getPlayerState() !== TOCANDO) {
      player.playVideo();
      verificarBloqueio();
    }
  }, [pronto, atual, verificarBloqueio]);

  // Corrige a deriva enquanto toca (aba em segundo plano, buffering, volta do
  // "repetir" — a duração só é conhecida depois que o vídeo carrega).
  const estadoMesa = atual?.estado;
  useEffect(() => {
    if (!pronto || estadoMesa !== AUDIO_ESTADOS.TOCANDO) return undefined;
    const intervalo = setInterval(() => {
      const player = playerRef.current;
      const audio = atualRef.current;
      if (!player || audio?.estado !== AUDIO_ESTADOS.TOCANDO) return;
      const dados = player.getVideoData?.() ?? {};
      if (dados.isLive || dados.video_id !== audio.videoId) return;
      if (player.getPlayerState() !== TOCANDO) return; // bloqueado/carregando
      const posicao = posicaoAtual(
        audio,
        Date.now(),
        player.getDuration() || 0,
      );
      if (Math.abs(player.getCurrentTime() - posicao) > TOLERANCIA_S) {
        player.seekTo(posicao, true);
      }
    }, INTERVALO_CORRECAO_MS);
    return () => clearInterval(intervalo);
  }, [pronto, estadoMesa]);

  useEffect(() => {
    const player = playerRef.current;
    if (!pronto || !player) return;
    player.setVolume(volume);
    if (mudo) player.mute();
    else player.unMute();
  }, [pronto, volume, mudo]);

  const mostrarParaTocar =
    pedirToque && atual?.estado === AUDIO_ESTADOS.TOCANDO;
  const recolhido = mostrarParaTocar && celular && !expandidoCelular;
  let estilo = estiloEscondido;
  if (recolhido) estilo = estiloRecolhidoCelular;
  else if (mostrarParaTocar)
    estilo = celular ? estiloParaTocarCelular : estiloParaTocar;
  return (
    <div
      style={estilo}
      aria-hidden={mostrarParaTocar ? undefined : 'true'}
      role={mostrarParaTocar ? 'region' : undefined}
      aria-label={mostrarParaTocar ? 'Liberar música da mesa' : undefined}
    >
      {recolhido && (
        <button
          type="button"
          style={estiloBotaoCelular}
          aria-label="Abrir player da música da mesa"
          onClick={() => setExpandidoCelular(true)}
        >
          ♪
        </button>
      )}
      {mostrarParaTocar && !recolhido && (
        <p style={{ margin: celular ? '0 18px 6px' : '0 0 6px' }}>
          Toque ▶ para ouvir a música da mesa
        </p>
      )}
      {mostrarParaTocar && celular && !recolhido && (
        <button
          type="button"
          style={estiloMinimizar}
          aria-label="Minimizar player"
          onClick={() => setExpandidoCelular(false)}
        >
          ×
        </button>
      )}
      <div
        ref={hospedeiroRef}
        style={mostrarParaTocar ? estiloPlayerParaTocar : undefined}
      />
    </div>
  );
};

PlayerAudioMesa.propTypes = {
  atual: PropTypes.shape({
    videoId: PropTypes.string,
    estado: PropTypes.string,
    posicaoBase: PropTypes.number,
    repetir: PropTypes.bool,
    referenciaEm: PropTypes.number,
  }),
  volume: PropTypes.number.isRequired,
  mudo: PropTypes.bool.isRequired,
  controleRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
  onStatus: PropTypes.func.isRequired,
};

export default PlayerAudioMesa;
