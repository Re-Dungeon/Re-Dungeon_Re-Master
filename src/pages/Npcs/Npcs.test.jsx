import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const getRmNpcs = vi.fn();
const removeRmNpc = vi.fn();
vi.mock('service/storage', () => ({
  getRmNpcs: (...args) => getRmNpcs(...args),
  removeRmNpc: (...args) => removeRmNpc(...args),
}));

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canCreate, canWrite }),
}));

const CAMPANHA_ATIVA = { id: 'c1', nome: 'Ascensão Carmesim', universoId: 'u1', mestreId: 'm1' };
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva: CAMPANHA_ATIVA, loadingCampanhas: false }),
}));

import Npcs from './Npcs';

const NPCS_MOCK = [
  { id: 'npc1', campanhaId: 'c1', nome: 'Grumnak, o Orc', descricaoBase: 'Um orc rabugento' },
  { id: 'npc2', campanhaId: 'c1', nome: 'Sacerdotisa Lyra' },
];

const renderNpcs = () =>
  render(
    <MemoryRouter>
      <Npcs />
    </MemoryRouter>,
  );

describe('Npcs (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmNpcs.mockResolvedValue(NPCS_MOCK);
  });

  it('lista os NPCs da campanha ativa', async () => {
    renderNpcs();

    await waitFor(() => expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument());
    expect(screen.getByText('Sacerdotisa Lyra')).toBeInTheDocument();
    expect(screen.getByText('Um orc rabugento')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há NPCs', async () => {
    getRmNpcs.mockResolvedValue([]);
    renderNpcs();

    await waitFor(() => expect(screen.getByText('Nenhum NPC cadastrado')).toBeInTheDocument());
  });

  it('remove um NPC', async () => {
    removeRmNpc.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNpcs();

    await waitFor(() => expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument());
    await user.click(screen.getByLabelText('Remover NPC Grumnak, o Orc'));

    await waitFor(() => expect(removeRmNpc).toHaveBeenCalledWith('npc1'));
  });

  it('não mostra ações de criar/editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNpcs();

    await waitFor(() => expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument());
    expect(screen.queryByLabelText('Editar NPC Grumnak, o Orc')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Novo NPC' })).not.toBeInTheDocument();
  });

  it('mostra o erro de carregamento e permite tentar de novo', async () => {
    getRmNpcs.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Erro ao carregar os NPCs.')).toBeInTheDocument(),
    );

    getRmNpcs.mockResolvedValue(NPCS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument());
  });
});
