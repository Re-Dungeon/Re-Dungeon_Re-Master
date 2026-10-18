import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import { useSnackbar } from 'context/SnackbarContext';
import useChatCampanha from 'hooks/useChatCampanha';
import ChatSala from 'components/Chat/ChatSala';
import PlayerAudioMesa from 'components/Chat/PlayerAudioMesa';
import { PERSONA_MESTRE, autorDaPersona } from './chatPersonas';

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
 * Sala de chat da campanha vista pelo mestre: fala como "Mestre" ou
 * interpreta qualquer NPC/Criatura da mesa (a mensagem leva o nome/avatar
 * dele e uma etiqueta "NPC"/"Criatura"), rola dados (públicos ou secretos),
 * vê as rolagens secretas de todos os jogadores e pode apagar qualquer
 * mensagem; controla a música da mesa (YouTube). Usada pela página Chat e
 * pelo painel de chat do Grid — quem a monta carrega as personas
 * (useFontesDaMesa) e define a altura.
 */
const ChatMestre = ({ campanha, npcs, criaturas, titulo }) => {
  const { currentUser } = useAuth();
  const { notifyError } = useSnackbar();
  const [personaId, setPersonaId] = useState(PERSONA_MESTRE.id);

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
    macros,
    audio,
  } = useChatCampanha(campanha.id, autor, { ehMestreDaCampanha: true });

  // Erros do hook (enviar/rolar/apagar/escuta) vão para o Snackbar global.
  useEffect(() => {
    if (!erroChat) return;
    notifyError(erroChat);
    limparErroChat();
  }, [erroChat, limparErroChat, notifyError]);

  return (
    <>
      <ChatSala
        mensagens={mensagens}
        carregando={carregando}
        currentUid={currentUser.uid}
        podeApagarTodas
        onEnviarTexto={enviarTexto}
        onEnviarImagem={enviarImagem}
        onRolar={rolar}
        onApagar={apagar}
        macros={macros}
        audio={audio}
        cabecalho={
          <>
            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {titulo}
            </Typography>
            <TextField
              select
              size="small"
              label="Falando como"
              value={personaSelecionada.id}
              onChange={event => setPersonaId(event.target.value)}
              sx={{ minWidth: 220 }}
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
      {/* Música da mesa: o mestre controla pelo ícone 🎵 e também ouve. */}
      <PlayerAudioMesa {...audio.player} />
    </>
  );
};

const personaShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  persona: PropTypes.string.isRequired,
});

ChatMestre.propTypes = {
  campanha: PropTypes.shape({ id: PropTypes.string.isRequired }).isRequired,
  npcs: PropTypes.arrayOf(personaShape).isRequired,
  criaturas: PropTypes.arrayOf(personaShape).isRequired,
  titulo: PropTypes.node.isRequired,
};

export default ChatMestre;
