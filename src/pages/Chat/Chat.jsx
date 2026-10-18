import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useCampanha } from 'context/CampanhaContext';
import { ROUTE_PATHS } from 'common/constants/routes';
import ChatMestre from './ChatMestre';
import useFontesDaMesa from './useFontesDaMesa';

/**
 * Chat em tempo real da Campanha ativa, compartilhado com os jogadores (site
 * Ficha-RPG---Re-Dungeon-, rota /campanhas/:id/chat). A sala em si (personas,
 * rolagens, macros) fica em ChatMestre.jsx — reaproveitada pelo painel de
 * chat do Grid; a escuta/envio/rolagem em hooks/useChatCampanha.js.
 */
const Chat = () => {
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const navigate = useNavigate();
  const { npcs, criaturas } = useFontesDaMesa(campanhaAtiva);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva) return null;

  return (
    <Box
      className="page-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 140px)',
        minHeight: 420,
      }}
    >
      <ChatMestre
        key={campanhaAtiva.id}
        campanha={campanhaAtiva}
        npcs={npcs}
        criaturas={criaturas}
        titulo={`Chat — ${campanhaAtiva.nome}`}
      />
    </Box>
  );
};

export default Chat;
