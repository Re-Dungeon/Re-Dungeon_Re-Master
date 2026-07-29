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
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { getRmCriaturas, removeRmCriatura } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import { ROUTE_PATHS } from 'common/constants/routes';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const Criaturas = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getCriaturasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmCriaturas().then(todos =>
      todos.filter(c => c.campanhaId === campanhaAtiva.id),
    );
  }, [campanhaAtiva]);

  const {
    items: criaturas,
    loading: loadingCriaturas,
    remove: handleRemoveCriatura,
  } = useEntityCRUD({ getAll: getCriaturasDaCampanha, remove: removeRmCriatura });

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingCriaturas;
  const podeEscrever = campanhaAtiva ? canWrite(campanhaAtiva.universoId) : false;

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
          <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}>
            Criaturas — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Monstros e adversários desta campanha, importados do Universo ou criados do zero.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_CRIATURA)}
            sx={{ background: 'var(--color-primary)', '&:hover': { background: '#5a2090' } }}
          >
            + Nova Criatura
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : criaturas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🐉</span>
          <p>Nenhuma criatura cadastrada</p>
          <small>Cadastre uma criatura para usar em encontros da campanha.</small>
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
          {criaturas.map(criatura => (
            <Paper key={criatura.id} elevation={0} sx={cardSx}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {criatura.nome}
                </Typography>
                {podeEscrever && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(ROUTE_PATHS.NOVA_CRIATURA, { state: { criatura } })
                      }
                      sx={{ color: 'var(--color-accent)' }}
                      aria-label={`Editar criatura ${criatura.nome}`}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveCriatura(criatura.id)}
                      sx={{ color: '#ef4444' }}
                      aria-label={`Remover criatura ${criatura.nome}`}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {criatura.linkImagem && (
                <Box
                  component="img"
                  src={criatura.linkImagem}
                  alt={criatura.nome}
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

              {criatura.descricaoBase && (
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  {criatura.descricaoBase}
                </Typography>
              )}
              {criatura.origemPersonagemId && (
                <Typography variant="caption" sx={{ color: 'var(--color-accent)', display: 'block', mt: 1 }}>
                  Importada do Universo
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Criaturas;
