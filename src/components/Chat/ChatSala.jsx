import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SendIcon from '@mui/icons-material/Send';

import { CHAT_TEXTO_MAX, isTextoMensagemValido } from 'common/utils/chat';
import { interpretarComandoRolagem } from 'common/utils/dados';

import ChatMensagem from './ChatMensagem';
import DadoIcone from './DadoIcone';
import ImagemUrlDialog from './ImagemUrlDialog';
import RolagemDialog from './RolagemDialog';
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
  onRolar,
  onApagar,
  cabecalho = null,
}) => {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [dialogImagemAberto, setDialogImagemAberto] = useState(false);
  const [dialogRolagemAberto, setDialogRolagemAberto] = useState(false);
  const [erroComando, setErroComando] = useState(null);
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

  // "/r 1d20+5" (e /roll, /rs, /gr) vira rolagem em vez de mensagem; comando
  // inválido não é enviado — mostra o erro e mantém o texto para corrigir.
  const enviarTexto = async () => {
    if (!isTextoMensagemValido(texto) || enviando) return;
    const comando = interpretarComandoRolagem(texto);
    if (comando?.erro) {
      setErroComando(comando.erro);
      return;
    }
    setEnviando(true);
    acompanhandoRef.current = true;
    try {
      await (comando ? onRolar(comando) : onEnviarTexto(texto));
      setTexto('');
    } catch {
      // Quem envia já exibiu o erro; o texto fica no campo para tentar de novo.
    } finally {
      setEnviando(false);
    }
  };

  const handleRolarDialog = async especificacao => {
    acompanhandoRef.current = true;
    await onRolar(especificacao);
    setDialogRolagemAberto(false);
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
        <Tooltip title="Rolar dados (ou digite /r 1d20+5)">
          <IconButton
            aria-label="Rolar dados"
            onClick={() => setDialogRolagemAberto(true)}
            sx={{ color: 'var(--text-secondary)' }}
          >
            <DadoIcone faces={20} />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Escreva uma mensagem ou /r 1d20+5…"
          value={texto}
          onChange={event => {
            setTexto(event.target.value);
            setErroComando(null);
          }}
          onKeyDown={handleKeyDown}
          error={Boolean(erroComando)}
          helperText={erroComando}
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
      <RolagemDialog
        open={dialogRolagemAberto}
        onClose={() => setDialogRolagemAberto(false)}
        onRolar={handleRolarDialog}
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
  // Recebe { secreta, grupos, termos } (common/utils/dados.js) e rola/envia.
  onRolar: PropTypes.func.isRequired,
  onApagar: PropTypes.func.isRequired,
  cabecalho: PropTypes.node,
};

export default ChatSala;
