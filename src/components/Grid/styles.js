import styled, { css } from 'styled-components';

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
  user-select: none;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
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

  /* Celular: alvos de toque de 44px. */
  @media (max-width: 599.95px) {
    & .MuiIconButton-root {
      width: 44px;
      height: 44px;
    }
  }
`;

export const GridAviso = styled.div`
  position: absolute;
  left: 50%;
  top: 16px;
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
