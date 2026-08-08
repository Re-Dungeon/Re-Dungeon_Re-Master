import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Footer de ações repetido em toda página `Nova`/`Novo` de entidade:
 * botão "Cancelar" (volta pra listagem) + botão de submit do Formik.
 */
const FormActions = ({ onCancelar, isSubmitting, labelSalvar }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pb: 2 }}>
    <Button
      onClick={onCancelar}
      variant="outlined"
      sx={{
        color: 'var(--text-secondary)',
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: '10px',
        px: 2,
        '&:hover': { borderColor: 'rgba(255,255,255,0.12)' },
      }}
    >
      Cancelar
    </Button>
    <Button
      type="submit"
      variant="contained"
      disabled={isSubmitting}
      startIcon={<SaveIcon />}
      sx={{
        background: 'linear-gradient(135deg, rgba(196,58,47,1), rgba(143,35,28,1))',
        color: '#fff',
        borderRadius: '10px',
        px: 3,
        boxShadow: '0 10px 30px rgba(196,58,47,0.18)',
        transform: 'translateY(0)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 18px 40px rgba(196,58,47,0.22)' },
      }}
    >
      {labelSalvar}
    </Button>
  </Box>
);

FormActions.propTypes = {
  onCancelar: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  labelSalvar: PropTypes.node.isRequired,
};

export default FormActions;
