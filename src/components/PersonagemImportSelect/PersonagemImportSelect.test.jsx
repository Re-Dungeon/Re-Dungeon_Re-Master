import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonagemImportSelect from './PersonagemImportSelect';

const PERSONAGENS = [
  { id: 'p1', nome: 'Grumnak, o Orc', tipo: 'NPC' },
  { id: 'p2', nome: 'Fera das Sombras', tipo: 'Criatura' },
  { id: 'p3', nome: 'Herói sem tipo' },
];

describe('PersonagemImportSelect', () => {
  it('lista apenas personagens do tipo informado', async () => {
    const user = userEvent.setup();
    render(
      <PersonagemImportSelect
        personagens={PERSONAGENS}
        tipo="NPC"
        onImport={vi.fn()}
        idPrefix="npc"
      />,
    );

    await user.click(screen.getByLabelText('Importar de um personagem'));
    expect(screen.getByRole('option', { name: 'Grumnak, o Orc' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fera das Sombras' })).not.toBeInTheDocument();
  });

  it('trata personagem sem campo tipo como Personagem Jogável (não aparece em NPC nem Criatura)', async () => {
    const user = userEvent.setup();
    render(
      <PersonagemImportSelect
        personagens={PERSONAGENS}
        tipo="Criatura"
        onImport={vi.fn()}
        idPrefix="criatura"
      />,
    );

    await user.click(screen.getByLabelText('Importar de um personagem'));
    expect(screen.queryByRole('option', { name: 'Herói sem tipo' })).not.toBeInTheDocument();
  });

  it('chama onImport com o personagem escolhido e limpa a seleção', async () => {
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(
      <PersonagemImportSelect
        personagens={PERSONAGENS}
        tipo="NPC"
        onImport={onImport}
        idPrefix="npc"
      />,
    );

    await user.click(screen.getByLabelText('Importar de um personagem'));
    await user.click(screen.getByRole('option', { name: 'Grumnak, o Orc' }));
    await user.click(screen.getByRole('button', { name: 'Importar' }));

    expect(onImport).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', nome: 'Grumnak, o Orc' }),
    );
  });

  it('mostra mensagem de vazio quando não há personagens do tipo', () => {
    render(
      <PersonagemImportSelect personagens={[]} tipo="NPC" onImport={vi.fn()} idPrefix="npc" />,
    );

    expect(screen.getByText(/Nenhum personagem do tipo/)).toBeInTheDocument();
  });
});
