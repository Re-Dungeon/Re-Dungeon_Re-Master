import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  RECURSOS_TOKEN,
  ROTULOS_RECURSO,
  ajustarRecursoAtual,
  recursoDigitadoAtual,
} from 'common/utils/grid';

import { LinhaRecursoEditavel, TokenDetalheCaixa } from './styles';

// Uma linha "PV [−] 12 / 20 [+]" do dono: o valor atual também se digita
// (rascunho; grava no Enter/ao sair do campo). `local` é o valor otimista até
// a ficha chegar com o novo `atual` (ou a gravação falhar).
const RecursoEditavel = ({ id, recurso, onAlterar }) => {
  // { valor, base }: vale enquanto a ficha ainda mostra `base` (o atual de antes).
  const [local, setLocal] = useState(null);
  const [rascunho, setRascunho] = useState(null);

  const atual = local && local.base === recurso.atual ? local.valor : recurso.atual;
  const rotulo = ROTULOS_RECURSO[id];

  const gravar = valor => {
    if (valor === null || valor === atual) return;
    setLocal({ valor, base: recurso.atual });
    Promise.resolve(onAlterar(id, valor)).catch(() => setLocal(null));
  };
  const confirmarRascunho = () => {
    if (rascunho === null) return;
    gravar(recursoDigitadoAtual({ ...recurso, atual }, rascunho));
    setRascunho(null);
  };

  return (
    <LinhaRecursoEditavel data-recurso={id}>
      <span>{rotulo}</span>
      <button
        type="button"
        aria-label={`Diminuir ${rotulo}`}
        disabled={atual <= 0}
        onClick={() => gravar(ajustarRecursoAtual({ ...recurso, atual }, -1))}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={`${rotulo} atual`}
        title="Digite o valor ou +N/-N para somar/tirar"
        value={rascunho ?? String(atual)}
        onChange={event => setRascunho(event.target.value)}
        onFocus={event => event.target.select()}
        onBlur={confirmarRascunho}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            confirmarRascunho();
          } else if (event.key === 'Escape') {
            setRascunho(null);
          }
        }}
      />
      <span>/ {recurso.max}</span>
      <button
        type="button"
        aria-label={`Aumentar ${rotulo}`}
        disabled={atual >= recurso.max}
        onClick={() => gravar(ajustarRecursoAtual({ ...recurso, atual }, 1))}
      >
        +
      </button>
    </LinhaRecursoEditavel>
  );
};

RecursoEditavel.propTypes = {
  id: PropTypes.string.isRequired,
  recurso: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }).isRequired,
  onAlterar: PropTypes.func.isRequired,
};

// Cartão de um token no mapa (hover no desktop, toque no celular — cópia nos
// dois sites, mudou um, mude o outro): nome, PV/Energia/Fadiga (só com
// `recursos.numeros`), condições e a distância (`distancia`, texto pronto) até
// o token de referência. `pp` (Prontidão, só para o dono e o mestre) vira
// "PP a/m". Sem nada além do nome, não aparece. `style` traz a
// posição em px do viewport. Sem role="status": o cartão não é anunciado a
// cada hover. Com `onAlterarRecurso(recurso, valor)` (o dono, no site dos
// jogadores) as linhas de recurso viram editáveis e o cartão passa a receber
// o ponteiro (`onPointerEnter/Leave/Focus/Blur` mantêm-no aberto).
const TokenDetalhe = ({
  nome,
  recursos = null,
  condicoes = null,
  distancia = null,
  pp = null,
  style,
  onAlterarRecurso = null,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
}) => {
  const editavel = Boolean(onAlterarRecurso && recursos?.numeros);
  const linhas = [];
  const linhasEditaveis = [];
  if (recursos?.numeros) {
    RECURSOS_TOKEN.forEach(id => {
      const recurso = recursos[id];
      if (!recurso) return;
      if (editavel) linhasEditaveis.push(id);
      else linhas.push(`${ROTULOS_RECURSO[id]} ${recurso.atual}/${recurso.max}`);
    });
  }
  if (pp) linhas.push(`PP ${pp.atual}/${pp.max}`);
  if (condicoes?.length) {
    linhas.push(
      condicoes
        .map(condicao =>
          condicao.stack > 1 ? `${condicao.nome} ×${condicao.stack}` : condicao.nome,
        )
        .join(', '),
    );
  }
  if (distancia) linhas.push(distancia);
  if (!linhas.length && !linhasEditaveis.length) return null;
  return (
    <TokenDetalheCaixa
      data-detalhe=""
      $interativo={editavel}
      style={style}
      onPointerDown={editavel ? event => event.stopPropagation() : undefined}
      onPointerEnter={editavel ? onPointerEnter : undefined}
      onPointerLeave={editavel ? onPointerLeave : undefined}
      onFocus={editavel ? onFocus : undefined}
      onBlur={editavel ? onBlur : undefined}
    >
      <strong>{nome}</strong>
      {linhasEditaveis.map(id => (
        <RecursoEditavel
          key={id}
          id={id}
          recurso={recursos[id]}
          onAlterar={onAlterarRecurso}
        />
      ))}
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
  pp: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
  style: PropTypes.object,
  onAlterarRecurso: PropTypes.func,
  onPointerEnter: PropTypes.func,
  onPointerLeave: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

export default TokenDetalhe;
