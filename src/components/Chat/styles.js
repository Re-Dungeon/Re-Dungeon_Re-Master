import styled from 'styled-components';

// Celular (abaixo do `sm` do MUI). Literal aqui — e não importado de
// common/styles — para a cópia do Re:Master seguir autocontida.
const MOBILE = '@media (max-width: 599.95px)';

export const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  backdrop-filter: blur(12px);
`;

export const ChatHeader = styled.div`
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
  padding: ${props => (props.$compact ? '0 14px 12px' : '12px 14px')};
  border-bottom: 1px solid var(--border-primary);
  background: linear-gradient(180deg, rgba(17, 15, 27, 0.96), rgba(10, 9, 19, 0.92));
  box-shadow: inset 0 -1px 0 rgba(var(--chat-destaque-rgb, 232, 203, 133), 0.08);

  ${MOBILE} {
    gap: 8px;
    padding: ${props => (props.$compact ? '0 10px 8px' : '10px 10px 8px')};
  }
`;

// Envolve a lista para ancorar a pílula "Novas mensagens" sobre ela.
export const ListaArea = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
`;

export const NovasMensagensPilula = styled.button`
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-hover);
  background: var(--bg-secondary);
  color: var(--color-primary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-md);

  &:hover {
    background: rgba(232, 203, 133, 0.14);
  }
`;

export const ListaMensagens = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  overscroll-behavior-x: none;
  touch-action: pan-y;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;

  ${MOBILE} {
    gap: 8px;
    padding: 10px 8px;
  }
`;

export const ListaVazia = styled.div`
  margin: auto;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.9rem;
`;

export const MensagemLinha = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  flex-direction: ${props => (props.$minha ? 'row-reverse' : 'row')};
`;

export const MensagemBalao = styled.div`
  position: relative;
  max-width: min(560px, 80%);
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px ${props => (props.$sussurro ? 'dashed' : 'solid')}
    ${props =>
      props.$sussurro
        ? 'rgba(177, 140, 255, 0.6)'
        : props.$mestre
          ? 'rgba(var(--chat-destaque-rgb, 232, 203, 133), 0.45)'
          : 'var(--border-primary)'};
  background: ${props =>
    props.$sussurro
      ? 'rgba(177, 140, 255, 0.1)'
      : props.$mestre
        ? 'rgba(var(--chat-destaque-rgb, 232, 203, 133), 0.08)'
        : props.$minha
          ? 'rgba(91, 124, 250, 0.14)'
          : 'rgba(255, 255, 255, 0.04)'};

  &:hover .chat-acoes {
    opacity: 1;
  }

  ${MOBILE} {
    max-width: 85%;

    /* Ação de apagar sempre visível no celular: abre espaço para ela. */
    &:has(.chat-acoes) {
      padding-right: 36px;
    }
  }
`;

export const MensagemCabecalho = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
  padding-right: 24px;
`;

export const MensagemAutor = styled.span`
  font-weight: 700;
  font-size: 0.85rem;
  color: ${props => (props.$mestre ? 'var(--color-primary)' : 'var(--text-primary)')};
`;

// Etiqueta "NPC"/"Criatura" quando o mestre fala como um personagem da mesa.
export const MensagemPersona = styled.span`
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid rgba(var(--chat-destaque-rgb, 232, 203, 133), 0.45);
  color: var(--color-primary);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.5;
`;

export const MensagemHorario = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
`;

// Linha "🤫 Sussurro para X" / "🤫 X sussurrou" no balão do sussurro.
export const MensagemSussurro = styled.div`
  margin-bottom: 2px;
  color: rgb(197, 170, 255);
  font-size: 0.74rem;
  font-style: italic;
  overflow-wrap: anywhere;
`;

export const MensagemTexto = styled.div`
  color: var(--text-secondary);
  font-size: 0.92rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const MensagemImagem = styled.img`
  display: block;
  max-width: 100%;
  max-height: 320px;
  margin-top: 4px;
  border-radius: 8px;
  cursor: zoom-in;
`;

export const MensagemLink = styled.a`
  color: var(--color-accent);
  overflow-wrap: anywhere;
  font-size: 0.85rem;
`;

export const MensagemAcoes = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;

  &:focus-within {
    opacity: 1;
  }

  /* Sem hover no toque: sempre visível (discreto) e com alvo maior. */
  ${MOBILE} {
    opacity: 0.55;

    & .MuiIconButton-root {
      padding: 8px;
    }
  }
`;

// Compositor em duas linhas: ações (imagem, dados, macros) acima e o campo
// + Enviar abaixo — o campo fica com a largura toda mesmo em telas estreitas
// e no painel de chat do Grid.
export const ComposerWrapper = styled.form`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 6px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--border-primary);
  background: rgba(10, 9, 19, 0.82);

  ${MOBILE} {
    padding: 8px 8px calc(12px + env(safe-area-inset-bottom));
  }
`;

export const ComposerAcoes = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: -6px;
  flex-wrap: wrap;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  ${MOBILE} {
    margin-left: -4px;

    & .MuiIconButton-root {
      width: 44px;
      height: 44px;
    }
  }
`;

export const ComposerEntrada = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;

  ${MOBILE} {
    gap: 6px;

    & .MuiIconButton-root {
      width: 44px;
      height: 44px;
    }
  }
`;

export const PreviewImagem = styled.img`
  display: block;
  max-width: 100%;
  max-height: 240px;
  margin: 12px auto 0;
  border-radius: 8px;
`;

// ── Rolagem de dados ─────────────────────────────────────────────────────

export const GradeDados = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    cursor: pointer;
    font: inherit;
    font-size: 0.8rem;
    transition:
      border-color 0.15s ease,
      color 0.15s ease;

    &:hover,
    &:focus-visible {
      color: var(--color-primary);
      border-color: var(--border-hover);
      outline: none;
    }
  }
`;

export const LinhaDado = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-secondary);

  > span {
    min-width: 40px;
    font-weight: 700;
  }
`;

// Rolagem é uma linha compacta (sem balão), no estilo de log de mesa virtual.
export const RolagemLinha = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 36px 6px 10px;
  border-radius: 8px;
  font-size: 0.92rem;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.02);
  border: 1px ${props => (props.$secreta ? 'dashed' : 'solid')}
    ${props => (props.$secreta ? 'rgba(180, 180, 192, 0.45)' : 'transparent')};

  &:hover .chat-acoes {
    opacity: 1;
  }
`;

export const RolagemAutor = styled.strong`
  color: ${props => (props.$mestre ? 'var(--color-primary)' : 'var(--color-accent)')};
`;

export const RolagemExpressao = styled.span`
  color: var(--color-accent);
`;

export const RolagemRotulo = styled.span`
  color: var(--text-primary);
  font-weight: 600;
  overflow-wrap: anywhere;
`;

export const RolagemTotal = styled.strong`
  color: var(--text-primary);
  font-size: 1.05rem;
`;

export const RolagemDetalhe = styled.span`
  color: #f0a65a;
`;

export const ResultadoDado = styled.span`
  font-weight: ${props => (props.$critico ? 700 : 400)};
  color: ${props =>
    props.$critico === 'sucesso'
      ? '#5fd38d'
      : props.$critico === 'falha'
        ? '#ff6b6b'
        : 'inherit'};
`;

export const EtiquetaSecreta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px dashed rgba(180, 180, 192, 0.6);
  color: var(--text-muted);
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

// ── Macros Lua ───────────────────────────────────────────────────────────

export const MacroItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
`;

export const PreviaMacro = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px dashed
    ${props => (props.$erro ? 'rgba(255, 107, 107, 0.6)' : 'var(--border-hover)')};
  color: ${props => (props.$erro ? '#ff8f8f' : 'var(--text-secondary)')};
  font-family: Consolas, 'Fira Code', monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const MensagemMacroTitulo = styled.div`
  margin-bottom: 4px;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const MensagemMacroTexto = styled.div`
  color: var(--text-secondary);
  font-family: Consolas, 'Fira Code', monospace;
  font-size: 0.8rem;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

// ── Combate do grid ──────────────────────────────────────────────────────

// Mensagem de combate: cartão estreito e centralizado, como um aviso da mesa.
export const CombateLinha = styled.div`
  display: flex;
  justify-content: center;
`;

export const CombateCartao = styled.div`
  position: relative;
  width: min(320px, 90%);
  box-sizing: border-box;
  padding: 8px 32px 6px;
  border-radius: 10px;
  border: 1px solid rgba(232, 203, 133, 0.6);
  background: rgba(var(--chat-destaque-rgb, 232, 203, 133), 0.08);
  color: var(--text-secondary);
  font-size: 0.88rem;
  text-align: center;

  &:hover .chat-acoes {
    opacity: 1;
  }

  ${MOBILE} {
    width: 92%;
  }
`;

export const CombateTitulo = styled.div`
  color: var(--color-primary);
  font-weight: 700;
  letter-spacing: 0.02em;
`;

export const CombateIniciativa = styled.ol`
  margin: 6px 0 2px;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;

  li + li {
    margin-top: 1px;
  }
`;

export const CombateTexto = styled.div`
  margin-top: 2px;
  color: var(--text-primary);
`;

export const CombateRodape = styled.div`
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 0.7rem;
`;
