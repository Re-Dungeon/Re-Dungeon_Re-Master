import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form, Field } from 'formik';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { loginSchema, getFirebaseErrorMessage } from './utils';
import {
  StyledDialog,
  StyledDialogContent,
  ModalTitle,
  ModalSubtitle,
  StyledTextField,
  SubmitButton,
  ErrorAlert,
} from './styles';

const LoginModal = ({ open, onClose }) => {
  const [firebaseError, setFirebaseError] = useState('');
  const { login } = useAuth();

  const handleClose = () => {
    setFirebaseError('');
    onClose();
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setFirebaseError('');
    try {
      await login(values.email, values.password);
      handleClose();
    } catch (err) {
      setFirebaseError(getFirebaseErrorMessage(err.code));
    } finally {
      setSubmitting(false);
    }
  };

  const loginInitialValues = { email: '', password: '' };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      aria-labelledby="login-modal-title"
    >
      <StyledDialogContent>
        <Box
          sx={{ display: 'flex', justifyContent: 'flex-end', mt: -2, mr: -2 }}
        >
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

        <ModalTitle id="login-modal-title">🔐 Entrar</ModalTitle>
        <ModalSubtitle>Acesse o Re:Master com sua conta</ModalSubtitle>

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
                  <StyledTextField
                    {...field}
                    label="Senha"
                    type="password"
                    fullWidth
                    size="small"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    autoComplete="current-password"
                    slotProps={{ htmlInput: { 'aria-label': 'Senha' } }}
                  />
                )}
              </Field>

              {firebaseError && (
                <ErrorAlert role="alert">{firebaseError}</ErrorAlert>
              )}

              <SubmitButton
                type="submit"
                fullWidth
                disabled={isSubmitting}
                aria-label="Entrar"
              >
                {isSubmitting ? 'Aguarde...' : 'Entrar'}
              </SubmitButton>
            </Form>
          )}
        </Formik>
      </StyledDialogContent>
    </StyledDialog>
  );
};

LoginModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LoginModal;
