import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const Notas = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getNotasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmNotasPorCampanha(campanhaAtiva.id);
  }, [campanhaAtiva]);

  const {
    items: notas,
    loading: loadingNotas,
    error: errorNotas,
    reload: reloadNotas,
    remove: handleRemoveNota,
  } = useEntityCRUD({ getAll: getNotasDaCampanha, remove: removeRmNota });

  const [cenas, setCenas] = useState([]);

  useEffect(() => {
    if (!campanhaAtiva) return;
    Promise.resolve().then(() =>
      getRmCenas()
        .then(todas =>
          setCenas(todas.filter(c => c.campanhaId === campanhaAtiva.id)),
        )
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
              '&:hover': { background: '#5a2090' },
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
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {nota.titulo}
                  </Typography>
                  {podeEscrever && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(ROUTE_PATHS.NOVA_NOTA, { state: { nota } })
                        }
                        sx={{ color: 'var(--color-accent)' }}
                        aria-label={`Editar nota ${nota.titulo}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveNota(nota.id)}
                        sx={{ color: '#ef4444' }}
                        aria-label={`Remover nota ${nota.titulo}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {cenaVinculada && (
                  <Chip
                    label={`Cena: ${cenaVinculada.titulo}`}
                    size="small"
                    sx={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--color-accent)',
                      mb: 1,
                    }}
                  />
                )}

                {nota.conteudo && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--text-secondary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {nota.conteudo}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Notas;
