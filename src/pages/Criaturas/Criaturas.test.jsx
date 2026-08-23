import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getPersonagens = vi.fn();
const getRmCampanhaCriaturas = vi.fn();
const removeRmCampanhaCriatura = vi.fn();
const getPersonagemSubcolecao = vi.fn();
const getCondicoes = vi.fn();
vi.mock('service/storage', () => ({
  getPersonagens: (...args) => getPersonagens(...args),
  getRmCampanhaCriaturas: (...args) => getRmCampanhaCriaturas(...args),
  removeRmCampanhaCriatura: (...args) => removeRmCampanhaCriatura(...args),
  getPersonagemSubcolecao: (...args) => getPersonagemSubcolecao(...args),
  getCondicoes: (...args) => getCondicoes(...args),
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

import Criaturas from './Criaturas';

const PERSONAGENS_MOCK = [
  {
    id: 'p1',
    nome: 'Fera das Sombras',
    tipo: 'Criatura',
    universo: 'u1',
    campanhas: ['c1'],
    descricao: 'Assombra a floresta',
  },
  {
    id: 'p2',
    nome: 'Golem de Pedra',
    tipo: 'Criatura',
    universo: 'u1',
    campanhas: ['c1', 'c2'],
  },
  {
    id: 'p3',
    nome: 'Grumnak, o Orc',
    tipo: 'NPC',
    universo: 'u1',
    campanhas: ['c1'],
  },
  {
    id: 'p4',
    nome: 'De outra campanha',
    tipo: 'Criatura',
    universo: 'u1',
    campanhas: ['c2'],
  },
  {
    id: 'p5',
    nome: 'De outro universo',
    tipo: 'Criatura',
    universo: 'outro',
    campanhas: ['c1'],
  },
];

const renderCriaturas = () =>
  render(
    <MemoryRouter>
      <Criaturas />
    </MemoryRouter>,
  );

describe('Criaturas (personagens do Universo vinculados à campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { currentUser: { uid: CURRENT_USER_UID }, isAdmin: false };
    campanhaAtiva = CAMPANHA_ATIVA;
    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
    getRmCampanhaCriaturas.mockResolvedValue([]);
    getPersonagemSubcolecao.mockResolvedValue([]);
    getCondicoes.mockResolvedValue([]);
  });

  it('lista só personagens tipo Criatura, do universo da campanha, vinculados a ela pelo campo campanhas', async () => {
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByText('Fera das Sombras')).toBeInTheDocument(),
    );
    expect(screen.getByText('Golem de Pedra')).toBeInTheDocument();
    expect(screen.queryByText('Grumnak, o Orc')).not.toBeInTheDocument();
    expect(screen.queryByText('De outra campanha')).not.toBeInTheDocument();
    expect(screen.queryByText('De outro universo')).not.toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há criaturas vinculadas', async () => {
    getPersonagens.mockResolvedValue([]);
    renderCriaturas();

    await waitFor(() =>
      expect(
        screen.getByText('Nenhuma criatura vinculada a esta campanha'),
      ).toBeInTheDocument(),
    );
  });

  it('abre a ficha completa do personagem ao clicar em "Ver ficha"', async () => {
    const user = userEvent.setup();
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByText('Fera das Sombras')).toBeInTheDocument(),
    );
    await user.click(screen.getAllByRole('button', { name: /Ver ficha/i })[0]);

    expect(
      screen.getByText('Ficha completa do personagem'),
    ).toBeInTheDocument();
  });

  it('navega para a tela de clone ao clicar em "Clonar"', async () => {
    const user = userEvent.setup();
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByText('Fera das Sombras')).toBeInTheDocument(),
    );
    await user.click(screen.getAllByRole('button', { name: /Clonar/i })[0]);

    expect(navigate).toHaveBeenCalledWith(
      '/criaturas/clonar',
      expect.objectContaining({ state: { personagem: PERSONAGENS_MOCK[0] } }),
    );
  });

  it('mostra o badge visual de clone e ações de editar/remover quando já existe um clone', async () => {
    getRmCampanhaCriaturas.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Fera das Sombras' },
    ]);
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByAltText('Clonado nesta campanha')).toBeInTheDocument(),
    );
    expect(
      screen.getByLabelText('Editar clone de Fera das Sombras'),
    ).toBeInTheDocument();
    // Só Golem de Pedra (sem clone) ainda mostra o botão "Clonar".
    expect(screen.getAllByRole('button', { name: /Clonar/i })).toHaveLength(1);
  });

  it('remove um clone', async () => {
    getRmCampanhaCriaturas.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Fera das Sombras' },
    ]);
    removeRmCampanhaCriatura.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByAltText('Clonado nesta campanha')).toBeInTheDocument(),
    );
    await user.click(
      screen.getByLabelText('Remover clone de Fera das Sombras'),
    );

    await waitFor(() =>
      expect(removeRmCampanhaCriatura).toHaveBeenCalledWith('c1', 'clone1'),
    );
  });

  it('não mostra ações de clonar/editar/remover quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    getRmCampanhaCriaturas.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Fera das Sombras' },
    ]);
    renderCriaturas();

    await waitFor(() =>
      expect(screen.getByText('Fera das Sombras')).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: /Clonar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Editar clone de Fera das Sombras'),
    ).not.toBeInTheDocument();
  });

  it('mostra o erro de carregamento e permite tentar de novo', async () => {
    getPersonagens.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderCriaturas();

    await waitFor(() =>
      expect(
        screen.getByText('Erro ao carregar as criaturas.'),
      ).toBeInTheDocument(),
    );

    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() =>
      expect(screen.getByText('Fera das Sombras')).toBeInTheDocument(),
    );
  });
});
