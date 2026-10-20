import styled from 'styled-components';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

export const StyledDialog = styled(Dialog)`
  .MuiBackdrop-root {
    background: rgba(6, 5, 8, 0.72) !important;
    backdrop-filter: blur(2px);
  }

  .MuiDialog-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(18px, 3vw, 32px);
    background:
      linear-gradient(rgba(7, 5, 9, 0.62), rgba(7, 5, 9, 0.62)),
      url('https://i.imgur.com/pKAo4Ox.jpeg') center center / cover no-repeat;
  }

  .MuiDialog-paper {
    margin: 0 !important;
    width: min(100%, 440px) !important;
    max-width: calc(100vw - 32px) !important;
    height: auto !important;
    min-height: 0 !important;
    border-radius: 22px !important;
    background: linear-gradient(180deg, rgba(19, 12, 15, 0.82), rgba(10, 7, 11, 0.9)) !important;
    box-shadow: 0 28px 80px rgba(0, 0, 0, 0.52), inset 0 0 0 1px rgba(227, 168, 109, 0.1) !important;
    overflow: visible !important;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 !important;
  }
`;

export const StyledDialogContent = styled(DialogContent)`
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 28px 26px 20px !important;
  background: transparent;
  border: 1px solid rgba(196, 121, 60, 0.38);
  border-radius: 22px;
  box-shadow: inset 0 0 0 1px rgba(227, 168, 109, 0.1);
  overflow-x: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 10px;
    border: 1px solid rgba(196, 121, 60, 0.14);
    border-radius: 18px;
    pointer-events: none;
  }

  &::after {
    inset: auto 22px 12px 22px;
    height: 1px;
    border: none;
    background: linear-gradient(90deg, transparent, rgba(213, 171, 109, 0.5), transparent);
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
`;

export const BrandBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  border-radius: 18px;
  background: rgba(45, 15, 15, 0.75);
  border: 1px solid rgba(221, 164, 96, 0.36);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.28);
  color: #fff;
  font-size: 1.7rem;
`;

export const BrandLogo = styled.img`
  display: block;
  width: min(100%, 230px);
  height: auto;
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.38));
`;

export const BrandDivider = styled.div`
  width: min(100%, 220px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(214, 173, 112, 0.95), transparent);
  margin-top: -2px;
`;

export const ModalTitle = styled(Typography)`
  color: var(--text-primary) !important;
  font-weight: 800 !important;
  font-size: clamp(2rem, 2.2vw, 2.6rem) !important;
  letter-spacing: -0.04em !important;
  text-align: center;
  line-height: 1.1 !important;
`;

export const ModalSubtitle = styled(Typography)`
  color: var(--text-secondary) !important;
  font-size: 0.92rem !important;
  text-align: center;
  line-height: 1.6 !important;
  max-width: 350px;
  margin-top: -4px !important;
`;

export const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-root {
    color: var(--text-primary) !important;
    background: rgba(13, 11, 14, 0.74) !important;
    border-radius: 12px !important;

    fieldset {
      border-color: rgba(196, 121, 60, 0.38) !important;
      border-width: 1px !important;
    }

    &:hover fieldset {
      border-color: rgba(210, 150, 92, 0.78) !important;
    }

    &.Mui-focused fieldset {
      border-color: rgba(227, 168, 109, 0.9) !important;
      box-shadow: 0 0 0 1px rgba(227, 168, 109, 0.2) !important;
    }

    .MuiInputAdornment-root {
      color: rgba(214, 173, 112, 0.9) !important;
    }
  }

  .MuiInputLabel-root {
    color: var(--text-secondary) !important;
    &.Mui-focused {
      color: #e3a86d !important;
    }
  }

  .MuiFormHelperText-root {
    margin-left: 0 !important;
    color: #f4b3a3 !important;
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
  top: 9px;
  right: 8px;
  color: rgba(214, 173, 112, 0.8) !important;
  padding: 6px !important;
  z-index: 1;

  &:hover {
    color: #f5d3a5 !important;
    background: rgba(255, 255, 255, 0.04) !important;
  }
`;

export const FormRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const LinkButton = styled(Button)`
  min-width: unset !important;
  padding: 0 !important;
  color: #f4c98d !important;
  text-transform: none !important;
  font-weight: 700 !important;
  font-size: 0.84rem !important;
  letter-spacing: 0.01em;

  &:hover {
    background: transparent !important;
    text-decoration: underline;
  }
`;

export const SubmitButton = styled(Button)`
  background: linear-gradient(135deg, rgba(120, 26, 29, 0.98), rgba(176, 42, 42, 0.96)) !important;
  color: #fff !important;
  padding: 12px 16px !important;
  font-weight: 800 !important;
  font-size: 0.96rem !important;
  border-radius: 12px !important;
  letter-spacing: 0.04em !important;
  text-transform: uppercase !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 12px 28px rgba(120, 26, 29, 0.45), inset 0 0 0 1px rgba(226, 184, 120, 0.35) !important;

  &:hover {
    filter: brightness(1.06) !important;
    transform: translateY(-1px) !important;
  }

  &:disabled {
    opacity: 0.6 !important;
  }
`;

export const ErrorAlert = styled.div`
  background: rgba(190, 38, 38, 0.12);
  border: 1px solid rgba(245, 110, 110, 0.3);
  border-radius: 12px;
  padding: 12px 14px;
  color: #f6b3b3;
  font-size: 0.88rem;
  line-height: 1.4;
  text-align: center;
`;

export const SuccessAlert = styled.div`
  background: rgba(30, 181, 119, 0.1);
  border: 1px solid rgba(92, 214, 154, 0.28);
  border-radius: 12px;
  padding: 12px 14px;
  color: #c5f0dc;
  font-size: 0.88rem;
  line-height: 1.4;
  text-align: center;
`;

export const LoginFooterText = styled.div`
  margin-top: 2px;
  margin-bottom: 22px;
  color: rgba(218, 196, 164, 0.82);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
  opacity: 0.9;
`;

export const DialogActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
`;

export const SecondaryButton = styled(Button)`
  border: 1px solid rgba(196, 121, 60, 0.35) !important;
  color: var(--text-secondary) !important;
  background: rgba(20, 16, 19, 0.45) !important;
  border-radius: 10px !important;
  text-transform: none !important;

  &:hover {
    border-color: rgba(218, 164, 92, 0.7) !important;
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
