import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useCampanha } from 'context/CampanhaContext';
import {
  getCardfluxCartas,
  getRmCardfluxEstadosPorCampanha,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import EntityViewDialog from 'components/EntityViewDialog/EntityViewDialog';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import {
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
  formatarHoraEvento,
} from 'common/utils/sessaoLog';
import CartaDetalheDialog from './CartaDetalheDialog';
import CartaDetalhe from './CartaDetalhe';
import {
  RITMO_OPCOES,
  INTENSIDADE_MIN,
  INTENSIDADE_MAX,
  mesclarEstadoCartas,
  calcularTotalCartas,
  filtrarPoolValido,
  sortearCartaPonderada,
  marcarCartaComprada,
  descartarCarta,
  retornarCartaAoDeck,
  decrementarCooldownsOutrasCartas,
  limparCooldownsBaralho,
  reembaralharBaralho,
} from './cartaUtils';

const HISTORICO_LIMITE = 18;

const getHistoricoSessaoStorageKey = campanhaId =>
  `rmCardfluxHistoricoSessao:${campanhaId ?? 'sem-campanha'}`;

const getHistoricoSessaoAtual = campanhaId => {
  if (!campanhaId) return [];

  try {
    const item = sessionStorage.getItem(getHistoricoSessaoStorageKey(campanhaId));
    if (!item) return [];

    const dados = JSON.parse(item);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
};

const salvarHistoricoSessao = (campanhaId, lista) => {
  if (!campanhaId) return;

  try {
    const historico = Array.isArray(lista) ? lista.slice(0, HISTORICO_LIMITE) : [];
    sessionStorage.setItem(
      getHistoricoSessaoStorageKey(campanhaId),
      JSON.stringify(historico),
    );
  } catch {
    // Ignorado: persistência da sessão é opcional e não afeta o backend.
  }
};

const painelSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const numeroCampoProps = {
  slotProps: {
    htmlInput: { style: { color: 'var(--text-primary)' } },
  },
};

const Sorteio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const baralhos = location.state?.baralhos ?? null;

  const [cartas, setCartas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState(null);

  const [distanciaBase, setDistanciaBase] = useState(4);
  const [ritmo, setRitmo] = useState(0);
  const [modificadorSorte, setModificadorSorte] = useState(0);
  const [atraso, setAtraso] = useState(0);
  const [acelerar, setAcelerar] = useState(0);
  const [intensidadeMinima, setIntensidadeMinima] = useState(INTENSIDADE_MIN);

  const [cartaSorteada, setCartaSorteada] = useState(null);
  const [cartaVisualizada, setCartaVisualizada] = useState(null);
  const [chainAberta, setChainAberta] = useState(false);
  const [avisoEsgotado, setAvisoEsgotado] = useState(null);
  const [sorteando, setSorteando] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!campanhaAtiva || !baralhos || baralhos.length === 0) {
      setCartas([]);
      setHistorico([]);
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
      const cartasDosBaralhos = cartasDoUniverso.filter(c =>
        baralhos.includes(c.deck),
      );
      const cartasMescladas = mesclarEstadoCartas(
        cartasDosBaralhos,
        estadosDaCampanha,
      );
      setCartas(cartasMescladas);
      setHistorico(getHistoricoSessaoAtual(campanhaAtiva.id));
      return cartasMescladas;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoadingDados(false);
    }
  }, [campanhaAtiva, baralhos]);

  useAsyncEffect(carregarDados, [carregarDados]);

  useEffect(() => {
    if (
      !loadingCampanhas &&
      (!campanhaAtiva || !baralhos || baralhos.length === 0)
    )
      navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingCampanhas, campanhaAtiva, baralhos, navigate]);

  const totalCartasPlanejadas = useMemo(
    () =>
      calcularTotalCartas({
        distanciaBase,
        ritmo,
        modificadorSorte,
        atraso,
        acelerar,
      }),
    [distanciaBase, ritmo, modificadorSorte, atraso, acelerar],
  );

  const cartasCompradas = useMemo(
    () => cartas.filter(c => c.estadoNoBaralho === 'comprada').length,
    [cartas],
  );

  const podeComprar =
    cartasCompradas < totalCartasPlanejadas && !sorteando && !processandoAcao;

  if (
    (!campanhaAtiva || !baralhos || baralhos.length === 0) &&
    !loadingCampanhas
  )
    return null;

  const loading = loadingCampanhas || loadingDados;

  const handleSortear = async () => {
    const pool = filtrarPoolValido(cartas, intensidadeMinima);
    if (pool.length === 0) {
      setAvisoEsgotado(
        `Nenhuma carta disponível nos baralhos selecionados (${baralhos.join(', ')}) com os filtros atuais (todas compradas, descartadas, em cooldown ou abaixo da intensidade mínima).`,
      );
      return;
    }
    setSorteando(true);
    try {
      const sorteada = sortearCartaPonderada(pool);
      await marcarCartaComprada(sorteada, campanhaAtiva);
      await decrementarCooldownsOutrasCartas(cartas, sorteada.id);
      await registrarEventoSessao(
        campanhaAtiva,
        TIPO_EVENTO_SESSAO.CARTA_SORTEADA,
        `Carta sorteada: "${sorteada.nome}" (${sorteada.deck})`,
        {
          cartaId: sorteada.id,
          deck: sorteada.deck,
          raridade: sorteada.raridade ?? null,
          numero: cartasCompradas + 1,
        },
      );

      const historicoAtual = getHistoricoSessaoAtual(campanhaAtiva.id);
      const proximoHistorico = [
        {
          id: `sessao-${Date.now()}`,
          cartaId: sorteada.id,
          nome: sorteada.nome,
          deck: sorteada.deck,
          createdAt: new Date().toISOString(),
        },
        ...historicoAtual,
      ].slice(0, HISTORICO_LIMITE);

      salvarHistoricoSessao(campanhaAtiva.id, proximoHistorico);
      setHistorico(proximoHistorico);

      const cartasAtualizadas = await carregarDados();
      const cartaAtualizada =
        cartasAtualizadas?.find(c => c.id === sorteada.id) ?? sorteada;
      setCartaSorteada(cartaAtualizada);
    } finally {
      setSorteando(false);
    }
  };

  const handleDescartar = async () => {
    setProcessandoAcao(true);
    try {
      await descartarCarta(cartaSorteada, campanhaAtiva);
      setCartaSorteada(null);
      await carregarDados();
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleRetornar = async () => {
    setProcessandoAcao(true);
    try {
      await retornarCartaAoDeck(cartaSorteada, campanhaAtiva);
      setCartaSorteada(null);
      await carregarDados();
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleReembaralhar = async () => {
    setProcessandoAcao(true);
    try {
      await reembaralharBaralho(cartas, campanhaAtiva);
      setCartaSorteada(null);
      await carregarDados();
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleLimparCooldowns = async () => {
    setProcessandoAcao(true);
    try {
      await limparCooldownsBaralho(cartas);
      await carregarDados();
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleLimparHistorico = () => {
    if (!campanhaAtiva?.id) return;

    salvarHistoricoSessao(campanhaAtiva.id, []);
    setHistorico([]);
  };

  const handleVerHistoricoItem = log => {
    const carta = cartas.find(c => c.id === log.cartaId);
    if (carta) setCartaVisualizada(carta);
  };

  const parseHistoricoLog = log => {
    if (log?.nome) {
      return {
        nome: log.nome,
        deck: log.deck ?? 'Deck',
        evento: 'Carta sorteada',
      };
    }

    const mensagem = log?.mensagem ?? '';
    const nomeMatch = mensagem.match(/"([^"]+)"\s*\((.+)\)$/);
    const nome = nomeMatch?.[1] ?? 'Carta sorteada';
    const deck = nomeMatch?.[2] ?? log?.deck ?? 'Deck';
    const evento = mensagem.startsWith('Carta sorteada')
      ? 'Carta sorteada'
      : 'Evento';

    return { nome, deck, evento };
  };

  const historicoExibido = historico.slice(0, HISTORICO_LIMITE);

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
          Sorteio — {baralhos?.join(', ')}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : error ? (
        <ListLoadError
          mensagem="Erro ao carregar o sorteio."
          onRetry={carregarDados}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={0} sx={painelSx}>
            <Typography
              sx={{
                color: 'var(--color-accent)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
                fontSize: '0.8rem',
                mb: 2,
              }}
            >
              Configuração da Viagem
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(6, 1fr)',
                },
                gap: 1.5,
              }}
            >
              <TextField
                label="Distância Base"
                type="number"
                size="small"
                value={distanciaBase}
                onChange={e => setDistanciaBase(Number(e.target.value))}
                {...numeroCampoProps}
              />
              <FormControl size="small">
                <InputLabel id="ritmo-label">Ritmo</InputLabel>
                <Select
                  labelId="ritmo-label"
                  label="Ritmo"
                  value={ritmo}
                  onChange={e => setRitmo(Number(e.target.value))}
                >
                  {RITMO_OPCOES.map(opcao => (
                    <MenuItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Sorte"
                type="number"
                size="small"
                value={modificadorSorte}
                onChange={e => setModificadorSorte(Number(e.target.value))}
                slotProps={{ htmlInput: { min: -5, max: 5 } }}
              />
              <TextField
                label="Atraso"
                type="number"
                size="small"
                value={atraso}
                onChange={e => setAtraso(Math.max(0, Number(e.target.value)))}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                label="Acelerar"
                type="number"
                size="small"
                value={acelerar}
                onChange={e => setAcelerar(Math.max(0, Number(e.target.value)))}
                slotProps={{ htmlInput: { min: 0 } }}
              />
              <TextField
                label="Intensidade Mínima"
                type="number"
                size="small"
                value={intensidadeMinima}
                onChange={e =>
                  setIntensidadeMinima(
                    Math.min(
                      INTENSIDADE_MAX,
                      Math.max(INTENSIDADE_MIN, Number(e.target.value)),
                    ),
                  )
                }
                slotProps={{ htmlInput: { min: INTENSIDADE_MIN, max: INTENSIDADE_MAX } }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1.5,
                mt: 2.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                Total planejado:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {cartasCompradas} / {totalCartasPlanejadas}
                </strong>
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={processandoAcao || sorteando}
                  onClick={handleLimparCooldowns}
                  sx={{
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-primary)',
                  }}
                >
                  Limpar Cooldowns
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  disabled={processandoAcao || sorteando}
                  onClick={handleReembaralhar}
                  sx={{
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                  }}
                >
                  Reembaralhar
                </Button>
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              disabled={!podeComprar}
              onClick={handleSortear}
              sx={{
                mt: 2.5,
                py: 1.25,
                background: 'var(--color-accent)',
                color: 'var(--bg-primary)',
                fontWeight: 700,
                '&:hover': { background: '#00b8dd' },
              }}
            >
              {sorteando ? 'Sorteando…' : '🎲 Comprar Carta'}
            </Button>
          </Paper>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3,
            }}
          >
            <Paper elevation={0} sx={painelSx}>
              <Typography
                sx={{
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: '0.8rem',
                  mb: 2,
                }}
              >
                Carta Sorteada
              </Typography>

              {!cartaSorteada ? (
                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                  Nenhuma carta sorteada ainda nesta sessão.
                </Typography>
              ) : (
                <Box>
                  <CartaDetalhe carta={cartaSorteada} />

                  {cartaSorteada.cartasVinculadas?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        onClick={() => setChainAberta(true)}
                        sx={{ color: 'var(--color-accent)' }}
                      >
                        Ver Cartas Encadeadas
                      </Button>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mt: 2,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      variant="outlined"
                      disabled={processandoAcao || sorteando}
                      onClick={handleDescartar}
                      sx={{
                        color: '#E74C3C',
                        borderColor: '#E74C3C',
                        minWidth: 160,
                      }}
                    >
                      🗑️ Descartar
                    </Button>
                    <Button
                      variant="outlined"
                      disabled={processandoAcao || sorteando}
                      onClick={handleRetornar}
                      sx={{
                        color: 'var(--text-secondary)',
                        borderColor: 'var(--border-primary)',
                        minWidth: 200,
                      }}
                    >
                      ↩️ Retornar ao Deck
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!podeComprar}
                      onClick={handleSortear}
                      sx={{
                        background: 'var(--color-accent)',
                        color: 'var(--bg-primary)',
                        fontWeight: 700,
                        minWidth: 150,
                        '&:hover': { background: '#00b8dd' },
                      }}
                    >
                      🎲 Próxima
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            <Paper
              elevation={0}
              sx={{
                ...painelSx,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  pb: 1.5,
                  mb: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, rgba(196,58,47,0.18), rgba(255,190,92,0.12))',
                      border: '1px solid rgba(196,58,47,0.35)',
                      color: 'var(--color-accent)',
                      fontSize: 15,
                    }}
                  >
                    ⏱
                  </Box>
                  <Typography
                    sx={{
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontSize: '0.76rem',
                    }}
                  >
                    Histórico da Sessão
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {historico.length > 0 && (
                    <Box
                      sx={{
                        minWidth: 28,
                        px: 1,
                        py: 0.4,
                        borderRadius: '999px',
                        background: 'rgba(196,58,47,0.12)',
                        border: '1px solid rgba(196,58,47,0.3)',
                        textAlign: 'center',
                        color: 'var(--text-primary)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {historico.length}
                    </Box>
                  )}

                  <Button
                    variant="text"
                    size="small"
                    onClick={handleLimparHistorico}
                    disabled={historico.length === 0 || processandoAcao || sorteando}
                    sx={{
                      color: '#fca5a5',
                      minWidth: 0,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'rgba(196,58,47,0.08)',
                      },
                    }}
                  >
                    Limpar histórico
                  </Button>
                </Box>
              </Box>

              {historico.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                  Nenhum sorteio registrado ainda.
                </Typography>
              ) : (
                <List
                  dense
                  disablePadding
                  sx={{
                    maxHeight: 1200,
                    overflowY: 'auto',
                    pr: 0.75,
                    scrollbarWidth: 'thin',
                    scrollbarColor:
                      'rgba(196, 58, 47, 0.9) rgba(255,255,255,0.04)',
                    '&::-webkit-scrollbar': {
                      width: '9px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: '999px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background:
                        'linear-gradient(180deg, rgba(196,58,47,0.95), rgba(239,68,68,0.85))',
                      borderRadius: '999px',
                      border: '2px solid transparent',
                      backgroundClip: 'padding-box',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background:
                        'linear-gradient(180deg, rgba(220,76,64,1), rgba(255,110,94,0.95))',
                    },
                  }}
                >
                  {historicoExibido.map(log => {
                    const { nome, deck, evento } = parseHistoricoLog(log);
                    const horario = formatarHoraEvento(log.createdAt);

                    return (
                      <ListItemButton
                        key={log.id}
                        disabled={!cartas.some(c => c.id === log.cartaId)}
                        onClick={() => handleVerHistoricoItem(log)}
                        sx={{
                          borderRadius: 1.5,
                          py: 1,
                          px: 1,
                          mb: 0.75,
                          border: '1px solid transparent',
                          background: 'rgba(255,255,255,0.015)',
                          position: 'relative',
                          pl: 2.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.04)',
                            borderColor: 'rgba(196,58,47,0.18)',
                            '&::before': {
                              boxShadow: '0 0 0 4px rgba(196,58,47,0.18)',
                            },
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 6,
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            background:
                              'linear-gradient(180deg, rgba(196,58,47,0.22), rgba(255,190,92,0.12), rgba(196,58,47,0.22))',
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 2,
                            top: '50%',
                            width: 12,
                            height: 12,
                            transform: 'translateY(-50%)',
                            borderRadius: '50%',
                            background:
                              'radial-gradient(circle, rgba(255,190,92,0.9) 0%, rgba(196,58,47,0.95) 55%, rgba(196,58,47,1) 100%)',
                            boxShadow: '0 0 0 4px rgba(196,58,47,0.18)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.75,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 1.5,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'var(--color-accent)',
                                fontWeight: 700,
                                letterSpacing: 1.2,
                                textTransform: 'uppercase',
                                lineHeight: 1.2,
                              }}
                            >
                              {evento}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'var(--text-muted)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                lineHeight: 1.2,
                              }}
                            >
                              {horario}
                            </Typography>
                          </Box>

                          <Typography
                            component="div"
                            variant="body2"
                            sx={{
                              color: 'var(--text-primary)',
                              fontWeight: 700,
                              lineHeight: 1.3,
                              wordBreak: 'break-word',
                            }}
                          >
                            {nome}
                          </Typography>

                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              width: 'fit-content',
                              px: 1,
                              py: 0.5,
                              borderRadius: '999px',
                              background: 'rgba(39, 174, 96, 0.08)',
                              border: '1px solid rgba(39,174,96,0.25)',
                              color: '#9ae6b4',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                            }}
                          >
                            {deck}
                          </Box>
                        </Box>
                      </ListItemButton>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      <CartaDetalheDialog
        open={Boolean(cartaVisualizada)}
        onClose={() => setCartaVisualizada(null)}
        carta={cartaVisualizada}
      />

      <EntityViewDialog
        open={Boolean(avisoEsgotado)}
        onClose={() => setAvisoEsgotado(null)}
        titulo="Nenhuma carta disponível"
        descricao={avisoEsgotado}
      />

      <Dialog
        open={chainAberta}
        onClose={() => setChainAberta(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          Cartas Encadeadas
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'var(--border-primary)' }}>
          <List dense disablePadding>
            {(cartaSorteada?.cartasVinculadas ?? []).map(vinculo => (
              <ListItemText
                key={vinculo.cartaId}
                sx={{ mb: 1.5 }}
                primary={
                  <Typography
                    sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {vinculo.cartaNome}
                  </Typography>
                }
                secondary={
                  <Typography sx={{ color: 'var(--text-secondary)' }}>
                    {[vinculo.cartaTipo, vinculo.cartaRaridade]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                }
              />
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setChainAberta(false)}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sorteio;
