import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Field, Form, Formik } from 'formik';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from 'context/AuthContext';
import { getFirebaseErrorMessage, loginSchema } from './utils';
import {
  BrandBadge,
  DialogActionRow,
  ErrorAlert,
  FormRow,
  LinkButton,
  ModalHeader,
  ModalSubtitle,
  ModalTitle,
  PasswordFieldWrapper,
  PasswordToggleButton,
  ResetDialogDescription,
  ResetDialogTitle,
  SecondaryButton,
  StyledDialog,
  StyledDialogContent,
  StyledTextField,
  SubmitButton,
  SuccessAlert,
} from './styles';

const LoginModal = ({ open, onClose }) => {
  const [firebaseError, setFirebaseError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  const { login, resetPassword } = useAuth();

  const loginInitialValues = useMemo(() => ({ email: '', password: '' }), []);

  const handleClose = () => {
    setFirebaseError('');
    setResetError('');
    setResetSuccess('');
    setIsPasswordResetOpen(false);
    setResetEmail('');
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setFirebaseError('');

    try {
      await login(values.email.trim(), values.password, keepConnected);
      handleClose();
    } catch (err) {
      setFirebaseError(getFirebaseErrorMessage(err?.code));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async event => {
    event.preventDefault();
    const normalizedEmail = resetEmail.trim();

    if (!normalizedEmail || !loginSchema.fields.email.isValidSync(normalizedEmail)) {
      setResetError('Informe um e-mail válido.');
      setResetSuccess('');
      return;
    }

    setResetError('');
    setResetSuccess('');
    setIsSendingReset(true);

    try {
      await resetPassword(normalizedEmail);
      setResetSuccess(
        'Se este e-mail estiver associado a uma conta, você receberá instruções para redefinir sua senha.',
      );
      setResetEmail('');
    } catch (err) {
      setResetError(getFirebaseErrorMessage(err?.code, 'reset'));
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <>
      <StyledDialog
        open={open}
        onClose={handleClose}
        aria-labelledby="login-modal-title"
      >
        <StyledDialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2, mr: -2 }}>
            <IconButton
              onClick={handleClose}
              aria-label="Fechar"
              size="small"
              sx={{
                color: 'var(--text-muted)',
                '&:hover': { color: 'var(--text-primary)' },
              }}
            >
              ✕
            </IconButton>
          </Box>

          <ModalHeader>
            <BrandBadge aria-hidden="true">🔐</BrandBadge>
            <ModalTitle id="login-modal-title">Entrar no Re</ModalTitle>
            <ModalSubtitle>Centro de Comando do Mestre</ModalSubtitle>
          </ModalHeader>

          <Formik
            initialValues={loginInitialValues}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field name="email">
                  {({ field }) => (
                    <StyledTextField
                      {...field}
                      label="E-mail"
                      type="email"
                      fullWidth
                      size="small"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      autoComplete="email"
                      slotProps={{ htmlInput: { 'aria-label': 'E-mail' } }}
                    />
                  )}
                </Field>

                <Field name="password">
                  {({ field }) => (
                    <PasswordFieldWrapper>
                      <StyledTextField
                        {...field}
                        label="Senha"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        size="small"
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                        autoComplete="current-password"
                        slotProps={{ htmlInput: { 'aria-label': 'Senha' } }}
                      />
                      <PasswordToggleButton
                        type="button"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setShowPassword(current => !current)}
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </PasswordToggleButton>
                    </PasswordFieldWrapper>
                  )}
                </Field>

                <FormRow>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={keepConnected}
                        onChange={event => setKeepConnected(event.target.checked)}
                        name="keepConnected"
                        size="small"
                        sx={{ color: 'rgba(248, 113, 113, 0.7)', '&.Mui-checked': { color: '#fca5a5' } }}
                      />
                    }
                    label="Manter conectado"
                    sx={{
                      '& .MuiFormControlLabel-label': {
                        color: 'var(--text-secondary)',
                        fontSize: '0.88rem',
                      },
                    }}
                  />

                  <LinkButton
                    type="button"
                    onClick={() => {
                      setIsPasswordResetOpen(true);
                      setResetError('');
                      setResetSuccess('');
                    }}
                    aria-label="Esqueceu a senha?"
                  >
                    Esqueceu a senha?
                  </LinkButton>
                </FormRow>

                {firebaseError && <ErrorAlert role="alert">{firebaseError}</ErrorAlert>}

                <SubmitButton
                  type="submit"
                  fullWidth
                  disabled={isSubmitting}
                  aria-label="Entrar"
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </SubmitButton>
              </Form>
            )}
          </Formik>
        </StyledDialogContent>
      </StyledDialog>

      <StyledDialog
        open={isPasswordResetOpen}
        onClose={() => {
          setIsPasswordResetOpen(false);
          setResetError('');
          setResetSuccess('');
          setResetEmail('');
        }}
        aria-labelledby="reset-password-title"
      >
        <StyledDialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2, mr: -2 }}>
            <IconButton
              onClick={() => {
                setIsPasswordResetOpen(false);
                setResetError('');
                setResetSuccess('');
                setResetEmail('');
              }}
              aria-label="Fechar recuperação de senha"
              size="small"
              sx={{
                color: 'var(--text-muted)',
                '&:hover': { color: 'var(--text-primary)' },
              }}
            >
              ✕
            </IconButton>
          </Box>

          <ModalHeader>
            <BrandBadge aria-hidden="true">✉️</BrandBadge>
            <ResetDialogTitle id="reset-password-title">Recuperar acesso</ResetDialogTitle>
          </ModalHeader>

          <ResetDialogDescription>
            Informe o e-mail associado à sua conta. Se ele estiver cadastrado, você receberá instruções para redefinir sua senha.
          </ResetDialogDescription>

          <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <StyledTextField
              label="E-mail para recuperação"
              type="email"
              fullWidth
              size="small"
              value={resetEmail}
              onChange={event => setResetEmail(event.target.value)}
              autoComplete="email"
              slotProps={{ htmlInput: { 'aria-label': 'E-mail para recuperação' } }}
            />

            {resetError && <ErrorAlert role="alert">{resetError}</ErrorAlert>}
            {resetSuccess && <SuccessAlert role="status">{resetSuccess}</SuccessAlert>}

            <DialogActionRow>
              <SecondaryButton
                type="button"
                onClick={() => {
                  setIsPasswordResetOpen(false);
                  setResetError('');
                  setResetSuccess('');
                  setResetEmail('');
                }}
              >
                Cancelar
              </SecondaryButton>
              <SubmitButton type="submit" disabled={isSendingReset}>
                {isSendingReset ? 'Enviando...' : 'Enviar link de recuperação'}
              </SubmitButton>
            </DialogActionRow>
          </form>
        </StyledDialogContent>
      </StyledDialog>
    </>
  );
};

LoginModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LoginModal;
