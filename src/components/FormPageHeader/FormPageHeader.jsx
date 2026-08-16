import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

/**
 * Header repetido em toda página `Nova`/`Novo` de entidade: botão "Voltar"
 * para a listagem + título (ex. "Editar Raça"/"Nova Raça") + subtítulo.
 */
const FormPageHeader = ({ titulo, subtitulo, onVoltar }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
    <Button
      onClick={onVoltar}
      sx={{
        color: 'var(--text-secondary)',
        minWidth: 'auto',
        px: 1.5,
        py: 0.7,
        borderRadius: 1.5,
        border: '1px solid transparent',
        background: 'rgba(255,255,255,0.015)',
        transition: 'all 180ms ease',
        '&:hover': {
          color: 'var(--text-primary)',
          background: 'rgba(196, 58, 47, 0.08)',
          borderColor: 'rgba(196, 58, 47, 0.18)',
        },
      }}
    >
      ← Voltar
    </Button>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography
        variant="h4"
        sx={{
          color: 'var(--text-primary)',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.04em',
          fontSize: { xs: '1.8rem', md: '2.2rem' },
        }}
      >
        {titulo}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'var(--text-secondary)',
          fontSize: '0.82rem',
          lineHeight: 1.4,
        }}
      >
        {subtitulo}
      </Typography>
    </Box>
  </Box>
);

FormPageHeader.propTypes = {
  titulo: PropTypes.node.isRequired,
  subtitulo: PropTypes.node.isRequired,
  onVoltar: PropTypes.func.isRequired,
};

export default FormPageHeader;
