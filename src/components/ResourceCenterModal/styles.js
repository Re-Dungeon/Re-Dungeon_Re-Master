import styled from 'styled-components';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export const StyledDialogContent = styled(DialogContent)`
  padding: 30px !important;
  display: flex;
  flex-direction: column;
  gap: 28px;
`;

export const ModalHeader = styled(Box)`
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

export const ModalTitle = styled(Typography)`
  color: #ffffff !important;
  font-weight: 800 !important;
  font-size: 2rem !important;
  line-height: 1.05 !important;
`;

export const ModalSubtitle = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.95rem !important;
  max-width: 680px;
  line-height: 1.5 !important;
  margin-top: 6px !important;
`;

export const CardsGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;

  @media (max-width: 880px) {
    grid-template-columns: 1fr;
  }
`;

export const ResourceCard = styled(Box)`
  display: flex;
  flex-direction: column;
  min-height: 360px;
  min-width: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.28);
  transition: transform 250ms ease, border-color 250ms ease, box-shadow 250ms ease, background 250ms ease;

  &:hover {
    transform: translateY(-4px) scale(1.03);
    border-color: rgba(196, 58, 47, 0.35);
    box-shadow: 0 28px 76px rgba(196, 58, 47, 0.18);
    background: radial-gradient(circle at top left, rgba(196, 58, 47, 0.08), transparent 45%);
  }

  &:hover img {
    transform: scale(1.03);
  }
`;

export const ResourceCardImage = styled.img`
  width: 100%;
  height: 60%;
  min-height: 220px;
  object-fit: cover;
  transition: transform 250ms ease;
  display: block;
`;

export const ResourceCardContent = styled(Box)`
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
`;

export const ResourceCardTitle = styled(Typography)`
  color: #ffffff !important;
  font-size: 1.2rem !important;
  font-weight: 700 !important;
`;

export const ResourceCardDescription = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.95rem !important;
  line-height: 1.6 !important;
`;

export const ResourceCardButton = styled(Button)`
  margin-top: auto !important;
  align-self: flex-start !important;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent)) !important;
  color: #fff !important;
  padding: 12px 22px !important;
  border-radius: 14px !important;
  font-weight: 700 !important;
  text-transform: none !important;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.25) !important;
  transition: transform 250ms ease, filter 250ms ease !important;

  &:hover {
    transform: translateY(-1px) !important;
    filter: brightness(1.05) !important;
  }
`;

export const ModalFooter = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.9rem !important;
  text-align: center !important;
`;
