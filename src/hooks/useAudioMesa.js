import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { setAudioMesa, subscribeAudioMesa } from 'service/storage';
import {
  AUDIO_ESTADOS,
  AUDIO_PARADO,
  VOLUME_PADRAO,
  extrairVideoYoutube,
  montarAudioPausado,
  montarAudioRepetir,
  montarAudioRetomado,
  montarAudioTocar,
} from 'common/utils/audioMesa';

// Música da mesa: ouve rmCampanhas/{id}/audio/atual (`ativo` = já pode ler,
// mesmo acesso do chat), guarda o volume/mudo de quem está vendo (por
// aparelho, localStorage) e, para o mestre (`podeControlar`), grava
// tocar/pausar/retomar/parar/repetir. O player em si é o
// components/Chat/PlayerAudioMesa.jsx, montado pela página com `audio.player`
// (fora do ChatSala, para seguir tocando com o painel de chat fechado); ele
// devolve título/duração/bloqueio/erro por `onStatus`. Usado dentro de
// hooks/useChatCampanha.js.
const CHAVE_VOLUME = 'audioMesa.volume';
const CHAVE_MUDO = 'audioMesa.mudo';
const STATUS_VAZIO = {
  videoId: null,
  titulo: null,
  duracao: 0,
  bloqueado: false,
  erro: null,
};

const lerPreferencia = (chave, padrao, converter) => {
  try {
    const valor = window.localStorage.getItem(chave);
    return valor === null ? padrao : converter(valor);
  } catch {
    return padrao;
  }
};

const gravarPreferencia = (chave, valor) => {
  try {
    window.localStorage.setItem(chave, String(valor));
  } catch {
    // Sem storage (aba privada etc.): a preferência vale só nesta sessão.
  }
};

const useAudioMesa = (campanhaId, { ativo, podeControlar }) => {
  const [recebido, setRecebido] = useState({ campanhaId: null, atual: null });
  const [status, setStatus] = useState(STATUS_VAZIO);
  const [erro, setErro] = useState(null);
  const [volume, setVolumeEstado] = useState(() =>
    lerPreferencia(CHAVE_VOLUME, VOLUME_PADRAO, valor => {
      const numero = Number(valor);
      return Number.isFinite(numero)
        ? Math.min(Math.max(numero, 0), 100)
        : VOLUME_PADRAO;
    }),
  );
  const [mudo, setMudoEstado] = useState(() =>
    lerPreferencia(CHAVE_MUDO, false, valor => valor === 'true'),
  );
  // Preenchido pelo player: { tocar() } — chamado num clique do usuário para
  // liberar o som quando o navegador bloqueou o autoplay.
  const controleRef = useRef(null);

  useEffect(() => {
    if (!ativo || !campanhaId) return undefined;
    return subscribeAudioMesa(
      campanhaId,
      atual => setRecebido({ campanhaId, atual }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir a música da mesa:', error);
        setRecebido({ campanhaId, atual: null });
      },
    );
  }, [ativo, campanhaId]);

  const atual =
    ativo && recebido.campanhaId === campanhaId ? recebido.atual : null;
  const temFaixa = Boolean(atual?.videoId);
  const statusAtual =
    temFaixa && status.videoId === atual.videoId ? status : STATUS_VAZIO;

  const onStatus = useCallback(
    patch =>
      setStatus(anterior =>
        patch.videoId && patch.videoId !== anterior.videoId
          ? { ...STATUS_VAZIO, ...patch }
          : { ...anterior, ...patch },
      ),
    [],
  );

  const setVolume = useCallback(valor => {
    setVolumeEstado(valor);
    gravarPreferencia(CHAVE_VOLUME, valor);
  }, []);

  const setMudo = useCallback(valor => {
    setMudoEstado(valor);
    gravarPreferencia(CHAVE_MUDO, valor);
  }, []);

  const liberarSom = useCallback(() => {
    controleRef.current?.tocar();
    setStatus(anterior => ({ ...anterior, bloqueado: false }));
  }, []);

  const gravar = useCallback(
    async estado => {
      try {
        await setAudioMesa(campanhaId, estado);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao controlar a música:', error);
        setErro('Não foi possível controlar a música da mesa.');
        return false;
      }
    },
    [campanhaId],
  );

  const duracao = statusAtual.duracao;

  // Devolve a mensagem de erro do link (ou null se começou a tocar).
  const tocar = useCallback(
    async (link, repetir) => {
      const video = extrairVideoYoutube(link);
      if (!video)
        return 'Cole um link de vídeo do YouTube (youtube.com/watch?v=… ou youtu.be/…).';
      // Clique do mestre = gesto do usuário: libera o som dele já agora.
      controleRef.current?.tocar();
      return (await gravar(montarAudioTocar(video, repetir)))
        ? null
        : 'Não foi possível tocar.';
    },
    [gravar],
  );

  const pausar = useCallback(
    () => atual && gravar(montarAudioPausado(atual, Date.now(), duracao)),
    [atual, duracao, gravar],
  );
  const retomar = useCallback(() => {
    if (!atual) return undefined;
    controleRef.current?.tocar();
    return gravar(montarAudioRetomado(atual, Date.now(), duracao));
  }, [atual, duracao, gravar]);
  const parar = useCallback(() => gravar(AUDIO_PARADO), [gravar]);
  const setRepetir = useCallback(
    repetir =>
      atual && gravar(montarAudioRepetir(atual, Date.now(), duracao, repetir)),
    [atual, duracao, gravar],
  );

  const limparErro = useCallback(() => setErro(null), []);

  const player = useMemo(
    () => ({ atual, volume, mudo, controleRef, onStatus }),
    [atual, volume, mudo, onStatus],
  );

  return useMemo(
    () => ({
      atual,
      tocando: temFaixa,
      pausado: atual?.estado === AUDIO_ESTADOS.PAUSADO,
      repetir: atual?.repetir ?? true,
      titulo: statusAtual.titulo,
      bloqueado:
        temFaixa &&
        atual.estado === AUDIO_ESTADOS.TOCANDO &&
        statusAtual.bloqueado,
      erroPlayer: statusAtual.erro,
      podeControlar: Boolean(podeControlar),
      volume,
      mudo,
      setVolume,
      setMudo,
      liberarSom,
      tocar,
      pausar,
      retomar,
      parar,
      setRepetir,
      erro,
      limparErro,
      player,
    }),
    [
      atual,
      temFaixa,
      statusAtual,
      podeControlar,
      volume,
      mudo,
      setVolume,
      setMudo,
      liberarSom,
      tocar,
      pausar,
      retomar,
      parar,
      setRepetir,
      erro,
      limparErro,
      player,
    ],
  );
};

export default useAudioMesa;
