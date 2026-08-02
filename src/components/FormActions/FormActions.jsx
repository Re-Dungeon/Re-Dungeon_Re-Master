import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

/**
 * Footer de ações repetido em toda página `Nova`/`Novo` de entidade:
 * botão "Cancelar" (volta pra listagem) + botão de submit do Formik.
 */
const FormActions = ({ onCancelar, isSubmitting, labelSalvar }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pb: 2 }}>
    <Button onClick={onCancelar} sx={{ color: 'var(--text-muted)' }}>
      Cancelar
    </Button>
    <Button
      type="submit"
      variant="contained"
      disabled={isSubmitting}
      sx={{
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
        '&:hover': { background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent))' },
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
