import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

/**
 * Estado de erro reaproveitado em toda lista que busca dados do Firestore
 * (`useEntityCRUD`/`useCampanhaGrafo`) — mesmo visual do `empty-state`, com
 * um botão para tentar buscar de novo em vez de deixar a tela em branco.
 */
const ListLoadError = ({ mensagem = 'Não foi possível carregar os dados agora.', onRetry }) => (
  <Box className="empty-state">
    <span className="empty-state-icon">⚠️</span>
    <p>{mensagem}</p>
    <Button
      variant="outlined"
      onClick={onRetry}
      sx={{
        mt: 2,
        color: 'var(--color-accent)',
        borderColor: 'var(--color-accent)',
      }}
    >
      Tentar novamente
    </Button>
  </Box>
);

ListLoadError.propTypes = {
  mensagem: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

export default ListLoadError;
