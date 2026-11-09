import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { nomeDaCondicao } from 'common/utils/grid';
import { patchesDeDanoEmLote } from './gridMestre';
import { painelCabecalhoSx, painelLadoSx } from './styles';

const legendaSx = { color: 'var(--text-muted)' };

/**
 * Ações em lote sobre os tokens selecionados com Shift/Ctrl-clique (2 ou
 * mais): dano/cura no PV do token, adicionar/remover condição, ocultar/
 * revelar, adicionar ao combate e excluir. Só apresenta os controles — quem
 * monta (Grid) calcula os patches (gridMestre.js) e grava num lote só.
 * Token de jogador não entra no dano nem nas condições (PV e condições vêm da
 * ficha dele); o painel avisa quantos serão ignorados.
 */
const AcoesEmLote = ({
  tokens,
  condicoes,
  emCombate,
  onDano,
  onCondicao,
  onOculto,
  onAdicionarAoCombate,
  onExcluir,
  onFechar,
  abaixoDaFaixa = false,
}) => {
  const [dano, setDano] = useState('');
  const [condicaoId, setCondicaoId] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const { jogadores, semPv } = patchesDeDanoEmLote(tokens, '');

  // Uma ação por vez: os botões ficam desabilitados até a escrita terminar.
  const executar = async acao => {
    setOcupado(true);
    try {
      return await acao();
    } finally {
      setOcupado(false);
    }
  };

  const aplicarDano = async () => {
    if (dano.trim() === '') return;
    const aplicado = await executar(() => onDano(dano));
    if (aplicado) setDano('');
  };

  return (
    <Box
      sx={painelLadoSx('left', abaixoDaFaixa)}
      role="region"
      aria-label="Ações em lote"
    >
      <Box sx={painelCabecalhoSx}>
        <Box>
          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {tokens.length} tokens selecionados
          </Typography>
          <Typography variant="caption" sx={legendaSx}>
            Shift/Ctrl-clique alterna · Esc limpa
          </Typography>
        </Box>
        <IconButton size="small" aria-label="Limpar seleção" onClick={onFechar}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {(jogadores > 0 || semPv > 0) && (
        <Typography variant="caption" sx={legendaSx} role="note">
          {jogadores > 0 &&
            `${jogadores} jogador${jogadores > 1 ? 'es' : ''} (PV e condições vêm da ficha) `}
          {jogadores > 0 && semPv > 0 && 'e '}
          {semPv > 0 && `${semPv} sem PV no token `}
          {jogadores > 0 && semPv > 0
            ? 'ficam de fora do dano; jogadores também das condições.'
            : 'ficam de fora do dano.'}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          label="Dano/cura (PV)"
          value={dano}
          onChange={event => setDano(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              aplicarDano();
            }
          }}
          disabled={ocupado}
          placeholder="-7 ou +5"
          slotProps={{
            htmlInput: {
              inputMode: 'text',
              title: 'Digite -N para tirar, +N para somar ou N para definir',
            },
          }}
          sx={{ flex: 1, minWidth: 0 }}
        />
        <Button
          variant="contained"
          onClick={aplicarDano}
          disabled={ocupado || dano.trim() === ''}
        >
          Aplicar
        </Button>
      </Box>

      <TextField
        select
        size="small"
        label="Condição"
        value={condicaoId}
        onChange={event => setCondicaoId(event.target.value)}
        disabled={ocupado}
      >
        {condicoes.length === 0 && (
          <MenuItem value="" disabled>
            Nenhuma condição neste universo
          </MenuItem>
        )}
        {condicoes.map(condicao => (
          <MenuItem key={condicao.id} value={condicao.id}>
            {nomeDaCondicao(condicao)}
          </MenuItem>
        ))}
      </TextField>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          sx={{ flex: 1 }}
          disabled={ocupado || !condicaoId}
          onClick={() => executar(() => onCondicao(condicaoId, true))}
        >
          Adicionar condição
        </Button>
        <Button
          sx={{ flex: 1 }}
          disabled={ocupado || !condicaoId}
          onClick={() => executar(() => onCondicao(condicaoId, false))}
        >
          Remover condição
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          sx={{ flex: 1 }}
          disabled={ocupado}
          onClick={() => executar(() => onOculto(true))}
        >
          Ocultar
        </Button>
        <Button
          sx={{ flex: 1 }}
          disabled={ocupado}
          onClick={() => executar(() => onOculto(false))}
        >
          Revelar
        </Button>
      </Box>

      {emCombate && (
        <Button
          disabled={ocupado}
          onClick={() => executar(onAdicionarAoCombate)}
        >
          Adicionar ao combate
        </Button>
      )}

      <Button
        color="error"
        disabled={ocupado}
        onClick={() => executar(onExcluir)}
      >
        Excluir {tokens.length} tokens
      </Button>
    </Box>
  );
};

AcoesEmLote.propTypes = {
  tokens: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      tipo: PropTypes.string,
    }),
  ).isRequired,
  // Catálogo de condições do universo ({ id, nome|Nome }).
  condicoes: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired }),
  ).isRequired,
  // Há combate na cena (mostra "Adicionar ao combate").
  emCombate: PropTypes.bool,
  // Devolve true se algo foi aplicado (limpa o campo).
  onDano: PropTypes.func.isRequired,
  onCondicao: PropTypes.func.isRequired,
  onOculto: PropTypes.func.isRequired,
  onAdicionarAoCombate: PropTypes.func.isRequired,
  onExcluir: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
  // Combate em andamento: a faixa de iniciativa ocupa o topo do mapa.
  abaixoDaFaixa: PropTypes.bool,
};

export default AcoesEmLote;
