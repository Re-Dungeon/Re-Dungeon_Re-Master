import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import FormatPaintOutlinedIcon from '@mui/icons-material/FormatPaintOutlined';
import TextIncreaseOutlinedIcon from '@mui/icons-material/TextIncreaseOutlined';
import VideoLibraryOutlinedIcon from '@mui/icons-material/VideoLibraryOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import { Formik, Form, FastField, Field } from 'formik';
import {
  addRmTipoEntidade,
  getRmCenas,
  getRmTiposEntidadePorUniverso,
} from 'service/storage';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import {
  LEGACY_ENTITY_TYPES,
  getEntityTypeOptions,
  NOTA_SCHEMA,
  buildEntityTypeRecord,
  matchEntityType,
  normalizeEntityTypeName,
  normalizeEntityTypeValue,
  normalizeNotaTags,
} from './notaUtils';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    background: 'rgba(15, 18, 27, 0.78)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-accent)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
  '& .MuiFormHelperText-root': { color: '#ef4444' },
};

const selectSx = {
  color: 'var(--text-primary)',
  background: 'rgba(15, 18, 27, 0.78)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-primary)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-hover)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--color-accent)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const menuPropsSx = {
  PaperProps: {
    sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' },
  },
};

const contentToolbarSx = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 1,
  p: 0.75,
  mb: 2,
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
  background: 'linear-gradient(180deg, rgba(15, 21, 31, 0.96), rgba(9, 13, 19, 0.92))',
  overflowX: 'auto',
  scrollbarWidth: 'thin',
};

const contentToolbarGroupSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  flexWrap: 'wrap',
  px: 0.75,
  py: 0.25,
  borderRadius: 1.5,
  background: 'rgba(255,255,255,0.01)',
};

const toolbarDividerSx = {
  width: '1px',
  height: 22,
  background: 'rgba(255,255,255,0.12)',
  mx: 0.25,
  alignSelf: 'center',
};

const contentToolButtonSx = {
  minWidth: 34,
  width: 34,
  height: 34,
  p: 0,
  borderRadius: 1.5,
  border: '1px solid transparent',
  color: 'var(--text-primary)',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: 'rgba(239, 68, 68, 0.45)',
    background: 'rgba(239, 68, 68, 0.08)',
    boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.18)',
  },
  '&:focus-visible': {
    outline: '2px solid rgba(118, 172, 255, 0.9)',
    outlineOffset: '2px',
  },
  '&.Mui-disabled': {
    color: 'rgba(255,255,255,0.26)',
    background: 'transparent',
    borderColor: 'transparent',
  },
};

const sectionSx = {
  p: { xs: 2, md: 3 },
  background: 'rgba(11, 16, 26, 0.96)',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.2)',
};

const panelSx = {
  p: { xs: 2, md: 2.5 },
  background: 'rgba(11, 16, 26, 0.96)',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  height: 'fit-content',
  position: 'sticky',
  top: 24,
};

const NotaForm = ({
  initialValues,
  campanhaId = null,
  universoId = null,
  mestreId = null,
  onSubmit,
  onCancelar,
  labelSalvar,
  idPrefix,
}) => {
  const cenaLabelId = `${idPrefix}-cena-label`;
  const editorRef = useRef(null);
  const [cenas, setCenas] = useState([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState([]);
  const [tiposError, setTiposError] = useState('');
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [highlightAnchor, setHighlightAnchor] = useState(null);
  const [textColorAnchor, setTextColorAnchor] = useState(null);
  const [fontSizeAnchor, setFontSizeAnchor] = useState(null);
  const [selectionSnapshot, setSelectionSnapshot] = useState(null);
  const [linkForm, setLinkForm] = useState({ texto: 'Texto', url: 'https://' });
  const [imageForm, setImageForm] = useState({ url: 'https://', alt: 'Imagem' });
  const [youtubeForm, setYoutubeForm] = useState({ url: 'https://youtu.be/' });
  const [highlightColor, setHighlightColor] = useState('#fbbf24');
  const [textColor, setTextColor] = useState('#f8fafc');
  const [fontSizeValue, setFontSizeValue] = useState('18px');

  useEffect(() => {
    if (!campanhaId) return;
    Promise.resolve().then(() =>
      getRmCenas(campanhaId, universoId, mestreId).then(setCenas),
    );
  }, [campanhaId, universoId, mestreId]);

  useEffect(() => {
    if (!universoId || !mestreId) return;

    let isMounted = true;
    Promise.resolve()
      .then(() => getRmTiposEntidadePorUniverso(universoId, mestreId))
      .then(itens => {
        if (!isMounted) return;
        setTiposError('');
        setTiposDisponiveis(Array.isArray(itens) ? itens : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setTiposError('Não foi possível carregar os tipos de entidade. Verifique suas permissões ou tente novamente.');
        setTiposDisponiveis([]);
      });

    return () => {
      isMounted = false;
    };
  }, [universoId, mestreId]);

  const persistirTipoEntidade = async valor => {
    const nome = normalizeEntityTypeValue(valor);
    if (!nome) return '';

    const tiposExistentes = [
      ...new Set(
        [...tiposDisponiveis.map(tipo => tipo?.name ?? '').filter(Boolean), ...LEGACY_ENTITY_TYPES],
      ),
    ];

    const jaExiste = tiposExistentes.some(tipo => matchEntityType(tipo, nome));
    if (jaExiste) {
      const encontrado = tiposExistentes.find(tipo => matchEntityType(tipo, nome));
      return encontrado || nome;
    }

    const payload = buildEntityTypeRecord(nome, { universoId, mestreId });
    const registro = await addRmTipoEntidade(payload);
    const novoNome = registro?.name || nome;

    setTiposDisponiveis(prev => {
      if (!novoNome) return prev;
      const atualizados = prev.filter(tipo => !matchEntityType(tipo?.name ?? '', novoNome));
      return [...atualizados, { ...registro, name: novoNome, normalizedName: normalizeEntityTypeName(novoNome) }];
    });

    return novoNome;
  };

  return (
    <Formik
      key={initialValues?.id ?? 'nota-form'}
      initialValues={initialValues}
      enableReinitialize
      validationSchema={NOTA_SCHEMA}
      onSubmit={onSubmit}
    >
      {({ errors, touched, isSubmitting, values, setFieldValue }) => {
        const registrarHistorico = nextValue => {
          if (nextValue === undefined) return;
          setUndoStack(prev => [...prev, nextValue].slice(-25));
          setRedoStack([]);
        };

        const atualizarConteudo = (novoValor, options = {}) => {
          const { ignorarHistorico = false } = options;
          if (!ignorarHistorico && novoValor !== values.conteudo) {
            registrarHistorico(values.conteudo);
          }
          setFieldValue('conteudo', novoValor);
        };

        const inserirFormatacao = (prefix, sufixo = '', fallback = 'texto') => {
          const input = editorRef.current;
          const value = values.conteudo ?? '';

          if (!input) {
            const novoValor = `${value || ''}${prefix}${fallback}${sufixo}`;
            atualizarConteudo(novoValor);
            return;
          }

          const inicio = input.selectionStart;
          const fim = input.selectionEnd;
          const selecionado = value.slice(inicio, fim) || fallback;
          const antes = value.slice(0, inicio);
          const depois = value.slice(fim);
          const novoValor = `${antes}${prefix}${selecionado}${sufixo}${depois}`;

          atualizarConteudo(novoValor);
          requestAnimationFrame(() => {
            input.focus();
            const proximoInicio = inicio + prefix.length;
            const proximoFim = proximoInicio + selecionado.length;
            input.setSelectionRange(proximoInicio, proximoFim);
          });
        };

        const inserirLista = (prefix, multiline = false, fallback = 'Item') => {
          const input = editorRef.current;
          const value = values.conteudo ?? '';

          if (!input) {
            const novoValor = `${value || ''}${prefix}${fallback}`;
            atualizarConteudo(novoValor);
            return;
          }

          const inicio = input.selectionStart;
          const fim = input.selectionEnd;
          const selecionado = value.slice(inicio, fim).trim();
          const linhas = selecionado ? selecionado.split('\n').filter(Boolean) : [fallback];
          const prefixado = linhas
            .map((linha, index) => `${prefix}${linha}${multiline && index < linhas.length - 1 ? '\n' : ''}`)
            .join(multiline ? '\n' : '');
          const antes = value.slice(0, inicio);
          const depois = value.slice(fim);
          const novoValor = `${antes}${prefixado}${depois}`;

          atualizarConteudo(novoValor);
          requestAnimationFrame(() => {
            input.focus();
            const novoInicio = inicio + prefix.length;
            const novoFim = novoInicio + (selecionado || fallback).length;
            input.setSelectionRange(novoInicio, novoFim);
          });
        };

        const formatarParagrafoComAlinhamento = (texto, alinhamento) => {
          const conteudo = String(texto ?? '').trim() || 'Texto';
          const blocos = conteudo
            .split(/\n{2,}/)
            .map(item => item.trim())
            .filter(Boolean);

          if (!blocos.length) {
            return `<p style="text-align:${alinhamento};">Texto</p>`;
          }

          return blocos
            .map(bloco => `<p style="text-align:${alinhamento};">${bloco.replace(/\n/g, '<br />')}</p>`)
            .join('\n\n');
        };

        const removerFormatacaoDeSelecao = () => {
          const { value = '', start, end, selectedText } = getSelectionState();
          const alvo = selectedText || 'texto';
          const semFormatacao = alvo
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/~~(.+?)~~/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .replace(/\[\[highlight:[^|\]]+\|([^\]]+)\]\]/g, '$1')
            .replace(/\[\[color:[^|\]]+\|([^\]]+)\]\]/g, '$1')
            .replace(/\[\[size:[^|\]]+\|([^\]]+)\]\]/g, '$1');

          const novoValor = `${value.slice(0, start)}${semFormatacao}${value.slice(end)}`;
          atualizarConteudo(novoValor);
          const cursorStart = start + semFormatacao.length;
          restoreEditorSelection({ start: cursorStart, end: cursorStart });
        };

        const aplicarAlinhamentoEmElementoHtml = (html, alinhamento) => {
          const tagMatch = String(html ?? '').match(/^\s*<([a-z0-9-]+)/i);
          const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
          const isMediaTag = ['img', 'iframe', 'video', 'figure'].includes(tagName);
          const isLinkTag = tagName === 'a';

          if (!tagName || (!isMediaTag && !isLinkTag)) {
            return null;
          }

          const tagHtml = String(html ?? '').trim();
          if (!tagHtml) {
            return null;
          }

          const wrapperStyle = `text-align:${alinhamento};`;

          if (isMediaTag) {
            const marginStyles = {
              left: 'margin:0 auto 0 0;',
              center: 'margin:0 auto;',
              right: 'margin:0 0 0 auto;',
              justify: 'margin:0 auto;',
            };

            const mediaStyles = `${marginStyles[alinhamento] || marginStyles.center} max-width:100%; height:auto; display:block;`;

            if (tagName === 'figure') {
              return `<div style="${wrapperStyle}"><figure style="${mediaStyles}">${tagHtml.replace(/^<figure\b[^>]*>|<\/figure>$/gi, '')}</figure></div>`;
            }

            if (tagHtml.includes('style=')) {
              return `<div style="${wrapperStyle}">${tagHtml.replace(/style="([^"]*)"/i, `style="${mediaStyles} $1"`)}</div>`;
            }

            return `<div style="${wrapperStyle}">${tagHtml.replace(/\s*\/>$/, ` style="${mediaStyles}" />`).replace(/>$/, ` style="${mediaStyles}">`)}</div>`;
          }

          return `<div style="${wrapperStyle}">${tagHtml}</div>`;
        };

        const encontrarElementoHtmlProximo = (value, cursor, distanciaMaxima = 120) => {
          const inicio = Math.max(0, cursor - distanciaMaxima);
          const fim = Math.min(value.length, cursor + distanciaMaxima);
          const trecho = value.slice(inicio, fim);
          const padrao = /<(img|iframe|video|figure|a)\b[^>]*>(?:[\s\S]*?<(?:\/\1|\s*\/)>|[\s\S]*?<\/\1>)?/gi;
          const matches = [...trecho.matchAll(padrao)];

          if (!matches.length) {
            return null;
          }

          let melhorMatch = null;
          matches.forEach(match => {
            const matchStart = inicio + match.index;
            const matchEnd = matchStart + match[0].length;
            const distancia = Math.min(
              Math.abs(cursor - matchStart),
              Math.abs(cursor - matchEnd),
              Math.abs(cursor - ((matchStart + matchEnd) / 2)),
            );

            if (!melhorMatch || distancia < melhorMatch.distancia) {
              melhorMatch = {
                html: match[0],
                start: matchStart,
                end: matchEnd,
                distancia,
              };
            }
          });

          return melhorMatch;
        };

        const aplicarAlinhamento = alinhamento => {
          const input = editorRef.current;
          const value = values.conteudo ?? '';

          if (!input) {
            const bloco = formatarParagrafoComAlinhamento(value || 'Texto', alinhamento);
            atualizarConteudo(bloco);
            return;
          }

          const start = input.selectionStart ?? 0;
          const end = input.selectionEnd ?? 0;
          const selecionado = value.slice(start, end);
          const elementoProximo = encontrarElementoHtmlProximo(value, start, 180) || encontrarElementoHtmlProximo(value, end, 180);

          if (elementoProximo) {
            const elementoAlinhado = aplicarAlinhamentoEmElementoHtml(elementoProximo.html, alinhamento);
            if (elementoAlinhado) {
              const novoValor = `${value.slice(0, elementoProximo.start)}${elementoAlinhado}${value.slice(elementoProximo.end)}`;
              atualizarConteudo(novoValor);

              requestAnimationFrame(() => {
                input.focus();
                const posicaoFinal = elementoProximo.start + elementoAlinhado.length;
                input.setSelectionRange(posicaoFinal, posicaoFinal);
              });
              return;
            }
          }

          if (selecionado && /<(?:img|iframe|video|figure|a)\b/i.test(selecionado)) {
            const elementoAlinhado = aplicarAlinhamentoEmElementoHtml(selecionado, alinhamento);
            if (elementoAlinhado) {
              const novoValor = `${value.slice(0, start)}${elementoAlinhado}${value.slice(end)}`;
              atualizarConteudo(novoValor);
              return;
            }
          }

          let rangeStart = start;
          let rangeEnd = end;
          let textoBase = selecionado;

          if (!textoBase.trim()) {
            let left = start;
            while (left > 0 && value[left - 1] !== '\n') left -= 1;
            let right = end;
            while (right < value.length && value[right] !== '\n') right += 1;
            rangeStart = left;
            rangeEnd = right;
            textoBase = value.slice(left, right) || 'Texto';
          }

          const bloco = formatarParagrafoComAlinhamento(textoBase || 'Texto', alinhamento);
          const novoValor = `${value.slice(0, rangeStart)}${bloco}${value.slice(rangeEnd)}`;
          atualizarConteudo(novoValor);

          requestAnimationFrame(() => {
            input.focus();
            const posicaoFinal = rangeStart + bloco.length;
            input.setSelectionRange(posicaoFinal, posicaoFinal);
          });
        };

        const normalizeContentUrl = rawValue => {
          if (typeof rawValue !== 'string') return '';

          const trimmed = rawValue.trim();
          if (!trimmed) return '';

          if (/^(mailto:|\/|#)/i.test(trimmed)) {
            return trimmed;
          }

          const matchesProtocol = trimmed.match(/^https?:\/\//i);
          const protocol = matchesProtocol ? matchesProtocol[0].toLowerCase() : 'https://';
          const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
          const cleaned = withoutProtocol.replace(/^https?:\/\//i, '');

          if (!cleaned) return '';
          return `${protocol}${cleaned}`;
        };

        const getSelectionState = () => {
          const input = editorRef.current;
          const currentValue = values.conteudo ?? '';
          if (!input) {
            return { start: currentValue.length, end: currentValue.length, selectedText: '' };
          }

          const start = input.selectionStart ?? 0;
          const end = input.selectionEnd ?? 0;

          return {
            start,
            end,
            selectedText: currentValue.slice(start, end),
            value: currentValue,
          };
        };

        const restoreEditorSelection = ({ start, end }) => {
          const input = editorRef.current;
          if (!input) return;

          requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(start, end);
          });
        };

        const abrirLinkDialog = () => {
          const state = getSelectionState();
          setSelectionSnapshot(state);
          setLinkForm({
            texto: state.selectedText || 'Texto',
            url: 'https://',
          });
          setLinkDialogOpen(true);
        };

        const confirmarLink = () => {
          const url = normalizeContentUrl(linkForm.url);
          const texto = (linkForm.texto || 'Texto').trim() || 'Texto';
          if (!url) return;

          const { value = '', start, end } = selectionSnapshot || getSelectionState();
          const html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${texto}</a>`;
          const novoValor = `${value.slice(0, start)}${html}${value.slice(end)}`;
          atualizarConteudo(novoValor);

          setLinkDialogOpen(false);
          const insertionEnd = start + html.length;
          restoreEditorSelection({ start: insertionEnd, end: insertionEnd });
        };

        const abrirImagemDialog = () => {
          const state = getSelectionState();
          setSelectionSnapshot(state);
          setImageForm({ url: 'https://', alt: state.selectedText || 'Imagem' });
          setImageDialogOpen(true);
        };

        const abrirYoutubeDialog = () => {
          const state = getSelectionState();
          setSelectionSnapshot(state);
          setYoutubeForm({ url: 'https://youtu.be/' });
          setYoutubeDialogOpen(true);
        };

        const confirmarImagem = () => {
          const url = normalizeContentUrl(imageForm.url);
          const alt = (imageForm.alt || 'Imagem').trim() || 'Imagem';
          if (!url) return;

          const { value = '', start, end } = selectionSnapshot || getSelectionState();
          const html = `<img src="${url}" alt="${alt}" title="${alt}" style="max-width:100%;height:auto;border-radius:12px;display:block;margin:12px 0;border:1px solid rgba(255,255,255,0.1);" />`;
          const novoValor = `${value.slice(0, start)}${html}${value.slice(end)}`;
          atualizarConteudo(novoValor);

          setImageDialogOpen(false);
          const insertionEnd = start + html.length;
          restoreEditorSelection({ start: insertionEnd, end: insertionEnd });
        };

        const inserirLinha = () => {
          const { value = '', start, end } = getSelectionState();
          const linha = '<hr />';
          const novoValor = `${value.slice(0, start)}${linha}${value.slice(end)}`;
          atualizarConteudo(novoValor);

          const insertionPoint = start + linha.length;
          restoreEditorSelection({ start: insertionPoint, end: insertionPoint });
        };

        const confirmarYoutube = () => {
          const url = normalizeContentUrl(youtubeForm.url);
          if (!url) return;

          const { value = '', start, end } = selectionSnapshot || getSelectionState();
          const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/i);
          const videoId = videoMatch ? videoMatch[1] : null;
          const html = videoId
            ? `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${videoId}" title="Vídeo do YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width:100%;height:auto;border-radius:12px;display:block;margin:12px 0;border:1px solid rgba(255,255,255,0.1);"></iframe>`
            : `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;

          const novoValor = `${value.slice(0, start)}${html}${value.slice(end)}`;
          atualizarConteudo(novoValor);

          setYoutubeDialogOpen(false);
          const insertionEnd = start + html.length;
          restoreEditorSelection({ start: insertionEnd, end: insertionEnd });
        };

        const aplicarDestaque = cor => {
          const { value = '', start, end, selectedText } = getSelectionState();
          const blocoAtual = selectedText || 'Texto';
          const token = `[[highlight:${cor}|${blocoAtual}]]`;
          const novoValor = `${value.slice(0, start)}${token}${value.slice(end)}`;
          atualizarConteudo(novoValor);
          setHighlightAnchor(null);
          const cursorStart = start + token.length;
          restoreEditorSelection({ start: cursorStart, end: cursorStart });
        };

        const aplicarCorTexto = cor => {
          const { value = '', start, end, selectedText } = getSelectionState();
          const blocoAtual = selectedText || 'Texto';
          const token = `[[color:${cor}|${blocoAtual}]]`;
          const novoValor = `${value.slice(0, start)}${token}${value.slice(end)}`;
          atualizarConteudo(novoValor);
          setTextColorAnchor(null);
          const cursorStart = start + token.length;
          restoreEditorSelection({ start: cursorStart, end: cursorStart });
        };

        const aplicarTamanhoFonte = tamanho => {
          const { value = '', start, end, selectedText } = getSelectionState();
          const blocoAtual = selectedText || 'Texto';
          const token = `[[size:${tamanho}|${blocoAtual}]]`;
          const novoValor = `${value.slice(0, start)}${token}${value.slice(end)}`;
          atualizarConteudo(novoValor);
          setFontSizeAnchor(null);
          const cursorStart = start + token.length;
          restoreEditorSelection({ start: cursorStart, end: cursorStart });
        };

        const inserirCallout = () => {
          const { value = '', start, end } = getSelectionState();
          const selected = value.slice(start, end) || 'Texto destacado';
          const snippet = `> [!IMPORTANT]\n> ${selected}\n`;
          const novoValor = `${value.slice(0, start)}${snippet}${value.slice(end)}`;
          atualizarConteudo(novoValor);
          const cursorStart = start + snippet.length;
          restoreEditorSelection({ start: cursorStart, end: cursorStart });
        };

        const inserirColunas = (quantidade = 2) => {
          const baseColumns = Array.from({ length: quantidade }, (_, idx) => `Coluna ${idx + 1}`).join(' | ');
          const table = `| ${baseColumns} |\n| ${Array.from({ length: quantidade }, () => '---').join(' | ')} |\n| ${Array.from({ length: quantidade }, () => 'Conteúdo').join(' | ')} |`;
          const { value = '', start, end } = getSelectionState();
          const novoValor = `${value.slice(0, start)}\n\n${table}\n\n${value.slice(end)}`;
          atualizarConteudo(novoValor);
          const cursorStart = start + table.length + 4;
          restoreEditorSelection({ start: cursorStart, end: cursorStart });
        };

        const inserirCita = () => {
          inserirFormatacao('> ');
        };

        const inserirCodigo = () => {
          const input = editorRef.current;
          const value = values.conteudo ?? '';
          const selecionado = input ? value.slice(input.selectionStart, input.selectionEnd) || 'código' : 'código';
          const antes = input ? value.slice(0, input.selectionStart) : value;
          const depois = input ? value.slice(input.selectionEnd) : '';
          const novoValor = `${antes}\n\n\`\`\`\n${selecionado}\n\`\`\`\n\n${depois}`;
          atualizarConteudo(novoValor);
        };

        const handleUndo = () => {
          if (!undoStack.length) return;
          const anterior = undoStack[undoStack.length - 1];
          setRedoStack(prev => [...prev, values.conteudo].slice(-25));
          setUndoStack(prev => prev.slice(0, -1));
          atualizarConteudo(anterior, { ignorarHistorico: true });
        };

        const handleRedo = () => {
          if (!redoStack.length) return;
          const proximo = redoStack[redoStack.length - 1];
          setUndoStack(prev => [...prev, values.conteudo].slice(-25));
          setRedoStack(prev => prev.slice(0, -1));
          atualizarConteudo(proximo, { ignorarHistorico: true });
        };

        const imagemPreview = values.imagemUrl || '';
        const tagsPreview = normalizeNotaTags(values.tags);

        return (
          <Form>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.8fr) minmax(260px, 0.8fr)' },
                  gap: 3,
                  alignItems: 'start',
                }}
              >
                <Paper elevation={0} sx={sectionSx}>
                  <SectionTitle>Conteúdo</SectionTitle>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={contentToolbarSx}>
                      <Box sx={contentToolbarGroupSx}>
                        <Tooltip title="Negrito">
                          <Button type="button" aria-label="Negrito" sx={contentToolButtonSx} onClick={() => inserirFormatacao('**', '**', 'texto')}>
                            <FormatBoldIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Itálico">
                          <Button type="button" aria-label="Itálico" sx={contentToolButtonSx} onClick={() => inserirFormatacao('*', '*', 'texto')}>
                            <FormatItalicIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Sublinhado">
                          <Button type="button" aria-label="Sublinhado" sx={contentToolButtonSx} onClick={() => inserirFormatacao('__', '__', 'texto')}>
                            <FormatUnderlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Tachado">
                          <Button type="button" aria-label="Tachado" sx={contentToolButtonSx} onClick={() => inserirFormatacao('~~', '~~', 'texto')}>
                            <FormatStrikethroughIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Lista com marcadores">
                          <Button type="button" aria-label="Lista com marcadores" sx={contentToolButtonSx} onClick={() => inserirLista('- ', true, 'Item')}>
                            <FormatListBulletedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Lista numerada">
                          <Button type="button" aria-label="Lista numerada" sx={contentToolButtonSx} onClick={() => inserirLista('1. ', true, 'Item')}>
                            <FormatListNumberedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Remover formatação">
                          <Button type="button" aria-label="Remover formatação" sx={contentToolButtonSx} onClick={removerFormatacaoDeSelecao}>
                            <FormatClearIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={toolbarDividerSx} />

                      <Box sx={contentToolbarGroupSx}>
                        <Tooltip title="Alinhar à esquerda">
                          <Button type="button" aria-label="Alinhar à esquerda" aria-pressed={false} sx={contentToolButtonSx} onClick={() => aplicarAlinhamento('left')}>
                            <FormatAlignLeftIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Centralizar">
                          <Button type="button" aria-label="Centralizar" aria-pressed={false} sx={contentToolButtonSx} onClick={() => aplicarAlinhamento('center')}>
                            <FormatAlignCenterIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Alinhar à direita">
                          <Button type="button" aria-label="Alinhar à direita" aria-pressed={false} sx={contentToolButtonSx} onClick={() => aplicarAlinhamento('right')}>
                            <FormatAlignRightIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Justificar">
                          <Button type="button" aria-label="Justificar" aria-pressed={false} sx={contentToolButtonSx} onClick={() => aplicarAlinhamento('justify')}>
                            <FormatAlignJustifyIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={toolbarDividerSx} />

                      <Box sx={contentToolbarGroupSx}>
                        <Tooltip title="Inserir link">
                          <Button type="button" aria-label="Inserir link" sx={contentToolButtonSx} onClick={abrirLinkDialog}>
                            <InsertLinkIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Inserir imagem">
                          <Button type="button" aria-label="Inserir imagem" sx={contentToolButtonSx} onClick={abrirImagemDialog}>
                            <ImageOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Inserir vídeo do YouTube">
                          <Button type="button" aria-label="Inserir vídeo do YouTube" sx={contentToolButtonSx} onClick={abrirYoutubeDialog}>
                            <VideoLibraryOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Linha horizontal">
                          <Button type="button" aria-label="Linha horizontal" sx={contentToolButtonSx} onClick={inserirLinha}>
                            <HorizontalRuleIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={toolbarDividerSx} />

                      <Box sx={contentToolbarGroupSx}>
                        <Tooltip title="Callout">
                          <Button type="button" aria-label="Callout" sx={contentToolButtonSx} onClick={inserirCallout}>
                            <SpeakerNotesOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Duas colunas">
                          <Button type="button" aria-label="Duas colunas" sx={contentToolButtonSx} onClick={() => inserirColunas(2)}>
                            <ViewColumnOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Três colunas">
                          <Button type="button" aria-label="Três colunas" sx={contentToolButtonSx} onClick={() => inserirColunas(3)}>
                            <TableChartOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={toolbarDividerSx} />

                      <Box sx={contentToolbarGroupSx}>
                        <Tooltip title="Destacar texto">
                          <Button type="button" aria-label="Destacar texto" sx={contentToolButtonSx} onClick={event => setHighlightAnchor(event.currentTarget)}>
                            <FormatPaintOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Cor do texto">
                          <Button type="button" aria-label="Cor do texto" sx={contentToolButtonSx} onClick={event => setTextColorAnchor(event.currentTarget)}>
                            <PaletteOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Tamanho da fonte">
                          <Button type="button" aria-label="Tamanho da fonte" sx={contentToolButtonSx} onClick={event => setFontSizeAnchor(event.currentTarget)}>
                            <TextIncreaseOutlinedIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Citação">
                          <Button type="button" aria-label="Citação" sx={contentToolButtonSx} onClick={inserirCita}>
                            <FormatQuoteIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                        <Tooltip title="Bloco de código">
                          <Button type="button" aria-label="Bloco de código" sx={contentToolButtonSx} onClick={inserirCodigo}>
                            <CodeIcon fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Box>

                      <Box sx={toolbarDividerSx} />

                      <Box sx={contentToolbarGroupSx}>
                        <Tooltip title="Desfazer">
                          <span>
                            <Button type="button" aria-label="Desfazer" sx={contentToolButtonSx} onClick={handleUndo} disabled={undoStack.length === 0}>
                              <UndoIcon fontSize="small" />
                            </Button>
                          </span>
                        </Tooltip>
                        <Tooltip title="Refazer">
                          <span>
                            <Button type="button" aria-label="Refazer" sx={contentToolButtonSx} onClick={handleRedo} disabled={redoStack.length === 0}>
                              <RedoIcon fontSize="small" />
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Popover
                      open={Boolean(highlightAnchor)}
                      anchorEl={highlightAnchor}
                      onClose={() => setHighlightAnchor(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 1.5, width: 240, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', mb: 1 }}>Cor de destaque</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {['#fbbf24', '#f59e0b', '#ef4444', '#10b981', '#60a5fa', '#a78bfa', '#f472b6'].map(cor => (
                            <Button
                              key={cor}
                              type="button"
                              onClick={() => aplicarDestaque(cor)}
                              sx={{ minWidth: 0, width: 24, height: 24, borderRadius: '50%', background: cor, border: '2px solid rgba(255,255,255,0.2)', p: 0 }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="color"
                            value={highlightColor}
                            onChange={event => {
                              const nextColor = event.target.value;
                              setHighlightColor(nextColor);
                              aplicarDestaque(nextColor);
                            }}
                            aria-label="Cor personalizada de destaque"
                            style={{ width: 40, height: 32, border: '1px solid var(--border-primary)', background: 'transparent', borderRadius: 8 }}
                          />
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{highlightColor}</Typography>
                        </Box>
                      </Box>
                    </Popover>

                    <Popover
                      open={Boolean(textColorAnchor)}
                      anchorEl={textColorAnchor}
                      onClose={() => setTextColorAnchor(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 1.5, width: 240, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', mb: 1 }}>Cor do texto</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {['#f8fafc', '#fca5a5', '#fbbf24', '#7dd3fc', '#a7f3d0', '#c4b5fd', '#f9a8d4'].map(cor => (
                            <Button
                              key={cor}
                              type="button"
                              onClick={() => aplicarCorTexto(cor)}
                              sx={{ minWidth: 0, width: 24, height: 24, borderRadius: '50%', background: cor, border: '2px solid rgba(255,255,255,0.2)', p: 0 }}
                            />
                          ))}
                        </Box>
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="color"
                            value={textColor}
                            onChange={event => {
                              const nextColor = event.target.value;
                              setTextColor(nextColor);
                              aplicarCorTexto(nextColor);
                            }}
                            aria-label="Cor personalizada do texto"
                            style={{ width: 40, height: 32, border: '1px solid var(--border-primary)', background: 'transparent', borderRadius: 8 }}
                          />
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>{textColor}</Typography>
                        </Box>
                      </Box>
                    </Popover>

                    <Popover
                      open={Boolean(fontSizeAnchor)}
                      anchorEl={fontSizeAnchor}
                      onClose={() => setFontSizeAnchor(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 1.5, width: 220, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ display: 'block', color: 'var(--text-secondary)', mb: 1 }}>Tamanho da fonte</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1 }}>
                          {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64].map(size => (
                            <Button
                              key={size}
                              type="button"
                              variant={fontSizeValue === `${size}px` ? 'contained' : 'text'}
                              onClick={() => {
                                const nextSize = `${size}px`;
                                setFontSizeValue(nextSize);
                                aplicarTamanhoFonte(nextSize);
                              }}
                              sx={{
                                justifyContent: 'center',
                                background: fontSizeValue === `${size}px` ? 'rgba(139,92,246,0.2)' : 'transparent',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-primary)',
                              }}
                            >
                              {size}px
                            </Button>
                          ))}
                        </Box>
                        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            size="small"
                            value={fontSizeValue}
                            onChange={event => {
                              const nextSize = event.target.value;
                              setFontSizeValue(nextSize);
                              if (/^\d+(px)?$/i.test(nextSize)) {
                                aplicarTamanhoFonte(nextSize.endsWith('px') ? nextSize : `${nextSize}px`);
                              }
                            }}
                            sx={{ ...inputSx, flex: 1 }}
                            placeholder="24px"
                          />
                        </Box>
                      </Box>
                    </Popover>

                    <Field name="conteudo">
                      {({ field, form }) => (
                        <>
                          <TextField
                            {...field}
                            inputRef={editorRef}
                            label="Conteúdo"
                            fullWidth
                            multiline
                            minRows={18}
                            value={field.value ?? ''}
                            onChange={event => form.setFieldValue('conteudo', event.target.value)}
                            error={touched.conteudo && Boolean(errors.conteudo)}
                            helperText={touched.conteudo && errors.conteudo}
                            sx={inputSx}
                          />

                          <Box
                            sx={{
                              mt: 0,
                              border: 'none',
                              background: 'transparent',
                            }}
                          />
                        </>
                      )}
                    </Field>
                  </Box>
                </Paper>

                <Paper elevation={0} sx={panelSx}>
                  <SectionTitle>Propriedades</SectionTitle>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <FastField name="titulo">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Título"
                          fullWidth
                          error={touched.titulo && Boolean(errors.titulo)}
                          helperText={touched.titulo && errors.titulo}
                          sx={inputSx}
                        />
                      )}
                    </FastField>

                    <Field name="tipo">
                      {({ field, form }) => {
                        const tiposOrdenados = getEntityTypeOptions(tiposDisponiveis)
                          .filter(Boolean)
                          .sort((a, b) => a.localeCompare(b, 'pt-BR'));

                        const valorAtual = normalizeEntityTypeValue(field.value ?? '');
                        const inputValue = valorAtual || '';

                        return (
                          <Autocomplete
                            freeSolo
                            options={tiposOrdenados}
                            value={inputValue || null}
                            inputValue={inputValue}
                            selectOnFocus
                            clearOnBlur={false}
                            filterOptions={(opcoesFiltradas, state) => {
                              const termo = normalizeEntityTypeValue(state.inputValue || '');
                              if (!termo) return opcoesFiltradas;

                              const correspondencias = opcoesFiltradas.filter(tipo =>
                                tipo.toLowerCase().includes(termo.toLowerCase()),
                              );

                              const jaExiste = tiposOrdenados.some(tipo => matchEntityType(tipo, termo));
                              if (jaExiste) return correspondencias;

                              return [`＋ Criar tipo "${termo}"`, ...correspondencias];
                            }}
                            onInputChange={(_, novoValor) => {
                              const proximoValor = normalizeEntityTypeValue(novoValor);
                              if (proximoValor !== field.value) {
                                form.setFieldValue('tipo', proximoValor);
                              }
                            }}
                            onChange={async (_, novoValor) => {
                              const valorSelecionado = typeof novoValor === 'string' ? novoValor : novoValor ?? '';
                              const matchCriacao = valorSelecionado.match(/^＋\s*Criar tipo\s+"?(.*?)"?$/i);
                              const nomeFinal = matchCriacao ? matchCriacao[1] : normalizeEntityTypeValue(valorSelecionado);

                              if (!nomeFinal) {
                                form.setFieldValue('tipo', '');
                                return;
                              }

                              if (matchCriacao) {
                                const tipoCriado = await persistirTipoEntidade(nomeFinal);
                                form.setFieldValue('tipo', tipoCriado || nomeFinal);
                                return;
                              }

                              form.setFieldValue('tipo', nomeFinal);
                            }}
                            renderInput={params => (
                              <TextField
                                {...params}
                                label="Tipo da entidade"
                                placeholder="Digite ou crie um tipo..."
                                error={Boolean(tiposError) || (touched.tipo && Boolean(errors.tipo))}
                                helperText={tiposError || (touched.tipo && errors.tipo)}
                                sx={inputSx}
                              />
                            )}
                          />
                        );
                      }}
                    </Field>

                    <FastField name="resumo">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Resumo"
                          fullWidth
                          multiline
                          minRows={3}
                          value={field.value ?? ''}
                          error={touched.resumo && Boolean(errors.resumo)}
                          helperText={touched.resumo && errors.resumo}
                          sx={inputSx}
                        />
                      )}
                    </FastField>

                    <FastField name="tags">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="Tags"
                          fullWidth
                          value={field.value ?? ''}
                          placeholder="ex.: antiga, religião, litoral"
                          helperText="Separe por vírgula"
                          sx={inputSx}
                        />
                      )}
                    </FastField>

                    <FastField name="imagemUrl">
                      {({ field }) => (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <TextField
                            {...field}
                            label="URL da imagem"
                            fullWidth
                            value={field.value ?? ''}
                            error={touched.imagemUrl && Boolean(errors.imagemUrl)}
                            helperText={touched.imagemUrl && errors.imagemUrl}
                            sx={inputSx}
                          />
                          {imagemPreview ? (
                            <Box
                              component="img"
                              src={imagemPreview}
                              alt="Pré-visualização da capa da entidade"
                              sx={{
                                width: '100%',
                                height: 180,
                                objectFit: 'cover',
                                borderRadius: 2,
                                border: '1px solid var(--border-primary)',
                                background: 'rgba(255,255,255,0.02)',
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 180,
                                borderRadius: 2,
                                border: '1px dashed var(--border-primary)',
                                color: 'var(--text-secondary)',
                                background: 'rgba(255,255,255,0.01)',
                              }}
                            >
                              Sem imagem de capa
                            </Box>
                          )}
                        </Box>
                      )}
                    </FastField>

                    {tagsPreview.length > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mb: 1 }}>
                          Tags
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {tagsPreview.map(tag => (
                            <Box
                              key={tag}
                              sx={{
                                px: 1.25,
                                py: 0.5,
                                borderRadius: 999,
                                fontSize: '0.72rem',
                                border: '1px solid var(--border-primary)',
                                background: 'rgba(111,45,168,0.12)',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {tag}
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {cenas.length > 0 && (
                      <Field name="cenaId">
                        {({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel
                              id={cenaLabelId}
                              sx={{
                                color: 'var(--text-secondary)',
                                '&.Mui-focused': { color: 'var(--color-accent)' },
                              }}
                            >
                              Vincular a uma Cena (opcional)
                            </InputLabel>
                            <Select
                              {...field}
                              value={field.value ?? ''}
                              labelId={cenaLabelId}
                              label="Vincular a uma Cena (opcional)"
                              sx={selectSx}
                              MenuProps={menuPropsSx}
                            >
                              <MenuItem value="">Nenhuma</MenuItem>
                              {cenas.map(cena => (
                                <MenuItem key={cena.id} value={cena.id}>
                                  {cena.titulo}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Field>
                    )}
                  </Box>
                </Paper>
              </Box>

              <Divider sx={{ borderColor: 'var(--border-primary)' }} />

              <FormActions
                onCancelar={onCancelar}
                isSubmitting={isSubmitting}
                labelSalvar={labelSalvar}
              />
            </Box>

            <Dialog
              open={linkDialogOpen}
              onClose={() => setLinkDialogOpen(false)}
              aria-labelledby="dialog-link-title"
              slotProps={{
                paper: {
                  sx: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 3,
                    minWidth: { xs: '90vw', sm: 420 },
                  },
                },
              }}
            >
              <DialogTitle id="dialog-link-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1, color: 'var(--text-primary)' }}>
                Inserir link
                <IconButton aria-label="Fechar" onClick={() => setLinkDialogOpen(false)} sx={{ color: 'var(--text-primary)' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                  label="Texto"
                  value={linkForm.texto}
                  onChange={event => setLinkForm(prev => ({ ...prev, texto: event.target.value }))}
                  fullWidth
                  sx={inputSx}
                />
                <TextField
                  label="URL"
                  value={linkForm.url}
                  onChange={event => setLinkForm(prev => ({ ...prev, url: event.target.value }))}
                  error={Boolean(linkForm.url.trim()) && !/^(https?:\/\/|mailto:|\/|#)/i.test(linkForm.url.trim())}
                  helperText={Boolean(linkForm.url.trim()) && !/^(https?:\/\/|mailto:|\/|#)/i.test(linkForm.url.trim()) ? 'Informe uma URL válida.' : ''}
                  fullWidth
                  sx={inputSx}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setLinkDialogOpen(false)} color="inherit" sx={{ color: 'var(--text-secondary)' }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmarLink}
                  disabled={!linkForm.url.trim() || !/^(https?:\/\/|mailto:|\/|#)/i.test(linkForm.url.trim())}
                  sx={{ background: 'linear-gradient(135deg, #7f3db8 0%, #4f1d7c 100%)' }}
                >
                  Inserir link
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={youtubeDialogOpen}
              onClose={() => setYoutubeDialogOpen(false)}
              aria-labelledby="dialog-youtube-title"
              slotProps={{
                paper: {
                  sx: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 3,
                    minWidth: { xs: '90vw', sm: 420 },
                  },
                },
              }}
            >
              <DialogTitle id="dialog-youtube-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1, color: 'var(--text-primary)' }}>
                Inserir vídeo do YouTube
                <IconButton aria-label="Fechar" onClick={() => setYoutubeDialogOpen(false)} sx={{ color: 'var(--text-primary)' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                  label="URL do vídeo"
                  value={youtubeForm.url}
                  onChange={event => setYoutubeForm(prev => ({ ...prev, url: event.target.value }))}
                  fullWidth
                  sx={inputSx}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setYoutubeDialogOpen(false)} color="inherit" sx={{ color: 'var(--text-secondary)' }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmarYoutube}
                  disabled={!youtubeForm.url.trim()}
                  sx={{ background: 'linear-gradient(135deg, #7f3db8 0%, #4f1d7c 100%)' }}
                >
                  Inserir vídeo
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={imageDialogOpen}
              onClose={() => setImageDialogOpen(false)}
              aria-labelledby="dialog-image-title"
              slotProps={{
                paper: {
                  sx: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 3,
                    minWidth: { xs: '90vw', sm: 420 },
                  },
                },
              }}
            >
              <DialogTitle id="dialog-image-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1, color: 'var(--text-primary)' }}>
                Inserir imagem
                <IconButton aria-label="Fechar" onClick={() => setImageDialogOpen(false)} sx={{ color: 'var(--text-primary)' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField
                  label="URL da imagem"
                  value={imageForm.url}
                  onChange={event => {
                    const nextValue = event.target.value;
                    setImageForm(prev => ({ ...prev, url: nextValue }));
                  }}
                  fullWidth
                  sx={inputSx}
                />
                <TextField
                  label="Texto alternativo"
                  value={imageForm.alt}
                  onChange={event => setImageForm(prev => ({ ...prev, alt: event.target.value }))}
                  fullWidth
                  sx={inputSx}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setImageDialogOpen(false)} color="inherit" sx={{ color: 'var(--text-secondary)' }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmarImagem}
                  disabled={!normalizeContentUrl(imageForm.url)}
                  sx={{ background: 'linear-gradient(135deg, #7f3db8 0%, #4f1d7c 100%)' }}
                >
                  Inserir imagem
                </Button>
              </DialogActions>
            </Dialog>
          </Form>
        );
      }}
    </Formik>
  );
};

NotaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  campanhaId: PropTypes.string,
  universoId: PropTypes.string,
  mestreId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

export default NotaForm;
