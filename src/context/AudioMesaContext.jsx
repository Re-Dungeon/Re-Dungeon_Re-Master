import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import PlayerAudioMesa from 'components/Chat/PlayerAudioMesa';
import useAudioMesa from 'hooks/useAudioMesa';

const AudioMesaContext = createContext(null);

export const AudioMesaProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { campanhaAtiva } = useCampanha();
  const campanhaId = campanhaAtiva?.id ?? null;
  const podeControlar = Boolean(
    campanhaId && currentUser && campanhaAtiva.mestreId === currentUser.uid,
  );

  const audio = useAudioMesa(campanhaId, {
    ativo: Boolean(campanhaId),
    podeControlar,
  });

  return (
    <AudioMesaContext.Provider value={audio}>
      {children}
      {campanhaId ? <PlayerAudioMesa {...audio.player} /> : null}
    </AudioMesaContext.Provider>
  );
};

AudioMesaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAudioMesaContext = () => useContext(AudioMesaContext);

// Música da mesa vista pelo chat (hooks/useChatCampanha.js, cópia
// compartilhada com o site dos jogadores). Cada app liga o áudio do seu
// jeito — aqui vem do provider da campanha ativa e, sem provider, de um
// player próprio; no site dos jogadores o chat registra a faixa num player
// global. A assinatura é a mesma nos dois arquivos.
export const useAudioDoChat = (campanhaId, { podeControlar }) => {
  const audioContext = useAudioMesaContext();
  const audioFallback = useAudioMesa(campanhaId, {
    ativo: Boolean(campanhaId) && !audioContext,
    podeControlar,
  });
  return audioContext ?? audioFallback;
};
