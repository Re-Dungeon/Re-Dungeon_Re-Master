import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

/**
 * Painel de preview de imagem repetido em toda página `Nova`/`Novo` de
 * entidade: mostra a imagem de `src` (tipicamente `values.linkImagem` do
 * Formik) ou um placeholder quando vazio/inválido. O estado de erro é
 * interno e reseta automaticamente sempre que `src` muda (ajustado durante
 * a renderização, sem `useEffect`, seguindo o padrão recomendado pelo React
 * para "adjusting state when a prop changes").
 */
const ImagePreviewPanel = ({ src, alt }) => {
  const [lastSrc, setLastSrc] = useState(src);
  const [imgError, setImgError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (src !== lastSrc) {
    setLastSrc(src);
    setImgError(false);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Preview
      </Typography>
      <Box
        sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(10,14,22,0.6), rgba(6,8,10,0.5))',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
        }}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            onLoad={() => setLoading(false)}
            onError={() => setImgError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 320ms ease',
              opacity: loading ? 0.6 : 1,
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center', px: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: 'var(--text-muted)', mb: 0.5 }}
            >
              {imgError ? 'Imagem não encontrada' : 'Nenhuma imagem selecionada'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              Cole uma URL válida no campo &quot;Link da Imagem&quot; para ver o preview
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

ImagePreviewPanel.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string.isRequired,
};

export default ImagePreviewPanel;
