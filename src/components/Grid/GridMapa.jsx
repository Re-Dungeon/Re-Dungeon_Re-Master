import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import {
  celulaMaisProxima,
  dimensoesDoMundo,
  limitarPosicao,
  ordenarTokens,
  posicaoEmPx,
  vistaFocadaNoToken,
} from 'common/utils/grid';

import {
  GridAviso,
  GridControles,
  GridGrade,
  GridImagem,
  GridMundo,
  GridViewport,
  TokenCirculo,
  TokenNome,
  TokenOcultoIcone,
  TokenWrapper,
} from './styles';

// Mapa tático da campanha (cópia idêntica no site dos jogadores): imagem de fundo +
// grade desenhada pelo app + tokens posicionados em células. Zoom (roda do
// mouse, pinça, botões) e pan (arrastar o fundo) são locais de quem está
// vendo. Arrastar um token que `podeMover` aceita chama `onMover(token, col,
// lin)` uma vez, ao soltar, já na célula mais próxima; com o token focado as
// setas movem uma célula. Clique sem arrastar chama `onSelecionar(token|null)`.

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

const GridMapa = ({
  config,
  tokens,
  podeMover,
  onMover,
  selecionadoId = null,
  onSelecionar,
  onImagemCarregada,
  aviso = null,
}) => {
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
  const [vistaManual, setVistaManual] = useState(null);
  // Token sendo arrastado: { tokenId, x, y } em px do mundo; `soltando` (com
  // col/lin) segura a posição final até o snapshot do Firestore chegar.
  const [arraste, setArraste] = useState(null);
  const gesto = useRef(null);
  const ponteiros = useRef(new Map());
  // Celular (abaixo do `sm`): o mapa abre focado no primeiro token que a
  // pessoa pode mover, com célula ≥ 44px. A posição do foco é a do token
  // quando ele apareceu — mover o token depois não arrasta a vista junto.
  const celular = useMediaQuery('(max-width: 599.95px)');
  const [foco, setFoco] = useState(null);
  if (celular && !foco) {
    const meuToken = tokens.find(token => podeMover(token));
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
    setVistaManual({ ...novaVista, chave: config.imagemUrl });

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

  const pontoNoViewport = event => {
    const retangulo = viewportRef.current.getBoundingClientRect();
    return {
      x: event.clientX - retangulo.left,
      y: event.clientY - retangulo.top,
    };
  };

  const moverPara = (token, col, lin) => {
    if (col === token.col && lin === token.lin) return null;
    return Promise.resolve(onMover(token, col, lin));
  };

  const handlePointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const ponto = pontoNoViewport(event);
    ponteiros.current.set(event.pointerId, ponto);
    viewportRef.current.setPointerCapture?.(event.pointerId);

    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      gesto.current = { tipo: 'pinca', distancia: distancia(a, b) || 1, vista };
      setArraste(null);
      return;
    }
    const tokenId = event.target.closest?.('[data-token-id]')?.dataset.tokenId;
    const token = tokenId ? (tokens.find(t => t.id === tokenId) ?? null) : null;
    gesto.current =
      token && podeMover(token)
        ? {
            tipo: 'token',
            token,
            ponto,
            inicio: posicaoEmPx(config, token.col, token.lin),
            moveu: false,
          }
        : { tipo: 'pan', token, ponto, vista, moveu: false };
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
    if (!atual) return;

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
    atual.moveu = true;
    if (atual.tipo === 'token') {
      setArraste({
        tokenId: atual.token.id,
        ...posicaoArrastada(atual, ponto),
      });
    } else {
      definirVista({
        ...atual.vista,
        x: atual.vista.x + dx,
        y: atual.vista.y + dy,
      });
    }
  };

  const encerrarGesto = (event, cancelado) => {
    if (!ponteiros.current.delete(event.pointerId)) return;
    const atual = gesto.current;
    gesto.current = null;
    if (!atual || atual.tipo === 'pinca') return;

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
      const gravacao = cancelado ? null : moverPara(token, col, lin);
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
    if (!atual.moveu && !cancelado) onSelecionar?.(atual.token);
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
      moverPara(token, destino.col, destino.lin);
    } else if ((event.key === 'Enter' || event.key === ' ') && onSelecionar) {
      event.preventDefault();
      onSelecionar(token);
    }
  };

  const zoomPeloBotao = fator =>
    definirVista(
      zoomEmTorno(vista, fator, viewport.largura / 2, viewport.altura / 2),
    );

  const { celula, deslocamentoX, deslocamentoY } = config;
  const avisoImagem =
    imagemAtual?.falhou &&
    'Não foi possível carregar a imagem do grid — confira o link com o mestre.';

  return (
    <GridViewport
      ref={viewportRef}
      role="application"
      aria-label="Grid da campanha"
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
          const lado = tamanho * celula;
          return (
            <TokenWrapper
              key={token.id}
              data-token-id={token.id}
              role="button"
              tabIndex={0}
              aria-label={`${token.nome}, coluna ${token.col + 1}, linha ${token.lin + 1}${token.oculto ? ', oculto' : ''}`}
              aria-pressed={onSelecionar ? selecionado : undefined}
              onKeyDown={event => handleTokenKeyDown(event, token)}
              $movel={podeMover(token)}
              $arrastando={emArraste && !arraste.soltando}
              $selecionado={selecionado}
              $oculto={Boolean(token.oculto)}
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
                {token.imagemUrl ? (
                  <img src={token.imagemUrl} alt="" draggable={false} />
                ) : (
                  (token.nome?.[0]?.toUpperCase() ?? '?')
                )}
              </TokenCirculo>
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

      {(aviso || avisoImagem) && (
        <GridAviso role="status">{aviso || avisoImagem}</GridAviso>
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
      </GridControles>
    </GridViewport>
  );
};

GridMapa.propTypes = {
  config: PropTypes.shape({
    imagemUrl: PropTypes.string,
    celula: PropTypes.number.isRequired,
    deslocamentoX: PropTypes.number.isRequired,
    deslocamentoY: PropTypes.number.isRequired,
    mostrarGrade: PropTypes.bool.isRequired,
    corGrade: PropTypes.string.isRequired,
    opacidadeGrade: PropTypes.number.isRequired,
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
};

export default GridMapa;
