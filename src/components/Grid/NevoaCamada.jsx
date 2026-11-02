import React from 'react';
import PropTypes from 'prop-types';

import {
  caminhoSvgDeTrechos,
  trechosDasCelulas,
} from 'common/utils/gridCamadas';

import { CamadaNevoa } from './stylesMapa';

// Névoa de guerra (cópia nos dois sites — mudou um, mude o outro), px do
// MUNDO: um único path evenodd — o mundo todo menos um buraco por trecho
// revelado. Jogador: preto opaco; mestre: translúcido (vê por baixo). Com a
// névoa desligada só aparece a `preview` do mestre (ferramenta Névoa).
const NevoaCamada = ({
  config,
  limites,
  nevoa,
  mestre = false,
  preview = false,
}) => {
  const ativa = Boolean(nevoa?.ativa);
  if (!ativa && !(mestre && preview)) return null;
  const { celula, deslocamentoX, deslocamentoY } = config;
  const largura = deslocamentoX + limites.colunas * celula;
  const altura = deslocamentoY + limites.linhas * celula;
  const trechos = trechosDasCelulas(nevoa?.reveladas ?? new Set(), limites);
  const d = `M0 0H${largura}V${altura}H0Z ${caminhoSvgDeTrechos(config, trechos)}`;
  let fill = '#000';
  if (mestre) fill = ativa ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.2)';
  return (
    <CamadaNevoa
      width={largura}
      height={altura}
      data-camada="nevoa"
      aria-hidden="true"
    >
      <path d={d} fill={fill} fillRule="evenodd" shapeRendering="crispEdges" />
    </CamadaNevoa>
  );
};

NevoaCamada.propTypes = {
  config: PropTypes.shape({
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
  }).isRequired,
  limites: PropTypes.shape({
    colunas: PropTypes.number.isRequired,
    linhas: PropTypes.number.isRequired,
  }).isRequired,
  nevoa: PropTypes.shape({
    ativa: PropTypes.bool,
    reveladas: PropTypes.instanceOf(Set),
  }),
  mestre: PropTypes.bool,
  preview: PropTypes.bool,
};

export default NevoaCamada;
