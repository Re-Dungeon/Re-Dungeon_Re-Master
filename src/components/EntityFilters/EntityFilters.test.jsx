import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntityFilters from './EntityFilters';

const UNIVERSOS_MOCK = [
  { id: 'u1', Nome: 'Prime' },
  { id: 'u2', Nome: 'Segundo' },
];

describe('EntityFilters', () => {
  it('chama onNomeChange ao digitar no campo de busca', async () => {
    const onNomeChange = vi.fn();
    const user = userEvent.setup();

    render(
      <EntityFilters
        nomeValue=""
        onNomeChange={onNomeChange}
        universos={UNIVERSOS_MOCK}
        universoValue=""
        onUniversoChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Buscar por nome'), 'Elfo');

    expect(onNomeChange).toHaveBeenCalled();
  });

  it('renderiza um select por extraFilter e chama onChange ao escolher uma opção', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(
      <EntityFilters
        nomeValue=""
        onNomeChange={vi.fn()}
        extraFilters={[
          {
            label: 'Raridade',
            value: '',
            onChange,
            options: ['Comum', 'Raro'],
            allLabel: 'Todas',
          },
        ]}
        universos={UNIVERSOS_MOCK}
        universoValue=""
        onUniversoChange={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('Raridade'));
    await user.click(await screen.findByRole('option', { name: 'Raro' }));

    expect(onChange).toHaveBeenCalledWith('Raro');
  });

  it('lista os universos recebidos e chama onUniversoChange ao selecionar um', async () => {
    const onUniversoChange = vi.fn();
    const user = userEvent.setup();

    render(
      <EntityFilters
        nomeValue=""
        onNomeChange={vi.fn()}
        universos={UNIVERSOS_MOCK}
        universoValue=""
        onUniversoChange={onUniversoChange}
      />,
    );

    await user.click(screen.getByLabelText('Universo'));
    await user.click(await screen.findByRole('option', { name: 'Segundo' }));

    expect(onUniversoChange).toHaveBeenCalledWith('u2');
  });

  it('não renderiza o select de ordenação quando onSortChange não é passado', () => {
    render(
      <EntityFilters
        nomeValue=""
        onNomeChange={vi.fn()}
        universos={UNIVERSOS_MOCK}
        universoValue=""
        onUniversoChange={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Ordenar')).not.toBeInTheDocument();
  });

  it('renderiza o select de ordenação com "Nome (A a Z)" como padrão e chama onSortChange ao trocar', async () => {
    const onSortChange = vi.fn();
    const user = userEvent.setup();

    render(
      <EntityFilters
        nomeValue=""
        onNomeChange={vi.fn()}
        universos={UNIVERSOS_MOCK}
        universoValue=""
        onUniversoChange={vi.fn()}
        sortValue="asc"
        onSortChange={onSortChange}
      />,
    );

    expect(screen.getByLabelText('Ordenar')).toHaveTextContent('Nome (A a Z)');

    await user.click(screen.getByLabelText('Ordenar'));
    await user.click(
      await screen.findByRole('option', { name: 'Nome (Z a A)' }),
    );

    expect(onSortChange).toHaveBeenCalledWith('desc');
  });
});
