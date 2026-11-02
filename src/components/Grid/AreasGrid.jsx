import React from 'react';
import PropTypes from 'prop-types';

import { trechosDasCelulas } from 'common/utils/gridAreas';
import { centroDaCelula } from 'common/utils/grid';

import { GridAreas } from './stylesAcoes';

// Templates de área no mapa (cópia nos dois sites — mudou um, mude o outro),
// em px do MUNDO: um retângulo por trecho de células, tracejado origem→alvo e
// ponto na origem. `previa` (mesmo formato) é a área sendo posicionada.
// Só indicação, sem eventos.
const COR_PREVIA = '#ffffff';

const AreaDesenho = ({ area, config, previa }) => {
  const { celula, deslocamentoX, deslocamentoY } = config;
  const cor = area.cor ?? COR_PREVIA;
  const origem = centroDaCelula(config, area.origem.col, area.origem.lin);
  const alvo = area.alvo
    ? centroDaCelula(config, area.alvo.col, area.alvo.lin)
    : null;
  return (
    <g data-area={previa ? 'previa' : area.id}>
      {trechosDasCelulas(area.celulas).map(trecho => (
        <rect
          key={`${trecho.col}-${trecho.lin}`}
          x={deslocamentoX + trecho.col * celula}
          y={deslocamentoY + trecho.lin * celula}
          width={trecho.colunas * celula}
          height={celula}
          fill={cor}
          fillOpacity={previa ? 0.18 : 0.28}
          stroke={previa ? cor : 'none'}
          strokeDasharray={previa ? '6 4' : undefined}
        />
      ))}
      {alvo && (
        <line
          x1={origem.x}
          y1={origem.y}
          x2={alvo.x}
          y2={alvo.y}
          stroke={cor}
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeOpacity={0.9}
        />
      )}
      <circle
        cx={origem.x}
        cy={origem.y}
        r={Math.max(3, celula / 8)}
        fill={cor}
        stroke="#000"
      />
    </g>
  );
};

const AreasGrid = ({ config, areas, previa, largura, altura }) => (
  <GridAreas width={largura} height={altura} aria-hidden="true">
    {areas.map(area => (
      <AreaDesenho key={area.id} area={area} config={config} />
    ))}
    {previa && <AreaDesenho area={previa} config={config} previa />}
  </GridAreas>
);

const celulaShape = PropTypes.shape({
  col: PropTypes.number.isRequired,
  lin: PropTypes.number.isRequired,
});

const areaShape = PropTypes.shape({
  id: PropTypes.string,
  cor: PropTypes.string,
  celulas: PropTypes.arrayOf(celulaShape).isRequired,
  origem: celulaShape.isRequired,
  alvo: celulaShape,
  forma: PropTypes.string,
});

const configShape = PropTypes.shape({
  celula: PropTypes.number.isRequired,
  deslocamentoX: PropTypes.number.isRequired,
  deslocamentoY: PropTypes.number.isRequired,
});

AreaDesenho.propTypes = {
  area: areaShape.isRequired,
  config: configShape.isRequired,
  previa: PropTypes.bool,
};

AreasGrid.propTypes = {
  config: configShape.isRequired,
  areas: PropTypes.arrayOf(areaShape.isRequired).isRequired,
  previa: areaShape,
  largura: PropTypes.number.isRequired,
  altura: PropTypes.number.isRequired,
};

export default AreasGrid;
