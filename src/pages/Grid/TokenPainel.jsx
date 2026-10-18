import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { isUrlImagemValida } from 'common/utils/chat';
import {
  ROTULOS_TIPO_TOKEN,
  TOKEN_NOME_MAX,
  montarToken,
  validarToken,
} from 'common/utils/grid';
import { OPCOES_TAMANHO_TOKEN, opcoesDeDonos } from './gridMestre';
import { painelCabecalhoSx, painelSx } from './styles';

/**
 * Edição do token selecionado no Grid: nome/imagem (cópias feitas na
 * criação), tamanho em células, jogadores que podem movê-lo e se está oculto
 * para os jogadores. Quem monta usa `key={token.id}` para recomeçar o
 * formulário ao trocar de token.
 */
const TokenPainel = ({ token, jogadores, onSalvar, onRemover, onFechar }) => {
  const [valores, setValores] = useState({
    nome: token.nome ?? '',
    imagemUrl: token.imagemUrl ?? '',
    tamanho: token.tamanho ?? 1,
    donos: token.donos ?? [],
    oculto: Boolean(token.oculto),
  });
  const [salvando, setSalvando] = useState(false);

  const opcoesDonos = useMemo(
    () => opcoesDeDonos(jogadores, token.donos ?? []),
    [jogadores, token.donos],
  );
  const nomeDoDono = uid =>
    opcoesDonos.find(opcao => opcao.uid === uid)?.label ?? uid;

  const imagemDigitada = valores.imagemUrl.trim();
  const normalizado = montarToken({ ...token, ...valores });
  const erro =
    imagemDigitada && !isUrlImagemValida(imagemDigitada)
      ? 'Informe um link https:// de imagem válido (ou deixe em branco).'
      : validarToken(normalizado);

  const alterar = campo => event =>
    setValores(atual => ({ ...atual, [campo]: event.target.value }));

  const handleSalvar = async () => {
    if (erro) return;
    setSalvando(true);
    try {
      await onSalvar({
        nome: normalizado.nome,
        imagemUrl: normalizado.imagemUrl,
        tamanho: normalizado.tamanho,
        donos: normalizado.donos,
        oculto: normalizado.oculto,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Box
      sx={{ ...painelSx, left: 12 }}
      role="region"
      aria-label="Token selecionado"
    >
      <Box sx={painelCabecalhoSx}>
        <Box>
          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            Token
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
            {ROTULOS_TIPO_TOKEN[token.tipo] ?? 'Avulso'} · coluna{' '}
            {token.col + 1}, linha {token.lin + 1}
          </Typography>
        </Box>
        <IconButton size="small" aria-label="Fechar token" onClick={onFechar}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <TextField
        size="small"
        label="Nome"
        value={valores.nome}
        onChange={alterar('nome')}
        slotProps={{ htmlInput: { maxLength: TOKEN_NOME_MAX } }}
      />
      <TextField
        size="small"
        label="Imagem (link https://)"
        value={valores.imagemUrl}
        onChange={alterar('imagemUrl')}
      />
      <TextField
        select
        size="small"
        label="Tamanho"
        value={valores.tamanho}
        onChange={alterar('tamanho')}
      >
        {OPCOES_TAMANHO_TOKEN.map(opcao => (
          <MenuItem key={opcao.value} value={opcao.value}>
            {opcao.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label="Jogadores que movem"
        value={valores.donos}
        onChange={alterar('donos')}
        helperText={
          opcoesDonos.length === 0
            ? 'Nenhum personagem jogável vinculado a esta campanha.'
            : 'Além de você, só eles podem mover este token.'
        }
        slotProps={{
          select: {
            multiple: true,
            renderValue: selecionados =>
              selecionados.length === 0
                ? 'Só o mestre'
                : selecionados.map(nomeDoDono).join(', '),
            displayEmpty: true,
          },
          inputLabel: { shrink: true },
        }}
      >
        {opcoesDonos.map(opcao => (
          <MenuItem key={opcao.uid} value={opcao.uid}>
            {opcao.label}
          </MenuItem>
        ))}
      </TextField>
      <FormControlLabel
        control={
          <Switch
            checked={valores.oculto}
            onChange={event =>
              setValores(atual => ({ ...atual, oculto: event.target.checked }))
            }
          />
        }
        label="Oculto para os jogadores"
      />

      {erro && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          {erro}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
        <Button color="error" onClick={onRemover}>
          Remover
        </Button>
        <Button
          variant="contained"
          onClick={handleSalvar}
          disabled={Boolean(erro) || salvando}
        >
          Salvar token
        </Button>
      </Box>
    </Box>
  );
};

TokenPainel.propTypes = {
  token: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    imagemUrl: PropTypes.string,
    tipo: PropTypes.string,
    col: PropTypes.number.isRequired,
    lin: PropTypes.number.isRequired,
    tamanho: PropTypes.number,
    donos: PropTypes.arrayOf(PropTypes.string),
    oculto: PropTypes.bool,
  }).isRequired,
  jogadores: PropTypes.arrayOf(
    PropTypes.shape({ uid: PropTypes.string, label: PropTypes.string }),
  ).isRequired,
  onSalvar: PropTypes.func.isRequired,
  onRemover: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
};

export default TokenPainel;
