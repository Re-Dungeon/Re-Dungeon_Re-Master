import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getCardfluxCartas = vi.fn();
const getRmCardfluxEstadosPorCampanha = vi.fn();
const addRmCardfluxEstado = vi.fn();
const updateRmCardfluxEstado = vi.fn();
vi.mock('service/storage', () => ({
  getCardfluxCartas: (...args) => getCardfluxCartas(...args),
  getRmCardfluxEstadosPorCampanha: (...args) =>
    getRmCardfluxEstadosPorCampanha(...args),
  addRmCardfluxEstado: (...args) => addRmCardfluxEstado(...args),
  updateRmCardfluxEstado: (...args) => updateRmCardfluxEstado(...args),
}));

const CURRENT_USER_UID = 'm1';
let authState;
vi.mock('context/AuthContext', () => ({
  useAuth: () => authState,
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: CURRENT_USER_UID,
};
let campanhaAtiva = CAMPANHA_ATIVA;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva,
    loadingCampanhas: false,
  }),
}));

import { MemoryRouter } from 'react-router-dom';
import Cartas from './Cartas';

const BARALHO = { nome: 'Eventos de Estrada' };
const CARTAS_MOCK = [
  {
    id: 'carta1',
    deck: 'Eventos de Estrada',
    nome: 'Emboscada',
    tipo: 'Perigo',
    raridade: 'Comum',
  },
  {
    id: 'carta2',
    deck: 'Floresta',
    nome: 'Espírito da Floresta',
    tipo: 'Encontro',
  },
];
const ESTADOS_MOCK = [
  {
    id: 'estado1',
    campanhaId: 'c1',
    cartaId: 'carta1',
    estadoNoBaralho: 'comprada',
  },
];

const renderCartas = (state = { baralho: BARALHO }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/cardflux/cartas', state }]}>
      <Cartas />
    </MemoryRouter>,
  );

describe('Cartas (cartas do cardflux filtradas pelo deck do baralho)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { currentUser: { uid: CURRENT_USER_UID }, isAdmin: false };
    campanhaAtiva = CAMPANHA_ATIVA;
    getCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
    getRmCardfluxEstadosPorCampanha.mockResolvedValue(ESTADOS_MOCK);
  });

  it('lista só as cartas cujo deck bate com o baralho informado no state', async () => {
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    expect(screen.getByText('Cartas — Eventos de Estrada')).toBeInTheDocument();
    expect(screen.queryByText('Espírito da Floresta')).not.toBeInTheDocument();
    expect(getCardfluxCartas).toHaveBeenCalledWith('u1');
  });

  it('mostra o estado vazio quando o baralho não tem cartas', async () => {
    getCardfluxCartas.mockResolvedValue([]);
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Nenhuma carta encontrada')).toBeInTheDocument(),
    );
  });

  it('altera o estado de uma carta que já tem doc de estado (update)', async () => {
    updateRmCardfluxEstado.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Descartada' }));

    await waitFor(() =>
      expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
        estadoNoBaralho: 'descartada',
      }),
    );
    expect(addRmCardfluxEstado).not.toHaveBeenCalled();
  });

  it('altera o estado de uma carta sem doc de estado ainda (create)', async () => {
    getRmCardfluxEstadosPorCampanha.mockResolvedValue([]);
    addRmCardfluxEstado.mockResolvedValue({ id: 'estado-novo' });
    const user = userEvent.setup();
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Descartada' }));

    await waitFor(() =>
      expect(addRmCardfluxEstado).toHaveBeenCalledWith({
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: 'm1',
        cartaId: 'carta1',
        estadoNoBaralho: 'descartada',
      }),
    );
  });

  it('desabilita o select de estado quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('abre o dialog de detalhes com os campos completos da carta ao clicar em "Ver Detalhes"', async () => {
    getCardfluxCartas.mockResolvedValue([
      { ...CARTAS_MOCK[0], descricaoGeral: 'Uma emboscada na estrada.' },
      CARTAS_MOCK[1],
    ]);
    const user = userEvent.setup();
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Ver Detalhes' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Descrição Geral')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Uma emboscada na estrada.'),
    ).toBeInTheDocument();
  });

  it('marca todas as cartas do baralho com o mesmo estado ao clicar no botão em lote', async () => {
    getCardfluxCartas.mockResolvedValue([
      CARTAS_MOCK[0],
      { id: 'carta3', deck: 'Eventos de Estrada', nome: 'Baú do Tesouro' },
    ]);
    getRmCardfluxEstadosPorCampanha.mockResolvedValue([]);
    addRmCardfluxEstado.mockResolvedValue({ id: 'estado-novo' });
    const user = userEvent.setup();
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    expect(screen.getByText('Baú do Tesouro')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'No Baralho' }));

    await waitFor(() => expect(addRmCardfluxEstado).toHaveBeenCalledTimes(2));
    expect(addRmCardfluxEstado).toHaveBeenCalledWith(
      expect.objectContaining({
        cartaId: 'carta1',
        estadoNoBaralho: 'no_baralho',
      }),
    );
    expect(addRmCardfluxEstado).toHaveBeenCalledWith(
      expect.objectContaining({
        cartaId: 'carta3',
        estadoNoBaralho: 'no_baralho',
      }),
    );
  });

  it('não mostra os botões de alterar todas quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderCartas();

    await waitFor(() =>
      expect(screen.getByText('Emboscada')).toBeInTheDocument(),
    );
    expect(
      screen.queryByText('Marcar todas as cartas como:'),
    ).not.toBeInTheDocument();
  });

  it('redireciona para o CardFlux quando não há baralho no state', async () => {
    renderCartas({});

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/cardflux'));
  });
});
