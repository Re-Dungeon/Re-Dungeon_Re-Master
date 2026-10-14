/* eslint-disable no-unused-vars */
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

const cardTextAreaSx = {
  ...inputSx,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  '& .MuiFormControl-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  '& .MuiInputBase-root': {
    flex: 1,
    minHeight: 200,
    height: '100%',
    background: 'rgba(4, 8, 14, 0.52)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
    alignItems: 'flex-start',
  },
  '& .MuiOutlinedInput-root': {
    ...inputSx['& .MuiOutlinedInput-root'],
    flex: 1,
    minHeight: 500,
    height: '100%',
  },
  '& .MuiOutlinedInput-inputMultiline': {
    flex: 1,
    fontSize: '14px',
    lineHeight: 1.5,
    textAlign: 'justify',
    color: 'var(--text-primary)',
    letterSpacing: '0.01em',
    padding: '12px 14px',
  },
  '& textarea': {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(196,58,47,0.45) rgba(255,255,255,0.04)',
  },
  '& textarea::-webkit-scrollbar': {
    width: 7,
  },
  '& textarea::-webkit-scrollbar-track': {
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
  },
  '& textarea::-webkit-scrollbar-thumb': {
    background: 'rgba(196,58,47,0.45)',
    borderRadius: 999,
  },
  '& textarea::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(196,58,47,0.7)',
  },
  '& .MuiInputLabel-root': {
    ...inputSx['& .MuiInputLabel-root'],
    fontSize: '0.9rem',
    transform: 'translate(14px, -9px) scale(0.85)',
  },
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: 1,
  },
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
      {({ values, errors, touched, isSubmitting, status, setFieldValue }) => {
        const fluxoCapitulos = [
          {
            nome: 'Capítulo I',
            cenas: [
              { titulo: 'A Chegada', ativo: true },
              { titulo: 'O Encontro', ativo: false },
              { titulo: 'A Floresta', ativo: false },
              { titulo: 'O Ataque', ativo: false },
            ],
          },
          {
            nome: 'Capítulo II',
            cenas: [
              { titulo: 'As Ruínas', ativo: false },
              { titulo: 'O Guardião', ativo: false },
              { titulo: 'A Revelação', ativo: false },
            ],
          },
        ];

        const cenasVinculadas = [
          { titulo: 'A Chegada', capitulo: 'Capítulo I' },
          { titulo: 'O Encontro', capitulo: 'Capítulo I' },
          { titulo: 'As Ruínas', capitulo: 'Capítulo II' },
        ];

        const cenaAtualLabel = values.titulo || 'Cena sem título';

        return (
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

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1fr) 330px' },
              gap: 3.5,
              alignItems: 'start',
              maxWidth: '100%',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                background: 'rgba(8, 12, 20, 0.82)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                p: 2,
                position: 'sticky',
                top: 16,
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
                display: 'none',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {fluxoCapitulos.map(capitulo => (
                  <Box key={capitulo.nome}>
                    <Typography
                      sx={{
                        color: 'var(--text-muted)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        mb: 1,
                      }}
                    >
                      {capitulo.nome}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                      {capitulo.cenas.map((cena, index) => (
                        <Button
                          key={`${capitulo.nome}-${cena.titulo}`}
                          type="button"
                          sx={{
                            justifyContent: 'flex-start',
                            gap: 1,
                            px: 1.25,
                            py: 0.85,
                            borderRadius: '12px',
                            textTransform: 'none',
                            background: cena.ativo || cenaAtualLabel === cena.titulo
                              ? 'rgba(196, 58, 47, 0.12)'
                              : 'rgba(255,255,255,0.02)',
                            border: cena.ativo || cenaAtualLabel === cena.titulo
                              ? '1px solid rgba(196, 58, 47, 0.24)'
                              : '1px solid rgba(255,255,255,0.04)',
                            color:
                              cena.ativo || cenaAtualLabel === cena.titulo
                                ? 'var(--text-primary)'
                                : 'var(--text-secondary)',
                            boxShadow:
                              cena.ativo || cenaAtualLabel === cena.titulo
                                ? 'inset 0 0 0 1px rgba(196,58,47,0.10)'
                                : 'none',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.04)',
                              borderColor: 'rgba(255,255,255,0.12)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background:
                                cena.ativo || cenaAtualLabel === cena.titulo
                                  ? 'var(--color-accent)'
                                  : 'rgba(255,255,255,0.2)',
                              boxShadow:
                                cena.ativo || cenaAtualLabel === cena.titulo
                                  ? '0 0 12px rgba(196,58,47,0.45)'
                                  : 'none',
                            }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ fontSize: '0.72rem', opacity: 0.8 }}>
                              {String(index + 1).padStart(2, '0')}
                            </Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>
                              {cena.titulo}
                            </Typography>
                          </Box>
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.25 }}>
              <Paper
                elevation={0}
                sx={{
                  background: 'rgba(9, 13, 21, 0.9)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px',
                  boxShadow: '0 22px 60px rgba(0, 0, 0, 0.28)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    minHeight: 320,
                    background: values.linkImagem
                      ? `linear-gradient(90deg, rgba(3,7,18,0.78) 0%, rgba(7,10,17,0.38) 26%, rgba(11,13,20,0.18) 48%, rgba(9,11,16,0.7) 100%), url(${values.linkImagem}) center/cover no-repeat`
                      : 'linear-gradient(135deg, rgba(21,30,42,0.95), rgba(19,12,17,0.95))',
                    p: { xs: 2.25, md: 3 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    borderRadius: '24px 24px 0 0',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.18)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(9,12,18,0.18) 0%, rgba(9,12,18,0.08) 25%, rgba(9,12,18,0.74) 100%)',
                      pointerEvents: 'none',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(circle at 20% 20%, rgba(188,147,255,0.18), transparent 28%), radial-gradient(circle at 75% 10%, rgba(22,163,74,0.10), transparent 25%)',
                      pointerEvents: 'none',
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'inline-flex',
                      alignSelf: 'flex-start',
                      px: 1.3,
                      py: 0.7,
                      borderRadius: '999px',
                      background: 'rgba(4, 9, 16, 0.54)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#dfe7f2',
                      fontSize: '0.72rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      mb: 1.75,
                      fontWeight: 800,
                      boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                    }}
                  >
                    CENA {String(Number(values.numeroCena || 4)).toString().padStart(2, '0')}
                  </Box>

                  <Typography
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: '#f6f7fb',
                      fontSize: { xs: '2.1rem', md: '3rem' },
                      fontWeight: 900,
                      letterSpacing: '-0.05em',
                      lineHeight: 1.02,
                      maxWidth: '80%',
                      textShadow: '0 6px 24px rgba(0,0,0,0.45)',
                    }}
                  >
                    {cenaAtualLabel}
                  </Typography>
                </Box>

                <Box sx={{ p: 3.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Cena atual
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        type="button"
                        onClick={onCancelar}
                        sx={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'var(--text-primary)',
                          px: 1.4,
                          py: 0.7,
                          borderRadius: '10px',
                          textTransform: 'none',
                        }}
                      >
                        Voltar ao Fluxograma
                      </Button>
                      <Button
                        type="button"
                        onClick={() => abrirEditorNarracao(values.descricaoNarracao)}
                        sx={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: 'var(--text-primary)',
                          px: 1.4,
                          py: 0.7,
                          borderRadius: '10px',
                          textTransform: 'none',
                        }}
                      >
                        Narrar Cena
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setEditorAberto(false)}
                        sx={{
                          background: 'rgba(196, 58, 47, 0.12)',
                          border: '1px solid rgba(196,58,47,0.2)',
                          color: 'var(--text-primary)',
                          px: 1.4,
                          py: 0.7,
                          borderRadius: '10px',
                          textTransform: 'none',
                        }}
                      >
                        Editar
                      </Button>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '110px 1fr', md: '120px 1fr' },
                      gap: 2,
                      alignItems: 'stretch',
                    }}
                  >
                    <FastField name="numeroCena">
                      {({ field, meta }) => (
                        <TextField
                          {...field}
                          type="number"
                          slotProps={{
                            htmlInput: {
                              min: 1,
                              max: 9999,
                              step: 1,
                            },
                          }}
                          label="Cena"
                          value={field.value ?? 1}
                          onChange={event => {
                            const nextValue = event.target.value === '' ? 1 : Number(event.target.value);
                            setFieldValue('numeroCena', Number.isNaN(nextValue) ? 1 : nextValue);
                          }}
                          error={meta.touched && Boolean(meta.error)}
                          helperText={meta.touched && meta.error}
                          sx={{
                            ...inputSx,
                            '& .MuiOutlinedInput-root': {
                              ...inputSx['& .MuiOutlinedInput-root'],
                              background: 'rgba(8, 12, 20, 0.7)',
                            },
                          }}
                        />
                      )}
                    </FastField>

                    <Field name="estado">
                      {({ field }) => {
                        const estadoAtual =
                          ESTADO_CENA_OPCOES.find(
                            opcao => opcao.value === field.value,
                          ) ?? ESTADO_CENA_OPCOES[0];

                        return (
                          <FormControl fullWidth>
                            <InputLabel
                              id={estadoLabelId}
                              sx={{
                                color: 'var(--text-secondary)',
                                '&.Mui-focused': { color: 'var(--color-accent)' },
                              }}
                            >
                              Estado da cena
                            </InputLabel>
                            <Select
                              {...field}
                              labelId={estadoLabelId}
                              label="Estado da cena"
                              value={field.value ?? 'nao_iniciado'}
                              sx={{
                                ...selectSx,
                                '& .MuiOutlinedInput-root': {
                                  borderWidth: 2,
                                  background:
                                    'linear-gradient(180deg, rgba(11,16,24,0.9), rgba(18,12,15,0.92))',
                                  boxShadow: `inset 0 0 0 1px ${estadoAtual.cor}33`,
                                },
                                '& .MuiSelect-select': {
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  fontWeight: 700,
                                },
                              }}
                              renderValue={selected => {
                                const opcaoSelecionada =
                                  ESTADO_CENA_OPCOES.find(
                                    item => item.value === selected,
                                  ) ?? ESTADO_CENA_OPCOES[0];

                                return (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.2,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: opcaoSelecionada.cor,
                                        boxShadow: `0 0 12px ${opcaoSelecionada.cor}`,
                                      }}
                                    />
                                    <Typography sx={{ fontWeight: 700 }}>
                                      {opcaoSelecionada.icone} {opcaoSelecionada.label}
                                    </Typography>
                                  </Box>
                                );
                              }}
                            >
                              {ESTADO_CENA_OPCOES.map(opcao => (
                                <MenuItem
                                  key={opcao.value}
                                  value={opcao.value}
                                  sx={{
                                    py: 1.25,
                                    px: 1.5,
                                    '&.Mui-selected': {
                                      background: 'rgba(196, 58, 47, 0.08)',
                                      color: 'var(--text-primary)',
                                    },
                                    '&:hover': {
                                      background: 'rgba(255,255,255,0.04)',
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1.2,
                                      width: '100%',
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        background: opcao.cor,
                                        boxShadow: `0 0 10px ${opcao.cor}`,
                                      }}
                                    />
                                    <Typography sx={{ fontWeight: 700 }}>
                                      {opcao.icone} {opcao.label}
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        );
                      }}
                    </Field>
                  </Box>

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

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2.5 }}>
                    <FastField name="linkImagem">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Link da imagem"
                          fullWidth
                          placeholder="https://..."
                          error={touched.linkImagem && Boolean(errors.linkImagem)}
                          helperText={touched.linkImagem && errors.linkImagem}
                          sx={inputSx}
                        />
                      )}
                    </FastField>
                  </Box>
                </Box>
              </Paper>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2.5,
                  alignItems: 'stretch',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    p: { xs: 1.75, md: 2.1 },
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background:
                      'linear-gradient(180deg, rgba(17,22,31,0.92), rgba(12,16,24,0.78))',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
                    minHeight: 270,
                    display: 'flex',
                    flexDirection: 'column',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 16,
                      bottom: 16,
                      width: '3px',
                      borderRadius: '999px',
                      background:
                        'linear-gradient(180deg, rgba(244,217,138,0.95), rgba(196,58,47,0.82))',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, pl: 2 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #f0d490, #c3803c)',
                        boxShadow: '0 0 18px rgba(244,217,138,0.45)',
                        display: 'inline-block',
                      }}
                    />
                    <Typography
                      sx={{
                        color: '#f4d98a',
                        fontSize: '0.72rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                      }}
                    >
                      Contexto
                    </Typography>
                  </Box>

                  <FastField name="resumo">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="O que aconteceu antes?"
                        fullWidth
                        multiline
                        minRows={5}
                        error={touched.resumo && Boolean(errors.resumo)}
                        helperText={touched.resumo && errors.resumo}
                        sx={cardTextAreaSx}
                      />
                    )}
                  </FastField>
                </Box>

                <Box
                  sx={{
                    p: { xs: 1.75, md: 2.1 },
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background:
                      'linear-gradient(180deg, rgba(17,22,31,0.92), rgba(12,16,24,0.78))',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
                    minHeight: 270,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #f0d490, #c3803c)',
                        boxShadow: '0 0 18px rgba(244,217,138,0.45)',
                        display: 'inline-block',
                      }}
                    />
                    <Typography
                      sx={{
                        color: '#f4d98a',
                        fontSize: '0.72rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                      }}
                    >
                      Objetivo
                    </Typography>
                  </Box>

                  <FastField name="objetivo">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="O que esta cena precisa cumprir?"
                        fullWidth
                        multiline
                        minRows={5}
                        error={touched.objetivo && Boolean(errors.objetivo)}
                        helperText={touched.objetivo && errors.objetivo}
                        sx={cardTextAreaSx}
                      />
                    )}
                  </FastField>
                </Box>

                <Box
                  sx={{
                    p: { xs: 1.75, md: 2.1 },
                    borderRadius: '18px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background:
                      'linear-gradient(180deg, rgba(17,22,31,0.92), rgba(12,16,24,0.78))',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
                    minHeight: 270,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: 'linear-gradient(180deg, #f0d490, #c3803c)',
                        boxShadow: '0 0 18px rgba(244,217,138,0.45)',
                        display: 'inline-block',
                      }}
                    />
                    <Typography
                      sx={{
                        color: '#f4d98a',
                        fontSize: '0.72rem',
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                      }}
                    >
                      Estado inicial
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 1.3, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <FastField name="localCena">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Local"
                          fullWidth
                          size="small"
                          sx={inputSx}
                        />
                      )}
                    </FastField>

                    <FastField name="horarioCena">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Horário"
                          fullWidth
                          size="small"
                          sx={inputSx}
                        />
                      )}
                    </FastField>

                    <FastField name="climaCena">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Clima"
                          fullWidth
                          size="small"
                          sx={inputSx}
                        />
                      )}
                    </FastField>

                    <FastField name="situacaoCena">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Situação"
                          fullWidth
                          size="small"
                          sx={inputSx}
                        />
                      )}
                    </FastField>
                  </Box>

                  <FastField name="informacaoJogadores">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Informação dos jogadores"
                        fullWidth
                        multiline
                        minRows={5}
                        sx={{
                          ...inputSx,
                          mt: 1.25,
                          '& .MuiInputBase-root': {
                            background: 'rgba(4, 8, 14, 0.52)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
                          },
                        }}
                      />
                    )}
                  </FastField>
                </Box>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  background: 'rgba(8, 12, 20, 0.82)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  p: 3,
                }}
              >
                <Typography
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    mb: 2,
                  }}
                >
                  Pontos importantes
                </Typography>

                <FieldArray name="pontosImportantes">
                  {({ push, remove }) => (
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Button
                        type="button"
                        onClick={() => {
                          push('');
                          pontosKeys.addKey();
                        }}
                        sx={{
                          alignSelf: 'flex-start',
                          color: 'var(--text-primary)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.02)',
                          px: 1.4,
                          py: 0.7,
                          textTransform: 'none',
                        }}
                      >
                        + Adicionar ponto importante
                      </Button>

                      {values.pontosImportantes?.map((ponto, index) => (
                        <Box
                          key={pontosKeys.keys[index] ?? index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            p: 1.25,
                          }}
                        >
                          <Field name={`pontosImportantes.${index}`}>
                            {({ field }) => (
                              <TextField
                                {...field}
                                aria-label={`Ponto importante ${index + 1}`}
                                placeholder="Descreva um ponto importante"
                                fullWidth
                                sx={inputSx}
                              />
                            )}
                          </Field>
                          <IconButton
                            type="button"
                            aria-label="Remover ponto importante"
                            onClick={() => {
                              pontosKeys.removeKey(index);
                              remove(index);
                            }}
                            sx={{
                              color: 'var(--text-secondary)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '10px',
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </FieldArray>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  background: 'rgba(8, 12, 20, 0.82)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  p: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Typography
                    sx={{
                      color: 'var(--text-primary)',
                      fontSize: '0.76rem',
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Narração
                  </Typography>

                  <Button
                    type="button"
                    onClick={() => abrirEditorNarracao(values.descricaoNarracao)}
                    sx={{
                      color: 'var(--text-primary)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.02)',
                      px: 1.25,
                      py: 0.7,
                      textTransform: 'none',
                    }}
                  >
                    Abrir editor
                  </Button>
                </Box>

                <FastField name="descricaoNarracao">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Descrição / texto de narração"
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
                          minHeight: 240,
                        },
                      }}
                    />
                  )}
                </FastField>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  background: 'rgba(8, 12, 20, 0.82)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  p: 2.5,
                }}
              >
                <Typography
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    mb: 2,
                  }}
                >
                  Consequências
                </Typography>

                <FieldArray name="consequencias">
                  {({ push, remove }) => (
                    <Box sx={{ display: 'grid', gap: 1.5 }}>
                      <Button
                        type="button"
                        onClick={() => {
                          push({ ...CONSEQUENCIA_INICIAL });
                          consequenciasKeys.addKey();
                        }}
                        sx={{
                          alignSelf: 'flex-start',
                          color: 'var(--text-primary)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.02)',
                          px: 1.4,
                          py: 0.7,
                          textTransform: 'none',
                        }}
                      >
                        + Adicionar consequência
                      </Button>

                      {values.consequencias?.map((consequencia, index) => (
                        <Box
                          key={consequenciasKeys.keys[index] ?? index}
                          sx={{ display: 'grid', gap: 1, background: 'rgba(255,255,255,0.02)', borderRadius: '12px', p: 1.25 }}
                        >
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Field name={`consequencias.${index}.tipo`}>
                              {({ field }) => (
                                <FormControl fullWidth size="small">
                                  <InputLabel id={`${idPrefix}-consequencia-tipo-${index}`} sx={{ color: 'var(--text-secondary)' }}>
                                    Tipo
                                  </InputLabel>
                                  <Select
                                    {...field}
                                    labelId={`${idPrefix}-consequencia-tipo-${index}`}
                                    label="Tipo"
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
                            <IconButton
                              type="button"
                              aria-label="Remover consequência"
                              onClick={() => {
                                consequenciasKeys.removeKey(index);
                                remove(index);
                              }}
                              sx={{ color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          <Field name={`consequencias.${index}.texto`}>
                            {({ field }) => (
                              <TextField
                                {...field}
                                placeholder="Descreva a consequência"
                                fullWidth
                                sx={inputSx}
                              />
                            )}
                          </Field>
                        </Box>
                      ))}
                    </Box>
                  )}
                </FieldArray>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  background: 'rgba(8, 12, 20, 0.82)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '20px',
                  p: 2.5,
                }}
              >
                <Typography
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '0.76rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    mb: 2,
                  }}
                >
                  Cenas vinculadas
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  {cenasVinculadas.map(cena => (
                    <Box
                      key={`${cena.titulo}-${cena.capitulo}`}
                      sx={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px',
                        p: 1.4,
                      }}
                    >
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {cena.titulo}
                      </Typography>
                      <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {cena.capitulo}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                width: '100%',
                maxWidth: 330,
                ml: 'auto',
                justifySelf: 'end',
                alignItems: 'stretch',
                position: 'relative',
                zIndex: 0,
                overflow: 'visible',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  background:
                    'linear-gradient(180deg, rgba(12,18,28,0.94), rgba(9,13,21,0.9))',
                  border: '1px solid rgba(148,163,184,0.16)',
                  borderRadius: '20px',
                  p: 2,
                  position: 'relative',
                  width: '100%',
                  maxWidth: 330,
                  ml: 'auto',
                  zIndex: 1,
                  alignSelf: 'flex-start',
                  overflow: 'visible',
                  boxShadow:
                    '0 16px 34px rgba(2,6,23,0.42), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <Typography
                  sx={{
                    color: '#dfe7f2',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    mb: 1.75,
                    fontWeight: 800,
                    opacity: 0.9,
                  }}
                >
                  Informações da cena
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  <Box
                    sx={{
                      background: 'linear-gradient(180deg, rgba(148,163,184,0.05), rgba(15,23,42,0.26))',
                      border: '1px solid rgba(148,163,184,0.09)',
                      borderRadius: '12px',
                      p: 1.4,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    }}
                  >
                    <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Estado
                    </Typography>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, mt: 0.6, fontSize: '1.06rem' }}>
                      {ESTADO_CENA_OPCOES.find(item => item.value === values.estado)?.label || values.estado}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      background: 'linear-gradient(180deg, rgba(148,163,184,0.05), rgba(15,23,42,0.26))',
                      border: '1px solid rgba(148,163,184,0.09)',
                      borderRadius: '12px',
                      p: 1.4,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    }}
                  >
                    <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      NPCs
                    </Typography>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, mt: 0.6, fontSize: '1.06rem' }}>
                      {values.npcsParticipantes?.length || 0} vinculados
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      background: 'linear-gradient(180deg, rgba(148,163,184,0.05), rgba(15,23,42,0.26))',
                      border: '1px solid rgba(148,163,184,0.09)',
                      borderRadius: '12px',
                      p: 1.4,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    }}
                  >
                    <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Criaturas
                    </Typography>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, mt: 0.6, fontSize: '1.06rem' }}>
                      {values.criaturasEnvolvidas?.length || 0} envolvidas
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  background:
                    'linear-gradient(180deg, rgba(12,18,28,0.94), rgba(9,13,21,0.9))',
                  border: '1px solid rgba(148,163,184,0.16)',
                  borderRadius: '20px',
                  p: 2.75,
                  position: 'relative',
                  zIndex: 1,
                  alignSelf: 'flex-start',
                  overflow: 'visible',
                  boxShadow:
                    '0 16px 34px rgba(2,6,23,0.42), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <Typography
                  sx={{
                    color: '#dfe7f2',
                    fontSize: '0.7rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    mb: 1.5,
                    fontWeight: 800,
                    opacity: 0.9,
                  }}
                >
                  Elementos da cena
                </Typography>

                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  <Typography
                    sx={{
                      color: '#f4d98a',
                      fontSize: '0.7rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      mb: 0.5,
                      fontWeight: 700,
                    }}
                  >
                    Missões que avançam nesta cena
                  </Typography>
                  {missoesVinculadas.length > 0 ? (
                    <Box sx={{ display: 'grid', gap: 1 }}>
                      {missoesVinculadas.map(missao => (
                        <Box
                          key={missao.id}
                          sx={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '12px',
                            p: 1.25,
                          }}
                        >
                          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                            {missao.titulo}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <PlaceholderModulo>
                      Nenhuma missão vinculada a esta cena ainda.
                    </PlaceholderModulo>
                  )}

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
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selecionados.map(id => (
                                  <Chip
                                    key={id}
                                    size="small"
                                    label={npcs.find(n => n.id === id)?.nome ?? id}
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
                      Nenhum NPC cadastrado nesta campanha ainda.
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
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selecionados.map(id => (
                                  <Chip
                                    key={id}
                                    size="small"
                                    label={criaturas.find(c => c.id === id)?.nome ?? id}
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
                      Nenhuma criatura cadastrada nesta campanha ainda.
                    </PlaceholderModulo>
                  )}

                  <FastField name="improvisacaoNotas">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Notas de improviso"
                        fullWidth
                        multiline
                        rows={3}
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
            </Box>
          </Box>

          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'linear-gradient(180deg, rgba(6,10,18,0), rgba(6,10,18,0.95))',
            }}
          >
            <FormActions
              onCancelar={onCancelar}
              isSubmitting={isSubmitting}
              labelSalvar={labelSalvar}
            />
          </Box>

          <Modal
            open={editorAberto}
            onClose={() => fecharEditorNarracao(setFieldValue, values.descricaoNarracao)}
            closeAfterTransition
            slots={{ backdrop: Backdrop }}
            slotProps={{
              backdrop: {
                timeout: 200,
                sx: {
                  background: 'rgba(2, 6, 12, 0.75)',
                  backdropFilter: 'blur(6px)',
                },
              },
            }}
          >
            <Fade in={editorAberto} timeout={200}>
              <Box sx={narrationEditorModalSx}>
                <Box sx={narrationEditorHeaderSx}>
                  <Box sx={narrationEditorHeaderTopSx}>
                    <Box>
                      <Typography
                        sx={{
                          color: '#f4d98a',
                          fontWeight: 800,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          fontSize: '0.72rem',
                          mb: 0.8,
                        }}
                      >
                        Modo de foco
                      </Typography>
                      <Typography sx={narrationEditorTitleSx}>Editor de narração</Typography>
                    </Box>

                    <IconButton
                      type="button"
                      aria-label="Fechar editor de narração"
                      onClick={() => fecharEditorNarracao(setFieldValue, values.descricaoNarracao)}
                      sx={{
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <Typography sx={narrationEditorDescriptionSx}>
                    Ajuste a narrativa da cena e volte para a edição da cena quando terminar.
                  </Typography>
                </Box>

                <Divider sx={narrationDividerSx} />

                <Box sx={narrationToolbarSx} onMouseDown={handleToolbarMouseDown}>
                  <Box sx={narrationToolbarGroupSx}>
                    <Tooltip title="Negrito">
                      <Button type="button" onClick={handleToggleBold} sx={narrationToolButtonSx}>
                        <FormatBoldIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Itálico">
                      <Button type="button" onClick={handleToggleItalic} sx={narrationToolButtonSx}>
                        <FormatItalicIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Sublinhado">
                      <Button type="button" onClick={handleToggleUnderline} sx={narrationToolButtonSx}>
                        <FormatUnderlinedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>

                  <Box sx={narrationToolbarGroupSx}>
                    <Tooltip title="Lista com marcadores">
                      <Button type="button" onClick={handleToggleBulletedList} sx={narrationToolButtonSx}>
                        <FormatListBulletedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Lista numerada">
                      <Button type="button" onClick={handleToggleNumberedList} sx={narrationToolButtonSx}>
                        <FormatListNumberedIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>

                  <Box sx={narrationToolbarGroupSx}>
                    <Tooltip title="Alinhamento à esquerda">
                      <Button type="button" onClick={handleAlignLeft} sx={narrationToolButtonSx}>
                        <FormatAlignLeftIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Alinhamento centralizado">
                      <Button type="button" onClick={handleAlignCenter} sx={narrationToolButtonSx}>
                        <FormatAlignCenterIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Alinhamento à direita">
                      <Button type="button" onClick={handleAlignRight} sx={narrationToolButtonSx}>
                        <FormatAlignRightIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Justificar">
                      <Button type="button" onClick={handleAlignJustify} sx={narrationToolButtonSx}>
                        <FormatAlignJustifyIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>

                  <Box sx={narrationToolbarGroupSx}>
                    <Tooltip title="Separador">
                      <Button type="button" onClick={handleInsertSeparator} sx={narrationSeparatorButtonSx}>
                        <HorizontalRuleIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Desfazer">
                      <Button type="button" onClick={handleUndo} sx={narrationToolButtonSx}>
                        <UndoIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                    <Tooltip title="Refazer">
                      <Button type="button" onClick={handleRedo} sx={narrationToolButtonSx}>
                        <RedoIcon fontSize="small" />
                      </Button>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={narrationEditorAreaSx}>
                  {previewMode ? (
                    <Box
                      sx={{
                        ...narrationTextareaWrapperSx,
                        color: 'var(--text-primary)',
                        lineHeight: 1.9,
                        '& *': { color: 'var(--text-primary)' },
                      }}
                      dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(editorConteudo) }}
                    />
                  ) : (
                    <Box sx={narrationTextareaWrapperSx}>
                      <textarea
                        ref={textAreaRef}
                        value={editorConteudo}
                        onChange={event => setEditorConteudo(event.target.value)}
                        onSelect={event => {
                          if (event.target.selectionStart !== undefined) {
                            setEditorConteudo(prev => prev);
                          }
                        }}
                        style={narrationTextareaSx}
                        aria-label="Editor de texto da narração da cena"
                      />
                    </Box>
                  )}
                </Box>

                <Box sx={narrationEditorFooterSx}>
                  <Box sx={narrationFooterTextSx}>
                    <Box sx={narrationFooterStatusDotSx} />
                    <Typography sx={narrationFooterCountSx}>
                      {editorConteudo.length} caracteres
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => setPreviewMode(value => !value)}
                      sx={{
                        color: 'var(--text-primary)',
                        borderColor: 'rgba(255,255,255,0.12)',
                        textTransform: 'none',
                        borderRadius: '12px',
                      }}
                    >
                      {previewMode ? 'Editar' : 'Visualizar'}
                    </Button>
                    <Button
                      type="button"
                      variant="contained"
                      onClick={() => {
                        setFieldValue('descricaoNarracao', editorConteudo);
                        setEditorAberto(false);
                      }}
                      sx={{
                        background: 'linear-gradient(135deg, #d5a84f, #f0d081)',
                        color: '#050816',
                        fontWeight: 800,
                        borderRadius: '12px',
                        textTransform: 'none',
                      }}
                    >
                      Voltar à cena
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Modal>
        </Form>
        );
      }}
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
