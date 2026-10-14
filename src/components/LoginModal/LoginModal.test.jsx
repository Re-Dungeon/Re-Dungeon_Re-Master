import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const login = vi.fn();
const resetPassword = vi.fn();
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ login, resetPassword }),
}));

import LoginModal from './LoginModal';

describe('LoginModal', () => {
  beforeEach(() => {
    login.mockReset();
    resetPassword.mockReset();
  });

  it('renderiza os campos de e-mail e senha quando aberto', () => {
    render(<LoginModal open onClose={vi.fn()} />);

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('não renderiza o conteúdo quando fechado', () => {
    render(<LoginModal open={false} onClose={vi.fn()} />);

    expect(screen.queryByLabelText('E-mail')).not.toBeInTheDocument();
  });

  it('chama login com e-mail, senha e persistência ao submeter o formulário', async () => {
    login.mockResolvedValueOnce(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal open onClose={onClose} />);

    await user.type(screen.getByLabelText('E-mail'), 'user@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith('user@example.com', 'senha123', true),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('permite alternar visibilidade da senha sem limpar o valor', async () => {
    const user = userEvent.setup();
    render(<LoginModal open onClose={vi.fn()} />);

    const senhaInput = screen.getByLabelText('Senha');
    await user.type(senhaInput, 'senha123');

    const toggleButton = screen.getByRole('button', { name: 'Mostrar senha' });
    await user.click(toggleButton);

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Senha')).toHaveValue('senha123');
  });

  it('abre o modal de recuperação de senha e envia o link', async () => {
    resetPassword.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<LoginModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Esqueceu a senha?' }));
    const emailInput = screen.getByLabelText('E-mail para recuperação');
    await user.type(emailInput, 'user@example.com');
    await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith('user@example.com'),
    );
    expect(
      screen.getByText(
        'Se este e-mail estiver associado a uma conta, você receberá instruções para redefinir sua senha.',
      ),
    ).toBeInTheDocument();
  });
});
