import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
  COR_TIPO_TOKEN,
  FaixaAcoes,
  FaixaCaixa,
  FaixaLista,
  FaixaOcultoIcone,
  FaixaPilula,
  FaixaRetrato,
  FaixaRodada,
  FaixaValor,
} from './styles';

// Faixa de iniciativa no topo do mapa (cópia nos dois sites — mudou um, mude
// o outro): "Rodada N", os retratos na ordem (o da vez destacado; tocar
// centraliza o mapa nele), "Vez do mestre" quando a vez é de alguém que o
// jogador não vê, e os botões de `acoes` que vierem (cada um só aparece com a
// função): Anterior/Próximo turno (mestre), Encerrar meu turno e Seu turno!
// Restaurar PP (jogador da vez) e Central de Ações (jogador com personagem no
// combate — só o site dos jogadores passa; "Ações" em tela pequena). O botão
// fica desabilitado enquanto a ação roda.
const ROTULOS = {
  anterior: 'Anterior',
  proximo: 'Próximo turno',
  encerrarTurno: 'Encerrar meu turno',
  restaurarPp: 'Seu turno! Restaurar PP',
  centralAcoes: 'Central de Ações',
};
const ROTULOS_CURTOS = { centralAcoes: 'Ações' };
const ORDEM_BOTOES = [
  'restaurarPp',
  'centralAcoes',
  'encerrarTurno',
  'anterior',
  'proximo',
];
const BOTOES_CHEIOS = ['restaurarPp', 'encerrarTurno'];

const FaixaIniciativa = ({ faixa, acoes, onCentralizar }) => {
  const [ocupado, setOcupado] = useState(null);
  const theme = useTheme();
  const telaPequena = useMediaQuery(theme.breakpoints.down('sm'));

  const executar = async id => {
    setOcupado(id);
    try {
      await acoes[id]();
    } finally {
      setOcupado(null);
    }
  };

  const botoes = ORDEM_BOTOES.filter(id => typeof acoes[id] === 'function');

  return (
    <FaixaCaixa
      data-faixa-iniciativa=""
      onPointerDown={event => event.stopPropagation()}
    >
      <FaixaRodada>Rodada {faixa.rodada}</FaixaRodada>
      <FaixaLista aria-label="Ordem de iniciativa">
        {faixa.itens.map(item => (
          <li key={item.tokenId}>
            <FaixaRetrato
              type="button"
              aria-label={`Centralizar em ${item.nome}`}
              aria-current={item.atual ? 'true' : undefined}
              title={item.nome}
              data-retrato={item.tokenId}
              $atual={item.atual}
              $oculto={item.oculto}
              $derrotado={item.derrotado}
              $cor={COR_TIPO_TOKEN[item.tipo] ?? COR_TIPO_TOKEN.avulso}
              onClick={() => onCentralizar(item.tokenId)}
            >
              <span>
                {item.imagemUrl ? (
                  <img src={item.imagemUrl} alt="" draggable={false} />
                ) : (
                  (item.nome?.[0]?.toUpperCase() ?? '?')
                )}
              </span>
              <FaixaValor $atual={item.atual}>{item.iniciativa}</FaixaValor>
              {item.oculto && (
                <FaixaOcultoIcone>
                  <VisibilityOffIcon sx={{ fontSize: 12 }} />
                </FaixaOcultoIcone>
              )}
            </FaixaRetrato>
          </li>
        ))}
      </FaixaLista>
      {faixa.vezDoMestre && <FaixaPilula>Vez do mestre</FaixaPilula>}
      {botoes.length > 0 && (
        <FaixaAcoes>
          {botoes.map(id => (
            <Button
              key={id}
              size="small"
              variant={BOTOES_CHEIOS.includes(id) ? 'contained' : 'outlined'}
              color={id === 'restaurarPp' ? 'secondary' : 'primary'}
              disabled={ocupado !== null}
              onClick={() => executar(id)}
              aria-label={ROTULOS[id]}
              sx={{ whiteSpace: 'nowrap', minHeight: 32 }}
            >
              {(telaPequena && ROTULOS_CURTOS[id]) || ROTULOS[id]}
            </Button>
          ))}
        </FaixaAcoes>
      )}
    </FaixaCaixa>
  );
};

FaixaIniciativa.propTypes = {
  // faixaDoCombate (common/utils/gridCombate.js).
  faixa: PropTypes.shape({
    rodada: PropTypes.number.isRequired,
    itens: PropTypes.arrayOf(
      PropTypes.shape({
        tokenId: PropTypes.string.isRequired,
        nome: PropTypes.string,
        imagemUrl: PropTypes.string,
        tipo: PropTypes.string,
        oculto: PropTypes.bool,
        derrotado: PropTypes.bool,
        atual: PropTypes.bool,
        iniciativa: PropTypes.number,
      }),
    ).isRequired,
    vezDoMestre: PropTypes.bool,
  }).isRequired,
  acoes: PropTypes.shape({
    anterior: PropTypes.func,
    proximo: PropTypes.func,
    encerrarTurno: PropTypes.func,
    restaurarPp: PropTypes.func,
    centralAcoes: PropTypes.func,
  }).isRequired,
  onCentralizar: PropTypes.func.isRequired,
};

export default FaixaIniciativa;
