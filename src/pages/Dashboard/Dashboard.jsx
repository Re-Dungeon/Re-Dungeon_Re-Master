import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useCampanha } from 'context/CampanhaContext';
import {
  getRmNotasPorCampanha,
  getRmSessaoLogsPorCampanha,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import {
  ICONE_EVENTO_SESSAO,
  formatarHoraEvento,
  ordenarLogsPorDataDesc,
} from 'common/utils/sessaoLog';
import useCampanhaGrafo from 'pages/Campanha/useCampanhaGrafo';
import CenaFlowCanvas from 'pages/Campanha/CenaFlowCanvas';
import { ESTADO_CENA_OPCOES } from 'pages/Campanha/cenaUtils';

const noop = () => {};

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const {
    cenas,
    nodes,
    edges,
    loading: loadingGrafo,
  } = useCampanhaGrafo(campanhaAtiva);

  const [notas, setNotas] = useState([]);
  const [loadingNotas, setLoadingNotas] = useState(true);

  const carregarNotas = useCallback(() => {
    if (!campanhaAtiva) {
      setNotas([]);
      setLoadingNotas(false);
      return Promise.resolve();
    }
    setLoadingNotas(true);
    return getRmNotasPorCampanha(campanhaAtiva.id)
      .then(setNotas)
      .finally(() => setLoadingNotas(false));
  }, [campanhaAtiva]);

  useAsyncEffect(carregarNotas, [carregarNotas]);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const carregarLogs = useCallback(() => {
    if (!campanhaAtiva) {
      setLogs([]);
      setLoadingLogs(false);
      return Promise.resolve();
    }
    setLoadingLogs(true);
    return getRmSessaoLogsPorCampanha(campanhaAtiva.id)
      .then(todos => setLogs(ordenarLogsPorDataDesc(todos)))
      .finally(() => setLoadingLogs(false));
  }, [campanhaAtiva]);

  useAsyncEffect(carregarLogs, [carregarLogs]);

  if (loadingCampanhas) return null;

  if (!campanhaAtiva) {
    return (
      <Box className="page-container">
        <Box className="page-section">
          <Box className="page-header">
            <Box>
              <Typography variant="h3">Dashboard</Typography>
              <Typography variant="body2">
                Centro de comando da sessão — em construção.
              </Typography>
            </Box>
          </Box>
          <Box className="empty-state">
            <span className="empty-state-icon">🏠</span>
            <p>Nenhuma campanha selecionada</p>
            <small>
              Crie ou selecione uma Campanha para começar a rodar sua sessão.
            </small>
            <Button
              variant="contained"
              onClick={() => navigate(ROUTE_PATHS.CAMPANHA)}
              sx={{
                mt: 2,
                background: 'var(--color-primary)',
                '&:hover': { background: '#5a2090' },
              }}
            >
              Ir para Campanha
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  const loading = loadingGrafo || loadingNotas || loadingLogs;
  const logsRecentes = logs.slice(0, 6);
  const cenaAtual = cenas.find(c => c.id === campanhaAtiva.cenaAtualId) ?? null;
  const estadoCenaAtual =
    cenaAtual && ESTADO_CENA_OPCOES.find(o => o.value === cenaAtual.estado);
  const proximasCenas = cenaAtual
    ? edges
        .filter(e => e.source === cenaAtual.id)
        .map(e => cenas.find(c => c.id === e.target))
        .filter(Boolean)
    : [];
  const notasRecentes = notas.slice(0, 4);

  const irParaCena = cenaId =>
    navigate(ROUTE_PATHS.CENAS, { state: { selecionarCenaId: cenaId } });

  return (
    <Box className="page-container">
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
        >
          Dashboard — {campanhaAtiva.nome}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Centro de comando da sessão em andamento.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={cardSx}>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Cena Atual
              </Typography>
              {cenaAtual ? (
                <Box sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {cenaAtual.titulo}
                    </Typography>
                    {estadoCenaAtual && (
                      <Chip
                        label={estadoCenaAtual.label}
                        size="small"
                        sx={{
                          background: estadoCenaAtual.cor,
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                  {cenaAtual.objetivo && (
                    <Typography
                      variant="body2"
                      sx={{ color: 'var(--text-secondary)', mb: 1.5 }}
                    >
                      {cenaAtual.objetivo}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    onClick={() => irParaCena(cenaAtual.id)}
                    sx={{ color: 'var(--color-accent)' }}
                  >
                    Abrir no Fluxograma →
                  </Button>
                </Box>
              ) : (
                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-muted)', mb: 1.5 }}
                  >
                    Nenhuma cena marcada como atual ainda. Abra uma cena no
                    fluxograma e marque-a.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(ROUTE_PATHS.CENAS)}
                    sx={{
                      color: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                    }}
                  >
                    Ir para Cenas
                  </Button>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, pb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Fluxograma (visão geral)
                </Typography>
              </Box>
              {nodes.length === 0 ? (
                <Box className="empty-state" sx={{ py: 4 }}>
                  <span className="empty-state-icon">🎬</span>
                  <p>Nenhuma cena cadastrada ainda</p>
                </Box>
              ) : (
                <Box sx={{ px: 2.5, pb: 2.5 }}>
                  <CenaFlowCanvas
                    nodes={nodes}
                    edges={edges}
                    podeEscrever={false}
                    height="280px"
                    compact
                    onNodePositionChange={noop}
                    onNodeDragStop={noop}
                    onNodeClick={irParaCena}
                    onConnect={noop}
                    onNovaCena={noop}
                  />
                </Box>
              )}
            </Paper>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={cardSx}>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Próximas Cenas
              </Typography>
              <Box
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {proximasCenas.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-muted)' }}
                  >
                    {cenaAtual
                      ? 'Nenhuma cena conectada a partir daqui ainda.'
                      : 'Marque uma Cena Atual para ver os próximos caminhos.'}
                  </Typography>
                ) : (
                  proximasCenas.map(cena => (
                    <Button
                      key={cena.id}
                      onClick={() => irParaCena(cena.id)}
                      sx={{
                        justifyContent: 'flex-start',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-secondary)',
                        '&:hover': {
                          background: 'var(--bg-secondary)',
                          opacity: 0.8,
                        },
                      }}
                    >
                      {cena.titulo}
                    </Button>
                  ))
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                >
                  Notas Rápidas
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate(ROUTE_PATHS.NOVA_NOTA)}
                  sx={{ color: 'var(--color-accent)', minWidth: 0 }}
                >
                  + Nova
                </Button>
              </Box>
              <Box
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {notasRecentes.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-muted)' }}
                  >
                    Nenhuma nota registrada ainda.
                  </Typography>
                ) : (
                  notasRecentes.map(nota => (
                    <Box key={nota.id}>
                      <Typography
                        variant="body2"
                        sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                      >
                        {nota.titulo}
                      </Typography>
                      {nota.conteudo && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'var(--text-secondary)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {nota.conteudo}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
                {notas.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => navigate(ROUTE_PATHS.NOTAS)}
                    sx={{
                      alignSelf: 'flex-start',
                      color: 'var(--color-accent)',
                      mt: 0.5,
                    }}
                  >
                    Ver todas →
                  </Button>
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={cardSx}>
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Registro da Sessão
              </Typography>
              <Box
                sx={{
                  mt: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {logsRecentes.length === 0 ? (
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-muted)' }}
                  >
                    Nenhum evento registrado ainda — marcar uma Cena Atual,
                    sortear uma carta ou adicionar um participante à Luta
                    aparece aqui automaticamente.
                  </Typography>
                ) : (
                  logsRecentes.map(log => (
                    <Box
                      key={log.id}
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                    >
                      <Typography sx={{ lineHeight: 1.4 }}>
                        {ICONE_EVENTO_SESSAO[log.tipo] ?? '•'}
                      </Typography>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: 'var(--text-primary)' }}
                        >
                          {log.mensagem}
                        </Typography>
                        {formatarHoraEvento(log.createdAt) && (
                          <Typography
                            variant="caption"
                            sx={{ color: 'var(--text-muted)' }}
                          >
                            {formatarHoraEvento(log.createdAt)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
