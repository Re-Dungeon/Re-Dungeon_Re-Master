import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SendIcon from '@mui/icons-material/Send';

import { CHAT_TEXTO_MAX, isTextoMensagemValido } from 'common/utils/chat';

import ChatMensagem from './ChatMensagem';
import ImagemUrlDialog from './ImagemUrlDialog';
import {
  ChatHeader,
  ChatWrapper,
  ComposerWrapper,
  ListaMensagens,
  ListaVazia,
} from './styles';

// Distância (px) do fim da lista dentro da qual consideramos que o usuário
// "está acompanhando" a conversa — só nesse caso uma mensagem nova rola a
// lista sozinha (não arranca quem subiu para ler o histórico).
const MARGEM_AUTOSCROLL = 80;

// Sala de chat apresentacional: não fala com o Firestore — quem usa passa as
// mensagens (já em ordem cronológica) e os callbacks de envio/remoção.
const ChatSala = ({
  mensagens,
  carregando = false,
  currentUid,
  podeApagarTodas = false,
  onEnviarTexto,
  onEnviarImagem,
  onApagar,
  cabecalho = null,
}) => {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [dialogImagemAberto, setDialogImagemAberto] = useState(false);
  const listaRef = useRef(null);
  const acompanhandoRef = useRef(true);

  useEffect(() => {
    const lista = listaRef.current;
    if (lista && acompanhandoRef.current) {
      lista.scrollTop = lista.scrollHeight;
    }
  }, [mensagens]);

  const handleScroll = () => {
    const lista = listaRef.current;
    acompanhandoRef.current =
      lista.scrollHeight - lista.scrollTop - lista.clientHeight <
      MARGEM_AUTOSCROLL;
  };

  const enviarTexto = async () => {
    if (!isTextoMensagemValido(texto) || enviando) return;
    setEnviando(true);
    acompanhandoRef.current = true;
    try {
      await onEnviarTexto(texto);
      setTexto('');
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    enviarTexto();
  };

  // Enter envia, Shift+Enter quebra linha (padrão de chat).
  const handleKeyDown = event => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      enviarTexto();
    }
  };

  const handleEnviarImagem = async url => {
    acompanhandoRef.current = true;
    await onEnviarImagem(url);
    setDialogImagemAberto(false);
  };

  return (
    <ChatWrapper>
      {cabecalho && <ChatHeader>{cabecalho}</ChatHeader>}

      <ListaMensagens
        ref={listaRef}
        onScroll={handleScroll}
        aria-label="Mensagens"
        role="log"
      >
        {carregando && (
          <ListaVazia>
            <CircularProgress
              size={24}
              sx={{ color: 'var(--color-primary)' }}
            />
          </ListaVazia>
        )}
        {!carregando && mensagens.length === 0 && (
          <ListaVazia>Nenhuma mensagem ainda. Comece a conversa!</ListaVazia>
        )}
        {!carregando &&
          mensagens.map(mensagem => {
            const minha = mensagem.uid === currentUid;
            return (
              <ChatMensagem
                key={mensagem.id}
                mensagem={mensagem}
                minha={minha}
                podeApagar={minha || podeApagarTodas}
                onApagar={onApagar}
              />
            );
          })}
      </ListaMensagens>

      <ComposerWrapper onSubmit={handleSubmit}>
        <Tooltip title="Enviar imagem ou GIF por link">
          <IconButton
            aria-label="Enviar imagem"
            onClick={() => setDialogImagemAberto(true)}
            sx={{ color: 'var(--text-secondary)' }}
          >
            <ImageOutlinedIcon />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Escreva uma mensagem…"
          value={texto}
          onChange={event => setTexto(event.target.value)}
          onKeyDown={handleKeyDown}
          slotProps={{
            htmlInput: { maxLength: CHAT_TEXTO_MAX, 'aria-label': 'Mensagem' },
          }}
        />
        <IconButton
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!isTextoMensagemValido(texto) || enviando}
          sx={{ color: 'var(--color-primary)' }}
        >
          <SendIcon />
        </IconButton>
      </ComposerWrapper>

      <ImagemUrlDialog
        open={dialogImagemAberto}
        onClose={() => setDialogImagemAberto(false)}
        onConfirmar={handleEnviarImagem}
      />
    </ChatWrapper>
  );
};

ChatSala.propTypes = {
  mensagens: PropTypes.arrayOf(PropTypes.object).isRequired,
  carregando: PropTypes.bool,
  currentUid: PropTypes.string.isRequired,
  podeApagarTodas: PropTypes.bool,
  onEnviarTexto: PropTypes.func.isRequired,
  onEnviarImagem: PropTypes.func.isRequired,
  onApagar: PropTypes.func.isRequired,
  cabecalho: PropTypes.node,
};

export default ChatSala;
