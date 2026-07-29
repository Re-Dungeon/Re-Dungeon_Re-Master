import styled from 'styled-components';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';

export const StyledAppBar = styled(AppBar)`
  background: var(--color-darker) !important;
  border-bottom: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-md) !important;
  position: static !important;
`;

export const PageTitle = styled(Typography)`
  font-weight: 600 !important;
  padding-left: 16px !important;
  position: relative !important;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 24px;
    background: linear-gradient(
      180deg,
      var(--color-primary),
      var(--color-accent)
    );
    border-radius: 4px;
  }
`;
