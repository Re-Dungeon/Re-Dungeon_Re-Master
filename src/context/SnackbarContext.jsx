import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SnackbarContext = createContext(null);

/**
 * Feedback visual para falhas de escrita fora das telas de listagem (que já
 * têm ListLoadError com "Tentar novamente"). Sem isso, uma escrita que falha
 * (regra de segurança, sessão expirada, rede) fica silenciosa — o dado
 * simplesmente não é salvo e o mestre só percebe depois, no meio da sessão
 * (ex.: ajustar HP na Luta, mover/conectar uma Cena no canvas).
 */
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState(null);

  const notifyError = useCallback(mensagem => {
    setSnackbar({ mensagem, severity: 'error' });
  }, []);

  const handleClose = useCallback((_event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar(null);
  }, []);

  const value = useMemo(() => ({ notifyError }), [notifyError]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar ? (
          <Alert
            onClose={handleClose}
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.mensagem}
          </Alert>
        ) : undefined}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

SnackbarProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSnackbar = () => useContext(SnackbarContext);
