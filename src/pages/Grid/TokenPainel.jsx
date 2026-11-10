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
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { isUrlImagemValida } from 'common/utils/chat';
import {
  ROTULOS_TIPO_TOKEN,
  TOKEN_NOME_MAX,
  montarToken,
  validarToken,
} from 'common/utils/grid';
import { OPCOES_TAMANHO_TOKEN, opcoesDeDonos } from './gridMestre';
import TokenCombate from './TokenCombate';
import { painelCabecalhoSx, painelLadoSx } from './styles';

/**
 * Edição do token selecionado no Grid: nome/imagem (cópias feitas na
 * criação), tamanho em células, jogadores que podem movê-lo e se está oculto
 * para os jogadores (esses só gravam em "Salvar token"). Em cima, o combate
 * (TokenCombate: PV/Energia/Fadiga, condições, aura), que grava na hora via
 * `onAlterar(patch)`. Quem monta usa `key={token.id}` para recomeçar o
 * formulário ao trocar de token.
 */
const TokenPainel = ({
  token,
  jogadores,
  condicoes,
  detalhe,
  onSalvar,
  onAlterar,
  onRemover,
  onDuplicar,
  onFechar,
  onRolar,
  rodada = null,
  abaixoDaFaixa = false,
}) => {
  const [valores, setValores] = useState({
    nome: token.nome ?? '',
    imagemUrl: token.imagemUrl ?? '',
    tamanho: token.tamanho ?? 1,
    donos: token.donos ?? [],
  });
  // "Oculto" do interruptor, ainda não salvo: { valor, base } vale enquanto o
  // token continua como estava (`base`) — se ele muda por fora (olho, tecla
  // H, ação em lote), vale o do token.
  const [ocultoEditado, setOcultoEditado] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const ocultoDoToken = Boolean(token.oculto);
  const oculto =
    ocultoEditado && ocultoEditado.base === ocultoDoToken
      ? ocultoEditado.valor
      : ocultoDoToken;

  const opcoesDonos = useMemo(
    () => opcoesDeDonos(jogadores, token.donos ?? []),
    [jogadores, token.donos],
  );
  const nomeDoDono = uid =>
    opcoesDonos.find(opcao => opcao.uid === uid)?.label ?? uid;

  const imagemDigitada = valores.imagemUrl.trim();
  const normalizado = montarToken({ ...token, ...valores, oculto });
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

  // Olho: oculta/revela na hora (sem passar por "Salvar token").
  const handleAlternarOculto = () => {
    setOcultoEditado(null);
    onAlterar({ oculto: !oculto });
  };

  return (
    <Box
      sx={painelLadoSx('left', abaixoDaFaixa)}
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
        {onRolar && (
          <Button size="small" aria-label="Rolar pelo token" onClick={onRolar}>
            Rolar…
          </Button>
        )}
        <IconButton
          size="small"
          aria-label={
            oculto ? 'Revelar aos jogadores' : 'Ocultar dos jogadores'
          }
          aria-pressed={oculto}
          title={
            oculto
              ? 'Oculto para os jogadores (H) — clique para revelar'
              : 'Visível para os jogadores (H) — clique para ocultar'
          }
          onClick={handleAlternarOculto}
        >
          {oculto ? (
            <VisibilityOffIcon fontSize="small" />
          ) : (
            <VisibilityIcon fontSize="small" />
          )}
        </IconButton>
        <IconButton size="small" aria-label="Fechar token" onClick={onFechar}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <TokenCombate
        token={token}
        condicoes={condicoes}
        detalhe={detalhe}
        onAlterar={onAlterar}
        rodada={rodada}
      />

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
            checked={oculto}
            onChange={event =>
              setOcultoEditado({
                valor: event.target.checked,
                base: ocultoDoToken,
              })
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
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button color="error" onClick={onRemover}>
            Remover
          </Button>
          {onDuplicar && (
            <Button onClick={onDuplicar} aria-label={`Duplicar ${token.nome}`}>
              Duplicar
            </Button>
          )}
        </Box>
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
    pv: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
    energia: PropTypes.shape({
      atual: PropTypes.number,
      max: PropTypes.number,
    }),
    fadiga: PropTypes.shape({
      atual: PropTypes.number,
      max: PropTypes.number,
    }),
    mostrarRecursos: PropTypes.string,
    condicoes: PropTypes.arrayOf(PropTypes.string),
    condicoesDuracao: PropTypes.object,
    aura: PropTypes.shape({ raio: PropTypes.number, cor: PropTypes.string }),
    deslocamento: PropTypes.number,
  }).isRequired,
  jogadores: PropTypes.arrayOf(
    PropTypes.shape({ uid: PropTypes.string, label: PropTypes.string }),
  ).isRequired,
  // Catálogo de condições do universo ({ id, nome|Nome, linkImagem }).
  condicoes: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired }),
  ).isRequired,
  // detalhes[token.id] de useGridCampanha (resumo do token de jogador).
  detalhe: PropTypes.shape({
    recursos: PropTypes.object,
    condicoes: PropTypes.arrayOf(PropTypes.object),
    pp: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
  }),
  onSalvar: PropTypes.func.isRequired,
  onAlterar: PropTypes.func.isRequired,
  onRemover: PropTypes.func.isRequired,
  onDuplicar: PropTypes.func,
  onFechar: PropTypes.func.isRequired,
  onRolar: PropTypes.func,
  // Rodada atual do combate da cena (null = sem combate): duração das condições.
  rodada: PropTypes.number,
  // Combate em andamento: a faixa de iniciativa ocupa o topo do mapa.
  abaixoDaFaixa: PropTypes.bool,
};

export default TokenPainel;
