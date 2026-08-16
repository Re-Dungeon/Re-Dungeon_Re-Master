import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import CartaDetalhe from './CartaDetalhe';

const CartaDetalheDialog = ({ open, onClose, carta }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background:
              'linear-gradient(180deg, rgba(22, 27, 34, 0.98), rgba(13, 16, 21, 0.98))',
            border: '1px solid rgba(196, 58, 47, 0.22)',
            borderRadius: 3,
            boxShadow: '0 20px 42px rgba(0,0,0,0.28)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: 'var(--text-primary)',
          fontWeight: 800,
          px: 3,
          py: 2.5,
          borderBottom: '1px solid var(--border-primary)',
          background: 'rgba(196, 58, 47, 0.04)',
        }}
      >
        {(carta?.tipo || carta?.raridade) && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'var(--color-accent)',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {[carta.tipo, carta.raridade].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'var(--border-primary)', p: 0 }}>
        <Box sx={{ p: 3 }}>
          <CartaDetalhe carta={carta} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid var(--border-primary)' }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-primary)',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2,
            px: 2,
            '&:hover': { background: 'rgba(255,255,255,0.05)' },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CartaDetalheDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  carta: PropTypes.shape({
    nome: PropTypes.string,
    tipo: PropTypes.string,
    raridade: PropTypes.string,
    deck: PropTypes.string,
    peso: PropTypes.number,
    cd: PropTypes.number,
    intensidade: PropTypes.number,
    tags: PropTypes.string,
    linkImagem: PropTypes.string,
    descricaoGeral: PropTypes.string,
    comoApresentar: PropTypes.string,
    mecanicasDesafios: PropTypes.string,
    seConseguirem: PropTypes.string,
    seFalharem: PropTypes.string,
    recompensas: PropTypes.string,
    impactoMundo: PropTypes.string,
    ganchosNarrativos: PropTypes.string,
  }),
};

CartaDetalheDialog.defaultProps = {
  carta: null,
};

export default CartaDetalheDialog;
