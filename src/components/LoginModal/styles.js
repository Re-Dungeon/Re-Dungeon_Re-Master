import styled from 'styled-components';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export const StyledDialog = styled(Dialog)`
  .MuiDialog-paper {
    background: rgba(9, 14, 25, 0.94) !important;
    border: 1px solid rgba(248, 113, 113, 0.24) !important;
    border-radius: 20px !important;
    min-width: min(92vw, 420px) !important;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7) !important;
    overflow: hidden !important;
    transition: transform 0.2s ease, opacity 0.2s ease !important;
  }
`;

export const StyledDialogContent = styled(DialogContent)`
  padding: 28px 28px 24px !important;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
`;

export const BrandBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.9), rgba(153, 27, 27, 0.7));
  border: 1px solid rgba(248, 113, 113, 0.45);
  box-shadow: 0 10px 30px rgba(127, 29, 29, 0.35);
  color: #fff;
  font-size: 1.5rem;
`;

export const ModalTitle = styled(Typography)`
  color: var(--text-primary) !important;
  font-weight: 800 !important;
  font-size: 1.7rem !important;
  letter-spacing: -0.04em !important;
  text-align: center;
`;

export const ModalSubtitle = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.92rem !important;
  text-align: center;
  margin-top: -4px !important;
`;

export const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    color: var(--text-primary) !important;
    background: rgba(255, 255, 255, 0.03) !important;
    border-radius: 12px !important;

    fieldset {
      border-color: rgba(148, 163, 184, 0.35) !important;
    }

    &:hover fieldset {
      border-color: rgba(248, 113, 113, 0.5) !important;
    }

    &.Mui-focused fieldset {
      border-color: rgba(248, 113, 113, 0.78) !important;
      box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.2) !important;
    }
  }

  .MuiInputLabel-root {
    color: var(--text-secondary) !important;
    &.Mui-focused {
      color: #fca5a5 !important;
    }
  }

  .MuiFormHelperText-root {
    margin-left: 0 !important;
    color: #fca5a5 !important;
  }
`;

export const PasswordFieldWrapper = styled.div`
  position: relative;

  .MuiFormControl-root {
    width: 100%;
  }
`;

export const PasswordToggleButton = styled(IconButton)`
  position: absolute !important;
  top: 8px;
  right: 8px;
  color: var(--text-secondary) !important;
  z-index: 1;

  &:hover {
    color: var(--text-primary) !important;
  }
`;

export const FormRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const KeepConnectedLabel = styled(FormControlLabel)`
  margin: 0 !important;

  .MuiFormControlLabel-label {
    color: var(--text-secondary) !important;
    font-size: 0.88rem !important;
  }

  .MuiCheckbox-root {
    color: rgba(248, 113, 113, 0.7) !important;
  }
`;

export const LinkButton = styled(Button)`
  min-width: unset !important;
  padding: 0 !important;
  color: #fca5a5 !important;
  text-transform: none !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;

  &:hover {
    text-decoration: underline;
    background: transparent !important;
  }
`;

export const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%) !important;
  color: #fff !important;
  padding: 10px !important;
  font-weight: 700 !important;
  font-size: 0.95rem !important;
  border-radius: 12px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 14px 34px rgba(124, 58, 58, 0.3) !important;

  &:hover {
    opacity: 0.96 !important;
    transform: translateY(-1px) !important;
  }

  &:disabled {
    opacity: 0.55 !important;
  }
`;

export const ErrorAlert = styled.div`
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 12px;
  padding: 12px 14px;
  color: #fca5a5;
  font-size: 0.88rem;
  line-height: 1.4;
  text-align: center;
`;

export const SuccessAlert = styled.div`
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: 12px;
  padding: 12px 14px;
  color: #bbf7d0;
  font-size: 0.88rem;
  line-height: 1.4;
  text-align: center;
`;

export const DialogActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
`;

export const SecondaryButton = styled(Button)`
  border: 1px solid rgba(148, 163, 184, 0.35) !important;
  color: var(--text-secondary) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  border-radius: 10px !important;
  text-transform: none !important;

  &:hover {
    border-color: rgba(248, 113, 113, 0.45) !important;
    color: var(--text-primary) !important;
  }
`;

export const ResetDialogTitle = styled(Typography)`
  color: var(--text-primary) !important;
  font-weight: 700 !important;
  font-size: 1.3rem !important;
`;

export const ResetDialogDescription = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.92rem !important;
  line-height: 1.5 !important;
`;
