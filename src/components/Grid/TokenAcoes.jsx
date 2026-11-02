import React from 'react';
import PropTypes from 'prop-types';
import CasinoIcon from '@mui/icons-material/Casino';

import { TokenAcaoBotao, TokenAcoesCaixa } from './stylesAcoes';

// Ações do token selecionado (cópia nos dois sites — mudou um, mude o outro),
// em px do VIEWPORT acima do token (`posicao` = posicaoDoRotulo). Por ora só
// "Rolar…", que abre o RolarDoTokenDialog.
const TokenAcoes = ({ posicao, onRolar }) => (
  <TokenAcoesCaixa
    role="toolbar"
    aria-label="Ações do token"
    data-token-acoes=""
    style={{ left: posicao.left, top: posicao.top }}
    onPointerDown={evento => evento.stopPropagation()}
  >
    <TokenAcaoBotao type="button" onClick={onRolar}>
      <CasinoIcon fontSize="small" />
      Rolar…
    </TokenAcaoBotao>
  </TokenAcoesCaixa>
);

TokenAcoes.propTypes = {
  posicao: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
  }).isRequired,
  onRolar: PropTypes.func.isRequired,
};

export default TokenAcoes;
