import styled from 'styled-components';

export const ChatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(12px);
`;

export const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-primary);
`;

export const ListaMensagens = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
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
  border: 1px solid
    ${props => (props.$mestre ? 'rgba(196, 58, 47, 0.45)' : 'var(--border-primary)')};
  background: ${props =>
    props.$mestre
      ? 'rgba(196, 58, 47, 0.08)'
      : props.$minha
        ? 'rgba(91, 124, 250, 0.14)'
        : 'rgba(255, 255, 255, 0.04)'};

  &:hover .chat-acoes {
    opacity: 1;
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
  border: 1px solid rgba(196, 58, 47, 0.45);
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
`;

export const ComposerWrapper = styled.form`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-primary);
`;

export const PreviewImagem = styled.img`
  display: block;
  max-width: 100%;
  max-height: 240px;
  margin: 12px auto 0;
  border-radius: 8px;
`;
