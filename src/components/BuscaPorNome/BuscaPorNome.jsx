import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';

const textFieldSx = {
  mb: 3,
  maxWidth: 420,
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-accent)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
};

/**
 * Campo de busca por nome das listas de NPCs/Criaturas (a filtragem em si é
 * `filtrarPorNome`, em common/utils/busca.js). Para a grade completa de
 * filtros com Universo, use `EntityFilters`.
 */
const BuscaPorNome = ({ value, onChange, label = 'Buscar por nome' }) => (
  <TextField
    fullWidth
    size="small"
    label={label}
    value={value}
    onChange={event => onChange(event.target.value)}
    slotProps={{ inputLabel: { shrink: true } }}
    sx={textFieldSx}
  />
);

BuscaPorNome.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export default BuscaPorNome;
