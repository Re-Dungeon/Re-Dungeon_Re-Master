import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListLoadError from './ListLoadError';

describe('ListLoadError', () => {
  it('mostra a mensagem padrão quando nenhuma é informada', () => {
    render(<ListLoadError onRetry={vi.fn()} />);

    expect(
      screen.getByText('Não foi possível carregar os dados agora.'),
    ).toBeInTheDocument();
  });

  it('mostra uma mensagem customizada quando informada', () => {
    render(<ListLoadError mensagem="Erro ao carregar NPCs." onRetry={vi.fn()} />);

    expect(screen.getByText('Erro ao carregar NPCs.')).toBeInTheDocument();
  });

  it('chama onRetry ao clicar em "Tentar novamente"', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ListLoadError onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
