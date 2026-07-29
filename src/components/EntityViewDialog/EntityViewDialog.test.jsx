import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntityViewDialog from './EntityViewDialog';

describe('EntityViewDialog', () => {
  it('não renderiza nada quando open é false', () => {
    render(<EntityViewDialog open={false} onClose={vi.fn()} titulo="Elfo" />);

    expect(screen.queryByText('Elfo')).not.toBeInTheDocument();
  });

  it('renderiza título, subtítulo, imagem, descrição e children', () => {
    render(
      <EntityViewDialog
        open
        onClose={vi.fn()}
        titulo="Elfo"
        subtitulo="Universo Prime — Raro"
        imagem="https://example.com/elfo.png"
        descricao="Ágil e sábio."
      >
        <div>Conteúdo específico da entidade</div>
      </EntityViewDialog>,
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Elfo')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Universo Prime — Raro'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Elfo' })).toHaveAttribute(
      'src',
      'https://example.com/elfo.png',
    );
    expect(within(dialog).getByText('Descrição')).toBeInTheDocument();
    expect(within(dialog).getByText('Ágil e sábio.')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Conteúdo específico da entidade'),
    ).toBeInTheDocument();
  });

  it('omite imagem, descrição e subtítulo quando não fornecidos', () => {
    render(<EntityViewDialog open onClose={vi.fn()} titulo="Elfo" />);

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    expect(within(dialog).queryByText('Descrição')).not.toBeInTheDocument();
  });

  it('chama onClose ao clicar em Fechar', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EntityViewDialog open onClose={onClose} titulo="Elfo" />);

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renderiza actions extras ao lado do botão Fechar', async () => {
    const onEditar = vi.fn();
    const user = userEvent.setup();

    render(
      <EntityViewDialog
        open
        onClose={vi.fn()}
        titulo="Elfo"
        actions={<button onClick={onEditar}>Editar</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(onEditar).toHaveBeenCalledTimes(1);
  });
});
