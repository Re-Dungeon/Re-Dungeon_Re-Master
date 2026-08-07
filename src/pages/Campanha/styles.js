import styled from 'styled-components';
import Paper from '@mui/material/Paper';

export const CampanhaCard = styled(Paper)`
  padding: 24px !important;
  background: linear-gradient(180deg, rgba(8, 10, 18, 0.96), rgba(16, 20, 34, 0.98)) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22) !important;
  backdrop-filter: blur(18px) !important;
  position: relative;
  overflow: hidden;
  transition: transform 280ms ease, border-color 280ms ease, box-shadow 280ms ease !important;

  &:before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.06), transparent 28%);
    opacity: 0.55;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(255, 255, 255, 0.16) !important;
    box-shadow: 0 28px 70px rgba(0, 0, 0, 0.28) !important;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

export const CampanhaCardAtiva = styled(CampanhaCard)`
  border-color: rgba(196, 58, 47, 0.55) !important;
  box-shadow: 0 0 0 1px rgba(196, 58, 47, 0.18) !important, 0 26px 72px rgba(196, 58, 47, 0.08) !important;

  &:hover {
    border-color: rgba(196, 58, 47, 0.65) !important;
    box-shadow: 0 0 0 1px rgba(196, 58, 47, 0.26) !important, 0 34px 80px rgba(196, 58, 47, 0.14) !important;
  }
`;
