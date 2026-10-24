import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ExpandLessOutlined from '@mui/icons-material/ExpandLessOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import { useAuth } from 'context/AuthContext';
import { useSnackbar } from 'context/SnackbarContext';
import useChatCampanha from 'hooks/useChatCampanha';
import ChatSala from 'components/Chat/ChatSala';
import { PERSONA_MESTRE, autorDaPersona } from './chatPersonas';

const avatarSx = {
  width: 30,
  height: 30,
  fontSize: '0.78rem',
  border: '1px solid rgba(255,255,255,0.14)',
  boxShadow: '0 0 0 1px rgba(15,23,42,0.72)',
  background: 'linear-gradient(135deg, rgba(17,24,39,0.96), rgba(59,130,246,0.16))',
  flexShrink: 0,
  objectFit: 'cover',
};

const menuPaperSx = {
  width: 360,
  maxWidth: 'calc(100vw - 24px)',
  maxHeight: 'min(62vh, 520px)',
  overflow: 'hidden',
  borderRadius: 2.5,
  border: '1px solid rgba(248,113,113,0.22)',
  background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(9,12,18,0.98))',
  color: 'var(--text-primary)',
  boxShadow: '0 24px 48px rgba(15,23,42,0.5)',
  '& .MuiList-root': {
    p: 0,
    maxHeight: 'min(62vh, 520px)',
    overflowY: 'auto',
    overflowX: 'hidden',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(148,163,184,0.5) transparent',
    '&::-webkit-scrollbar': {
      width: 8,
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(148,163,184,0.45)',
      borderRadius: 999,
    },
  },
};

const menuItemSx = {
  minHeight: 44,
  px: 1.2,
  py: 0.7,
  borderRadius: 1.5,
  border: '1px solid transparent',
  color: 'var(--text-primary)',
  fontWeight: 600,
  '&:hover': {
    background: 'rgba(148,163,184,0.08)',
    borderColor: 'rgba(148,163,184,0.14)',
  },
  '&.Mui-selected': {
    background: 'rgba(196,58,47,0.12)',
    borderColor: 'rgba(248,113,113,0.25)',
    color: 'var(--text-primary)',
  },
  '&.Mui-selected:hover': {
    background: 'rgba(196,58,47,0.16)',
  },
};

const renderOpcaoPersona = (persona, isSelected = false, onSelect) => (
  <MenuItem
    key={persona.id}
    value={persona.id}
    role="option"
    aria-selected={isSelected}
    selected={isSelected}
    onClick={() => onSelect(persona.id)}
    sx={menuItemSx}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, width: '100%', minWidth: 0 }}>
      <Avatar src={persona.avatar || undefined} alt="" sx={avatarSx}>
        {persona.label[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <Typography sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.96rem' }}>
          {persona.label}
        </Typography>
      </Box>
    </Box>
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [buscaPersona, setBuscaPersona] = useState('');
  const [gruposExpandidos, setGruposExpandidos] = useState({
    mestre: true,
    npcs: true,
    criaturas: true,
  });

  const personaSelecionada = useMemo(
    () =>
      [...npcs, ...criaturas].find(persona => persona.id === personaId) ??
      PERSONA_MESTRE,
    [npcs, criaturas, personaId],
  );

  const grupos = useMemo(
    () => [
      { key: 'mestre', label: 'Mestre', itens: [PERSONA_MESTRE] },
      { key: 'npcs', label: 'NPCs', itens: npcs },
      { key: 'criaturas', label: 'Criaturas', itens: criaturas },
    ],
    [criaturas, npcs],
  );

  const gruposFiltrados = useMemo(() => {
    const termo = buscaPersona.trim().toLowerCase();
    if (!termo) return grupos;

    return grupos
      .map(grupo => ({
        ...grupo,
        itens: grupo.itens.filter(persona => persona.label.toLowerCase().includes(termo)),
      }))
      .filter(grupo => grupo.itens.length > 0);
  }, [buscaPersona, grupos]);

  const toggleGrupo = chave => {
    setGruposExpandidos(prev => ({ ...prev, [chave]: !prev[chave] }));
  };

  const handleSelecionarPersona = proximaPersonaId => {
    setPersonaId(proximaPersonaId);
    setBuscaPersona('');
    setAnchorEl(null);
  };

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
            <Button
              aria-label="Falando como"
              onClick={event => setAnchorEl(event.currentTarget)}
              sx={{
                minWidth: { xs: 220, sm: 260 },
                width: { xs: 220, sm: 260 },
                maxWidth: '100%',
                justifyContent: 'space-between',
                borderRadius: 2,
                border: '1px solid rgba(148,163,184,0.28)',
                background: 'rgba(15,23,42,0.88)',
                color: 'var(--text-primary)',
                textTransform: 'none',
                px: 1.5,
                py: 0.8,
                '&:hover': {
                  borderColor: 'rgba(248,113,113,0.32)',
                  background: 'rgba(15,23,42,0.96)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                <Avatar
                  src={personaSelecionada.avatar || undefined}
                  alt=""
                  sx={{
                    ...avatarSx,
                    width: 24,
                    height: 24,
                    fontSize: '0.72rem',
                  }}
                >
                  {personaSelecionada.label[0]?.toUpperCase()}
                </Avatar>
                <Typography sx={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {personaSelecionada.label}
                </Typography>
              </Box>
              <ExpandMoreOutlined sx={{ fontSize: '1.2rem', color: 'var(--text-muted)' }} />
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{
                paper: { sx: menuPaperSx },
              }}
            >
              <Box sx={{ p: 1.25, borderBottom: '1px solid rgba(148,163,184,0.12)', background: 'rgba(15,23,42,0.94)' }}>
                <TextField
                  fullWidth
                  size="small"
                  value={buscaPersona}
                  onChange={event => setBuscaPersona(event.target.value)}
                  placeholder="Buscar personagem"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlined sx={{ color: 'var(--text-muted)', fontSize: '1.1rem' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(15,23,42,0.9)',
                      borderRadius: 1.5,
                      color: 'var(--text-primary)',
                      '& fieldset': { borderColor: 'rgba(148,163,184,0.2)' },
                    },
                  }}
                />
              </Box>
              {gruposFiltrados.map(grupo => {
                const aberto = Boolean(gruposExpandidos[grupo.key]);
                return (
                  <React.Fragment key={grupo.key}>
                    <ListSubheader
                      component="div"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        py: 0.8,
                        px: 1.2,
                        background: 'rgba(15,23,42,0.96)',
                        color: 'var(--text-muted)',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontSize: '0.68rem',
                        lineHeight: 1.4,
                        borderBottom: '1px solid rgba(148,163,184,0.08)',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>{grupo.label}</Box>
                      <IconButton
                        size="small"
                        onClick={event => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleGrupo(grupo.key);
                        }}
                        sx={{
                          color: 'var(--text-secondary)',
                          p: 0.2,
                          '&:hover': { background: 'rgba(148,163,184,0.08)' },
                        }}
                        aria-label={aberto ? `Recolher ${grupo.label}` : `Expandir ${grupo.label}`}
                      >
                        {aberto ? <ExpandLessOutlined fontSize="small" /> : <ExpandMoreOutlined fontSize="small" />}
                      </IconButton>
                    </ListSubheader>
                    {aberto &&
                      grupo.itens.map(persona =>
                        renderOpcaoPersona(persona, persona.id === personaSelecionada.id, handleSelecionarPersona),
                      )}
                    {aberto && <Divider sx={{ borderColor: 'rgba(148,163,184,0.08)' }} />}
                  </React.Fragment>
                );
              })}
            </Menu>
          </>
        }
      />
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
