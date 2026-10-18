import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addGridToken,
  getRmMapasPorCampanha,
  removeGridToken,
  setGridConfig,
  updateGridToken,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  dimensoesDoMundo,
  limitarPosicao,
  montarToken,
  primeiraCelulaLivre,
  validarToken,
} from 'common/utils/grid';
import useGridCampanha from 'hooks/useGridCampanha';
import GridMapa from 'components/Grid/GridMapa';
import ChatMestre from 'pages/Chat/ChatMestre';
import useFontesDaMesa from 'pages/Chat/useFontesDaMesa';
import AdicionarTokenDialog from './AdicionarTokenDialog';
import GridConfigPainel from './GridConfigPainel';
import TokenPainel from './TokenPainel';

const MAPAS_VAZIOS = { campanhaId: null, lista: [] };

/**
 * Grid (mapa tático) da Campanha ativa, compartilhado em tempo real com os
 * jogadores (site Ficha-RPG---Re-Dungeon-, rota /campanhas/:id/grid). O
 * mestre define a imagem e a grade, adiciona tokens de jogadores/NPCs/
 * Criaturas (ou avulsos), muda tamanho, oculta, atribui a jogadores e move
 * todos; os jogadores movem só os atribuídos a eles. Com o chat da campanha
 * ao lado (ChatMestre). Modelo em common/utils/grid.js, escuta em
 * hooks/useGridCampanha.js.
 */
const Grid = () => {
  const { currentUser } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const { notifyError, notifySuccess } = useSnackbar();
  const navigate = useNavigate();
  const campanhaId = campanhaAtiva?.id ?? null;

  const fontes = useFontesDaMesa(campanhaAtiva, { incluirJogadores: true });
  const grid = useGridCampanha(campanhaId, {
    uid: currentUser.uid,
    isMestre: true,
    ehMestreDaCampanha: true,
  });
  const { erro: erroGrid, limparErro: limparErroGrid } = grid;

  const [selecionadoId, setSelecionadoId] = useState(null);
  const [configAberta, setConfigAberta] = useState(false);
  const [previa, setPrevia] = useState(null);
  const [adicionarAberto, setAdicionarAberto] = useState(false);
  const [chatAberto, setChatAberto] = useState(true);
  const [imagemCarregada, setImagemCarregada] = useState(null);
  const [mapasCarregados, setMapasCarregados] = useState(MAPAS_VAZIOS);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  // Mapas da campanha (tela Mapas) com imagem — atalho para a imagem do grid.
  useEffect(() => {
    if (!campanhaAtiva) return undefined;
    let active = true;
    const { id, universoId, mestreId } = campanhaAtiva;
    getRmMapasPorCampanha(id, universoId, mestreId)
      .then(mapas => {
        if (!active) return;
        setMapasCarregados({
          campanhaId: id,
          lista: mapas.filter(mapa => mapa.linkImagem),
        });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao carregar os mapas da campanha:', error);
      });
    return () => {
      active = false;
    };
  }, [campanhaAtiva]);

  useEffect(() => {
    if (!erroGrid) return;
    notifyError(erroGrid);
    limparErroGrid();
  }, [erroGrid, limparErroGrid, notifyError]);

  const config = (configAberta && previa) || grid.config;
  const limites = dimensoesDoMundo(
    config,
    imagemCarregada?.url === config.imagemUrl ? imagemCarregada : null,
  );
  const selecionado =
    grid.tokens.find(token => token.id === selecionadoId) ?? null;
  const mapas =
    mapasCarregados.campanhaId === campanhaId ? mapasCarregados.lista : [];

  const handleAdicionar = useCallback(
    async dados => {
      const posicao = primeiraCelulaLivre(grid.tokens, dados.tamanho, limites);
      const token = montarToken({ ...dados, ...posicao });
      const erro = validarToken(token);
      if (erro) {
        notifyError(erro);
        return false;
      }
      try {
        await addGridToken(campanhaId, token);
        notifySuccess(`${token.nome} entrou no grid.`);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao adicionar token:', error);
        notifyError('Não foi possível adicionar o token.');
        return false;
      }
    },
    [grid.tokens, limites, campanhaId, notifyError, notifySuccess],
  );

  const handleSalvarToken = async patch => {
    // Token que cresceu continua inteiro dentro do grid.
    const posicao = limitarPosicao(
      selecionado.col,
      selecionado.lin,
      limites,
      patch.tamanho,
    );
    try {
      await updateGridToken(campanhaId, selecionado.id, {
        ...patch,
        ...posicao,
      });
      notifySuccess('Token atualizado.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Falha ao salvar token:', error);
      notifyError('Não foi possível salvar o token.');
    }
  };

  const handleRemoverToken = async () => {
    if (!window.confirm(`Remover "${selecionado.nome}" do grid?`)) return;
    try {
      await removeGridToken(campanhaId, selecionado.id);
      setSelecionadoId(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Falha ao remover token:', error);
      notifyError('Não foi possível remover o token.');
    }
  };

  const fecharConfig = () => {
    setConfigAberta(false);
    setPrevia(null);
  };

  const handleSalvarConfig = async novaConfig => {
    try {
      await setGridConfig(campanhaId, novaConfig);
      notifySuccess('Grid salvo.');
      fecharConfig();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Falha ao salvar o grid:', error);
      notifyError('Não foi possível salvar o grid.');
    }
  };

  if (!campanhaAtiva) return null;

  let aviso = null;
  if (grid.carregando) aviso = 'Carregando o grid…';
  else if (!grid.configurado && grid.tokens.length === 0) {
    aviso =
      'Grid vazio: em "Configurar grid" escolha a imagem e o tamanho das células, depois adicione tokens.';
  }

  return (
    <Box
      className="page-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: 'calc(100vh - 140px)',
        minHeight: 480,
      }}
    >
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}
      >
        <Typography
          sx={{ color: 'var(--text-primary)', fontWeight: 700, mr: 'auto' }}
        >
          Grid — {campanhaAtiva.nome}
        </Typography>
        <Button
          startIcon={<SettingsIcon />}
          onClick={() => {
            setPrevia(null);
            setConfigAberta(true);
          }}
          disabled={configAberta}
        >
          Configurar grid
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAdicionarAberto(true)}
        >
          Adicionar token
        </Button>
        <Button
          startIcon={<ChatOutlinedIcon />}
          aria-pressed={chatAberto}
          onClick={() => setChatAberto(aberto => !aberto)}
        >
          {chatAberto ? 'Ocultar chat' : 'Mostrar chat'}
        </Button>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
          }}
        >
          <GridMapa
            config={config}
            tokens={grid.tokens}
            podeMover={grid.podeMover}
            onMover={grid.mover}
            selecionadoId={selecionadoId}
            onSelecionar={token => setSelecionadoId(token?.id ?? null)}
            onImagemCarregada={setImagemCarregada}
            aviso={aviso}
          />
          {selecionado && (
            <TokenPainel
              key={selecionado.id}
              token={selecionado}
              jogadores={fontes.jogadores}
              onSalvar={handleSalvarToken}
              onRemover={handleRemoverToken}
              onFechar={() => setSelecionadoId(null)}
            />
          )}
          {configAberta && (
            <GridConfigPainel
              config={grid.config}
              mapas={mapas}
              onPrevia={setPrevia}
              onSalvar={handleSalvarConfig}
              onFechar={fecharConfig}
            />
          )}
        </Box>

        {chatAberto && (
          <Box
            sx={{
              width: { xs: '100%', md: 380 },
              height: { xs: '45%', md: 'auto' },
              flexShrink: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ChatMestre
              key={campanhaAtiva.id}
              campanha={campanhaAtiva}
              npcs={fontes.npcs}
              criaturas={fontes.criaturas}
              titulo="Chat"
            />
          </Box>
        )}
      </Box>

      <AdicionarTokenDialog
        open={adicionarAberto}
        onClose={() => setAdicionarAberto(false)}
        fontes={fontes}
        onAdicionar={handleAdicionar}
      />
    </Box>
  );
};

export default Grid;
