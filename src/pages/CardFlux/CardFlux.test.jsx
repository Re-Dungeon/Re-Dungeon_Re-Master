import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getRmCardfluxBaralhos = vi.fn();
const removeRmCardfluxBaralho = vi.fn();
const getRmCardfluxCartas = vi.fn();
const updateRmCardfluxCarta = vi.fn();
vi.mock('service/storage', () => ({
  getRmCardfluxBaralhos: (...args) => getRmCardfluxBaralhos(...args),
  removeRmCardfluxBaralho: (...args) => removeRmCardfluxBaralho(...args),
  getRmCardfluxCartas: (...args) => getRmCardfluxCartas(...args),
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

import CardFlux from './CardFlux';

const BARALHOS_MOCK = [{ id: 'baralho1', campanhaId: 'c1', nome: 'Eventos de Estrada' }];
const CARTAS_MOCK = [
  { id: 'carta1', campanhaId: 'c1', baralhoId: 'baralho1', titulo: 'Emboscada', tipo: 'perigo', estadoNoBaralho: 'no_baralho' },
  { id: 'carta2', campanhaId: 'c1', baralhoId: 'baralho1', titulo: 'Baú do Tesouro', tipo: 'recompensa', estadoNoBaralho: 'comprada' },
];

const renderCardFlux = () =>
  render(
    <MemoryRouter>
      <CardFlux />
    </MemoryRouter>,
  );

describe('CardFlux (lista de baralhos da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmCardfluxBaralhos.mockResolvedValue(BARALHOS_MOCK);
    getRmCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
  });

  it('lista os baralhos com a contagem de cartas disponíveis', async () => {
    renderCardFlux();

    await waitFor(() => expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument());
    expect(screen.getByText('1/2 cartas disponíveis')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há baralhos', async () => {
    getRmCardfluxBaralhos.mockResolvedValue([]);
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Nenhum baralho cadastrado')).toBeInTheDocument(),
    );
  });

  it('remove um baralho', async () => {
    removeRmCardfluxBaralho.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() => expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument());
    await user.click(screen.getByLabelText('Remover baralho Eventos de Estrada'));

    await waitFor(() => expect(removeRmCardfluxBaralho).toHaveBeenCalledWith('baralho1'));
  });

  it('navega para gerenciar cartas passando o baralho no state', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() => expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Gerenciar Cartas' }));

    expect(navigate).toHaveBeenCalledWith('/cardflux/cartas', {
      state: { baralho: BARALHOS_MOCK[0] },
    });
  });

  it('puxa uma carta disponível, marca como comprada e mostra o resultado', async () => {
    updateRmCardfluxCarta.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() => expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Puxar Carta' }));

    await waitFor(() =>
      expect(updateRmCardfluxCarta).toHaveBeenCalledWith('carta1', {
        estadoNoBaralho: 'comprada',
      }),
    );
    expect(screen.getByText('Emboscada')).toBeInTheDocument();
  });

  it('avisa quando o baralho está esgotado', async () => {
    getRmCardfluxCartas.mockResolvedValue([
      { ...CARTAS_MOCK[0], estadoNoBaralho: 'comprada' },
      CARTAS_MOCK[1],
    ]);
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() => expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Puxar Carta' }));

    expect(screen.getByText('Baralho esgotado')).toBeInTheDocument();
    expect(updateRmCardfluxCarta).not.toHaveBeenCalled();
  });

  it('mostra o erro de carregamento quando os baralhos falham e permite tentar de novo', async () => {
    getRmCardfluxBaralhos.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Erro ao carregar o CardFlux.')).toBeInTheDocument(),
    );

    getRmCardfluxBaralhos.mockResolvedValue(BARALHOS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument());
  });
});
