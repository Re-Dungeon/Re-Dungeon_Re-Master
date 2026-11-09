import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

// Confirmação de ação destrutiva (excluir). Cópia compartilhada entre o site
// dos jogadores e o Re:Master (scripts/check-shared.mjs).
// - `consequencias`: o que vai junto (ex.: "3 Artes e 2 Variantes deste Núcleo").
// - `exigirDigitar`: texto que precisa ser digitado para liberar o botão
//   (ex.: o nome da campanha) — para o que não tem volta e apaga muita coisa.
// - `onConfirmar` pode ser async: o botão fica ocupado até terminar; se
//   lançar erro, o diálogo continua aberto (quem chamou mostra o erro).
const ConfirmDialogConteudo = ({
  titulo,
  mensagem,
  consequencias,
  confirmarTexto,
  exigirDigitar,
  onConfirmar,
  onCancelar,
}) => {
  const [digitado, setDigitado] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const liberado = !exigirDigitar || digitado.trim() === exigirDigitar.trim();

  const confirmar = async event => {
    event.preventDefault();
    if (!liberado || ocupado) return;
    setOcupado(true);
    try {
      await onConfirmar();
    } catch {
      // Quem chamou já trata/mostra o erro; o diálogo segue aberto.
    } finally {
      setOcupado(false);
    }
  };

  return (
    <form onSubmit={confirmar}>
      <DialogTitle id="confirm-dialog-titulo">{titulo}</DialogTitle>
      <DialogContent>
        {mensagem && <DialogContentText>{mensagem}</DialogContentText>}
        {consequencias.length > 0 && (
          <>
            <DialogContentText sx={{ mt: mensagem ? 1.5 : 0 }}>
              Também será apagado:
            </DialogContentText>
            <ul
              style={{
                margin: '4px 0 0',
                paddingLeft: 20,
                color: 'var(--text-secondary)',
              }}
            >
              {consequencias.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
        {exigirDigitar && (
          <TextField
            fullWidth
            size="small"
            margin="normal"
            label={`Digite "${exigirDigitar}" para confirmar`}
            value={digitado}
            onChange={event => setDigitado(event.target.value)}
            autoComplete="off"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </Button>
        <Button
          type="submit"
          color="error"
          variant="contained"
          disabled={!liberado || ocupado}
        >
          {ocupado ? 'Excluindo…' : confirmarTexto}
        </Button>
      </DialogActions>
    </form>
  );
};

ConfirmDialogConteudo.propTypes = {
  titulo: PropTypes.string.isRequired,
  mensagem: PropTypes.node,
  consequencias: PropTypes.arrayOf(PropTypes.string).isRequired,
  confirmarTexto: PropTypes.string.isRequired,
  exigirDigitar: PropTypes.string,
  onConfirmar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

const ConfirmDialog = ({
  open,
  titulo,
  mensagem = null,
  consequencias = [],
  confirmarTexto = 'Excluir',
  exigirDigitar = null,
  onConfirmar,
  onCancelar,
}) => (
  <Dialog
    open={open}
    onClose={onCancelar}
    maxWidth="xs"
    fullWidth
    aria-labelledby="confirm-dialog-titulo"
  >
    {/* Conteúdo só montado aberto: o texto digitado zera a cada abertura. */}
    {open && (
      <ConfirmDialogConteudo
        titulo={titulo}
        mensagem={mensagem}
        consequencias={consequencias.filter(Boolean)}
        confirmarTexto={confirmarTexto}
        exigirDigitar={exigirDigitar}
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />
    )}
  </Dialog>
);

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  titulo: PropTypes.string.isRequired,
  mensagem: PropTypes.node,
  consequencias: PropTypes.arrayOf(PropTypes.string),
  confirmarTexto: PropTypes.string,
  exigirDigitar: PropTypes.string,
  onConfirmar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

export default ConfirmDialog;
