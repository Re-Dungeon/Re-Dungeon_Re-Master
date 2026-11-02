import styled from 'styled-components';

// Estilos das camadas do mapa da Fase 3B (cópia nos dois sites — mudou um,
// mude o outro). Query de celular LITERAL para a cópia ficar autocontida.

const MOBILE = '@media (max-width: 599.95px)';

const camadaSvg = `
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;
`;

export const CamadaParedes = styled.svg`
  ${camadaSvg}
`;

export const CamadaNevoa = styled.svg`
  ${camadaSvg}
`;

export const CamadaDesenhos = styled.svg`
  ${camadaSvg}
`;

// Pino de marcador, em px do MUNDO (left/top/width/height inline).
export const PinoMarcador = styled.button`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 2px solid rgba(0, 0, 0, 0.45);
  border-radius: 50%;
  background: var(--cor, #e8cb85);
  color: #fff;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);

  &[data-secreto='true'] {
    border: 2px dashed #fff;
  }

  & svg {
    width: 62%;
    height: 62%;
    filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.7));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

export const PinoCadeado = styled.span`
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45%;
  height: 45%;
  border-radius: 50%;
  background: #0a0913;
  color: #fff;

  & svg {
    width: 80%;
    height: 80%;
  }
`;

// Cartão do marcador, em px do VIEWPORT.
export const CartaoMarcador = styled.div`
  position: absolute;
  transform: translate(-50%, -100%);
  width: 260px;
  max-width: calc(100% - 16px);
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-primary);
  background: rgba(10, 9, 19, 0.96);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.45;
  z-index: 28;
  pointer-events: auto;

  ${MOBILE} {
    width: 240px;
  }
`;

export const CartaoCabecalho = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);

  & strong {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

export const CartaoIcone = styled.span`
  display: flex;
  flex: none;
  color: var(--cor, #e8cb85);
`;

export const CartaoTexto = styled.p`
  margin: 6px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const CartaoSelo = styled.span`
  display: inline-block;
  margin-top: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: rgba(232, 203, 133, 0.15);
  color: var(--color-primary);
  font-size: 0.72rem;
`;

export const CartaoFechar = styled.button`
  flex: none;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    background: var(--bg-card);
  }

  ${MOBILE} {
    width: 44px;
    height: 44px;
  }
`;

// Barra de cores do modo desenhar (px do viewport, base central).
export const PaletaCaixa = styled.div`
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  max-width: calc(100% - 16px);
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-primary);
  background: rgba(10, 9, 19, 0.92);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 30;
  pointer-events: auto;
`;

export const PaletaCor = styled.button`
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: var(--cor);
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(232, 203, 133, 0.4);
  }

  ${MOBILE} {
    width: 44px;
    height: 44px;
  }
`;

export const PaletaAcao = styled.button`
  padding: 4px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.78rem;
  cursor: pointer;

  &:hover {
    border-color: var(--border-hover);
  }

  ${MOBILE} {
    min-height: 44px;
  }
`;
