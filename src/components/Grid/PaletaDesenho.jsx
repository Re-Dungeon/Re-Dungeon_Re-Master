import React from 'react';
import PropTypes from 'prop-types';

import { CORES_DESENHO } from 'common/utils/gridDesenho';
import useConfirmacao from 'components/ConfirmDialog/useConfirmacao';

import { PaletaAcao, PaletaCaixa, PaletaCor } from './stylesMapa';

// Barra do modo desenhar (cópia nos dois sites — mudou um, mude o outro), em
// px do viewport: cores, "Apagar meus desenhos" e, só com `onApagarTodos`
// (mestre), "Apagar todos" com confirmação.
const PaletaDesenho = ({ cor, onCor, onApagarMeus, onApagarTodos }) => {
  const [confirmar, dialogo] = useConfirmacao();

  const apagarTodos = async () => {
    const confirmado = await confirmar({
      titulo: 'Apagar os desenhos de todos nesta cena?',
      confirmarTexto: 'Apagar',
    });
    if (confirmado) onApagarTodos();
  };

  return (
    <PaletaCaixa
      role="toolbar"
      aria-label="Paleta de desenho"
      data-paleta=""
      // Não inicia gesto do mapa (nem captura o ponteiro) ao tocar na paleta.
      onPointerDown={evento => evento.stopPropagation()}
    >
      {CORES_DESENHO.map(c => (
        <PaletaCor
          key={c}
          type="button"
          aria-label={`Cor ${c}`}
          aria-pressed={c === cor}
          style={{ '--cor': c }}
          onClick={() => onCor(c)}
        />
      ))}
      <PaletaAcao type="button" onClick={onApagarMeus}>
        Apagar meus desenhos
      </PaletaAcao>
      {onApagarTodos && (
        <PaletaAcao type="button" onClick={apagarTodos}>
          Apagar todos
        </PaletaAcao>
      )}
      {dialogo}
    </PaletaCaixa>
  );
};

PaletaDesenho.propTypes = {
  cor: PropTypes.string.isRequired,
  onCor: PropTypes.func.isRequired,
  onApagarMeus: PropTypes.func.isRequired,
  onApagarTodos: PropTypes.func,
};

export default PaletaDesenho;
