import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';

/**
 * Dialog de visualização repetido em toda página de listagem de entidade:
 * título + subtítulo (ex. universo/raridade), imagem opcional e descrição.
 * Conteúdo específico de cada entidade (atributos, habilidades, etc.) entra
 * via `children`, renderizado logo após a descrição.
 */
const EntityViewDialog = ({
  open,
  onClose,
  titulo = null,
  subtitulo = null,
  imagem = null,
  imagemSx = null,
  descricao = null,
  children = null,
  actions = null,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    PaperProps={{
      sx: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 2,
      },
    }}
  >
    <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 700, pb: 1 }}>
      {titulo}
      {subtitulo && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: 'var(--color-accent)',
            fontWeight: 600,
            mt: 0.5,
          }}
        >
          {subtitulo}
        </Typography>
      )}
    </DialogTitle>
    <DialogContent dividers sx={{ borderColor: 'var(--border-primary)' }}>
      {imagem && (
        <Box
          component="img"
          src={imagem}
          alt={titulo}
          sx={{
            width: '100%',
            height: 200,
            borderRadius: 2,
            objectFit: 'cover',
            display: 'block',
            border: '1px solid var(--border-primary)',
            mb: 2,
            ...imagemSx,
          }}
          onError={e => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      {descricao && (
        <>
          <Typography
            variant="subtitle2"
            sx={{
              color: 'var(--color-accent)',
              fontWeight: 700,
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: '0.72rem',
            }}
          >
            Descrição
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', mb: 2 }}
          >
            {descricao}
          </Typography>
        </>
      )}
      {children}
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
      {actions}
    </DialogActions>
  </Dialog>
);

EntityViewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  titulo: PropTypes.node,
  subtitulo: PropTypes.node,
  imagem: PropTypes.string,
  imagemSx: PropTypes.object,
  descricao: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
};

export default EntityViewDialog;
