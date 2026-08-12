import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
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
  background: 'linear-gradient(180deg, #181C23, #12161D)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 2,
  boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
};

const dashboardHeroSx = {
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '18px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(20, 25, 34, 0.72)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 20px 64px rgba(0,0,0,0.38)',
};

const sectionCardSx = {
  ...cardSx,
  borderRadius: '14px',
};

const timelineItemSx = {
  p: 1.75,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  transition: 'transform 180ms ease-out, background 180ms ease-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    background: 'rgba(255,255,255,0.06)',
  },
};

const noteCardSx = {
  p: 2,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '14px',
  transition: 'transform 180ms ease-out, box-shadow 180ms ease-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
  },
};

const logItemSx = {
  px: 2,
  py: 1.5,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  transition: 'transform 180ms ease-out, background 180ms ease-out',
  '&:hover': {
    transform: 'translateY(-1px)',
    background: 'rgba(255,255,255,0.06)',
  },
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
    return getRmNotasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    )
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
    return getRmSessaoLogsPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    )
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
                '&:hover': { background: 'var(--color-primary-dark)' },
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

  if (loading) {
    return (
      <Box className="page-container" sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)' }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            minHeight: '60vh',
            color: '#F5F5F5',
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#C43A2F' }} />
            <Typography variant="body2" sx={{ color: '#9FA7B2', mt: 2 }}>
              Carregando o Centro de Comando...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  const MAX_LOGS_DISPLAY = 12;
  const logsRecentes = logs.slice(0, MAX_LOGS_DISPLAY);
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
    <Box className="page-container" sx={{ position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url("https://i.imgur.com/lfbLUGy.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.22,
          filter: 'grayscale(0.6) brightness(0.45)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(9,11,16,0.8) 0%, rgba(9,11,16,0.96) 100%)',
          zIndex: 1,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.72) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 2, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            mb: 3,
            px: { xs: 0, md: 1 },
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: '#FFFFFF',
              fontWeight: 900,
              letterSpacing: '0.04em',
              lineHeight: 1.02,
              textShadow: '0 10px 30px rgba(0,0,0,0.35)',
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#D7D7E4',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textShadow: '0 4px 18px rgba(0,0,0,0.18)',
            }}
          >
            Sentinelas da Coroa
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#E2E6EF',
              maxWidth: 720,
              fontSize: 16,
              lineHeight: 1.85,
              mt: 1.25,
              textShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
          >
            Centro de comando da sessão em andamento. Toda informação crucial está organizada para a tomada de decisões rápidas e imersivas.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1.4fr 0.9fr' },
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={dashboardHeroSx}>
              <Box
                sx={{
                  position: 'relative',
                  minHeight: 260,
                  backgroundImage: `linear-gradient(180deg, rgba(9,11,16,0.05), rgba(9,11,16,0.85)), url("${cenaAtual?.linkImagem || 'https://i.imgur.com/Ke4NQ8L.jpg'}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(9,11,16,0.2), rgba(9,11,16,0.95))',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at top right, rgba(196,58,47,0.16), transparent 28%)',
                  }}
                />
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    height: '100%',
                    p: { xs: 3, md: 4 },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#F8F4E9',
                        textTransform: 'uppercase',
                        letterSpacing: '0.18em',
                        mb: 1,
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '999px',
                        bgcolor: 'rgba(255,255,255,0.08)',
                        textShadow: '0 4px 18px rgba(0,0,0,0.18)',
                      }}
                    >
                      Cena Atual
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#FFFFFF',
                        fontWeight: 1000,
                        mb: 1,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {cenaAtual?.titulo ?? 'Sem cena ativa'}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
                        background: 'rgba(207, 191, 191, 0.06)',
                        border: '2px solid rgba(247, 247, 247, 0.08)',
                        borderRadius: '999px',
                        px: 4,
                        py: 0.75,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#8F231C',
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 900,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {estadoCenaAtual?.label ?? 'Pendente'}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#EDF0F7',
                        maxWidth: 620,
                        lineHeight: 1.9,
                        fontWeight: 600,
                        fontSize: 15,
                      }}
                    >
                      {cenaAtual?.resumo ?? 'Ainda não existe uma cena ativa. Selecione uma para iniciar o comando da sua sessão.'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                    <Button
                      onClick={() => navigate(ROUTE_PATHS.CENAS)}
                      sx={{
                        background: 'linear-gradient(135deg, #8F231C 0%, #C43A2F 100%)',
                        color: '#F5F5F5',
                        px: 4,
                        py: 1.5,
                        borderRadius: '12px',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 14px 26px rgba(143,35,28,0.25)',
                        transition: 'transform 180ms ease-out, box-shadow 180ms ease-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: '0 18px 34px rgba(143,35,28,0.32)',
                          background: 'linear-gradient(135deg, #C43A2F 0%, #8F231C 100%)',
                        },
                      }}
                    >
                      Abrir Fluxograma
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...sectionCardSx, py: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#9FA7B2',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                }}
              >
                Fluxograma
              </Typography>
              <Box sx={{ mt: 2, borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                {nodes.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#9FA7B2' }}>
                      Nenhuma cena cadastrada ainda
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 683, background: 'rgba(255,255,255,0.02)' }}>
                    <CenaFlowCanvas
                      nodes={nodes}
                      edges={edges}
                      podeEscrever={false}
                      height="683px"
                      compact
                      onNodePositionChange={noop}
                      onNodeDragStop={noop}
                      onNodeClick={irParaCena}
                      onConnect={noop}
                      onNovaCena={noop}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 3, minHeight: 683 }}>
            <Paper elevation={0} sx={sectionCardSx}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9FA7B2',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                    }}
                  >
                    Próximas Cenas
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#F5F5F5', mt: 0.5 }}
                  >
                    Como a trama se desdobra nos próximos passos.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {proximasCenas.length === 0 ? (
                  <Box sx={{ p: 3, background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                    <Typography variant="body2" sx={{ color: '#9FA7B2' }}>
                      Nenhuma cena conectada a partir daqui ainda.
                    </Typography>
                  </Box>
                ) : (
                  proximasCenas.map((cena, index) => (
                    <Box key={cena.id} sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 2, ...timelineItemSx }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(196,58,47,0.18)',
                            display: 'grid',
                            placeItems: 'center',
                            color: '#C43A2F',
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}
                        </Box>
                        {index < proximasCenas.length - 1 && (
                          <Box sx={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.08)', mx: 'auto' }} />
                        )}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ color: '#F5F5F5', fontWeight: 700 }}>
                          {cena.titulo}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9FA7B2' }}>
                          {cena.descricao ?? 'Nenhuma descrição disponível'}
                        </Typography>
                      </Box>
                      <Button
                        onClick={() => irParaCena(cena.id)}
                        sx={{
                          color: '#F5F5F5',
                          background: 'rgba(255,255,255,0.06)',
                          px: 2.5,
                          py: 1,
                          borderRadius: '999px',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.12)',
                          },
                        }}
                      >
                        Ver
                      </Button>
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionCardSx}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#9FA7B2',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: '0.16em',
                    }}
                  >
                    Notas Rápidas
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#F5F5F5', mt: 0.5 }}>
                    Capture ideias e segredos da sessão.
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate(ROUTE_PATHS.NOVA_NOTA)}
                  sx={{
                    color: '#F5F5F5',
                    background: 'rgba(196,58,47,0.18)',
                    px: 3,
                    py: 1,
                    borderRadius: '999px',
                    '&:hover': {
                      background: 'rgba(196,58,47,0.28)',
                    },
                  }}
                >
                  + Nova Nota
                </Button>
              </Box>
              <Box sx={{ display: 'grid', gap: 2 }}>
                {notasRecentes.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                    <Typography variant="h4" sx={{ color: '#4B5563', mb: 1.5 }}>
                      ✍️
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#9FA7B2', mb: 2 }}>
                      Nenhuma nota registrada ainda. Comece criando lembretes para sua campanha.
                    </Typography>
                    <Button
                      onClick={() => navigate(ROUTE_PATHS.NOVA_NOTA)}
                      sx={{
                        background: 'linear-gradient(135deg, #8F231C 0%, #C43A2F 100%)',
                        color: '#F5F5F5',
                        px: 4,
                        py: 1.2,
                        borderRadius: '12px',
                        '&:hover': {
                          transform: 'scale(1.02)',
                        },
                      }}
                    >
                      Criar primeira nota
                    </Button>
                  </Box>
                ) : (
                  notasRecentes.map(nota => (
                    <Box key={nota.id} sx={noteCardSx}>
                      <Typography variant="body2" sx={{ color: '#F5F5F5', fontWeight: 700, mb: 0.5 }}>
                        {nota.titulo}
                      </Typography>
                      {nota.conteudo && (
                        <Typography variant="caption" sx={{ color: '#9FA7B2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {nota.conteudo}
                        </Typography>
                      )}
                    </Box>
                  ))
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionCardSx}>
              <Typography
                variant="caption"
                sx={{
                  color: '#9FA7B2',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                }}
              >
                Registro da Sessão
              </Typography>
              <Box sx={{ mt: 2, display: 'grid', gap: 2, maxHeight: 400, overflowY: 'auto', pr: 0.5 }}>
                {logsRecentes.length === 0 ? (
                  <Box sx={{ p: 3, background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
                    <Typography variant="body2" sx={{ color: '#9FA7B2' }}>
                      Nenhum evento registrado ainda.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {logsRecentes.map(log => (
                      <Box key={log.id} sx={logItemSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'rgba(196,58,47,0.18)',
                              display: 'grid',
                              placeItems: 'center',
                              color: '#C43A2F',
                              fontWeight: 700,
                            }}
                          >
                            {ICONE_EVENTO_SESSAO[log.tipo] ?? '•'}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ color: '#F5F5F5', fontWeight: 700 }}>
                              {log.mensagem}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#9FA7B2' }}>
                              {formatarHoraEvento(log.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}

                    {/* filler boxes to keep layout balanced when few logs exist */}
                    {logsRecentes.length < MAX_LOGS_DISPLAY && (
                      Array.from({ length: MAX_LOGS_DISPLAY - logsRecentes.length }).map((_, i) => (
                        <Box key={`filler-${i}`} sx={{ ...logItemSx, opacity: 0.06, background: 'transparent', borderStyle: 'dashed' }} />
                      ))
                    )}
                  </>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
