import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import AdicionarTokenDialog from './AdicionarTokenDialog';

const fontes = {
  jogadores: [{ id: 'j1', refId: 'p1', label: 'Aldric', uid: 'u1' }],
  npcs: [
    {
      id: 'n1',
      refId: 'npc1',
      label: 'Goblin',
      recursos: { pv: { atual: 7, max: 7 } },
    },
    { id: 'n2', refId: 'npc2', label: 'Orc Chefe' },
  ],
  criaturas: [],
};

const renderDialog = onAdicionar =>
  render(
    <AdicionarTokenDialog
      open
      onClose={vi.fn()}
      fontes={fontes}
      onAdicionar={onAdicionar}
      jogadoresFaltando={0}
      onAdicionarJogadores={vi.fn()}
    />,
  );

describe('AdicionarTokenDialog', () => {
  it('NPC: adiciona várias cópias com a quantidade escolhida', () => {
    const onAdicionar = vi.fn().mockResolvedValue(true);
    renderDialog(onAdicionar);

    fireEvent.click(screen.getByRole('tab', { name: 'NPCs' }));
    fireEvent.change(screen.getByLabelText('Quantidade'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Goblin' }));

    expect(onAdicionar).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Goblin', tipo: 'npc', refId: 'npc1' }),
      3,
    );
  });

  it('busca filtra a lista pelo nome', () => {
    renderDialog(vi.fn());
    fireEvent.click(screen.getByRole('tab', { name: 'NPCs' }));
    fireEvent.change(screen.getByLabelText('Buscar em NPCs'), {
      target: { value: 'orc' },
    });

    const lista = screen.getByRole('list', { name: 'NPCs' });
    expect(within(lista).getByText('Orc Chefe')).toBeInTheDocument();
    expect(within(lista).queryByText('Goblin')).not.toBeInTheDocument();
  });

  it('jogador entra um só (sem campo de quantidade)', () => {
    const onAdicionar = vi.fn().mockResolvedValue(true);
    renderDialog(onAdicionar);

    expect(screen.queryByLabelText('Quantidade')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Aldric' }));
    expect(onAdicionar).toHaveBeenCalledWith(
      expect.objectContaining({ donos: ['u1'] }),
      1,
    );
  });
});
