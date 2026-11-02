import React from 'react';
import PropTypes from 'prop-types';

import { CORES_ALCANCE } from 'common/utils/gridCombate';

import { GridAlcance } from './styles';

// Alcance de movimento do token em combate (cópia nos dois sites): trechos de
// células por linha (faixasDoAlcance) — verde até Mover, amarelo até Correr.
// Px do mundo, entre as auras e os rastros; só indicação, sem eventos.
const AlcanceMovimento = ({ faixas, config, largura, altura }) => {
  const { celula, deslocamentoX, deslocamentoY } = config;
  const retangulo = (faixa, trecho) => (
    <rect
      key={`${faixa}-${trecho.col}-${trecho.lin}`}
      data-alcance={faixa}
      x={deslocamentoX + trecho.col * celula}
      y={deslocamentoY + trecho.lin * celula}
      width={trecho.colunas * celula}
      height={celula}
      fill={CORES_ALCANCE[faixa]}
      fillOpacity={faixa === 'mover' ? 0.22 : 0.2}
    />
  );
  return (
    <GridAlcance width={largura} height={altura} aria-hidden="true">
      {faixas.correr.map(trecho => retangulo('correr', trecho))}
      {faixas.mover.map(trecho => retangulo('mover', trecho))}
    </GridAlcance>
  );
};

const trechoShape = PropTypes.shape({
  col: PropTypes.number.isRequired,
  lin: PropTypes.number.isRequired,
  colunas: PropTypes.number.isRequired,
});

AlcanceMovimento.propTypes = {
  faixas: PropTypes.shape({
    mover: PropTypes.arrayOf(trechoShape).isRequired,
    correr: PropTypes.arrayOf(trechoShape).isRequired,
  }).isRequired,
  config: PropTypes.shape({
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
  }).isRequired,
  largura: PropTypes.number.isRequired,
  altura: PropTypes.number.isRequired,
};

export default AlcanceMovimento;
