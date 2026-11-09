import React from 'react';
import PropTypes from 'prop-types';

import { trechosDasCelulas } from 'common/utils/gridCamadas';
import { pontosDoDesenho } from 'common/utils/gridDesenho';

import { CamadaDesenhos } from './stylesMapa';

const COR_PREVIA = { adicionar: '#4caf50', remover: '#e05555', apagar: '#e05555' };

// Desenhos livres, traço em curso e prévia do pincel (cópia nos dois sites —
// mudou um, mude o outro), px do MUNDO, acima da névoa. `children` (caminho do
// arraste, régua) entra por último no mesmo SVG.
const CamadaAnotacoes = ({
  config,
  limites,
  desenhos = [],
  tracoAtual = null,
  previaCelulas = null,
  children = null,
}) => {
  const { celula, deslocamentoX, deslocamentoY } = config;
  const largura = deslocamentoX + limites.colunas * celula;
  const altura = deslocamentoY + limites.linhas * celula;
  const espessura = Math.max(3, celula * 0.07);
  const linha = (pontos, cor) => (
    <polyline
      points={pontos}
      fill="none"
      stroke={cor}
      strokeWidth={espessura}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
  const trechosPrevia = previaCelulas?.celulas?.size
    ? trechosDasCelulas(previaCelulas.celulas, limites)
    : [];
  const corPrevia = COR_PREVIA[previaCelulas?.acao] ?? COR_PREVIA.adicionar;
  return (
    <CamadaDesenhos
      width={largura}
      height={altura}
      data-camada="anotacoes"
      aria-hidden="true"
    >
      {desenhos.map(desenho => (
        <g key={desenho.id} data-desenho={desenho.id}>
          {linha(pontosDoDesenho(desenho), desenho.cor)}
        </g>
      ))}
      {tracoAtual?.pontos?.length > 0 && (
        <g data-traco-atual="">
          {linha(tracoAtual.pontos.map(p => `${p.x},${p.y}`).join(' '), tracoAtual.cor)}
        </g>
      )}
      {trechosPrevia.map(trecho => (
        <rect
          key={`${trecho.lin}-${trecho.col}`}
          data-previa={previaCelulas.acao}
          x={deslocamentoX + trecho.col * celula}
          y={deslocamentoY + trecho.lin * celula}
          width={trecho.colunas * celula}
          height={celula}
          fill={corPrevia}
          fillOpacity={0.3}
          stroke={corPrevia}
          strokeOpacity={0.7}
        />
      ))}
      {children}
    </CamadaDesenhos>
  );
};

CamadaAnotacoes.propTypes = {
  config: PropTypes.shape({
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
  }).isRequired,
  limites: PropTypes.shape({
    colunas: PropTypes.number.isRequired,
    linhas: PropTypes.number.isRequired,
  }).isRequired,
  desenhos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      cor: PropTypes.string.isRequired,
      pontos: PropTypes.arrayOf(PropTypes.number).isRequired,
    }),
  ),
  tracoAtual: PropTypes.shape({
    cor: PropTypes.string.isRequired,
    pontos: PropTypes.arrayOf(
      PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
    ),
  }),
  previaCelulas: PropTypes.shape({
    celulas: PropTypes.instanceOf(Set),
    acao: PropTypes.string,
  }),
  children: PropTypes.node,
};

export default CamadaAnotacoes;
