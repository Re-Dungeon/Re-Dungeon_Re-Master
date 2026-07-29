import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmMapa = vi.fn();
const updateRmMapa = vi.fn();
vi.mock('service/storage', () => ({
  addRmMapa: (...args) => addRmMapa(...args),
  updateRmMapa: (...args) => updateRmMapa(...args),
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

import NovoMapa from './NovoMapa';

const renderNovo = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/mapas/novo', state }]}>
      <NovoMapa />
    </MemoryRouter>,
  );

describe('NovoMapa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
  });

  it('mostra "Novo Mapa" com o nome da campanha ativa', async () => {
    renderNovo(undefined);

    await waitFor(() => expect(screen.getByText('Novo Mapa')).toBeInTheDocument());
    expect(screen.getByText('Novo mapa em Ascensão Carmesim')).toBeInTheDocument();
  });

  it('cria um mapa com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmMapa.mockResolvedValue({ id: 'novo-mapa' });
    const user = userEvent.setup();
    renderNovo(undefined);

    await waitFor(() => screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Mapa da Cidade');
    await user.click(screen.getByRole('button', { name: 'Salvar Mapa' }));

    await waitFor(() =>
      expect(addRmMapa).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Mapa da Cidade',
          categoria: 'outro',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('mostra "Editar Mapa" preenchido e salva via updateRmMapa', async () => {
    updateRmMapa.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNovo({ mapa: { id: 'mapa1', nome: 'Mapa da Cidade', categoria: 'cidade' } });

    await waitFor(() => expect(screen.getByText('Editar Mapa')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Mapa da Cidade')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmMapa).toHaveBeenCalledWith(
        'mapa1',
        expect.objectContaining({ nome: 'Mapa da Cidade' }),
      ),
    );
    expect(addRmMapa).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de mapas quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNovo(undefined);

    await waitFor(() => expect(screen.queryByText('Novo Mapa')).not.toBeInTheDocument());
  });
});
