import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useCampanha } from 'context/CampanhaContext';
import { getCardfluxCartas, getRmCardfluxEstados } from 'service/storage';
import EntityViewDialog from 'components/EntityViewDialog/EntityViewDialog';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import {
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
} from 'common/utils/sessaoLog';
import CartaDetalheDialog from './CartaDetalheDialog';
import {
  mesclarEstadoCartas,
  definirEstadoCarta,
  sortearCarta,
} from './cartaUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const CardFlux = () => {
  const navigate = useNavigate();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const [cartas, setCartas] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState(null);
  const [cartaSorteada, setCartaSorteada] = useState(null);
  const [avisoEsgotado, setAvisoEsgotado] = useState(null);

  const carregarDados = useCallback(async () => {
    if (!campanhaAtiva) {
      setCartas([]);
      setLoadingDados(false);
      return;
    }
    setLoadingDados(true);
    setError(null);
    try {
      const [cartasDoUniverso, todosEstados] = await Promise.all([
        getCardfluxCartas(campanhaAtiva.universoId),
        getRmCardfluxEstados(),
      ]);
      const estadosDaCampanha = todosEstados.filter(
        e => e.campanhaId === campanhaAtiva.id,
      );
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

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingDados;

  const handlePuxarCarta = async baralho => {
    const disponiveis = baralho.cartas.filter(
      c => c.estadoNoBaralho === 'no_baralho',
    );
    if (disponiveis.length === 0) {
      setAvisoEsgotado(`Não há mais cartas disponíveis em "${baralho.nome}".`);
      return;
    }
    const sorteada = sortearCarta(disponiveis);
    await definirEstadoCarta(sorteada, 'comprada', campanhaAtiva);
    setCartaSorteada(sorteada);
    registrarEventoSessao(
      campanhaAtiva,
      TIPO_EVENTO_SESSAO.CARTA_SORTEADA,
      `Carta sorteada: "${sorteada.nome}" (${baralho.nome})`,
    );
    await carregarDados();
  };

  return (
    <Box className="page-container">
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
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
            const disponiveis = baralho.cartas.filter(
              c => c.estadoNoBaralho === 'no_baralho',
            );

            return (
              <Paper key={baralho.nome} elevation={0} sx={cardSx}>
                <Typography
                  variant="h6"
                  sx={{ color: 'var(--text-primary)', fontWeight: 600, mb: 1 }}
                >
                  {baralho.nome}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{ color: 'var(--text-muted)', display: 'block', mb: 1.5 }}
                >
                  {disponiveis.length}/{baralho.cartas.length} cartas
                  disponíveis
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handlePuxarCarta(baralho)}
                    sx={{
                      background: 'var(--color-accent)',
                      color: 'var(--bg-primary)',
                      fontWeight: 700,
                      '&:hover': { background: '#00b8dd' },
                    }}
                  >
                    Puxar Carta
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() =>
                      navigate(ROUTE_PATHS.CARDFLUX_CARTAS, {
                        state: { baralho: { nome: baralho.nome } },
                      })
                    }
                    sx={{
                      color: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                    }}
                  >
                    Ver Cartas
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <CartaDetalheDialog
        open={Boolean(cartaSorteada)}
        onClose={() => setCartaSorteada(null)}
        carta={cartaSorteada}
      />

      <EntityViewDialog
        open={Boolean(avisoEsgotado)}
        onClose={() => setAvisoEsgotado(null)}
        titulo="Baralho esgotado"
        descricao={avisoEsgotado}
      />
    </Box>
  );
};

export default CardFlux;
