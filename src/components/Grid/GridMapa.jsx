import React, {
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

import AlcanceMovimento from './AlcanceMovimento';
import FaixaIniciativa from './FaixaIniciativa';
import SinaisPing from './SinaisPing';
import TokenDetalhe from './TokenDetalhe';
import TokenEstado from './TokenEstado';
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

// Mapa tático da campanha (cópia idêntica no site dos jogadores): imagem de fundo +
// grade desenhada pelo app + tokens posicionados em células. Zoom (roda do
// mouse, pinça, botões) e pan (arrastar o fundo) são locais de quem está
// vendo. Arrastar um token que `podeMover` aceita chama `onMover(token, col,
// lin, caminho)` uma vez, ao soltar, já na célula mais próxima — `caminho` =
// células atravessadas, da origem ao destino; com o token focado as setas
// movem uma célula. Clique sem arrastar chama `onSelecionar(token|null)`.
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
  return {
    zoom,
    x: px - (px - vista.x) * proporcao,
    y: py - (py - vista.y) * proporcao,
  };
};

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const SEM_RASTROS = [];
const SEM_PINGS = [];
const SEM_DETALHES = {};
const SEM_ACOES = {};
const TEXTO_TRAVAMENTO = {
  [TRAVAMENTOS.CONGELADO]: 'Movimento congelado pelo mestre',
  [TRAVAMENTOS.TURNO]: 'Movimento só na sua vez',
};
// Folga (px de tela) entre o token e o cartão de detalhes.
const FOLGA_DETALHE = 6;
// Metade da largura máxima do cartão (centralizado no token): mantém ele
// dentro do viewport.
const MEIA_LARGURA_DETALHE = 120;
// Folga (px de tela) entre o rótulo de distância e o topo do token.
const FOLGA_ROTULO = 6;

const conteudoDoToken = token =>
  token.imagemUrl ? (
    <img src={token.imagemUrl} alt="" draggable={false} />
  ) : (
    (token.nome?.[0]?.toUpperCase() ?? '?')
  );

const corDoToken = token => COR_TIPO_TOKEN[token.tipo] ?? COR_TIPO_TOKEN.avulso;

const GridMapa = ({
  config,
  tokens,
  podeMover,
  onMover,
  selecionadoId = null,
  onSelecionar,
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
}) => {
  const ehMeu = ehMeuToken ?? podeMover;
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
  // Em combate, o jogador tocou o próprio token: mostra o alcance dele (até
  // tocar no mapa vazio ou Esc). O mestre usa o selecionado.
  const [alcanceId, setAlcanceId] = useState(null);
  // Timers da pressão longa e do cartão por toque.
  const temporizadores = useRef({ pressao: null, toque: null });
  // Celular (abaixo do `sm`): o mapa abre focado no primeiro token que a
  // pessoa pode mover, com célula ≥ 44px. A posição do foco é a do token
  // quando ele apareceu — mover o token depois não arrasta a vista junto.
  const celular = useMediaQuery('(max-width: 599.95px)');
  const [foco, setFoco] = useState(null);
  if (celular && !foco) {
    const meuToken = tokens.find(token => ehMeu(token));
    if (meuToken) {
      setFoco({
        col: meuToken.col,
        lin: meuToken.lin,
        tamanho: meuToken.tamanho ?? 1,
      });
    }
  }

  const imagemAtual = imagem.url === config.imagemUrl ? imagem : null;
  const imagemCarregada =
    imagemAtual && !imagemAtual.falhou && imagemAtual.largura > 0
      ? imagemAtual
      : null;
  const mundo = dimensoesDoMundo(config, imagemCarregada);
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
  const vista =
    vistaManual?.chave === config.imagemUrl ? vistaManual : vistaPadrao;
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
  const puxada =
    [...pings].reverse().find(ping => ping.puxar && !ping.proprio) ?? null;
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
        centroDaCelula(
          config,
          referencia.col,
          referencia.lin,
          referencia.tamanho ?? 1,
        ),
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

  // Esc esconde o alcance mostrado pelo toque.
  useEffect(() => {
    if (!alcanceId) return undefined;
    const aoTeclar = event => {
      if (event.key === 'Escape') setAlcanceId(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [alcanceId]);

  useEffect(() => {
    const timers = temporizadores.current;
    return () => {
      clearTimeout(timers.pressao);
      clearTimeout(timers.toque);
    };
  }, []);

  const pontoNoViewport = event => {
    const retangulo = viewportRef.current.getBoundingClientRect();
    return {
      x: event.clientX - retangulo.left,
      y: event.clientY - retangulo.top,
    };
  };

  // Ponto do viewport → célula que o contém (régua).
  const celulaNoViewport = ponto =>
    celulaNoPonto(
      config,
      (ponto.x - vista.x) / vista.zoom,
      (ponto.y - vista.y) / vista.zoom,
      mundo,
    );

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
      if (
        !atual ||
        atual.moveu ||
        atual.tipo === 'pinca' ||
        atual.tipo === 'ping'
      )
        return;
      gesto.current = { tipo: 'ping' };
      setArraste(null);
      navigator.vibrate?.(30);
      emitirPing(ponto, false, puxarNoInicio);
    }, PING_PRESSAO_MS);
  };

  // Cartão do token tocado (celular) por TOQUE_DETALHE_MS; null fecha.
  const mostrarToque = tokenId => {
    clearTimeout(temporizadores.current.toque);
    setToqueId(tokenId);
    temporizadores.current.toque = tokenId
      ? setTimeout(() => setToqueId(null), TOQUE_DETALHE_MS)
      : null;
  };

  const handlePointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const ponto = pontoNoViewport(event);
    ponteiros.current.set(event.pointerId, ponto);
    viewportRef.current.setPointerCapture?.(event.pointerId);

    if (ponteiros.current.size === 2) {
      cancelarPressao();
      const [a, b] = [...ponteiros.current.values()];
      // Pinça cancela a medição que estava começando.
      if (gesto.current?.tipo === 'regua') setMedicao(null);
      gesto.current = { tipo: 'pinca', distancia: distancia(a, b) || 1, vista };
      setArraste(null);
      return;
    }
    // Alt+clique (desktop): sinal na hora — antes do Shift da régua, para
    // Shift+Alt puxar a vista em vez de medir.
    if (onPing && event.pointerType === 'mouse' && event.altKey) {
      emitirPing(pontoNoMundo(ponto), event.shiftKey);
      gesto.current = { tipo: 'ping' };
      return;
    }
    const tokenId = event.target.closest?.('[data-token-id]')?.dataset.tokenId;
    const token = tokenId ? (tokens.find(t => t.id === tokenId) ?? null) : null;
    if (token && podeMover(token)) {
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
      gesto.current = {
        tipo: 'regua',
        token,
        ponto,
        de,
        ate: de,
        moveu: false,
      };
    } else {
      gesto.current = { tipo: 'pan', token, ponto, vista, moveu: false };
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
      definirVista(
        zoomEmTorno(
          atual.vista,
          distancia(a, b) / atual.distancia,
          (a.x + b.x) / 2,
          (a.y + b.y) / 2,
        ),
      );
      return;
    }
    const dx = ponto.x - atual.ponto.x;
    const dy = ponto.y - atual.ponto.y;
    if (!atual.moveu && Math.hypot(dx, dy) < LIMIAR_ARRASTE) return;
    // Andou: não é mais pressão longa.
    if (!atual.moveu) cancelarPressao();
    atual.moveu = true;
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
      setArraste({
        tokenId: atual.token.id,
        ...posicao,
        caminho: atual.caminho,
      });
    } else if (atual.tipo === 'regua') {
      const ate = celulaNoViewport(ponto);
      atual.ate = ate;
      setMedicao(anterior =>
        anterior &&
        mesmaCelula(anterior.de, atual.de) &&
        mesmaCelula(anterior.ate, ate)
          ? anterior
          : { de: atual.de, ate },
      );
    } else {
      // Arrastar o mapa desliga o "Seguir token" (pinça e roda não).
      setSeguindo(false);
      definirVista({
        ...atual.vista,
        x: atual.vista.x + dx,
        y: atual.vista.y + dy,
      });
    }
  };

  const encerrarGesto = (event, cancelado) => {
    if (!ponteiros.current.delete(event.pointerId)) return;
    cancelarPressao();
    const atual = gesto.current;
    gesto.current = null;
    // Sinal já emitido: soltar não seleciona nem limpa a régua.
    if (!atual || atual.tipo === 'pinca' || atual.tipo === 'ping') return;

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
    if (atual.token && ehMeu(atual.token)) setReferenciaId(atual.token.id);
    // Em combate: tocar o próprio token mostra o alcance; o mapa vazio esconde.
    if (combate && !onSelecionar) {
      setAlcanceId(
        atual.token && podeMover(atual.token) ? atual.token.id : null,
      );
    }
    // Celular: tocar mostra o cartão do token (tocar fora fecha).
    if (event.pointerType !== 'mouse') mostrarToque(atual.token?.id ?? null);
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
      moverPara(token, destino.col, destino.lin, [
        { col: token.col, lin: token.lin },
        { col: destino.col, lin: destino.lin },
      ]);
    } else if ((event.key === 'Enter' || event.key === ' ') && onSelecionar) {
      event.preventDefault();
      onSelecionar(token);
    }
  };

  const zoomPeloBotao = fator =>
    definirVista(
      zoomEmTorno(vista, fator, viewport.largura / 2, viewport.altura / 2),
    );

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
    arraste && !arraste.soltando
      ? (tokensPorId.get(arraste.tokenId) ?? null)
      : null;
  const caminhoArraste = tokenArrastado ? (arraste.caminho ?? null) : null;
  // Distância do arraste = total encadeado ao rastro ainda visível do token
  // (o mesmo que todos verão depois de soltar).
  const quadradosArraste = caminhoArraste
    ? distanciaDoRastro(
        montarRastro(
          rastros.find(rastro => rastro.tokenId === tokenArrastado.id)
            ?.pontos ?? null,
          caminhoArraste,
        ),
      )
    : 0;

  // ── Combate: faixa, alcance de movimento e rótulo do arraste ──
  const faixa = combate
    ? faixaDoCombate(combate, tokens, { veTudo: mestre })
    : null;
  const idDoAlcance = onSelecionar ? selecionadoId : alcanceId;
  const tokenDoAlcance =
    tokenArrastado ??
    (idDoAlcance ? (tokensPorId.get(idDoAlcance) ?? null) : null);
  const alvoAlcance =
    combate && tokenDoAlcance && podeMover(tokenDoAlcance)
      ? tokenDoAlcance
      : null;
  const origemAlcance = alvoAlcance
    ? origemDoAlcance(alvoAlcance, combate)
    : null;
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
    });
    return {
      distancias,
      faixas: faixasDoAlcance(distancias, { mover, correr, tamanho }),
    };
  }, [chaveAlcance]);
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
    const inicio = centroDaCelula(
      config,
      pontos[0].col,
      pontos[0].lin,
      tamanho,
    );
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
  const medicaoDe =
    medicao && centroDaCelula(config, medicao.de.col, medicao.de.lin);
  const medicaoAte =
    medicao && centroDaCelula(config, medicao.ate.col, medicao.ate.lin);

  // ── Auras e cartão do token ──
  const auras = tokens
    .map(token => ({ token, aura: normalizarAura(token.aura) }))
    .filter(({ aura }) => aura);
  // Cartão: token tocado (celular) ou sob o mouse; some durante o arraste.
  const alvoId = tokenArrastado ? null : (toqueId ?? hoverId);
  const alvo = alvoId ? (tokensPorId.get(alvoId) ?? null) : null;
  let cartao = null;
  if (alvo) {
    const canto = posicaoEmPx(config, alvo.col, alvo.lin);
    const lado = (alvo.tamanho ?? 1) * celula;
    // Abaixo do token e do nome dele (o nome fica sob o círculo).
    const alturaNome = Math.max(10, celula * 0.24) * 1.4;
    const centro = vista.x + (canto.x + lado / 2) * vista.zoom;
    const limite = viewport.largura - MEIA_LARGURA_DETALHE;
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
          limite > MEIA_LARGURA_DETALHE
            ? Math.min(Math.max(centro, MEIA_LARGURA_DETALHE), limite)
            : centro,
        top:
          vista.y + (canto.y + lado + alturaNome) * vista.zoom + FOLGA_DETALHE,
      },
    };
  }

  return (
    <GridViewport
      ref={viewportRef}
      role="application"
      aria-label="Grid da campanha"
      $regua={modoRegua}
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
              setImagem({
                url: config.imagemUrl,
                largura: 0,
                altura: 0,
                falhou: true,
              })
            }
            style={
              imagemCarregada
                ? { width: mundo.largura, height: mundo.altura }
                : { visibility: 'hidden' }
            }
          />
        )}

        {config.mostrarGrade && (
          <GridGrade
            width={mundo.largura}
            height={mundo.altura}
            aria-hidden="true"
          >
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

        {(rastrosVisiveis.length > 0 || caminhoArraste || medicao) && (
          <GridRastros
            width={mundo.largura}
            height={mundo.altura}
            aria-hidden="true"
          >
            {rastrosVisiveis.map(({ rastro, token }) => (
              <g
                key={rastro.chave}
                data-rastro={rastro.tokenId}
                style={{
                  opacity: rastro.saindo ? 0 : 1,
                  transition: `opacity ${RASTRO_FADE_MS}ms linear`,
                }}
              >
                {linhaTracejada(
                  rastro.pontos,
                  token.tamanho ?? 1,
                  corDoToken(token),
                )}
              </g>
            ))}
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
          </GridRastros>
        )}

        {tokenArrastado && (
          <TokenFantasma
            aria-hidden="true"
            data-fantasma=""
            style={{
              left: posicaoEmPx(config, tokenArrastado.col, tokenArrastado.lin)
                .x,
              top: posicaoEmPx(config, tokenArrastado.col, tokenArrastado.lin)
                .y,
              width: (tokenArrastado.tamanho ?? 1) * celula,
              height: (tokenArrastado.tamanho ?? 1) * celula,
              padding: (tokenArrastado.tamanho ?? 1) * celula * 0.05,
            }}
          >
            <TokenCirculo
              $tipo={tokenArrastado.tipo}
              $oculto={Boolean(tokenArrastado.oculto)}
              style={{
                fontSize: (tokenArrastado.tamanho ?? 1) * celula * 0.38,
              }}
            >
              {conteudoDoToken(tokenArrastado)}
            </TokenCirculo>
          </TokenFantasma>
        )}

        {ordenarTokens(tokens).map(token => {
          const tamanho = token.tamanho ?? 1;
          const emArraste =
            arraste?.tokenId === token.id &&
            !(
              arraste.soltando &&
              token.col === arraste.col &&
              token.lin === arraste.lin
            );
          const posicao = emArraste
            ? arraste
            : posicaoEmPx(config, token.col, token.lin);
          const selecionado = token.id === selecionadoId;
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
                if (event.pointerType === 'mouse') setHoverId(token.id);
              }}
              onPointerLeave={event => {
                if (event.pointerType === 'mouse')
                  setHoverId(atual => (atual === token.id ? null : atual));
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
                  <VisibilityOffIcon
                    sx={{ fontSize: Math.max(10, celula * 0.22) }}
                  />
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
          style={posicaoDoRotulo(
            arraste.x,
            arraste.y,
            tokenArrastado.tamanho ?? 1,
          )}
        >
          {rotuloArraste.texto}
        </RotuloDistancia>
      )}
      {medicao && (
        <RotuloDistancia
          style={posicaoDoRotulo(
            medicaoAte.x - celula / 2,
            medicaoAte.y - celula / 2,
            1,
          )}
        >
          {formatarDistancia(
            distanciaChebyshev(medicao.de, medicao.ate),
            metrosPorQuadrado,
          )}
        </RotuloDistancia>
      )}

      <SinaisPing pings={pings} vista={vista} />

      {cartao && (
        <TokenDetalhe
          nome={cartao.token.nome}
          recursos={detalhes[cartao.token.id]?.recursos ?? null}
          condicoes={detalhes[cartao.token.id]?.condicoes ?? null}
          distancia={cartao.distancia}
          pp={detalhes[cartao.token.id]?.pp ?? null}
          style={cartao.style}
        />
      )}

      {faixa && (
        <FaixaIniciativa
          faixa={faixa}
          acoes={acoesCombate}
          onCentralizar={centralizarNoToken}
        />
      )}

      {(aviso || avisoImagem) && (
        <GridAviso role="status" $abaixoDaFaixa={Boolean(faixa)}>
          {aviso || avisoImagem}
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
            }}
            sx={{ color: modoRegua ? 'var(--color-primary)' : undefined }}
          >
            <StraightenIcon fontSize="small" />
          </IconButton>
        </Tooltip>
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
      </GridControles>
    </GridViewport>
  );
};

const recursoShape = PropTypes.shape({
  atual: PropTypes.number,
  max: PropTypes.number,
});

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
  onSelecionar: PropTypes.func,
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
    inicioTurno: PropTypes.shape({
      col: PropTypes.number,
      lin: PropTypes.number,
    }),
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
};

export default GridMapa;
