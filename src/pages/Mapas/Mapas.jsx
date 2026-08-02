import React, { useCallback, useEffect } from 'react';
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
import { getRmMapasPorCampanha, removeRmMapa } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import { MAPA_CATEGORIA_OPCOES } from './mapaUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const Mapas = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getMapasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmMapasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
  }, [campanhaAtiva]);

  const {
    items: mapas,
    loading: loadingMapas,
    error: errorMapas,
    reload: reloadMapas,
    remove: handleRemoveMapa,
  } = useEntityCRUD({ getAll: getMapasDaCampanha, remove: removeRmMapa });

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingMapas;
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
            Mapas — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Biblioteca de mapas desta campanha, prontos para consulta durante a
            sessão.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVO_MAPA)}
            sx={{
              background: 'var(--color-primary)',
              '&:hover': { background: '#5a2090' },
            }}
          >
            + Novo Mapa
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorMapas ? (
        <ListLoadError
          mensagem="Erro ao carregar os mapas."
          onRetry={reloadMapas}
        />
      ) : mapas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🖼️</span>
          <p>Nenhum mapa cadastrado</p>
          <small>Cadastre um mapa para ter à mão durante o combate.</small>
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
          {mapas.map(mapa => {
            const categoria = MAPA_CATEGORIA_OPCOES.find(
              o => o.value === mapa.categoria,
            );
            return (
              <Paper key={mapa.id} elevation={0} sx={cardSx}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {mapa.nome}
                    </Typography>
                    {categoria && (
                      <Chip
                        label={categoria.label}
                        size="small"
                        sx={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--color-accent)',
                        }}
                      />
                    )}
                  </Box>
                  {podeEscrever && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(ROUTE_PATHS.NOVO_MAPA, { state: { mapa } })
                        }
                        sx={{ color: 'var(--color-accent)' }}
                        aria-label={`Editar mapa ${mapa.nome}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMapa(mapa.id)}
                        sx={{ color: '#ef4444' }}
                        aria-label={`Remover mapa ${mapa.nome}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {mapa.linkImagem && (
                  <Box
                    component="img"
                    src={mapa.linkImagem}
                    alt={mapa.nome}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: 160,
                      borderRadius: 2,
                      objectFit: 'cover',
                      display: 'block',
                      border: '1px solid var(--border-primary)',
                      mb: 1.5,
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {mapa.descricao && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    {mapa.descricao}
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

export default Mapas;
