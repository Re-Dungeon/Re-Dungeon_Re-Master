import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import IconeMarcador from './IconeMarcador';
import {
  CartaoCabecalho,
  CartaoFechar,
  CartaoIcone,
  CartaoMarcador,
  CartaoSelo,
  CartaoTexto,
} from './stylesMapa';

// Cartão de um marcador (cópia nos dois sites — mudou um, mude o outro), em px
// do VIEWPORT, acima do pino (`posicao`). Fecha com o botão, Esc ou tocando fora.
const MarcadorCartao = ({ marcador, posicao, onFechar }) => {
  const ref = useRef(null);

  useEffect(() => {
    const aoTeclar = evento => {
      if (evento.key === 'Escape') onFechar();
    };
    const aoTocarFora = evento => {
      if (ref.current && !ref.current.contains(evento.target)) onFechar();
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoTocarFora);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoTocarFora);
    };
  }, [onFechar]);

  return (
    <CartaoMarcador
      ref={ref}
      role="dialog"
      aria-label={`Marcador: ${marcador.titulo}`}
      data-marcador-cartao=""
      onPointerDown={evento => evento.stopPropagation()}
      style={{ left: posicao.left, top: posicao.top, '--cor': marcador.cor }}
    >
      <CartaoCabecalho>
        <CartaoIcone>
          <IconeMarcador icone={marcador.icone} fontSize="small" />
        </CartaoIcone>
        <strong>{marcador.titulo}</strong>
        <CartaoFechar type="button" aria-label="Fechar" onClick={onFechar}>
          ×
        </CartaoFechar>
      </CartaoCabecalho>
      {marcador.texto && <CartaoTexto>{marcador.texto}</CartaoTexto>}
      {marcador.secreto && <CartaoSelo>Só o mestre vê</CartaoSelo>}
    </CartaoMarcador>
  );
};

MarcadorCartao.propTypes = {
  marcador: PropTypes.shape({
    titulo: PropTypes.string,
    texto: PropTypes.string,
    icone: PropTypes.string,
    cor: PropTypes.string,
    secreto: PropTypes.bool,
  }).isRequired,
  posicao: PropTypes.shape({
    left: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
  }).isRequired,
  onFechar: PropTypes.func.isRequired,
};

export default MarcadorCartao;
