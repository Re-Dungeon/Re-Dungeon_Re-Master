import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addChatMensagem,
  removeChatMensagem,
  subscribeChatMensagens,
} from 'service/storage';
import { montarMensagemImagem, montarMensagemTexto } from 'common/utils/chat';
import { ROUTE_PATHS } from 'common/constants/routes';
import ChatSala from 'components/Chat/ChatSala';

/**
 * Chat em tempo real da Campanha ativa, compartilhado com os jogadores (site
 * Ficha-RPG---Re-Dungeon-, rota /campanhas/:id/chat). O mestre sempre assina
 * como "Mestre" e pode apagar qualquer mensagem.
 */
const Chat = () => {
  const { currentUser } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const { notifyError } = useSnackbar();
  const navigate = useNavigate();
  // Guarda de qual campanha são as mensagens carregadas: ao trocar a campanha
  // ativa, `carregando` volta a true sem precisar de setState no efeito.
  const [recebido, setRecebido] = useState({ campanhaId: null, mensagens: [] });

  const campanhaId = campanhaAtiva?.id;
  const carregando = recebido.campanhaId !== campanhaId;
  const mensagens = carregando ? [] : recebido.mensagens;

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  useEffect(() => {
    if (!campanhaId) return undefined;
    return subscribeChatMensagens(
      campanhaId,
      novasMensagens => setRecebido({ campanhaId, mensagens: novasMensagens }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir mensagens do chat:', error);
        notifyError('Sem permissão para ver o chat desta campanha.');
        setRecebido({ campanhaId, mensagens: [] });
      },
    );
  }, [campanhaId, notifyError]);

  const autor = useMemo(
    () => ({ uid: currentUser.uid, autorNome: 'Mestre', isMestre: true }),
    [currentUser.uid],
  );

  const enviar = useCallback(
    async mensagem => {
      try {
        await addChatMensagem(campanhaId, mensagem);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao enviar mensagem:', error);
        notifyError('Não foi possível enviar a mensagem.');
        throw error;
      }
    },
    [campanhaId, notifyError],
  );

  const handleEnviarTexto = useCallback(
    texto => enviar(montarMensagemTexto(autor, texto)),
    [enviar, autor],
  );
  const handleEnviarImagem = useCallback(
    url => enviar(montarMensagemImagem(autor, url)),
    [enviar, autor],
  );

  const handleApagar = useCallback(
    async mensagem => {
      if (!window.confirm('Apagar esta mensagem?')) return;
      try {
        await removeChatMensagem(campanhaId, mensagem.id);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao apagar mensagem:', error);
        notifyError('Não foi possível apagar a mensagem.');
      }
    },
    [campanhaId, notifyError],
  );

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
      <ChatSala
        mensagens={mensagens}
        carregando={carregando}
        currentUid={currentUser.uid}
        podeApagarTodas
        onEnviarTexto={handleEnviarTexto}
        onEnviarImagem={handleEnviarImagem}
        onApagar={handleApagar}
        cabecalho={
          <>
            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              Chat — {campanhaAtiva.nome}
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Falando como <strong>Mestre</strong>
            </Typography>
          </>
        }
      />
    </Box>
  );
};

export default Chat;
