import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { updateRmCampanha } from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
} from 'common/utils/sessaoLog';
import useCampanhaGrafo from './useCampanhaGrafo';
import CenaFlowCanvas from './CenaFlowCanvas';
import CenaDetailPanel from './CenaDetailPanel';

const Cenas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas, recarregarCampanhas } =
    useCampanha();

  const {
    cenas,
    nodes,
    edges,
    loading: loadingGrafo,
    error: errorGrafo,
    recarregar: recarregarGrafo,
    selectedCenaId,
    setSelectedCenaId,
    moveCenaLocal,
    persistirPosicaoCena,
    createConexao,
    removeConexao,
    updateCena,
    removeCena,
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
    ? canWrite(campanhaAtiva.universoId)
    : false;
  const cenaSelecionada = cenas.find(c => c.id === selectedCenaId) ?? null;

  const handleSalvarCena = async (cenaId, values) => {
    await updateCena(cenaId, values);
  };

  const handleRemoverCena = async cenaId => {
    await removeCena(cenaId);
  };

  const handleMarcarCenaAtual = async cenaId => {
    await updateRmCampanha(campanhaAtiva.id, { cenaAtualId: cenaId });
    await recarregarCampanhas();
    const cena = cenas.find(c => c.id === cenaId);
    if (cena) {
      registrarEventoSessao(
        campanhaAtiva,
        TIPO_EVENTO_SESSAO.CENA_ATUAL,
        `Cena atual: "${cena.titulo}"`,
      );
    }
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
          <Button
            onClick={() => navigate(ROUTE_PATHS.CAMPANHA)}
            sx={{ color: 'var(--text-muted)', px: 0, mb: 1 }}
          >
            ← Voltar para Campanhas
          </Button>
          <Typography
            variant="h5"
            sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
          >
            Cenas — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Arraste as cenas para organizar o fluxograma, conecte-as puxando de
            uma borda até outra cena e use o × no meio da seta para remover uma
            conexão.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && cenas.length > 0 && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_CENA)}
            sx={{
              background: 'var(--color-primary)',
              '&:hover': { background: 'var(--color-primary-dark)' },
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
          {canCreate() && podeEscrever && (
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
          onNodeClick={setSelectedCenaId}
          onConnect={createConexao}
          onRemoveConexao={removeConexao}
          onNovaCena={() => navigate(ROUTE_PATHS.NOVA_CENA)}
        />
      )}

      <CenaDetailPanel
        cena={cenaSelecionada}
        podeEscrever={podeEscrever}
        ehCenaAtual={
          Boolean(cenaSelecionada) &&
          cenaSelecionada.id === campanhaAtiva?.cenaAtualId
        }
        onClose={() => setSelectedCenaId(null)}
        onSave={handleSalvarCena}
        onDelete={handleRemoverCena}
        onMarcarCenaAtual={handleMarcarCenaAtual}
      />
    </Box>
  );
};

export default Cenas;
