import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import { useCampanha } from 'context/CampanhaContext';
import {
  getCardfluxCartas,
  getRmCardfluxEstadosPorCampanha,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import { mesclarEstadoCartas } from './cartaUtils';

const pageHeaderSx = {
  mb: 3,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
};

const eyebrowSx = {
  color: 'var(--color-accent)',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontSize: '0.68rem',
};

const cardSx = {
  p: 2.5,
  background:
    'linear-gradient(180deg, rgba(23, 27, 34, 0.96), rgba(16, 18, 23, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at top right, rgba(196, 58, 47, 0.12), transparent 28%)',
    pointerEvents: 'none',
  },
};

const heroPanelSx = {
  ...cardSx,
  p: { xs: 2.25, md: 3 },
  background:
    'linear-gradient(180deg, rgba(22, 27, 34, 0.98), rgba(14, 16, 21, 0.98))',
  borderColor: 'rgba(196, 58, 47, 0.24)',
};

const selectSx = {
  color: 'var(--text-primary)',
  background: 'rgba(8, 11, 17, 0.7)',
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

const menuPropsSx = {
  paper: { sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' } },
};

const primaryButtonSx = {
  minHeight: '46px',
  px: { xs: 2, md: 2.5 },
  py: 1.25,
  borderRadius: 2,
  background: 'linear-gradient(135deg, var(--color-accent), #ab2b27)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  boxShadow: '0 14px 28px rgba(196, 58, 47, 0.22)',
  transition: 'all 180ms ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #d94841, var(--color-accent))',
    boxShadow: '0 18px 32px rgba(196, 58, 47, 0.28)',
    transform: 'translateY(-1px)',
  },
  '&:focus-visible': {
    outline: '2px solid rgba(196, 58, 47, 0.5)',
    outlineOffset: '2px',
  },
  '&.Mui-disabled': {
    background: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.44)',
    boxShadow: 'none',
  },
};

const secondaryButtonSx = {
  minHeight: '44px',
  borderRadius: 2,
  px: 1.5,
  py: 1,
  color: 'var(--text-primary)',
  border: '1px solid rgba(196, 58, 47, 0.3)',
  background: 'rgba(196, 58, 47, 0.06)',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  transition: 'all 180ms ease',
  '&:hover': {
    background: 'rgba(196, 58, 47, 0.13)',
    borderColor: 'rgba(196, 58, 47, 0.56)',
  },
};

const deckCardSx = {
  ...cardSx,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 268,
  transition:
    'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
  '&:hover': {
    transform: 'translateY(-3px)',
    borderColor: 'rgba(196, 58, 47, 0.45)',
    boxShadow: '0 24px 42px rgba(0, 0, 0, 0.28)',
  },
};

const deckIconSx = {
  width: 56,
  height: 56,
  borderRadius: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  color: 'var(--text-primary)',
  background:
    'linear-gradient(180deg, rgba(196, 58, 47, 0.2), rgba(196, 58, 47, 0.04))',
  border: '1px solid rgba(196, 58, 47, 0.26)',
  mb: 1.5,
};

const progressTrackSx = {
  width: '100%',
  height: 8,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.04)',
  mb: 1.5,
};

const multiSorteioLabelId = 'cardflux-multi-sorteio-label';

const CardFlux = () => {
  const navigate = useNavigate();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const [cartas, setCartas] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState(null);
  const [baralhosSelecionados, setBaralhosSelecionados] = useState([]);

  const carregarDados = useCallback(async () => {
    if (!campanhaAtiva) {
      setCartas([]);
      setLoadingDados(false);
      return;
    }
    setLoadingDados(true);
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
      setCartas(mesclarEstadoCartas(cartasDoUniverso, estadosDaCampanha));
    } catch (err) {
      setError(err);
    } finally {
      setLoadingDados(false);
    }
  }, [campanhaAtiva]);

  useAsyncEffect(carregarDados, [carregarDados]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  // Baralho não é uma entidade própria do Re:Master: é o agrupamento das
  // cartas do `cardflux` pelo campo `deck`. Uma carta nova cadastrada no
  // projeto irmão para este Universo aparece aqui na próxima recarga, sem
  // nenhuma sincronização adicional.
  const baralhos = useMemo(() => {
    const porDeck = new Map();
    cartas.forEach(carta => {
      const nomeDeck = carta.deck || 'Sem Baralho';
      if (!porDeck.has(nomeDeck)) porDeck.set(nomeDeck, []);
      porDeck.get(nomeDeck).push(carta);
    });
    return [...porDeck.entries()]
      .map(([nome, cartasDoBaralho]) => ({ nome, cartas: cartasDoBaralho }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cartas]);

  const disponiveisSelecionados = useMemo(
    () =>
      baralhos
        .filter(b => baralhosSelecionados.includes(b.nome))
        .reduce(
          (soma, b) =>
            soma +
            b.cartas.filter(c => c.estadoNoBaralho === 'no_baralho').length,
          0,
        ),
    [baralhos, baralhosSelecionados],
  );

  const totalSelecionados = useMemo(
    () =>
      baralhos
        .filter(b => baralhosSelecionados.includes(b.nome))
        .reduce((soma, b) => soma + b.cartas.length, 0),
    [baralhos, baralhosSelecionados],
  );

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingDados;

  return (
    <Box className="page-container">
      <Box sx={pageHeaderSx}>
        <Typography variant="overline" sx={eyebrowSx}>
          CardFlux
        </Typography>
        <Typography
          variant="h4"
          sx={{
            color: 'var(--text-primary)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
          }}
        >
          CardFlux — {campanhaAtiva?.nome}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Baralhos de eventos do Universo, prontos para sortear durante a
          sessão.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : error ? (
        <ListLoadError
          mensagem="Erro ao carregar o CardFlux."
          onRetry={carregarDados}
        />
      ) : baralhos.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🃏</span>
          <p>Nenhum baralho encontrado</p>
          <small>
            Cadastre cartas para este Universo no CardFlux para elas aparecerem
            aqui.
          </small>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={0} sx={heroPanelSx}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.25,
              }}
            >
              <Box sx={{ color: 'var(--color-accent)', fontSize: '1.15rem' }}>
                ◈
              </Box>
              <Typography
                variant="overline"
                sx={{
                  ...eyebrowSx,
                  fontSize: '0.72rem',
                  color: 'var(--text-primary)',
                }}
              >
                Sortear cartas
              </Typography>
            </Box>

            <Typography
              variant="h6"
              sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.75 }}
            >
              Sortear de múltiplos baralhos
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Escolha um ou mais baralhos para realizar o sorteio da sessão.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
                gap: 1.5,
                alignItems: 'center',
                mt: 2.5,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 0, width: '100%' }}>
                <InputLabel
                  id={multiSorteioLabelId}
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  Baralhos
                </InputLabel>
                <Select
                  multiple
                  labelId={multiSorteioLabelId}
                  label="Baralhos"
                  value={baralhosSelecionados}
                  onChange={e => setBaralhosSelecionados(e.target.value)}
                  sx={selectSx}
                  slotProps={menuPropsSx}
                  renderValue={selecionados => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selecionados.map(nome => (
                        <Chip
                          key={nome}
                          size="small"
                          label={nome}
                          sx={{
                            background: 'rgba(196, 58, 47, 0.12)',
                            color: 'var(--text-primary)',
                            border: '1px solid rgba(196, 58, 47, 0.28)',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                >
                  {baralhos.map(baralho => (
                    <MenuItem key={baralho.nome} value={baralho.nome}>
                      {baralho.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                disabled={baralhosSelecionados.length === 0}
                onClick={() =>
                  navigate(ROUTE_PATHS.CARDFLUX_SORTEIO, {
                    state: { baralhos: baralhosSelecionados },
                  })
                }
                sx={primaryButtonSx}
              >
                🎲 Sortear
              </Button>
            </Box>

            {baralhosSelecionados.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--text-secondary)',
                    display: 'block',
                    mb: 0.75,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Cartas disponíveis
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'var(--text-primary)',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    }}
                  >
                    {disponiveisSelecionados}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 140, ...progressTrackSx }}>
                    <Box
                      sx={{
                        width: totalSelecionados
                          ? `${(disponiveisSelecionados / totalSelecionados) * 100}%`
                          : '0%',
                        height: '100%',
                        borderRadius: 999,
                        background:
                          'linear-gradient(90deg, rgba(196, 58, 47, 0.8), rgba(196, 58, 47, 0.35))',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    {disponiveisSelecionados} cartas disponíveis
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ px: 0.5 }}>
              <Typography variant="overline" sx={eyebrowSx}>
                Seus baralhos
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Baralhos disponíveis para sorteio durante a sessão.
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  xl: 'repeat(4, minmax(0, 1fr))',
                },
                gap: 2,
              }}
            >
              {baralhos.map(baralho => {
                const disponiveis = baralho.cartas.filter(
                  c => c.estadoNoBaralho === 'no_baralho',
                );
                const percentualDisponivel =
                  baralho.cartas.length > 0
                    ? (disponiveis.length / baralho.cartas.length) * 100
                    : 0;

                return (
                  <Paper key={baralho.nome} elevation={0} sx={deckCardSx}>
                    <Box sx={deckIconSx}>◈</Box>

                    <Typography
                      variant="h6"
                      sx={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        mb: 1,
                      }}
                    >
                      {baralho.nome}
                    </Typography>

                    <Box sx={{ mb: 1.6 }}>
                      <Typography
                        variant="h4"
                        sx={{
                          color: 'var(--text-primary)',
                          fontWeight: 800,
                          lineHeight: 1,
                          letterSpacing: '-0.04em',
                          display: 'inline-block',
                        }}
                      >
                        {disponiveis.length}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          color: 'var(--text-secondary)',
                          ml: 0.5,
                          mr: 0.5,
                        }}
                      >
                        /
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ color: 'var(--text-secondary)' }}
                      >
                        {baralho.cartas.length}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'var(--text-secondary)',
                          display: 'block',
                          mt: 0.5,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        cartas disponíveis
                      </Typography>
                    </Box>

                    <Box sx={{ ...progressTrackSx, mb: 2 }}>
                      <Box
                        sx={{
                          width: `${percentualDisponivel}%`,
                          height: '100%',
                          borderRadius: 999,
                          background:
                            'linear-gradient(90deg, rgba(196, 58, 47, 0.8), rgba(196, 58, 47, 0.3))',
                        }}
                      />
                    </Box>

                    <Typography
                      variant="caption"
                      sx={{
                        color: 'var(--text-secondary)',
                        display: 'block',
                        mb: 2,
                      }}
                    >
                      {disponiveis.length}/{baralho.cartas.length} cartas
                      disponíveis
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() =>
                          navigate(ROUTE_PATHS.CARDFLUX_SORTEIO, {
                            state: { baralhos: [baralho.nome] },
                          })
                        }
                        sx={primaryButtonSx}
                      >
                        Sortear
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() =>
                          navigate(ROUTE_PATHS.CARDFLUX_CARTAS, {
                            state: { baralho: { nome: baralho.nome } },
                          })
                        }
                        sx={secondaryButtonSx}
                      >
                        Ver Cartas
                      </Button>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CardFlux;
