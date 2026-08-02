import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getCardfluxCartas = vi.fn();
const getRmCardfluxEstadosPorCampanha = vi.fn();
vi.mock('service/storage', () => ({
  getCardfluxCartas: (...args) => getCardfluxCartas(...args),
  getRmCardfluxEstadosPorCampanha: (...args) =>
    getRmCardfluxEstadosPorCampanha(...args),
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: 'm1',
};
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva: CAMPANHA_ATIVA,
    loadingCampanhas: false,
  }),
}));

import CardFlux from './CardFlux';

const CARTAS_MOCK = [
  {
    id: 'carta1',
    deck: 'Eventos de Estrada',
    nome: 'Emboscada',
    tipo: 'Perigo',
    descricaoGeral: 'Uma emboscada.',
  },
  {
    id: 'carta2',
    deck: 'Eventos de Estrada',
    nome: 'Baú do Tesouro',
    tipo: 'Recompensa',
  },
];
const ESTADOS_MOCK = [
  {
    id: 'estado1',
    campanhaId: 'c1',
    cartaId: 'carta2',
    estadoNoBaralho: 'comprada',
  },
];

const renderCardFlux = () =>
  render(
    <MemoryRouter>
      <CardFlux />
    </MemoryRouter>,
  );

describe('CardFlux (baralhos agrupados a partir das cartas do cardflux)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
    getRmCardfluxEstadosPorCampanha.mockResolvedValue(ESTADOS_MOCK);
  });

  it('busca as cartas do universo da campanha ativa e agrupa por deck', async () => {
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
    expect(getCardfluxCartas).toHaveBeenCalledWith('u1');
    expect(screen.getByText('1/2 cartas disponíveis')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há cartas cadastradas para o universo', async () => {
    getCardfluxCartas.mockResolvedValue([]);
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Nenhum baralho encontrado')).toBeInTheDocument(),
    );
  });

  it('navega para o motor de sorteio passando só o nome do baralho no state', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Sortear' }));

    expect(navigate).toHaveBeenCalledWith('/cardflux/sorteio', {
      state: { baralho: { nome: 'Eventos de Estrada' } },
    });
  });

  it('navega para ver as cartas passando só o nome do baralho no state', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Ver Cartas' }));

    expect(navigate).toHaveBeenCalledWith('/cardflux/cartas', {
      state: { baralho: { nome: 'Eventos de Estrada' } },
    });
  });

  it('mostra o erro de carregamento quando as cartas falham e permite tentar de novo', async () => {
    getCardfluxCartas.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(
        screen.getByText('Erro ao carregar o CardFlux.'),
      ).toBeInTheDocument(),
    );

    getCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
  });
});
