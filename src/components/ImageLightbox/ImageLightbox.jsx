import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CloseIcon from '@mui/icons-material/Close';

const ImageLightbox = ({ open = false, imageUrl = '', imageAlt = 'Imagem ampliada', onClose = () => {} }) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        setZoom(1);
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose, open]);

  const ajustarZoom = delta => {
    setZoom(valorAtual => Math.min(Math.max(valorAtual + delta, 1), 3));
  };

  const close = () => {
    setZoom(1);
    onClose();
  };

  if (!open || !imageUrl) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="xl"
      fullWidth
      aria-label="Visualizador de imagem"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(7, 8, 14, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          },
        },
        paper: {
          sx: {
            background: 'rgba(12, 12, 18, 0.88)',
            border: '1px solid rgba(232, 203, 133, 0.2)',
            boxShadow: '0 18px 44px rgba(0, 0, 0, 0.55)',
            borderRadius: 3,
            overflow: 'hidden',
            maxWidth: '92vw',
            maxHeight: '92vh',
            width: 'auto',
            m: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 1.5,
          py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Diminuir zoom">
            <span>
              <IconButton
                size="small"
                aria-label="Diminuir zoom"
                onClick={() => ajustarZoom(-0.25)}
                disabled={zoom <= 1}
                data-lightbox-ignore="true"
                sx={{ color: 'var(--text-primary)' }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Aumentar zoom">
            <span>
              <IconButton
                size="small"
                aria-label="Aumentar zoom"
                onClick={() => ajustarZoom(0.25)}
                disabled={zoom >= 3}
                data-lightbox-ignore="true"
                sx={{ color: 'var(--text-primary)' }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Fechar">
            <IconButton
              size="small"
              aria-label="Fechar visualização"
              onClick={close}
              data-lightbox-ignore="true"
              sx={{ color: 'var(--text-secondary)' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 1.5, sm: 2 },
          overflow: 'auto',
          background: 'rgba(0, 0, 0, 0.12)',
          maxHeight: 'calc(92vh - 64px)',
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={imageAlt}
          data-lightbox-ignore="true"
          onClick={event => event.stopPropagation()}
          sx={{
            display: 'block',
            maxWidth: 'calc(100vw - 88px)',
            maxHeight: 'calc(92vh - 110px)',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.38)',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.18s ease',
            userSelect: 'none',
            WebkitUserDrag: 'none',
          }}
        />
      </Box>
    </Dialog>
  );
};

ImageLightbox.propTypes = {
  open: PropTypes.bool,
  imageUrl: PropTypes.string,
  imageAlt: PropTypes.string,
  onClose: PropTypes.func,
};

export default ImageLightbox;
