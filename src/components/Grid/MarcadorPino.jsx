import React from 'react';
import PropTypes from 'prop-types';
import Lock from '@mui/icons-material/Lock';

import { posicaoEmPx } from 'common/utils/grid';

import IconeMarcador from './IconeMarcador';
import { PinoCadeado, PinoMarcador } from './stylesMapa';

// Pino de marcador no mapa (cópia nos dois sites — mudou um, mude o outro),
// em px do MUNDO, centrado na célula. Marcador secreto (só o mestre o recebe)
// ganha contorno tracejado e cadeado.
const MarcadorPino = ({ marcador, config, mestre = false, onClick }) => {
  const lado = Math.round(config.celula * 0.6);
  const { x, y } = posicaoEmPx(config, marcador.col, marcador.lin);
  const secreto = Boolean(marcador.secreto) && mestre;
  return (
    <PinoMarcador
      type="button"
      data-marcador-id={marcador.id}
      data-secreto={secreto ? 'true' : 'false'}
      aria-label={`Marcador: ${marcador.titulo}`}
      onClick={onClick ? () => onClick(marcador) : undefined}
      style={{
        left: x + (config.celula - lado) / 2,
        top: y + (config.celula - lado) / 2,
        width: lado,
        height: lado,
        '--cor': marcador.cor,
      }}
    >
      <IconeMarcador icone={marcador.icone} />
      {secreto && (
        <PinoCadeado data-cadeado="">
          <Lock aria-hidden="true" />
        </PinoCadeado>
      )}
    </PinoMarcador>
  );
};

MarcadorPino.propTypes = {
  marcador: PropTypes.shape({
    id: PropTypes.string.isRequired,
    col: PropTypes.number.isRequired,
    lin: PropTypes.number.isRequired,
    icone: PropTypes.string,
    cor: PropTypes.string,
    titulo: PropTypes.string,
    secreto: PropTypes.bool,
  }).isRequired,
  config: PropTypes.shape({
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
  }).isRequired,
  mestre: PropTypes.bool,
  onClick: PropTypes.func,
};

export default MarcadorPino;
