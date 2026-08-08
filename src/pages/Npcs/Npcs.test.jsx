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
const getRmCampanhaNpcs = vi.fn();
const removeRmCampanhaNpc = vi.fn();
const getPersonagemSubcolecao = vi.fn();
vi.mock('service/storage', () => ({
  getPersonagens: (...args) => getPersonagens(...args),
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  removeRmCampanhaNpc: (...args) => removeRmCampanhaNpc(...args),
  getPersonagemSubcolecao: (...args) => getPersonagemSubcolecao(...args),
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

import Npcs from './Npcs';

const PERSONAGENS_MOCK = [
  {
    id: 'p1',
    nome: 'Grumnak, o Orc',
    tipo: 'NPC',
    universo: 'u1',
    campanhas: ['c1'],
    descricao: 'Um orc rabugento',
    totais: {
      forca: 31,
      vitalidade: 41,
      agilidade: 51,
      inteligencia: 61,
      percepcao: 71,
      sorte: 81,
    },
  },
  {
    id: 'p2',
    nome: 'Sacerdotisa Lyra',
    tipo: 'NPC',
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
    tipo: 'NPC',
    universo: 'u1',
    campanhas: ['c2'],
  },
  {
    id: 'p5',
    nome: 'De outro universo',
    tipo: 'NPC',
    universo: 'outro',
    campanhas: ['c1'],
  },
];

const renderNpcs = () =>
  render(
    <MemoryRouter>
      <Npcs />
    </MemoryRouter>,
  );

describe('Npcs (personagens do Universo vinculados à campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
    getRmCampanhaNpcs.mockResolvedValue([]);
    getPersonagemSubcolecao.mockResolvedValue([]);
  });

  it('lista só personagens tipo NPC, do universo da campanha, vinculados a ela pelo campo campanhas', async () => {
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );
    expect(screen.getByText('Sacerdotisa Lyra')).toBeInTheDocument();
    expect(screen.queryByText('Fera das Sombras')).not.toBeInTheDocument();
    expect(screen.queryByText('De outra campanha')).not.toBeInTheDocument();
    expect(screen.queryByText('De outro universo')).not.toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há NPCs vinculados', async () => {
    getPersonagens.mockResolvedValue([]);
    renderNpcs();

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum NPC vinculado a esta campanha'),
      ).toBeInTheDocument(),
    );
  });

  it('exibe a grade de atributos e mantém apenas o ícone de ver ficha no cabeçalho', async () => {
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );

    expect(screen.getAllByText('FOR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('VIT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AGI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('INT').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PER').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SOR').length).toBeGreaterThan(0);

    expect(
      screen.getByLabelText('Ver ficha de Grumnak, o Orc'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clonar' })).not.toBeInTheDocument();
  });

  it('mostra valores totais de atributos no card de NPC quando disponíveis', async () => {
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );

    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText('51')).toBeInTheDocument();
    expect(screen.getByText('61')).toBeInTheDocument();
    expect(screen.getByText('71')).toBeInTheDocument();
    expect(screen.getByText('81')).toBeInTheDocument();
  });

  it('abre a ficha completa do personagem ao clicar no ícone de ver ficha', async () => {
    const user = userEvent.setup();
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Ver ficha de Grumnak, o Orc'));

    expect(
      screen.getByText('Ficha completa do personagem'),
    ).toBeInTheDocument();
  });

  it('não mostra o botão de clonar no card simplificado', async () => {
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );

    expect(screen.queryByRole('button', { name: 'Clonar' })).not.toBeInTheDocument();
  });

  it('mostra "Clonado nesta campanha" e ações de editar/remover quando já existe um clone', async () => {
    getRmCampanhaNpcs.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Grumnak, o Orc' },
    ]);
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Clonado nesta campanha')).toBeInTheDocument(),
    );
    expect(
      screen.getByLabelText('Editar clone de Grumnak, o Orc'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Clonar' }),
    ).not.toBeInTheDocument();
  });

  it('remove um clone', async () => {
    getRmCampanhaNpcs.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Grumnak, o Orc' },
    ]);
    removeRmCampanhaNpc.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Clonado nesta campanha')).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Remover clone de Grumnak, o Orc'));

    await waitFor(() =>
      expect(removeRmCampanhaNpc).toHaveBeenCalledWith('c1', 'clone1'),
    );
  });

  it('não mostra ações de editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    getRmCampanhaNpcs.mockResolvedValue([
      { id: 'clone1', origemPersonagemId: 'p1', nome: 'Grumnak, o Orc' },
    ]);
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: 'Clonar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Editar clone de Grumnak, o Orc'),
    ).not.toBeInTheDocument();
  });

  it('mostra o erro de carregamento e permite tentar de novo', async () => {
    getPersonagens.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderNpcs();

    await waitFor(() =>
      expect(screen.getByText('Erro ao carregar os NPCs.')).toBeInTheDocument(),
    );

    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );
  });
});
