import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const getRmCriaturas = vi.fn();
const removeRmCriatura = vi.fn();
vi.mock('service/storage', () => ({
  getRmCriaturas: (...args) => getRmCriaturas(...args),
  removeRmCriatura: (...args) => removeRmCriatura(...args),
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

import Criaturas from './Criaturas';

const CRIATURAS_MOCK = [
  { id: 'criatura1', campanhaId: 'c1', nome: 'Fera das Sombras', descricaoBase: 'Assombra a floresta' },
  { id: 'criatura2', campanhaId: 'c1', nome: 'Golem de Pedra' },
];

const renderCriaturas = () =>
  render(
    <MemoryRouter>
      <Criaturas />
    </MemoryRouter>,
  );

describe('Criaturas (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmCriaturas.mockResolvedValue(CRIATURAS_MOCK);
  });

  it('lista as criaturas da campanha ativa', async () => {
    renderCriaturas();

    await waitFor(() => expect(screen.getByText('Fera das Sombras')).toBeInTheDocument());
    expect(screen.getByText('Golem de Pedra')).toBeInTheDocument();
    expect(screen.getByText('Assombra a floresta')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há criaturas', async () => {
    getRmCriaturas.mockResolvedValue([]);
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByText('Nenhuma criatura cadastrada')).toBeInTheDocument(),
    );
  });

  it('remove uma criatura', async () => {
    removeRmCriatura.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCriaturas();

    await waitFor(() => expect(screen.getByText('Fera das Sombras')).toBeInTheDocument());
    await user.click(screen.getByLabelText('Remover criatura Fera das Sombras'));

    await waitFor(() => expect(removeRmCriatura).toHaveBeenCalledWith('criatura1'));
  });

  it('não mostra ações de criar/editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderCriaturas();

    await waitFor(() => expect(screen.getByText('Fera das Sombras')).toBeInTheDocument());
    expect(screen.queryByLabelText('Editar criatura Fera das Sombras')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Nova Criatura' })).not.toBeInTheDocument();
  });
});
