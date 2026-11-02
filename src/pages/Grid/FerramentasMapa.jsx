import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import CloudIcon from '@mui/icons-material/Cloud';
import FenceIcon from '@mui/icons-material/Fence';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import PushPinIcon from '@mui/icons-material/PushPin';
import { ACOES_CAMADA, PINCEL_TAMANHOS } from 'common/utils/gridCamadas';
import {
  FERRAMENTAS,
  FORMAS_PINCEL,
  OPCOES_ACAO,
  OPCOES_FORMA,
} from './gridMestre';

const ICONES = {
  [FERRAMENTAS.MOVER]: OpenWithIcon,
  [FERRAMENTAS.PAREDES]: FenceIcon,
  [FERRAMENTAS.NEVOA]: CloudIcon,
  [FERRAMENTAS.MARCADORES]: PushPinIcon,
};

const ROTULOS = {
  [FERRAMENTAS.MOVER]: 'Mover',
  [FERRAMENTAS.PAREDES]: 'Paredes',
  [FERRAMENTAS.NEVOA]: 'Névoa',
  [FERRAMENTAS.MARCADORES]: 'Marcadores',
};

const grupoSx = { flexWrap: 'wrap' };
const toggleSx = { textTransform: 'none', px: 1.5, py: 0.25 };

// Grupo exclusivo de botões (nunca deixa o valor vazio).
const Escolha = ({ rotulo, valor, opcoes, onChange }) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    aria-label={rotulo}
    value={valor}
    onChange={(_, novo) => novo !== null && onChange(novo)}
    sx={grupoSx}
  >
    {opcoes.map(opcao => (
      <ToggleButton key={opcao.value} value={opcao.value} sx={toggleSx}>
        {opcao.label}
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);

Escolha.propTypes = {
  rotulo: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  opcoes: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.node.isRequired,
    }),
  ).isRequired,
  onChange: PropTypes.func.isRequired,
};

const OPCOES_TAMANHO = PINCEL_TAMANHOS.map(tamanho => ({
  value: tamanho,
  label: `${tamanho}×${tamanho}`,
}));

/**
 * Barra de ferramentas do mapa do mestre (Fase 3B): Mover (padrão) / Paredes /
 * Névoa / Marcadores, cada uma com as suas opções. O mapa só edita camadas
 * com uma ferramenta diferente de Mover.
 */
const FerramentasMapa = ({
  ferramenta,
  onFerramenta,
  opcoes,
  onOpcoes,
  nevoaAtiva,
  onNevoaAtiva,
  onPreencherNevoa,
  onLimparParedes,
  desabilitado = false,
}) => {
  const camada =
    ferramenta === FERRAMENTAS.PAREDES || ferramenta === FERRAMENTAS.NEVOA;
  const muda = campo => valor => onOpcoes({ ...opcoes, [campo]: valor });

  return (
    <Box
      role="toolbar"
      aria-label="Ferramentas do mapa"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        pb: 1,
      }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label="Ferramenta"
        value={ferramenta}
        onChange={(_, novo) => novo !== null && onFerramenta(novo)}
        disabled={desabilitado}
        sx={grupoSx}
      >
        {Object.values(FERRAMENTAS).map(valor => {
          const Icone = ICONES[valor];
          return (
            <ToggleButton
              key={valor}
              value={valor}
              sx={{ ...toggleSx, gap: 0.5 }}
            >
              <Icone fontSize="small" aria-hidden="true" />
              {ROTULOS[valor]}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      {ferramenta === FERRAMENTAS.NEVOA && (
        <FormControlLabel
          control={
            <Switch
              checked={nevoaAtiva}
              onChange={event => onNevoaAtiva(event.target.checked)}
            />
          }
          label="Névoa ativa"
          sx={{ mr: 0 }}
        />
      )}

      {camada && (
        <>
          <Escolha
            rotulo="Forma"
            valor={opcoes.forma}
            opcoes={OPCOES_FORMA}
            onChange={muda('forma')}
          />
          <Escolha
            rotulo="Ação"
            valor={opcoes.acao}
            opcoes={OPCOES_ACAO[ferramenta]}
            onChange={muda('acao')}
          />
          {opcoes.forma === FORMAS_PINCEL.PINCEL && (
            <Escolha
              rotulo="Tamanho do pincel"
              valor={opcoes.tamanho}
              opcoes={OPCOES_TAMANHO}
              onChange={muda('tamanho')}
            />
          )}
        </>
      )}

      {ferramenta === FERRAMENTAS.PAREDES && (
        <Button size="small" color="error" onClick={onLimparParedes}>
          Limpar todas as paredes
        </Button>
      )}

      {ferramenta === FERRAMENTAS.NEVOA && (
        <>
          <Button
            size="small"
            onClick={() => onPreencherNevoa(ACOES_CAMADA.REMOVER)}
          >
            Cobrir tudo
          </Button>
          <Button
            size="small"
            onClick={() => onPreencherNevoa(ACOES_CAMADA.ADICIONAR)}
          >
            Revelar tudo
          </Button>
          {!nevoaAtiva && (
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              Névoa desligada: os jogadores veem tudo.
            </Typography>
          )}
        </>
      )}

      {ferramenta === FERRAMENTAS.MARCADORES && (
        <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
          Toque no mapa para criar; toque num marcador para editar.
        </Typography>
      )}
    </Box>
  );
};

FerramentasMapa.propTypes = {
  ferramenta: PropTypes.oneOf(Object.values(FERRAMENTAS)).isRequired,
  onFerramenta: PropTypes.func.isRequired,
  opcoes: PropTypes.shape({
    forma: PropTypes.string.isRequired,
    acao: PropTypes.string.isRequired,
    tamanho: PropTypes.number.isRequired,
  }).isRequired,
  onOpcoes: PropTypes.func.isRequired,
  nevoaAtiva: PropTypes.bool.isRequired,
  onNevoaAtiva: PropTypes.func.isRequired,
  onPreencherNevoa: PropTypes.func.isRequired,
  onLimparParedes: PropTypes.func.isRequired,
  desabilitado: PropTypes.bool,
};

export default FerramentasMapa;
