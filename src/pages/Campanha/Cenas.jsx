import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import useCampanhaGrafo from './useCampanhaGrafo';
import CenaFlowCanvas from './CenaFlowCanvas';

const Cenas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const {
    cenas,
    nodes,
    edges,
    loading: loadingGrafo,
    error: errorGrafo,
    recarregar: recarregarGrafo,
    setSelectedCenaId,
    moveCenaLocal,
    persistirPosicaoCena,
    createConexao,
    removeConexao,
  } = useCampanhaGrafo(campanhaAtiva);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  const selecaoInicialAplicada = useRef(false);
  useEffect(() => {
    if (selecaoInicialAplicada.current) return;
    const cenaIdInicial = location.state?.selecionarCenaId;
    if (!cenaIdInicial || cenas.length === 0) return;
    if (cenas.some(c => c.id === cenaIdInicial)) {
      setSelectedCenaId(cenaIdInicial);
    }
    selecaoInicialAplicada.current = true;
  }, [cenas, location.state, setSelectedCenaId]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingGrafo;
  const podeEscrever = campanhaAtiva
    ? isAdmin || campanhaAtiva.mestreId === currentUser.uid
    : false;
  const handleAbrirCena = cenaId => {
    const cenaSelecionada = cenas.find(cena => cena.id === cenaId) ?? null;
    setSelectedCenaId(cenaId);
    navigate(ROUTE_PATHS.NOVA_CENA, {
      state: { cena: cenaSelecionada },
    });
  };

  return (
    <Box className="page-container">
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'flex-start' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Button
            onClick={() => navigate(ROUTE_PATHS.CAMPANHA)}
            sx={{
              color: 'var(--text-muted)',
              px: 0,
              mb: 1,
              alignSelf: 'flex-start',
            }}
          >
            ← Voltar para Campanhas
          </Button>
          <Typography
            variant="h5"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: '0.01em',
            }}
          >
            Cenas — {campanhaAtiva?.nome}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--text-secondary)',
              maxWidth: { xs: '100%', md: 640 },
              lineHeight: 1.7,
            }}
          >
            Organize o fluxo das cenas, conecte-as de forma intuitiva e
            visualize sua campanha com um estilo mais limpo e profissional.
          </Typography>
        </Box>
        {podeEscrever && cenas.length > 0 && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_CENA)}
            sx={{
              background:
                'linear-gradient(135deg, rgba(143,35,28,1), rgba(196,58,47,1))',
              color: '#FFFFFF',
              boxShadow: '0 16px 34px rgba(196,58,47,0.24)',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              py: 1.25,
              alignSelf: { xs: 'flex-start', md: 'auto' },
              '&:hover': {
                background:
                  'linear-gradient(135deg, rgba(196,58,47,1), rgba(143,35,28,1))',
              },
            }}
          >
            + Nova Cena
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorGrafo ? (
        <ListLoadError
          mensagem="Erro ao carregar as cenas."
          onRetry={recarregarGrafo}
        />
      ) : cenas.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🎬</span>
          <p>Nenhuma cena cadastrada</p>
          <small>Crie a primeira cena desta campanha.</small>
          {podeEscrever && (
            <Button
              variant="contained"
              onClick={() => navigate(ROUTE_PATHS.NOVA_CENA)}
              sx={{
                mt: 2,
                background: 'var(--color-primary)',
                '&:hover': { background: 'var(--color-primary-dark)' },
              }}
            >
              + Nova Cena
            </Button>
          )}
        </Box>
      ) : (
        <CenaFlowCanvas
          nodes={nodes}
          edges={edges}
          podeEscrever={podeEscrever}
          onNodePositionChange={moveCenaLocal}
          onNodeDragStop={persistirPosicaoCena}
          onNodeClick={handleAbrirCena}
          onConnect={createConexao}
          onRemoveConexao={removeConexao}
          onNovaCena={() => navigate(ROUTE_PATHS.NOVA_CENA)}
        />
      )}
    </Box>
  );
};

export default Cenas;
