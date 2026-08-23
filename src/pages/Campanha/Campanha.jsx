import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { removeRmCampanha } from 'service/storage';
import useUniversos from 'hooks/useUniversos';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import { CampanhaCard, CampanhaCardAtiva } from './styles';

const Campanha = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const {
    campanhas,
    loadingCampanhas,
    errorCampanhas,
    campanhaAtivaId,
    setCampanhaAtiva,
    recarregarCampanhas,
  } = useCampanha();
  const { universos, loadingUniversos } = useUniversos();
  const loading = loadingCampanhas || loadingUniversos;

  const handleRemove = async id => {
    await removeRmCampanha(id);
    if (id === campanhaAtivaId) setCampanhaAtiva(null);
    await recarregarCampanhas();
  };

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
            Campanha
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Crie e selecione a campanha ativa para rodar sua sessão.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate(ROUTE_PATHS.NOVA_CAMPANHA)}
          sx={{
            background: 'var(--color-primary)',
            '&:hover': { background: 'var(--color-primary-dark)' },
          }}
          aria-label="+ Nova Campanha"
        >
          + Nova Campanha
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorCampanhas ? (
        <ListLoadError
          mensagem="Erro ao carregar as campanhas."
          onRetry={recarregarCampanhas}
        />
      ) : campanhas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🗺️</span>
          <p>Nenhuma campanha cadastrada</p>
          <small>
            Crie sua primeira Campanha para montar o fluxograma de cenas.
          </small>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(320px, 1fr))',
              md: 'repeat(auto-fill, minmax(360px, 1fr))',
            },
            gap: 2,
          }}
        >
          {campanhas.map(campanha => {
            const ativa = campanha.id === campanhaAtivaId;
            const Card = ativa ? CampanhaCardAtiva : CampanhaCard;
            const podeEscrever =
              isAdmin || campanha.mestreId === currentUser.uid;

            return (
              <Card key={campanha.id} elevation={0}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                    gap: 2,
                  }}
                >
                  {ativa ? (
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--color-accent)',
                        fontWeight: 800,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        background: 'rgba(196, 58, 47, 0.12)',
                        px: 2,
                        py: 0.75,
                        borderRadius: '999px',
                      }}
                    >
                      Ativa
                    </Typography>
                  ) : (
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#9FA7B2',
                        fontWeight: 700,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        background: 'rgba(255, 255, 255, 0.04)',
                        px: 2,
                        py: 0.75,
                        borderRadius: '999px',
                      }}
                    >
                      Inativa
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                    {podeEscrever && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(ROUTE_PATHS.NOVA_CAMPANHA, {
                              state: { campanha },
                            })
                          }
                          sx={{
                            color: 'rgba(255,255,255,0.84)',
                            background: 'rgba(255,255,255,0.04)',
                            '&:hover': { background: 'rgba(255,255,255,0.08)' },
                          }}
                          aria-label={`Editar campanha ${campanha.nome}`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(campanha.id)}
                          sx={{
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.08)',
                            '&:hover': {
                              background: 'rgba(239, 68, 68, 0.16)',
                            },
                          }}
                          aria-label={`Remover campanha ${campanha.nome}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>

                {campanha.linkImagem && (
                  <Box
                    component="img"
                    src={campanha.linkImagem}
                    alt={campanha.nome}
                    loading="lazy"
                    sx={{
                      width: '100%',
                      height: 210,
                      borderRadius: '20px',
                      objectFit: 'cover',
                      display: 'block',
                      mb: 2,
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                      transition: 'transform 280ms ease',
                      '&:hover': {
                        transform: 'scale(1.02)',
                      },
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                <Typography
                  variant="h5"
                  sx={{
                    color: '#FFFFFF',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    mb: 1,
                  }}
                >
                  {campanha.nome}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#7e8a99',
                    fontWeight: 600,
                    display: 'block',
                    mb: 1.5,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {universos.find(u => u.id === campanha.universoId)?.Nome ||
                    'Universo Desconhecido'}
                </Typography>
                {campanha.descricao && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#c3cad6',
                      mt: 0.5,
                      mb: 2.5,
                      minHeight: 72,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {campanha.descricao}
                  </Typography>
                )}

                <Box sx={{ display: 'grid', gap: 1.25 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={ativa}
                    onClick={() => setCampanhaAtiva(campanha.id)}
                    sx={{
                      color: '#FFFFFF',
                      background: ativa
                        ? 'rgba(196, 58, 47, 0.16)'
                        : 'var(--color-primary)',
                      border: ativa
                        ? '1px solid rgba(196, 58, 47, 0.32)'
                        : '1px solid rgba(143, 35, 28, 0.36)',
                      py: 1.25,
                      fontWeight: 700,
                      textTransform: 'none',
                      '&:hover': {
                        background: ativa
                          ? 'rgba(196, 58, 47, 0.24)'
                          : 'var(--color-primary-dark)',
                      },
                    }}
                  >
                    {ativa ? 'Campanha Ativa' : 'Selecionar Campanha'}
                  </Button>
                  {ativa && (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(ROUTE_PATHS.CENAS)}
                      sx={{
                        background: 'var(--color-accent)',
                        color: 'var(--bg-primary)',
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 1.25,
                        border: '1px solid rgba(196, 58, 47, 0.4)',
                        '&:hover': { background: 'var(--color-primary-light)' },
                      }}
                    >
                      Ver Cenas →
                    </Button>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Campanha;
