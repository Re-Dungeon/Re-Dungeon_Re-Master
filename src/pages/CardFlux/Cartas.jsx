import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { getCardfluxCartas, getRmCardfluxEstados } from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import CartaDetalheDialog from './CartaDetalheDialog';
import {
  ESTADO_CARTA_OPCOES,
  mesclarEstadoCartas,
  definirEstadoCarta,
} from './cartaUtils';

const cardSx = {
  p: 2.5,
  display: 'flex',
  gap: 2,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const selectSx = {
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-primary)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const Cartas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const baralho = location.state?.baralho ?? null;

  const [cartas, setCartas] = useState([]);
  const [loadingCartas, setLoadingCartas] = useState(true);
  const [error, setError] = useState(null);
  const [cartaVisualizada, setCartaVisualizada] = useState(null);
  const [atualizandoTodas, setAtualizandoTodas] = useState(false);

  const carregarCartas = useCallback(async () => {
    if (!campanhaAtiva || !baralho) {
      setCartas([]);
      setLoadingCartas(false);
      return;
    }
    setLoadingCartas(true);
    setError(null);
    try {
      const [cartasDoUniverso, todosEstados] = await Promise.all([
        getCardfluxCartas(campanhaAtiva.universoId),
        getRmCardfluxEstados(),
      ]);
      const cartasDoBaralho = cartasDoUniverso.filter(
        c => c.deck === baralho.nome,
      );
      const estadosDaCampanha = todosEstados.filter(
        e => e.campanhaId === campanhaAtiva.id,
      );
      setCartas(mesclarEstadoCartas(cartasDoBaralho, estadosDaCampanha));
    } catch (err) {
      setError(err);
    } finally {
      setLoadingCartas(false);
    }
  }, [campanhaAtiva, baralho]);

  useEffect(() => {
    Promise.resolve().then(() => carregarCartas());
  }, [carregarCartas]);

  useEffect(() => {
    if (!loadingCampanhas && (!campanhaAtiva || !baralho))
      navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingCampanhas, campanhaAtiva, baralho, navigate]);

  if ((!campanhaAtiva || !baralho) && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingCartas;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  const handleEstadoChange = async (carta, novoEstado) => {
    await definirEstadoCarta(carta, novoEstado, campanhaAtiva);
    await carregarCartas();
  };

  const handleAlterarTodas = async novoEstado => {
    setAtualizandoTodas(true);
    try {
      await Promise.all(
        cartas.map(carta =>
          definirEstadoCarta(carta, novoEstado, campanhaAtiva),
        ),
      );
      await carregarCartas();
    } finally {
      setAtualizandoTodas(false);
    }
  };

  return (
    <Box className="page-container">
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={() => navigate(ROUTE_PATHS.CARDFLUX)}
          sx={{ color: 'var(--text-muted)', px: 0, mb: 1 }}
        >
          ← Voltar para CardFlux
        </Button>
        <Typography
          variant="h5"
          sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
        >
          Cartas — {baralho?.nome}
        </Typography>
      </Box>

      {!loading && !error && podeEscrever && cartas.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 3,
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-muted)', mr: 0.5 }}
          >
            Marcar todas as cartas como:
          </Typography>
          {ESTADO_CARTA_OPCOES.map(opcao => (
            <Button
              key={opcao.value}
              size="small"
              variant="outlined"
              disabled={atualizandoTodas}
              onClick={() => handleAlterarTodas(opcao.value)}
              sx={{
                color: 'var(--color-accent)',
                borderColor: 'var(--color-accent)',
              }}
            >
              {opcao.label}
            </Button>
          ))}
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : error ? (
        <ListLoadError
          mensagem="Erro ao carregar as cartas."
          onRetry={carregarCartas}
        />
      ) : cartas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🃏</span>
          <p>Nenhuma carta encontrada</p>
          <small>
            Cadastre cartas deste baralho no CardFlux para elas aparecerem aqui.
          </small>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {cartas.map(carta => (
            <Paper key={carta.id} elevation={0} sx={cardSx}>
              {carta.linkImagem && (
                <Box
                  component="img"
                  src={carta.linkImagem}
                  alt={carta.nome}
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 1.5,
                    objectFit: 'cover',
                    border: '1px solid var(--border-primary)',
                    flexShrink: 0,
                  }}
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {carta.nome}
                  </Typography>
                  {carta.tipo && (
                    <Chip
                      label={carta.tipo}
                      size="small"
                      sx={{
                        background: 'var(--color-primary)',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  {carta.raridade && (
                    <Chip
                      label={carta.raridade}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: 'var(--color-accent)',
                        borderColor: 'var(--color-accent)',
                      }}
                    />
                  )}
                </Box>

                {carta.descricaoGeral && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-secondary)', mb: 1.5 }}
                  >
                    {carta.descricaoGeral}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <FormControl
                    size="small"
                    sx={{ minWidth: 160 }}
                    disabled={!podeEscrever}
                  >
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

                  <Button
                    size="small"
                    startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                    onClick={() => setCartaVisualizada(carta)}
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    Ver Detalhes
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <CartaDetalheDialog
        open={Boolean(cartaVisualizada)}
        onClose={() => setCartaVisualizada(null)}
        carta={cartaVisualizada}
      />
    </Box>
  );
};

export default Cartas;
