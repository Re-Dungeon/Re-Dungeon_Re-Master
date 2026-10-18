import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { isUrlImagemValida } from 'common/utils/chat';

import { PreviewImagem } from './styles';

const AJUDA =
  'Cole o endereço direto da imagem ou GIF (botão direito → "Copiar endereço da imagem"). ' +
  'Links de página como tenor.com/view/... não funcionam.';

const ImagemUrlDialog = ({ open, onClose, onConfirmar }) => {
  const [url, setUrl] = useState('');
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const valida = isUrlImagemValida(url);
  const mostrarErro = tocado && url.trim() !== '' && !valida;

  const fechar = () => {
    setUrl('');
    setTocado(false);
    onClose();
  };

  const confirmar = async event => {
    event.preventDefault();
    setTocado(true);
    if (!valida) return;
    setEnviando(true);
    try {
      await onConfirmar(url.trim());
      setUrl('');
      setTocado(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="sm">
      <form onSubmit={confirmar} noValidate>
        <DialogTitle>Enviar imagem ou GIF</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            label="URL da imagem"
            value={url}
            onChange={event => setUrl(event.target.value)}
            onBlur={() => setTocado(true)}
            error={mostrarErro}
            helperText={
              mostrarErro
                ? 'URL inválida: use um link https direto para .gif/.png/.jpg/.webp'
                : AJUDA
            }
          />
          {valida && (
            <PreviewImagem
              src={url.trim()}
              alt="Pré-visualização"
              referrerPolicy="no-referrer"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={fechar}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!valida || enviando}
          >
            Enviar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

ImagemUrlDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirmar: PropTypes.func.isRequired,
};

export default ImagemUrlDialog;
