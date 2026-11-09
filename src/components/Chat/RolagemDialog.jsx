import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

import {
  FACES_PERMITIDAS,
  MAX_DADOS,
  MAX_VALOR_TERMO,
  especificacaoDoModal,
  validarEspecificacao,
} from 'common/utils/dados';

import DadoIcone from './DadoIcone';
import { GradeDados, LinhaDado } from './styles';

const PASSO_DADOS = 'dados';
const PASSO_DETALHES = 'detalhes';

const ESTADO_INICIAL = {
  passo: PASSO_DADOS,
  linhas: [],
  bonus: '0',
  obstaculo: '0',
  secreta: false,
};

const paraInteiro = valor => {
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : NaN;
};

// Diálogo do botão de dado do chat: passo 1 escolhe o tipo de dado (grade de
// ícones), passo 2 define quantidade de cada dado, bônus, obstáculo e se a
// rolagem é secreta. "Adicionar outro dado" volta à grade para misturar dados;
// escolher um dado que já está na lista só soma 1 à quantidade dele.
const RolagemDialog = ({ open, onClose, onRolar }) => {
  const [estado, setEstado] = useState(ESTADO_INICIAL);
  const [rolando, setRolando] = useState(false);
  const { passo, linhas, bonus, obstaculo, secreta } = estado;

  const atualizar = patch => setEstado(atual => ({ ...atual, ...patch }));

  const fechar = () => {
    setEstado(ESTADO_INICIAL);
    onClose();
  };

  const escolherDado = faces => {
    setEstado(atual => {
      const existente = atual.linhas.find(linha => linha.faces === faces);
      const linhasNovas = existente
        ? atual.linhas.map(linha =>
            linha.faces === faces
              ? { ...linha, quantidade: String(paraInteiro(linha.quantidade) + 1 || 1) }
              : linha,
          )
        : [...atual.linhas, { faces, quantidade: '1' }];
      return { ...atual, linhas: linhasNovas, passo: PASSO_DETALHES };
    });
  };

  const alterarQuantidade = (faces, quantidade) =>
    atualizar({ linhas: linhas.map(l => (l.faces === faces ? { ...l, quantidade } : l)) });

  const removerLinha = faces => {
    const restantes = linhas.filter(l => l.faces !== faces);
    atualizar({ linhas: restantes, passo: restantes.length ? PASSO_DETALHES : PASSO_DADOS });
  };

  const especificacao = especificacaoDoModal({
    linhas: linhas.map(l => ({ faces: l.faces, quantidade: paraInteiro(l.quantidade) })),
    bonus: paraInteiro(bonus),
    obstaculo: paraInteiro(obstaculo),
    secreta,
  });
  // `>= 0` também recusa NaN (campo com decimal/texto inválido).
  const modificadoresInvalidos = !(paraInteiro(bonus) >= 0) || !(paraInteiro(obstaculo) >= 0);
  const problema = modificadoresInvalidos
    ? `Bônus e obstáculo vão de 0 a ${MAX_VALOR_TERMO}.`
    : validarEspecificacao(especificacao);

  const rolar = async event => {
    event.preventDefault();
    if (problema || rolando) return;
    setRolando(true);
    try {
      await onRolar(especificacao);
      setEstado(ESTADO_INICIAL);
    } finally {
      setRolando(false);
    }
  };

  return (
    <Dialog open={open} onClose={fechar} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 6 }}>
        {passo === PASSO_DADOS ? 'Escolha o dado' : 'Rolar dados'}
        <IconButton
          aria-label="Fechar"
          onClick={fechar}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--text-muted)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {passo === PASSO_DADOS && (
        <>
          <DialogContent>
            <GradeDados>
              {FACES_PERMITIDAS.map(faces => (
                <button key={faces} type="button" aria-label={`d${faces}`} onClick={() => escolherDado(faces)}>
                  <DadoIcone faces={faces} sx={{ fontSize: 40 }} />
                  <span>d{faces}</span>
                </button>
              ))}
            </GradeDados>
          </DialogContent>
          {linhas.length > 0 && (
            <DialogActions>
              <Button onClick={() => atualizar({ passo: PASSO_DETALHES })}>Voltar</Button>
            </DialogActions>
          )}
        </>
      )}

      {passo === PASSO_DETALHES && (
        <form onSubmit={rolar} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {linhas.map(linha => (
              <LinhaDado key={linha.faces}>
                <DadoIcone faces={linha.faces} sx={{ fontSize: 28, color: 'var(--color-primary)' }} />
                <span>d{linha.faces}</span>
                <TextField
                  type="number"
                  size="small"
                  label={`Quantidade de d${linha.faces}`}
                  value={linha.quantidade}
                  onChange={event => alterarQuantidade(linha.faces, event.target.value)}
                  slotProps={{ htmlInput: { min: 1, max: MAX_DADOS } }}
                  sx={{ flex: 1 }}
                />
                <IconButton aria-label={`Remover d${linha.faces}`} onClick={() => removerLinha(linha.faces)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </LinhaDado>
            ))}

            <Button onClick={() => atualizar({ passo: PASSO_DADOS })} sx={{ alignSelf: 'flex-start' }}>
              + Adicionar outro dado
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                type="number"
                size="small"
                label="Bônus"
                value={bonus}
                onChange={event => atualizar({ bonus: event.target.value })}
                slotProps={{ htmlInput: { min: 0, max: MAX_VALOR_TERMO } }}
                fullWidth
              />
              <TextField
                type="number"
                size="small"
                label="Obstáculo"
                value={obstaculo}
                onChange={event => atualizar({ obstaculo: event.target.value })}
                slotProps={{ htmlInput: { min: 0, max: MAX_VALOR_TERMO } }}
                fullWidth
              />
            </Box>

            <FormControlLabel
              control={<Switch checked={secreta} onChange={event => atualizar({ secreta: event.target.checked })} />}
              label="Rolagem secreta (só você e o mestre veem)"
            />

            {problema && (
              <Typography variant="body2" role="alert" sx={{ color: 'error.main' }}>
                {problema}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={fechar}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={Boolean(problema) || rolando}>
              Rolar
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

RolagemDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRolar: PropTypes.func.isRequired,
};

export default RolagemDialog;
