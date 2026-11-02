import React, { useId } from 'react';
import PropTypes from 'prop-types';

import {
  caminhoSvgDeTrechos,
  segmentosDeContorno,
  trechosDasCelulas,
} from 'common/utils/gridCamadas';

import { CamadaParedes } from './stylesMapa';

// Paredes do mapa (cópia nos dois sites — mudou um, mude o outro), px do
// MUNDO: células bloqueadas com hachura 45° e contorno só nas arestas externas.
const ParedesCamada = ({ config, bloqueadas, limites }) => {
  const idPadrao = useId();
  if (!bloqueadas || bloqueadas.size === 0) return null;
  const { celula, deslocamentoX, deslocamentoY } = config;
  const trechos = trechosDasCelulas(bloqueadas, limites);
  const segmentos = segmentosDeContorno(bloqueadas);
  const caminho = caminhoSvgDeTrechos(config, trechos);
  const largura = deslocamentoX + limites.colunas * celula;
  const altura = deslocamentoY + limites.linhas * celula;
  const px = (c, l) => [deslocamentoX + c * celula, deslocamentoY + l * celula];
  return (
    <CamadaParedes
      width={largura}
      height={altura}
      data-camada="paredes"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={idPadrao}
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="#e05555"
            strokeWidth="2"
            strokeOpacity="0.55"
          />
        </pattern>
      </defs>
      <path d={caminho} fill="rgba(10, 9, 19, 0.55)" />
      <path d={caminho} fill={`url(#${idPadrao})`} />
      {segmentos.map(({ c1, l1, c2, l2 }) => {
        const [x1, y1] = px(c1, l1);
        const [x2, y2] = px(c2, l2);
        return (
          <line
            key={`${c1}-${l1}-${c2}-${l2}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#e05555"
            strokeWidth="2"
            strokeLinecap="square"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </CamadaParedes>
  );
};

ParedesCamada.propTypes = {
  config: PropTypes.shape({
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
  }).isRequired,
  bloqueadas: PropTypes.instanceOf(Set),
  limites: PropTypes.shape({
    colunas: PropTypes.number.isRequired,
    linhas: PropTypes.number.isRequired,
  }).isRequired,
};

export default ParedesCamada;
