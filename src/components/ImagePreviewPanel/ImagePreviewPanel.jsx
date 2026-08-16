import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const ImagePreviewInner = ({ src, alt }) => {
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(Boolean(src));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
          fontSize: '0.68rem',
        }}
      >
        Preview
      </Typography>
      <Box
        sx={{
          width: '100%',
          minHeight: { xs: 220, md: 300 },
          aspectRatio: '4 / 5',
          borderRadius: 2.5,
          border: '1px solid var(--border-primary)',
          background:
            'linear-gradient(180deg, rgba(15, 18, 24, 0.72), rgba(9, 11, 16, 0.9))',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 18px 32px rgba(0,0,0,0.28)',
          position: 'relative',
        }}
      >
        {src && !imgError ? (
          <>
            <Box
              component="img"
              key={src}
              src={src}
              alt={alt}
              onLoad={() => {
                setLoading(false);
                setImgError(false);
              }}
              onError={() => {
                setImgError(true);
                setLoading(false);
              }}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'opacity 220ms ease, transform 220ms ease',
                opacity: loading ? 0.6 : 1,
                display: 'block',
              }}
            />
            {loading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(10, 12, 16, 0.42)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                  }}
                >
                  Carregando preview...
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', px: 2, maxWidth: 220 }}>
            <Typography
              variant="body2"
              sx={{ color: 'var(--text-muted)', mb: 0.75, fontWeight: 600 }}
            >
              {imgError ? 'Imagem não encontrada' : 'Nenhuma imagem selecionada'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              {imgError
                ? 'A URL informada não pôde ser carregada.'
                : 'Cole uma URL válida no campo "Link da Imagem" para ver o preview.'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const ImagePreviewPanel = ({ src, alt }) => (
  <ImagePreviewInner key={src || 'empty-preview'} src={src} alt={alt} />
);

ImagePreviewInner.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
};

ImagePreviewPanel.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
};

export default ImagePreviewPanel;
