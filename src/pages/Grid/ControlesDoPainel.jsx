import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MinimizeIcon from '@mui/icons-material/Minimize';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { MOBILE_QUERY, painelMinimizadoSx } from './styles';

// Botões do cabeçalho dos painéis laterais do mapa (token e ações em lote):
// trocar de lado (some no celular, onde o painel é uma folha na base) e
// minimizar numa barrinha.
export const ControlesDoPainel = ({ lado, onTrocarLado, onMinimizar }) => (
  <>
    <IconButton
      size="small"
      aria-label={
        lado === 'left'
          ? 'Mover painel para a direita'
          : 'Mover painel para a esquerda'
      }
      title={
        lado === 'left'
          ? 'Mover para o lado direito do mapa'
          : 'Mover para o lado esquerdo do mapa'
      }
      onClick={onTrocarLado}
      sx={{ [MOBILE_QUERY]: { display: 'none' } }}
    >
      <SwapHorizIcon fontSize="small" />
    </IconButton>
    <IconButton
      size="small"
      aria-label="Minimizar painel"
      title="Minimizar"
      onClick={onMinimizar}
    >
      <MinimizeIcon fontSize="small" />
    </IconButton>
  </>
);

ControlesDoPainel.propTypes = {
  lado: PropTypes.oneOf(['left', 'right']).isRequired,
  onTrocarLado: PropTypes.func.isRequired,
  onMinimizar: PropTypes.func.isRequired,
};

// O painel recolhido: uma barrinha com o título; um clique expande.
export const PainelMinimizado = ({
  lado,
  abaixoDaFaixa = false,
  titulo,
  rotulo,
  onExpandir,
}) => (
  <Box sx={painelMinimizadoSx(lado, abaixoDaFaixa)} data-painel-lateral="">
    <ButtonBase
      aria-label={`Expandir ${rotulo}`}
      title="Expandir"
      onClick={onExpandir}
      sx={{
        width: '100%',
        justifyContent: 'space-between',
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 'inherit',
      }}
    >
      <Typography
        noWrap
        sx={{ color: 'var(--text-primary)', fontWeight: 700, minWidth: 0 }}
      >
        {titulo}
      </Typography>
      <ExpandMoreIcon fontSize="small" />
    </ButtonBase>
  </Box>
);

PainelMinimizado.propTypes = {
  lado: PropTypes.oneOf(['left', 'right']).isRequired,
  abaixoDaFaixa: PropTypes.bool,
  titulo: PropTypes.string.isRequired,
  // Nome do painel para o leitor de tela ("painel do token").
  rotulo: PropTypes.string.isRequired,
  onExpandir: PropTypes.func.isRequired,
};
