import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const login = vi.fn();
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ login }),
}));

import LoginModal from './LoginModal';

describe('LoginModal', () => {
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

  it('chama login com e-mail e senha ao submeter o formulário', async () => {
    login.mockResolvedValueOnce(undefined);
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<LoginModal open onClose={onClose} />);

    await user.type(screen.getByLabelText('E-mail'), 'user@example.com');
    await user.type(screen.getByLabelText('Senha'), 'senha123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith('user@example.com', 'senha123'),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
