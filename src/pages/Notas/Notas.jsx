import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getRmNotasPorCampanha,
  removeRmNota,
  getRmCenas,
} from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';

const cardSx = {
  p: 3,
  background: 'linear-gradient(180deg, rgba(11, 14, 22, 0.98), rgba(8, 10, 16, 0.98))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 4,
  boxShadow: '0 22px 56px rgba(0,0,0,0.32)',
  transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(196,58,47,0.35)',
    boxShadow: '0 28px 70px rgba(0,0,0,0.40)',
  },
};


const actionButtonSx = {
  width: 38,
  height: 38,
  color: 'var(--text-primary)',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  transition: 'background 180ms ease, transform 180ms ease, border-color 180ms ease',
  '&:hover': {
    background: 'rgba(255,255,255,0.08)',
    transform: 'translateY(-1px)',
  },
};

const deleteButtonSx = {
  ...actionButtonSx,
  color: '#f16f6f',
  background: 'rgba(241,111,111,0.08)',
  border: '1px solid rgba(241,111,111,0.18)',
  '&:hover': {
    background: 'rgba(241,111,111,0.16)',
  },
};

const previewSx = {
  color: 'var(--text-secondary)',
  minHeight: 96,
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-word',
};



const Notas = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getNotasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmNotasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
  }, [campanhaAtiva]);

  const {
    items: notas,
    loading: loadingNotas,
    error: errorNotas,
    reload: reloadNotas,
    remove: handleRemoveNota,
  } = useEntityCRUD({ getAll: getNotasDaCampanha, remove: removeRmNota });

  const [cenas, setCenas] = useState([]);
  const [notaVisualizada, setNotaVisualizada] = useState(null);

  useEffect(() => {
    if (!campanhaAtiva) return;
    Promise.resolve().then(() =>
      getRmCenas(
        campanhaAtiva.id,
        campanhaAtiva.universoId,
        campanhaAtiva.mestreId,
      )
        .then(setCenas)
        .catch(() => {}),
    );
  }, [campanhaAtiva]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingNotas;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  const abrirNotaVisualizacao = nota => setNotaVisualizada(nota);
  const fecharNotaVisualizacao = () => setNotaVisualizada(null);

  return (
    <Box className="page-container">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
          >
            Notas — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Registre ideias, improvisos e lembretes rápidos desta campanha.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_NOTA)}
            sx={{
              background: 'var(--color-primary)',
              '&:hover': { background: 'var(--color-primary-dark)' },
            }}
          >
            + Nova Nota
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorNotas ? (
        <ListLoadError
          mensagem="Erro ao carregar as notas."
          onRetry={reloadNotas}
        />
      ) : notas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">📝</span>
          <p>Nenhuma nota cadastrada</p>
          <small>Registre ideias, improvisos e lembretes rápidos.</small>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(auto-fill, minmax(280px, 1fr))',
              },
              gap: 2,
            }}
          >
            {notas.map(nota => {
            const cenaVinculada = cenas.find(c => c.id === nota.cenaId);

            return (
              <Paper key={nota.id} elevation={0} sx={cardSx}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.75,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                      >
                        {nota.titulo}
                      </Typography>
                      {cenaVinculada && (
                        <Chip
                          label={`Cena: ${cenaVinculada.titulo}`}
                          size="small"
                          sx={{
                            mt: 1,
                            background: 'rgba(196,58,47,0.12)',
                            color: 'var(--color-accent)',
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Tooltip title="Visualizar" arrow>
                        <IconButton
                          size="small"
                          onClick={() => abrirNotaVisualizacao(nota)}
                          sx={actionButtonSx}
                          aria-label={`Visualizar nota ${nota.titulo}`}
                        >
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {podeEscrever && (
                        <Tooltip title="Editar" arrow>
                          <IconButton
                            size="small"
                            onClick={() =>
                              navigate(ROUTE_PATHS.NOVA_NOTA, { state: { nota } })
                            }
                            sx={actionButtonSx}
                            aria-label={`Editar nota ${nota.titulo}`}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {podeEscrever && (
                        <Tooltip title="Excluir" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveNota(nota.id)}
                            sx={deleteButtonSx}
                            aria-label={`Remover nota ${nota.titulo}`}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      p: 2.5,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 3,
                      minHeight: 108,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={previewSx}
                    >
                      {nota.conteudo || 'Sem conteúdo de nota.'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>

          <Dialog
            open={Boolean(notaVisualizada)}
            onClose={fecharNotaVisualizacao}
            fullWidth
            maxWidth="md"
            slotProps={{
              backdrop: {
                sx: {
                  backgroundColor: 'rgba(0,0,0,0.72)',
                  backdropFilter: 'blur(8px)',
                },
              },
              paper: {
                sx: {
                  bgcolor: 'rgba(8,10,16,0.98)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 42px 120px rgba(0,0,0,0.55)',
                  borderRadius: 4,
                  mx: { xs: 1, sm: 2 },
                },
              },
            }}
          >
            <DialogTitle
              component="div"
              sx={{
                background: 'linear-gradient(180deg, rgba(15,17,25,0.98), rgba(10,12,18,0.98))',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                py: 3,
                px: 3.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 0.5 }}
                  >
                    {notaVisualizada?.titulo}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5 }}
                  >
                    {notaVisualizada?.cenaId ? `Cena vinculada: ${cenas.find(c => c.id === notaVisualizada.cenaId)?.titulo ?? 'Desconhecida'}` : 'Nota rápida'}
                  </Typography>
                </Box>
                <IconButton
                  onClick={fecharNotaVisualizacao}
                  sx={{
                    color: 'var(--text-secondary)',
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.08)',
                    },
                  }}
                  aria-label="Fechar visualização da nota"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ background: 'rgba(12,14,20,0.96)', p: 4 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 4,
                  p: 4,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.8,
                  }}
                >
                  {notaVisualizada?.conteudo || 'Sem conteúdo para exibir.'}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ background: 'rgba(15,17,25,0.98)', px: 3, py: 2 }}>
              <Button
                onClick={fecharNotaVisualizacao}
                sx={{
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                Fechar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default Notas;
