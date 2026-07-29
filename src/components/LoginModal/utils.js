import * as Yup from 'yup';

export const loginSchema = Yup.object({
  email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Senha é obrigatória'),
});

export const FIREBASE_ERROR_MESSAGES = {
  'auth/user-not-found': 'Usuário não encontrado.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha inválidos.',
  'auth/email-already-in-use': 'Este e-mail já está em uso.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/popup-closed-by-user': 'Login com Google cancelado.',
};

export const getFirebaseErrorMessage = code =>
  FIREBASE_ERROR_MESSAGES[code] || 'Ocorreu um erro. Tente novamente.';
