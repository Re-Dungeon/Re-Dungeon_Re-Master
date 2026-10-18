import React, { useEffect, useMemo, useState } from 'react';
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
  getPersonagens,
  getRmCampanhaCriaturas,
  getRmCampanhaNpcs,
} from 'service/storage';
import useChatCampanha from 'hooks/useChatCampanha';
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
 * nome/avatar dele e uma etiqueta "NPC"/"Criatura"), rola dados (públicos ou
 * secretos), vê as rolagens secretas de todos os jogadores e pode apagar
 * qualquer mensagem. Escuta/envio/rolagem ficam em hooks/useChatCampanha.js.
 */
const Chat = () => {
  const { currentUser } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const { notifyError } = useSnackbar();
  const navigate = useNavigate();
  const campanhaId = campanhaAtiva?.id ?? null;

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

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

  const {
    mensagens,
    carregando,
    erro: erroChat,
    limparErro: limparErroChat,
    enviarTexto,
    enviarImagem,
    rolar,
    apagar,
  } = useChatCampanha(campanhaId, autor);

  // Erros do hook (enviar/rolar/apagar/escuta) vão para o Snackbar global.
  useEffect(() => {
    if (!erroChat) return;
    notifyError(erroChat);
    limparErroChat();
  }, [erroChat, limparErroChat, notifyError]);

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
        onEnviarTexto={enviarTexto}
        onEnviarImagem={enviarImagem}
        onRolar={rolar}
        onApagar={apagar}
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
