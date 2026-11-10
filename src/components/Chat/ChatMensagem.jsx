import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import {
  TIPOS_MENSAGEM,
  formatarHorarioMensagem,
  rotuloPersona,
} from 'common/utils/chat';

import ImageLightbox from 'components/ImageLightbox/ImageLightbox';

import CombateMensagem from './CombateMensagem';
import RolagemMensagem from './RolagemMensagem';
import {
  MensagemAcoes,
  MensagemAutor,
  MensagemBalao,
  MensagemCabecalho,
  MensagemHorario,
  MensagemImagem,
  MensagemLink,
  MensagemLinha,
  MensagemMacroTexto,
  MensagemMacroTitulo,
  MensagemPersona,
  MensagemSussurro,
  MensagemTexto,
} from './styles';

const ChatMensagem = ({ mensagem, minha, podeApagar, onApagar }) => {
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [imagemAmpliadaAberta, setImagemAmpliadaAberta] = useState(false);
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false);

  const confirmarExclusao = () => {
    onApagar(mensagem);
    setConfirmacaoExclusaoAberta(false);
  };

  if (mensagem.tipo === TIPOS_MENSAGEM.ROLAGEM && mensagem.rolagem) {
    return (
      <RolagemMensagem mensagem={mensagem} podeApagar={podeApagar} onApagar={onApagar} />
    );
  }
  if (mensagem.tipo === TIPOS_MENSAGEM.COMBATE) {
    return (
      <CombateMensagem mensagem={mensagem} podeApagar={podeApagar} onApagar={onApagar} />
    );
  }

  const { autorNome, autorAvatar, isMestre, tipo, texto, url, createdAt } = mensagem;
  const persona = rotuloPersona(mensagem);
  const sussurro = Boolean(mensagem.sussurro);

  return (
    <MensagemLinha $minha={minha} data-testid="chat-mensagem">
      <Avatar
        src={autorAvatar || undefined}
        alt={autorNome}
        sx={{
          width: 36,
          height: 36,
          fontSize: '0.9rem',
          bgcolor: isMestre ? 'rgba(232, 203, 133, 0.25)' : 'rgba(91, 124, 250, 0.3)',
          color: isMestre ? 'var(--color-primary)' : 'var(--text-primary)',
          '@media (max-width: 599.95px)': { width: 30, height: 30, fontSize: '0.8rem' },
        }}
      >
        {autorNome?.[0]?.toUpperCase()}
      </Avatar>

      <MensagemBalao $minha={minha} $mestre={isMestre} $sussurro={sussurro}>
        <MensagemCabecalho>
          <MensagemAutor $mestre={isMestre}>{autorNome}</MensagemAutor>
          {persona && <MensagemPersona>{persona}</MensagemPersona>}
          <MensagemHorario>{formatarHorarioMensagem(createdAt)}</MensagemHorario>
        </MensagemCabecalho>

        {sussurro && (
          <MensagemSussurro data-sussurro="">
            {minha
              ? `🤫 Sussurro para ${mensagem.paraNome || 'o Mestre'}`
              : `🤫 ${autorNome} sussurrou`}
          </MensagemSussurro>
        )}

        {tipo === TIPOS_MENSAGEM.IMAGEM && !imagemFalhou && (
          <>
            <MensagemImagem
              src={url}
              alt={`Imagem enviada por ${autorNome}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImagemFalhou(true)}
              onClick={() => setImagemAmpliadaAberta(true)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setImagemAmpliadaAberta(true);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Abrir imagem ampliada de ${autorNome}`}
            />
            <ImageLightbox
              open={imagemAmpliadaAberta}
              imageUrl={url}
              imageAlt={`Imagem enviada por ${autorNome}`}
              onClose={() => setImagemAmpliadaAberta(false)}
            />
          </>
        )}
        {tipo === TIPOS_MENSAGEM.IMAGEM && imagemFalhou && (
          <MensagemLink href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </MensagemLink>
        )}
        {tipo === TIPOS_MENSAGEM.MACRO && (
          <>
            <MensagemMacroTitulo>⚙ {mensagem.macroNome}</MensagemMacroTitulo>
            <MensagemMacroTexto>{texto}</MensagemMacroTexto>
          </>
        )}
        {tipo !== TIPOS_MENSAGEM.IMAGEM && tipo !== TIPOS_MENSAGEM.MACRO && (
          <MensagemTexto>{texto}</MensagemTexto>
        )}

        {podeApagar && (
          <MensagemAcoes className="chat-acoes">
            <IconButton
              size="small"
              aria-label="Apagar mensagem"
              onClick={() => setConfirmacaoExclusaoAberta(true)}
              sx={{ color: 'var(--text-muted)' }}
            >
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </MensagemAcoes>
        )}
      </MensagemBalao>

      <Dialog
        open={confirmacaoExclusaoAberta}
        onClose={() => setConfirmacaoExclusaoAberta(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              border: '1px solid rgba(232, 203, 133, 0.4)',
              background: 'linear-gradient(180deg, rgba(15, 13, 23, 0.98), rgba(10, 10, 18, 0.98))',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
            },
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--color-primary)', fontWeight: 800, pb: 1.5 }}>
          Excluir mensagem?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--text-secondary)', fontSize: '0.96rem' }}>
            Essa ação remove a mensagem do chat e não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setConfirmacaoExclusaoAberta(false)}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarExclusao}
            variant="contained"
            color="error"
            sx={{ borderRadius: 999, px: 2.25, fontWeight: 700 }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </MensagemLinha>
  );
};

ChatMensagem.propTypes = {
  mensagem: PropTypes.shape({
    id: PropTypes.string.isRequired,
    autorNome: PropTypes.string,
    autorAvatar: PropTypes.string,
    isMestre: PropTypes.bool,
    persona: PropTypes.string,
    tipo: PropTypes.string,
    rolagem: PropTypes.object,
    macroNome: PropTypes.string,
    sussurro: PropTypes.bool,
    paraNome: PropTypes.string,
    rotulo: PropTypes.string,
    combate: PropTypes.object,
    texto: PropTypes.string,
    url: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
  }).isRequired,
  minha: PropTypes.bool.isRequired,
  podeApagar: PropTypes.bool.isRequired,
  onApagar: PropTypes.func.isRequired,
};

export default ChatMensagem;
