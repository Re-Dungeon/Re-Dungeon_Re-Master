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
import Chip from '@mui/material/Chip';
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
  getRmSessaoLogsPorCampanha,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import EntityViewDialog from 'components/EntityViewDialog/EntityViewDialog';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import {
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
  ordenarLogsPorDataDesc,
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

const HISTORICO_LIMITE = 30;

const painelSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const numeroCampoProps = {
  inputProps: { style: { color: 'var(--text-primary)' } },
};

const Sorteio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const baralho = location.state?.baralho ?? null;

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
    if (!campanhaAtiva || !baralho) {
      setCartas([]);
      setHistorico([]);
      setLoadingDados(false);
      return;
    }
    setLoadingDados(true);
    setError(null);
    try {
      const [cartasDoUniverso, estadosDaCampanha, todosLogs] =
        await Promise.all([
          getCardfluxCartas(campanhaAtiva.universoId),
          getRmCardfluxEstadosPorCampanha(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
          getRmSessaoLogsPorCampanha(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
        ]);
      const cartasDoBaralho = cartasDoUniverso.filter(
        c => c.deck === baralho.nome,
      );
      const cartasMescladas = mesclarEstadoCartas(
        cartasDoBaralho,
        estadosDaCampanha,
      );
      setCartas(cartasMescladas);
      const logsDoBaralho = todosLogs.filter(
        log =>
          log.tipo === TIPO_EVENTO_SESSAO.CARTA_SORTEADA &&
          log.deck === baralho.nome,
      );
      setHistorico(
        ordenarLogsPorDataDesc(logsDoBaralho).slice(0, HISTORICO_LIMITE),
      );
      return cartasMescladas;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoadingDados(false);
    }
  }, [campanhaAtiva, baralho]);

  useAsyncEffect(carregarDados, [carregarDados]);

  useEffect(() => {
    if (!loadingCampanhas && (!campanhaAtiva || !baralho))
      navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingCampanhas, campanhaAtiva, baralho, navigate]);

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

  if ((!campanhaAtiva || !baralho) && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingDados;

  const handleSortear = async () => {
    const pool = filtrarPoolValido(cartas, intensidadeMinima);
    if (pool.length === 0) {
      setAvisoEsgotado(
        `Nenhuma carta disponível em "${baralho.nome}" com os filtros atuais (todas compradas, descartadas, em cooldown ou abaixo da intensidade mínima).`,
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
        `Carta sorteada: "${sorteada.nome}" (${baralho.nome})`,
        {
          cartaId: sorteada.id,
          deck: baralho.nome,
          raridade: sorteada.raridade ?? null,
          numero: cartasCompradas + 1,
        },
      );
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

  const handleVerHistoricoItem = log => {
    const carta = cartas.find(c => c.id === log.cartaId);
    if (carta) setCartaVisualizada(carta);
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
          Sorteio — {baralho?.nome}
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
                inputProps={{ min: -5, max: 5 }}
              />
              <TextField
                label="Atraso"
                type="number"
                size="small"
                value={atraso}
                onChange={e => setAtraso(Math.max(0, Number(e.target.value)))}
                inputProps={{ min: 0 }}
              />
              <TextField
                label="Acelerar"
                type="number"
                size="small"
                value={acelerar}
                onChange={e => setAcelerar(Math.max(0, Number(e.target.value)))}
                inputProps={{ min: 0 }}
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
                inputProps={{ min: INTENSIDADE_MIN, max: INTENSIDADE_MAX }}
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
                      {cartaSorteada.nome}
                    </Typography>
                    {cartaSorteada.tipo && (
                      <Chip
                        label={cartaSorteada.tipo}
                        size="small"
                        sx={{
                          background: 'var(--color-primary)',
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {cartaSorteada.raridade && (
                      <Chip
                        label={cartaSorteada.raridade}
                        size="small"
                        variant="outlined"
                        sx={{
                          color: 'var(--color-accent)',
                          borderColor: 'var(--color-accent)',
                        }}
                      />
                    )}
                  </Box>

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
                    sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}
                  >
                    <Button
                      variant="outlined"
                      disabled={processandoAcao || sorteando}
                      onClick={handleDescartar}
                      sx={{ color: '#E74C3C', borderColor: '#E74C3C' }}
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
                        '&:hover': { background: '#00b8dd' },
                      }}
                    >
                      🎲 Próxima
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={painelSx}>
              <Typography
                sx={{
                  color: 'var(--color-accent)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: '0.8rem',
                  mb: 1,
                }}
              >
                Histórico da Sessão
              </Typography>
              {historico.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                  Nenhum sorteio registrado ainda.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {historico.map(log => (
                    <ListItemButton
                      key={log.id}
                      disabled={!cartas.some(c => c.id === log.cartaId)}
                      onClick={() => handleVerHistoricoItem(log)}
                      sx={{ borderRadius: 1, mb: 0.5 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                            {log.mensagem}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            {formatarHoraEvento(log.createdAt)}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
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
                  <Typography sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
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
