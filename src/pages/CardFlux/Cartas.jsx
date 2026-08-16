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
import {
  getCardfluxCartas,
  getRmCardfluxEstadosPorCampanha,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import CartaDetalheDialog from './CartaDetalheDialog';
import {
  ESTADO_CARTA_OPCOES,
  mesclarEstadoCartas,
  definirEstadoCarta,
} from './cartaUtils';

const estadoVisual = {
  no_baralho: {
    label: 'No Baralho',
    tone: 'rgba(196, 58, 47, 0.14)',
    border: 'rgba(196, 58, 47, 0.35)',
    text: 'var(--text-primary)',
  },
  comprada: {
    label: 'Comprada',
    tone: 'rgba(255, 162, 77, 0.14)',
    border: 'rgba(255, 162, 77, 0.35)',
    text: '#f7c28b',
  },
  descartada: {
    label: 'Descartada',
    tone: 'rgba(255, 255, 255, 0.06)',
    border: 'rgba(255, 255, 255, 0.12)',
    text: 'var(--text-secondary)',
  },
};

const pageHeaderSx = {
  mb: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.75,
};

const infoPillSx = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  px: 1.25,
  py: 0.5,
  borderRadius: 999,
  width: 'fit-content',
  background: 'rgba(196, 58, 47, 0.1)',
  border: '1px solid rgba(196, 58, 47, 0.22)',
  color: 'var(--color-accent)',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.62rem',
};

const summaryCardSx = {
  p: 2,
  background:
    'linear-gradient(180deg, rgba(23, 27, 34, 0.96), rgba(17, 20, 26, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 14px 30px rgba(0,0,0,0.18)',
};

const actionPanelSx = {
  p: 2,
  mb: 3,
  background: 'linear-gradient(180deg, rgba(22, 26, 32, 0.9), rgba(13, 16, 21, 0.96))',
  border: '1px solid rgba(196, 58, 47, 0.2)',
  borderRadius: 3,
  boxShadow: '0 18px 32px rgba(0, 0, 0, 0.18)',
};

const cardSx = {
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background:
    'linear-gradient(180deg, rgba(22, 27, 34, 0.98), rgba(17, 20, 25, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  overflow: 'hidden',
  borderTop: '1px solid rgba(196, 58, 47, 0.18)',
  transition:
    'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    boxShadow: '0 18px 36px rgba(0, 0, 0, 0.28)',
  },
};

const cardImageSx = {
  width: '100%',
  height: 220,
  objectFit: 'cover',
  display: 'block',
  borderBottom: '1px solid var(--border-primary)',
  background: 'var(--bg-secondary)',
  transition: 'transform 180ms ease',
  '&:hover': { transform: 'scale(1.02)' },
};

const cardBodySx = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  p: 1.5,
};

const badgeSx = {
  height: 24,
  borderRadius: '999px',
  fontWeight: 700,
  fontSize: '0.68rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--text-primary)',
};

const selectSx = {
  color: 'var(--text-primary)',
  background: 'rgba(8, 11, 17, 0.72)',
  borderRadius: 2,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-primary)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-hover)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 0 3px rgba(196, 58, 47, 0.12)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const secondaryButtonSx = {
  minHeight: '40px',
  borderRadius: 2,
  background: 'linear-gradient(135deg, var(--color-accent), #a92f2d)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  boxShadow: '0 12px 24px rgba(196, 58, 47, 0.18)',
  '&:hover': {
    background: 'linear-gradient(135deg, #d94a42, var(--color-accent))',
    boxShadow: '0 16px 28px rgba(196, 58, 47, 0.24)',
  },
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
      const [cartasDoUniverso, estadosDaCampanha] = await Promise.all([
        getCardfluxCartas(campanhaAtiva.universoId),
        getRmCardfluxEstadosPorCampanha(
          campanhaAtiva.id,
          campanhaAtiva.universoId,
          campanhaAtiva.mestreId,
        ),
      ]);
      const cartasDoBaralho = cartasDoUniverso.filter(
        c => c.deck === baralho.nome,
      );
      setCartas(mesclarEstadoCartas(cartasDoBaralho, estadosDaCampanha));
    } catch (err) {
      setError(err);
    } finally {
      setLoadingCartas(false);
    }
  }, [campanhaAtiva, baralho]);

  useAsyncEffect(carregarCartas, [carregarCartas]);

  useEffect(() => {
    if (!loadingCampanhas && (!campanhaAtiva || !baralho))
      navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingCampanhas, campanhaAtiva, baralho, navigate]);

  if ((!campanhaAtiva || !baralho) && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingCartas;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;
  const cartasDisponiveis = cartas.filter(
    carta => carta.estadoNoBaralho === 'no_baralho',
  ).length;
  const progresso = cartas.length > 0 ? (cartasDisponiveis / cartas.length) * 100 : 0;

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
      <Box sx={pageHeaderSx}>
        <Button
          onClick={() => navigate(ROUTE_PATHS.CARDFLUX)}
          sx={{
            color: 'var(--text-muted)',
            px: 0,
            width: 'fit-content',
            '&:hover': { color: 'var(--text-primary)' },
          }}
        >
          ← Voltar para CardFlux
        </Button>
        <Box sx={infoPillSx}>Cartas</Box>
        <Typography
          variant="h4"
          sx={{
            color: 'var(--text-primary)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
          }}
        >
          Cartas — {baralho?.nome}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          {cartasDisponiveis} / {cartas.length} cartas disponíveis
        </Typography>
      </Box>

      {!loading && !error && cartas.length > 0 && (
        <Paper elevation={0} sx={summaryCardSx}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: 'var(--text-muted)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                {baralho?.nome}
              </Typography>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {cartasDisponiveis} / {cartas.length} cartas disponíveis
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              {Math.round(progresso)}%
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 2,
              width: '100%',
              height: 8,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.04)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${progresso}%`,
                height: '100%',
                borderRadius: 999,
                background:
                  'linear-gradient(90deg, rgba(196,58,47,0.85), rgba(255,146,79,0.7))',
              }}
            />
          </Box>
        </Paper>
      )}

      {!loading && !error && podeEscrever && cartas.length > 0 && (
        <Paper elevation={0} sx={actionPanelSx}>
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', mb: 1.5 }}
          >
            Marcar todas as cartas como:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {ESTADO_CARTA_OPCOES.map(opcao => (
              <Button
                key={opcao.value}
                size="small"
                variant="outlined"
                disabled={atualizandoTodas}
                onClick={() => handleAlterarTodas(opcao.value)}
                sx={{
                  color: 'var(--text-primary)',
                  borderColor: 'rgba(196, 58, 47, 0.36)',
                  background: 'rgba(196, 58, 47, 0.06)',
                  '&:hover': {
                    borderColor: 'rgba(196, 58, 47, 0.56)',
                    background: 'rgba(196, 58, 47, 0.12)',
                  },
                }}
              >
                {opcao.label}
              </Button>
            ))}
          </Box>
        </Paper>
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
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {cartas.map(carta => {
            const estado = estadoVisual[carta.estadoNoBaralho] ?? estadoVisual.no_baralho;

            return (
              <Paper key={carta.id} elevation={0} sx={{ ...cardSx, opacity: carta.estadoNoBaralho === 'descartada' ? 0.7 : 1 }}>
                <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                  {carta.linkImagem ? (
                    <Box
                      component="img"
                      src={carta.linkImagem}
                      alt={carta.nome}
                      loading="lazy"
                      sx={cardImageSx}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background:
                          'radial-gradient(circle at center, rgba(196,58,47,0.12), rgba(8,11,17,0.8))',
                        color: 'var(--text-secondary)',
                        fontSize: '2.6rem',
                        borderBottom: '1px solid var(--border-primary)',
                      }}
                    >
                      🃏
                    </Box>
                  )}

                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      px: 1,
                      py: 0.5,
                      borderRadius: 999,
                      background: estado.tone,
                      border: `1px solid ${estado.border}`,
                      color: estado.text,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {estado.label}
                  </Box>
                </Box>

                <Box sx={cardBodySx}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      letterSpacing: '-0.02em',
                      mb: 1,
                    }}
                  >
                    {carta.nome}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.25 }}>
                    {carta.tipo && (
                      <Chip label={carta.tipo} size="small" sx={badgeSx} />
                    )}
                    {carta.raridade && (
                      <Chip
                        label={carta.raridade}
                        size="small"
                        sx={{
                          ...badgeSx,
                          color: 'var(--color-accent)',
                          borderColor: 'rgba(196, 58, 47, 0.3)',
                          background: 'rgba(196, 58, 47, 0.08)',
                        }}
                      />
                    )}
                  </Box>

                  {carta.descricaoGeral && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--text-secondary)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mb: 1.5,
                        lineHeight: 1.6,
                      }}
                    >
                      {carta.descricaoGeral}
                    </Typography>
                  )}

                  <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                    <FormControl
                      size="small"
                      sx={{ minWidth: 0, width: '100%' }}
                      disabled={!podeEscrever}
                    >
                      <Select
                        value={carta.estadoNoBaralho}
                        onChange={e => handleEstadoChange(carta, e.target.value)}
                        sx={selectSx}
                        slotProps={{
                          paper: {
                            sx: {
                              background: 'var(--bg-card)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border-primary)',
                              borderRadius: 2,
                            },
                          },
                        }}
                      >
                        {ESTADO_CARTA_OPCOES.map(opcao => (
                          <MenuItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                      onClick={() => setCartaVisualizada(carta)}
                      sx={secondaryButtonSx}
                    >
                      Ver Detalhes
                    </Button>
                  </Box>
                </Box>
              </Paper>
            );
          })}
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
