import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import {
  GRID_CELULA_MAX,
  GRID_CELULA_MIN,
  GRID_DESLOCAMENTO_MAX,
  normalizarConfigGrid,
  validarConfigGrid,
} from 'common/utils/grid';
import { painelCabecalhoSx, painelSx } from './styles';

const paraValores = config => ({
  imagemUrl: config.imagemUrl ?? '',
  celula: String(config.celula),
  deslocamentoX: String(config.deslocamentoX),
  deslocamentoY: String(config.deslocamentoY),
  mostrarGrade: config.mostrarGrade,
  corGrade: config.corGrade,
  opacidadeGrade: config.opacidadeGrade,
});

const SEM_MAPA = '';

/**
 * Configuração do grid pelo mestre: imagem de fundo (link ou um dos Mapas da
 * campanha) e a grade desenhada por cima — tamanho da célula em px da imagem
 * e deslocamento para alinhar com o quadriculado da própria imagem. Cada
 * alteração válida vira prévia ao vivo no mapa (`onPrevia`); nada é gravado
 * até "Salvar grid".
 */
const GridConfigPainel = ({ config, mapas, onPrevia, onSalvar, onFechar }) => {
  const [valores, setValores] = useState(() => paraValores(config));
  const [salvando, setSalvando] = useState(false);

  const normalizada = normalizarConfigGrid(valores);
  const erro = validarConfigGrid(normalizada);

  const alterar = (campo, valor) => {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    const previa = normalizarConfigGrid(novos);
    onPrevia(validarConfigGrid(previa) ? null : previa);
  };

  const mapaSelecionado =
    mapas.find(mapa => mapa.linkImagem === valores.imagemUrl.trim())?.id ??
    SEM_MAPA;

  const handleSalvar = async () => {
    if (erro) return;
    setSalvando(true);
    try {
      await onSalvar(normalizada);
    } finally {
      setSalvando(false);
    }
  };

  const campoNumero = (campo, label, max) => (
    <TextField
      size="small"
      type="number"
      label={label}
      value={valores[campo]}
      onChange={event => alterar(campo, event.target.value)}
      slotProps={{ htmlInput: { min: 0, max, step: 1 } }}
    />
  );

  return (
    <Box
      sx={{ ...painelSx, right: 12 }}
      role="region"
      aria-label="Configurar grid"
    >
      <Box sx={painelCabecalhoSx}>
        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          Configurar grid
        </Typography>
        <IconButton
          size="small"
          aria-label="Fechar configuração"
          onClick={onFechar}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {mapas.length > 0 && (
        <TextField
          select
          size="small"
          label="Mapa da campanha"
          value={mapaSelecionado}
          onChange={event => {
            const mapa = mapas.find(m => m.id === event.target.value);
            if (mapa) alterar('imagemUrl', mapa.linkImagem);
          }}
        >
          <MenuItem value={SEM_MAPA}>Link próprio</MenuItem>
          {mapas.map(mapa => (
            <MenuItem key={mapa.id} value={mapa.id}>
              {mapa.nome}
            </MenuItem>
          ))}
        </TextField>
      )}
      <TextField
        size="small"
        label="Imagem do grid (link https://)"
        value={valores.imagemUrl}
        onChange={event => alterar('imagemUrl', event.target.value)}
        helperText="Em branco: grid vazio."
      />
      {campoNumero(
        'celula',
        `Tamanho da célula (px, ${GRID_CELULA_MIN}–${GRID_CELULA_MAX})`,
        GRID_CELULA_MAX,
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {campoNumero('deslocamentoX', 'Deslocamento X', GRID_DESLOCAMENTO_MAX)}
        {campoNumero('deslocamentoY', 'Deslocamento Y', GRID_DESLOCAMENTO_MAX)}
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={valores.mostrarGrade}
            onChange={event => alterar('mostrarGrade', event.target.checked)}
          />
        }
        label="Mostrar grade"
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography
          component="label"
          htmlFor="grid-cor-grade"
          variant="body2"
          sx={{ color: 'var(--text-secondary)' }}
        >
          Cor
        </Typography>
        <input
          id="grid-cor-grade"
          type="color"
          value={valores.corGrade}
          onChange={event => alterar('corGrade', event.target.value)}
        />
        <Slider
          size="small"
          aria-label="Opacidade da grade"
          min={0}
          max={1}
          step={0.05}
          value={valores.opacidadeGrade}
          onChange={(_event, valor) => alterar('opacidadeGrade', valor)}
        />
      </Box>

      {erro && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          {erro}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSalvar}
          disabled={Boolean(erro) || salvando}
        >
          Salvar grid
        </Button>
      </Box>
    </Box>
  );
};

GridConfigPainel.propTypes = {
  config: PropTypes.shape({
    imagemUrl: PropTypes.string,
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
    mostrarGrade: PropTypes.bool.isRequired,
    corGrade: PropTypes.string.isRequired,
    opacidadeGrade: PropTypes.number.isRequired,
  }).isRequired,
  mapas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
      linkImagem: PropTypes.string.isRequired,
    }),
  ).isRequired,
  onPrevia: PropTypes.func.isRequired,
  onSalvar: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
};

export default GridConfigPainel;
