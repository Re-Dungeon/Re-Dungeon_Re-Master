import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CartaDetalhe from './CartaDetalhe';

/**
 * Visualização completa de uma carta do `cardflux` — usada no resultado do
 * "Puxar Carta" do CardFlux. As cartas vêm prontas do projeto irmão, então
 * este dialog só exibe os campos do doc (sem formulário/edição).
 */
const CartaDetalheDialog = ({ open, onClose, carta }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{ color: 'var(--text-primary)', fontWeight: 700, pb: 1 }}
      >
        {carta?.nome}
        {(carta?.tipo || carta?.raridade) && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'var(--color-accent)',
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            {[carta.tipo, carta.raridade].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'var(--border-primary)' }}>
        <CartaDetalhe carta={carta} />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { color: 'var(--text-primary)' },
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
