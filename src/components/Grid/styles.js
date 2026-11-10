import styled, { css, keyframes } from 'styled-components';

import { RASTRO_FADE_MS } from 'common/utils/grid';

// Cor da borda do token por origem (mesma nos dois sites — não segue a cor
// primária do tema, para "jogador × criatura" ser reconhecível de relance).
export const COR_TIPO_TOKEN = {
  jogador: '#5b7cfa',
  npc: '#e8cb85',
  criatura: '#e05555',
  avulso: '#9a9aa8',
};

export const GridViewport = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  touch-action: none;
  /* Segurar para sinalizar: sem seleção de texto nem o menu/callout do
     navegador (iOS). */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  ${({ $regua }) =>
    $regua &&
    css`
      &,
      &:active {
        cursor: crosshair;
      }
    `}
`;

export const GridMundo = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  background: #15131f;
  box-shadow: 0 0 0 1px var(--border-primary);
`;

export const GridImagem = styled.img`
  position: absolute;
  left: 0;
  top: 0;
  max-width: none;
  pointer-events: none;
  user-select: none;
`;

export const GridGrade = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
`;

// Rastros de movimento, caminho do arraste e régua (px do mundo). Fica entre
// a grade e os tokens.
export const GridRastros = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;
`;

// Token "fantasma" na origem enquanto o token é arrastado.
export const TokenFantasma = styled.div`
  position: absolute;
  box-sizing: border-box;
  opacity: 0.35;
  pointer-events: none;
`;

// Distância ("4 q · 6 m") em px do VIEWPORT — mesmo tamanho em qualquer zoom.
// Esmaece por transição (não animação: no celular o Mapa | Chat esconde o
// mapa com display:none, o que reiniciaria uma animação).
export const RotuloDistancia = styled.div`
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid ${({ $cor }) => $cor ?? 'var(--color-primary)'};
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  z-index: 25;
  opacity: ${({ $saindo }) => ($saindo ? 0 : 1)};
  transition: opacity ${RASTRO_FADE_MS}ms linear;

  @media (max-width: 599.95px) {
    font-size: 0.9rem;
  }
`;

export const TokenWrapper = styled.div`
  position: absolute;
  box-sizing: border-box;
  outline: none;
  z-index: ${({ $arrastando, $selecionado }) => ($arrastando ? 20 : $selecionado ? 10 : 1)};
  cursor: ${({ $movel }) => ($movel ? 'grab' : 'pointer')};
  transition: ${({ $arrastando }) => ($arrastando ? 'none' : 'left 0.25s ease, top 0.25s ease')};
  opacity: ${({ $oculto }) => ($oculto ? 0.45 : 1)};

  &:focus-visible > span:first-child {
    box-shadow: 0 0 0 3px var(--color-accent);
  }

  ${({ $daVez }) => $daVez && anelDaVez}
`;

export const TokenCirculo = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 50%;
  border: 3px ${({ $oculto }) => ($oculto ? 'dashed' : 'solid')}
    ${({ $tipo }) => COR_TIPO_TOKEN[$tipo] ?? COR_TIPO_TOKEN.avulso};
  background: #2a2638;
  color: var(--text-primary);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);

  ${({ $selecionado }) =>
    $selecionado &&
    css`
      box-shadow:
        0 0 0 3px var(--color-primary),
        0 2px 8px rgba(0, 0, 0, 0.6);
    `}

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    -webkit-touch-callout: none;
  }
`;

export const TokenNome = styled.span`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  max-width: 300%;
  padding: 1px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--text-primary);
  line-height: 1.3;
  pointer-events: none;
`;

export const TokenOcultoIcone = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  padding: 2px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.75);
  color: var(--text-primary);
`;

export const GridControles = styled.div`
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(10, 9, 19, 0.8);
  border: 1px solid var(--border-primary);
  cursor: default;
  z-index: 30;

  /* Celular: alvos de toque de 44px. Em mapas baixos (o do Re:Master divide a
     tela com o chat) os botões passam para uma coluna extra à esquerda em vez
     de vazar por cima do mapa. A escrita vertical faz a quebra do flex virar
     colunas, e a largura acompanha quantas colunas existem. */
  @media (max-width: 599.95px) {
    writing-mode: vertical-lr;
    flex-direction: row;
    flex-wrap: wrap-reverse;
    max-height: calc(100% - 30px);

    & > * {
      writing-mode: horizontal-tb;
    }

    & .MuiIconButton-root {
      width: 44px;
      height: 44px;
    }
  }
`;

export const GridAviso = styled.div`
  position: absolute;
  left: 50%;
  /* Abaixo da faixa de iniciativa quando há combate. */
  top: ${({ $abaixoDaFaixa }) => ($abaixoDaFaixa ? '72px' : '16px')};
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(10, 9, 19, 0.85);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: center;
  pointer-events: none;
  z-index: 25;
`;

// Aura de um token (px do mundo): quadrado de células abaixo dos tokens e dos
// rastros. Cor em `--cor` (style).
export const AuraArea = styled.div`
  position: absolute;
  box-sizing: border-box;
  border-radius: 6px;
  background: color-mix(in srgb, var(--cor) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--cor) 60%, transparent);
  pointer-events: none;
`;

// Barras de PV/Energia/Fadiga empilhadas sobre a base do círculo do token.
export const TokenBarras = styled.span`
  position: absolute;
  left: 14%;
  right: 14%;
  bottom: 2%;
  display: flex;
  flex-direction: column;
  gap: 1px;
  pointer-events: none;
`;

export const TokenBarra = styled.span`
  display: block;
  overflow: hidden;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.7);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);

  & > span {
    display: block;
    height: 100%;
  }
`;

// Ícones das condições no canto superior esquerdo (o de oculto fica no
// direito).
export const TokenCondicoes = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  gap: 1px;
  pointer-events: none;
`;

export const TokenCondicaoIcone = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(10, 9, 19, 0.85);
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-touch-callout: none;
  }
`;

const pulsoDoPing = keyframes`
  from {
    transform: translate(-50%, -50%) scale(0.3);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(2.4);
    opacity: 0;
  }
`;

// Sinal no mapa, em px do VIEWPORT (left/top = o ponto). Cor em `--cor`.
export const SinalPing = styled.div`
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 26;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 36px;
    height: 36px;
    box-sizing: border-box;
    border-radius: 50%;
    border: 3px solid var(--cor);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
    animation: ${pulsoDoPing} 1s ease-out 3 both;
  }

  &::after {
    animation-delay: 0.3s;
  }
`;

export const SinalPingNome = styled.span`
  position: absolute;
  left: 0;
  top: 24px;
  transform: translateX(-50%);
  padding: 1px 8px;
  border-radius: 6px;
  border: 1px solid var(--cor);
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-primary);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
`;

// Cartão de detalhes do token (hover/toque), em px do VIEWPORT, abaixo dele.
export const TokenDetalheCaixa = styled.div`
  position: absolute;
  transform: translateX(-50%);
  max-width: ${({ $interativo }) => ($interativo ? '290px' : '240px')};
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: rgba(10, 9, 19, 0.92);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.45;
  pointer-events: ${({ $interativo }) => ($interativo ? 'auto' : 'none')};
  z-index: 27;

  & strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-primary);
  }

  @media (max-width: 599.95px) {
    font-size: 0.9rem;
  }
`;

// Linha editável de um recurso no cartão do dono: "PV [−] 12 / 20 [+]".
export const LinhaRecursoEditavel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;

  & > span {
    white-space: nowrap;
  }

  & > span:first-child {
    min-width: 52px;
  }

  & button {
    flex: none;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
  }

  & button:hover:not(:disabled) {
    border-color: var(--border-hover);
  }

  & button:disabled {
    opacity: 0.4;
    cursor: default;
  }

  & input {
    width: 52px;
    height: 28px;
    padding: 0 4px;
    border: 1px solid var(--border-primary);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.06);
    color: var(--text-primary);
    font: inherit;
    text-align: center;
  }

  @media (max-width: 599.95px) {
    gap: 4px;

    & > span:first-child {
      min-width: 0;
      flex: none;
    }

    & button {
      width: 44px;
      height: 44px;
      font-size: 1.25rem;
    }

    & input {
      width: 48px;
      min-width: 0;
      height: 44px;
      font-size: 1rem;
    }
  }
`;

// ── Combate (Fase 3A) ──────────────────────────────────────────────────────

const pulsoDaVez = keyframes`
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.55;
  }
`;

// Anel pulsante do token da vez (::before do TokenWrapper — o primeiro filho
// continua sendo o círculo, que o foco do teclado destaca).
export const anelDaVez = css`
  &::before {
    content: '';
    position: absolute;
    inset: -4%;
    box-sizing: border-box;
    border-radius: 50%;
    border: 3px solid #e8cb85;
    box-shadow: 0 0 12px rgba(232, 203, 133, 0.85);
    pointer-events: none;
    animation: ${pulsoDaVez} 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::before {
      animation: none;
    }
  }
`;

// Alcance de movimento (px do mundo): entre as auras e os rastros.
export const GridAlcance = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
`;

// Faixa de iniciativa no topo do mapa (px do VIEWPORT).
export const FaixaCaixa = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  background: rgba(10, 9, 19, 0.85);
  border: 1px solid var(--border-primary);
  cursor: default;
  z-index: 29;

  @media (max-width: 599.95px) {
    flex-wrap: wrap;
    gap: 6px;
    padding: 4px 6px;
  }
`;

export const FaixaRodada = styled.span`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(232, 203, 133, 0.6);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
`;

export const FaixaLista = styled.ol`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  flex: 1;
  min-width: 0;
  margin: 0;
  padding: 2px;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;

  & > li {
    flex-shrink: 0;
  }

  @media (max-width: 599.95px) {
    order: 3;
    flex-basis: 100%;
    scroll-snap-type: x proximity;

    & > li {
      scroll-snap-align: start;
    }
  }
`;

export const FaixaRetrato = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-secondary);
  font: inherit;
  cursor: pointer;

  & > span:first-child {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: 50%;
    border: 2px ${({ $oculto }) => ($oculto ? 'dashed' : 'solid')}
      ${({ $cor }) => $cor};
    background: #2a2638;
    color: var(--text-primary);
    font-weight: 700;
    opacity: ${({ $oculto, $derrotado }) =>
      $derrotado ? 0.35 : $oculto ? 0.6 : 1};
    filter: ${({ $derrotado }) => ($derrotado ? 'grayscale(1)' : 'none')};
    box-shadow: ${({ $atual }) =>
      $atual ? '0 0 0 2px #e8cb85, 0 0 10px rgba(232, 203, 133, 0.8)' : 'none'};
  }

  & img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-touch-callout: none;
  }

  &:focus-visible {
    outline: none;
  }

  &:focus-visible > span:first-child {
    box-shadow: 0 0 0 3px var(--color-accent);
  }

  @media (max-width: 599.95px) {
    & > span:first-child {
      width: 36px;
      height: 36px;
    }
  }
`;

export const FaixaValor = styled.span`
  min-width: 1.5em;
  color: ${({ $atual }) => ($atual ? 'var(--color-primary)' : 'var(--text-secondary)')};
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
`;

export const FaixaOcultoIcone = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  display: flex;
  padding: 1px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  color: var(--text-primary);
`;

export const FaixaPilula = styled.span`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(224, 85, 85, 0.18);
  border: 1px solid rgba(224, 85, 85, 0.6);
  color: var(--text-primary);
  font-size: 0.78rem;
  white-space: nowrap;
`;

export const FaixaAcoes = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;

  /* Celular: linha própria; os botões quebram em mais linhas se não couberem. */
  @media (max-width: 599.95px) {
    flex-basis: 100%;
    flex-shrink: 1;
    flex-wrap: wrap;
    min-width: 0;

    & > * {
      flex: 1 1 auto;
    }
  }
`;

// "Movimento congelado pelo mestre" / "Movimento só na sua vez" (jogador).
export const ChipTravamento = styled.div`
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 90px);
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(10, 9, 19, 0.85);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 25;
`;
