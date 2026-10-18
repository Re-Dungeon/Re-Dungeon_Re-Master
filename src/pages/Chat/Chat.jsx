import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addChatMensagem,
  getPersonagens,
  getRmCampanhaCriaturas,
  getRmCampanhaNpcs,
  removeChatMensagem,
  subscribeChatMensagens,
} from 'service/storage';
import { montarMensagemImagem, montarMensagemTexto } from 'common/utils/chat';
import { ROUTE_PATHS } from 'common/constants/routes';
import ChatSala from 'components/Chat/ChatSala';
import {
  PERSONA_MESTRE,
  autorDaPersona,
  montarPersonasDoMestre,
} from './chatPersonas';

const PERSONAS_VAZIAS = { campanhaId: null, npcs: [], criaturas: [] };

const avatarSx = { width: 24, height: 24, fontSize: '0.75rem', mr: 1 };

const renderOpcaoPersona = persona => (
  <MenuItem key={persona.id} value={persona.id}>
    <Avatar src={persona.avatar || undefined} alt="" sx={avatarSx}>
      {persona.label[0]?.toUpperCase()}
    </Avatar>
    {persona.label}
  </MenuItem>
);

/**
 * Chat em tempo real da Campanha ativa, compartilhado com os jogadores (site
 * Ficha-RPG---Re-Dungeon-, rota /campanhas/:id/chat). O mestre fala como
 * "Mestre" ou interpreta qualquer NPC/Criatura da mesa (a mensagem leva o
 * nome/avatar dele e uma etiqueta "NPC"/"Criatura"), e pode apagar qualquer
 * mensagem.
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

  // NPCs/Criaturas da mesa para o "Falando como" — mesma fonte das telas de
  // NPCs/Criaturas (personagens do Universo + clones da campanha). Falha aqui
  // não bloqueia o chat: o mestre continua podendo falar como "Mestre".
  const [personasCarregadas, setPersonasCarregadas] = useState(PERSONAS_VAZIAS);
  const [personaId, setPersonaId] = useState(PERSONA_MESTRE.id);

  useEffect(() => {
    if (!campanhaAtiva) return undefined;
    let active = true;
    const { id, universoId, mestreId } = campanhaAtiva;
    Promise.all([
      getPersonagens(),
      getRmCampanhaNpcs(id, universoId, mestreId),
      getRmCampanhaCriaturas(id, universoId, mestreId),
    ])
      .then(([personagens, npcClones, criaturaClones]) => {
        if (!active) return;
        setPersonasCarregadas({
          campanhaId: id,
          ...montarPersonasDoMestre({
            personagens,
            npcClones,
            criaturaClones,
            campanha: campanhaAtiva,
          }),
        });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao carregar NPCs/Criaturas da mesa:', error);
        if (active)
          notifyError('Não foi possível carregar os NPCs e Criaturas da mesa.');
      });
    return () => {
      active = false;
    };
  }, [campanhaAtiva, notifyError]);

  const { npcs, criaturas } =
    personasCarregadas.campanhaId === campanhaId
      ? personasCarregadas
      : PERSONAS_VAZIAS;

  // Persona escolhida que sumiu (troca de campanha, NPC desvinculado) volta
  // a ser o Mestre sem precisar de setState.
  const personaSelecionada = useMemo(
    () =>
      [...npcs, ...criaturas].find(persona => persona.id === personaId) ??
      PERSONA_MESTRE,
    [npcs, criaturas, personaId],
  );

  const autor = useMemo(
    () => autorDaPersona(currentUser.uid, personaSelecionada),
    [currentUser.uid, personaSelecionada],
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
            <TextField
              select
              size="small"
              label="Falando como"
              value={personaSelecionada.id}
              onChange={event => setPersonaId(event.target.value)}
              sx={{ minWidth: 240 }}
            >
              {renderOpcaoPersona(PERSONA_MESTRE)}
              {npcs.length > 0 && <ListSubheader>NPCs</ListSubheader>}
              {npcs.map(renderOpcaoPersona)}
              {criaturas.length > 0 && <ListSubheader>Criaturas</ListSubheader>}
              {criaturas.map(renderOpcaoPersona)}
            </TextField>
          </>
        }
      />
    </Box>
  );
};

export default Chat;
