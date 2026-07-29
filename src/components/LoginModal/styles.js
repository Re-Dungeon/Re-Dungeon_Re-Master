import styled from 'styled-components';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-primary) !important;
    border-radius: 16px !important;
    min-width: 380px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6) !important;
  }
`;

export const StyledDialogContent = styled(DialogContent)`
  padding: 32px !important;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ModalTitle = styled(Typography)`
  color: var(--text-primary) !important;
  font-weight: 700 !important;
  font-size: 1.4rem !important;
  text-align: center;
`;

export const ModalSubtitle = styled(Typography)`
  color: var(--text-muted) !important;
  font-size: 0.85rem !important;
  text-align: center;
  margin-top: -12px !important;
`;

export const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    color: var(--text-primary) !important;
    background: rgba(255, 255, 255, 0.04) !important;
    border-radius: 8px !important;

    fieldset {
      border-color: var(--border-primary) !important;
    }

    &:hover fieldset {
      border-color: var(--border-hover) !important;
    }

    &.Mui-focused fieldset {
      border-color: var(--color-primary) !important;
    }
  }

  .MuiInputLabel-root {
    color: var(--text-muted) !important;
    &.Mui-focused {
      color: var(--color-primary) !important;
    }
  }

  .MuiFormHelperText-root {
    color: #f87171 !important;
  }
`;

export const SubmitButton = styled(Button)`
  background: var(--color-primary) !important;
  color: #fff !important;
  padding: 10px !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  border-radius: 8px !important;
  transition: opacity 0.2s ease !important;

  &:hover {
    opacity: 0.88 !important;
  }

  &:disabled {
    opacity: 0.5 !important;
  }
`;

export const GoogleButton = styled(Button)`
  border: 1px solid var(--border-primary) !important;
  color: var(--text-secondary) !important;
  background: transparent !important;
  padding: 10px !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;

  &:hover {
    border-color: var(--border-hover) !important;
    background: rgba(255, 255, 255, 0.04) !important;
    color: var(--text-primary) !important;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.8rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-primary);
  }
`;

export const ToggleText = styled(Typography)`
  text-align: center;
  color: var(--text-muted) !important;
  font-size: 0.85rem !important;

  span {
    color: var(--color-accent) !important;
    cursor: pointer;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const ErrorAlert = styled.div`
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  color: #f87171;
  font-size: 0.85rem;
  text-align: center;
`;
