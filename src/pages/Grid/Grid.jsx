import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GroupsIcon from '@mui/icons-material/Groups';
import StopIcon from '@mui/icons-material/Stop';
import SportsMartialArtsIcon from '@mui/icons-material/SportsMartialArts';
import SettingsIcon from '@mui/icons-material/Settings';
import BoltIcon from '@mui/icons-material/Bolt';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import useConfirmacao from 'components/ConfirmDialog/useConfirmacao';
import {
  addGridCena,
  addGridTokens,
  duplicarGridCena,
  getCondicoes,
  getRmMapasPorCampanha,
  removeGridCena,
  removeGridToken,
  removeGridTokensEmLote,
  setGridAvisarAcoesChat,
  setGridCenaAtiva,
  updateGridCena,
  updateGridToken,
  updateGridTokensEmLote,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import { ACOES_CAMADA, CAMADAS } from 'common/utils/gridCamadas';
import {
  GRID_CENAS_MAX,
  GRID_TOKENS_POR_CENA_MAX,
  dimensoesDoMundo,
  limitarPosicao,
  montarCena,
  corDoPing,
  nomeDaCena,
  nomeDaCopia,
  normalizarTravamento,
  validarToken,
} from 'common/utils/grid';
import useAvisarAcoesChat from 'hooks/useAvisarAcoesChat';
import useGridCampanha from 'hooks/useGridCampanha';
import useRolarDoToken from 'hooks/useRolarDoToken';
import { autorDoToken } from 'common/utils/gridRolagem';
import GridMapa from 'components/Grid/GridMapa';
import RolarDoTokenDialog from 'components/Grid/RolarDoTokenDialog';
import ChatMestre from 'pages/Chat/ChatMestre';
import { PERSONA_MESTRE, autorDaPersona } from 'pages/Chat/chatPersonas';
import useFontesDaMesa from 'pages/Chat/useFontesDaMesa';
import AcoesEmLote from './AcoesEmLote';
import AdicionarTokenDialog from './AdicionarTokenDialog';
import AtalhosDialog from './AtalhosDialog';
import CenaDialog from './CenaDialog';
import CenasBarra from './CenasBarra';
import FerramentasMapa from './FerramentasMapa';
import GridConfigPainel from './GridConfigPainel';
import IniciarCombateDialog from './IniciarCombateDialog';
import MarcadorDialog from './MarcadorDialog';
import ParticipantesCombateDialog from './ParticipantesCombateDialog';
import TokenPainel from './TokenPainel';
import {
  ACOES_ATALHO,
  FERRAMENTAS,
  OPCOES_FERRAMENTA_PADRAO,
  OPCOES_TRAVAMENTO,
  acaoDoAtalho,
  alternarSelecao,
  alvoEhDigitacao,
  copiaDoToken,
  haDialogoAberto,
  jogadoresSemToken,
  montarTokensEmLote,
  ocultoAlvoDosTokens,
  patchesDeCondicaoEmLote,
  patchesDeDanoEmLote,
  patchesDeOcultoEmLote,
  reacaoDoToken,
  tokensDeJogadoresFaltantes,
} from './gridMestre';
import useCombateMestre from './useCombateMestre';
import useCenasDoGrid from './useCenasDoGrid';

const MAPAS_VAZIOS = { campanhaId: null, lista: [] };
const SEM_CONDICOES = [];
const CONDICOES_VAZIAS = { universoId: null, lista: SEM_CONDICOES };
// O mestre vê (e edita) as áreas de todo mundo.
const podeEditarAreaMestre = () => true;
// O mestre rola por NPC/criatura/avulso; o token de jogador é do jogador.
const podeRolarTokenMestre = token => token.tipo !== 'jogador';
const SEM_GRUPOS_DE_ROLAGEM = [];
const SEM_SELECAO = [];

const plural = (n, singular, pluralTexto) => (n === 1 ? singular : pluralTexto);

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
  const avisarAcoesChat = useAvisarAcoesChat(campanhaId);

  // Cena aberta pelo mestre: a escolhida, senão a ativa, senão a primeira.
  const [cenaEscolhidaId, setCenaEscolhidaId] = useState(null);
  const existe = id => Boolean(id) && cenas.some(cena => cena.id === id);
  let cenaAbertaId = cenas[0]?.id ?? null;
  if (existe(cenaEscolhidaId)) cenaAbertaId = cenaEscolhidaId;
  else if (existe(cenaAtivaId)) cenaAbertaId = cenaAtivaId;
  const cenaAberta = cenas.find(cena => cena.id === cenaAbertaId) ?? null;

  // Catálogo de condições do universo (ícones/nomes nos tokens e no painel),
  // guardado com o universo a que pertence.
  const [condicoesCarregadas, setCondicoesCarregadas] =
    useState(CONDICOES_VAZIAS);
  const universoId = campanhaAtiva?.universoId ?? null;
  const catalogoCondicoes =
    condicoesCarregadas.universoId === universoId
      ? condicoesCarregadas.lista
      : SEM_CONDICOES;

  const autorMestre = useMemo(
    () => autorDaPersona(currentUser.uid, PERSONA_MESTRE),
    [currentUser.uid],
  );

  const grid = useGridCampanha(campanhaId, {
    uid: currentUser.uid,
    isMestre: true,
    ehMestreDaCampanha: true,
    cenaId: cenaAbertaId,
    // Nome no sinal do mapa; `mestreId` pinta o meu sinal de dourado.
    nome: 'Mestre',
    mestreId: currentUser.uid,
    catalogoCondicoes,
    // As mensagens de combate (Próximo/Anterior) saem como "Mestre".
    autorCombate: autorMestre,
  });
  const { erro: erroGrid, limparErro: limparErroGrid } = grid;

  const [selecionadoId, setSelecionadoId] = useState(null);
  // Seleção múltipla (Shift/Ctrl-clique): vazia ou com ≥ 2 tokens — com um só
  // vale `selecionadoId` (alternarSelecao em gridMestre.js).
  const [selecionadosIds, setSelecionadosIds] = useState(SEM_SELECAO);
  const [confirmar, dialogoConfirmacao] = useConfirmacao();
  const [configAberta, setConfigAberta] = useState(false);
  const [previa, setPrevia] = useState(null);
  const [adicionarAberto, setAdicionarAberto] = useState(false);
  // { modo: 'nova' } | { modo: 'renomear', cena } | null
  const [cenaDialog, setCenaDialog] = useState(null);
  const [iniciarAberto, setIniciarAberto] = useState(false);
  const [participantesAberto, setParticipantesAberto] = useState(false);
  const [chatAberto, setChatAberto] = useState(true);
  const [tokenRolando, setTokenRolando] = useState(null);
  const [atalhosAberto, setAtalhosAberto] = useState(false);
  // Ferramenta do mapa (Fase 3B) e suas opções; marcador em criação/edição:
  // { marcador } | { celula } | null.
  const [ferramenta, setFerramenta] = useState(FERRAMENTAS.MOVER);
  const [opcoesFerramenta, setOpcoesFerramenta] = useState(
    OPCOES_FERRAMENTA_PADRAO,
  );
  const [marcadorEditando, setMarcadorEditando] = useState(null);
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

  // Falha não é erro para o mestre: os tokens só ficam sem as condições.
  useEffect(() => {
    if (!universoId) return undefined;
    let active = true;
    getCondicoes(universoId)
      .then(lista => {
        if (!active) return;
        setCondicoesCarregadas({ universoId, lista: lista ?? SEM_CONDICOES });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao carregar o catálogo de condições:', error);
      });
    return () => {
      active = false;
    };
  }, [universoId]);

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
  const selecionadosTokens = useMemo(
    () => grid.tokens.filter(token => selecionadosIds.includes(token.id)),
    [grid.tokens, selecionadosIds],
  );
  const emLote = selecionadosTokens.length >= 2;

  const limparSelecao = useCallback(() => {
    setSelecionadoId(null);
    setSelecionadosIds(SEM_SELECAO);
  }, []);

  // Esc limpa a seleção (única ou múltipla).
  const temSelecao = Boolean(selecionadoId) || selecionadosIds.length > 0;
  useEffect(() => {
    if (!temSelecao) return undefined;
    const aoTeclar = event => {
      if (event.key === 'Escape' && !event.defaultPrevented) limparSelecao();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [temSelecao, limparSelecao]);

  const handleSelecionar = token => {
    setSelecionadoId(token?.id ?? null);
    setSelecionadosIds(SEM_SELECAO);
  };

  const handleAlternarSelecao = token => {
    const proxima = alternarSelecao(
      { selecionadoId, selecionadosIds },
      token.id,
    );
    setSelecionadoId(proxima.selecionadoId);
    setSelecionadosIds(
      proxima.selecionadosIds.length ? proxima.selecionadosIds : SEM_SELECAO,
    );
  };

  // "Rolar…" de um token: a rolagem sai no chat como o NPC/criatura (persona
  // do tipo), com o rótulo de onde veio. O mestre não tem opções prontas aqui
  // (as fichas de NPC não têm ataques/artes) — só a rolagem livre.
  const rolarDoToken = useRolarDoToken(campanhaId, { onErro: notifyError });
  const personasDaMesa = useMemo(
    () => [...fontes.npcs, ...fontes.criaturas],
    [fontes.npcs, fontes.criaturas],
  );
  const handleRolarDoToken = async (expressao, rotulo) => {
    const autor = autorDoToken(tokenRolando, {
      uid: currentUser.uid,
      mestre: true,
      personas: personasDaMesa,
    });
    return rolarDoToken({ autor, expressao, rotulo });
  };
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

  const combate = useCombateMestre({
    campanhaId,
    cenaId: cenaAbertaId,
    combate: grid.combate,
    tokens: grid.tokens,
    autor: autorMestre,
    tentar,
    notifySuccess,
  });
  const reacaoDoTokenDaMesa = token =>
    reacaoDoToken(token, { fichas: grid.fichas, fontes });

  const fecharConfig = () => {
    setConfigAberta(false);
    setPrevia(null);
  };

  const abrirCena = cenaId => {
    setCenaEscolhidaId(cenaId);
    limparSelecao();
    setMarcadorEditando(null);
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

  // `quantidade` > 1: cópias numeradas ("Goblin", "Goblin 2"…), cada uma
  // numa célula livre, gravadas num lote só.
  const handleAdicionar = async (dados, quantidade = 1) => {
    const tokens = montarTokensEmLote(dados, quantidade, grid.tokens, limites);
    const erro = tokens.map(validarToken).find(Boolean);
    if (erro) {
      notifyError(erro);
      return false;
    }
    return gravarTokens(
      tokens,
      tokens.length === 1
        ? `${tokens[0].nome} entrou na cena.`
        : `${tokens.length} tokens (${tokens[0].nome}…) entraram na cena.`,
    );
  };

  const handleDuplicarToken = async () => {
    if (!selecionado) return;
    const copia = copiaDoToken(selecionado, grid.tokens, limites);
    const erro = validarToken(copia);
    if (erro) {
      notifyError(erro);
      return;
    }
    await gravarTokens([copia], `${copia.nome} entrou na cena.`);
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

  // Combate (TokenCombate): grava na hora, sem aviso de sucesso.
  const handleAlterarToken = patch =>
    tentar(
      () =>
        updateGridToken(campanhaId, cenaAbertaId, selecionado.id, patch).then(
          () => true,
        ),
      'Não foi possível atualizar o token.',
    );

  const handleRemoverToken = async () => {
    if (!window.confirm(`Remover "${selecionado.nome}" da cena?`)) return;
    // Quem sai da cena sai também do combate (o último encerra o combate).
    if (grid.combate?.ordem.some(item => item.tokenId === selecionado.id)) {
      if (!(await combate.remover(selecionado.id))) return;
    }
    const ok = await tentar(
      () =>
        removeGridToken(campanhaId, cenaAbertaId, selecionado.id).then(
          () => true,
        ),
      'Não foi possível remover o token.',
    );
    if (ok) limparSelecao();
  };

  // ── Ações em lote (seleção múltipla) ───────────────────────────────────
  const gravarLote = async (patches, mensagemErro) => {
    if (patches.length === 0) {
      notifySuccess('Nenhum token precisava de mudança.');
      return false;
    }
    const ok = await tentar(
      () =>
        updateGridTokensEmLote(campanhaId, cenaAbertaId, patches).then(
          () => true,
        ),
      mensagemErro,
    );
    return Boolean(ok);
  };

  const handleDanoEmLote = async texto => {
    const { patches, jogadores, semPv } = patchesDeDanoEmLote(
      selecionadosTokens,
      texto,
    );
    if (patches.length === 0) {
      notifyError(
        'Nenhum PV mudou: use -N, +N ou N, em tokens com PV (jogadores ficam de fora).',
      );
      return false;
    }
    if (!(await gravarLote(patches, 'Não foi possível aplicar o dano.'))) {
      return false;
    }
    const fora = jogadores + semPv;
    const ignorados = fora
      ? ` (${fora} ${plural(fora, 'ignorado', 'ignorados')})`
      : '';
    notifySuccess(
      `PV alterado em ${patches.length} ${plural(patches.length, 'token', 'tokens')}${ignorados}.`,
    );
    return true;
  };

  const handleCondicaoEmLote = async (condicaoId, adicionar) => {
    const { patches, jogadores, cheios } = patchesDeCondicaoEmLote(
      selecionadosTokens,
      condicaoId,
      adicionar,
    );
    if (
      !(await gravarLote(patches, 'Não foi possível alterar as condições.'))
    ) {
      return;
    }
    const extras = [
      jogadores
        ? `${jogadores} ${plural(jogadores, 'jogador ignorado', 'jogadores ignorados')}`
        : '',
      cheios ? `${cheios} sem espaço para mais condições` : '',
    ].filter(Boolean);
    const acao = adicionar ? 'adicionada a' : 'removida de';
    notifySuccess(
      `Condição ${acao} ${patches.length} ${plural(patches.length, 'token', 'tokens')}${extras.length ? ` (${extras.join('; ')})` : ''}.`,
    );
  };

  const handleOcultoEmLote = async oculto => {
    const patches = patchesDeOcultoEmLote(selecionadosTokens, oculto);
    if (
      !(await gravarLote(patches, 'Não foi possível alterar a visibilidade.'))
    ) {
      return;
    }
    const estado = oculto ? 'ocultado' : 'revelado';
    notifySuccess(
      `${patches.length} ${plural(patches.length, 'token', 'tokens')} ${estado}${patches.length === 1 ? '' : 's'}.`,
    );
  };

  const handleAdicionarAoCombateEmLote = async () => {
    const entradas = selecionadosTokens
      .filter(
        token => !grid.combate?.ordem.some(item => item.tokenId === token.id),
      )
      .map(token => ({
        tokenId: token.id,
        reacao: reacaoDoTokenDaMesa(token) ?? 0,
      }));
    if (entradas.length === 0) {
      notifyError('Todos os tokens selecionados já estão no combate.');
      return;
    }
    const entraram = await combate.adicionarVarios(entradas);
    if (entraram > 0) {
      notifySuccess(
        `${entraram} ${plural(entraram, 'token entrou', 'tokens entraram')} no combate (iniciativa rolada).`,
      );
    }
  };

  const handleExcluirEmLote = async () => {
    const ids = selecionadosTokens.map(token => token.id);
    const noCombate =
      grid.combate?.ordem.filter(item => ids.includes(item.tokenId)).length ??
      0;
    const nomes = selecionadosTokens.map(token => token.nome).join(', ');
    const confirmado = await confirmar({
      titulo: `Excluir ${ids.length} tokens da cena?`,
      mensagem: `${nomes} sairão da cena.${noCombate ? ' Quem estiver no combate sai dele também.' : ''}`,
      confirmarTexto: 'Excluir',
    });
    if (!confirmado) return;
    // Quem sai da cena sai também do combate (se saírem todos, ele acaba).
    if (noCombate && !(await combate.removerVarios(ids))) return;
    const ok = await tentar(
      () =>
        removeGridTokensEmLote(campanhaId, cenaAbertaId, ids).then(() => true),
      'Não foi possível excluir os tokens.',
    );
    if (!ok) return;
    limparSelecao();
    notifySuccess(`${ids.length} tokens excluídos.`);
  };

  const handleTravamento = event =>
    tentar(
      () =>
        updateGridCena(campanhaId, cenaAbertaId, {
          travamento: event.target.value,
        }).then(() => true),
      'Não foi possível mudar o movimento da cena.',
    );

  // Ações da Central de Ações dos jogadores (no Grid, em combate) vão para o
  // chat? Opção da campanha (grid/atual), desligada por padrão.
  const handleAvisarAcoesChat = () =>
    tentar(
      () =>
        setGridAvisarAcoesChat(campanhaId, !avisarAcoesChat).then(() => true),
      'Não foi possível mudar o aviso de ações no chat.',
    );

  // ── Mapa: ferramentas, névoa, paredes e marcadores (Fase 3B) ───────────
  const handleFerramenta = nova => {
    setFerramenta(nova);
    limparSelecao();
  };

  // ── Atalhos de teclado ─────────────────────────────────────────────────
  // H: oculta o(s) selecionado(s); se todos já estão ocultos, revela.
  const handleOcultarSelecao = async () => {
    let alvos = [];
    if (emLote) alvos = selecionadosTokens;
    else if (selecionado) alvos = [selecionado];
    if (alvos.length === 0) return;
    const oculto = ocultoAlvoDosTokens(alvos);
    if (alvos.length >= 2) await handleOcultoEmLote(oculto);
    else await handleAlterarToken({ oculto });
  };

  const executarAtalho = ({ acao, ferramenta: nova }) => {
    switch (acao) {
      case ACOES_ATALHO.PROXIMO_TURNO:
        if (grid.combate) grid.mudarTurno(1);
        break;
      case ACOES_ATALHO.TURNO_ANTERIOR:
        if (grid.combate) grid.mudarTurno(-1);
        break;
      case ACOES_ATALHO.OCULTAR:
        handleOcultarSelecao();
        break;
      case ACOES_ATALHO.EXCLUIR:
        if (emLote) handleExcluirEmLote();
        else if (selecionado) handleRemoverToken();
        break;
      case ACOES_ATALHO.FERRAMENTA:
        if (cenaAberta && nova !== ferramenta) handleFerramenta(nova);
        break;
      case ACOES_ATALHO.AJUDA:
        setAtalhosAberto(true);
        break;
      default:
    }
  };
  // A escuta é registrada uma vez e chama sempre a versão mais recente.
  const atalhoRef = useRef(null);
  useEffect(() => {
    atalhoRef.current = executarAtalho;
  });
  useEffect(() => {
    const aoTeclar = event => {
      if (event.defaultPrevented) return;
      if (alvoEhDigitacao(event.target) || haDialogoAberto()) return;
      const atalho = acaoDoAtalho(event);
      if (!atalho) return;
      event.preventDefault();
      atalhoRef.current?.(atalho);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  const handleNevoaAtiva = ativa => grid.definirNevoaAtiva(ativa);

  const handlePreencherNevoa = async acao => {
    if (
      acao === ACOES_CAMADA.REMOVER &&
      !window.confirm('Cobrir todo o mapa com névoa?')
    ) {
      return;
    }
    await grid.preencherCamada(CAMADAS.NEVOA, acao, limites);
  };

  const handleLimparParedes = async () => {
    if (!window.confirm('Limpar todas as paredes desta cena?')) return;
    await grid.preencherCamada(CAMADAS.PAREDES, ACOES_CAMADA.REMOVER, limites);
  };

  const handleSalvarMarcador = async dados => {
    const { marcador, celula } = marcadorEditando;
    // Âncora (canto superior esquerdo) presa ao mapa para caber tamanho×tamanho.
    const ancora = limitarPosicao(
      (marcador ?? celula).col,
      (marcador ?? celula).lin,
      limites,
      dados.tamanho,
    );
    const ok = await tentar(
      async () =>
        marcador
          ? grid.salvarMarcador(marcador.id, { ...dados, ...ancora })
          : Boolean(await grid.criarMarcador({ ...dados, ...ancora })),
      'Não foi possível salvar o marcador.',
    );
    if (!ok) return;
    setMarcadorEditando(null);
    notifySuccess(marcador ? 'Marcador atualizado.' : 'Marcador criado.');
  };

  const handleApagarMarcador = async () => {
    const ok = await tentar(
      () => grid.apagarMarcador(marcadorEditando.marcador.id),
      'Não foi possível apagar o marcador.',
    );
    if (!ok) return;
    setMarcadorEditando(null);
    notifySuccess('Marcador apagado.');
  };

  const handleIniciarCombate = async participantes => {
    if (await combate.iniciar(participantes)) setIniciarAberto(false);
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
        <TextField
          select
          size="small"
          label="Movimento"
          value={normalizarTravamento(grid.travamento)}
          onChange={handleTravamento}
          disabled={!cenaAberta}
          sx={{ minWidth: 150 }}
        >
          {OPCOES_TRAVAMENTO.map(opcao => (
            <MenuItem key={opcao.value} value={opcao.value}>
              {opcao.label}
            </MenuItem>
          ))}
        </TextField>
        {grid.combate ? (
          <>
            <Button
              startIcon={<GroupsIcon />}
              onClick={() => setParticipantesAberto(true)}
            >
              Participantes
            </Button>
            <Button
              color="error"
              startIcon={<StopIcon />}
              onClick={() => combate.encerrar()}
            >
              Encerrar combate
            </Button>
          </>
        ) : (
          <Button
            startIcon={<SportsMartialArtsIcon />}
            onClick={() => setIniciarAberto(true)}
            disabled={!cenaAberta || grid.tokens.length === 0}
          >
            Iniciar combate
          </Button>
        )}
        <Button
          startIcon={<BoltIcon />}
          aria-pressed={avisarAcoesChat}
          onClick={handleAvisarAcoesChat}
          disabled={!campanhaId}
          title="Mostrar no chat as ações que os jogadores fazem pela Central de Ações durante o combate"
        >
          {avisarAcoesChat
            ? 'Ações no chat: ligado'
            : 'Ações no chat: desligado'}
        </Button>
        <Button
          startIcon={<KeyboardIcon />}
          onClick={() => setAtalhosAberto(true)}
          title="Atalhos do teclado (?)"
        >
          Atalhos
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
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <FerramentasMapa
            ferramenta={ferramenta}
            onFerramenta={handleFerramenta}
            opcoes={opcoesFerramenta}
            onOpcoes={setOpcoesFerramenta}
            nevoaAtiva={grid.camadas.nevoa.ativa}
            onNevoaAtiva={handleNevoaAtiva}
            onPreencherNevoa={handlePreencherNevoa}
            onLimparParedes={handleLimparParedes}
            desabilitado={!cenaAberta}
          />
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
              rastros={grid.rastrosAtivos}
              selecionadoId={selecionadoId}
              selecionadosIds={selecionadosIds}
              onSelecionar={handleSelecionar}
              onAlternarSelecao={handleAlternarSelecao}
              onImagemCarregada={setImagemCarregada}
              aviso={aviso}
              mestre
              onPing={grid.pingar}
              pings={grid.pings}
              detalhes={grid.detalhes}
              combate={grid.combate}
              travamento={grid.travamento}
              acoesCombate={{
                anterior: () => grid.mudarTurno(-1),
                proximo: () => grid.mudarTurno(1),
              }}
              ferramenta={ferramenta}
              opcoesFerramenta={opcoesFerramenta}
              camadas={grid.camadas}
              marcadores={grid.marcadores}
              desenhos={grid.desenhos}
              onEditarCamada={({ camada, acao, celulas }) =>
                grid.editarCamada(camada, acao, celulas, limites)
              }
              onCelulaMarcador={celula => setMarcadorEditando({ celula })}
              onMarcadorClique={marcador => setMarcadorEditando({ marcador })}
              onDesenhar={grid.desenhar}
              acoesDesenho={{
                apagarMeus: grid.apagarMeusDesenhos,
                apagarTodos: grid.apagarTodosDesenhos,
              }}
              areas={grid.areas}
              corAreaPadrao={corDoPing(currentUser.uid, currentUser.uid)}
              acoesAreas={grid.acoesAreas}
              podeEditarArea={podeEditarAreaMestre}
              podeRolarToken={podeRolarTokenMestre}
              onRolarToken={setTokenRolando}
            />
            {selecionado && ferramenta === FERRAMENTAS.MOVER && (
              <TokenPainel
                key={selecionado.id}
                token={selecionado}
                jogadores={fontes.jogadores}
                condicoes={catalogoCondicoes}
                detalhe={grid.detalhes[selecionado.id] ?? null}
                onSalvar={handleSalvarToken}
                onAlterar={handleAlterarToken}
                onRemover={handleRemoverToken}
                onDuplicar={handleDuplicarToken}
                onFechar={limparSelecao}
                onRolar={
                  podeRolarTokenMestre(selecionado)
                    ? () => setTokenRolando(selecionado)
                    : undefined
                }
                abaixoDaFaixa={Boolean(grid.combate)}
              />
            )}
            {emLote && ferramenta === FERRAMENTAS.MOVER && (
              <AcoesEmLote
                tokens={selecionadosTokens}
                condicoes={catalogoCondicoes}
                emCombate={Boolean(grid.combate)}
                onDano={handleDanoEmLote}
                onCondicao={handleCondicaoEmLote}
                onOculto={handleOcultoEmLote}
                onAdicionarAoCombate={handleAdicionarAoCombateEmLote}
                onExcluir={handleExcluirEmLote}
                onFechar={limparSelecao}
                abaixoDaFaixa={Boolean(grid.combate)}
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
                abaixoDaFaixa={Boolean(grid.combate)}
              />
            )}
          </Box>
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

      {dialogoConfirmacao}

      <AtalhosDialog
        open={atalhosAberto}
        onClose={() => setAtalhosAberto(false)}
      />

      <RolarDoTokenDialog
        open={Boolean(tokenRolando)}
        token={tokenRolando}
        grupos={SEM_GRUPOS_DE_ROLAGEM}
        onRolar={handleRolarDoToken}
        onClose={() => setTokenRolando(null)}
      />

      <AdicionarTokenDialog
        open={adicionarAberto}
        onClose={() => setAdicionarAberto(false)}
        fontes={fontes}
        onAdicionar={handleAdicionar}
        jogadoresFaltando={jogadoresFaltando}
        onAdicionarJogadores={handleAdicionarJogadores}
      />

      {iniciarAberto && (
        <IniciarCombateDialog
          open
          tokens={grid.tokens}
          reacaoDoToken={reacaoDoTokenDaMesa}
          onIniciar={handleIniciarCombate}
          onClose={() => setIniciarAberto(false)}
        />
      )}

      <ParticipantesCombateDialog
        open={participantesAberto && Boolean(grid.combate)}
        combate={grid.combate}
        tokens={grid.tokens}
        reacaoDoToken={reacaoDoTokenDaMesa}
        onMover={combate.mover}
        onRemover={combate.remover}
        onAdicionar={combate.adicionar}
        onClose={() => setParticipantesAberto(false)}
      />

      {marcadorEditando && (
        <MarcadorDialog
          key={marcadorEditando.marcador?.id ?? 'novo'}
          marcador={marcadorEditando.marcador ?? null}
          celula={marcadorEditando.celula ?? null}
          onSalvar={handleSalvarMarcador}
          onApagar={handleApagarMarcador}
          onClose={() => setMarcadorEditando(null)}
        />
      )}

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
