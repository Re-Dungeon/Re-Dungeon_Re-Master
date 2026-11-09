import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CodeIcon from '@mui/icons-material/Code';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import SendIcon from '@mui/icons-material/Send';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

import {
  CHAT_TEXTO_MAX,
  filtrarMensagensHistorico,
  isTextoMensagemValido,
} from 'common/utils/chat';
import {
  lerHistorico,
  navegarHistorico,
  registrarNoHistorico,
  salvarHistorico,
} from 'common/utils/chatHistorico';
import { interpretarComandoRolagem } from 'common/utils/dados';
import { preparar } from 'common/utils/gridRolagem';
import { encontrarMacroPorNome, interpretarComandoMacro } from 'common/utils/macros';

import AudioDialog from './AudioDialog';
import { audioPropType } from './audioPropType';
import ChatMensagem from './ChatMensagem';
import DadoIcone from './DadoIcone';
import ImagemUrlDialog from './ImagemUrlDialog';
import MacroPerguntaDialog from './MacroPerguntaDialog';
import MacrosDialog from './MacrosDialog';
import RolagemDialog from './RolagemDialog';
import {
  ChatHeader,
  ChatWrapper,
  ComposerAcoes,
  ComposerEntrada,
  ComposerWrapper,
  ListaArea,
  ListaMensagens,
  ListaVazia,
  NovasMensagensPilula,
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
  macros = null,
  audio = null,
  cabecalho = null,
  compactHeader = false,
  opcoesCombate = [],
  chaveHistorico,
}) => {
  // Celular (abaixo do `sm`): placeholder curto, que caiba no campo.
  const celular = useMediaQuery('(max-width: 599.95px)');
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [dialogImagemAberto, setDialogImagemAberto] = useState(false);
  const [dialogRolagemAberto, setDialogRolagemAberto] = useState(false);
  const [dialogMacrosAberto, setDialogMacrosAberto] = useState(false);
  const [dialogAudioAberto, setDialogAudioAberto] = useState(false);
  const [dialogCombateAberto, setDialogCombateAberto] = useState(false);
  const [abaCombate, setAbaCombate] = useState('ataque');
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [erroComando, setErroComando] = useState(null);
  const listaRef = useRef(null);
  const acompanhandoRef = useRef(true);
  // Mensagens que chegaram no fim da lista enquanto o usuário estava lendo mais
  // acima (pílula "Novas mensagens"). `ultimoIdRef` = última mensagem já vista
  // da lista: só o que vem DEPOIS dela conta (mensagens antigas carregadas no
  // topo, ou a troca de campanha, não contam).
  const [naoLidas, setNaoLidas] = useState(0);
  const ultimoIdRef = useRef(null);
  // Histórico do campo (↑/↓): o texto bruto enviado, guardado por chave (a
  // página passa uma por campanha). Trocou a chave, relê o da nova.
  const [historicoEstado, setHistoricoEstado] = useState(() => ({
    chave: chaveHistorico,
    lista: lerHistorico(chaveHistorico),
  }));
  if (historicoEstado.chave !== chaveHistorico) {
    setHistoricoEstado({ chave: chaveHistorico, lista: lerHistorico(chaveHistorico) });
  }
  const historico = historicoEstado.lista;
  const [indiceHistorico, setIndiceHistorico] = useState(null);
  const entradaRef = useRef(null);
  const gruposCombate = useMemo(
    () =>
      (Array.isArray(opcoesCombate) ? opcoesCombate : []).filter(
        grupo => grupo && ['ataque', 'defesa'].includes(grupo.id),
      ),
    [opcoesCombate],
  );
  const grupoCombateAtivo =
    gruposCombate.find(grupo => grupo.id === abaCombate) ?? gruposCombate[0] ?? null;
  const listaCombateScrollavel = (grupoCombateAtivo?.itens.length ?? 0) > 6;
  const mensagensVisiveis = useMemo(
    () => filtrarMensagensHistorico(mensagens, mostrarHistorico),
    [mensagens, mostrarHistorico],
  );
  useEffect(() => {
    const lista = listaRef.current;
    const ultimoId = mensagensVisiveis[mensagensVisiveis.length - 1]?.id ?? null;
    const anteriorId = ultimoIdRef.current;
    ultimoIdRef.current = ultimoId;
    if (lista && acompanhandoRef.current) {
      lista.scrollTop = lista.scrollHeight;
      setNaoLidas(0);
      return;
    }
    if (anteriorId && ultimoId !== anteriorId) {
      const indice = mensagensVisiveis.findIndex(mensagem => mensagem.id === anteriorId);
      if (indice >= 0) {
        setNaoLidas(atual => atual + (mensagensVisiveis.length - 1 - indice));
      }
    }
  }, [mensagensVisiveis]);

  const handleScroll = () => {
    const lista = listaRef.current;
    acompanhandoRef.current =
      lista.scrollHeight - lista.scrollTop - lista.clientHeight < MARGEM_AUTOSCROLL;
    if (acompanhandoRef.current) setNaoLidas(0);
  };

  const irParaNovas = () => {
    const lista = listaRef.current;
    acompanhandoRef.current = true;
    if (lista) lista.scrollTop = lista.scrollHeight;
    setNaoLidas(0);
  };

  const registrarEnvio = enviado => {
    const novo = registrarNoHistorico(historico, enviado);
    if (novo !== historico) {
      setHistoricoEstado({ chave: chaveHistorico, lista: novo });
      salvarHistorico(chaveHistorico, novo);
    }
    setIndiceHistorico(null);
  };

  // "/m nome" roda uma macro da campanha (sem bloquear o campo: as perguntas
  // dela abrem em diálogo). Nome inexistente = erro sob o campo.
  const executarComandoMacro = comandoMacro => {
    if (comandoMacro.erro) {
      setErroComando(comandoMacro.erro);
      return;
    }
    const macro = macros && encontrarMacroPorNome(macros.lista, comandoMacro.nome);
    if (!macro) {
      setErroComando(`Macro "${comandoMacro.nome}" não encontrada.`);
      return;
    }
    acompanhandoRef.current = true;
    registrarEnvio(texto);
    setTexto('');
    macros.executar(macro);
  };

  // "/r 1d20+5" (e /roll, /rs, /gr) vira rolagem em vez de mensagem; comando
  // inválido não é enviado — mostra o erro e mantém o texto para corrigir.
  const enviarTexto = async () => {
    if (!isTextoMensagemValido(texto) || enviando) return;
    const comandoMacro = interpretarComandoMacro(texto);
    if (comandoMacro) {
      executarComandoMacro(comandoMacro);
      return;
    }
    const comando = interpretarComandoRolagem(texto);
    if (comando?.erro) {
      setErroComando(comando.erro);
      return;
    }
    setEnviando(true);
    acompanhandoRef.current = true;
    try {
      await (comando ? onRolar(comando) : onEnviarTexto(texto));
      registrarEnvio(texto);
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

  // ↑/↓ percorrem o histórico só com o campo vazio ou ainda mostrando um item
  // dele sem edição — no meio de um texto (várias linhas) movem o cursor.
  const navegarComSetas = event => {
    const direcao = { ArrowUp: 'cima', ArrowDown: 'baixo' }[event.key];
    if (!direcao || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;
    const mostrandoItem = indiceHistorico !== null && texto === historico[indiceHistorico];
    if (texto !== '' && !mostrandoItem) return;
    const destino = navegarHistorico({
      historico,
      indice: mostrandoItem ? indiceHistorico : null,
      direcao,
    });
    if (destino.texto === null) return;
    event.preventDefault();
    setTexto(destino.texto);
    setIndiceHistorico(destino.indice);
    setErroComando(null);
    // Cursor no fim (trocar o valor com ↑ deixaria o cursor no início).
    requestAnimationFrame(() => {
      const campo = entradaRef.current;
      if (campo) campo.setSelectionRange(campo.value.length, campo.value.length);
    });
  };

  // Enter envia, Shift+Enter quebra linha (padrão de chat).
  const handleKeyDown = event => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      enviarTexto();
      return;
    }
    navegarComSetas(event);
  };

  const handleEnviarImagem = async url => {
    acompanhandoRef.current = true;
    await onEnviarImagem(url);
    setDialogImagemAberto(false);
  };

  const handleCombate = async item => {
    const expressao = String(item?.expressao ?? '').trim();
    if (!expressao) return;
    const especificacao = preparar(expressao);
    if (especificacao.erro) {
      setErroComando(especificacao.erro);
      return;
    }
    setDialogCombateAberto(false);
    await onRolar({ ...especificacao, secreta: false, rotulo: item?.rotuloChat ?? item?.rotulo ?? null });
  };

  return (
    <ChatWrapper>
      <ChatHeader $compact={compactHeader} data-compact={compactHeader ? 'true' : undefined}>
        {cabecalho && <div style={{ flex: '1 1 auto', minWidth: 0 }}>{cabecalho}</div>}
      </ChatHeader>

      <ListaArea>
        <ListaMensagens
          ref={listaRef}
          onScroll={handleScroll}
          aria-label="Mensagens"
          role="log"
          data-chat-scroll-area="true"
        >
          {carregando && (
            <ListaVazia>
              <CircularProgress size={24} sx={{ color: 'var(--color-primary)' }} />
            </ListaVazia>
          )}
          {!carregando && mensagensVisiveis.length === 0 && (
            <ListaVazia>Nenhuma mensagem ainda. Comece a conversa!</ListaVazia>
          )}
          {!carregando &&
            mensagensVisiveis.map(mensagem => {
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
        {naoLidas > 0 && (
          <NovasMensagensPilula type="button" onClick={irParaNovas}>
            Novas mensagens ({naoLidas}) ↓
          </NovasMensagensPilula>
        )}
      </ListaArea>

      <ComposerWrapper onSubmit={handleSubmit}>
        {audio?.bloqueado && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<VolumeOffIcon />}
            onClick={audio.liberarSom}
            sx={{ alignSelf: 'flex-start' }}
          >
            Clique para ouvir a música da mesa
          </Button>
        )}
        <ComposerAcoes>
          <Tooltip title="Enviar imagem ou GIF por link">
            <IconButton
              size="small"
              aria-label="Enviar imagem"
              onClick={() => setDialogImagemAberto(true)}
              sx={{ color: 'var(--text-secondary)' }}
            >
              <ImageOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rolar dados (ou digite /r 1d20+5)">
            <IconButton
              size="small"
              aria-label="Rolar dados"
              onClick={() => setDialogRolagemAberto(true)}
              sx={{ color: 'var(--text-secondary)' }}
            >
              <DadoIcone faces={20} />
            </IconButton>
          </Tooltip>
          {macros && (
            <Tooltip
              title={
                macros.rodando
                  ? `Rodando "${macros.rodando}"…`
                  : 'Macros da campanha (ou /m nome)'
              }
            >
              <IconButton
                size="small"
                aria-label="Macros"
                onClick={() => setDialogMacrosAberto(true)}
                sx={{
                  color: macros.rodando
                    ? 'var(--color-primary)'
                    : 'var(--text-secondary)',
                }}
              >
                <CodeIcon />
              </IconButton>
            </Tooltip>
          )}
          {audio && (
            <Tooltip
              title={
                audio.tocando
                  ? `Tocando: ${audio.titulo ?? 'música da mesa'}`
                  : 'Música da mesa'
              }
            >
              <IconButton
                size="small"
                aria-label="Música da mesa"
                onClick={() => setDialogAudioAberto(true)}
                sx={{
                  color:
                    audio.tocando && !audio.pausado
                      ? 'var(--color-primary)'
                      : 'var(--text-secondary)',
                }}
              >
                <MusicNoteIcon />
              </IconButton>
            </Tooltip>
          )}
          {gruposCombate.length > 0 && (
            <Tooltip title="Combate">
              <IconButton
                size="small"
                aria-label="Combate"
                onClick={() => setDialogCombateAberto(true)}
                sx={{
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-primary)',
                  background: 'rgba(255,255,255,0.02)',
                  '&:hover': {
                    borderColor: 'var(--border-hover)',
                    background: 'rgba(255,255,255,0.04)',
                  },
                }}
              >
                <SportsKabaddiIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={mostrarHistorico ? 'Ocultar histórico' : 'Mostrar histórico'}>
            <IconButton
              size="small"
              aria-label={mostrarHistorico ? 'Ocultar histórico' : 'Mostrar histórico'}
              onClick={() => setMostrarHistorico(valor => !valor)}
              sx={{
                color: mostrarHistorico ? 'var(--color-primary)' : 'var(--text-secondary)',
                border: `1px solid ${
                  mostrarHistorico ? 'rgba(232, 203, 133, 0.7)' : 'var(--border-primary)'
                }`,
                background: mostrarHistorico
                  ? 'rgba(232, 203, 133, 0.08)'
                  : 'rgba(255,255,255,0.02)',
                '&:hover': {
                  borderColor: 'var(--border-hover)',
                  background: mostrarHistorico
                    ? 'rgba(232, 203, 133, 0.12)'
                    : 'rgba(255,255,255,0.04)',
                },
              }}
            >
              {mostrarHistorico ? (
                <VisibilityOffOutlinedIcon fontSize="small" />
              ) : (
                <HistoryOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </ComposerAcoes>
        <ComposerEntrada>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder={celular ? 'Mensagem, /r 1d20 ou /m…' : 'Escreva uma mensagem, /r 1d20+5 ou /m macro…'}
            value={texto}
            onChange={event => {
              setTexto(event.target.value);
              setIndiceHistorico(null);
              setErroComando(null);
            }}
            onKeyDown={handleKeyDown}
            inputRef={entradaRef}
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
        </ComposerEntrada>
      </ComposerWrapper>

      {gruposCombate.length > 0 && (
        <Dialog
          open={dialogCombateAberto}
          onClose={() => setDialogCombateAberto(false)}
          fullWidth
          maxWidth="sm"
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                border: '1px solid rgba(183, 146, 83, 0.5)',
                background:
                  'linear-gradient(180deg, rgba(11, 12, 20, 0.98), rgba(16, 15, 25, 0.97))',
                boxShadow:
                  '0 26px 58px rgba(0,0,0,0.56), inset 0 1px 0 rgba(232, 203, 133, 0.12)',
                overflow: 'hidden',
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.25,
              px: 2.5,
              py: 1.75,
              borderBottom: '1px solid rgba(232, 203, 133, 0.18)',
              background:
                'linear-gradient(180deg, rgba(18, 17, 25, 0.98), rgba(10, 10, 17, 0.96))',
              color: 'var(--color-primary)',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontSize: '0.82rem',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(232, 203, 133, 0.2), rgba(232, 203, 133, 0.04))',
                  border: '1px solid rgba(232, 203, 133, 0.38)',
                  color: 'var(--color-primary)',
                  boxShadow: 'inset 0 0 18px rgba(232, 203, 133, 0.12)',
                }}
              >
                <SportsKabaddiIcon fontSize="small" />
              </Box>
              <span>Combate</span>
            </Box>
            <Box
              sx={{
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Arsenal
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0, background: 'linear-gradient(180deg, rgba(12, 12, 20, 0.72), rgba(11, 11, 18, 0.86))' }}>
            <Box sx={{ px: 2, pt: 2, pb: 1.25 }}>
              <Tabs
                value={grupoCombateAtivo?.id ?? 'ataque'}
                onChange={(_, valor) => setAbaCombate(valor)}
                variant="fullWidth"
                textColor="inherit"
                indicatorColor="primary"
                sx={{
                  minHeight: 0,
                  '& .MuiTabs-flexContainer': { gap: 1 },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '999px 999px 0 0',
                    background: 'linear-gradient(90deg, rgba(232, 203, 133, 0.9), rgba(232, 203, 133, 0.6))',
                  },
                  '& .MuiTab-root': {
                    minHeight: 46,
                    borderRadius: '12px 12px 0 0',
                    border: '1px solid rgba(183, 146, 83, 0.18)',
                    borderBottom: 'none',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    background:
                      'linear-gradient(180deg, rgba(21, 18, 30, 0.9), rgba(18, 18, 26, 0.75))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    '&:hover': {
                      color: 'var(--text-primary)',
                      borderColor: 'rgba(183, 146, 83, 0.32)',
                    },
                  },
                  '& .Mui-selected': {
                    color: 'var(--color-primary) !important',
                    background:
                      'linear-gradient(180deg, rgba(34, 28, 39, 0.96), rgba(18, 17, 27, 0.9))',
                    boxShadow:
                      'inset 0 1px 0 rgba(232, 203, 133, 0.12), 0 -4px 18px rgba(232, 203, 133, 0.06)',
                    borderColor: 'rgba(232, 203, 133, 0.28)',
                  },
                }}
              >
                {gruposCombate.map(grupo => {
                  const ativo = grupo.id === (grupoCombateAtivo?.id ?? 'ataque');
                  const Icone = grupo.id === 'ataque' ? SportsKabaddiIcon : ShieldOutlinedIcon;
                  return (
                    <Tab
                      key={grupo.id}
                      value={grupo.id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <Icone fontSize="small" sx={{ color: ativo ? 'var(--color-primary)' : 'inherit' }} />
                          <span>{grupo.titulo}</span>
                          <Box
                            component="span"
                            sx={{
                              minWidth: 22,
                              px: 0.8,
                              py: 0.16,
                              borderRadius: 999,
                              fontSize: '0.65rem',
                              background: ativo
                                ? 'linear-gradient(180deg, rgba(232, 203, 133, 0.18), rgba(91, 124, 250, 0.12))'
                                : 'rgba(91, 124, 250, 0.12)',
                              color: 'var(--text-primary)',
                              border: '1px solid rgba(183, 146, 83, 0.26)',
                              boxShadow: ativo ? '0 0 18px rgba(232, 203, 133, 0.12)' : 'none',
                            }}
                          >
                            {grupo.itens.length}
                          </Box>
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>
            </Box>
            <Box
              data-testid="combate-lista"
              data-combate-lista={listaCombateScrollavel ? 'true' : 'false'}
              sx={{
                px: 2,
                pb: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                maxHeight: listaCombateScrollavel ? 360 : 'none',
                overflowY: listaCombateScrollavel ? 'auto' : 'visible',
                overflowX: 'visible',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(232, 203, 133, 0.62) rgba(18, 18, 26, 0.9)',
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(18, 18, 26, 0.9)',
                  borderRadius: 8,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(232, 203, 133, 0.75)',
                  borderRadius: 8,
                  border: '2px solid rgba(18, 18, 26, 0.9)',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(232, 203, 133, 0.9)',
                },
              }}
            >
              {grupoCombateAtivo?.itens.length ? (
                grupoCombateAtivo.itens.map(item => {
                  const ItemIcone = grupoCombateAtivo.id === 'ataque' ? SportsKabaddiIcon : ShieldOutlinedIcon;
                  return (
                    <Button
                      key={item.id}
                      type="button"
                      data-combate-card={String(item.id)}
                      variant="outlined"
                      onClick={() => handleCombate(item)}
                      sx={{
                        position: 'relative',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                        px: 1.5,
                        py: 1.25,
                        minHeight: 78,
                        color: 'var(--text-primary)',
                        borderColor: 'rgba(183, 146, 83, 0.32)',
                        background:
                          'linear-gradient(180deg, rgba(31, 24, 39, 0.92), rgba(17, 17, 24, 0.9))',
                        textAlign: 'left',
                        borderRadius: 2.5,
                        overflow: 'visible',
                        isolation: 'isolate',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                        transition:
                          'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, filter 0.18s ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 2.5,
                          border: '1px solid rgba(232, 203, 133, 0.14)',
                          pointerEvents: 'none',
                          opacity: 1,
                        },
                        '&:hover': {
                          borderColor: 'rgba(232, 203, 133, 0.58)',
                          boxShadow:
                            'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(232, 203, 133, 0.12), 0 0 20px rgba(232, 203, 133, 0.08)',
                          filter: 'brightness(1.06)',
                          transform: 'translateY(-1px)',
                          '&::before': {
                            boxShadow: '0 0 18px rgba(232, 203, 133, 0.12)',
                          },
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 30,
                              height: 30,
                              borderRadius: 1.5,
                              background:
                                'linear-gradient(180deg, rgba(232, 203, 133, 0.14), rgba(91, 124, 250, 0.08))',
                              border: '1px solid rgba(232, 203, 133, 0.2)',
                              color: 'var(--color-primary)',
                              flexShrink: 0,
                            }}
                          >
                            <ItemIcone fontSize="small" />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                              }}
                            >
                              {item.rotulo}
                            </Typography>
                            {item.expressao && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'var(--text-muted)',
                                  mt: 0.3,
                                  letterSpacing: '0.03em',
                                }}
                              >
                                {item.expressao}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 999,
                            border: '1px solid rgba(232, 203, 133, 0.32)',
                            background: 'linear-gradient(180deg, rgba(232, 203, 133, 0.16), rgba(91, 124, 250, 0.08))',
                            color: 'var(--color-primary)',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 0 18px rgba(232, 203, 133, 0.08)',
                          }}
                        >
                          Utilizar
                        </Box>
                      </Box>
                    </Button>
                  );
                })
              ) : (
                <Box
                  sx={{
                    borderRadius: 2.5,
                    border: '1px dashed rgba(183, 146, 83, 0.3)',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(10, 12, 18, 0.5))',
                    py: 2.5,
                    px: 2,
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    boxShadow: 'inset 0 0 24px rgba(0,0,0,0.12)',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: 'var(--text-secondary)' }}>
                    Nenhuma combinação salva em {grupoCombateAtivo?.titulo ?? 'esta categoria'}.
                  </Typography>
                  <Typography variant="caption">
                    Ainda não há combinações cadastradas nesta categoria.
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              px: 2,
              py: 1.5,
              borderTop: '1px solid rgba(232, 203, 133, 0.16)',
              background: 'linear-gradient(180deg, rgba(9, 11, 18, 0.9), rgba(12, 12, 18, 0.95))',
            }}
          >
            <Button
              onClick={() => setDialogCombateAberto(false)}
              sx={{
                minWidth: 110,
                borderRadius: 999,
                border: '1px solid rgba(183, 146, 83, 0.34)',
                background: 'linear-gradient(180deg, rgba(33, 28, 38, 0.8), rgba(18, 17, 24, 0.8))',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
                '&:hover': {
                  borderColor: 'rgba(232, 203, 133, 0.56)',
                  boxShadow: '0 0 18px rgba(232, 203, 133, 0.08)',
                },
              }}
            >
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      )}
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
      {audio && (
        <AudioDialog
          open={dialogAudioAberto}
          onClose={() => setDialogAudioAberto(false)}
          audio={audio}
        />
      )}
      {macros && (
        <>
          <MacrosDialog
            open={dialogMacrosAberto}
            onClose={() => setDialogMacrosAberto(false)}
            macros={macros}
            onUsar={macro => {
              acompanhandoRef.current = true;
              macros.executar(macro);
            }}
          />
          {/* Depois dos outros diálogos: as perguntas da macro abrem por cima,
              inclusive durante o "Testar" do editor. */}
          <MacroPerguntaDialog pergunta={macros.pergunta} />
        </>
      )}
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
  // Macros Lua da campanha (null = sem macros). Montado pelas páginas a partir
  // de useChatCampanha: { lista, carregando, podeGerenciar, rodando, pergunta,
  // executar(macro), testar(macro), salvar(macro), apagar(macro), mover(i, dir) }.
  macros: PropTypes.shape({
    lista: PropTypes.arrayOf(PropTypes.object).isRequired,
    carregando: PropTypes.bool,
    podeGerenciar: PropTypes.bool,
    rodando: PropTypes.string,
    pergunta: PropTypes.object,
    executar: PropTypes.func.isRequired,
    testar: PropTypes.func,
    salvar: PropTypes.func,
    apagar: PropTypes.func,
    mover: PropTypes.func,
  }),
  // Música da mesa (null = sem música): `audio` de useChatCampanha
  // (hooks/useAudioMesa.js). O player em si a página monta à parte
  // (PlayerAudioMesa), para seguir tocando com o chat fechado.
  audio: audioPropType,
  cabecalho: PropTypes.node,
  compactHeader: PropTypes.bool,
  // Chave do sessionStorage do histórico do campo (↑/↓). Ausente = só memória.
  chaveHistorico: PropTypes.string,
  opcoesCombate: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      titulo: PropTypes.string.isRequired,
      itens: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
          rotulo: PropTypes.string.isRequired,
          rotuloChat: PropTypes.string,
          expressao: PropTypes.string,
        }),
      ).isRequired,
    }),
  ),
};

export default ChatSala;
