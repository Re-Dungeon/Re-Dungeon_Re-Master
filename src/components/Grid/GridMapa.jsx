import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CampaignIcon from '@mui/icons-material/Campaign';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import CloseIcon from '@mui/icons-material/Close';
import DrawIcon from '@mui/icons-material/Draw';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import StraightenIcon from '@mui/icons-material/Straighten';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
  PING_PRESSAO_MS,
  RASTRO_FADE_MS,
  TOQUE_DETALHE_MS,
  TRAVAMENTOS,
  areaDaAura,
  avancarCaminho,
  celulaMaisProxima,
  celulaNoPonto,
  centralizarVista,
  centroDaCelula,
  deslocamentoDoToken,
  dimensoesDoMundo,
  distanciaChebyshev,
  distanciaDoRastro,
  distanciaEntreTokens,
  escolherReferencia,
  formatarDistancia,
  limitarPosicao,
  linhaChebyshev,
  mesmaCelula,
  montarRastro,
  normalizarAura,
  ordenarTokens,
  posicaoEmPx,
  vistaFocadaNoToken,
} from 'common/utils/grid';
import {
  CORES_ALCANCE,
  distanciasDeMovimento,
  faixaDaDistancia,
  faixaDoCombate,
  faixasDoAlcance,
  origemDoAlcance,
  quadradosDeMovimento,
} from 'common/utils/gridCombate';

import {
  ACOES_CAMADA,
  CAMADAS,
  caminhoBloqueado,
  celulasDoPincel,
  celulasDoRetangulo,
  chaveDaCelula,
  filtrarTokensPelaNevoa,
} from 'common/utils/gridCamadas';
import {
  COR_DESENHO_PADRAO,
  DESENHO_BRUTOS_MAX,
  DESENHO_DISTANCIA_MIN_PX,
  ajustarTraco,
} from 'common/utils/gridDesenho';

import {
  AREA_FORMAS,
  CORES_AREA,
  ROTULOS_AREA,
  celulasDaArea,
  descreverAtingidos,
  rotuloDaArea,
  tokensAtingidos,
} from 'common/utils/gridAreas';

import AlcanceMovimento from './AlcanceMovimento';
import AreaPopover from './AreaPopover';
import AreaRotulos from './AreaRotulos';
import AreasGrid from './AreasGrid';
import CamadaAnotacoes from './CamadaAnotacoes';
import FaixaIniciativa from './FaixaIniciativa';
import MarcadorCartao from './MarcadorCartao';
import MarcadorPino from './MarcadorPino';
import NevoaCamada from './NevoaCamada';
import PaletaDesenho from './PaletaDesenho';
import ParedesCamada from './ParedesCamada';
import SinaisPing from './SinaisPing';
import TokenAcoes from './TokenAcoes';
import TokenDetalhe from './TokenDetalhe';
import TokenEstado from './TokenEstado';
import { ChipModoArea } from './stylesAcoes';
import {
  AuraArea,
  COR_TIPO_TOKEN,
  ChipTravamento,
  GridAviso,
  GridControles,
  GridGrade,
  GridImagem,
  GridMundo,
  GridRastros,
  GridViewport,
  RotuloDistancia,
  TokenCirculo,
  TokenFantasma,
  TokenNome,
  TokenOcultoIcone,
  TokenWrapper,
} from './styles';

// Mapa tático da campanha (cópia idêntica no Re:Master): imagem de fundo +
// grade desenhada pelo app + tokens posicionados em células. Zoom (roda do
// mouse, pinça, botões) e pan (arrastar o fundo) são locais de quem está
// vendo. Arrastar um token que `podeMover` aceita chama `onMover(token, col,
// lin, caminho)` uma vez, ao soltar, já na célula mais próxima — `caminho` =
// células atravessadas, da origem ao destino; com o token focado as setas
// movem uma célula. Clique sem arrastar chama `onSelecionar(token|null)`; com
// `onAlternarSelecao` (só o mestre passa), Shift/Ctrl/Cmd-clique num token chama
// `onAlternarSelecao(token)` em vez disso (seleção múltipla; `selecionadosIds`
// realça os escolhidos como o `selecionadoId`).
// Durante o arraste aparecem o fantasma na origem, o caminho e a distância
// (somada ao rastro ainda visível do token, como todos verão após soltar);
// `rastros` são os rastros dos últimos movimentos (useGridCampanha). Régua
// local (botão ou Shift+arrastar): mede de centro a centro, fica na tela até
// o próximo toque ou Esc.
// Fase 2: com `onPing`, segurar PING_PRESSAO_MS sem mover (mapa ou token; o
// mesmo LIMIAR_ARRASTE cancela) ou Alt+clique chama `onPing({ x, y, puxar })`
// (px do mundo); `puxar` só com `mestre` (botão "Puxar vista" ou
// Shift+Alt+clique). `pings` (useGridCampanha) são os anéis na tela; um de
// outra pessoa com `puxar` centraliza a vista (zoom mantido). `detalhes`
// ({ [tokenId]: { recursos, condicoes } }) desenha as barras e os ícones
// (TokenEstado) e o cartão do token no hover/toque (TokenDetalhe), com a
// distância borda a borda a partir do token de referência
// (escolherReferencia), que o botão "Seguir token" acompanha. `token.aura`
// pinta a área em volta do token. Tokens NÃO usam MUI Tooltip (o atraso de
// toque dele brigaria com a pressão longa).
// Fase 3A (combate): com `combate` (normalizarCombate), a faixa de iniciativa
// no topo (FaixaIniciativa — tocar num retrato centraliza nele; botões de
// `acoesCombate`, cada um só com a função), o anel pulsante no token da vez e,
// ao arrastar/tocar o próprio token (mestre: o selecionado), o alcance de
// movimento desde o início do turno (AlcanceMovimento) com o rótulo do
// arraste em verde/amarelo/vermelho. `travamento` ≠ 'livre' mostra um aviso ao
// jogador (quem decide se move é `podeMover`). `ehMeu` (padrão: podeMover)
// diz quais tokens são da pessoa (referência da distância, "Seguir token",
// foco do celular) mesmo com o movimento travado.
// Fase 3B (mapa): `camadas` ({ bloqueadas, nevoa }; useGridCampanha) — paredes
// (hachura; quem não é `mestre` não solta nem anda token por cima: "Há uma
// parede no caminho.") e névoa de guerra (cobre o mapa; quem não é `mestre`
// deixa de ver os tokens alheios cobertos — aura, rastro, cartão e faixa
// acompanham). `marcadores` = pinos (tocar abre o cartão); `desenhos` = traços
// livres de todos. Com `onDesenhar` há o botão "Desenhar" (um dedo/mouse traça;
// `acoesDesenho` = { apagarMeus, apagarTodos? } na paleta). `ferramenta`
// ('mover' | 'paredes' | 'nevoa' | 'marcadores'; só o mestre muda) troca o
// gesto: paredes/névoa pintam com `opcoesFerramenta` ({ forma, acao, tamanho
// }) e chamam `onEditarCamada({ camada, acao, celulas })` uma vez ao soltar;
// marcadores chamam `onCelulaMarcador(celula)` / `onMarcadorClique(marcador)`.
// Fase 3C (ações): `areas` (useGridCampanha; templates Raio/Linha/Cone/Quadrado
// de todos, sobre a névoa e sob os tokens) e `acoesAreas` ({ criar, atualizar,
// remover, removerTodas }; sem `criar` não há botão "Área"). "Área" arma o
// modo (popover: forma, metros, cor): arrastar no mapa posiciona (origem → alvo),
// Esc/✕ cancela; o chip de cada área mostra "Atinge: …" (os tokens que este
// mapa mostra) e, selecionado, a lixeira e as alças que movem/giram
// (`podeEditarArea(area)`). `corAreaPadrao` = cor inicial do popover.
// `podeRolarToken(token)` + `onRolarToken(token)` mostram "Rolar…" acima do
// token selecionado (com `onSelecionar`) ou tocado (sem ele), e a tecla R no
// token focado; quem abre o diálogo de rolagem é a página.
// Pinça também desloca (dois dedos); botão do meio do mouse arrasta o mapa em
// qualquer modo.

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4;
const ZOOM_PASSO = 1.25;
// Movimento mínimo (px de tela) para um clique virar arraste.
const LIMIAR_ARRASTE = 4;
const MARGEM_ENCAIXE = 24;

const SETAS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const limitarZoom = zoom => Math.min(Math.max(zoom, ZOOM_MIN), ZOOM_MAX);

// Vista com o mapa inteiro centralizado no viewport.
const encaixar = (mundo, viewport) => {
  if (!viewport.largura || !viewport.altura) return { x: 0, y: 0, zoom: 1 };
  const zoom = limitarZoom(
    Math.min(
      (viewport.largura - 2 * MARGEM_ENCAIXE) / mundo.largura,
      (viewport.altura - 2 * MARGEM_ENCAIXE) / mundo.altura,
      2,
    ),
  );
  return {
    zoom,
    x: (viewport.largura - mundo.largura * zoom) / 2,
    y: (viewport.altura - mundo.altura * zoom) / 2,
  };
};

// Zoom mantendo fixo o ponto (px, py) do viewport.
const zoomEmTorno = (vista, fator, px, py) => {
  const zoom = limitarZoom(vista.zoom * fator);
  const proporcao = zoom / vista.zoom;
  return { zoom, x: px - (px - vista.x) * proporcao, y: py - (py - vista.y) * proporcao };
};

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const SEM_RASTROS = [];
const SEM_PINGS = [];
const SEM_DETALHES = {};
const SEM_ACOES = {};
const SEM_MARCADORES = [];
const SEM_DESENHOS = [];
const SEM_AREAS = [];
const OPCOES_PADRAO = { forma: 'pincel', acao: ACOES_CAMADA.ADICIONAR, tamanho: 1 };
// Tempo do aviso local de parede e janela em que o click que sobra do toque
// num pino é ignorado (o toque já foi tratado no pointerup).
const AVISO_PAREDE_MS = 2500;
const TEXTO_PAREDE = 'Há uma parede no caminho.';
// Fora do componente: o lint do React Compiler (react-hooks/purity) acusa
// Date.now/Math.random chamados dentro dele, mesmo em handlers de evento.
const agora = () => Date.now();
const novoIdTraco = () => Date.now() + Math.random();
const CLIQUE_PINO_MS = 400;
const TEXTO_TRAVAMENTO = {
  [TRAVAMENTOS.CONGELADO]: 'Movimento congelado pelo mestre',
  [TRAVAMENTOS.TURNO]: 'Movimento só na sua vez',
};
// Folga (px de tela) entre o token e o cartão de detalhes.
const FOLGA_DETALHE = 6;
// Tempo (ms) que o cartão editável espera o mouse ir do token ao cartão.
const HOVER_CARTAO_MS = 250;
// Metade da largura máxima do cartão (centralizado no token): mantém ele
// dentro do viewport.
const MEIA_LARGURA_DETALHE = 120;
// O cartão editável (linhas com − / + ) é mais largo (max-width 290px).
const MEIA_LARGURA_DETALHE_EDITAVEL = 145;
// Folga (px de tela) entre o rótulo de distância e o topo do token.
const FOLGA_ROTULO = 6;
// Metade da largura do cartão do marcador (260px), para mantê-lo no viewport.
const MEIA_LARGURA_CARTAO_MARCADOR = 130;

const conteudoDoToken = token =>
  token.imagemUrl ? (
    <img src={token.imagemUrl} alt="" draggable={false} />
  ) : (
    (token.nome?.[0]?.toUpperCase() ?? '?')
  );

const SEM_SELECIONADOS = [];

// Shift/Ctrl/Cmd pressionado: o clique alterna o token na seleção múltipla.
const alternaSelecao = event => Boolean(event.shiftKey || event.ctrlKey || event.metaKey);

const corDoToken = token => COR_TIPO_TOKEN[token.tipo] ?? COR_TIPO_TOKEN.avulso;

const GridMapa = ({
  config,
  tokens: tokensProp,
  podeMover,
  onMover,
  selecionadoId = null,
  selecionadosIds = SEM_SELECIONADOS,
  onSelecionar,
  onAlternarSelecao,
  onImagemCarregada,
  aviso = null,
  rastros = SEM_RASTROS,
  mestre = false,
  onPing,
  pings = SEM_PINGS,
  detalhes = SEM_DETALHES,
  combate = null,
  acoesCombate = SEM_ACOES,
  travamento = TRAVAMENTOS.LIVRE,
  ehMeu: ehMeuToken,
  camadas = null,
  marcadores = SEM_MARCADORES,
  desenhos = SEM_DESENHOS,
  ferramenta = 'mover',
  opcoesFerramenta = OPCOES_PADRAO,
  onEditarCamada,
  onCelulaMarcador,
  onMarcadorClique,
  onDesenhar,
  acoesDesenho = SEM_ACOES,
  areas = SEM_AREAS,
  acoesAreas = SEM_ACOES,
  podeEditarArea,
  corAreaPadrao = CORES_AREA[0],
  podeRolarToken,
  podeEditarRecursos,
  onAlterarRecurso,
  onRolarToken,
}) => {
  const ehMeu = ehMeuToken ?? podeMover;
  const bloqueadas = camadas?.bloqueadas ?? null;
  const nevoa = camadas?.nevoa ?? null;
  // Névoa: quem não é mestre não recebe os tokens alheios cobertos; o resto do
  // mapa (aura, rastro, cartão, referência, faixa) parte desta lista.
  const tokens = useMemo(
    () => (mestre ? tokensProp : filtrarTokensPelaNevoa(tokensProp, nevoa, ehMeu)),
    [mestre, tokensProp, nevoa, ehMeu],
  );
  const viewportRef = useRef(null);
  const idPadrao = `grade-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [viewport, setViewport] = useState({ largura: 0, altura: 0 });
  const [imagem, setImagem] = useState({
    url: null,
    largura: 0,
    altura: 0,
    falhou: false,
  });
  // Zoom/pan feitos pelo usuário, ligados à imagem em que foram feitos —
  // sem vista manual (ou trocou a imagem) o mapa fica encaixado no viewport.
  // `suave`: vista movida pelo app (seguir/puxar), com transição.
  const [vistaManual, setVistaManual] = useState(null);
  // Token sendo arrastado: { tokenId, x, y, caminho } em px do mundo;
  // `soltando` (com col/lin) segura a posição final até o snapshot do
  // Firestore chegar. O caminho "oficial" fica em `gesto.current.caminho`.
  const [arraste, setArraste] = useState(null);
  // Régua: modo ligado pelo botão; `medicao` = { de, ate } (células).
  const [modoRegua, setModoRegua] = useState(false);
  const [medicao, setMedicao] = useState(null);
  // Desenho livre: modo ligado pelo botão, cor da paleta e o traço em curso
  // ({ id, cor, pontos }; fica até a gravação terminar).
  const [modoDesenho, setModoDesenho] = useState(false);
  const [corDesenho, setCorDesenho] = useState(COR_DESENHO_PADRAO);
  const [tracoAtual, setTracoAtual] = useState(null);
  // Prévia do pincel/retângulo de paredes e névoa ({ celulas: Set, acao });
  // fica até a gravação terminar.
  const [previa, setPrevia] = useState(null);
  // Áreas: modo armado ({ forma, metros, cor }), a prévia sob o dedo, a área
  // selecionada (alças), a edição em curso pelas alças ({ id, origem, alvo }) e
  // o botão que ancora o popover.
  const [modoArea, setModoArea] = useState(null);
  const [previaArea, setPreviaArea] = useState(null);
  const [areaSelId, setAreaSelId] = useState(null);
  const [edicaoArea, setEdicaoArea] = useState(null);
  const [popoverAreaEl, setPopoverAreaEl] = useState(null);
  // Token tocado cujas ações ("Rolar…") aparecem (sem `onSelecionar`).
  const [acaoId, setAcaoId] = useState(null);
  const [marcadorAbertoId, setMarcadorAbertoId] = useState(null);
  const [avisoParede, setAvisoParede] = useState(false);
  const fecharMarcador = useCallback(() => setMarcadorAbertoId(null), []);
  const ultimoToquePino = useRef(0);
  const modoDesenhoAtivo = Boolean(onDesenhar) && modoDesenho && ferramenta === 'mover';
  const modoAreaAtivo =
    Boolean(acoesAreas.criar) && modoArea !== null && ferramenta === 'mover';
  const gesto = useRef(null);
  const ponteiros = useRef(new Map());
  // Sinal: "Puxar vista" ligado (mestre) — o próximo sinal centraliza todos.
  const [modoPuxar, setModoPuxar] = useState(false);
  // "Seguir token": `seguido` = onde o token de referência estava quando a
  // vista foi centralizada nele (recentraliza quando muda).
  const [seguindo, setSeguindo] = useState(false);
  const [seguido, setSeguido] = useState(null);
  // Chave do último sinal de "puxar vista" já aplicado.
  const [puxadaAplicada, setPuxadaAplicada] = useState(null);
  // Último token que a pessoa moveu/tocou (referência da distância).
  const [referenciaId, setReferenciaId] = useState(null);
  // Cartão do token: sob o mouse (desktop) ou tocado (celular, por um tempo).
  const [hoverId, setHoverId] = useState(null);
  const [toqueId, setToqueId] = useState(null);
  // Cartão editável (dono): fica aberto enquanto o foco está dentro dele.
  const [cartaoFocadoId, setCartaoFocadoId] = useState(null);
  // Em combate, o jogador tocou o próprio token: mostra o alcance dele (até
  // tocar no mapa vazio ou Esc). O mestre usa o selecionado.
  const [alcanceId, setAlcanceId] = useState(null);
  // Timers da pressão longa e do cartão por toque.
  const temporizadores = useRef({
    pressao: null,
    toque: null,
    parede: null,
    hover: null,
  });
  // Celular (abaixo do `sm`): o mapa abre focado no primeiro token que a
  // pessoa pode mover, com célula ≥ 44px. A posição do foco é a do token
  // quando ele apareceu — mover o token depois não arrasta a vista junto.
  const celular = useMediaQuery('(max-width: 599.95px)');
  const [foco, setFoco] = useState(null);
  if (celular && !foco) {
    const meuToken = tokens.find(token => ehMeu(token));
    if (meuToken) {
      setFoco({ col: meuToken.col, lin: meuToken.lin, tamanho: meuToken.tamanho ?? 1 });
    }
  }

  const imagemAtual = imagem.url === config.imagemUrl ? imagem : null;
  const imagemCarregada =
    imagemAtual && !imagemAtual.falhou && imagemAtual.largura > 0 ? imagemAtual : null;
  const mundo = dimensoesDoMundo(config, imagemCarregada);
  const limites = { colunas: mundo.colunas, linhas: mundo.linhas };
  const camadaDaFerramenta =
    { paredes: CAMADAS.PAREDES, nevoa: CAMADAS.NEVOA }[ferramenta] ?? null;
  const pintando = Boolean(camadaDaFerramenta && onEditarCamada);
  const vistaEncaixada = encaixar(mundo, viewport);
  const vistaPadrao =
    celular && foco && viewport.largura
      ? vistaFocadaNoToken({
          config,
          token: foco,
          viewport,
          zoomEncaixe: vistaEncaixada.zoom,
          zoomMax: ZOOM_MAX,
        })
      : vistaEncaixada;
  const vista = vistaManual?.chave === config.imagemUrl ? vistaManual : vistaPadrao;
  const definirVista = novaVista =>
    setVistaManual({ ...novaVista, chave: config.imagemUrl, suave: false });

  // Token de referência (distância no cartão, "Seguir token"): o selecionado
  // (mestre), senão o último movido/tocado, senão o primeiro do jogador.
  const referencia = escolherReferencia(tokens, {
    selecionadoId: onSelecionar ? selecionadoId : null,
    ultimoId: referenciaId,
    mestre,
    podeMover: ehMeu,
  });
  // Puxar vista e seguir token mexem na vista durante o render, com guarda
  // (como o foco do celular): cada sinal é aplicado uma vez, e o seguir só
  // recentraliza quando o token sai de onde estava. Mapa sem tamanho (oculto
  // no celular) espera aparecer.
  const puxada = [...pings].reverse().find(ping => ping.puxar && !ping.proprio) ?? null;
  if (puxada && puxada.chave !== puxadaAplicada && viewport.largura > 0) {
    setPuxadaAplicada(puxada.chave);
    setSeguindo(false);
    setVistaManual({
      ...centralizarVista(vista, puxada, viewport),
      chave: config.imagemUrl,
      suave: true,
    });
  } else if (
    seguindo &&
    referencia &&
    viewport.largura > 0 &&
    !(
      seguido?.id === referencia.id &&
      seguido.col === referencia.col &&
      seguido.lin === referencia.lin &&
      seguido.chave === config.imagemUrl
    )
  ) {
    setSeguido({
      id: referencia.id,
      col: referencia.col,
      lin: referencia.lin,
      chave: config.imagemUrl,
    });
    setVistaManual({
      ...centralizarVista(
        vista,
        centroDaCelula(config, referencia.col, referencia.lin, referencia.tamanho ?? 1),
        viewport,
      ),
      chave: config.imagemUrl,
      suave: true,
    });
  }

  // A roda do mouse precisa de listener não-passivo (preventDefault) — lê a
  // vista atual por ref para registrar o listener uma vez só.
  const vistaRef = useRef(vista);
  const definirVistaRef = useRef(definirVista);
  useLayoutEffect(() => {
    vistaRef.current = vista;
    definirVistaRef.current = definirVista;
  });

  useEffect(() => {
    const elemento = viewportRef.current;
    if (!elemento) return undefined;
    const aoRolar = event => {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-chat-scroll-area]')
      ) {
        return;
      }
      event.preventDefault();
      const retangulo = elemento.getBoundingClientRect();
      const fator = event.deltaY < 0 ? ZOOM_PASSO : 1 / ZOOM_PASSO;
      definirVistaRef.current(
        zoomEmTorno(
          vistaRef.current,
          fator,
          event.clientX - retangulo.left,
          event.clientY - retangulo.top,
        ),
      );
    };
    elemento.addEventListener('wheel', aoRolar, { passive: false });
    if (typeof ResizeObserver === 'undefined')
      return () => elemento.removeEventListener('wheel', aoRolar);
    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setViewport(atual =>
        atual.largura === width && atual.altura === height
          ? atual
          : { largura: width, altura: height },
      );
    });
    observador.observe(elemento);
    return () => {
      elemento.removeEventListener('wheel', aoRolar);
      observador.disconnect();
    };
  }, []);

  // Esc desliga a régua (só escuta enquanto ela está em uso).
  const reguaAtiva = modoRegua || medicao !== null;
  useEffect(() => {
    if (!reguaAtiva) return undefined;
    const aoTeclar = event => {
      if (event.key !== 'Escape') return;
      if (gesto.current?.tipo === 'regua') gesto.current = null;
      setModoRegua(false);
      setMedicao(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [reguaAtiva]);

  // Esc sai do modo desenhar e cancela o traço/pincel em andamento.
  const escutaEsc = modoDesenho || tracoAtual !== null || previa !== null;
  useEffect(() => {
    if (!escutaEsc) return undefined;
    const aoTeclar = event => {
      if (event.key !== 'Escape') return;
      if (gesto.current?.tipo === 'desenho' || gesto.current?.tipo === 'pincel')
        gesto.current = null;
      setModoDesenho(false);
      setTracoAtual(null);
      setPrevia(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [escutaEsc]);

  // Esc esconde o alcance e as ações mostrados pelo toque.
  useEffect(() => {
    if (!alcanceId && !acaoId) return undefined;
    const aoTeclar = event => {
      if (event.key !== 'Escape') return;
      setAlcanceId(null);
      setAcaoId(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [alcanceId, acaoId]);

  // Esc fecha o cartão editável (tocado/focado) e tira o foco do campo.
  const cartaoFixo = toqueId !== null || cartaoFocadoId !== null;
  useEffect(() => {
    if (!cartaoFixo) return undefined;
    const aoTeclar = event => {
      if (event.key !== 'Escape') return;
      if (document.activeElement?.closest?.('[data-detalhe]'))
        document.activeElement.blur();
      setToqueId(null);
      setCartaoFocadoId(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [cartaoFixo]);

  // Esc desarma o modo Área, descarta a prévia e solta a área selecionada.
  const escutaEscArea = modoArea !== null || previaArea !== null || areaSelId !== null;
  useEffect(() => {
    if (!escutaEscArea) return undefined;
    const aoTeclar = event => {
      if (event.key !== 'Escape') return;
      if (gesto.current?.tipo === 'area' || gesto.current?.tipo === 'area-alca')
        gesto.current = null;
      setModoArea(null);
      setPreviaArea(null);
      setEdicaoArea(null);
      setAreaSelId(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [escutaEscArea]);

  useEffect(() => {
    const timers = temporizadores.current;
    return () => {
      clearTimeout(timers.pressao);
      clearTimeout(timers.toque);
      clearTimeout(timers.parede);
      clearTimeout(timers.hover);
    };
  }, []);

  const pontoNoViewport = event => {
    const retangulo = viewportRef.current.getBoundingClientRect();
    return { x: event.clientX - retangulo.left, y: event.clientY - retangulo.top };
  };

  // Ponto do viewport → célula que o contém (régua).
  const celulaNoViewport = ponto =>
    celulaNoPonto(
      config,
      (ponto.x - vista.x) / vista.zoom,
      (ponto.y - vista.y) / vista.zoom,
      mundo,
    );

  // Parede: só o mestre atravessa. Quem não é mestre vê o aviso local (some
  // sozinho) e o token volta à origem.
  const movimentoPermitido = (token, caminho) =>
    mestre || !bloqueadas || !caminhoBloqueado(caminho, token.tamanho ?? 1, bloqueadas);

  const mostrarAvisoParede = () => {
    clearTimeout(temporizadores.current.parede);
    setAvisoParede(true);
    temporizadores.current.parede = setTimeout(() => {
      temporizadores.current.parede = null;
      setAvisoParede(false);
    }, AVISO_PAREDE_MS);
  };

  const moverPara = (token, col, lin, caminho) => {
    if (col === token.col && lin === token.lin) return null;
    setReferenciaId(token.id);
    return Promise.resolve(onMover(token, col, lin, caminho));
  };

  const pontoNoMundo = ponto => ({
    x: (ponto.x - vista.x) / vista.zoom,
    y: (ponto.y - vista.y) / vista.zoom,
  });

  // Sinal no ponto (px do mundo); `atalho` = Shift+Alt. Puxar só o mestre, e
  // o modo "Puxar vista" vale para um sinal.
  const emitirPing = (ponto, atalho, puxarNoInicio = modoPuxar) => {
    const puxar = Boolean(mestre && (puxarNoInicio || atalho));
    const saiu = onPing({
      x: Math.round(Math.min(Math.max(ponto.x, 0), mundo.largura)),
      y: Math.round(Math.min(Math.max(ponto.y, 0), mundo.altura)),
      puxar,
    });
    // `false` = sinal recusado (1 por segundo): o modo continua ligado.
    if (puxar && saiu !== false) setModoPuxar(false);
  };

  const cancelarPressao = () => {
    clearTimeout(temporizadores.current.pressao);
    temporizadores.current.pressao = null;
  };

  // Pressão longa: se o gesto ainda não andou (nem virou pinça) quando o
  // tempo acaba, vira sinal — o arraste/pan/régua que estava começando para.
  const iniciarPressao = (ponto, puxarNoInicio) => {
    cancelarPressao();
    temporizadores.current.pressao = setTimeout(() => {
      temporizadores.current.pressao = null;
      const atual = gesto.current;
      if (!atual || atual.moveu || atual.tipo === 'pinca' || atual.tipo === 'ping')
        return;
      gesto.current = { tipo: 'ping' };
      setArraste(null);
      setPrevia(null);
      setTracoAtual(null);
      navigator.vibrate?.(30);
      emitirPing(ponto, false, puxarNoInicio);
    }, PING_PRESSAO_MS);
  };

  // Cartão com recursos editáveis (só o dono, quando a página liga a edição).
  const recursosEditaveis = token =>
    Boolean(
      onAlterarRecurso &&
      podeEditarRecursos?.(token) &&
      detalhes[token.id]?.recursos?.numeros,
    );

  // Cartão do token tocado (celular) por TOQUE_DETALHE_MS; null fecha. O
  // cartão editável fica fixo até tocar fora ou Esc.
  const mostrarToque = (tokenId, fixo = false) => {
    clearTimeout(temporizadores.current.toque);
    setToqueId(tokenId);
    temporizadores.current.toque =
      tokenId && !fixo ? setTimeout(() => setToqueId(null), TOQUE_DETALHE_MS) : null;
  };

  // Mouse: o cartão editável precisa sobreviver ao trajeto token → cartão.
  const soltarHover = tokenId => {
    clearTimeout(temporizadores.current.hover);
    temporizadores.current.hover = setTimeout(
      () => setHoverId(atual => (atual === tokenId ? null : atual)),
      HOVER_CARTAO_MS,
    );
  };

  // Alvo da área: raio não tem; sem arrastar (alvo = origem) aponta para o
  // vizinho (leste, ou oeste na borda).
  const alvoDaPrevia = (forma, origem, ate) => {
    if (forma === AREA_FORMAS.RAIO) return null;
    if (ate.col !== origem.col || ate.lin !== origem.lin) return ate;
    return {
      col: origem.col + 1 < mundo.colunas ? origem.col + 1 : Math.max(origem.col - 1, 0),
      lin: origem.lin,
    };
  };

  const iniciarAlca = (areaId, alca, event) => {
    const area = areasCalculadas.find(item => item.id === areaId);
    if (!area || !acoesAreas.atualizar || ponteiros.current.size > 0) return;
    const ponto = pontoNoViewport(event);
    ponteiros.current.set(event.pointerId, ponto);
    viewportRef.current.setPointerCapture?.(event.pointerId);
    cancelarPressao();
    gesto.current = {
      tipo: 'area-alca',
      id: area.id,
      alca,
      forma: area.forma,
      base: { origem: area.origem, alvo: area.alvoEfetivo },
      ate: alca === 'alvo' ? area.alvoEfetivo : area.origem,
      ponto,
      moveu: false,
      edicao: null,
    };
  };

  const handlePointerDown = event => {
    // Botão do meio do mouse arrasta o mapa em qualquer modo.
    const botaoDoMeio = event.pointerType === 'mouse' && event.button === 1;
    if (event.pointerType === 'mouse' && event.button !== 0 && !botaoDoMeio) return;
    ultimoToquePino.current = 0;
    const ponto = pontoNoViewport(event);
    ponteiros.current.set(event.pointerId, ponto);
    viewportRef.current.setPointerCapture?.(event.pointerId);

    if (ponteiros.current.size === 2) {
      cancelarPressao();
      const [a, b] = [...ponteiros.current.values()];
      // Pinça cancela a medição que estava começando.
      if (gesto.current?.tipo === 'regua') setMedicao(null);
      // Pinça também desloca: guarda o meio dos dedos no início.
      gesto.current = {
        tipo: 'pinca',
        distancia: distancia(a, b) || 1,
        meio: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        vista,
      };
      setArraste(null);
      // Traço, pincel e área em curso são descartados.
      setTracoAtual(null);
      setPrevia(null);
      setPreviaArea(null);
      setEdicaoArea(null);
      return;
    }
    if (botaoDoMeio) {
      event.preventDefault();
      gesto.current = {
        tipo: 'pan',
        token: null,
        ponto,
        vista,
        moveu: false,
        meio: true,
      };
      return;
    }
    // Alt+clique (desktop): sinal na hora — antes do Shift da régua, para
    // Shift+Alt puxar a vista em vez de medir.
    if (onPing && event.pointerType === 'mouse' && event.altKey) {
      emitirPing(pontoNoMundo(ponto), event.shiftKey);
      gesto.current = { tipo: 'ping' };
      return;
    }
    if (modoAreaAtivo) {
      // Posicionar a área: sem pressão longa; o arraste define o alvo.
      const origem = celulaNoViewport(ponto);
      gesto.current = { tipo: 'area', config: modoArea, origem, ate: origem, ponto };
      setPreviaArea({
        ...modoArea,
        origem,
        alvo: alvoDaPrevia(modoArea.forma, origem, origem),
      });
      return;
    }
    if (modoDesenhoAtivo) {
      // Um dedo/mouse desenha (tokens também); sem pressão longa.
      const inicioDoTraco = pontoNoMundo(ponto);
      gesto.current = {
        tipo: 'desenho',
        id: novoIdTraco(),
        cor: corDesenho,
        pontos: [inicioDoTraco],
      };
      setTracoAtual({
        id: gesto.current.id,
        cor: corDesenho,
        pontos: gesto.current.pontos,
      });
      return;
    }
    if (pintando) {
      const { forma, acao, tamanho } = opcoesFerramenta;
      const inicio = celulaNoViewport(ponto);
      const celulasIniciais =
        forma === 'retangulo' ? [inicio] : celulasDoPincel(inicio, tamanho, limites);
      gesto.current = {
        tipo: 'pincel',
        camada: camadaDaFerramenta,
        forma,
        acao,
        tamanho,
        inicio,
        ate: inicio,
        ultima: inicio,
        celulas: new Map(celulasIniciais.map(c => [chaveDaCelula(c.col, c.lin), c])),
        ponto,
        moveu: false,
      };
      setPrevia({
        acao,
        celulas: new Set(gesto.current.celulas.keys()),
      });
      if (onPing) iniciarPressao(pontoNoMundo(ponto), modoPuxar);
      return;
    }
    const tokenId = event.target.closest?.('[data-token-id]')?.dataset.tokenId;
    const token = tokenId ? (tokens.find(t => t.id === tokenId) ?? null) : null;
    const marcadorId = event.target.closest?.('[data-marcador-id]')?.dataset.marcadorId;
    if (token && ferramenta === 'mover' && podeMover(token)) {
      gesto.current = {
        tipo: 'token',
        token,
        ponto,
        inicio: posicaoEmPx(config, token.col, token.lin),
        caminho: [{ col: token.col, lin: token.lin }],
        moveu: false,
      };
    } else if (modoRegua || event.shiftKey) {
      const de = celulaNoViewport(ponto);
      gesto.current = { tipo: 'regua', token, ponto, de, ate: de, moveu: false };
    } else {
      gesto.current = {
        tipo: 'pan',
        token,
        ponto,
        vista,
        moveu: false,
        marcadorId: marcadorId ?? null,
        // Ferramenta Marcadores: tocar no vazio cria um marcador na célula.
        celulaMarcador:
          ferramenta === 'marcadores' && !token && !marcadorId
            ? celulaNoViewport(ponto)
            : null,
      };
    }
    if (onPing) iniciarPressao(pontoNoMundo(ponto), modoPuxar);
  };

  const posicaoArrastada = (atual, ponto) => ({
    x: atual.inicio.x + (ponto.x - atual.ponto.x) / vista.zoom,
    y: atual.inicio.y + (ponto.y - atual.ponto.y) / vista.zoom,
  });

  const handlePointerMove = event => {
    if (!ponteiros.current.has(event.pointerId)) return;
    const ponto = pontoNoViewport(event);
    ponteiros.current.set(event.pointerId, ponto);
    const atual = gesto.current;
    if (!atual || atual.tipo === 'ping') return;

    if (atual.tipo === 'pinca') {
      const [a, b] = [...ponteiros.current.values()];
      if (!b) return;
      // Zoom em torno do meio inicial + deslocamento do meio dos dedos.
      const base = zoomEmTorno(
        atual.vista,
        distancia(a, b) / atual.distancia,
        atual.meio.x,
        atual.meio.y,
      );
      definirVista({
        ...base,
        x: base.x + (a.x + b.x) / 2 - atual.meio.x,
        y: base.y + (a.y + b.y) / 2 - atual.meio.y,
      });
      return;
    }
    if (atual.tipo === 'desenho') {
      const novo = pontoNoMundo(ponto);
      const ultimo = atual.pontos[atual.pontos.length - 1];
      if (
        atual.pontos.length < DESENHO_BRUTOS_MAX &&
        Math.hypot(novo.x - ultimo.x, novo.y - ultimo.y) * vista.zoom >=
          DESENHO_DISTANCIA_MIN_PX
      ) {
        atual.pontos.push(novo);
        setTracoAtual({ id: atual.id, cor: atual.cor, pontos: atual.pontos });
      }
      return;
    }
    const dx = ponto.x - atual.ponto.x;
    const dy = ponto.y - atual.ponto.y;
    if (!atual.moveu && Math.hypot(dx, dy) < LIMIAR_ARRASTE) return;
    // Andou: não é mais pressão longa.
    if (!atual.moveu) cancelarPressao();
    atual.moveu = true;
    if (atual.tipo === 'pincel') {
      const celulaAtual = celulaNoViewport(ponto);
      if (atual.forma === 'retangulo') {
        if (mesmaCelula(celulaAtual, atual.ate)) return;
        atual.ate = celulaAtual;
        setPrevia({
          acao: atual.acao,
          celulas: new Set(
            celulasDoRetangulo(atual.inicio, celulaAtual, limites).map(c =>
              chaveDaCelula(c.col, c.lin),
            ),
          ),
        });
      } else if (!mesmaCelula(celulaAtual, atual.ultima)) {
        // O ponteiro pode pular células: preenche o salto.
        linhaChebyshev(atual.ultima, celulaAtual).forEach(passo =>
          celulasDoPincel(passo, atual.tamanho, limites).forEach(c =>
            atual.celulas.set(chaveDaCelula(c.col, c.lin), c),
          ),
        );
        atual.ultima = celulaAtual;
        setPrevia({ acao: atual.acao, celulas: new Set(atual.celulas.keys()) });
      }
      return;
    }
    if (atual.tipo === 'area') {
      const celulaAtual = celulaNoViewport(ponto);
      if (mesmaCelula(celulaAtual, atual.ate)) return;
      atual.ate = celulaAtual;
      setPreviaArea({
        ...atual.config,
        origem: atual.origem,
        alvo: alvoDaPrevia(atual.config.forma, atual.origem, celulaAtual),
      });
      return;
    }
    if (atual.tipo === 'area-alca') {
      const celulaAtual = celulaNoViewport(ponto);
      if (mesmaCelula(celulaAtual, atual.ate)) return;
      atual.ate = celulaAtual;
      const { origem, alvo } = atual.base;
      if (atual.alca === 'alvo') {
        atual.edicao = { origem, alvo: celulaAtual };
      } else {
        // A origem leva o alvo junto (a área só se desloca).
        const dc = celulaAtual.col - origem.col;
        const dl = celulaAtual.lin - origem.lin;
        atual.edicao = {
          origem: celulaAtual,
          alvo: alvo && {
            col: Math.min(Math.max(alvo.col + dc, 0), mundo.colunas - 1),
            lin: Math.min(Math.max(alvo.lin + dl, 0), mundo.linhas - 1),
          },
        };
      }
      setEdicaoArea({ id: atual.id, ...atual.edicao });
      return;
    }
    if (atual.tipo === 'token') {
      const posicao = posicaoArrastada(atual, ponto);
      // Mesmo snap do soltar: a célula onde o token cairia agora.
      const celulaAtual = celulaMaisProxima(
        config,
        posicao.x,
        posicao.y,
        mundo,
        atual.token.tamanho ?? 1,
      );
      atual.caminho = avancarCaminho(atual.caminho, celulaAtual);
      setArraste({ tokenId: atual.token.id, ...posicao, caminho: atual.caminho });
    } else if (atual.tipo === 'regua') {
      const ate = celulaNoViewport(ponto);
      atual.ate = ate;
      setMedicao(anterior =>
        anterior && mesmaCelula(anterior.de, atual.de) && mesmaCelula(anterior.ate, ate)
          ? anterior
          : { de: atual.de, ate },
      );
    } else {
      // Arrastar o mapa desliga o "Seguir token" (pinça e roda não).
      setSeguindo(false);
      definirVista({ ...atual.vista, x: atual.vista.x + dx, y: atual.vista.y + dy });
    }
  };

  const encerrarGesto = (event, cancelado) => {
    if (!ponteiros.current.delete(event.pointerId)) return;
    cancelarPressao();
    const atual = gesto.current;
    gesto.current = null;
    // Sinal já emitido: soltar não seleciona nem limpa a régua.
    if (!atual || atual.tipo === 'pinca' || atual.tipo === 'ping') return;

    if (atual.tipo === 'desenho') {
      const pontos = cancelado ? [] : ajustarTraco(atual.pontos, { zoom: vista.zoom });
      if (pontos.length === 0) {
        setTracoAtual(null);
        return;
      }
      // Uma escrita por traço; o traço fica na tela até a gravação terminar.
      const limpar = () =>
        setTracoAtual(anterior => (anterior?.id === atual.id ? null : anterior));
      Promise.resolve(onDesenhar({ cor: atual.cor, pontos })).then(limpar, limpar);
      return;
    }
    if (atual.tipo === 'area') {
      if (cancelado) {
        setPreviaArea(null);
        return;
      }
      const { forma, metros, cor } = atual.config;
      const alvo = alvoDaPrevia(forma, atual.origem, atual.ate);
      setModoArea(null);
      const limpar = () => setPreviaArea(null);
      Promise.resolve(
        acoesAreas.criar({
          forma,
          origem: atual.origem,
          ...(alvo ? { alvo } : {}),
          metros,
          cor,
        }),
      ).then(limpar, limpar);
      return;
    }
    if (atual.tipo === 'area-alca') {
      if (cancelado || !atual.edicao) {
        setEdicaoArea(null);
        return;
      }
      const { origem, alvo } = atual.edicao;
      const limpar = () =>
        setEdicaoArea(anterior => (anterior?.id === atual.id ? null : anterior));
      Promise.resolve(
        acoesAreas.atualizar(
          atual.id,
          atual.forma === AREA_FORMAS.RAIO ? { origem } : { origem, alvo },
        ),
      ).then(limpar, limpar);
      return;
    }
    if (atual.tipo === 'pincel') {
      if (cancelado) {
        setPrevia(null);
        return;
      }
      const celulas =
        atual.forma === 'retangulo'
          ? celulasDoRetangulo(atual.inicio, atual.ate, limites)
          : Array.from(atual.celulas.values());
      const final = {
        acao: atual.acao,
        celulas: new Set(celulas.map(c => chaveDaCelula(c.col, c.lin))),
      };
      setPrevia(final);
      const limpar = () => setPrevia(anterior => (anterior === final ? null : anterior));
      Promise.resolve(
        onEditarCamada({ camada: atual.camada, acao: atual.acao, celulas }),
      ).then(limpar, limpar);
      return;
    }
    if (atual.meio) {
      setArraste(null);
      return;
    }

    if (atual.tipo === 'token' && atual.moveu) {
      const { token } = atual;
      const solto = posicaoArrastada(atual, pontoNoViewport(event));
      const { col, lin } = celulaMaisProxima(
        config,
        solto.x,
        solto.y,
        mundo,
        token.tamanho ?? 1,
      );
      const caminho = avancarCaminho(atual.caminho, { col, lin });
      const mudouDeCelula = col !== token.col || lin !== token.lin;
      if (!cancelado && mudouDeCelula && !movimentoPermitido(token, caminho)) {
        setArraste(null);
        mostrarAvisoParede();
        return;
      }
      const gravacao = cancelado ? null : moverPara(token, col, lin, caminho);
      if (!gravacao) {
        setArraste(null);
        return;
      }
      setArraste({
        tokenId: token.id,
        ...posicaoEmPx(config, col, lin),
        col,
        lin,
        soltando: true,
      });
      gravacao.finally(() =>
        setArraste(anterior =>
          anterior?.tokenId === token.id && anterior.soltando ? null : anterior,
        ),
      );
      return;
    }
    setArraste(null);
    // Medição feita fica na tela (até o próximo toque ou Esc).
    if (atual.moveu || cancelado) return;
    setMedicao(null);
    // Tocar num pino abre o cartão (ferramenta Marcadores: edita); tocar no
    // vazio fecha o cartão (ferramenta Marcadores: cria na célula).
    const pino = atual.marcadorId
      ? (marcadores.find(m => m.id === atual.marcadorId) ?? null)
      : null;
    if (pino) {
      ultimoToquePino.current = agora();
      if (ferramenta === 'marcadores') onMarcadorClique?.(pino);
      else setMarcadorAbertoId(pino.id);
      return;
    }
    setMarcadorAbertoId(null);
    setAreaSelId(null);
    if (atual.celulaMarcador) {
      onCelulaMarcador?.(atual.celulaMarcador);
      return;
    }
    // Sem seleção própria (jogador): tocar num token rolável mostra "Rolar…".
    if (!onSelecionar && onRolarToken) {
      setAcaoId(atual.token && podeRolarToken?.(atual.token) ? atual.token.id : null);
    }
    if (atual.token && ehMeu(atual.token)) setReferenciaId(atual.token.id);
    // Em combate: tocar o próprio token mostra o alcance; o mapa vazio esconde.
    if (combate && !onSelecionar) {
      setAlcanceId(atual.token && podeMover(atual.token) ? atual.token.id : null);
    }
    // Celular: tocar mostra o cartão do token (tocar fora fecha).
    if (event.pointerType !== 'mouse') {
      mostrarToque(
        atual.token?.id ?? null,
        Boolean(atual.token && recursosEditaveis(atual.token)),
      );
    }
    if (onAlternarSelecao && atual.token && alternaSelecao(event)) {
      onAlternarSelecao(atual.token);
      return;
    }
    onSelecionar?.(atual.token);
  };

  const handleTokenKeyDown = (event, token) => {
    const seta = SETAS[event.key];
    if (seta && podeMover(token)) {
      event.preventDefault();
      const destino = limitarPosicao(
        token.col + seta[0],
        token.lin + seta[1],
        mundo,
        token.tamanho ?? 1,
      );
      const caminho = [
        { col: token.col, lin: token.lin },
        { col: destino.col, lin: destino.lin },
      ];
      const mudouDeCelula = destino.col !== token.col || destino.lin !== token.lin;
      if (mudouDeCelula && !movimentoPermitido(token, caminho)) {
        mostrarAvisoParede();
        return;
      }
      moverPara(token, destino.col, destino.lin, caminho);
    } else if (
      (event.key === 'r' || event.key === 'R') &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      onRolarToken &&
      podeRolarToken?.(token)
    ) {
      event.preventDefault();
      onRolarToken(token);
    } else if ((event.key === 'Enter' || event.key === ' ') && onSelecionar) {
      event.preventDefault();
      if (onAlternarSelecao && alternaSelecao(event)) onAlternarSelecao(token);
      else onSelecionar(token);
    }
  };

  // Enter/Espaço no pino (o toque já foi tratado no pointerup).
  const aoAtivarPino = marcador => {
    if (agora() - ultimoToquePino.current < CLIQUE_PINO_MS) return;
    if (ferramenta === 'marcadores') onMarcadorClique?.(marcador);
    else setMarcadorAbertoId(marcador.id);
  };

  const zoomPeloBotao = fator =>
    definirVista(zoomEmTorno(vista, fator, viewport.largura / 2, viewport.altura / 2));

  const { celula, deslocamentoX, deslocamentoY, metrosPorQuadrado } = config;
  const avisoImagem =
    imagemAtual?.falhou &&
    'Não foi possível carregar a imagem do grid — confira o link com o mestre.';

  // ── Rastros, caminho do arraste e régua ──
  const tokensPorId = new Map(tokens.map(token => [token.id, token]));
  const rastrosVisiveis = rastros
    .map(rastro => ({ rastro, token: tokensPorId.get(rastro.tokenId) }))
    .filter(({ rastro, token }) => token && rastro.pontos?.length >= 2);
  const tokenArrastado =
    arraste && !arraste.soltando ? (tokensPorId.get(arraste.tokenId) ?? null) : null;
  const caminhoArraste = tokenArrastado ? (arraste.caminho ?? null) : null;
  // Distância do arraste = total encadeado ao rastro ainda visível do token
  // (o mesmo que todos verão depois de soltar).
  const quadradosArraste = caminhoArraste
    ? distanciaDoRastro(
        montarRastro(
          rastros.find(rastro => rastro.tokenId === tokenArrastado.id)?.pontos ?? null,
          caminhoArraste,
        ),
      )
    : 0;

  // ── Combate: faixa, alcance de movimento e rótulo do arraste ──
  const faixa = combate ? faixaDoCombate(combate, tokens, { veTudo: mestre }) : null;
  const idDoAlcance = onSelecionar ? selecionadoId : alcanceId;
  const tokenDoAlcance =
    tokenArrastado ?? (idDoAlcance ? (tokensPorId.get(idDoAlcance) ?? null) : null);
  const alvoAlcance =
    combate && tokenDoAlcance && podeMover(tokenDoAlcance) ? tokenDoAlcance : null;
  const origemAlcance = alvoAlcance ? origemDoAlcance(alvoAlcance, combate) : null;
  const quadradosAlcance = alvoAlcance
    ? quadradosDeMovimento(
        deslocamentoDoToken(alvoAlcance),
        metrosPorQuadrado,
        config.multiplicadorCorrida,
      )
    : null;
  // Chave primitiva: o BFS só roda de novo quando origem/tamanho/alcance/mundo
  // mudam (não a cada pointermove).
  const chaveAlcance = alvoAlcance
    ? [
        origemAlcance.col,
        origemAlcance.lin,
        alvoAlcance.tamanho ?? 1,
        quadradosAlcance.mover,
        quadradosAlcance.correr,
        mundo.colunas,
        mundo.linhas,
      ].join(',')
    : null;
  const alcance = useMemo(() => {
    if (!chaveAlcance) return null;
    const [col, lin, tamanho, mover, correr, colunas, linhas] = chaveAlcance
      .split(',')
      .map(Number);
    const distancias = distanciasDeMovimento({
      origem: { col, lin },
      tamanho,
      alcance: correr,
      limites: { colunas, linhas },
      // O mestre ignora as paredes.
      bloqueadas: mestre ? null : bloqueadas,
    });
    return {
      distancias,
      faixas: faixasDoAlcance(distancias, { mover, correr, tamanho }),
    };
  }, [chaveAlcance, mestre, bloqueadas]);
  // Rótulo do arraste: em combate, a distância desde o início do turno na cor
  // do alcance; fora, o total encadeado ao rastro (como todos verão).
  let rotuloArraste = null;
  if (caminhoArraste && alcance && alvoAlcance?.id === tokenArrastado.id) {
    const destino = caminhoArraste[caminhoArraste.length - 1];
    const passos =
      alcance.distancias.get(`${destino.col},${destino.lin}`) ??
      distanciaChebyshev(origemAlcance, destino);
    if (caminhoArraste.length >= 2 || passos > 0) {
      const faixaArraste = faixaDaDistancia(passos, quadradosAlcance);
      rotuloArraste = {
        texto: formatarDistancia(passos, metrosPorQuadrado),
        cor: CORES_ALCANCE[faixaArraste],
        faixa: faixaArraste,
      };
    }
  } else if (quadradosArraste > 0) {
    rotuloArraste = {
      texto: formatarDistancia(quadradosArraste, metrosPorQuadrado),
      cor: corDoToken(tokenArrastado),
      faixa: null,
    };
  }

  // Arrastando por cima de uma parede: o rótulo avisa (o token voltará).
  if (
    caminhoArraste &&
    !mestre &&
    bloqueadas &&
    caminhoBloqueado(caminhoArraste, tokenArrastado.tamanho ?? 1, bloqueadas)
  ) {
    rotuloArraste = {
      texto: 'Parede no caminho',
      cor: CORES_ALCANCE.alem,
      faixa: 'bloqueado',
    };
  }

  // ── Áreas: células, "Atinge" (mesmos tokens que o mapa mostra) e prévia ──
  const colunasMundo = mundo.colunas;
  const linhasMundo = mundo.linhas;
  const areasCalculadas = areas.map(area => {
    const editada = edicaoArea?.id === area.id ? { ...area, ...edicaoArea } : area;
    const celulasDaEditada = celulasDaArea(editada, metrosPorQuadrado, {
      colunas: colunasMundo,
      linhas: linhasMundo,
    });
    const { origem } = editada;
    return {
      ...editada,
      celulas: celulasDaEditada,
      atingidos: descreverAtingidos(tokensAtingidos(celulasDaEditada, tokens), {
        veTudo: mestre,
      }),
      alvoEfetivo:
        editada.forma === AREA_FORMAS.RAIO
          ? null
          : (editada.alvo ?? {
              col:
                origem.col + 1 < colunasMundo
                  ? origem.col + 1
                  : Math.max(origem.col - 1, 0),
              lin: origem.lin,
            }),
    };
  });
  const areaPrevia = previaArea
    ? {
        ...previaArea,
        id: 'previa',
        celulas: celulasDaArea(previaArea, metrosPorQuadrado, {
          colunas: colunasMundo,
          linhas: linhasMundo,
        }),
      }
    : null;
  const celulaNoViewportPx = alvoCelula => {
    const centro = centroDaCelula(config, alvoCelula.col, alvoCelula.lin);
    return {
      left: vista.x + centro.x * vista.zoom,
      top: vista.y + centro.y * vista.zoom,
    };
  };
  const rotulosDasAreas = areasCalculadas.map(area => ({
    ...area,
    rotulo: rotuloDaArea(area, metrosPorQuadrado),
    autorNome: area.nome || undefined,
    podeEditar: Boolean(podeEditarArea?.(area)),
  }));

  // Token com "Rolar…": o selecionado (mestre) ou o tocado (jogador).
  const idDaAcao = onSelecionar ? selecionadoId : acaoId;
  const tokenDaAcao =
    onRolarToken && podeRolarToken && idDaAcao && !tokenArrastado
      ? (tokensPorId.get(idDaAcao) ?? null)
      : null;

  // Retrato da faixa: centraliza a vista no token (zoom mantido).
  const centralizarNoToken = tokenId => {
    const token = tokensPorId.get(tokenId);
    if (!token || !viewport.largura) return;
    setSeguindo(false);
    setVistaManual({
      ...centralizarVista(
        vista,
        centroDaCelula(config, token.col, token.lin, token.tamanho ?? 1),
        viewport,
      ),
      chave: config.imagemUrl,
      suave: true,
    });
  };
  // Traço e tracejado com espessura constante na tela (o mundo é escalado
  // por CSS; não dá para confiar em vector-effect no tracejado).
  const traco = 3 / vista.zoom;
  const tracejado = `${10 / vista.zoom} ${7 / vista.zoom}`;
  const pontosSvg = (pontos, tamanho) =>
    pontos
      .map(({ col, lin }) => {
        const centro = centroDaCelula(config, col, lin, tamanho);
        return `${centro.x},${centro.y}`;
      })
      .join(' ');
  const linhaTracejada = (pontos, tamanho, cor) => {
    const pontosDaLinha = pontosSvg(pontos, tamanho);
    const inicio = centroDaCelula(config, pontos[0].col, pontos[0].lin, tamanho);
    return (
      <>
        <polyline
          points={pontosDaLinha}
          fill="none"
          stroke="rgba(0, 0, 0, 0.55)"
          strokeWidth={traco * 1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={pontosDaLinha}
          fill="none"
          stroke={cor}
          strokeWidth={traco}
          strokeDasharray={tracejado}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={inicio.x} cy={inicio.y} r={traco * 1.5} fill={cor} />
      </>
    );
  };
  // Rótulo acima de um "token" de `tamanho` com canto (px do mundo) x/y → px
  // do viewport.
  const posicaoDoRotulo = (x, y, tamanho) => ({
    left: vista.x + (x + (tamanho * celula) / 2) * vista.zoom,
    top: vista.y + y * vista.zoom - FOLGA_ROTULO,
  });
  const medicaoDe = medicao && centroDaCelula(config, medicao.de.col, medicao.de.lin);
  const medicaoAte = medicao && centroDaCelula(config, medicao.ate.col, medicao.ate.lin);

  // ── Auras e cartão do token ──
  const auras = tokens
    .map(token => ({ token, aura: normalizarAura(token.aura) }))
    .filter(({ aura }) => aura);
  // Cartão: token tocado (celular) ou sob o mouse; some durante o arraste.
  const alvoId = tokenArrastado ? null : (toqueId ?? hoverId ?? cartaoFocadoId);
  const alvo = alvoId ? (tokensPorId.get(alvoId) ?? null) : null;
  let cartao = null;
  if (alvo) {
    const canto = posicaoEmPx(config, alvo.col, alvo.lin);
    const lado = (alvo.tamanho ?? 1) * celula;
    // Abaixo do token e do nome dele (o nome fica sob o círculo).
    const alturaNome = Math.max(10, celula * 0.24) * 1.4;
    const centro = vista.x + (canto.x + lado / 2) * vista.zoom;
    const meiaLargura = recursosEditaveis(alvo)
      ? MEIA_LARGURA_DETALHE_EDITAVEL
      : MEIA_LARGURA_DETALHE;
    const limite = viewport.largura - meiaLargura;
    const quadrados =
      referencia && referencia.id !== alvo.id
        ? distanciaEntreTokens(referencia, alvo)
        : null;
    cartao = {
      token: alvo,
      distancia:
        quadrados === null
          ? null
          : `${formatarDistancia(quadrados, metrosPorQuadrado)} de ${referencia.nome}`,
      style: {
        left:
          limite > meiaLargura ? Math.min(Math.max(centro, meiaLargura), limite) : centro,
        top: vista.y + (canto.y + lado + alturaNome) * vista.zoom + FOLGA_DETALHE,
      },
    };
  }

  // Cartão do marcador aberto (px do viewport, acima do pino).
  const marcadorAberto = marcadorAbertoId
    ? (marcadores.find(m => m.id === marcadorAbertoId) ?? null)
    : null;
  let posicaoCartaoMarcador = null;
  if (marcadorAberto) {
    const canto = posicaoEmPx(config, marcadorAberto.col, marcadorAberto.lin);
    const centro =
      vista.x + (canto.x + (celula * (marcadorAberto.tamanho ?? 1)) / 2) * vista.zoom;
    const limiteDireito = viewport.largura - MEIA_LARGURA_CARTAO_MARCADOR;
    posicaoCartaoMarcador = {
      left:
        limiteDireito > MEIA_LARGURA_CARTAO_MARCADOR
          ? Math.min(Math.max(centro, MEIA_LARGURA_CARTAO_MARCADOR), limiteDireito)
          : centro,
      top: vista.y + (canto.y + celula * 0.2) * vista.zoom - FOLGA_DETALHE,
    };
  }

  return (
    <GridViewport
      ref={viewportRef}
      role="application"
      aria-label="Grid da campanha"
      $regua={modoRegua || modoDesenhoAtivo || pintando || modoAreaAtivo}
      // Segurar = sinal: sem o menu de contexto do navegador.
      onContextMenu={event => event.preventDefault()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={event => encerrarGesto(event, false)}
      onPointerCancel={event => encerrarGesto(event, true)}
    >
      <GridMundo
        style={{
          width: mundo.largura,
          height: mundo.altura,
          transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.zoom})`,
          // Só a vista movida pelo app (seguir/puxar) desliza.
          transition: vista.suave ? 'transform 0.35s ease' : undefined,
        }}
      >
        {config.imagemUrl && (
          <GridImagem
            key={config.imagemUrl}
            src={config.imagemUrl}
            alt=""
            draggable={false}
            onLoad={event => {
              const carregada = {
                url: config.imagemUrl,
                largura: event.currentTarget.naturalWidth,
                altura: event.currentTarget.naturalHeight,
              };
              setImagem({ ...carregada, falhou: false });
              onImagemCarregada?.(carregada);
            }}
            onError={() =>
              setImagem({ url: config.imagemUrl, largura: 0, altura: 0, falhou: true })
            }
            style={
              imagemCarregada
                ? { width: mundo.largura, height: mundo.altura }
                : { visibility: 'hidden' }
            }
          />
        )}

        {config.mostrarGrade && (
          <GridGrade width={mundo.largura} height={mundo.altura} aria-hidden="true">
            <defs>
              <pattern
                id={idPadrao}
                x={deslocamentoX}
                y={deslocamentoY}
                width={celula}
                height={celula}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${celula} 0 L 0 0 0 ${celula}`}
                  fill="none"
                  stroke={config.corGrade}
                  strokeOpacity={config.opacidadeGrade}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </pattern>
            </defs>
            <rect
              x={deslocamentoX}
              y={deslocamentoY}
              width={mundo.colunas * celula}
              height={mundo.linhas * celula}
              fill={`url(#${idPadrao})`}
              stroke={config.corGrade}
              strokeOpacity={config.opacidadeGrade}
              vectorEffect="non-scaling-stroke"
            />
          </GridGrade>
        )}

        {bloqueadas && (
          <ParedesCamada config={config} bloqueadas={bloqueadas} limites={limites} />
        )}

        {auras.map(({ token, aura }) => {
          const area = areaDaAura(token, aura, mundo);
          const canto = posicaoEmPx(config, area.col, area.lin);
          return (
            <AuraArea
              key={token.id}
              data-aura={token.id}
              style={{
                left: canto.x,
                top: canto.y,
                width: area.colunas * celula,
                height: area.linhas * celula,
                '--cor': aura.cor,
              }}
            />
          );
        })}

        {alcance && (
          <AlcanceMovimento
            faixas={alcance.faixas}
            config={config}
            largura={mundo.largura}
            altura={mundo.altura}
          />
        )}

        {rastrosVisiveis.length > 0 && (
          <GridRastros width={mundo.largura} height={mundo.altura} aria-hidden="true">
            {rastrosVisiveis.map(({ rastro, token }) => (
              <g
                key={rastro.chave}
                data-rastro={rastro.tokenId}
                style={{
                  opacity: rastro.saindo ? 0 : 1,
                  transition: `opacity ${RASTRO_FADE_MS}ms linear`,
                }}
              >
                {linhaTracejada(rastro.pontos, token.tamanho ?? 1, corDoToken(token))}
              </g>
            ))}
          </GridRastros>
        )}

        {(nevoa?.ativa || (mestre && ferramenta === 'nevoa')) && (
          <NevoaCamada
            config={config}
            limites={limites}
            nevoa={nevoa}
            mestre={mestre}
            preview={ferramenta === 'nevoa'}
          />
        )}

        {(areasCalculadas.length > 0 || areaPrevia) && (
          <AreasGrid
            config={config}
            areas={areasCalculadas}
            previa={areaPrevia}
            largura={mundo.largura}
            altura={mundo.altura}
          />
        )}

        {marcadores.map(marcador => (
          <MarcadorPino
            key={marcador.id}
            marcador={marcador}
            config={config}
            mestre={mestre}
            onClick={aoAtivarPino}
          />
        ))}

        {(desenhos.length > 0 ||
          tracoAtual ||
          previa ||
          caminhoArraste?.length >= 2 ||
          medicao) && (
          <CamadaAnotacoes
            config={config}
            limites={limites}
            desenhos={desenhos}
            tracoAtual={tracoAtual}
            previaCelulas={previa}
          >
            {caminhoArraste?.length >= 2 && (
              <g>
                {linhaTracejada(
                  caminhoArraste,
                  tokenArrastado.tamanho ?? 1,
                  corDoToken(tokenArrastado),
                )}
              </g>
            )}
            {medicao && (
              <g style={{ color: 'var(--color-primary)' }}>
                <line
                  x1={medicaoDe.x}
                  y1={medicaoDe.y}
                  x2={medicaoAte.x}
                  y2={medicaoAte.y}
                  stroke="rgba(0, 0, 0, 0.55)"
                  strokeWidth={traco * 1.8}
                  strokeLinecap="round"
                />
                <line
                  x1={medicaoDe.x}
                  y1={medicaoDe.y}
                  x2={medicaoAte.x}
                  y2={medicaoAte.y}
                  stroke="currentColor"
                  strokeWidth={traco}
                  strokeLinecap="round"
                />
                <circle
                  cx={medicaoDe.x}
                  cy={medicaoDe.y}
                  r={traco * 1.5}
                  fill="currentColor"
                />
                <circle
                  cx={medicaoAte.x}
                  cy={medicaoAte.y}
                  r={traco * 1.5}
                  fill="currentColor"
                />
              </g>
            )}
          </CamadaAnotacoes>
        )}

        {tokenArrastado && (
          <TokenFantasma
            aria-hidden="true"
            data-fantasma=""
            style={{
              left: posicaoEmPx(config, tokenArrastado.col, tokenArrastado.lin).x,
              top: posicaoEmPx(config, tokenArrastado.col, tokenArrastado.lin).y,
              width: (tokenArrastado.tamanho ?? 1) * celula,
              height: (tokenArrastado.tamanho ?? 1) * celula,
              padding: (tokenArrastado.tamanho ?? 1) * celula * 0.05,
            }}
          >
            <TokenCirculo
              $tipo={tokenArrastado.tipo}
              $oculto={Boolean(tokenArrastado.oculto)}
              style={{ fontSize: (tokenArrastado.tamanho ?? 1) * celula * 0.38 }}
            >
              {conteudoDoToken(tokenArrastado)}
            </TokenCirculo>
          </TokenFantasma>
        )}

        {ordenarTokens(tokens).map(token => {
          const tamanho = token.tamanho ?? 1;
          const emArraste =
            arraste?.tokenId === token.id &&
            !(arraste.soltando && token.col === arraste.col && token.lin === arraste.lin);
          const posicao = emArraste ? arraste : posicaoEmPx(config, token.col, token.lin);
          const selecionado =
            token.id === selecionadoId || selecionadosIds.includes(token.id);
          const daVez = Boolean(combate) && combate.tokenDaVezId === token.id;
          const lado = tamanho * celula;
          return (
            <TokenWrapper
              key={token.id}
              data-token-id={token.id}
              data-da-vez={daVez ? '' : undefined}
              role="button"
              tabIndex={0}
              aria-label={`${token.nome}, coluna ${token.col + 1}, linha ${token.lin + 1}${token.oculto ? ', oculto' : ''}${daVez ? ', turno atual' : ''}`}
              aria-pressed={onSelecionar ? selecionado : undefined}
              onKeyDown={event => handleTokenKeyDown(event, token)}
              onPointerEnter={event => {
                if (event.pointerType !== 'mouse') return;
                clearTimeout(temporizadores.current.hover);
                setHoverId(token.id);
              }}
              onPointerLeave={event => {
                if (event.pointerType !== 'mouse') return;
                if (recursosEditaveis(token)) soltarHover(token.id);
                else setHoverId(atual => (atual === token.id ? null : atual));
              }}
              $movel={podeMover(token)}
              $arrastando={emArraste && !arraste.soltando}
              $selecionado={selecionado}
              $oculto={Boolean(token.oculto)}
              $daVez={daVez}
              // Folga em px (padding em % seria relativo à largura do mapa).
              style={{
                left: posicao.x,
                top: posicao.y,
                width: lado,
                height: lado,
                padding: lado * 0.05,
              }}
            >
              <TokenCirculo
                $tipo={token.tipo}
                $oculto={Boolean(token.oculto)}
                $selecionado={selecionado}
                style={{ fontSize: lado * 0.38 }}
              >
                {conteudoDoToken(token)}
              </TokenCirculo>
              <TokenEstado
                recursos={detalhes[token.id]?.recursos ?? null}
                condicoes={detalhes[token.id]?.condicoes ?? null}
                lado={lado}
              />
              <TokenNome style={{ fontSize: Math.max(10, celula * 0.24) }}>
                {token.nome}
              </TokenNome>
              {token.oculto && (
                <TokenOcultoIcone>
                  <VisibilityOffIcon sx={{ fontSize: Math.max(10, celula * 0.22) }} />
                </TokenOcultoIcone>
              )}
            </TokenWrapper>
          );
        })}
      </GridMundo>

      {/* Distâncias, em px do viewport (mesmo tamanho em qualquer zoom). */}
      {rastrosVisiveis.map(({ rastro, token }) => {
        const quadrados = distanciaDoRastro(rastro.pontos);
        // O token em arraste mostra o total encadeado (abaixo).
        if (!quadrados || token.id === tokenArrastado?.id) return null;
        const fim = rastro.pontos[rastro.pontos.length - 1];
        const canto = posicaoEmPx(config, fim.col, fim.lin);
        return (
          <RotuloDistancia
            key={rastro.chave}
            $cor={corDoToken(token)}
            $saindo={rastro.saindo}
            style={posicaoDoRotulo(canto.x, canto.y, token.tamanho ?? 1)}
          >
            {formatarDistancia(quadrados, metrosPorQuadrado)}
          </RotuloDistancia>
        );
      })}
      {rotuloArraste && (
        <RotuloDistancia
          $cor={rotuloArraste.cor}
          data-faixa={rotuloArraste.faixa ?? undefined}
          style={posicaoDoRotulo(arraste.x, arraste.y, tokenArrastado.tamanho ?? 1)}
        >
          {rotuloArraste.texto}
        </RotuloDistancia>
      )}
      {medicao && (
        <RotuloDistancia
          style={posicaoDoRotulo(medicaoAte.x - celula / 2, medicaoAte.y - celula / 2, 1)}
        >
          {formatarDistancia(
            distanciaChebyshev(medicao.de, medicao.ate),
            metrosPorQuadrado,
          )}
        </RotuloDistancia>
      )}

      <SinaisPing pings={pings} vista={vista} />

      {rotulosDasAreas.length > 0 && (
        <AreaRotulos
          areas={rotulosDasAreas}
          posicaoDe={area => {
            const canto = posicaoEmPx(config, area.origem.col, area.origem.lin);
            return posicaoDoRotulo(canto.x, canto.y, 1);
          }}
          posicaoDaAlca={(area, alca) =>
            celulaNoViewportPx(alca === 'alvo' ? area.alvoEfetivo : area.origem)
          }
          selecionadaId={areaSelId}
          onSelecionar={setAreaSelId}
          onRemover={areaId => {
            setAreaSelId(null);
            acoesAreas.remover?.(areaId);
          }}
          onAlcaPointerDown={iniciarAlca}
        />
      )}

      {tokenDaAcao && podeRolarToken(tokenDaAcao) && (
        <TokenAcoes
          posicao={(() => {
            const canto = posicaoEmPx(config, tokenDaAcao.col, tokenDaAcao.lin);
            return posicaoDoRotulo(canto.x, canto.y, tokenDaAcao.tamanho ?? 1);
          })()}
          onRolar={() => onRolarToken(tokenDaAcao)}
        />
      )}

      {modoAreaAtivo && (
        <ChipModoArea role="status" style={{ top: faixa ? 56 : 10 }}>
          <span>
            {modoArea.forma === AREA_FORMAS.RAIO ? 'Toque' : 'Arraste'} no mapa para
            posicionar o {ROTULOS_AREA[modoArea.forma]} · Esc ou ✕ cancela
          </span>
          <IconButton
            size="small"
            aria-label="Cancelar área"
            onClick={() => {
              setModoArea(null);
              setPreviaArea(null);
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </ChipModoArea>
      )}

      {cartao && (
        <TokenDetalhe
          key={cartao.token.id}
          nome={cartao.token.nome}
          recursos={detalhes[cartao.token.id]?.recursos ?? null}
          condicoes={detalhes[cartao.token.id]?.condicoes ?? null}
          distancia={cartao.distancia}
          pp={detalhes[cartao.token.id]?.pp ?? null}
          style={cartao.style}
          onAlterarRecurso={
            recursosEditaveis(cartao.token)
              ? (recurso, valor) => onAlterarRecurso(cartao.token, recurso, valor)
              : undefined
          }
          onPointerEnter={event => {
            if (event.pointerType !== 'mouse') return;
            clearTimeout(temporizadores.current.hover);
            setHoverId(cartao.token.id);
          }}
          onPointerLeave={event => {
            if (event.pointerType === 'mouse') soltarHover(cartao.token.id);
          }}
          onFocus={() => setCartaoFocadoId(cartao.token.id)}
          onBlur={event => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setCartaoFocadoId(null);
          }}
        />
      )}

      {faixa && (
        <FaixaIniciativa
          faixa={faixa}
          acoes={acoesCombate}
          onCentralizar={centralizarNoToken}
        />
      )}

      {marcadorAberto && (
        <MarcadorCartao
          marcador={marcadorAberto}
          posicao={posicaoCartaoMarcador}
          onFechar={fecharMarcador}
        />
      )}

      {modoDesenhoAtivo && (
        <PaletaDesenho
          cor={corDesenho}
          onCor={setCorDesenho}
          onApagarMeus={() => acoesDesenho.apagarMeus?.()}
          onApagarTodos={
            acoesDesenho.apagarTodos ? () => acoesDesenho.apagarTodos() : undefined
          }
        />
      )}

      {(aviso || avisoImagem || avisoParede) && (
        <GridAviso role="status" $abaixoDaFaixa={Boolean(faixa)}>
          {aviso || avisoImagem || (avisoParede && TEXTO_PAREDE)}
        </GridAviso>
      )}

      {!mestre && TEXTO_TRAVAMENTO[travamento] && (
        <ChipTravamento data-travamento={travamento}>
          <LockOutlinedIcon sx={{ fontSize: 14 }} />
          {TEXTO_TRAVAMENTO[travamento]}
        </ChipTravamento>
      )}

      <GridControles onPointerDown={event => event.stopPropagation()}>
        <Tooltip title="Aproximar" placement="left">
          <IconButton
            size="small"
            aria-label="Aproximar"
            onClick={() => zoomPeloBotao(ZOOM_PASSO)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Afastar" placement="left">
          <IconButton
            size="small"
            aria-label="Afastar"
            onClick={() => zoomPeloBotao(1 / ZOOM_PASSO)}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Centralizar mapa" placement="left">
          <IconButton
            size="small"
            aria-label="Centralizar mapa"
            // No celular a vista padrão é o foco no token: "centralizar"
            // mostra o mapa inteiro.
            onClick={() =>
              celular ? definirVista(vistaEncaixada) : setVistaManual(null)
            }
          >
            <CenterFocusStrongIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Régua (Shift+arrastar)" placement="left">
          <IconButton
            size="small"
            aria-label="Régua"
            aria-pressed={modoRegua}
            onClick={() => {
              setModoRegua(ligado => !ligado);
              setMedicao(null);
              setModoDesenho(false);
              setModoArea(null);
              setPreviaArea(null);
            }}
            sx={{ color: modoRegua ? 'var(--color-primary)' : undefined }}
          >
            <StraightenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {onDesenhar && (
          <Tooltip title="Desenhar (Esc sai)" placement="left">
            {/* span: o Tooltip precisa de um filho que receba eventos mesmo
                com o botão desabilitado (ferramenta de edição do mestre). */}
            <span>
              <IconButton
                size="small"
                aria-label="Desenhar"
                aria-pressed={modoDesenhoAtivo}
                disabled={ferramenta !== 'mover'}
                onClick={() => {
                  setModoDesenho(ligado => !ligado);
                  setModoRegua(false);
                  setMedicao(null);
                  setModoArea(null);
                  setPreviaArea(null);
                }}
                sx={{ color: modoDesenhoAtivo ? 'var(--color-primary)' : undefined }}
              >
                <DrawIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {acoesAreas.criar && (
          <Tooltip
            title={
              ferramenta === 'mover'
                ? 'Área (Raio, Linha, Cone, Quadrado)'
                : 'Volte à ferramenta Mover'
            }
            placement="left"
          >
            {/* span: o Tooltip precisa de um filho que receba eventos mesmo
                com o botão desabilitado. */}
            <span>
              <IconButton
                size="small"
                aria-label="Área"
                aria-pressed={modoAreaAtivo}
                disabled={ferramenta !== 'mover'}
                onClick={event => {
                  if (modoArea !== null) {
                    setModoArea(null);
                    setPreviaArea(null);
                  } else {
                    setPopoverAreaEl(event.currentTarget);
                  }
                }}
                sx={{ color: modoAreaAtivo ? 'var(--color-primary)' : undefined }}
              >
                <ChangeHistoryIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title="Seguir token" placement="left">
          {/* span: o Tooltip precisa de um filho que receba eventos mesmo com
              o botão desabilitado. */}
          <span>
            <IconButton
              size="small"
              aria-label="Seguir token"
              aria-pressed={seguindo}
              disabled={!referencia}
              onClick={() => {
                setSeguindo(ligado => !ligado);
                // Ligar centraliza na hora.
                setSeguido(null);
              }}
              sx={{ color: seguindo ? 'var(--color-primary)' : undefined }}
            >
              <MyLocationIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        {mestre && onPing && (
          <Tooltip
            title="Puxar a vista dos jogadores (Shift+Alt+clique)"
            placement="left"
          >
            <IconButton
              size="small"
              aria-label="Puxar vista"
              aria-pressed={modoPuxar}
              onClick={() => setModoPuxar(ligado => !ligado)}
              sx={{ color: modoPuxar ? 'var(--color-primary)' : undefined }}
            >
              <CampaignIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {acoesAreas.criar && (
          <AreaPopover
            anchorEl={popoverAreaEl}
            open={Boolean(popoverAreaEl)}
            onClose={() => setPopoverAreaEl(null)}
            onPosicionar={configuracao => {
              setModoRegua(false);
              setMedicao(null);
              setModoDesenho(false);
              setModoArea(configuracao);
            }}
            metrosPorQuadrado={metrosPorQuadrado}
            corPadrao={corAreaPadrao}
            onRemoverTodas={
              mestre && acoesAreas.removerTodas
                ? () => acoesAreas.removerTodas()
                : undefined
            }
          />
        )}
      </GridControles>
    </GridViewport>
  );
};

const recursoShape = PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number });

GridMapa.propTypes = {
  config: PropTypes.shape({
    imagemUrl: PropTypes.string,
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
    mostrarGrade: PropTypes.bool.isRequired,
    corGrade: PropTypes.string.isRequired,
    opacidadeGrade: PropTypes.number.isRequired,
    metrosPorQuadrado: PropTypes.number,
    multiplicadorCorrida: PropTypes.number,
  }).isRequired,
  tokens: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
      imagemUrl: PropTypes.string,
      tipo: PropTypes.string,
      col: PropTypes.number.isRequired,
      lin: PropTypes.number.isRequired,
      tamanho: PropTypes.number,
      oculto: PropTypes.bool,
      donos: PropTypes.arrayOf(PropTypes.string),
      refId: PropTypes.string,
      pv: recursoShape,
      energia: recursoShape,
      fadiga: recursoShape,
      mostrarRecursos: PropTypes.string,
      condicoes: PropTypes.arrayOf(PropTypes.string),
      aura: PropTypes.shape({ raio: PropTypes.number, cor: PropTypes.string }),
      deslocamento: PropTypes.number,
    }),
  ).isRequired,
  podeMover: PropTypes.func.isRequired,
  onMover: PropTypes.func.isRequired,
  selecionadoId: PropTypes.string,
  // Seleção múltipla (só o mestre): ids realçados além do `selecionadoId`.
  selecionadosIds: PropTypes.arrayOf(PropTypes.string),
  onSelecionar: PropTypes.func,
  // Shift/Ctrl/Cmd-clique (ou Enter/Espaço com a tecla) num token: alterna-o na
  // seleção múltipla. Sem ela, o clique com tecla se comporta como sempre.
  onAlternarSelecao: PropTypes.func,
  // Recebe { url, largura, altura } quando a imagem carrega — para quem
  // precisa dos limites do grid fora daqui (ex.: posicionar token novo).
  onImagemCarregada: PropTypes.func,
  aviso: PropTypes.node,
  // Rastros dos últimos movimentos (useGridCampanha → rastrosAtivos).
  rastros: PropTypes.arrayOf(
    PropTypes.shape({
      tokenId: PropTypes.string.isRequired,
      chave: PropTypes.string.isRequired,
      pontos: PropTypes.arrayOf(
        PropTypes.shape({ col: PropTypes.number, lin: PropTypes.number }),
      ).isRequired,
      saindo: PropTypes.bool,
    }),
  ),
  // Mestre: botão "Puxar vista" e sinais com `puxar`.
  mestre: PropTypes.bool,
  // Recebe { x, y, puxar } (px do mundo) — sem ele, não há sinal.
  onPing: PropTypes.func,
  // Sinais na tela (useGridCampanha → pings).
  pings: PropTypes.arrayOf(
    PropTypes.shape({
      chave: PropTypes.string.isRequired,
      uid: PropTypes.string.isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      nome: PropTypes.string,
      cor: PropTypes.string,
      puxar: PropTypes.bool,
      proprio: PropTypes.bool,
    }),
  ),
  // { [tokenId]: { recursos, condicoes, pp? } } (useGridCampanha → detalhes).
  detalhes: PropTypes.objectOf(
    PropTypes.shape({
      recursos: PropTypes.object,
      condicoes: PropTypes.arrayOf(PropTypes.object),
      pp: recursoShape,
    }),
  ),
  // Combate da cena (useGridCampanha → combate; normalizarCombate) ou null.
  combate: PropTypes.shape({
    ordem: PropTypes.arrayOf(
      PropTypes.shape({
        tokenId: PropTypes.string.isRequired,
        iniciativa: PropTypes.number,
        d20: PropTypes.number,
        reacao: PropTypes.number,
      }),
    ).isRequired,
    indice: PropTypes.number.isRequired,
    rodada: PropTypes.number.isRequired,
    inicioTurno: PropTypes.shape({ col: PropTypes.number, lin: PropTypes.number }),
    chaveTurno: PropTypes.string,
    tokenDaVezId: PropTypes.string,
  }),
  // Botões da faixa (cada um só aparece com a função; podem devolver Promise).
  acoesCombate: PropTypes.shape({
    anterior: PropTypes.func,
    proximo: PropTypes.func,
    encerrarTurno: PropTypes.func,
    restaurarPp: PropTypes.func,
  }),
  // Travar movimento da cena (useGridCampanha → travamento).
  travamento: PropTypes.oneOf(Object.values(TRAVAMENTOS)),
  // Tokens da pessoa (padrão: podeMover) — referência e foco do celular.
  ehMeu: PropTypes.func,
  // Camadas da cena (useGridCampanha → camadas): paredes e névoa.
  camadas: PropTypes.shape({
    bloqueadas: PropTypes.instanceOf(Set),
    nevoa: PropTypes.shape({
      ativa: PropTypes.bool,
      reveladas: PropTypes.instanceOf(Set),
    }),
  }),
  // Marcadores visíveis (useGridCampanha → marcadores).
  marcadores: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      col: PropTypes.number.isRequired,
      lin: PropTypes.number.isRequired,
      icone: PropTypes.string,
      cor: PropTypes.string,
      titulo: PropTypes.string,
      texto: PropTypes.string,
      secreto: PropTypes.bool,
    }),
  ),
  // Desenhos de todos (useGridCampanha → desenhos; pontos plano [x0, y0, ...]).
  desenhos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      cor: PropTypes.string.isRequired,
      pontos: PropTypes.arrayOf(PropTypes.number).isRequired,
    }),
  ),
  // Ferramenta do mestre: muda o gesto do mapa (padrão: mover tokens).
  ferramenta: PropTypes.oneOf(['mover', 'paredes', 'nevoa', 'marcadores']),
  // Pincel de paredes/névoa.
  opcoesFerramenta: PropTypes.shape({
    forma: PropTypes.oneOf(['pincel', 'retangulo']),
    acao: PropTypes.oneOf(Object.values(ACOES_CAMADA)),
    tamanho: PropTypes.number,
  }),
  // Recebe { camada, acao, celulas: [{ col, lin }] } ao soltar o pincel.
  onEditarCamada: PropTypes.func,
  // Ferramenta Marcadores: toque no vazio ({ col, lin }) / num marcador.
  onCelulaMarcador: PropTypes.func,
  onMarcadorClique: PropTypes.func,
  // Recebe { cor, pontos: [x0, y0, ...] } (px do mundo) — sem ele, não há
  // botão "Desenhar".
  onDesenhar: PropTypes.func,
  // Paleta do desenho: { apagarMeus, apagarTodos? } (só o mestre tem o último).
  acoesDesenho: PropTypes.shape({
    apagarMeus: PropTypes.func,
    apagarTodos: PropTypes.func,
  }),
  // Templates de área da cena (useGridCampanha → areas; normalizarArea).
  areas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      uid: PropTypes.string,
      nome: PropTypes.string,
      forma: PropTypes.oneOf(Object.values(AREA_FORMAS)).isRequired,
      origem: PropTypes.shape({ col: PropTypes.number, lin: PropTypes.number })
        .isRequired,
      alvo: PropTypes.shape({ col: PropTypes.number, lin: PropTypes.number }),
      metros: PropTypes.number.isRequired,
      cor: PropTypes.string,
    }),
  ),
  // Sem `criar` não há botão "Área".
  acoesAreas: PropTypes.shape({
    criar: PropTypes.func,
    atualizar: PropTypes.func,
    remover: PropTypes.func,
    removerTodas: PropTypes.func,
  }),
  // Autor da área ou mestre: a lixeira e as alças aparecem.
  podeEditarArea: PropTypes.func,
  // Cor inicial do popover da área (cor do ping da pessoa).
  corAreaPadrao: PropTypes.string,
  // "Rolar…" no token: `podeRolarToken(token)` decide, `onRolarToken(token)` abre
  // o diálogo (hospedado pela página).
  podeRolarToken: PropTypes.func,
  // Dono edita PV/Energia/Fadiga atuais no cartão do token: `podeEditarRecursos(token)`
  // + `onAlterarRecurso(token, 'pv'|'energia'|'fadiga', valor)` (promessa). Sem eles,
  // o cartão é só leitura (Re:Master).
  podeEditarRecursos: PropTypes.func,
  onAlterarRecurso: PropTypes.func,
  onRolarToken: PropTypes.func,
};

export default GridMapa;
