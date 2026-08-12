import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { Formik, Form, FastField, Field, FieldArray } from 'formik';
import useStableListKeys from 'hooks/useStableListKeys';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import {
  getRmCampanhaNpcs,
  getRmCampanhaCriaturas,
  getRmMissoesPorCampanha,
} from 'service/storage';
import {
  CENA_SCHEMA,
  ESTADO_CENA_OPCOES,
  TIPO_CONSEQUENCIA_OPCOES,
  CONSEQUENCIA_INICIAL,
} from './cenaUtils';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    borderRadius: '16px',
    padding: 0,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(196,58,47,0.9)',
      boxShadow: '0 6px 20px rgba(196,58,47,0.10)',
    },
    '& input, & textarea': { padding: '14px 16px' },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--text-secondary)',
    fontWeight: 700,
  },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
  '& .MuiFormHelperText-root': { color: '#ef4444' },
};

const selectSx = {
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: '12px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(196,58,47,0.9)',
    boxShadow: '0 6px 20px rgba(196,58,47,0.08)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const sectionSx = {
  p: { xs: 2.5, md: 4 },
  background: 'rgba(8,12,18,0.64)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '18px',
  boxShadow: '0 12px 32px rgba(0,0,0,0.38)',
};

const editorTriggerSx = {
  position: 'absolute',
  right: 14,
  bottom: 14,
  zIndex: 2,
  background: 'rgba(16, 20, 32, 0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'var(--text-primary)',
  width: 40,
  height: 40,
  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
  '&:hover': {
    background: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(196,58,47,0.85)',
    color: 'var(--color-accent)',
  },
};

const narrationEditorModalSx = {
  position: 'fixed',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: 'calc(100% - 30px)', md: '82vw' },
  maxWidth: 1200,
  maxHeight: '90vh',
  bgcolor: 'rgba(7, 10, 17, 0.98)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '24px',
  boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
  p: { xs: 3, md: 4 },
  outline: 'none',
  display: 'flex',
  flexDirection: 'column',
};

const narrationEditorHeaderSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  mb: 2,
};

const narrationEditorHeaderTopSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
};

const narrationEditorTitleSx = {
  color: 'var(--text-primary)',
  fontWeight: 900,
  letterSpacing: '0.04em',
  fontSize: { xs: '1.15rem', md: '1.35rem' },
};

const narrationEditorDescriptionSx = {
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  fontSize: '0.97rem',
};

const narrationDividerSx = {
  borderColor: 'rgba(255,255,255,0.08)',
  my: 2,
};

const narrationToolbarSx = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 1,
  padding: '10px 12px',
  borderRadius: '16px',
  background: 'rgba(15,18,28,0.92)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const narrationToolbarGroupSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  pr: 1,
  '&:not(:last-of-type)': {
    borderRight: '1px solid rgba(255,255,255,0.08)',
  },
};

const narrationToolButtonSx = {
  color: 'var(--text-secondary)',
  borderRadius: '14px',
  width: 36,
  height: 36,
  minWidth: 36,
  p: 0,
  '&:hover': {
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--color-accent)',
  },
};

const narrationSeparatorButtonSx = {
  ...narrationToolButtonSx,
  width: 46,
  height: 46,
  minWidth: 46,
  border: '1px solid rgba(196,58,47,0.35)',
  color: 'rgba(196,58,47,0.95)',
  '&:hover': {
    background: 'rgba(196,58,47,0.12)',
    color: 'var(--color-accent)',
  },
};

const narrationEditorAreaSx = {
  flex: 1,
  minHeight: 360,
  maxHeight: 'calc(90vh - 250px)',
  overflow: 'hidden',
  background: 'rgba(13, 18, 30, 0.96)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '22px',
  display: 'flex',
  flexDirection: 'column',
};

const narrationTextareaWrapperSx = {
  flex: 1,
  overflowY: 'auto',
  px: { xs: 3.5, md: 4.5 },
  py: { xs: 3, md: 4 },
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255,255,255,0.04)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(196,58,47,0.4)',
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(196,58,47,0.65)',
  },
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(196,58,47,0.4) rgba(255,255,255,0.04)',
};

const narrationTextareaSx = {
  width: '100%',
  minHeight: 320,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  lineHeight: 1.9,
  fontFamily: 'Inter, system-ui, sans-serif',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const narrationEditorFooterSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 2,
  mt: 2,
  pt: 1,
  borderTop: '1px solid rgba(255,255,255,0.08)',
};

const narrationFooterTextSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
};

const narrationFooterStatusDotSx = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: 'rgba(196,58,47,0.95)',
};

const narrationFooterCountSx = {
  color: 'var(--text-secondary)',
  fontSize: '0.95rem',
};

const PlaceholderModulo = ({ children }) => (
  <Typography
    variant="body2"
    sx={{
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      p: 2,
      background: 'var(--bg-secondary)',
      borderRadius: 1,
    }}
  >
    {children}
  </Typography>
);

PlaceholderModulo.propTypes = {
  children: PropTypes.node.isRequired,
};

const CenaForm = ({
  initialValues,
  onSubmit,
  onCancelar,
  labelSalvar,
  idPrefix = 'cena-form',
  campanhaId = null,
  universoId = null,
  mestreId = null,
}) => {
  const pontosKeys = useStableListKeys(initialValues.pontosImportantes.length);
  const consequenciasKeys = useStableListKeys(
    initialValues.consequencias.length,
  );
  const estadoLabelId = `${idPrefix}-estado-label`;
  const npcsLabelId = `${idPrefix}-npcs-label`;
  const criaturasLabelId = `${idPrefix}-criaturas-label`;

  const [npcs, setNpcs] = useState([]);
  const [criaturas, setCriaturas] = useState([]);
  const [missoes, setMissoes] = useState([]);
  const [editorAberto, setEditorAberto] = useState(false);
  const [editorConteudo, setEditorConteudo] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [, setUndoStack] = useState([]);
  const [, setRedoStack] = useState([]);

  const editorRef = useRef(null);
  const textAreaRef = useRef(null);

  const pushUndoState = value => {
    setUndoStack(prev => {
      const next = [...prev, value];
      return next.length > 40 ? next.slice(next.length - 40) : next;
    });
    setRedoStack([]);
  };

  const abrirEditorNarracao = valor => {
    setEditorConteudo(valor ?? '');
    setPreviewMode(false);
    setUndoStack([]);
    setRedoStack([]);
    setEditorAberto(true);
  };

  const fecharEditorNarracao = (setFieldValue, currentValue) => {
    if (typeof setFieldValue === 'function') {
      setFieldValue('descricaoNarracao', currentValue ?? '');
    }
    setEditorAberto(false);
  };

  const handleEditorClose = (setFieldValue, currentValue) => {
    fecharEditorNarracao(setFieldValue, currentValue);
  };

  const updateEditorContent = (nextValue, callback) => {
    pushUndoState(editorConteudo);
    setEditorConteudo(nextValue);
    if (typeof callback === 'function') {
      window.requestAnimationFrame(callback);
    }
  };

  const restoreTextAreaState = (textarea, start, end, scrollTop) => {
    if (!textarea) return;
    if (typeof textarea.focus === 'function') {
      textarea.focus({ preventScroll: true });
    }
    textarea.setSelectionRange(start, end);
    textarea.scrollTop = scrollTop;
  };

  const getSelectionInfo = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return null;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    return { textarea, start, end };
  };

  const wrapSelection = (prefix, suffix = prefix) => {
    const selection = getSelectionInfo();
    if (!selection) return;
    const { textarea, start, end } = selection;
    const text = editorConteudo;

    let before = text.slice(0, start);
    let selected = text.slice(start, end);
    let after = text.slice(end);
    let nextSelectionStart = start + prefix.length;
    let nextSelectionEnd = nextSelectionStart + (selected || 'Texto').length;

    if (start === end) {
      const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const newlineIndex = text.indexOf('\n', lineStart);
      const lineEnd = newlineIndex === -1 ? text.length : newlineIndex;
      const originalLineEnd = lineEnd;
      let selectedLine = text.slice(lineStart, lineEnd);
      if (selectedLine.endsWith('\r')) {
        selectedLine = selectedLine.slice(0, -1);
      }
      before = text.slice(0, lineStart);
      selected = selectedLine;
      after = text.slice(originalLineEnd);
      nextSelectionStart = lineStart + prefix.length;
      nextSelectionEnd = nextSelectionStart + (selected || 'Texto').length;
    }

    const wrapped = `${prefix}${selected || 'Texto'}${suffix}`;
    const scrollTop = textarea.scrollTop;

    updateEditorContent(`${before}${wrapped}${after}`, () => {
      restoreTextAreaState(textarea, nextSelectionStart, nextSelectionEnd, scrollTop);
    });
  };

  const wrapLines = prefixFn => {
    const selection = getSelectionInfo();
    if (!selection) return;
    const { textarea, start, end } = selection;
    const text = editorConteudo;
    const before = text.slice(0, start);
    const selectionText = text.slice(start, end);
    const after = text.slice(end);
    const lines = selectionText.split('\n');
    const transformed = lines.map((line, index) => prefixFn(line, index)).join('\n');
    const scrollTop = textarea.scrollTop;

    updateEditorContent(`${before}${transformed}${after}`, () => {
      restoreTextAreaState(textarea, start, start + transformed.length, scrollTop);
    });
  };

  const handleToolbarMouseDown = event => {
    event.preventDefault();
  };

  const renderMarkdownPreview = text => {
    const escapeHTML = value =>
      value.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const escaped = escapeHTML(text);
    const formatted = escaped
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/^(?:-\s)(.*)$/gm, '<li>$1</li>')
      .replace(/^(?:\d+\.\s)(.*)$/gm, '<li>$1</li>')
      .replace(/^──+\s*⋆✦⋆\s*──+$/gm, '<div style="text-align:center;color:#ef4444;letter-spacing:0.18em;">⋆✦⋆</div>');

    const withLists = formatted
      .replace(/(<li>.*?<\/li>\n?)+/gs, match => {
        const items = match.trim().split(/\n+/).map(item => item.trim()).filter(Boolean);
        if (!items.length) return match;
        const listItems = items.join('');
        return `<ul style="padding-left:18px;margin:8px 0;">${listItems}</ul>`;
      });

    const withAlignment = withLists.replace(/\[align=(left|center|right|justify)\]([\s\S]*?)\[\/align\]/g, (match, align, content) => {
      const inner = content.replace(/\n/g, '<br />');
      return `<div style="text-align:${align}; margin:0.8rem 0;">${inner}</div>`;
    });

    return withAlignment.replace(/\n/g, '<br />');
  };

  const handleUndo = () => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setRedoStack(rprev => [editorConteudo, ...rprev]);
      setEditorConteudo(previous);
      return prev.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const [next, ...remaining] = prev;
      pushUndoState(editorConteudo);
      setEditorConteudo(next);
      return remaining;
    });
  };

  const handleToggleBold = () => wrapSelection('**', '**');
  const handleToggleItalic = () => wrapSelection('*', '*');
  const handleToggleUnderline = () => wrapSelection('__', '__');
  const wrapAlignment = alignment => {
    const selection = getSelectionInfo();
    if (!selection) return;
    const { textarea, start, end } = selection;
    const text = editorConteudo;

    let before = text.slice(0, start);
    let selected = text.slice(start, end);
    let after = text.slice(end);
    let nextSelectionStart = start;
    let nextSelectionEnd = end;

    if (start === end) {
      const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const lineEnd = text.indexOf('\n', lineStart);
      const resolvedLineEnd = lineEnd === -1 ? text.length : lineEnd;
      before = text.slice(0, lineStart);
      selected = text.slice(lineStart, resolvedLineEnd);
      if (selected.endsWith('\r')) {
        selected = selected.slice(0, -1);
      }
      after = text.slice(resolvedLineEnd);
      nextSelectionStart = lineStart;
      nextSelectionEnd = lineStart + (selected || 'Texto').length;
    }

    const opening = `[align=${alignment}]`;
    const closing = `[/align]`;
    const wrapped = `${opening}${selected || 'Texto'}${closing}`;
    const scrollTop = textarea.scrollTop;

    updateEditorContent(`${before}${wrapped}${after}`, () => {
      restoreTextAreaState(
        textarea,
        nextSelectionStart + opening.length,
        nextSelectionEnd + opening.length,
        scrollTop,
      );
    });
  };

  const handleAlignLeft = () => wrapAlignment('left');
  const handleAlignCenter = () => wrapAlignment('center');
  const handleAlignRight = () => wrapAlignment('right');
  const handleAlignJustify = () => wrapAlignment('justify');

  const handleInsertSeparator = () => {
    const selection = getSelectionInfo();
    if (!selection) return;
    const { textarea, start, end } = selection;
    const text = editorConteudo;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const separator = `${before.endsWith('\n') || before.length === 0 ? '' : '\n\n'}──────────────────────────────────────   ⋆✦⋆   ──────────────────────────────────────\n\n`;
    const scrollTop = textarea.scrollTop;

    updateEditorContent(`${before}${separator}${after}`, () => {
      restoreTextAreaState(textarea, start + separator.length, start + separator.length, scrollTop);
    });
  };

  const handleToggleBulletedList = () => {
    wrapLines(line => (line.trim() ? `- ${line}` : line));
  };

  const handleToggleNumberedList = () => {
    wrapLines((line, index) => (line.trim() ? `${index + 1}. ${line}` : line));
  };

  useEffect(() => {
    if (!campanhaId) return;
    Promise.resolve().then(() =>
      Promise.all([
        getRmCampanhaNpcs(campanhaId, universoId, mestreId),
        getRmCampanhaCriaturas(campanhaId, universoId, mestreId),
        getRmMissoesPorCampanha(campanhaId, universoId, mestreId),
      ]).then(([todosNpcs, todasCriaturas, todasMissoes]) => {
        setNpcs(todosNpcs);
        setCriaturas(todasCriaturas);
        setMissoes(todasMissoes);
      }),
    );
  }, [campanhaId, universoId, mestreId]);

  // Só-leitura: o vínculo Missão→Cena é gravado no array `cenasVinculadas`
  // da Missão (editado em MissaoForm) — a Cena não guarda seu próprio
  // `missoesRelacionadas` para não manter dois arrays em campos separados
  // que poderiam divergir (vincular pela Missão e a Cena não refletir, ou
  // vice-versa). `initialValues.id` só existe editando uma Cena já salva
  // (NovaCena sem edição não tem id ainda, então a lista fica vazia).
  const missoesVinculadas = missoes.filter(missao =>
    (missao.cenasVinculadas ?? []).includes(initialValues.id),
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CENA_SCHEMA}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, isSubmitting, setFieldValue }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Modal
              open={editorAberto}
              onClose={() => handleEditorClose(setFieldValue, editorConteudo)}
              closeAfterTransition
              slots={{ backdrop: Backdrop }}
              slotProps={{
                backdrop: {
                  timeout: 240,
                  sx: {
                    bgcolor: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(5px)',
                  },
                },
              }}
            >
              <Fade in={editorAberto} timeout={220}>
                <Box sx={narrationEditorModalSx} ref={editorRef}>
                  <Box sx={narrationEditorHeaderSx}>
                    <Box sx={narrationEditorHeaderTopSx}>
                      <Box>
                        <Typography component="h2" sx={narrationEditorTitleSx}>
                          Editor de Narração
                        </Typography>
                        <Typography sx={narrationEditorDescriptionSx}>
                          Edite o texto completo de narração da cena. As alterações são sincronizadas automaticamente com o campo de narração.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Button
                            variant={previewMode ? 'outlined' : 'contained'}
                            size="small"
                            onClick={() => setPreviewMode(false)}
                            sx={{
                              color: previewMode ? 'var(--text-secondary)' : 'var(--text-primary)',
                              borderColor: 'rgba(255,255,255,0.12)',
                              background: previewMode ? 'transparent' : 'rgba(255,255,255,0.04)',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.08)',
                              },
                            }}
                          >
                            Editor
                          </Button>
                          <Button
                            variant={previewMode ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => setPreviewMode(true)}
                            sx={{
                              color: previewMode ? 'var(--text-primary)' : 'var(--text-secondary)',
                              borderColor: 'rgba(255,255,255,0.12)',
                              background: previewMode ? 'rgba(255,255,255,0.08)' : 'transparent',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.08)',
                              },
                            }}
                          >
                            Visualizar
                          </Button>
                        </Box>
                      </Box>
                      <IconButton
                        type="button"
                        onClick={() => handleEditorClose(setFieldValue, editorConteudo)}
                        sx={{
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          width: 40,
                          height: 40,
                          borderRadius: '14px',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--color-accent)',
                          },
                        }}
                        aria-label="Fechar editor de narração"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Divider sx={narrationDividerSx} />
                    <Box sx={narrationToolbarSx}>
                      <Box sx={narrationToolbarGroupSx}>
                        <Tooltip title="Desfazer" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Desfazer"
                            onClick={handleUndo}
                          >
                            <UndoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Refazer" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Refazer"
                            onClick={handleRedo}
                          >
                            <RedoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={narrationToolbarGroupSx}>
                        <Tooltip title="Negrito" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Negrito"
                            onClick={handleToggleBold}
                          >
                            <FormatBoldIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Itálico" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Itálico"
                            onClick={handleToggleItalic}
                          >
                            <FormatItalicIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Sublinhado" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Sublinhado"
                            onClick={handleToggleUnderline}
                          >
                            <FormatUnderlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={narrationToolbarGroupSx}>
                        <Tooltip title="Alinhar à esquerda" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Alinhar à esquerda"
                            onClick={handleAlignLeft}
                          >
                            <FormatAlignLeftIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Centralizar" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Centralizar"
                            onClick={handleAlignCenter}
                          >
                            <FormatAlignCenterIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Alinhar à direita" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Alinhar à direita"
                            onClick={handleAlignRight}
                          >
                            <FormatAlignRightIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Justificar" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Justificar"
                            onClick={handleAlignJustify}
                          >
                            <FormatAlignJustifyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={narrationToolbarGroupSx}>
                        <Tooltip title="Lista" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Lista"
                            onClick={handleToggleBulletedList}
                          >
                            <FormatListBulletedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Lista numerada" arrow>
                          <IconButton
                            sx={narrationToolButtonSx}
                            type="button"
                            onMouseDown={handleToolbarMouseDown}
                            aria-label="Lista numerada"
                            onClick={handleToggleNumberedList}
                          >
                            <FormatListNumberedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={narrationToolbarGroupSx}>
                        <Tooltip title="Inserir separador" arrow>
                          <IconButton
                            sx={narrationSeparatorButtonSx}
                            type="button"
                            aria-label="Inserir separador"
                            onMouseDown={handleToolbarMouseDown}
                            onClick={handleInsertSeparator}
                          >
                            <HorizontalRuleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={narrationEditorAreaSx}>
                    {previewMode ? (
                      <Box
                        sx={{
                          flex: 1,
                          overflowY: 'auto',
                          px: { xs: 3.5, md: 4.5 },
                          py: { xs: 3, md: 4 },
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          lineHeight: 1.8,
                          '& strong': { fontWeight: 700 },
                          '& em': { fontStyle: 'italic' },
                          '& u': { textDecoration: 'underline' },
                          '& ul': { paddingLeft: 20, margin: '8px 0' },
                          '& li': { marginBottom: 6 },
                          '& p': { margin: '0 0 0.75rem' },
                        }}
                        dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editorConteudo) }}
                      />
                    ) : (
                      <Box sx={narrationTextareaWrapperSx}>
                        <TextField
                          value={editorConteudo}
                          onChange={event => updateEditorContent(event.target.value)}
                          multiline
                          minRows={14}
                          maxRows={30}
                          variant="outlined"
                          aria-label="Editor de narração completa"
                          inputRef={textAreaRef}
                          fullWidth
                          sx={{
                            ...narrationTextareaSx,
                            '& .MuiOutlinedInput-inputMultiline': {
                              minHeight: 360,
                              padding: 0,
                              overflow: 'visible',
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  <Box sx={narrationEditorFooterSx}>
                    <Box sx={narrationFooterTextSx}>
                      <Box sx={narrationFooterStatusDotSx} />
                      <Typography>Alterações sincronizadas automaticamente</Typography>
                    </Box>
                    <Typography sx={narrationFooterCountSx}>
                      {editorConteudo.length} caracteres
                    </Typography>
                  </Box>
                </Box>
              </Fade>
            </Modal>

            <Paper elevation={0} sx={{ ...sectionSx, mb: 1.5 }}>
              <SectionTitle>Informações Gerais</SectionTitle>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
                  gap: 3,
                  mt: 1.5,
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FastField name="titulo">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Título da Cena"
                        fullWidth
                        error={touched.titulo && Boolean(errors.titulo)}
                        helperText={touched.titulo && errors.titulo}
                        sx={inputSx}
                      />
                    )}
                  </FastField>

                  <Field name="estado">
                    {({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel
                          id={estadoLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Estado da Campanha
                        </InputLabel>
                        <Select
                          {...field}
                          labelId={estadoLabelId}
                          label="Estado da Campanha"
                          sx={selectSx}
                        >
                          {ESTADO_CENA_OPCOES.map(opcao => (
                            <MenuItem key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>

                  <FastField name="linkImagem">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Link da Imagem"
                        fullWidth
                        placeholder="https://..."
                        error={touched.linkImagem && Boolean(errors.linkImagem)}
                        helperText={touched.linkImagem && errors.linkImagem}
                        sx={inputSx}
                      />
                    )}
                  </FastField>
                </Box>

                <ImagePreviewPanel
                  src={values.linkImagem}
                  alt="Preview da cena"
                />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...sectionSx, mb: 1.5 }}>
              <SectionTitle>Narrativa</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <FastField name="objetivo">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Objetivo Principal"
                      fullWidth
                      multiline
                      rows={5}
                      error={touched.objetivo && Boolean(errors.objetivo)}
                      helperText={touched.objetivo && errors.objetivo}
                      sx={{
                        ...inputSx,
                        '& .MuiOutlinedInput-inputMultiline': {
                          maxHeight: 180,
                          overflow: 'auto',
                        },
                      }}
                    />
                  )}
                </FastField>

                <FastField name="resumo">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Resumo"
                      fullWidth
                      multiline
                      rows={5}
                      error={touched.resumo && Boolean(errors.resumo)}
                      helperText={touched.resumo && errors.resumo}
                      sx={{
                        ...inputSx,
                        '& .MuiOutlinedInput-inputMultiline': {
                          maxHeight: 180,
                          overflow: 'auto',
                        },
                      }}
                    />
                  )}
                </FastField>

                <FastField name="descricaoNarracao">
                  {({ field }) => (
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        {...field}
                        label="Descrição / Texto de Narração"
                        fullWidth
                        multiline
                        rows={7}
                        error={
                          touched.descricaoNarracao &&
                          Boolean(errors.descricaoNarracao)
                        }
                        helperText={
                          touched.descricaoNarracao && errors.descricaoNarracao
                        }
                        sx={{
                          ...inputSx,
                          '& .MuiInputBase-root': {
                            minHeight: 260,
                          },
                          '& .MuiOutlinedInput-inputMultiline': {
                            maxHeight: 260,
                            overflow: 'auto',
                            paddingBottom: '52px',
                          },
                        }}
                      />
                      <Tooltip title="Editar/visualizar narração" arrow>
                        <IconButton
                          type="button"
                          onClick={() => abrirEditorNarracao(values.descricaoNarracao)}
                          sx={editorTriggerSx}
                          aria-label="Editar ou visualizar narração"
                        >
                          <RemoveRedEyeOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Pontos Importantes para a Narração</SectionTitle>
              <FieldArray name="pontosImportantes">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    {values.pontosImportantes.map((_, idx) => (
                      <Box
                        key={pontosKeys.keys[idx] ?? idx}
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <FastField name={`pontosImportantes.${idx}`}>
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              sx={inputSx}
                            />
                          )}
                        </FastField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            pontosKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover ponto importante"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        pontosKeys.addKey();
                        push('');
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar ponto importante
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Consequências</SectionTitle>
              <FieldArray name="consequencias">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    {values.consequencias.map((_, idx) => (
                      <Box
                        key={consequenciasKeys.keys[idx] ?? idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: '220px 1fr auto',
                          },
                          gap: 1,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Field name={`consequencias.${idx}.tipo`}>
                          {({ field }) => (
                            <FormControl size="small" fullWidth>
                              <Select
                                {...field}
                                sx={selectSx}
                              >
                                {TIPO_CONSEQUENCIA_OPCOES.map(opcao => (
                                  <MenuItem
                                    key={opcao.value}
                                    value={opcao.value}
                                  >
                                    {opcao.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </Field>
                        <FastField name={`consequencias.${idx}.texto`}>
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              placeholder="Descreva a consequência"
                              error={Boolean(
                                touched.consequencias?.[idx]?.texto &&
                                errors.consequencias?.[idx]?.texto,
                              )}
                              helperText={
                                touched.consequencias?.[idx]?.texto &&
                                errors.consequencias?.[idx]?.texto
                              }
                              sx={inputSx}
                            />
                          )}
                        </FastField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            consequenciasKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover consequência"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        consequenciasKeys.addKey();
                        push({ ...CONSEQUENCIA_INICIAL });
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar consequência
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>
                Se os jogadores fizerem algo inesperado...
              </SectionTitle>
              <Box sx={{ mt: 1.5 }}>
                <FastField name="improvisacaoNotas">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Notas de improviso"
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Caminhos alternativos, reações de NPCs, ganchos improvisados..."
                      error={
                        touched.improvisacaoNotas &&
                        Boolean(errors.improvisacaoNotas)
                      }
                      helperText={
                        touched.improvisacaoNotas && errors.improvisacaoNotas
                      }
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...sectionSx, mb: 1.5 }}>
              <SectionTitle>NPCs, Criaturas e Missões</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                {npcs.length > 0 ? (
                  <Field name="npcsParticipantes">
                    {({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel
                          id={npcsLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          NPCs participantes
                        </InputLabel>
                        <Select
                          {...field}
                          multiple
                          labelId={npcsLabelId}
                          label="NPCs participantes"
                          sx={selectSx}
                          renderValue={selecionados => (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {selecionados.map(id => (
                                <Chip
                                  key={id}
                                  size="small"
                                  label={
                                    npcs.find(n => n.id === id)?.nome ?? id
                                  }
                                />
                              ))}
                            </Box>
                          )}
                        >
                          {npcs.map(npc => (
                            <MenuItem key={npc.id} value={npc.id}>
                              {npc.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>
                ) : (
                  <PlaceholderModulo>
                    Nenhum NPC cadastrado nesta campanha ainda — crie um no
                    módulo de NPCs para vinculá-lo a cenas.
                  </PlaceholderModulo>
                )}

                {criaturas.length > 0 ? (
                  <Field name="criaturasEnvolvidas">
                    {({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel
                          id={criaturasLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Criaturas envolvidas
                        </InputLabel>
                        <Select
                          {...field}
                          multiple
                          labelId={criaturasLabelId}
                          label="Criaturas envolvidas"
                          sx={selectSx}
                          renderValue={selecionados => (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {selecionados.map(id => (
                                <Chip
                                  key={id}
                                  size="small"
                                  label={
                                    criaturas.find(c => c.id === id)?.nome ?? id
                                  }
                                />
                              ))}
                            </Box>
                          )}
                        >
                          {criaturas.map(criatura => (
                            <MenuItem key={criatura.id} value={criatura.id}>
                              {criatura.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>
                ) : (
                  <PlaceholderModulo>
                    Nenhuma criatura cadastrada nesta campanha ainda — crie uma
                    no módulo de Criaturas para vinculá-la a cenas.
                  </PlaceholderModulo>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--text-secondary)',
                      display: 'block',
                      mb: 0.75,
                    }}
                  >
                    Missões que avançam nesta cena
                  </Typography>
                  {missoesVinculadas.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {missoesVinculadas.map(missao => (
                        <Chip
                          key={missao.id}
                          size="small"
                          label={missao.titulo}
                          sx={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--color-accent)',
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <PlaceholderModulo>
                      Nenhuma missão vinculada a esta cena ainda — vincule pelo
                      campo &quot;Cenas vinculadas&quot; ao editar a missão no
                      módulo de Missões.
                    </PlaceholderModulo>
                  )}
                </Box>
              </Box>
            </Paper>

            <Box sx={{ position: 'sticky', bottom: 0, pt: 2, mt: 2, background: 'linear-gradient(180deg, rgba(6,10,18,0), rgba(6,10,18,0.95))', borderTop: '1px solid rgba(255,255,255,0.04)', zIndex: 6 }}>
              <FormActions
                onCancelar={onCancelar}
                isSubmitting={isSubmitting}
                labelSalvar={labelSalvar}
              />
            </Box>
          </Box>
        </Form>
      )}
    </Formik>
  );
};

CenaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string,
  campanhaId: PropTypes.string,
  universoId: PropTypes.string,
  mestreId: PropTypes.string,
};

export default CenaForm;
