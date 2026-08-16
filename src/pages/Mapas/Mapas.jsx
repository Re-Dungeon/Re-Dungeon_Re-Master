import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { getRmMapasPorCampanha, removeRmMapa } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import { MAPA_CATEGORIA_OPCOES } from './mapaUtils';

const cardSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'linear-gradient(180deg, rgba(23, 27, 34, 0.96), rgba(17, 20, 26, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  overflow: 'hidden',
  boxShadow: '0 18px 38px rgba(0, 0, 0, 0.22)',
  transition:
    'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    boxShadow: '0 22px 44px rgba(0, 0, 0, 0.3)',
  },
};

const mediaSx = {
  position: 'relative',
  height: 220,
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-primary)',
  overflow: 'hidden',
  '&:hover .mapa-image': {
    transform: 'scale(1.02)',
  },
};

const contentSx = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  p: 2,
};

const titleSx = {
  color: 'var(--text-primary)',
  fontWeight: 700,
  fontSize: '1.1rem',
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: '2.8em',
};

const descriptionSx = {
  color: 'var(--text-secondary)',
  fontSize: '0.88rem',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: '3em',
  mb: 1.5,
};

const badgeSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 1,
  py: 0.45,
  borderRadius: 1.5,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(10, 12, 16, 0.66)',
  color: 'var(--text-primary)',
  fontSize: '0.62rem',
  letterSpacing: '0.12em',
  fontWeight: 700,
  textTransform: 'uppercase',
  backdropFilter: 'blur(6px)',
};

const actionButtonSx = {
  width: 30,
  height: 30,
  borderRadius: 1.5,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(9, 12, 16, 0.72)',
  color: 'var(--text-primary)',
  backdropFilter: 'blur(6px)',
  transition: 'all 180ms ease',
  '&:hover': {
    background: 'rgba(196, 58, 47, 0.12)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    color: 'var(--color-accent)',
  },
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
              '&:hover': { background: 'var(--color-primary-dark)' },
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
          <span className="empty-state-icon">�️</span>
          <p>Nenhum mapa criado</p>
          <small>Crie seu primeiro mapa para começar</small>
          {canCreate() && podeEscrever && (
            <Button
              variant="contained"
              onClick={() => navigate(ROUTE_PATHS.NOVO_MAPA)}
              sx={{
                mt: 2,
                background: 'var(--color-primary)',
                '&:hover': { background: 'var(--color-primary-dark)' },
              }}
            >
              + Novo Mapa
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fit, minmax(280px, 1fr))',
              xl: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2.5,
            alignItems: 'stretch',
          }}
        >
          {mapas.map(mapa => {
            const categoria = MAPA_CATEGORIA_OPCOES.find(
              o => o.value === mapa.categoria,
            );
            const categoriaLabel = categoria ? categoria.label : 'Outro';

            return (
              <Paper key={mapa.id} elevation={0} sx={cardSx}>
                <Box sx={mediaSx}>
                  {mapa.linkImagem ? (
                    <Box
                      component="img"
                      className="mapa-image"
                      src={mapa.linkImagem}
                      alt={mapa.nome}
                      loading="lazy"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 220ms ease',
                      }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.75,
                        background:
                          'linear-gradient(180deg, rgba(18,21,26,0.8), rgba(17,20,26,0.98))',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <MapOutlinedIcon sx={{ fontSize: 32 }} />
                      <Typography variant="caption">Sem imagem</Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(10, 12, 16, 0.08), rgba(10, 12, 16, 0.68) 100%)',
                    }}
                  />

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1,
                    }}
                  >
                    <Box sx={badgeSx}>{categoriaLabel.toUpperCase()}</Box>
                  </Box>

                  <Box
                    sx={{
                      position: 'absolute',
                      left: 12,
                      bottom: 12,
                      zIndex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                    }}
                  >
                    <MapOutlinedIcon
                      sx={{ fontSize: 14, color: 'var(--text-primary)' }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--text-primary)',
                        letterSpacing: '0.12em',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.62rem',
                      }}
                    >
                      Mapa
                    </Typography>
                  </Box>

                  {podeEscrever && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        zIndex: 1,
                        display: 'flex',
                        gap: 0.75,
                      }}
                    >
                      <IconButton
                        size="small"
                        title={`Editar mapa ${mapa.nome}`}
                        onClick={() =>
                          navigate(ROUTE_PATHS.NOVO_MAPA, { state: { mapa } })
                        }
                        sx={actionButtonSx}
                        aria-label={`Editar mapa ${mapa.nome}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title={`Remover mapa ${mapa.nome}`}
                        onClick={() => handleRemoveMapa(mapa.id)}
                        sx={{
                          ...actionButtonSx,
                          color: '#fca5a5',
                          '&:hover': {
                            background: 'rgba(127, 29, 29, 0.35)',
                            borderColor: 'rgba(248, 113, 113, 0.5)',
                            color: '#fecaca',
                          },
                        }}
                        aria-label={`Remover mapa ${mapa.nome}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Box sx={contentSx}>
                  <Typography variant="h6" sx={titleSx}>
                    {mapa.nome}
                  </Typography>

                  {mapa.descricao ? (
                    <Typography variant="body2" sx={descriptionSx}>
                      {mapa.descricao}
                    </Typography>
                  ) : (
                    <Box sx={{ minHeight: '3em', mb: 1.5 }} />
                  )}

                  <Box
                    sx={{
                      mt: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      pt: 1.25,
                      borderTop: '1px solid var(--border-primary)',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        minWidth: 0,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <MapOutlinedIcon sx={{ fontSize: 14 }} />
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mapa
                        {categoria && ` • ${categoriaLabel}`}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Mapas;
