import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import IconeMarcador from 'components/Grid/IconeMarcador';
import {
  COR_MARCADOR_PADRAO,
  CORES_MARCADOR,
  ICONE_MARCADOR_PADRAO,
  ICONES_MARCADOR,
  MARCADOR_TEXTO_MAX,
  MARCADOR_TITULO_MAX,
  montarMarcador,
  validarMarcador,
} from 'common/utils/gridMarcadores';

import { OPCOES_TAMANHO_TOKEN } from './gridMestre';

/**
 * Cria ou edita um marcador do mapa (Fase 3B): título, texto, tamanho
 * (1×1 … 10×10, como o token), ícone, cor e "Só o mestre vê". `marcador` (com id) = edição; senão `celula` = criação.
 * Quem monta usa `key` para recomeçar o formulário a cada abertura.
 */
const MarcadorDialog = ({
  marcador = null,
  celula = null,
  onSalvar,
  onApagar,
  onClose,
}) => {
  const [titulo, setTitulo] = useState(marcador?.titulo ?? '');
  const [texto, setTexto] = useState(marcador?.texto ?? '');
  const [tamanho, setTamanho] = useState(marcador?.tamanho ?? 1);
  const [icone, setIcone] = useState(marcador?.icone ?? ICONE_MARCADOR_PADRAO);
  const [cor, setCor] = useState(marcador?.cor ?? COR_MARCADOR_PADRAO);
  const [secreto, setSecreto] = useState(marcador?.secreto ?? false);
  const [tocado, setTocado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const posicao = marcador ?? celula;
  const montado = montarMarcador({
    col: posicao?.col ?? 0,
    lin: posicao?.lin ?? 0,
    tamanho,
    icone,
    cor,
    titulo,
    texto,
    secreto,
  });
  const erro = validarMarcador(montado);

  const executar = async acao => {
    setSalvando(true);
    try {
      await acao();
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvar = event => {
    event.preventDefault();
    setTocado(true);
    if (erro) return;
    executar(() =>
      onSalvar({
        tamanho: montado.tamanho,
        icone: montado.icone,
        cor: montado.cor,
        titulo: montado.titulo,
        texto: montado.texto,
        secreto: montado.secreto,
      }),
    );
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSalvar} noValidate>
        <DialogTitle>
          {marcador ? 'Editar marcador' : 'Novo marcador'}
        </DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <TextField
            size="small"
            label="Título"
            value={titulo}
            onChange={event => setTitulo(event.target.value)}
            onBlur={() => setTocado(true)}
            error={tocado && Boolean(erro)}
            helperText={tocado && erro ? erro : ' '}
            slotProps={{ htmlInput: { maxLength: MARCADOR_TITULO_MAX } }}
            sx={{ mt: 1 }}
          />
          <TextField
            size="small"
            label="Texto (opcional)"
            value={texto}
            onChange={event => setTexto(event.target.value)}
            multiline
            minRows={3}
            maxRows={8}
            slotProps={{ htmlInput: { maxLength: MARCADOR_TEXTO_MAX } }}
            helperText={`${texto.length}/${MARCADOR_TEXTO_MAX}`}
          />
          <TextField
            select
            size="small"
            label="Tamanho"
            value={tamanho}
            onChange={event => setTamanho(event.target.value)}
            sx={{ maxWidth: 160 }}
          >
            {OPCOES_TAMANHO_TOKEN.map(opcao => (
              <MenuItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </MenuItem>
            ))}
          </TextField>
          <Box>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              Ícone
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              aria-label="Ícone"
              value={icone}
              onChange={(_, novo) => novo !== null && setIcone(novo)}
              sx={{ display: 'flex', flexWrap: 'wrap', mt: 0.5 }}
            >
              {ICONES_MARCADOR.map(item => (
                <ToggleButton
                  key={item.id}
                  value={item.id}
                  sx={{
                    textTransform: 'none',
                    flexDirection: 'column',
                    gap: 0.25,
                    px: 1,
                    fontSize: 11,
                  }}
                >
                  <IconeMarcador icone={item.id} fontSize="small" />
                  {item.rotulo}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              Cor
            </Typography>
            <Box
              role="radiogroup"
              aria-label="Cor"
              sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}
            >
              {CORES_MARCADOR.map(valor => (
                <Box
                  key={valor}
                  component="button"
                  type="button"
                  role="radio"
                  aria-checked={cor === valor}
                  aria-label={`Cor ${valor}`}
                  onClick={() => setCor(valor)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: valor,
                    cursor: 'pointer',
                    border:
                      cor === valor
                        ? '3px solid var(--color-primary)'
                        : '2px solid var(--border-primary)',
                  }}
                />
              ))}
            </Box>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={secreto}
                onChange={event => setSecreto(event.target.checked)}
              />
            }
            label="Só o mestre vê"
          />
        </DialogContent>
        <DialogActions>
          {marcador && (
            <Button
              color="error"
              disabled={salvando}
              onClick={() => executar(onApagar)}
              sx={{ mr: 'auto' }}
            >
              Apagar
            </Button>
          )}
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

MarcadorDialog.propTypes = {
  marcador: PropTypes.shape({
    id: PropTypes.string.isRequired,
    col: PropTypes.number.isRequired,
    lin: PropTypes.number.isRequired,
    tamanho: PropTypes.number,
    icone: PropTypes.string,
    cor: PropTypes.string,
    titulo: PropTypes.string,
    texto: PropTypes.string,
    secreto: PropTypes.bool,
  }),
  celula: PropTypes.shape({
    col: PropTypes.number.isRequired,
    lin: PropTypes.number.isRequired,
  }),
  onSalvar: PropTypes.func.isRequired,
  onApagar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default MarcadorDialog;
