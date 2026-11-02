import styled from 'styled-components';

// Estilos das ações do mapa da Fase 3C (cópia nos dois sites — mudou um, mude
// o outro). Query de celular LITERAL para a cópia ficar autocontida.

const MOBILE = '@media (max-width: 599.95px)';

// Templates de área (px do mundo): acima da névoa, abaixo dos tokens.
export const GridAreas = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;
`;

// Chip/cartão de uma área (px do viewport, ancorado no centro-topo).
export const AreaChip = styled.div`
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: min(320px, calc(100% - 16px));
  padding: 2px 4px 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--cor, var(--border-primary));
  background: rgba(10, 9, 19, 0.92);
  color: var(--text-primary);
  font-size: 0.75rem;
  line-height: 1.3;
  z-index: 25;
  pointer-events: auto;

  ${MOBILE} {
    font-size: 0.8rem;
  }
`;

export const AreaChipTexto = styled.button`
  min-height: 28px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  ${MOBILE} {
    min-height: 44px;
  }
`;

export const AreaChipLixeira = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--color-primary);
  }

  ${MOBILE} {
    min-width: 44px;
    min-height: 44px;
  }
`;

// Alça de uma área selecionada (px do viewport, centrada em left/top).
export const AreaAlca = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: var(--cor, var(--color-primary));
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  cursor: grab;
  touch-action: none;
  z-index: 26;
  pointer-events: auto;

  /* Área de toque maior que o desenho. */
  &::after {
    content: '';
    position: absolute;
    inset: -12px;
  }

  ${MOBILE} {
    width: 24px;
    height: 24px;

    &::after {
      inset: -10px;
    }
  }
`;

export const PopoverCorpo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 280px;
  max-width: 100%;
  padding: 12px;

  ${MOBILE} {
    width: min(280px, calc(100vw - 48px));
  }
`;

export const CoresLinha = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const CorBotao = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  background: var(--cor);
  cursor: pointer;

  &[aria-pressed='true'] {
    border-color: #fff;
  }

  ${MOBILE} {
    width: 44px;
    height: 44px;
  }
`;

// Ações do token (px do viewport), acima do token.
export const TokenAcoesCaixa = styled.div`
  position: absolute;
  transform: translate(-50%, -100%);
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--border-primary);
  background: rgba(10, 9, 19, 0.92);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 28;
  pointer-events: auto;
`;

export const TokenAcaoBotao = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.8rem;
  cursor: pointer;

  &:hover {
    background: var(--bg-card);
  }

  ${MOBILE} {
    min-height: 44px;
  }
`;

export const RolarItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 6px 10px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: var(--border-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const RolarFormula = styled.span`
  color: var(--text-secondary);
  font-size: 0.8rem;
  white-space: nowrap;
`;

export const RolarMotivo = styled.span`
  color: var(--text-muted);
  font-size: 0.75rem;
`;

// Aviso do modo Área armado (px do viewport, topo central).
export const ChipModoArea = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 80px);
  padding: 2px 4px 2px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-primary);
  background: rgba(10, 9, 19, 0.92);
  color: var(--text-primary);
  font-size: 0.8rem;
  z-index: 26;

  ${MOBILE} {
    left: 10px;
    transform: none;
    max-width: calc(100% - 70px);

    & .MuiIconButton-root {
      width: 44px;
      height: 44px;
    }
  }
`;
