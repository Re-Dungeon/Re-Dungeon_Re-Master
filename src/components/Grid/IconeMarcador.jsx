import React from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@mui/material/SvgIcon';
import PushPin from '@mui/icons-material/PushPin';
import Warning from '@mui/icons-material/Warning';
import Diamond from '@mui/icons-material/Diamond';
import DoorFront from '@mui/icons-material/DoorFront';
import QuestionMark from '@mui/icons-material/QuestionMark';

// Ícones dos marcadores do mapa (cópia nos dois sites — mudou um, mude o
// outro). O MUI não tem caveira: desenhada aqui (olhos e nariz vazados).
const Caveira = props => (
  <SvgIcon {...props}>
    <path
      fillRule="evenodd"
      d="M12 2C7.6 2 4 5.4 4 9.6c0 2.5 1.2 4.4 3 5.6V19c0 .6.4 1 1 1h1.5v-2h1.5v2h2v-2h1.5v2H16c.6 0 1-.4 1-1v-3.8c1.8-1.2 3-3.1 3-5.6C20 5.4 16.4 2 12 2zM8.5 8.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm7 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM12 13l1.2 2.2h-2.4L12 13z"
    />
  </SvgIcon>
);

const ICONES = {
  alfinete: PushPin,
  perigo: Warning,
  tesouro: Diamond,
  porta: DoorFront,
  interrogacao: QuestionMark,
  caveira: Caveira,
};

const IconeMarcador = ({ icone, ...resto }) => {
  const Icone = ICONES[icone] ?? PushPin;
  return <Icone aria-hidden="true" data-icone={icone} {...resto} />;
};

IconeMarcador.propTypes = { icone: PropTypes.string };

export default IconeMarcador;
