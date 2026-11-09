import React from 'react';
import PropTypes from 'prop-types';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import { AreaAlca, AreaChip, AreaChipLixeira, AreaChipTexto } from './stylesAcoes';

// Rótulos e alças das áreas (cópia nos dois sites — mudou um, mude o outro),
// em px do VIEWPORT. `posicaoDe(area)` → {left, top} do chip; a área
// selecionada mostra o texto completo, a lixeira (se `podeEditar`) e as alças
// de origem/alvo (raio só tem a origem), em `posicaoDaAlca(area, alca)` (cai
// em `posicaoDe`). Não inicia gesto do mapa ao tocar (stopPropagation).
const parar = evento => evento.stopPropagation();

const alcasDa = area => {
  if (!area.podeEditar) return [];
  return area.forma === 'raio' ? ['origem'] : ['origem', 'alvo'];
};

const AreaRotulos = ({
  areas,
  posicaoDe,
  posicaoDaAlca,
  selecionadaId,
  onSelecionar,
  onRemover,
  onAlcaPointerDown,
}) =>
  areas.map(area => {
    const selecionada = area.id === selecionadaId;
    const texto = selecionada
      ? [area.autorNome, area.rotulo, area.atingidos].filter(Boolean).join(' — ')
      : area.rotulo;
    const { left, top } = posicaoDe(area);
    return (
      <React.Fragment key={area.id}>
        <AreaChip
          data-area-rotulo={area.id}
          style={{ left, top, '--cor': area.cor }}
          onPointerDown={parar}
        >
          <AreaChipTexto
            type="button"
            aria-expanded={selecionada}
            onClick={() => onSelecionar(selecionada ? null : area.id)}
          >
            {texto}
          </AreaChipTexto>
          {selecionada && area.podeEditar && (
            <AreaChipLixeira
              type="button"
              aria-label="Remover área"
              onClick={() => onRemover(area.id)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </AreaChipLixeira>
          )}
        </AreaChip>
        {selecionada &&
          alcasDa(area).map(alca => {
            const posicao = (posicaoDaAlca ?? posicaoDe)(area, alca);
            return (
              <AreaAlca
                key={alca}
                data-area-alca={alca}
                data-area-id={area.id}
                style={{ left: posicao.left, top: posicao.top, '--cor': area.cor }}
                onPointerDown={evento => {
                  evento.stopPropagation();
                  onAlcaPointerDown(area.id, alca, evento);
                }}
              />
            );
          })}
      </React.Fragment>
    );
  });

AreaRotulos.propTypes = {
  areas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      forma: PropTypes.string,
      cor: PropTypes.string,
      rotulo: PropTypes.string.isRequired,
      autorNome: PropTypes.string,
      atingidos: PropTypes.string,
      podeEditar: PropTypes.bool,
    }),
  ).isRequired,
  posicaoDe: PropTypes.func.isRequired,
  posicaoDaAlca: PropTypes.func,
  selecionadaId: PropTypes.string,
  onSelecionar: PropTypes.func.isRequired,
  onRemover: PropTypes.func.isRequired,
  onAlcaPointerDown: PropTypes.func.isRequired,
};

export default AreaRotulos;
