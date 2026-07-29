import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getRmCardfluxCartas = vi.fn();
const removeRmCardfluxCarta = vi.fn();
const updateRmCardfluxCarta = vi.fn();
vi.mock('service/storage', () => ({
  getRmCardfluxCartas: (...args) => getRmCardfluxCartas(...args),
  removeRmCardfluxCarta: (...args) => removeRmCardfluxCarta(...args),
  updateRmCardfluxCarta: (...args) => updateRmCardfluxCarta(...args),
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

import { MemoryRouter } from 'react-router-dom';
import Cartas from './Cartas';

const BARALHO = { id: 'baralho1', nome: 'Eventos de Estrada' };
const CARTAS_MOCK = [
  { id: 'carta1', baralhoId: 'baralho1', titulo: 'Emboscada', tipo: 'perigo', estadoNoBaralho: 'no_baralho' },
];

const renderCartas = (state = { baralho: BARALHO }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/cardflux/cartas', state }]}>
      <Cartas />
    </MemoryRouter>,
  );

describe('Cartas (lista de cartas de um baralho)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
  });

  it('lista as cartas do baralho informado no state', async () => {
    renderCartas();

    await waitFor(() => expect(screen.getByText('Emboscada')).toBeInTheDocument());
    expect(screen.getByText('Cartas — Eventos de Estrada')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando o baralho não tem cartas', async () => {
    getRmCardfluxCartas.mockResolvedValue([]);
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Nenhuma carta cadastrada')).toBeInTheDocument(),
    );
  });

  it('remove uma carta', async () => {
    removeRmCardfluxCarta.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCartas();

    await waitFor(() => expect(screen.getByText('Emboscada')).toBeInTheDocument());
    await user.click(screen.getByLabelText('Remover carta Emboscada'));

    await waitFor(() => expect(removeRmCardfluxCarta).toHaveBeenCalledWith('carta1'));
  });

  it('altera o estado da carta via select', async () => {
    updateRmCardfluxCarta.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCartas();

    await waitFor(() => expect(screen.getByText('Emboscada')).toBeInTheDocument());
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Descartada' }));

    await waitFor(() =>
      expect(updateRmCardfluxCarta).toHaveBeenCalledWith('carta1', {
        estadoNoBaralho: 'descartada',
      }),
    );
  });

  it('redireciona para o CardFlux quando não há baralho no state', async () => {
    renderCartas({});

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/cardflux'));
  });
});
