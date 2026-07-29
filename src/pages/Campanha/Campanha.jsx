import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
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
  const { canCreate, canWrite } = useAuth();
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
        {canCreate() && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_CAMPANHA)}
            sx={{
              background: 'var(--color-primary)',
              '&:hover': { background: '#5a2090' },
            }}
          >
            + Nova Campanha
          </Button>
        )}
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
          <small>Crie sua primeira Campanha para montar o fluxograma de cenas.</small>
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
            const podeEscrever = canWrite(campanha.universoId);

            return (
              <Card key={campanha.id} elevation={0}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  {ativa && (
                    <Chip
                      label="Ativa"
                      size="small"
                      sx={{
                        background: 'var(--color-accent)',
                        color: 'var(--bg-primary)',
                        fontWeight: 700,
                      }}
                    />
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
                            color: 'var(--color-accent)',
                            '&:hover': { opacity: 0.8 },
                          }}
                          aria-label={`Editar campanha ${campanha.nome}`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRemove(campanha.id)}
                          sx={{ color: '#ef4444', '&:hover': { color: '#ef4444' } }}
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
                    sx={{
                      width: '100%',
                      height: 180,
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

                <Typography
                  variant="h6"
                  sx={{ color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.2 }}
                >
                  {campanha.nome}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--color-accent)', fontWeight: 600, display: 'block', mb: 1 }}
                >
                  {universos.find(u => u.id === campanha.universoId)?.Nome ||
                    'Universo Desconhecido'}
                </Typography>
                {campanha.descricao && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--text-secondary)',
                      mt: 0.5,
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {campanha.descricao}
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant={ativa ? 'outlined' : 'contained'}
                    disabled={ativa}
                    onClick={() => setCampanhaAtiva(campanha.id)}
                    sx={
                      ativa
                        ? { color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }
                        : { background: 'var(--color-primary)', '&:hover': { background: '#5a2090' } }
                    }
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
                        '&:hover': { background: '#00b8dd' },
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
