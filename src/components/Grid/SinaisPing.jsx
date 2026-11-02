import React from 'react';
import PropTypes from 'prop-types';

import { SinalPing, SinalPingNome } from './styles';

// Anéis dos sinais no mapa (cópia nos dois sites — mudou um, mude o outro),
// em px do VIEWPORT: `pings` em px do mundo (useGridPings) convertidos pela
// `vista` atual do GridMapa. Cor por pessoa, nome embaixo.
const SinaisPing = ({ pings, vista }) =>
  pings.map(ping => (
    <SinalPing
      key={ping.chave}
      data-ping={ping.uid}
      style={{
        left: vista.x + ping.x * vista.zoom,
        top: vista.y + ping.y * vista.zoom,
        '--cor': ping.cor,
      }}
    >
      {ping.nome && <SinalPingNome>{ping.nome}</SinalPingNome>}
    </SinalPing>
  ));

SinaisPing.propTypes = {
  pings: PropTypes.arrayOf(
    PropTypes.shape({
      chave: PropTypes.string.isRequired,
      uid: PropTypes.string.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      nome: PropTypes.string,
      cor: PropTypes.string,
    }),
  ).isRequired,
  vista: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    zoom: PropTypes.number.isRequired,
  }).isRequired,
};

export default SinaisPing;
