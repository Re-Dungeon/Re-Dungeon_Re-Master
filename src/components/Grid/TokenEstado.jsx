import React from 'react';
import PropTypes from 'prop-types';

import {
  RECURSOS_TOKEN,
  TOKEN_CONDICOES_VISIVEIS,
  corDaBarra,
  fracaoDaBarra,
} from 'common/utils/grid';

import { TokenBarra, TokenBarras, TokenCondicaoIcone, TokenCondicoes } from './styles';

// Estado do token desenhado sobre ele (cópia nos dois sites — mudou um, mude
// o outro): até três barras finas (PV, Energia, Fadiga) na base do círculo e
// até TOKEN_CONDICOES_VISIVEIS ícones de condição (+N) no canto. Só visual
// (aria-hidden) — os nomes e números ficam no cartão do token (TokenDetalhe).
// Tamanhos em px do mundo (`lado` = lado do token), escalados com o zoom.
const TokenEstado = ({ recursos = null, condicoes = null, lado }) => {
  const barras = recursos ? RECURSOS_TOKEN.filter(id => recursos[id]) : [];
  const lista = condicoes ?? [];
  if (!barras.length && !lista.length) return null;
  const espessura = Math.max(2, lado * 0.06);
  const icone = Math.max(10, lado * 0.26);
  const extras = lista.length - TOKEN_CONDICOES_VISIVEIS;
  return (
    <>
      {barras.length > 0 && (
        <TokenBarras aria-hidden="true">
          {barras.map(id => {
            const fracao = fracaoDaBarra(id, recursos[id]);
            return (
              <TokenBarra key={id} data-barra={id} style={{ height: espessura }}>
                <span
                  style={{
                    width: `${fracao * 100}%`,
                    background: corDaBarra(id, fracao),
                  }}
                />
              </TokenBarra>
            );
          })}
        </TokenBarras>
      )}
      {lista.length > 0 && (
        <TokenCondicoes aria-hidden="true" data-condicoes="">
          {lista.slice(0, TOKEN_CONDICOES_VISIVEIS).map(condicao => (
            <TokenCondicaoIcone
              key={condicao.id}
              data-condicao={condicao.id}
              style={{ width: icone, height: icone, fontSize: icone * 0.6 }}
            >
              {condicao.icone ? (
                <img
                  src={condicao.icone}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                (condicao.nome?.[0]?.toUpperCase() ?? '?')
              )}
            </TokenCondicaoIcone>
          ))}
          {extras > 0 && (
            <TokenCondicaoIcone
              style={{
                minWidth: icone,
                height: icone,
                padding: '0 2px',
                borderRadius: icone / 2,
                fontSize: icone * 0.55,
              }}
            >
              +{extras}
            </TokenCondicaoIcone>
          )}
        </TokenCondicoes>
      )}
    </>
  );
};

const recursoShape = PropTypes.shape({
  atual: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
});

TokenEstado.propTypes = {
  recursos: PropTypes.shape({
    pv: recursoShape,
    energia: recursoShape,
    fadiga: recursoShape,
    numeros: PropTypes.bool,
  }),
  condicoes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
      icone: PropTypes.string,
      stack: PropTypes.number,
    }),
  ),
  lado: PropTypes.number.isRequired,
};

export default TokenEstado;
