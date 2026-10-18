import React from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@mui/material/SvgIcon';

// Ícones de dado em traço (estilo "wireframe" dos poliedros), um por tipo de
// dado permitido no chat (common/utils/dados.js → FACES_PERMITIDAS).
const HEXAGONO = '12,2 21,7 21,17 12,22 3,17 3,7';

const DESENHOS = {
  4: (
    <>
      <polygon points="12,3 21.5,20 2.5,20" />
      <polyline points="12,3 12,14.5 2.5,20" />
      <line x1="12" y1="14.5" x2="21.5" y2="20" />
    </>
  ),
  6: (
    <>
      <polygon points={HEXAGONO} />
      <polyline points="3,7 12,12 21,7" />
      <line x1="12" y1="12" x2="12" y2="22" />
    </>
  ),
  8: (
    <>
      <polygon points="12,2 21,12 12,22 3,12" />
      <polyline points="3,12 12,15 21,12" />
      <polyline points="12,2 12,15 12,22" />
    </>
  ),
  10: (
    <>
      <polygon points="12,2 21.5,10.5 12,22 2.5,10.5" />
      <polyline points="2.5,10.5 12,14 21.5,10.5" />
      <polyline points="12,2 8,12.6 12,14 16,12.6 12,2" />
      <line x1="12" y1="14" x2="12" y2="22" />
    </>
  ),
  12: (
    <>
      <polygon points="12,2 21.5,9 18,20.5 6,20.5 2.5,9" />
      <polygon points="12,7 16.5,10.3 14.8,15.6 9.2,15.6 7.5,10.3" />
      <line x1="12" y1="2" x2="12" y2="7" />
      <line x1="21.5" y1="9" x2="16.5" y2="10.3" />
      <line x1="18" y1="20.5" x2="14.8" y2="15.6" />
      <line x1="6" y1="20.5" x2="9.2" y2="15.6" />
      <line x1="2.5" y1="9" x2="7.5" y2="10.3" />
    </>
  ),
  20: (
    <>
      <polygon points={HEXAGONO} />
      <polygon points="12,7.5 17,15.5 7,15.5" />
      <polyline points="3,7 12,7.5 21,7" />
      <polyline points="3,17 7,15.5 12,22 17,15.5 21,17" />
      <line x1="12" y1="2" x2="12" y2="7.5" />
      <line x1="3" y1="7" x2="7" y2="15.5" />
      <line x1="21" y1="7" x2="17" y2="15.5" />
    </>
  ),
  100: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,5.5 17.5,9 17.5,15 12,18.5 6.5,15 6.5,9" />
      <line x1="12" y1="2" x2="12" y2="5.5" />
      <line x1="20.5" y1="7" x2="17.5" y2="9" />
      <line x1="20.5" y1="17" x2="17.5" y2="15" />
      <line x1="12" y1="22" x2="12" y2="18.5" />
      <line x1="3.5" y1="17" x2="6.5" y2="15" />
      <line x1="3.5" y1="7" x2="6.5" y2="9" />
    </>
  ),
};

const DadoIcone = ({ faces, sx, ...props }) => (
  <SvgIcon
    viewBox="0 0 24 24"
    sx={{
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.4,
      strokeLinejoin: 'round',
      strokeLinecap: 'round',
      ...sx,
    }}
    {...props}
  >
    {DESENHOS[faces] ?? DESENHOS[20]}
  </SvgIcon>
);

DadoIcone.propTypes = {
  faces: PropTypes.number.isRequired,
  sx: PropTypes.object,
};

export default DadoIcone;
