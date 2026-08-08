import styled from 'styled-components';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';

export const StyledAppBar = styled(AppBar)`
  background: rgba(17, 20, 26, 0.96) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.32) !important;
  position: static !important;
  backdrop-filter: blur(12px) !important;
`;

export const PageTitle = styled(Typography)`
  font-weight: 800 !important;
  padding-left: 16px !important;
  position: relative !important;
  color: var(--text-primary) !important;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 26px;
    background: linear-gradient(180deg, var(--color-primary), var(--color-accent));
    border-radius: 6px;
  }
`;
