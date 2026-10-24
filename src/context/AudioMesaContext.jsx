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
