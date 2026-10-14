import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { normalizeMapaTags } from './mapaUtils';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MapaViewerDialog = ({ open, mapa, onClose, onUseInCardFlux }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState(null);
  const [viewport, setViewport] = useState({ width: 900, height: 600 });
  const [showInfo, setShowInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewportRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const updateViewport = () => {
      if (!viewportRef.current) return;
      const nextWidth = Math.max(320, viewportRef.current.clientWidth || 900);
      const nextHeight = Math.max(300, viewportRef.current.clientHeight || 600);
      setViewport(prev =>
        prev.width === nextWidth && prev.height === nextHeight ? prev : { width: nextWidth, height: nextHeight },
      );
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    if (viewportRef.current) observer.observe(viewportRef.current);

    return () => observer.disconnect();
  }, [open]);

  const imageUrl = mapa?.linkImagem || '';
  const tags = normalizeMapaTags(mapa?.tags);
  const categoria = mapa?.categoria || 'Outro';

  const imageSize = useMemo(() => {
    if (!imageUrl) return { width: 1, height: 1 };
    return { width: 1600, height: 900 };
  }, [imageUrl]);

  const fitScale = useMemo(() => {
    if (!imageUrl) return 1;
    const widthScale = (viewport.width - 120) / Math.max(imageSize.width, 1);
    const heightScale = (viewport.height - 120) / Math.max(imageSize.height, 1);
    const nextScale = Math.min(widthScale, heightScale, 1.4);
    return Number(clamp(nextScale || 1, 0.4, 1.4).toFixed(2));
  }, [imageSize.height, imageSize.width, imageUrl, viewport.height, viewport.width]);

  const clampPan = (nextPan, nextZoom) => {
    if (!imageUrl) return { x: 0, y: 0 };
    const visibleWidth = imageSize.width * nextZoom;
    const visibleHeight = imageSize.height * nextZoom;
    const maxX = Math.max(0, (visibleWidth - viewport.width) / 2 + 60);
    const maxY = Math.max(0, (visibleHeight - viewport.height) / 2 + 40);
    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    };
  };

  const setZoomValue = nextValue => {
    const clamped = clamp(Number(nextValue), 0.4, 2.4);
    setZoom(clamped);
    setPan(current => clampPan(current, clamped));
  };

  const handleZoomIn = () => setZoomValue(zoom + 0.15);
  const handleZoomOut = () => setZoomValue(zoom - 0.15);
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleFitToScreen = () => {
    setZoom(fitScale);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = event => {
    if (!open) return;
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoomValue(zoom + direction * 0.12);
  };

  const handlePointerDown = event => {
    if (!imageUrl || zoom <= 1) return;
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
    setDragOrigin({ x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y });
  };

  const handlePointerMove = event => {
    if (!isDragging || !dragOrigin) return;
    const deltaX = event.clientX - dragOrigin.x;
    const deltaY = event.clientY - dragOrigin.y;
    setPan(() => clampPan({ x: dragOrigin.panX + deltaX, y: dragOrigin.panY + deltaY }, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragOrigin(null);
  };

  const toggleFullscreen = async () => {
    const target = dialogRef.current || viewportRef.current;
    if (!target) return;

    try {
      if (!document.fullscreenElement) {
        const full = target.requestFullscreen?.bind(target);
        if (full) {
          await full();
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      setIsFullscreen(value => !value);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleClose = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setDragOrigin(null);
    setShowInfo(true);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
      fullScreen={isFullscreen}
      slotProps={{
        paper: {
          sx: {
            background: 'linear-gradient(180deg, rgba(16,19,25,0.98), rgba(11,13,18,0.98))',
            border: '1px solid var(--border-primary)',
            borderRadius: isFullscreen ? 0 : 3,
            overflow: 'hidden',
            color: 'var(--text-primary)',
          },
        },
      }}
    >
      <Box ref={dialogRef} sx={{ display: 'flex', flexDirection: 'column', height: isFullscreen ? '100vh' : 'min(90vh, 920px)' }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 1.5, px: 2.5, borderBottom: '1px solid var(--border-primary)' }}>
          <Box>
            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
              {mapa?.nome || 'Mapa'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {categoria}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button type="button" variant="text" onClick={toggleFullscreen} sx={{ color: 'var(--text-primary)' }}>
              {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            </Button>
            <IconButton aria-label="Fechar visualizador de mapas" onClick={handleClose} sx={{ color: 'var(--text-primary)' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ flex: 1, p: 0, overflow: 'hidden' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: showInfo ? { xs: '1fr', lg: 'minmax(0, 1fr) 320px' } : '1fr', height: '100%', background: 'rgba(7,10,14,0.9)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, py: 1.25, borderBottom: '1px solid var(--border-primary)', background: 'rgba(12,15,21,0.9)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <IconButton aria-label="Diminuir zoom" onClick={handleZoomOut} sx={{ color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                    <ZoomOutIcon />
                  </IconButton>
                  <IconButton aria-label="Aumentar zoom" onClick={handleZoomIn} sx={{ color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                    <ZoomInIcon />
                  </IconButton>
                  <Typography sx={{ color: 'var(--text-primary)', minWidth: 58, textAlign: 'center', fontWeight: 700 }}>
                    {Math.round(zoom * 100)}%
                  </Typography>
                  <Button type="button" variant="text" onClick={handleFitToScreen} sx={{ color: 'var(--text-primary)' }}>
                    Ajustar à tela
                  </Button>
                  <Button type="button" variant="text" onClick={handleResetZoom} sx={{ color: 'var(--text-primary)' }}>
                    Restaurar zoom
                  </Button>
                </Box>

                <IconButton aria-label={showInfo ? 'Recolher painel de informações' : 'Abrir painel de informações'} onClick={() => setShowInfo(value => !value)} sx={{ color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                  <OpenInFullIcon sx={{ transform: showInfo ? 'none' : 'rotate(180deg)' }} />
                </IconButton>
              </Box>

              <Box
                ref={viewportRef}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                sx={{
                  position: 'relative',
                  flex: 1,
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at center, rgba(17,22,29,0.96), rgba(8,11,16,1))',
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              >
                {!imageUrl ? (
                  <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>
                    <Typography>Este mapa não possui imagem cadastrada.</Typography>
                  </Box>
                ) : (
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={mapa?.nome || 'Imagem do mapa'}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
                      width: `${imageSize.width}px`,
                      height: `${imageSize.height}px`,
                      objectFit: 'contain',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      transition: isDragging ? 'none' : 'transform 180ms ease',
                      boxShadow: '0 18px 40px rgba(0,0,0,0.38)',
                    }}
                  />
                )}
              </Box>
            </Box>

            {showInfo && (
              <Box sx={{ display: 'flex', flexDirection: 'column', borderLeft: { xs: 'none', lg: '1px solid var(--border-primary)' }, borderTop: { xs: '1px solid var(--border-primary)', lg: 'none' }, background: 'rgba(13,17,22,0.96)' }}>
                <Box sx={{ p: 2.5, display: 'grid', gap: 2 }}>
                  <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.15rem' }}>
                    {mapa?.nome || 'Mapa'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    <Chip label={categoria} size="small" sx={{ background: 'rgba(196,58,47,0.14)', color: 'var(--text-primary)', border: '1px solid rgba(196,58,47,0.32)' }} />
                    {tags.length > 0 ? tags.map(tag => (
                      <Chip key={`${mapa?.id || 'mapa'}-${tag}`} label={tag} size="small" sx={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)' }} />
                    )) : <Chip label="Sem tags" size="small" sx={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)' }} />}
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>Descrição</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                      {mapa?.descricao || 'Nenhuma descrição informada para este mapa.'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 0.5 }}>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>Detalhes</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Categoria: {categoria}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      Imagem: {imageUrl ? 'Disponível' : 'Indisponível'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 2.5, borderTop: '1px solid var(--border-primary)', mt: 'auto' }}>
                  <Button
                    type="button"
                    variant="contained"
                    fullWidth
                    onClick={() => onUseInCardFlux?.(mapa)}
                    sx={{ background: 'linear-gradient(135deg, rgba(196,58,47,0.88), rgba(159,18,57,0.9))', color: 'white', fontWeight: 800 }}
                  >
                    Usar no CardFlux
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'space-between', px: 2.5, py: 1.5, borderTop: '1px solid var(--border-primary)' }}>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
            Scroll do mouse para zoom • Arraste para mover
          </Typography>
          <Button type="button" onClick={handleClose} sx={{ color: 'var(--text-primary)' }}>
            Fechar
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

MapaViewerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mapa: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    categoria: PropTypes.string,
    linkImagem: PropTypes.string,
    descricao: PropTypes.string,
    tags: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  }),
  onClose: PropTypes.func.isRequired,
  onUseInCardFlux: PropTypes.func,
};

MapaViewerDialog.defaultProps = {
  mapa: null,
  onUseInCardFlux: null,
};

export default MapaViewerDialog;
