import React from 'react';
import PropTypes from 'prop-types';

import { RECURSOS_TOKEN, ROTULOS_RECURSO } from 'common/utils/grid';

import { TokenDetalheCaixa } from './styles';

// Cartão de um token no mapa (hover no desktop, toque no celular — cópia nos
// dois sites, mudou um, mude o outro): nome, PV/Energia/Fadiga (só com
// `recursos.numeros`), condições e a distância (`distancia`, texto pronto) até
// o token de referência. Sem nada além do nome, não aparece. `style` traz a
// posição em px do viewport. Sem role="status": o cartão não é anunciado a
// cada hover.
const TokenDetalhe = ({
  nome,
  recursos = null,
  condicoes = null,
  distancia = null,
  style,
}) => {
  const linhas = [];
  if (recursos?.numeros) {
    RECURSOS_TOKEN.forEach(id => {
      const recurso = recursos[id];
      if (recurso)
        linhas.push(`${ROTULOS_RECURSO[id]} ${recurso.atual}/${recurso.max}`);
    });
  }
  if (condicoes?.length) {
    linhas.push(
      condicoes
        .map(condicao =>
          condicao.stack > 1
            ? `${condicao.nome} ×${condicao.stack}`
            : condicao.nome,
        )
        .join(', '),
    );
  }
  if (distancia) linhas.push(distancia);
  if (!linhas.length) return null;
  return (
    <TokenDetalheCaixa data-detalhe="" style={style}>
      <strong>{nome}</strong>
      {linhas.map(linha => (
        <div key={linha}>{linha}</div>
      ))}
    </TokenDetalheCaixa>
  );
};

TokenDetalhe.propTypes = {
  nome: PropTypes.string,
  recursos: PropTypes.object,
  condicoes: PropTypes.arrayOf(
    PropTypes.shape({ nome: PropTypes.string, stack: PropTypes.number }),
  ),
  distancia: PropTypes.string,
  style: PropTypes.object,
};

export default TokenDetalhe;
