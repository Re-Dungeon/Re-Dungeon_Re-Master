import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';

/**
 * Título de seção repetido em toda página `Nova`/`Novo` de entidade
 * (ex. "Informações Gerais", "Efeitos", "Habilidades Básicas").
 */
const SectionTitle = ({ children }) => (
  <Typography
    variant="subtitle2"
    sx={{
      color: 'var(--color-accent)',
      fontWeight: 700,
      mt: 1,
      mb: 0.5,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: '0.72rem',
    }}
  >
    {children}
  </Typography>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SectionTitle;
