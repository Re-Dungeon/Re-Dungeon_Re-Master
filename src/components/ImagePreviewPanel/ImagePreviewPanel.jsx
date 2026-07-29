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
          border: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-muted)', textAlign: 'center', px: 2 }}
          >
            {imgError
              ? 'Imagem não encontrada'
              : 'Insira um link para ver o preview'}
          </Typography>
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
