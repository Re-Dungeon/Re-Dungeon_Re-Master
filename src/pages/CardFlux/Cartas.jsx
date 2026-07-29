import React, { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { getRmCardfluxCartas, removeRmCardfluxCarta, updateRmCardfluxCarta } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import { ROUTE_PATHS } from 'common/constants/routes';
import { TIPO_CARTA_OPCOES, ESTADO_CARTA_OPCOES } from './cartaUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const selectSx = {
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-primary)' },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const Cartas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const baralho = location.state?.baralho ?? null;

  const getCartasDoBaralho = useCallback(() => {
    if (!baralho) return Promise.resolve([]);
    return getRmCardfluxCartas().then(todas =>
      todas.filter(c => c.baralhoId === baralho.id),
    );
  }, [baralho]);

  const {
    items: cartas,
    loading: loadingCartas,
    setItems: setCartas,
    remove: handleRemoveCarta,
  } = useEntityCRUD({ getAll: getCartasDoBaralho, remove: removeRmCardfluxCarta });

  useEffect(() => {
    if (!loadingCampanhas && (!campanhaAtiva || !baralho)) navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingCampanhas, campanhaAtiva, baralho, navigate]);

  if ((!campanhaAtiva || !baralho) && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingCartas;
  const podeEscrever = campanhaAtiva ? canWrite(campanhaAtiva.universoId) : false;

  const handleEstadoChange = async (carta, novoEstado) => {
    await updateRmCardfluxCarta(carta.id, { estadoNoBaralho: novoEstado });
    setCartas(prev =>
      prev.map(c => (c.id === carta.id ? { ...c, estadoNoBaralho: novoEstado } : c)),
    );
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
          <Button
            onClick={() => navigate(ROUTE_PATHS.CARDFLUX)}
            sx={{ color: 'var(--text-muted)', px: 0, mb: 1 }}
          >
            ← Voltar para CardFlux
          </Button>
          <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}>
            Cartas — {baralho?.nome}
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_CARTA, { state: { baralho } })}
            sx={{ background: 'var(--color-primary)', '&:hover': { background: '#5a2090' } }}
          >
            + Nova Carta
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : cartas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🃏</span>
          <p>Nenhuma carta cadastrada</p>
          <small>Adicione cartas para este baralho.</small>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cartas.map(carta => {
            const tipo = TIPO_CARTA_OPCOES.find(o => o.value === carta.tipo);

            return (
              <Paper key={carta.id} elevation={0} sx={cardSx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {carta.titulo}
                    </Typography>
                    {tipo && (
                      <Chip
                        label={tipo.label}
                        size="small"
                        sx={{ background: tipo.cor, color: '#fff', fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  {podeEscrever && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          navigate(ROUTE_PATHS.NOVA_CARTA, { state: { baralho, carta } })
                        }
                        sx={{ color: 'var(--color-accent)' }}
                        aria-label={`Editar carta ${carta.titulo}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveCarta(carta.id)}
                        sx={{ color: '#ef4444' }}
                        aria-label={`Remover carta ${carta.titulo}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {carta.descricao && (
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1.5 }}>
                    {carta.descricao}
                  </Typography>
                )}

                <FormControl size="small" sx={{ minWidth: 160 }} disabled={!podeEscrever}>
                  <Select
                    value={carta.estadoNoBaralho}
                    onChange={e => handleEstadoChange(carta, e.target.value)}
                    sx={selectSx}
                  >
                    {ESTADO_CARTA_OPCOES.map(opcao => (
                      <MenuItem key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Cartas;
