import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { RolarFormula, RolarItem, RolarMotivo } from './stylesAcoes';

// Rolar em nome de um token (cópia nos dois sites — mudou um, mude o outro),
// hospedado pela página. `grupos` ([{id, titulo, itens:[{id, rotulo,
// expressao, desabilitado, motivo}]}]) vêm de useOpcoesDeRolagem; tocar num
// item rola e fecha. "Rolagem livre": expressão + rótulo opcional (Enter
// envia). `onRolar(expressao, rotulo)` devolve true ou {erro}. Com
// `permitirSecreta` (só o Re:Master liga) aparece "Secreta (só o mestre vê)" e
// `onRolar` recebe um 3º argumento `{ secreta }`; sem a prop a chamada continua
// com 2 argumentos.
const ROTULO_MAX = 100;
const SEM_GRUPOS = [];

const RolarDoTokenDialog = ({
  open,
  token,
  grupos = SEM_GRUPOS,
  carregando = false,
  permitirSecreta = false,
  onRolar,
  onClose,
}) => {
  const [expressao, setExpressao] = useState('');
  const [rotulo, setRotulo] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [secreta, setSecreta] = useState(false);

  const enviar = async (expr, rot) => {
    setEnviando(true);
    try {
      const resultado = await (permitirSecreta
        ? onRolar(expr, rot, { secreta })
        : onRolar(expr, rot));
      if (resultado && resultado.erro) {
        setErro(resultado.erro);
        return;
      }
      setErro('');
      setExpressao('');
      setRotulo('');
      onClose();
    } finally {
      setEnviando(false);
    }
  };

  const rolarLivre = () => {
    if (!expressao.trim() || enviando) return;
    enviar(expressao.trim(), rotulo.trim() || undefined);
  };

  const aoTeclar = evento => {
    if (evento.key === 'Enter') {
      evento.preventDefault();
      rolarLivre();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Rolar{token?.nome ? ` — ${token.nome}` : ''}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {carregando && <CircularProgress size={24} aria-label="Carregando opções" />}
        {grupos.map(grupo => (
          <div key={grupo.id} data-grupo-rolagem={grupo.id}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {grupo.titulo}
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {grupo.itens.map(item => (
                <RolarItem
                  key={item.id}
                  type="button"
                  disabled={Boolean(item.desabilitado) || enviando}
                  onClick={() => enviar(item.expressao, item.rotuloChat ?? item.rotulo)}
                >
                  <span>
                    {item.rotulo}
                    {item.desabilitado && item.motivo && (
                      <>
                        <br />
                        <RolarMotivo>{item.motivo}</RolarMotivo>
                      </>
                    )}
                  </span>
                  {item.expressao && <RolarFormula>{item.expressao}</RolarFormula>}
                </RolarItem>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Typography variant="subtitle2">Rolagem livre</Typography>
          <TextField
            label="Expressão"
            placeholder="2d6+3"
            size="small"
            value={expressao}
            error={Boolean(erro)}
            helperText={erro || ' '}
            onChange={evento => {
              setExpressao(evento.target.value);
              setErro('');
            }}
            onKeyDown={aoTeclar}
          />
          <TextField
            label="Rótulo (opcional)"
            size="small"
            value={rotulo}
            onChange={evento => setRotulo(evento.target.value)}
            onKeyDown={aoTeclar}
            slotProps={{ htmlInput: { maxLength: ROTULO_MAX } }}
          />
          {permitirSecreta && (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={secreta}
                  onChange={evento => setSecreta(evento.target.checked)}
                />
              }
              label="Secreta (só o mestre vê)"
            />
          )}
          <Button
            variant="contained"
            disabled={!expressao.trim() || enviando}
            onClick={rolarLivre}
            sx={{ minHeight: 44 }}
          >
            Rolar
          </Button>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

RolarDoTokenDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  token: PropTypes.shape({ nome: PropTypes.string }),
  grupos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      titulo: PropTypes.string.isRequired,
      itens: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          rotulo: PropTypes.string.isRequired,
          rotuloChat: PropTypes.string,
          expressao: PropTypes.string,
          desabilitado: PropTypes.bool,
          motivo: PropTypes.string,
        }),
      ).isRequired,
    }),
  ),
  carregando: PropTypes.bool,
  permitirSecreta: PropTypes.bool,
  onRolar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RolarDoTokenDialog;
