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
import { getRmNpcs, removeRmNpc } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import { ROUTE_PATHS } from 'common/constants/routes';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const Npcs = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getNpcsDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmNpcs().then(todos => todos.filter(n => n.campanhaId === campanhaAtiva.id));
  }, [campanhaAtiva]);

  const {
    items: npcs,
    loading: loadingNpcs,
    remove: handleRemoveNpc,
  } = useEntityCRUD({ getAll: getNpcsDaCampanha, remove: removeRmNpc });

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingNpcs;
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
            NPCs — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Elenco de NPCs desta campanha, importados do Universo ou criados do zero.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVO_NPC)}
            sx={{ background: 'var(--color-primary)', '&:hover': { background: '#5a2090' } }}
          >
            + Novo NPC
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : npcs.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🧑</span>
          <p>Nenhum NPC cadastrado</p>
          <small>Importe um personagem do universo ou crie um NPC do zero.</small>
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
          {npcs.map(npc => (
            <Paper key={npc.id} elevation={0} sx={cardSx}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {npc.nome}
                </Typography>
                {podeEscrever && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(ROUTE_PATHS.NOVO_NPC, { state: { npc } })}
                      sx={{ color: 'var(--color-accent)' }}
                      aria-label={`Editar NPC ${npc.nome}`}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveNpc(npc.id)}
                      sx={{ color: '#ef4444' }}
                      aria-label={`Remover NPC ${npc.nome}`}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {npc.linkImagem && (
                <Box
                  component="img"
                  src={npc.linkImagem}
                  alt={npc.nome}
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

              {npc.descricaoBase && (
                <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                  {npc.descricaoBase}
                </Typography>
              )}
              {npc.origemPersonagemId && (
                <Typography variant="caption" sx={{ color: 'var(--color-accent)', display: 'block', mt: 1 }}>
                  Importado do Universo
                </Typography>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Npcs;
