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
import { getRmMissoes, removeRmMissao } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import { ROUTE_PATHS } from 'common/constants/routes';
import { STATUS_MISSAO_OPCOES } from './missaoUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const Missoes = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getMissoesDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmMissoes().then(todas =>
      todas.filter(m => m.campanhaId === campanhaAtiva.id),
    );
  }, [campanhaAtiva]);

  const {
    items: missoes,
    loading: loadingMissoes,
    remove: handleRemoveMissao,
  } = useEntityCRUD({ getAll: getMissoesDaCampanha, remove: removeRmMissao });

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingMissoes;
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
            Missões — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Acompanhamento de objetivos e recompensas desta campanha.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_MISSAO)}
            sx={{ background: 'var(--color-primary)', '&:hover': { background: '#5a2090' } }}
          >
            + Nova Missão
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : missoes.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">📜</span>
          <p>Nenhuma missão cadastrada</p>
          <small>Cadastre uma missão para acompanhar objetivos e recompensas.</small>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {missoes.map(missao => {
            const status = STATUS_MISSAO_OPCOES.find(o => o.value === missao.status);
            const objetivos = missao.objetivos ?? [];
            const concluidos = objetivos.filter(o => o.concluido).length;

            return (
              <Paper key={missao.id} elevation={0} sx={cardSx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {missao.titulo}
                    </Typography>
                    {status && (
                      <Chip
                        label={status.label}
                        size="small"
                        sx={{ background: status.cor, color: '#fff', fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  {podeEscrever && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(ROUTE_PATHS.NOVA_MISSAO, { state: { missao } })}
                        sx={{ color: 'var(--color-accent)' }}
                        aria-label={`Editar missão ${missao.titulo}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMissao(missao.id)}
                        sx={{ color: '#ef4444' }}
                        aria-label={`Remover missão ${missao.titulo}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {missao.descricao && (
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                    {missao.descricao}
                  </Typography>
                )}

                {objetivos.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                    Objetivos: {concluidos}/{objetivos.length} concluídos
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

export default Missoes;
