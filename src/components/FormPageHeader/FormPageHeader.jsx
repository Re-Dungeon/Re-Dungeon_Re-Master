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
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
    <Button
      onClick={onVoltar}
      sx={{
        color: 'var(--text-muted)',
        minWidth: 'auto',
        px: 1,
        '&:hover': { color: 'var(--text-primary)' },
      }}
    >
      ← Voltar
    </Button>
    <Box>
      <Typography
        variant="h5"
        sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
      >
        {titulo}
      </Typography>
      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
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
