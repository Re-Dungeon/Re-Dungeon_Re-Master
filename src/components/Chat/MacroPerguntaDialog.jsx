import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';

// Perguntas feitas por uma macro Lua em execução: `inputQuery` (campo de
// texto com valor padrão) e `choose` (lista com a opção padrão marcada).
// "Cancelar macro" (ou fechar o diálogo) aborta a macro — nada é publicado.
const ConteudoPergunta = ({ pergunta }) => {
  const { macroNome, pedido, responder, cancelar } = pergunta;
  const [texto, setTexto] = useState(pedido.padrao ?? '');
  const [escolhido, setEscolhido] = useState(pedido.padrao ?? 1);
  const ehEscolha = pedido.tipo === 'choose';

  const confirmar = event => {
    event.preventDefault();
    responder(ehEscolha ? escolhido : texto);
  };

  return (
    <form onSubmit={confirmar} noValidate>
      <DialogTitle sx={{ pb: 1 }}>⚙ {macroNome}</DialogTitle>
      <DialogContent>
        {ehEscolha ? (
          <>
            <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>
              {pedido.titulo}
            </p>
            <List
              dense
              sx={{ maxHeight: 360, overflowY: 'auto' }}
              aria-label={pedido.titulo}
            >
              {pedido.opcoes.map((opcao, posicao) => {
                const indice = posicao + 1;
                return (
                  <ListItemButton
                    // Índice como key: a lista vem pronta da macro e não muda.
                    key={indice}
                    selected={indice === escolhido}
                    onClick={() => setEscolhido(indice)}
                    onDoubleClick={() => responder(indice)}
                  >
                    <ListItemText primary={opcao} />
                  </ListItemButton>
                );
              })}
            </List>
          </>
        ) : (
          <TextField
            fullWidth
            margin="dense"
            label={pedido.pergunta || 'Resposta'}
            value={texto}
            onChange={event => setTexto(event.target.value)}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={cancelar} color="inherit">
          Cancelar macro
        </Button>
        <Button type="submit" variant="contained">
          OK
        </Button>
      </DialogActions>
    </form>
  );
};

ConteudoPergunta.propTypes = {
  pergunta: PropTypes.shape({
    id: PropTypes.number.isRequired,
    macroNome: PropTypes.string.isRequired,
    pedido: PropTypes.object.isRequired,
    responder: PropTypes.func.isRequired,
    cancelar: PropTypes.func.isRequired,
  }).isRequired,
};

const MacroPerguntaDialog = ({ pergunta = null }) => (
  <Dialog
    open={Boolean(pergunta)}
    onClose={() => pergunta?.cancelar()}
    fullWidth
    maxWidth="sm"
  >
    {/* key = id da pergunta: cada pergunta nova recomeça com o padrão dela. */}
    {pergunta && <ConteudoPergunta key={pergunta.id} pergunta={pergunta} />}
  </Dialog>
);

MacroPerguntaDialog.propTypes = {
  pergunta: PropTypes.object,
};

export default MacroPerguntaDialog;
