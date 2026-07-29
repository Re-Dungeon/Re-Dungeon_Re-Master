import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const removeRmCampanha = vi.fn();
vi.mock('service/storage', () => ({
  removeRmCampanha: (...args) => removeRmCampanha(...args),
  getUniversos: vi.fn().mockResolvedValue([{ id: 'u1', Nome: 'Prime' }]),
}));

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canCreate, canWrite }),
}));

const setCampanhaAtiva = vi.fn();
const recarregarCampanhas = vi.fn();
let mockCampanhaState = {
  campanhas: [],
  loadingCampanhas: false,
  campanhaAtivaId: null,
  setCampanhaAtiva,
  recarregarCampanhas,
};
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => mockCampanhaState,
}));

import Campanha from './Campanha';

const CAMPANHAS_MOCK = [
  { id: 'c1', nome: 'Ascensão Carmesim', universoId: 'u1' },
  { id: 'c2', nome: 'Ruínas do Norte', universoId: 'u1' },
];

const renderCampanha = () =>
  render(
    <MemoryRouter>
      <Campanha />
    </MemoryRouter>,
  );

describe('Campanha (lista + seletor de campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    recarregarCampanhas.mockResolvedValue(undefined);
    mockCampanhaState = {
      campanhas: CAMPANHAS_MOCK,
      loadingCampanhas: false,
      campanhaAtivaId: null,
      setCampanhaAtiva,
      recarregarCampanhas,
    };
  });

  it('lista as campanhas do contexto', async () => {
    renderCampanha();

    await waitFor(() =>
      expect(screen.getByText('Ascensão Carmesim')).toBeInTheDocument(),
    );
    expect(screen.getByText('Ruínas do Norte')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há campanhas', () => {
    mockCampanhaState = { ...mockCampanhaState, campanhas: [] };
    renderCampanha();

    expect(screen.getByText('Nenhuma campanha cadastrada')).toBeInTheDocument();
  });

  it('marca a campanha ativa com o botão desabilitado e chip "Ativa"', async () => {
    mockCampanhaState = { ...mockCampanhaState, campanhaAtivaId: 'c1' };
    renderCampanha();

    await waitFor(() => expect(screen.getByText('Ativa')).toBeInTheDocument());
    expect(
      screen.getByRole('button', { name: 'Campanha Ativa' }),
    ).toBeDisabled();
  });

  it('seleciona uma campanha como ativa ao clicar em "Selecionar Campanha"', async () => {
    const user = userEvent.setup();
    renderCampanha();

    await waitFor(() =>
      expect(screen.getByText('Ascensão Carmesim')).toBeInTheDocument(),
    );

    const botoesSelecionar = screen.getAllByRole('button', {
      name: 'Selecionar Campanha',
    });
    await user.click(botoesSelecionar[0]);

    expect(setCampanhaAtiva).toHaveBeenCalledWith('c1');
  });

  it('remove uma campanha, limpa a ativa se era a removida, e recarrega', async () => {
    mockCampanhaState = { ...mockCampanhaState, campanhaAtivaId: 'c1' };
    removeRmCampanha.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCampanha();

    await waitFor(() =>
      expect(screen.getByText('Ascensão Carmesim')).toBeInTheDocument(),
    );
    await user.click(
      screen.getByLabelText('Remover campanha Ascensão Carmesim'),
    );

    await waitFor(() =>
      expect(removeRmCampanha).toHaveBeenCalledWith('c1'),
    );
    expect(setCampanhaAtiva).toHaveBeenCalledWith(null);
    expect(recarregarCampanhas).toHaveBeenCalledTimes(1);
  });

  it('não mostra ações de editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderCampanha();

    await waitFor(() =>
      expect(screen.getByText('Ascensão Carmesim')).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('Editar campanha Ascensão Carmesim'),
    ).not.toBeInTheDocument();
  });

  it('não mostra o botão de nova campanha quando canCreate retorna false', () => {
    canCreate.mockReturnValue(false);
    renderCampanha();

    expect(
      screen.queryByRole('button', { name: '+ Nova Campanha' }),
    ).not.toBeInTheDocument();
  });
});
