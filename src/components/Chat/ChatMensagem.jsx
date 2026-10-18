import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import {
  TIPOS_MENSAGEM,
  formatarHorarioMensagem,
  rotuloPersona,
} from 'common/utils/chat';

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
  MensagemTexto,
} from './styles';

const ChatMensagem = ({ mensagem, minha, podeApagar, onApagar }) => {
  const [imagemFalhou, setImagemFalhou] = useState(false);

  if (mensagem.tipo === TIPOS_MENSAGEM.ROLAGEM && mensagem.rolagem) {
    return (
      <RolagemMensagem
        mensagem={mensagem}
        podeApagar={podeApagar}
        onApagar={onApagar}
      />
    );
  }

  const { autorNome, autorAvatar, isMestre, tipo, texto, url, createdAt } =
    mensagem;
  const persona = rotuloPersona(mensagem);

  return (
    <MensagemLinha $minha={minha} data-testid="chat-mensagem">
      <Avatar
        src={autorAvatar || undefined}
        alt={autorNome}
        sx={{
          width: 36,
          height: 36,
          fontSize: '0.9rem',
          bgcolor: isMestre
            ? 'rgba(196, 58, 47, 0.25)'
            : 'rgba(91, 124, 250, 0.3)',
          color: isMestre ? 'var(--color-primary)' : 'var(--text-primary)',
        }}
      >
        {autorNome?.[0]?.toUpperCase()}
      </Avatar>

      <MensagemBalao $minha={minha} $mestre={isMestre}>
        <MensagemCabecalho>
          <MensagemAutor $mestre={isMestre}>{autorNome}</MensagemAutor>
          {persona && <MensagemPersona>{persona}</MensagemPersona>}
          <MensagemHorario>
            {formatarHorarioMensagem(createdAt)}
          </MensagemHorario>
        </MensagemCabecalho>

        {tipo === TIPOS_MENSAGEM.IMAGEM && !imagemFalhou && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <MensagemImagem
              src={url}
              alt={`Imagem enviada por ${autorNome}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImagemFalhou(true)}
            />
          </a>
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
              onClick={() => onApagar(mensagem)}
              sx={{ color: 'var(--text-muted)' }}
            >
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </MensagemAcoes>
        )}
      </MensagemBalao>
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
    texto: PropTypes.string,
    url: PropTypes.string,
    createdAt: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
  minha: PropTypes.bool.isRequired,
  podeApagar: PropTypes.bool.isRequired,
  onApagar: PropTypes.func.isRequired,
};

export default ChatMensagem;
