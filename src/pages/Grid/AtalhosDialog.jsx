import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { ATALHOS_GRID } from './gridMestre';

/**
 * Lista dos atalhos de teclado do Grid (`?` ou o botão "Atalhos" da barra).
 * Os atalhos ficam desligados enquanto se digita num campo ou há um diálogo
 * aberto.
 */
const AtalhosDialog = ({ open, onClose }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>Atalhos do teclado</DialogTitle>
    <DialogContent>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          columnGap: 2,
          rowGap: 1,
          alignItems: 'baseline',
        }}
      >
        {ATALHOS_GRID.map(atalho => (
          <React.Fragment key={atalho.teclas}>
            <Box
              component="dt"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'var(--color-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              {atalho.teclas}
            </Box>
            <Box component="dd" sx={{ m: 0, color: 'var(--text-primary)' }}>
              {atalho.descricao}
            </Box>
          </React.Fragment>
        ))}
      </Box>
      <Typography
        variant="caption"
        sx={{ display: 'block', mt: 2, color: 'var(--text-muted)' }}
      >
        Desligados enquanto você digita num campo ou com um diálogo aberto.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Fechar</Button>
    </DialogActions>
  </Dialog>
);

AtalhosDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AtalhosDialog;
