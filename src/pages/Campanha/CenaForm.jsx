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
import Alert from '@mui/material/Alert';
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
import Popover from '@mui/material/Popover';
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

// Helpers visuais para Consequências
const getConsequenciaVariant = tipo => {
  if (!tipo) return 'other';
  const t = tipo.toString().toLowerCase();
  if (t.includes('sucesso') || t.includes('success') || t.includes('salvo')) return 'success';
  if (t.includes('neutro') || t.includes('neutral')) return 'neutral';
  if (t.includes('falha') || t.includes('morto') || t.includes('fail') || t.includes('perd')) return 'fail';
  return 'other';
};

const consequenceBadgeSx = variant => {
  const map = {
    success: {
      bg: 'rgba(34,197,94,0.08)',
      border: 'rgba(34,197,94,0.16)',
      color: '#22c55e',
      glow: '0 6px 18px rgba(34,197,94,0.08)',
    },
    neutral: {
      bg: 'rgba(234,179,8,0.06)',
      border: 'rgba(234,179,8,0.16)',
      color: '#f59e0b',
      glow: '0 6px 18px rgba(234,179,8,0.06)',
    },
    fail: {
      bg: 'rgba(220,38,38,0.06)',
      border: 'rgba(220,38,38,0.16)',
      color: '#dc2626',
      glow: '0 6px 18px rgba(220,38,38,0.06)',
    },
    other: {
      bg: 'rgba(255,255,255,0.02)',
      border: 'rgba(255,255,255,0.06)',
      color: '#e5e7eb',
      glow: '0 6px 18px rgba(255,255,255,0.03)',
    },
  };
  return map[variant] || map.other;
};

const ConsequenceIcon = ({ variant, customUrl }) => {
  const v = variant || 'other';
  const color = consequenceBadgeSx(v).color;
  if (customUrl) {
    return (
      <Box component="img" src={customUrl} alt="icon" sx={{ width: 54, height: 54, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }} />
    );
  }
  if (v === 'success') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} />
      </svg>
    );
  }
  if (v === 'neutral') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 10L12 3L21 10V20H3V10Z" fill={color} />
      </svg>
    );
  }
  if (v === 'fail') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8 2 5 5 5 9C5 14 12 22 12 22C12 22 19 14 19 9C19 5 16 2 12 2Z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill={consequenceBadgeSx('other').color} />
    </svg>
  );
};

ConsequenceIcon.propTypes = {
  variant: PropTypes.string,
  customUrl: PropTypes.string,
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
  const [openTipoIndex, setOpenTipoIndex] = useState(null);
  const [anchorTipoEl, setAnchorTipoEl] = useState(null);
  const [openIconPickerIndex, setOpenIconPickerIndex] = useState(null);
  const [anchorIconPickerEl, setAnchorIconPickerEl] = useState(null);
  const [selectedIcons, setSelectedIcons] = useState({});
  const [iconPickerCategory, setIconPickerCategory] = useState(null);
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
      {({ values, errors, touched, isSubmitting, status, setFieldValue }) => (
        <Form>
          {status?.submitError && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: '12px' }}
              variant="filled"
            >
              {status.submitError}
            </Alert>
          )}
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
                      onChange={event => {
                        setFieldValue('resumo', event.target.value);
                      }}
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
                        sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}
                      >
                        <Box sx={{ width: 6, borderRadius: 1, alignSelf: 'stretch', background: 'linear-gradient(180deg, var(--color-primary), rgba(255,215,130,0.06))' }} />
                        <FastField name={`pontosImportantes.${idx}`}>
                          {({ field }) => (
                            <TextField
                              name={field.name}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              fullWidth
                              size="small"
                              multiline
                              rows={4}
                              sx={{
                                ...inputSx,
                                minWidth: 0,
                                flexGrow: 1,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  background: 'var(--bg-card)',
                                  border: '1px solid rgba(255,215,130,0.03)',
                                  padding: '2px',
                                  boxShadow: 'inset 0 -6px 18px rgba(0,0,0,0.45)',
                                },
                                '& .MuiOutlinedInput-inputMultiline': {
                                  maxHeight: '5.2rem',
                                  overflowY: 'auto',
                                  whiteSpace: 'normal',
                                  padding: '10px 12px',
                                  lineHeight: '1.2rem',
                                  color: 'var(--text-primary)',
                                  fontWeight: 500,
                                  fontSize: '0.95rem',
                                },
                                '& .MuiOutlinedInput-root.Mui-focused': {
                                  borderColor: 'rgba(255,183,77,0.14)',
                                  boxShadow: '0 8px 26px rgba(11,14,22,0.6), 0 0 0 3px rgba(196,58,47,0.02) inset',
                                },
                                '& .MuiOutlinedInput-inputMultiline::-webkit-scrollbar': { width: '8px' },
                                '& .MuiOutlinedInput-inputMultiline::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '8px' },
                                '& .MuiOutlinedInput-inputMultiline::-webkit-scrollbar-thumb': { background: 'linear-gradient(180deg, rgba(196,58,47,0.14), rgba(255,183,77,0.12))', borderRadius: '8px' },
                                '& .MuiOutlinedInput-inputMultiline::-webkit-scrollbar-thumb:hover': { background: 'linear-gradient(180deg, rgba(196,58,47,0.24), rgba(255,183,77,0.18))' },
                              }}
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
                            flexShrink: 0,
                            width: 36,
                            height: 36,
                            borderRadius: 1,
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.02)',
                            transition: 'all 160ms ease',
                            '&:hover': { background: 'rgba(255,255,255,0.04)', color: '#ef4444', transform: 'translateY(-2px)' },
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
                        background: 'transparent',
                        padding: '6px 10px',
                        borderRadius: 1,
                        transition: 'all 160ms ease',
                        '&:hover': { background: 'rgba(255,255,255,0.03)', transform: 'translateY(-1px)' },
                      }}
                    >
                      + Adicionar ponto importante
                    </Button>
                    <Popover
                      open={openIconPickerIndex !== null && Boolean(anchorIconPickerEl)}
                      anchorEl={anchorIconPickerEl}
                      onClose={() => {
                        setOpenIconPickerIndex(null);
                        setAnchorIconPickerEl(null);
                      }}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      sx={{ zIndex: 1600 }}
                    >
                      <Box sx={{ p: 2, width: 420, background: 'rgba(7,10,17,0.98)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 30px 80px rgba(0,0,0,0.7)' }}>
                        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 0.5 }}>Escolha um ícone</Typography>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem', mb: 1.25 }}>Selecione um ícone visual para essa consequência (somente visual, não altera dados no backend).</Typography>
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                            {(
                              iconPickerCategory === 'success'
                                ? [
                                    'https://i.imgur.com/BTi3kGm.png','https://i.imgur.com/rzFones.png','https://i.imgur.com/FtpIayF.png','https://i.imgur.com/6yNMP8h.png','https://i.imgur.com/uwQTa11.png','https://i.imgur.com/jES3ue7.png','https://i.imgur.com/OM8fW9O.png'
                                  ]
                                : iconPickerCategory === 'neutral'
                                  ? [
                                    'https://i.imgur.com/oKzjp6r.png','https://i.imgur.com/q3TtmwH.png','https://i.imgur.com/tom2l0b.png','https://i.imgur.com/lupJCIC.png','https://i.imgur.com/EO9TfsF.png','https://i.imgur.com/IYlqQfk.png','https://i.imgur.com/IePogoT.png'
                                  ]
                                  : iconPickerCategory === 'fail'
                                    ? [
                                      'https://i.imgur.com/YXPtoxx.png','https://i.imgur.com/I3Aawlq.png','https://i.imgur.com/0qu1421.png','https://i.imgur.com/10xOiVI.png','https://i.imgur.com/Azh2I6R.png','https://i.imgur.com/U6Thr45.png','https://i.imgur.com/ViQ63ra.png'
                                    ]
                                    : [
                                      'https://i.imgur.com/75JqxFh.png','https://i.imgur.com/nM5A3Re.png','https://i.imgur.com/3NVTzJH.png','https://i.imgur.com/vWL7aV6.png','https://i.imgur.com/EDGnH5y.png','https://i.imgur.com/eiLQiq1.png','https://i.imgur.com/G1hxvG3.png'
                                    ]
                            ).map(url => (
                              <Box
                                key={url}
                                component="button"
                                onClick={() => {
                                  setSelectedIcons(prev => ({ ...prev, [openIconPickerIndex]: url }));
                                  if (typeof setFieldValue === 'function' && openIconPickerIndex !== null) {
                                    setFieldValue(`consequencias.${openIconPickerIndex}.icone`, url);
                                  }
                                  setOpenIconPickerIndex(null);
                                  setAnchorIconPickerEl(null);
                                }}
                                sx={{ p: 0.5, borderRadius: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                              >
                                <Box component="img" src={url} alt="icon" sx={{ width: 44, height: 44, objectFit: 'contain' }} />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </Popover>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 2, background: 'rgba(196,58,47,0.95)', boxShadow: '0 6px 18px rgba(196,58,47,0.12)' }} />
                  <SectionTitle sx={{ color: 'rgba(196,58,47,0.98)' }}>Consequências</SectionTitle>
                </Box>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.94rem' }}>
                  Defina as consequências narrativas das escolhas feitas pelos jogadores neste nó.
                </Typography>
              </Box>
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
                    {values.consequencias.map((_, idx) => {
                      const tipoPath = `consequencias.${idx}.tipo`;
                      const textoPath = `consequencias.${idx}.texto`;
                      const tipoVal = values.consequencias?.[idx]?.tipo;
                      const variant = getConsequenciaVariant(tipoVal);
                      const badge = consequenceBadgeSx(variant);

                      return (
                        <Box
                          key={consequenciasKeys.keys[idx] ?? idx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: { xs: 1.25, md: 1.75 },
                            background: 'rgba(6,8,12,0.6)',
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 48,
                              height: 48,
                              borderRadius: 1.5,
                              background: badge.bg,
                              border: `1px solid ${badge.border}`,
                              boxShadow: badge.glow,
                            }}
                          >
                            <ConsequenceIcon variant={variant} customUrl={values.consequencias?.[idx]?.icone || selectedIcons[idx]} />
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0, flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FastField name={tipoPath}>
                                {({ field }) => (
                                  <Box
                                        component="span"
                                        role="button"
                                        tabIndex={0}
                                        onClick={e => {
                                          setOpenTipoIndex(idx);
                                          setAnchorTipoEl(e.currentTarget);
                                        }}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            setOpenTipoIndex(idx);
                                            setAnchorTipoEl(e.currentTarget);
                                          }
                                        }}
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          px: 1.2,
                                          py: 0.5,
                                          borderRadius: '10px',
                                          fontWeight: 800,
                                          fontSize: '0.78rem',
                                          letterSpacing: '0.06em',
                                          color: badge.color,
                                          background: 'rgba(255,255,255,0.02)',
                                          border: `1px solid ${badge.border}`,
                                          cursor: 'pointer',
                                          transition: 'all 160ms ease',
                                          '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
                                          },
                                        }}
                                      >
                                        {String(field.value || 'OUTRO').toUpperCase()}
                                      </Box>
                                )}
                              </FastField>
                              <Box sx={{ color: 'var(--text-secondary)', ml: 0.5 }}>{'›'}</Box>
                            </Box>

                            <FastField name={textoPath}>
                              {({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  size="small"
                                  placeholder="Descreva a consequência"
                                  multiline
                                  minRows={1}
                                  maxRows={4}
                                  error={Boolean(
                                    touched.consequencias?.[idx]?.texto &&
                                    errors.consequencias?.[idx]?.texto,
                                  )}
                                  helperText={
                                    touched.consequencias?.[idx]?.texto &&
                                    errors.consequencias?.[idx]?.texto
                                  }
                                  sx={{
                                    ...inputSx,
                                    '& .MuiOutlinedInput-input': {
                                      lineHeight: '1.4rem',
                                      maxHeight: '5.6rem',
                                      overflowY: 'auto',
                                    },
                                    '& .MuiOutlinedInput-input::-webkit-scrollbar': {
                                      width: 8,
                                    },
                                    '& .MuiOutlinedInput-input::-webkit-scrollbar-track': {
                                      background: 'rgba(255,255,255,0.04)',
                                    },
                                    '& .MuiOutlinedInput-input::-webkit-scrollbar-thumb': {
                                      background: 'rgba(196,58,47,0.4)',
                                      borderRadius: 999,
                                    },
                                    '& .MuiOutlinedInput-input::-webkit-scrollbar-thumb:hover': {
                                      background: 'rgba(196,58,47,0.65)',
                                    },
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'rgba(196,58,47,0.4) rgba(255,255,255,0.04)',
                                  }}
                                />
                              )}
                            </FastField>
                          </Box>

                          <IconButton
                            size="small"
                            onClick={() => {
                              consequenciasKeys.removeKey(idx);
                              remove(idx);
                            }}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'rgba(196,58,47,0.04)',
                              border: '1px solid rgba(196,58,47,0.08)',
                              '&:hover': {
                                background: 'rgba(196,58,47,0.12)',
                                boxShadow: '0 6px 20px rgba(196,58,47,0.14)',
                              },
                            }}
                            aria-label="Remover consequência"
                          >
                            <Box sx={{ color: '#ef4444', fontWeight: 800 }}>✕</Box>
                          </IconButton>
                        </Box>
                      );
                    })}
                    <Button
                      onClick={() => {
                        consequenciasKeys.addKey();
                        push({ ...CONSEQUENCIA_INICIAL });
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                        px: 2.5,
                        py: 1,
                        border: '1px dashed rgba(196,58,47,0.6)',
                        borderRadius: '12px',
                        background: 'transparent',
                        '&:hover': {
                          boxShadow: '0 8px 30px rgba(196,58,47,0.12)',
                          background: 'rgba(196,58,47,0.04)',
                        },
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                      }}
                    >
                      + Adicionar consequência
                    </Button>
                    <Popover
                      open={openTipoIndex !== null && Boolean(anchorTipoEl)}
                      anchorEl={anchorTipoEl}
                      onClose={() => {
                        setOpenTipoIndex(null);
                        setAnchorTipoEl(null);
                      }}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                      sx={{ zIndex: 1500 }}
                    >
                      <Box sx={{ p: 2, width: 320, background: 'rgba(7,10,17,0.98)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                        <Typography sx={{ color: 'rgba(196,58,47,0.98)', fontWeight: 800, mb: 0.5 }}>TIPO DE CONSEQUÊNCIA</Typography>
                        <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.85rem', mb: 1.25 }}>Escolha como essa consequência afeta a narrativa.</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
                            <Box component="button" onClick={() => { setFieldValue(`consequencias.${openTipoIndex}.tipo`, 'sucesso'); setOpenTipoIndex(null); setAnchorTipoEl(null); setIconPickerCategory('success'); setOpenIconPickerIndex(openTipoIndex); setAnchorIconPickerEl(anchorTipoEl); }} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 1.2, cursor: 'pointer' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}><ConsequenceIcon variant="success" /></Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#22c55e', textAlign: 'center' }}>SUCESSO</Typography>
                          </Box>
                          <Box component="button" onClick={() => { setFieldValue(`consequencias.${openTipoIndex}.tipo`, 'neutro'); setOpenTipoIndex(null); setAnchorTipoEl(null); setIconPickerCategory('neutral'); setOpenIconPickerIndex(openTipoIndex); setAnchorIconPickerEl(anchorTipoEl); }} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, background: 'rgba(234,179,8,0.03)', border: '1px solid rgba(234,179,8,0.12)', borderRadius: 1.2, cursor: 'pointer' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}><ConsequenceIcon variant="neutral" /></Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', textAlign: 'center' }}>NEUTRO</Typography>
                          </Box>
                          <Box component="button" onClick={() => { setFieldValue(`consequencias.${openTipoIndex}.tipo`, 'falha'); setOpenTipoIndex(null); setAnchorTipoEl(null); setIconPickerCategory('fail'); setOpenIconPickerIndex(openTipoIndex); setAnchorIconPickerEl(anchorTipoEl); }} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)', borderRadius: 1.2, cursor: 'pointer' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}><ConsequenceIcon variant="fail" /></Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', textAlign: 'center' }}>FALHA</Typography>
                          </Box>
                          <Box component="button" onClick={() => { setFieldValue(`consequencias.${openTipoIndex}.tipo`, 'outro'); setOpenTipoIndex(null); setAnchorTipoEl(null); setIconPickerCategory('other'); setOpenIconPickerIndex(openTipoIndex); setAnchorIconPickerEl(anchorTipoEl); }} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, p: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 1.2, cursor: 'pointer' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'center' }}><ConsequenceIcon variant="other" /></Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(200,200,200,0.95)', textAlign: 'center' }}>OUTRO</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Popover>
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
