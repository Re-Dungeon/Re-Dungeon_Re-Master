import { describe, it, expect } from 'vitest';
import { loginSchema, getFirebaseErrorMessage } from './utils';

describe('loginSchema', () => {
  it('aceita e-mail e senha válidos', async () => {
    await expect(
      loginSchema.validate({ email: 'user@example.com', password: '123456' }),
    ).resolves.toBeTruthy();
  });

  it('rejeita e-mail em formato inválido', async () => {
    await expect(
      loginSchema.validate({ email: 'não-é-email', password: '123456' }),
    ).rejects.toThrow('E-mail inválido');
  });

  it('rejeita senha com menos de 6 caracteres', async () => {
    await expect(
      loginSchema.validate({ email: 'user@example.com', password: '123' }),
    ).rejects.toThrow('Senha deve ter no mínimo 6 caracteres');
  });

  it('rejeita quando e-mail está ausente', async () => {
    await expect(
      loginSchema.validate({ email: '', password: '123456' }),
    ).rejects.toThrow('E-mail é obrigatório');
  });

  it('rejeita quando senha está ausente', async () => {
    await expect(
      loginSchema.validate({ email: 'user@example.com', password: '' }),
    ).rejects.toThrow();
  });
});

describe('getFirebaseErrorMessage', () => {
  it('traduz códigos de erro conhecidos do Firebase Auth', () => {
    expect(getFirebaseErrorMessage('auth/user-not-found')).toBe(
      'Usuário não encontrado.',
    );
    expect(getFirebaseErrorMessage('auth/wrong-password')).toBe(
      'Senha incorreta.',
    );
  });

  it('retorna mensagem genérica para código desconhecido', () => {
    expect(getFirebaseErrorMessage('auth/algum-codigo-novo')).toBe(
      'Ocorreu um erro. Tente novamente.',
    );
  });

  it('retorna mensagem genérica quando o código é undefined', () => {
    expect(getFirebaseErrorMessage(undefined)).toBe(
      'Ocorreu um erro. Tente novamente.',
    );
  });
});
