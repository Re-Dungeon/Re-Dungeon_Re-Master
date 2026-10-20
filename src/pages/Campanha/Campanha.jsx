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
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 0.5 }}
          >
            Campanhas
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Crie e selecione a campanha ativa para rodar sua sessão.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate(ROUTE_PATHS.NOVA_CAMPANHA)}
          sx={{
            background: 'linear-gradient(135deg, #7f1d1d, var(--color-primary))',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 26px rgba(117, 28, 28, 0.28)',
            '&:hover': { background: 'linear-gradient(135deg, #9b2c2c, #6c2d9d)' },
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
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 1.5,
            alignItems: 'stretch',
            width: '100%',
            maxWidth: '100%',
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
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '18px 18px 0 0',
                    minHeight: 154,
                    maxHeight: 154,
                    background: 'linear-gradient(180deg, rgba(17,22,29,0.12), rgba(6,9,13,0.7))',
                  }}
                >
                  {campanha.linkImagem ? (
                    <Box
                      component="img"
                      src={campanha.linkImagem}
                      alt={campanha.nome}
                      loading="lazy"
                      sx={{
                        width: '100%',
                        height: 154,
                        objectFit: 'cover',
                        display: 'block',
                        filter: 'saturate(1.08) contrast(1.04)',
                        transition: 'transform 280ms ease',
                        '&:hover': {
                          transform: 'scale(1.04)',
                        },
                      }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 154,
                        background:
                          'linear-gradient(135deg, rgba(103, 69, 137, 0.9), rgba(17, 25, 40, 0.9))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.78)',
                        fontSize: 38,
                      }}
                    >
                      🗺️
                    </Box>
                  )}

                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(8,10,16,0.12) 0%, rgba(8,10,16,0.68) 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      zIndex: 2,
                      px: 1.5,
                      py: 0.7,
                      borderRadius: '999px',
                      border: ativa
                        ? '1px solid rgba(255, 132, 132, 0.6)'
                        : '1px solid rgba(255,255,255,0.12)',
                      background: ativa
                        ? 'rgba(196, 58, 47, 0.18)'
                        : 'rgba(20, 25, 34, 0.68)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        color: ativa ? '#ffd7d7' : '#dfe7f2',
                        fontWeight: 800,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        fontSize: 10,
                      }}
                    >
                      {ativa ? 'Ativa' : 'Inativa'}
                    </Typography>
                  </Box>

                  {podeEscrever && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        display: 'flex',
                        gap: 0.75,
                        zIndex: 2,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(ROUTE_PATHS.NOVA_CAMPANHA, {
                            state: { campanha },
                          })
                        }
                        sx={{
                          color: '#f8fbff',
                          background: 'rgba(15, 17, 25, 0.55)',
                          border: '1px solid rgba(255,255,255,0.14)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { background: 'rgba(26, 31, 42, 0.8)' },
                        }}
                        aria-label={`Editar campanha ${campanha.nome}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemove(campanha.id)}
                        sx={{
                          color: '#ff9a9a',
                          background: 'rgba(69, 17, 17, 0.52)',
                          border: '1px solid rgba(255,160,160,0.22)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { background: 'rgba(101, 24, 24, 0.78)' },
                        }}
                        aria-label={`Remover campanha ${campanha.nome}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    p: 2.25,
                    pt: 1.75,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: 800,
                      lineHeight: 1.2,
                      mb: 0.65,
                      minHeight: '2.4em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {campanha.nome}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9aa5b5',
                      fontWeight: 700,
                      display: 'block',
                      mb: 0.85,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontSize: '0.65rem',
                    }}
                  >
                    {universos.find(u => u.id === campanha.universoId)?.Nome ||
                      'Universo Desconhecido'}
                  </Typography>
                  {campanha.descricao && (
                    <Box
                      sx={{
                        flex: 1,
                        minHeight: 112,
                        maxHeight: 112,
                        overflowY: 'auto',
                        pr: 0.75,
                        mb: 1.5,
                        color: '#c7ced9',
                        lineHeight: 1.5,
                        fontSize: '0.78rem',
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(255,255,255,0.04)',
                          borderRadius: '999px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(196, 58, 47, 0.72)',
                          borderRadius: '999px',
                          border: '2px solid transparent',
                          backgroundClip: 'padding-box',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: 'rgba(196, 58, 47, 0.92)',
                          backgroundClip: 'padding-box',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#c7ced9',
                          lineHeight: 1.5,
                          fontSize: '0.78rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {campanha.descricao}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'grid', gap: 0.85, mt: 'auto' }}>
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={ativa}
                      onClick={() => setCampanhaAtiva(campanha.id)}
                      sx={{
                        color: '#FFFFFF',
                        background: ativa
                          ? 'rgba(196, 58, 47, 0.14)'
                          : 'linear-gradient(135deg, #8b1e1e, var(--color-primary))',
                        border: ativa
                          ? '1px solid rgba(196, 58, 47, 0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                        py: 0.9,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: ativa ? 'none' : '0 10px 18px rgba(140, 39, 39, 0.18)',
                        '&:hover': {
                          background: ativa
                            ? 'rgba(196, 58, 47, 0.22)'
                            : 'linear-gradient(135deg, #a22525, #7a2abc)',
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
                          background: 'linear-gradient(135deg, #e7b36b, #d95b45)',
                          color: '#15181f',
                          fontWeight: 800,
                          textTransform: 'none',
                          py: 0.9,
                          fontSize: '0.78rem',
                          border: '1px solid rgba(255,255,255,0.14)',
                          boxShadow: '0 10px 18px rgba(193, 92, 58, 0.14)',
                          '&:hover': { background: 'linear-gradient(135deg, #f7cb80, #e36d4e)' },
                        }}
                      >
                        Ver Cenas →
                      </Button>
                    )}
                  </Box>
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
