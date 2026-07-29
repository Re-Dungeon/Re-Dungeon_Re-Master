import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmCardfluxCarta = vi.fn();
const updateRmCardfluxCarta = vi.fn();
vi.mock('service/storage', () => ({
  addRmCardfluxCarta: (...args) => addRmCardfluxCarta(...args),
  updateRmCardfluxCarta: (...args) => updateRmCardfluxCarta(...args),
}));

const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canWrite, loadingPermissions: false }),
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: 'mestre-1',
};
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva: CAMPANHA_ATIVA, loadingCampanhas: false }),
}));

import NovaCarta from './NovaCarta';

const BARALHO = { id: 'baralho1', nome: 'Eventos de Estrada' };

const renderNova = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/cardflux/cartas/nova', state }]}>
      <NovaCarta />
    </MemoryRouter>,
  );

describe('NovaCarta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
  });

  it('mostra "Nova Carta" com o nome do baralho', async () => {
    renderNova({ baralho: BARALHO });

    await waitFor(() => expect(screen.getByText('Nova Carta')).toBeInTheDocument());
    expect(screen.getByText('Nova carta em Eventos de Estrada')).toBeInTheDocument();
  });

  it('cria uma carta com baralhoId/campanhaId/universoId/mestreId derivados', async () => {
    addRmCardfluxCarta.mockResolvedValue({ id: 'nova-carta' });
    const user = userEvent.setup();
    renderNova({ baralho: BARALHO });

    await waitFor(() => screen.getByLabelText('Título'));
    await user.type(screen.getByLabelText('Título'), 'Emboscada');
    await user.click(screen.getByRole('button', { name: 'Salvar Carta' }));

    await waitFor(() =>
      expect(addRmCardfluxCarta).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Emboscada',
          baralhoId: 'baralho1',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('mostra "Editar Carta" preenchida e salva via updateRmCardfluxCarta', async () => {
    updateRmCardfluxCarta.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({ baralho: BARALHO, carta: { id: 'carta1', titulo: 'Emboscada' } });

    await waitFor(() => expect(screen.getByText('Editar Carta')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Emboscada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCardfluxCarta).toHaveBeenCalledWith(
        'carta1',
        expect.objectContaining({ titulo: 'Emboscada' }),
      ),
    );
    expect(addRmCardfluxCarta).not.toHaveBeenCalled();
  });

  it('redireciona para o CardFlux quando não há baralho no state', async () => {
    renderNova(undefined);

    await waitFor(() => expect(screen.queryByText('Nova Carta')).not.toBeInTheDocument());
  });
});
