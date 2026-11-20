import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';
import FormatBoldOutlinedIcon from '@mui/icons-material/FormatBoldOutlined';
import FormatItalicOutlinedIcon from '@mui/icons-material/FormatItalicOutlined';
import FormatUnderlinedOutlinedIcon from '@mui/icons-material/FormatUnderlinedOutlined';
import StrikethroughSOutlinedIcon from '@mui/icons-material/StrikethroughSOutlined';
import FormatAlignLeftOutlinedIcon from '@mui/icons-material/FormatAlignLeftOutlined';
import FormatAlignCenterOutlinedIcon from '@mui/icons-material/FormatAlignCenterOutlined';
import FormatAlignRightOutlinedIcon from '@mui/icons-material/FormatAlignRightOutlined';
import FormatAlignJustifyOutlinedIcon from '@mui/icons-material/FormatAlignJustifyOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import HorizontalRuleOutlinedIcon from '@mui/icons-material/HorizontalRuleOutlined';
import FormatQuoteOutlinedIcon from '@mui/icons-material/FormatQuoteOutlined';
import FormatColorTextOutlinedIcon from '@mui/icons-material/FormatColorTextOutlined';
import HighlightOutlinedIcon from '@mui/icons-material/HighlightOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AlignHorizontalLeftOutlinedIcon from '@mui/icons-material/AlignHorizontalLeftOutlined';
import AlignHorizontalCenterOutlinedIcon from '@mui/icons-material/AlignHorizontalCenterOutlined';
import AlignHorizontalRightOutlinedIcon from '@mui/icons-material/AlignHorizontalRightOutlined';
import ViewHeadlineOutlinedIcon from '@mui/icons-material/ViewHeadlineOutlined';
import ImagemUrlDialog from 'components/Chat/ImagemUrlDialog';
import { renderNotaContentHtml, sanitizeRichHtml } from './notaUtils';
import RichColorPopover from './RichColorPopover';

const TEXT_COLORS = [
  {
    title: 'Tema',
    colors: [
      '#FFFFFF',
      '#D9DDE7',
      '#A7ADBA',
      '#545B68',
      '#B13535',
      '#7A1F1F',
      '#D7B56D',
      '#4C82C3',
      '#4FA67A',
    ],
  },
  {
    title: 'Vermelhos',
    colors: ['#FECACA', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#7F1D1D'],
  },
  {
    title: 'Azuis',
    colors: ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'],
  },
  {
    title: 'Neutros',
    colors: ['#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B', '#334155'],
  },
];

const HIGHLIGHT_COLORS = [
  {
    title: 'Cores',
    colors: ['#FFF9C4', '#FED7AA', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#E2E8F0'],
  },
];

const Tool = ({ label, onClick, children, disabled = false }) => (
  <Tooltip title={label}>
    <span>
      <IconButton
        size="small"
        disabled={disabled}
        onClick={onClick}
        sx={{ color: 'var(--text-secondary)', borderRadius: '8px' }}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

Tool.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};

const EntidadeRichEditor = ({ value = '', onChange = () => {} }) => {
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const imageHistoryRef = useRef({ undo: [], redo: [] });
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [heading, setHeading] = useState('p');
  const [textColorAnchor, setTextColorAnchor] = useState(null);
  const [highlightAnchor, setHighlightAnchor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageAnchor, setImageAnchor] = useState(null);
  const [imageWidth, setImageWidth] = useState('');
  const [imageWidthUnit, setImageWidthUnit] = useState('px');
  const [contagem, setContagem] = useState(() => ({
    palavras: value.split(/\s+/).filter(Boolean).length,
    caracteres: value.length,
  }));

  useEffect(() => {
    if (!editorRef.current) return;
    if (document.activeElement !== editorRef.current) {
      const nextHtml = sanitizeRichHtml(renderNotaContentHtml(value));
      if (editorRef.current.innerHTML !== nextHtml)
        editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  useEffect(() => {
    setContagem({
      palavras:
        editorRef.current?.innerText.split(/\s+/).filter(Boolean).length || 0,
      caracteres: editorRef.current?.innerText.length || 0,
    });
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = sanitizeRichHtml(editorRef.current.innerHTML);
    setContagem({
      palavras:
        editorRef.current?.innerText.split(/\s+/).filter(Boolean).length || 0,
      caracteres: editorRef.current?.innerText.length || 0,
    });
    onChange(html);
  };

  const saveSelection = () => {
    const selection = window.getSelection?.();
    if (!selection?.rangeCount || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const range = selectionRef.current;
    if (!range) return;
    const selection = window.getSelection?.();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const command = (name, argument = null) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(name, false, argument);
    saveSelection();
    emitChange();
  };

  const openLink = () => {
    saveSelection();
    setLinkText(window.getSelection()?.toString() || '');
    setLinkUrl('');
    setLinkOpen(true);
  };

  const insertLink = event => {
    event.preventDefault();
    const texto = linkText.trim();
    const url = linkUrl.trim();
    if (!texto || !/^https?:\/\//i.test(url)) return;
    setLinkOpen(false);
    editorRef.current?.focus();
    restoreSelection();
    if (window.getSelection()?.toString()) {
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${url}" target="_blank" rel="noopener noreferrer">${texto.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch])}</a>`,
      );
    }
    emitChange();
  };

  const insertImage = url => {
    setImageOpen(false);
    editorRef.current?.focus();
    restoreSelection();
    const safeUrl = url.replace(
      /["&<>]/g,
      ch => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch],
    );
    document.execCommand(
      'insertHTML',
      false,
      `<img src="${safeUrl}" alt="Imagem" loading="lazy" style="display:inline-block;max-width:100%;height:auto;margin:12px 0;border-radius:10px;" />`,
    );
    emitChange();
  };

  const clearImageSelection = () => {
    if (selectedImage) selectedImage.classList.remove('rm-rich-image-selected');
    setSelectedImage(null);
    setImageAnchor(null);
  };

  const selectImage = image => {
    if (selectedImage) selectedImage.classList.remove('rm-rich-image-selected');
    image.classList.add('rm-rich-image-selected');
    setSelectedImage(image);
    setImageAnchor(image);
    setImageWidth(String(Math.round(image.getBoundingClientRect().width)));
    setImageWidthUnit('px');
  };

  const commitImageChange = mutator => {
    if (!selectedImage || !editorRef.current) return;
    imageHistoryRef.current.undo.push(editorRef.current.innerHTML);
    imageHistoryRef.current.redo = [];
    mutator(selectedImage);
    emitChange();
  };

  const undoImageChange = () => {
    if (!imageHistoryRef.current.undo.length || !editorRef.current)
      return false;
    imageHistoryRef.current.redo.push(editorRef.current.innerHTML);
    editorRef.current.innerHTML = imageHistoryRef.current.undo.pop();
    clearImageSelection();
    emitChange();
    return true;
  };

  const redoImageChange = () => {
    if (!imageHistoryRef.current.redo.length || !editorRef.current)
      return false;
    imageHistoryRef.current.undo.push(editorRef.current.innerHTML);
    editorRef.current.innerHTML = imageHistoryRef.current.redo.pop();
    clearImageSelection();
    emitChange();
    return true;
  };

  const applyImageAlignment = alignment => {
    commitImageChange(image => {
      image.style.maxWidth = '100%';
      image.style.height = 'auto';
      image.style.marginTop = '16px';
      image.style.marginBottom = '16px';
      if (alignment === 'left') {
        image.style.display = 'inline-block';
        image.style.float = 'left';
        image.style.clear = 'none';
        image.style.marginLeft = '0';
        image.style.marginRight = '32px';
        image.style.verticalAlign = 'middle';
      } else if (alignment === 'right') {
        image.style.display = 'inline-block';
        image.style.float = 'right';
        image.style.clear = 'none';
        image.style.marginLeft = '32px';
        image.style.marginRight = '0';
        image.style.verticalAlign = 'middle';
      } else if (alignment === 'center') {
        image.style.display = 'block';
        image.style.float = 'none';
        image.style.clear = 'both';
        image.style.marginLeft = 'auto';
        image.style.marginRight = 'auto';
      } else {
        image.style.display = 'block';
        image.style.float = 'none';
        image.style.clear = 'both';
        image.style.marginLeft = '0';
        image.style.marginRight = '0';
      }
    });
  };

  const applyImageWidth = () => {
    const numeric = Number.parseFloat(imageWidth);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    commitImageChange(image => {
      const availableWidth = editorRef.current?.clientWidth || 1;
      if (imageWidthUnit === '%') {
        image.style.width = `${Math.min(100, Math.max(1, numeric))}%`;
      } else {
        image.style.width = `${Math.round(Math.min(availableWidth, Math.max(32, numeric)))}px`;
      }
      image.style.height = 'auto';
      image.style.maxWidth = '100%';
    });
  };

  const restoreImageSize = () => {
    commitImageChange(image => {
      image.style.removeProperty('width');
      image.style.removeProperty('height');
      image.style.removeProperty('aspect-ratio');
      image.style.maxWidth = '100%';
    });
  };

  const removeSelectedImage = () => {
    if (!selectedImage) return;
    imageHistoryRef.current.undo.push(editorRef.current.innerHTML);
    selectedImage.remove();
    clearImageSelection();
    emitChange();
  };

  const handleEditorClick = event => {
    const image = event.target?.closest?.('img');
    if (image && editorRef.current?.contains(image)) {
      event.preventDefault();
      selectImage(image);
      return;
    }
    clearImageSelection();
  };

  const toolbarSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 0.25,
    flexWrap: 'wrap',
    px: 1,
    py: 0.75,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.018)',
  };

  return (
    <Box>
      <Box
        sx={{
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(6,9,15,0.72)',
          height: '100%',
          minHeight: { xs: 360, lg: 520 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ ...toolbarSx, flexShrink: 0 }}>
          <Tool
            label="Desfazer"
            onClick={() => {
              if (!undoImageChange()) command('undo');
            }}
          >
            <UndoOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Refazer"
            onClick={() => {
              if (!redoImageChange()) command('redo');
            }}
          >
            <RedoOutlinedIcon fontSize="small" />
          </Tool>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Select
            value={heading}
            size="small"
            onChange={event => {
              setHeading(event.target.value);
              command(
                'formatBlock',
                event.target.value === 'p' ? 'p' : event.target.value,
              );
            }}
            sx={{ height: 32, minWidth: 112, mr: 0.5 }}
          >
            <MenuItem value="p">Parágrafo</MenuItem>
            <MenuItem value="h1">Título H1</MenuItem>
            <MenuItem value="h2">Título H2</MenuItem>
            <MenuItem value="h3">Título H3</MenuItem>
          </Select>
          <Tool label="Negrito" onClick={() => command('bold')}>
            <FormatBoldOutlinedIcon fontSize="small" />
          </Tool>
          <Tool label="Itálico" onClick={() => command('italic')}>
            <FormatItalicOutlinedIcon fontSize="small" />
          </Tool>
          <Tool label="Sublinhado" onClick={() => command('underline')}>
            <FormatUnderlinedOutlinedIcon fontSize="small" />
          </Tool>
          <Tool label="Tachado" onClick={() => command('strikeThrough')}>
            <StrikethroughSOutlinedIcon fontSize="small" />
          </Tool>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tool
            label="Alinhar à esquerda"
            onClick={() => command('justifyLeft')}
          >
            <FormatAlignLeftOutlinedIcon fontSize="small" />
          </Tool>
          <Tool label="Centralizar" onClick={() => command('justifyCenter')}>
            <FormatAlignCenterOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Alinhar à direita"
            onClick={() => command('justifyRight')}
          >
            <FormatAlignRightOutlinedIcon fontSize="small" />
          </Tool>
          <Tool label="Justificar" onClick={() => command('justifyFull')}>
            <FormatAlignJustifyOutlinedIcon fontSize="small" />
          </Tool>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tool
            label="Lista com marcadores"
            onClick={() => command('insertUnorderedList')}
          >
            <FormatListBulletedOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Lista numerada"
            onClick={() => command('insertOrderedList')}
          >
            <FormatListNumberedOutlinedIcon fontSize="small" />
          </Tool>
          <Tool label="Link" onClick={openLink}>
            <LinkOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Imagem"
            onClick={() => {
              saveSelection();
              setImageOpen(true);
            }}
          >
            <ImageOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Linha divisória"
            onClick={() => command('insertHorizontalRule')}
          >
            <HorizontalRuleOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Citação"
            onClick={() => command('formatBlock', 'blockquote')}
          >
            <FormatQuoteOutlinedIcon fontSize="small" />
          </Tool>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tool
            label="Cor do texto"
            onClick={event => {
              saveSelection();
              setTextColorAnchor(event.currentTarget);
            }}
          >
            <FormatColorTextOutlinedIcon fontSize="small" />
          </Tool>
          <Tool
            label="Realce"
            onClick={event => {
              saveSelection();
              setHighlightAnchor(event.currentTarget);
            }}
          >
            <HighlightOutlinedIcon fontSize="small" />
          </Tool>
        </Box>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: 360,
            display: 'flex',
          }}
        >
          <Box
            ref={editorRef}
            component="div"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            onInput={event => {
              const html = sanitizeRichHtml(event.currentTarget.innerHTML);
              setContagem({
                palavras: event.currentTarget.innerText
                  .split(/\s+/)
                  .filter(Boolean).length,
                caracteres: event.currentTarget.innerText.length,
              });
              onChange(html);
            }}
            onMouseUp={event => {
              saveSelection();
              if (event.target?.closest?.('img')) emitChange();
            }}
            onKeyUp={saveSelection}
            onClick={handleEditorClick}
            sx={{
              minHeight: 360,
              flex: 1,
              maxHeight: { lg: 'calc(100vh - 260px)' },
              px: { xs: 2.25, md: 3.5 },
              py: 3,
              color: 'rgba(237,239,244,0.88)',
              lineHeight: 1.78,
              fontSize: '1rem',
              outline: 'none',
              overflowY: 'auto',
              '& h1,& h2,& h3': {
                color: 'var(--text-primary)',
                lineHeight: 1.25,
              },
              '& p': { mb: 1.5, overflow: 'visible' },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '10px',
              },
              '& img[style*="float:left"]': {
                float: 'left',
                clear: 'none',
                marginTop: '08px',
                marginBottom: '08px',
                marginLeft: '0',
                marginRight: '16px',
              },
              '& img[style*="float:right"]': {
                float: 'right',
                clear: 'none',
                marginTop: '08px',
                marginBottom: '08px',
                marginLeft: '16px',
                marginRight: '0',
              },
              '& .rm-rich-image-selected': {
                outline: '2px solid #7bb8ff',
                outlineOffset: '3px',
                resize: 'both',
                overflow: 'hidden',
                cursor: 'nwse-resize',
              },
              '& a': {
                color: '#efbcbc',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              },
              '& hr': {
                clear: 'both',
                border: 0,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                my: 3,
              },
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: 36,
          px: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          color: 'var(--text-secondary)',
          fontSize: '0.78rem',
        }}
        aria-live="polite"
      >
        <span>
          Palavras: {contagem.palavras.toLocaleString('pt-BR')} | Caracteres:{' '}
          {contagem.caracteres.toLocaleString('pt-BR')}
        </span>
      </Box>

      <Dialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Inserir link</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pt: '12px !important',
          }}
        >
          <TextField
            label="Texto do link"
            value={linkText}
            onChange={event => setLinkText(event.target.value)}
            fullWidth
          />
          <TextField
            label="Endereço"
            placeholder="https://"
            value={linkUrl}
            onChange={event => setLinkUrl(event.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={insertLink}
            disabled={!linkText.trim() || !/^https?:\/\//i.test(linkUrl.trim())}
          >
            Inserir
          </Button>
        </DialogActions>
      </Dialog>

      <ImagemUrlDialog
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        onConfirmar={insertImage}
      />

      <RichColorPopover
        anchorEl={textColorAnchor}
        open={Boolean(textColorAnchor)}
        onClose={() => setTextColorAnchor(null)}
        onSelectColor={color => {
          setTextColorAnchor(null);
          command('foreColor', color);
        }}
        families={TEXT_COLORS}
        title="Cor do texto"
      />
      <RichColorPopover
        anchorEl={highlightAnchor}
        open={Boolean(highlightAnchor)}
        onClose={() => setHighlightAnchor(null)}
        onSelectColor={color => {
          setHighlightAnchor(null);
          command('hiliteColor', color);
        }}
        families={HIGHLIGHT_COLORS}
        title="Realce"
        allowRemove
        onRemove={() => {
          setHighlightAnchor(null);
          command('hiliteColor', 'transparent');
        }}
      />

      <Popover
        open={Boolean(imageAnchor)}
        anchorEl={imageAnchor}
        onClose={() => setImageAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        {selectedImage && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              flexWrap: 'wrap',
              maxWidth: 430,
              p: 0.75,
              background: 'rgba(11,16,32,0.98)',
              borderRadius: '10px',
            }}
          >
            <Tool
              label="Alinhar à esquerda"
              onClick={() => applyImageAlignment('left')}
            >
              <AlignHorizontalLeftOutlinedIcon fontSize="small" />
            </Tool>
            <Tool
              label="Centralizar"
              onClick={() => applyImageAlignment('center')}
            >
              <AlignHorizontalCenterOutlinedIcon fontSize="small" />
            </Tool>
            <Tool
              label="Alinhar à direita"
              onClick={() => applyImageAlignment('right')}
            >
              <AlignHorizontalRightOutlinedIcon fontSize="small" />
            </Tool>
            <Tool
              label="Em linha"
              onClick={() => applyImageAlignment('inline')}
            >
              <ViewHeadlineOutlinedIcon fontSize="small" />
            </Tool>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <TextField
              aria-label="Largura da imagem"
              size="small"
              type="number"
              value={imageWidth}
              onChange={event => setImageWidth(event.target.value)}
              onBlur={applyImageWidth}
              onKeyDown={event => {
                if (event.key === 'Enter') applyImageWidth();
              }}
              sx={{ width: 82, '& input': { py: 0.75 } }}
            />
            <Select
              size="small"
              value={imageWidthUnit}
              onChange={event => setImageWidthUnit(event.target.value)}
              sx={{ height: 32, minWidth: 62 }}
            >
              <MenuItem value="px">px</MenuItem>
              <MenuItem value="%">%</MenuItem>
            </Select>
            <Button size="small" onClick={applyImageWidth}>
              Aplicar
            </Button>
            <Tool label="Restaurar tamanho" onClick={restoreImageSize}>
              <RestartAltOutlinedIcon fontSize="small" />
            </Tool>
            <Tool label="Remover imagem" onClick={removeSelectedImage}>
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </Tool>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

EntidadeRichEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};
export default EntidadeRichEditor;
