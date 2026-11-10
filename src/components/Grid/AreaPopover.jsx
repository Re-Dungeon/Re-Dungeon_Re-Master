import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  AREA_FORMAS,
  CORES_AREA,
  ROTULOS_AREA,
  normalizarMetrosDaArea,
  quadradosDaArea,
} from 'common/utils/gridAreas';
import useConfirmacao from 'components/ConfirmDialog/useConfirmacao';

import { CorBotao, CoresLinha, PopoverCorpo } from './stylesAcoes';

// Popover do botão "Área" (cópia nos dois sites — mudou um, mude o outro):
// forma, tamanho em metros (com a conversão em quadrados) e cor. "Posicionar
// no mapa" entrega a configuração e fecha; o GridMapa arma o modo.
// `onRemoverTodas` (só mestre) apaga todas as áreas da cena, com confirmação.
const FORMAS = Object.values(AREA_FORMAS);

const AreaPopover = ({
  anchorEl,
  open,
  onClose,
  onPosicionar,
  metrosPorQuadrado,
  corPadrao,
  onRemoverTodas,
}) => {
  const [confirmar, dialogo] = useConfirmacao();
  const [forma, setForma] = useState(AREA_FORMAS.CONE);
  const [texto, setTexto] = useState('');
  const [cor, setCor] = useState(null);

  const metros = normalizarMetrosDaArea(texto);
  const corAtual = cor ?? corPadrao;
  const invalido = texto.trim() !== '' && metros == null;
  let ajuda = ' ';
  if (metros != null) ajuda = `= ${quadradosDaArea(metros, metrosPorQuadrado)} q`;
  else if (invalido) ajuda = 'Informe um número maior que zero';

  const posicionar = () => {
    if (metros == null) return;
    onPosicionar({ forma, metros, cor: corAtual });
    onClose();
  };

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <PopoverCorpo onPointerDown={evento => evento.stopPropagation()}>
          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={forma}
            aria-label="Forma da área"
            onChange={(_evento, valor) => valor && setForma(valor)}
          >
            {FORMAS.map(f => (
              <ToggleButton key={f} value={f} sx={{ minHeight: 44 }}>
                {ROTULOS_AREA[f]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <TextField
            label="Tamanho (m)"
            size="small"
            value={texto}
            error={invalido}
            helperText={ajuda}
            onChange={evento => setTexto(evento.target.value)}
            onKeyDown={evento => {
              if (evento.key === 'Enter') {
                evento.preventDefault();
                posicionar();
              }
            }}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
          />
          <CoresLinha role="group" aria-label="Cor da área">
            {CORES_AREA.map(c => (
              <CorBotao
                key={c}
                type="button"
                aria-label={`Cor ${c}`}
                aria-pressed={c === corAtual}
                style={{ '--cor': c }}
                onClick={() => setCor(c)}
              />
            ))}
          </CoresLinha>
          <Button variant="contained" disabled={metros == null} onClick={posicionar}>
            Posicionar no mapa
          </Button>
          {onRemoverTodas && (
            <Button
              color="error"
              onClick={async () => {
                const confirmado = await confirmar({
                  titulo: 'Remover todas as áreas desta cena?',
                  confirmarTexto: 'Remover',
                });
                if (!confirmado) return;
                onRemoverTodas();
                onClose();
              }}
            >
              Remover todos
            </Button>
          )}
        </PopoverCorpo>
      </Popover>
      {dialogo}
    </>
  );
};

AreaPopover.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPosicionar: PropTypes.func.isRequired,
  metrosPorQuadrado: PropTypes.number.isRequired,
  corPadrao: PropTypes.string.isRequired,
  onRemoverTodas: PropTypes.func,
};

export default AreaPopover;
