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
    border-radius: 18px !important;
    min-width: 380px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.68) !important;
  }
`;

export const StyledDialogContent = styled(DialogContent)`
  padding: 32px !important;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

export const ModalTitle = styled(Typography)`
  color: var(--text-primary) !important;
  font-weight: 800 !important;
  font-size: 1.5rem !important;
  text-align: center;
`;

export const ModalSubtitle = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.9rem !important;
  text-align: center;
  margin-top: -12px !important;
`;

export const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    color: var(--text-primary) !important;
    background: rgba(255, 255, 255, 0.04) !important;
    border-radius: 12px !important;

    fieldset {
      border-color: var(--border-primary) !important;
    }

    &:hover fieldset {
      border-color: var(--border-hover) !important;
    }

    &.Mui-focused fieldset {
      border-color: var(--color-accent) !important;
      box-shadow: 0 0 0 1px rgba(196, 58, 47, 0.18) !important;
    }
  }

  .MuiInputLabel-root {
    color: var(--text-secondary) !important;
    &.Mui-focused {
      color: var(--color-accent) !important;
    }
  }

  .MuiFormHelperText-root {
    color: #f87171 !important;
  }
`;

export const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent)) !important;
  color: #fff !important;
  padding: 10px !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28) !important;

  &:hover {
    opacity: 0.96 !important;
    transform: translateY(-1px) !important;
  }

  &:disabled {
    opacity: 0.55 !important;
  }
`;

export const GoogleButton = styled(Button)`
  border: 1px solid var(--border-primary) !important;
  color: var(--text-secondary) !important;
  background: rgba(255, 255, 255, 0.03) !important;
  padding: 10px !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  transition: all 0.2s ease !important;

  &:hover {
    border-color: var(--border-hover) !important;
    background: rgba(255, 255, 255, 0.06) !important;
    color: var(--text-primary) !important;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 0.85rem;

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
  color: var(--text-secondary) !important;
  font-size: 0.9rem !important;

  span {
    color: var(--color-accent) !important;
    cursor: pointer;
    font-weight: 700;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const ErrorAlert = styled.div`
  background: rgba(248, 113, 113, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f87171;
  font-size: 0.9rem;
  text-align: center;
`;
