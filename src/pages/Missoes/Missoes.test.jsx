import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const getRmMissoesPorCampanha = vi.fn();
const removeRmMissao = vi.fn();
vi.mock('service/storage', () => ({
  getRmMissoesPorCampanha: (...args) => getRmMissoesPorCampanha(...args),
  removeRmMissao: (...args) => removeRmMissao(...args),
}));

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canCreate, canWrite }),
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

import Missoes from './Missoes';

const MISSOES_MOCK = [
  {
    id: 'missao1',
    campanhaId: 'c1',
    titulo: 'Resgatar o Prefeito',
    status: 'em_andamento',
    objetivos: [
      { texto: 'Encontrar o mapa', concluido: true },
      { texto: 'Chegar na masmorra', concluido: false },
    ],
  },
  {
    id: 'missao2',
    campanhaId: 'c1',
    titulo: 'Investigar a Praça',
    status: 'nao_iniciada',
  },
];

const renderMissoes = () =>
  render(
    <MemoryRouter>
      <Missoes />
    </MemoryRouter>,
  );

describe('Missoes (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmMissoesPorCampanha.mockResolvedValue(MISSOES_MOCK);
  });

  it('lista as missões da campanha ativa com status e progresso', async () => {
    renderMissoes();

    await waitFor(() =>
      expect(screen.getByText('Resgatar o Prefeito')).toBeInTheDocument(),
    );
    expect(screen.getByText('Investigar a Praça')).toBeInTheDocument();
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Objetivos: 1/2 concluídos')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há missões', async () => {
    getRmMissoesPorCampanha.mockResolvedValue([]);
    renderMissoes();

    await waitFor(() =>
      expect(screen.getByText('Nenhuma missão cadastrada')).toBeInTheDocument(),
    );
  });

  it('remove uma missão', async () => {
    removeRmMissao.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderMissoes();

    await waitFor(() =>
      expect(screen.getByText('Resgatar o Prefeito')).toBeInTheDocument(),
    );
    await user.click(
      screen.getByLabelText('Remover missão Resgatar o Prefeito'),
    );

    await waitFor(() => expect(removeRmMissao).toHaveBeenCalledWith('missao1'));
  });

  it('não mostra ações de criar/editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderMissoes();

    await waitFor(() =>
      expect(screen.getByText('Resgatar o Prefeito')).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('Editar missão Resgatar o Prefeito'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '+ Nova Missão' }),
    ).not.toBeInTheDocument();
  });
});
