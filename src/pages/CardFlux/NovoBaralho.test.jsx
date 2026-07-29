import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmCardfluxBaralho = vi.fn();
const updateRmCardfluxBaralho = vi.fn();
vi.mock('service/storage', () => ({
  addRmCardfluxBaralho: (...args) => addRmCardfluxBaralho(...args),
  updateRmCardfluxBaralho: (...args) => updateRmCardfluxBaralho(...args),
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

import NovoBaralho from './NovoBaralho';

const renderNovo = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/cardflux/novo', state }]}>
      <NovoBaralho />
    </MemoryRouter>,
  );

describe('NovoBaralho', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
  });

  it('mostra "Novo Baralho" com o nome da campanha ativa', async () => {
    renderNovo(undefined);

    await waitFor(() => expect(screen.getByText('Novo Baralho')).toBeInTheDocument());
    expect(screen.getByText('Novo baralho em Ascensão Carmesim')).toBeInTheDocument();
  });

  it('cria um baralho com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmCardfluxBaralho.mockResolvedValue({ id: 'novo-baralho' });
    const user = userEvent.setup();
    renderNovo(undefined);

    await waitFor(() => screen.getByLabelText('Nome do Baralho'));
    await user.type(screen.getByLabelText('Nome do Baralho'), 'Eventos de Estrada');
    await user.click(screen.getByRole('button', { name: 'Salvar Baralho' }));

    await waitFor(() =>
      expect(addRmCardfluxBaralho).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Eventos de Estrada',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('mostra "Editar Baralho" preenchido e salva via updateRmCardfluxBaralho', async () => {
    updateRmCardfluxBaralho.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNovo({ baralho: { id: 'baralho1', nome: 'Eventos de Estrada' } });

    await waitFor(() => expect(screen.getByText('Editar Baralho')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Eventos de Estrada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCardfluxBaralho).toHaveBeenCalledWith(
        'baralho1',
        expect.objectContaining({ nome: 'Eventos de Estrada' }),
      ),
    );
    expect(addRmCardfluxBaralho).not.toHaveBeenCalled();
  });

  it('redireciona para o CardFlux quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNovo(undefined);

    await waitFor(() => expect(screen.queryByText('Novo Baralho')).not.toBeInTheDocument());
  });
});
