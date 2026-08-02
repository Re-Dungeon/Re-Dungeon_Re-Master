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
const getRmSessaoLogsPorCampanha = vi.fn();
const addRmCardfluxEstado = vi.fn();
const updateRmCardfluxEstado = vi.fn();
const addRmSessaoLog = vi.fn();
vi.mock('service/storage', () => ({
  getCardfluxCartas: (...args) => getCardfluxCartas(...args),
  getRmCardfluxEstadosPorCampanha: (...args) =>
    getRmCardfluxEstadosPorCampanha(...args),
  getRmSessaoLogsPorCampanha: (...args) => getRmSessaoLogsPorCampanha(...args),
  addRmCardfluxEstado: (...args) => addRmCardfluxEstado(...args),
  updateRmCardfluxEstado: (...args) => updateRmCardfluxEstado(...args),
  addRmSessaoLog: (...args) => addRmSessaoLog(...args),
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

import Sorteio from './Sorteio';

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
    deck: 'Eventos de Estrada',
    nome: 'Baú do Tesouro',
    tipo: 'Recompensa',
  },
  { id: 'carta-outro-deck', deck: 'Floresta', nome: 'Espírito da Floresta' },
];

// Simula o round-trip real do Firestore para rmCardfluxEstados: os mocks de
// leitura passam a refletir o que os mocks de escrita gravaram, em vez de
// devolver sempre o mesmo snapshot estático — necessário porque a tela
// relê o estado logo após criar/atualizar um doc (para saber o
// `estadoDocId` da carta sorteada antes de decidir a próxima ação).
const configurarFirestoreFake = (estadosIniciais = []) => {
  const store = estadosIniciais.map(e => ({ ...e }));
  getRmCardfluxEstadosPorCampanha.mockImplementation(async () =>
    store.map(e => ({ ...e })),
  );
  addRmCardfluxEstado.mockImplementation(async doc => {
    const novo = { id: `estado-gerado-${store.length + 1}`, ...doc };
    store.push(novo);
    return novo;
  });
  updateRmCardfluxEstado.mockImplementation(async (id, updates) => {
    const idx = store.findIndex(e => e.id === id);
    if (idx >= 0) store[idx] = { ...store[idx], ...updates };
  });
  return store;
};

const renderSorteio = (state = { baralho: BARALHO }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/cardflux/sorteio', state }]}>
      <Sorteio />
    </MemoryRouter>,
  );

describe('Sorteio (motor de sorteio ponderado por baralho)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
    getRmSessaoLogsPorCampanha.mockResolvedValue([]);
    addRmSessaoLog.mockResolvedValue({ id: 'log1' });
  });

  it('mostra o painel de configuração com o total planejado padrão (distância base 4)', async () => {
    configurarFirestoreFake();
    renderSorteio();

    await waitFor(() =>
      expect(
        screen.getByText('Sorteio — Eventos de Estrada'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('0 / 4')).toBeInTheDocument();
  });

  it('compra uma carta do pool válido, grava o estado e o log da sessão', async () => {
    // carta2 já descartada -> pool válido tem só carta1 (sorteio determinístico)
    configurarFirestoreFake([
      {
        id: 'estado2',
        campanhaId: 'c1',
        cartaId: 'carta2',
        estadoNoBaralho: 'descartada',
      },
    ]);
    const user = userEvent.setup();
    renderSorteio();

    await waitFor(() =>
      expect(
        screen.getByText('Sorteio — Eventos de Estrada'),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: '🎲 Comprar Carta' }));

    await waitFor(() =>
      expect(addRmCardfluxEstado).toHaveBeenCalledWith({
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: 'm1',
        cartaId: 'carta1',
        estadoNoBaralho: 'comprada',
        cooldownRestante: 0,
      }),
    );
    expect(addRmSessaoLog).toHaveBeenCalledWith(
      expect.objectContaining({
        cartaId: 'carta1',
        deck: 'Eventos de Estrada',
        numero: 1,
      }),
    );
    expect(
      screen.getByRole('heading', { name: 'Emboscada' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '🗑️ Descartar' }),
    ).toBeInTheDocument();
  });

  it('avisa quando não há cartas disponíveis no pool', async () => {
    configurarFirestoreFake([
      {
        id: 'estado1',
        campanhaId: 'c1',
        cartaId: 'carta1',
        estadoNoBaralho: 'comprada',
      },
      {
        id: 'estado2',
        campanhaId: 'c1',
        cartaId: 'carta2',
        estadoNoBaralho: 'descartada',
      },
    ]);
    const user = userEvent.setup();
    renderSorteio();

    await waitFor(() =>
      expect(
        screen.getByText('Sorteio — Eventos de Estrada'),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: '🎲 Comprar Carta' }));

    expect(screen.getByText('Nenhuma carta disponível')).toBeInTheDocument();
    expect(addRmCardfluxEstado).not.toHaveBeenCalled();
  });

  it('retorna a carta ao deck e zera o cooldown ao clicar em "Retornar ao Deck", atualizando o doc já criado no sorteio', async () => {
    configurarFirestoreFake([
      {
        id: 'estado2',
        campanhaId: 'c1',
        cartaId: 'carta2',
        estadoNoBaralho: 'descartada',
      },
    ]);
    const user = userEvent.setup();
    renderSorteio();

    await waitFor(() =>
      expect(
        screen.getByText('Sorteio — Eventos de Estrada'),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: '🎲 Comprar Carta' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '↩️ Retornar ao Deck' }),
      ).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: '↩️ Retornar ao Deck' }),
    );

    await waitFor(() =>
      expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado-gerado-2', {
        estadoNoBaralho: 'no_baralho',
        cooldownRestante: 0,
      }),
    );
  });

  it('reembaralha o baralho devolvendo as cartas compradas/descartadas ao pool', async () => {
    configurarFirestoreFake([
      {
        id: 'estado1',
        campanhaId: 'c1',
        cartaId: 'carta1',
        estadoNoBaralho: 'comprada',
      },
      {
        id: 'estado2',
        campanhaId: 'c1',
        cartaId: 'carta2',
        estadoNoBaralho: 'descartada',
      },
    ]);
    const user = userEvent.setup();
    renderSorteio();

    await waitFor(() =>
      expect(
        screen.getByText('Sorteio — Eventos de Estrada'),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Reembaralhar' }));

    await waitFor(() =>
      expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
        estadoNoBaralho: 'no_baralho',
        cooldownRestante: 0,
      }),
    );
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado2', {
      estadoNoBaralho: 'no_baralho',
      cooldownRestante: 0,
    });
  });

  it('redireciona para o CardFlux quando não há baralho no state', async () => {
    configurarFirestoreFake();
    renderSorteio({});

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/cardflux'));
  });
});
