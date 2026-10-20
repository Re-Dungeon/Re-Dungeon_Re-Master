import styled from 'styled-components';
import Paper from '@mui/material/Paper';

export const CampanhaCard = styled(Paper)`
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 380px !important;
  padding: 0 !important;
  background: linear-gradient(180deg, rgba(10, 12, 18, 0.96), rgba(17, 22, 31, 0.98)) !important;
  border: 1px solid rgba(178, 188, 205, 0.2) !important;
  border-radius: 20px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.26) !important;
  position: relative;
  overflow: hidden;
  transition: transform 280ms ease, border-color 280ms ease, box-shadow 280ms ease, filter 280ms ease !important;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent 35%, transparent 65%, rgba(196,58,47,0.04));
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(196, 58, 47, 0.34) !important;
    box-shadow: 0 18px 32px rgba(0, 0, 0, 0.3) !important;
    filter: brightness(1.02);
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

export const CampanhaCardAtiva = styled(CampanhaCard)`
  border-color: rgba(196, 58, 47, 0.7) !important;
  box-shadow: 0 0 0 1px rgba(196, 58, 47, 0.28), 0 22px 54px rgba(196, 58, 47, 0.16) !important;

  &:hover {
    border-color: rgba(196, 58, 47, 0.9) !important;
    box-shadow: 0 0 0 1px rgba(196, 58, 47, 0.42), 0 26px 62px rgba(196, 58, 47, 0.22) !important;
  }
`;
