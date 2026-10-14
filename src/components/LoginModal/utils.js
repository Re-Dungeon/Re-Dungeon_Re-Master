import * as Yup from 'yup';

export const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('E-mail inválido')
    .required('E-mail é obrigatório'),
  password: Yup.string()
    .trim()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Senha é obrigatória'),
});

export const FIREBASE_ERROR_MESSAGES = {
  'auth/invalid-email': 'E-mail inválido',
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/user-disabled': 'Esta conta está desativada. Entre em contato com o administrador.',
  'auth/email-already-in-use': 'Este e-mail já está em uso.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/network-request-failed': 'Falha de conexão. Verifique a sua internet e tente novamente.',
  'auth/popup-closed-by-user': 'Login com Google cancelado.',
  'auth/internal-error': 'Erro inesperado ao entrar. Tente novamente.',
};

export const PASSWORD_RESET_ERROR_MESSAGES = {
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/network-request-failed': 'Falha de conexão. Verifique a sua internet e tente novamente.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/user-not-found': 'Se este e-mail estiver associado a uma conta, você receberá instruções para redefinir sua senha.',
};

export const getFirebaseErrorMessage = (code, context = 'login') => {
  const messages =
    context === 'reset' ? PASSWORD_RESET_ERROR_MESSAGES : FIREBASE_ERROR_MESSAGES;

  if (messages[code]) {
    return messages[code];
  }

  return context === 'reset'
    ? 'Não foi possível enviar o link de recuperação neste momento.'
    : 'Ocorreu um erro. Tente novamente.';
};
