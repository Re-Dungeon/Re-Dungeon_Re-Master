import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getPersonagensJogaveis = vi.fn();
const getRmCampanhaJogadores = vi.fn();
const removeRmCampanhaJogador = vi.fn();
const getPersonagemSubcolecao = vi.fn();
const getCondicoes = vi.fn();
vi.mock('service/storage', () => ({
  getPersonagensJogaveis: (...args) => getPersonagensJogaveis(...args),
  getRmCampanhaJogadores: (...args) => getRmCampanhaJogadores(...args),
  removeRmCampanhaJogador: (...args) => removeRmCampanhaJogador(...args),
  getPersonagemSubcolecao: (...args) => getPersonagemSubcolecao(...args),
  getCondicoes: (...args) => getCondicoes(...args),
}));

const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canWrite }),
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

import Jogadores from './Jogadores';

const PERSONAGENS_MOCK = [
  {
    id: 'p1',
    nome: 'Kaelen',
    tipo: 'Personagem Jogável',
    universo: 'u1',
    campanhas: ['c1'],
    descricao: 'Um caçador de recompensas taciturno',
  },
  {
    id: 'p2',
    nome: 'Sora',
    tipo: 'Personagem Jogável',
    universo: 'u1',
    campanhas: ['c1', 'c2'],
  },
  {
    id: 'p3',
    nome: 'Fera das Sombras',
    tipo: 'Criatura',
    universo: 'u1',
    campanhas: ['c1'],
  },
  {
    id: 'p4',
    nome: 'De outra campanha',
    tipo: 'Personagem Jogável',
    universo: 'u1',
    campanhas: ['c2'],
  },
  {
    id: 'p5',
    nome: 'De outro universo',
    tipo: 'Personagem Jogável',
    universo: 'outro',
    campanhas: ['c1'],
  },
];

const renderJogadores = () =>
  render(
    <MemoryRouter>
      <Jogadores />
    </MemoryRouter>,
  );

describe('Jogadores (personagens jogáveis do Universo vinculados à campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
    getPersonagensJogaveis.mockResolvedValue(PERSONAGENS_MOCK);
    getRmCampanhaJogadores.mockResolvedValue([]);
    getPersonagemSubcolecao.mockResolvedValue([]);
    getCondicoes.mockResolvedValue([]);
  });

  it('lista só personagens tipo Personagem Jogável, do universo da campanha, vinculados a ela pelo campo campanhas', async () => {
    renderJogadores();

    await waitFor(() => expect(screen.getByText('Kaelen')).toBeInTheDocument());
    expect(screen.getByText('Sora')).toBeInTheDocument();
    expect(screen.queryByText('Fera das Sombras')).not.toBeInTheDocument();
    expect(screen.queryByText('De outra campanha')).not.toBeInTheDocument();
    expect(screen.queryByText('De outro universo')).not.toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há jogadores vinculados', async () => {
    getPersonagensJogaveis.mockResolvedValue([]);
    renderJogadores();

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum jogador vinculado a esta campanha'),
      ).toBeInTheDocument(),
    );
  });

  it('abre a ficha completa do personagem ao clicar em "Ver ficha"', async () => {
    const user = userEvent.setup();
    renderJogadores();

    await waitFor(() => expect(screen.getByText('Kaelen')).toBeInTheDocument());
    await user.click(screen.getAllByRole('button', { name: /Ver ficha/i })[0]);

    expect(
      screen.getByText('Ficha completa do personagem'),
    ).toBeInTheDocument();
  });

  it('navega para a tela de clone ao clicar em "Clonar"', async () => {
    const user = userEvent.setup();
    renderJogadores();

    await waitFor(() => expect(screen.getByText('Kaelen')).toBeInTheDocument());
    await user.click(screen.getAllByRole('button', { name: /Clonar/i })[0]);

    expect(navigate).toHaveBeenCalledWith(
      '/jogadores/clonar',
      expect.objectContaining({ state: { personagem: PERSONAGENS_MOCK[0] } }),
    );
  });

  it('mostra "Clonado nesta campanha" e ações de editar/remover quando já existe um clone', async () => {
    getRmCampanhaJogadores.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Kaelen' },
    ]);
    renderJogadores();

    await waitFor(() =>
      expect(screen.getByText('Clonado nesta campanha')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Editar clone de Kaelen')).toBeInTheDocument();
    // Só Sora (sem clone) ainda mostra o botão "Clonar" — Kaelen (já clonado) não.
    expect(screen.getAllByRole('button', { name: /Clonar/i })).toHaveLength(1);
  });

  it('remove um clone', async () => {
    getRmCampanhaJogadores.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Kaelen' },
    ]);
    removeRmCampanhaJogador.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderJogadores();

    await waitFor(() =>
      expect(screen.getByText('Clonado nesta campanha')).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Remover clone de Kaelen'));

    await waitFor(() =>
      expect(removeRmCampanhaJogador).toHaveBeenCalledWith('c1', 'clone1'),
    );
  });

  it('não mostra ações de clonar/editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    getRmCampanhaJogadores.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Kaelen' },
    ]);
    renderJogadores();

    await waitFor(() => expect(screen.getByText('Kaelen')).toBeInTheDocument());
    expect(
      screen.queryByRole('button', { name: /Clonar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Editar clone de Kaelen'),
    ).not.toBeInTheDocument();
  });

  it('mostra o erro de carregamento e permite tentar de novo', async () => {
    getPersonagensJogaveis.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderJogadores();

    await waitFor(() =>
      expect(
        screen.getByText('Erro ao carregar os jogadores.'),
      ).toBeInTheDocument(),
    );

    getPersonagensJogaveis.mockResolvedValue(PERSONAGENS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.getByText('Kaelen')).toBeInTheDocument());
  });
});
