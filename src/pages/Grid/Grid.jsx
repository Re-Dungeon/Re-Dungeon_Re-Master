import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addGridCena,
  addGridTokens,
  duplicarGridCena,
  getRmMapasPorCampanha,
  removeGridCena,
  removeGridToken,
  setGridCenaAtiva,
  updateGridCena,
  updateGridToken,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  GRID_CENAS_MAX,
  GRID_TOKENS_POR_CENA_MAX,
  dimensoesDoMundo,
  limitarPosicao,
  montarCena,
  montarToken,
  nomeDaCena,
  nomeDaCopia,
  primeiraCelulaLivre,
  validarToken,
} from 'common/utils/grid';
import useGridCampanha from 'hooks/useGridCampanha';
import GridMapa from 'components/Grid/GridMapa';
import ChatMestre from 'pages/Chat/ChatMestre';
import useFontesDaMesa from 'pages/Chat/useFontesDaMesa';
import AdicionarTokenDialog from './AdicionarTokenDialog';
import CenaDialog from './CenaDialog';
import CenasBarra from './CenasBarra';
import GridConfigPainel from './GridConfigPainel';
import TokenPainel from './TokenPainel';
import { jogadoresSemToken, tokensDeJogadoresFaltantes } from './gridMestre';
import useCenasDoGrid from './useCenasDoGrid';

const MAPAS_VAZIOS = { campanhaId: null, lista: [] };

/**
 * Grid (mapa tático) da Campanha ativa, em CENAS, compartilhado em tempo real
 * com os jogadores (site Ficha-RPG---Re-Dungeon-, rota /campanhas/:id/grid).
 * Cada cena tem imagem/grade e tokens próprios; o mestre abre e prepara
 * qualquer cena em segredo e escolhe a ATIVA ("Mostrar aos jogadores"), a
 * única que eles veem. Na cena aberta ele define imagem e grade, adiciona
 * tokens de jogadores/NPCs/Criaturas (ou avulsos), muda tamanho, oculta,
 * atribui a jogadores e move todos; os jogadores movem só os deles. Com o
 * chat da campanha ao lado (ChatMestre). Modelo em common/utils/grid.js,
 * escuta da cena em hooks/useGridCampanha.js, lista de cenas em
 * useCenasDoGrid.js.
 */
const Grid = () => {
  const { currentUser } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const { notifyError, notifySuccess } = useSnackbar();
  const navigate = useNavigate();
  const campanhaId = campanhaAtiva?.id ?? null;

  const fontes = useFontesDaMesa(campanhaAtiva, { incluirJogadores: true });
  const {
    cenas,
    cenaAtivaId,
    carregando: carregandoCenas,
    erro: erroCenas,
    limparErro: limparErroCenas,
  } = useCenasDoGrid(campanhaId);

  // Cena aberta pelo mestre: a escolhida, senão a ativa, senão a primeira.
  const [cenaEscolhidaId, setCenaEscolhidaId] = useState(null);
  const existe = id => Boolean(id) && cenas.some(cena => cena.id === id);
  let cenaAbertaId = cenas[0]?.id ?? null;
  if (existe(cenaEscolhidaId)) cenaAbertaId = cenaEscolhidaId;
  else if (existe(cenaAtivaId)) cenaAbertaId = cenaAtivaId;
  const cenaAberta = cenas.find(cena => cena.id === cenaAbertaId) ?? null;

  const grid = useGridCampanha(campanhaId, {
    uid: currentUser.uid,
    isMestre: true,
    ehMestreDaCampanha: true,
    cenaId: cenaAbertaId,
  });
  const { erro: erroGrid, limparErro: limparErroGrid } = grid;

  const [selecionadoId, setSelecionadoId] = useState(null);
  const [configAberta, setConfigAberta] = useState(false);
  const [previa, setPrevia] = useState(null);
  const [adicionarAberto, setAdicionarAberto] = useState(false);
  // { modo: 'nova' } | { modo: 'renomear', cena } | null
  const [cenaDialog, setCenaDialog] = useState(null);
  const [chatAberto, setChatAberto] = useState(true);
  const [imagemCarregada, setImagemCarregada] = useState(null);
  const [mapasCarregados, setMapasCarregados] = useState(MAPAS_VAZIOS);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  // Mapas da campanha (tela Mapas) com imagem — atalho para a imagem da cena.
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

  // Erros das escutas vão para o Snackbar global.
  useEffect(() => {
    if (!erroGrid) return;
    notifyError(erroGrid);
    limparErroGrid();
  }, [erroGrid, limparErroGrid, notifyError]);

  useEffect(() => {
    if (!erroCenas) return;
    notifyError(erroCenas);
    limparErroCenas();
  }, [erroCenas, limparErroCenas, notifyError]);

  const config = (configAberta && previa) || grid.config;
  const limites = dimensoesDoMundo(
    config,
    imagemCarregada?.url === config.imagemUrl ? imagemCarregada : null,
  );
  const selecionado =
    grid.tokens.find(token => token.id === selecionadoId) ?? null;
  const mapas =
    mapasCarregados.campanhaId === campanhaId ? mapasCarregados.lista : [];
  const jogadoresFaltando = useMemo(
    () => jogadoresSemToken(fontes.jogadores, grid.tokens).length,
    [fontes.jogadores, grid.tokens],
  );
  const podeCriarCena = cenas.length < GRID_CENAS_MAX;

  const tentar = async (acao, mensagemErro) => {
    try {
      return await acao();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(mensagemErro, error);
      notifyError(mensagemErro);
      return undefined;
    }
  };

  const fecharConfig = () => {
    setConfigAberta(false);
    setPrevia(null);
  };

  const abrirCena = cenaId => {
    setCenaEscolhidaId(cenaId);
    setSelecionadoId(null);
    fecharConfig();
  };

  // ── Cenas ──────────────────────────────────────────────────────────────
  const handleCriarCena = async ({ nome, imagemUrl, adicionarJogadores }) => {
    const cena = montarCena({ nome, imagemUrl });
    const tokens = adicionarJogadores
      ? tokensDeJogadoresFaltantes(
          fontes.jogadores,
          [],
          dimensoesDoMundo(cena, null),
        )
      : [];
    const id = await tentar(
      () => addGridCena(campanhaId, cena, tokens),
      'Não foi possível criar a cena.',
    );
    if (!id) return;
    setCenaDialog(null);
    abrirCena(id);
    notifySuccess(`Cena "${cena.nome}" criada.`);
  };

  const handleRenomearCena = async ({ nome }) => {
    const { cena } = cenaDialog;
    const ok = await tentar(
      () => updateGridCena(campanhaId, cena.id, { nome }).then(() => true),
      'Não foi possível renomear a cena.',
    );
    if (ok) setCenaDialog(null);
  };

  const handleDuplicarCena = async cena => {
    const id = await tentar(
      () => duplicarGridCena(campanhaId, cena.id, nomeDaCopia(cena.nome)),
      'Não foi possível duplicar a cena.',
    );
    if (!id) return;
    abrirCena(id);
    notifySuccess(`Cena "${nomeDaCena(cena)}" duplicada.`);
  };

  const handleApagarCena = async cena => {
    if (cena.id === cenaAtivaId) return;
    if (
      !window.confirm(
        `Apagar a cena "${nomeDaCena(cena)}" e todos os tokens dela?`,
      )
    ) {
      return;
    }
    const ok = await tentar(
      () => removeGridCena(campanhaId, cena.id).then(() => true),
      'Não foi possível apagar a cena.',
    );
    if (ok && cena.id === cenaAbertaId) abrirCena(null);
  };

  const handleMostrarCena = async cenaId => {
    const ok = await tentar(
      () => setGridCenaAtiva(campanhaId, cenaId).then(() => true),
      'Não foi possível trocar a cena dos jogadores.',
    );
    if (!ok) return;
    const cena = cenas.find(c => c.id === cenaId);
    notifySuccess(
      cena
        ? `Os jogadores agora veem "${nomeDaCena(cena)}".`
        : 'Nenhuma cena visível para os jogadores.',
    );
  };

  // ── Tokens da cena aberta ──────────────────────────────────────────────
  const gravarTokens = async (tokens, mensagemSucesso) => {
    if (grid.tokens.length + tokens.length > GRID_TOKENS_POR_CENA_MAX) {
      notifyError(`Cada cena comporta até ${GRID_TOKENS_POR_CENA_MAX} tokens.`);
      return false;
    }
    const ok = await tentar(
      () => addGridTokens(campanhaId, cenaAbertaId, tokens).then(() => true),
      'Não foi possível adicionar o token.',
    );
    if (ok) notifySuccess(mensagemSucesso);
    return Boolean(ok);
  };

  const handleAdicionar = async dados => {
    const posicao = primeiraCelulaLivre(grid.tokens, dados.tamanho, limites);
    const token = montarToken({ ...dados, ...posicao });
    const erro = validarToken(token);
    if (erro) {
      notifyError(erro);
      return false;
    }
    return gravarTokens([token], `${token.nome} entrou na cena.`);
  };

  const handleAdicionarJogadores = async () => {
    const tokens = tokensDeJogadoresFaltantes(
      fontes.jogadores,
      grid.tokens,
      limites,
    );
    if (tokens.length === 0) return;
    await gravarTokens(
      tokens,
      tokens.length === 1
        ? `${tokens[0].nome} entrou na cena.`
        : `${tokens.length} jogadores entraram na cena.`,
    );
  };

  const handleSalvarToken = async patch => {
    // Token que cresceu continua inteiro dentro do grid.
    const posicao = limitarPosicao(
      selecionado.col,
      selecionado.lin,
      limites,
      patch.tamanho,
    );
    const ok = await tentar(
      () =>
        updateGridToken(campanhaId, cenaAbertaId, selecionado.id, {
          ...patch,
          ...posicao,
        }).then(() => true),
      'Não foi possível salvar o token.',
    );
    if (ok) notifySuccess('Token atualizado.');
  };

  const handleRemoverToken = async () => {
    if (!window.confirm(`Remover "${selecionado.nome}" da cena?`)) return;
    const ok = await tentar(
      () =>
        removeGridToken(campanhaId, cenaAbertaId, selecionado.id).then(
          () => true,
        ),
      'Não foi possível remover o token.',
    );
    if (ok) setSelecionadoId(null);
  };

  const handleSalvarConfig = async novaConfig => {
    const ok = await tentar(
      () =>
        updateGridCena(campanhaId, cenaAbertaId, novaConfig).then(() => true),
      'Não foi possível salvar o grid.',
    );
    if (!ok) return;
    notifySuccess('Grid salvo.');
    fecharConfig();
  };

  if (!campanhaAtiva) return null;

  let aviso = null;
  if (carregandoCenas || (cenaAbertaId && grid.carregando)) {
    aviso = 'Carregando o grid…';
  } else if (cenas.length === 0) {
    aviso = 'Nenhuma cena ainda: crie a primeira em "Nova cena".';
  } else if (!config.imagemUrl && grid.tokens.length === 0) {
    aviso =
      'Cena vazia: em "Configurar grid" escolha a imagem e o tamanho das células, depois adicione tokens.';
  }
  const abertaEhAtiva = Boolean(cenaAbertaId) && cenaAbertaId === cenaAtivaId;

  return (
    <Box
      className="page-container"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        height: 'calc(100vh - 140px)',
        minHeight: 520,
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
        {cenaAberta &&
          (abertaEhAtiva ? (
            <Typography
              variant="body2"
              sx={{ color: 'var(--text-secondary)' }}
              role="status"
            >
              ▶ Os jogadores estão vendo esta cena
            </Typography>
          ) : (
            <Button
              variant="outlined"
              startIcon={<PlayArrowIcon />}
              onClick={() => handleMostrarCena(cenaAbertaId)}
            >
              Mostrar aos jogadores
            </Button>
          ))}
        <Button
          startIcon={<SettingsIcon />}
          onClick={() => {
            setPrevia(null);
            setConfigAberta(true);
          }}
          disabled={!cenaAberta || configAberta}
        >
          Configurar grid
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAdicionarAberto(true)}
          disabled={!cenaAberta}
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

      <CenasBarra
        cenas={cenas}
        cenaAbertaId={cenaAbertaId}
        cenaAtivaId={cenaAtivaId}
        podeCriar={podeCriarCena}
        onAbrir={abrirCena}
        onNova={() => setCenaDialog({ modo: 'nova' })}
        onMostrar={handleMostrarCena}
        onRenomear={cena => setCenaDialog({ modo: 'renomear', cena })}
        onDuplicar={handleDuplicarCena}
        onApagar={handleApagarCena}
      />

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
          {/* key: trocar de cena recomeça zoom/pan (mapa encaixado). */}
          <GridMapa
            key={cenaAbertaId ?? 'sem-cena'}
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
          {configAberta && cenaAberta && (
            <GridConfigPainel
              key={cenaAbertaId}
              config={grid.config}
              mapas={mapas}
              onPrevia={setPrevia}
              onSalvar={handleSalvarConfig}
              onFechar={fecharConfig}
            />
          )}
        </Box>

        {/* Sempre montado (só escondido): fechar o chat não corta a música
            da mesa nem as escutas do chat. */}
        <Box
          sx={{
            width: { xs: '100%', md: 380 },
            height: { xs: '45%', md: 'auto' },
            flexShrink: 0,
            minHeight: 0,
            display: chatAberto ? 'flex' : 'none',
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
      </Box>

      <AdicionarTokenDialog
        open={adicionarAberto}
        onClose={() => setAdicionarAberto(false)}
        fontes={fontes}
        onAdicionar={handleAdicionar}
        jogadoresFaltando={jogadoresFaltando}
        onAdicionarJogadores={handleAdicionarJogadores}
      />

      {cenaDialog && (
        <CenaDialog
          open
          titulo={cenaDialog.modo === 'nova' ? 'Nova cena' : 'Renomear cena'}
          nomeInicial={cenaDialog.cena?.nome ?? ''}
          mapas={cenaDialog.modo === 'nova' ? mapas : null}
          rotuloConfirmar={cenaDialog.modo === 'nova' ? 'Criar cena' : 'Salvar'}
          onConfirmar={
            cenaDialog.modo === 'nova' ? handleCriarCena : handleRenomearCena
          }
          onClose={() => setCenaDialog(null)}
        />
      )}
    </Box>
  );
};

export default Grid;
