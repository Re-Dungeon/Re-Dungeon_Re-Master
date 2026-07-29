import React, { useCallback, useEffect, useState } from 'react';
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
import {
  getRmCardfluxBaralhos,
  removeRmCardfluxBaralho,
  getRmCardfluxCartas,
  updateRmCardfluxCarta,
} from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import EntityViewDialog from 'components/EntityViewDialog/EntityViewDialog';
import { ROUTE_PATHS } from 'common/constants/routes';
import { TIPO_CARTA_OPCOES } from './cartaUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const CardFlux = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getBaralhosDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmCardfluxBaralhos().then(todos =>
      todos.filter(b => b.campanhaId === campanhaAtiva.id),
    );
  }, [campanhaAtiva]);

  const {
    items: baralhos,
    loading: loadingBaralhos,
    remove: handleRemoveBaralho,
  } = useEntityCRUD({ getAll: getBaralhosDaCampanha, remove: removeRmCardfluxBaralho });

  const [cartas, setCartas] = useState([]);
  const [loadingCartas, setLoadingCartas] = useState(true);
  const [cartaSorteada, setCartaSorteada] = useState(null);

  const carregarCartas = useCallback(async () => {
    if (!campanhaAtiva) {
      setCartas([]);
      setLoadingCartas(false);
      return;
    }
    setLoadingCartas(true);
    try {
      const todas = await getRmCardfluxCartas();
      setCartas(todas.filter(c => c.campanhaId === campanhaAtiva.id));
    } finally {
      setLoadingCartas(false);
    }
  }, [campanhaAtiva]);

  useEffect(() => {
    Promise.resolve().then(() => carregarCartas());
  }, [carregarCartas]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingBaralhos || loadingCartas;
  const podeEscrever = campanhaAtiva ? canWrite(campanhaAtiva.universoId) : false;

  const handlePuxarCarta = async baralho => {
    const disponiveis = cartas.filter(
      c => c.baralhoId === baralho.id && c.estadoNoBaralho === 'no_baralho',
    );
    if (disponiveis.length === 0) {
      setCartaSorteada({
        titulo: 'Baralho esgotado',
        descricao: `Não há mais cartas disponíveis em "${baralho.nome}".`,
      });
      return;
    }
    const sorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    await updateRmCardfluxCarta(sorteada.id, { estadoNoBaralho: 'comprada' });
    setCartaSorteada(sorteada);
    await carregarCartas();
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
          <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}>
            CardFlux — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Baralhos de eventos desta campanha, prontos para sortear durante a sessão.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVO_BARALHO)}
            sx={{ background: 'var(--color-primary)', '&:hover': { background: '#5a2090' } }}
          >
            + Novo Baralho
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : baralhos.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🃏</span>
          <p>Nenhum baralho cadastrado</p>
          <small>Crie um baralho para sortear eventos durante a sessão.</small>
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
          {baralhos.map(baralho => {
            const cartasDoBaralho = cartas.filter(c => c.baralhoId === baralho.id);
            const disponiveis = cartasDoBaralho.filter(c => c.estadoNoBaralho === 'no_baralho');

            return (
              <Paper key={baralho.id} elevation={0} sx={cardSx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {baralho.nome}
                  </Typography>
                  {podeEscrever && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(ROUTE_PATHS.NOVO_BARALHO, { state: { baralho } })}
                        sx={{ color: 'var(--color-accent)' }}
                        aria-label={`Editar baralho ${baralho.nome}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveBaralho(baralho.id)}
                        sx={{ color: '#ef4444' }}
                        aria-label={`Remover baralho ${baralho.nome}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {baralho.categoria && (
                  <Typography variant="caption" sx={{ color: 'var(--color-accent)', fontWeight: 600, display: 'block', mb: 1 }}>
                    {baralho.categoria}
                  </Typography>
                )}

                {baralho.descricao && (
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1.5 }}>
                    {baralho.descricao}
                  </Typography>
                )}

                <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mb: 1.5 }}>
                  {disponiveis.length}/{cartasDoBaralho.length} cartas disponíveis
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handlePuxarCarta(baralho)}
                    sx={{ background: 'var(--color-accent)', color: 'var(--bg-primary)', fontWeight: 700, '&:hover': { background: '#00b8dd' } }}
                  >
                    Puxar Carta
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate(ROUTE_PATHS.CARDFLUX_CARTAS, { state: { baralho } })}
                    sx={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                  >
                    Gerenciar Cartas
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <EntityViewDialog
        open={Boolean(cartaSorteada)}
        onClose={() => setCartaSorteada(null)}
        titulo={cartaSorteada?.titulo}
        subtitulo={TIPO_CARTA_OPCOES.find(o => o.value === cartaSorteada?.tipo)?.label}
        descricao={cartaSorteada?.descricao}
      />
    </Box>
  );
};

export default CardFlux;
