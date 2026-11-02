import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import {
  linhaParticipanteSx,
  listaParticipantesSx,
  nomeParticipanteSx,
} from './styles';

const numeroReacao = texto => {
  const valor = Number(String(texto ?? '').replace(',', '.'));
  return Number.isFinite(valor) ? Math.round(valor) : 0;
};

const rotuloDoToken = token =>
  `${token.nome}${token.oculto ? ' (oculto)' : ''}`;

/**
 * Participantes do combate em andamento: reordenar (Subir/Descer), tirar do
 * combate e acrescentar tokens da cena que ficaram de fora (rolam a própria
 * iniciativa na hora). Nada aqui gera mensagem no chat. `combate` é o estado
 * normalizado (common/utils/gridCombate.js).
 */
const ParticipantesCombateDialog = ({
  open,
  combate,
  tokens,
  reacaoDoToken,
  onMover,
  onRemover,
  onAdicionar,
  onClose,
}) => {
  const [manuais, setManuais] = useState({});
  const [ocupado, setOcupado] = useState(false);

  const porId = new Map(tokens.map(token => [token.id, token]));
  const naOrdem = new Set((combate?.ordem ?? []).map(item => item.tokenId));
  const fora = tokens.filter(token => !naOrdem.has(token.id));

  const executar = async acao => {
    setOcupado(true);
    try {
      await acao();
    } finally {
      setOcupado(false);
    }
  };

  const ordem = combate?.ordem ?? [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Participantes do combate</DialogTitle>
      <DialogContent>
        {ordem.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Nenhum combate em andamento.
          </Typography>
        ) : (
          <Box component="ul" sx={listaParticipantesSx}>
            {ordem.map((item, indice) => {
              const token = porId.get(item.tokenId);
              const nome = token ? rotuloDoToken(token) : 'Token removido';
              const nomeCurto = token?.nome ?? 'token removido';
              return (
                <Box
                  component="li"
                  key={item.tokenId}
                  sx={linhaParticipanteSx}
                  aria-current={indice === combate.indice ? 'true' : undefined}
                >
                  <Typography sx={nomeParticipanteSx}>
                    {nome}
                    {indice === combate.indice ? ' · vez atual' : ''}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ color: 'var(--text-muted)', ml: 1 }}
                    >
                      iniciativa {item.iniciativa}
                    </Typography>
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Subir ${nomeCurto}`}
                    disabled={ocupado || indice === 0}
                    onClick={() => executar(() => onMover(item.tokenId, -1))}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Descer ${nomeCurto}`}
                    disabled={ocupado || indice === ordem.length - 1}
                    onClick={() => executar(() => onMover(item.tokenId, 1))}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Tirar ${nomeCurto} do combate`}
                    disabled={ocupado}
                    onClick={() => executar(() => onRemover(item.tokenId))}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}

        {ordem.length > 0 && fora.length > 0 && (
          <>
            <Typography
              variant="overline"
              component="h3"
              sx={{ display: 'block', mt: 2, color: 'var(--text-secondary)' }}
            >
              Adicionar
            </Typography>
            <Box component="ul" sx={listaParticipantesSx}>
              {fora.map(token => {
                const daFicha = reacaoDoToken(token);
                return (
                  <Box component="li" key={token.id} sx={linhaParticipanteSx}>
                    <Typography sx={nomeParticipanteSx}>
                      {rotuloDoToken(token)}
                    </Typography>
                    {daFicha !== null ? (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Reação {daFicha} (da ficha)
                      </Typography>
                    ) : (
                      <TextField
                        size="small"
                        label="Reação"
                        value={manuais[token.id] ?? '0'}
                        onChange={event =>
                          setManuais(atual => ({
                            ...atual,
                            [token.id]: event.target.value,
                          }))
                        }
                        slotProps={{
                          htmlInput: {
                            inputMode: 'numeric',
                            'aria-label': `Reação de ${token.nome}`,
                          },
                        }}
                        sx={{ width: 90 }}
                      />
                    )}
                    <Button
                      size="small"
                      disabled={ocupado}
                      aria-label={`Adicionar ${token.nome}`}
                      onClick={() =>
                        executar(() =>
                          onAdicionar({
                            tokenId: token.id,
                            reacao: daFicha ?? numeroReacao(manuais[token.id]),
                          }),
                        )
                      }
                    >
                      Adicionar
                    </Button>
                  </Box>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

ParticipantesCombateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  combate: PropTypes.shape({
    indice: PropTypes.number.isRequired,
    ordem: PropTypes.arrayOf(
      PropTypes.shape({
        tokenId: PropTypes.string.isRequired,
        iniciativa: PropTypes.number,
      }),
    ).isRequired,
  }),
  tokens: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
      oculto: PropTypes.bool,
    }),
  ).isRequired,
  reacaoDoToken: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  onRemover: PropTypes.func.isRequired,
  onAdicionar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ParticipantesCombateDialog;
