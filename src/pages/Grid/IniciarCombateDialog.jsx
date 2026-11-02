import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  linhaParticipanteSx,
  listaParticipantesSx,
  nomeParticipanteSx,
} from './styles';

const numeroReacao = texto => {
  const valor = Number(String(texto ?? '').replace(',', '.'));
  return Number.isFinite(valor) ? Math.round(valor) : 0;
};

/**
 * "Iniciar combate": escolhe quem entra (todos os tokens da cena começam
 * marcados, ocultos inclusive) e confirma com "Rolar iniciativa e iniciar" —
 * o mestre rola 1d20 + Reação por todos. A Reação vem da ficha quando o token
 * tem uma (`reacaoDoToken`); senão o mestre informa (padrão 0). Quem monta usa
 * montagem condicional para recomeçar a seleção a cada abertura.
 */
const IniciarCombateDialog = ({
  open,
  tokens,
  reacaoDoToken,
  onIniciar,
  onClose,
}) => {
  const [marcados, setMarcados] = useState(
    () => new Set(tokens.map(token => token.id)),
  );
  const [manuais, setManuais] = useState({});
  const [iniciando, setIniciando] = useState(false);

  const alternar = id =>
    setMarcados(atual => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const handleIniciar = async event => {
    event.preventDefault();
    const participantes = tokens
      .filter(token => marcados.has(token.id))
      .map(token => ({
        tokenId: token.id,
        reacao: reacaoDoToken(token) ?? numeroReacao(manuais[token.id]),
      }));
    if (participantes.length === 0) return;
    setIniciando(true);
    try {
      await onIniciar(participantes);
    } finally {
      setIniciando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleIniciar} noValidate>
        <DialogTitle>Iniciar combate</DialogTitle>
        <DialogContent>
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', mb: 1 }}
          >
            Quem entra no combate? O mestre rola 1d20 + Reação por todos.
          </Typography>
          <Box component="ul" sx={listaParticipantesSx}>
            {tokens.map(token => {
              const daFicha = reacaoDoToken(token);
              return (
                <Box component="li" key={token.id} sx={linhaParticipanteSx}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={marcados.has(token.id)}
                        onChange={() => alternar(token.id)}
                      />
                    }
                    label={`${token.nome}${token.oculto ? ' (oculto)' : ''}`}
                    sx={{ ...nomeParticipanteSx, mr: 0 }}
                  />
                  {daFicha !== null ? (
                    <Typography
                      variant="caption"
                      sx={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                    >
                      Reação {daFicha} (da ficha)
                    </Typography>
                  ) : (
                    <TextField
                      size="small"
                      label="Reação"
                      value={manuais[token.id] ?? '0'}
                      disabled={!marcados.has(token.id)}
                      onChange={event =>
                        setManuais(atual => ({
                          ...atual,
                          [token.id]: event.target.value,
                        }))
                      }
                      slotProps={{
                        htmlInput: {
                          inputMode: 'numeric',
                          'aria-label': `Reação de ${token.nome}`,
                        },
                      }}
                      sx={{ width: 90 }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={iniciando || marcados.size === 0}
          >
            Rolar iniciativa e iniciar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

IniciarCombateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  tokens: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
      oculto: PropTypes.bool,
    }),
  ).isRequired,
  // token → Reação da ficha, ou null (o mestre informa).
  reacaoDoToken: PropTypes.func.isRequired,
  onIniciar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default IniciarCombateDialog;
