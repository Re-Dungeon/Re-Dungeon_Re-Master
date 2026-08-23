import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmMissao = vi.fn();
const updateRmMissao = vi.fn();
const getRmCampanhaNpcs = vi.fn(() => Promise.resolve([]));
const getRmCenas = vi.fn(() => Promise.resolve([]));
vi.mock('service/storage', () => ({
  addRmMissao: (...args) => addRmMissao(...args),
  updateRmMissao: (...args) => updateRmMissao(...args),
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  getRmCenas: (...args) => getRmCenas(...args),
}));

const CURRENT_USER_UID = 'mestre-1';
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

import NovaMissao from './NovaMissao';

const renderNova = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/missoes/nova', state }]}>
      <NovaMissao />
    </MemoryRouter>,
  );

describe('NovaMissao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      currentUser: { uid: CURRENT_USER_UID },
      isAdmin: false,
      loadingPermissions: false,
    };
    campanhaAtiva = CAMPANHA_ATIVA;
    getRmCampanhaNpcs.mockResolvedValue([]);
    getRmCenas.mockResolvedValue([]);
  });

  it('mostra "Nova Missão" com o nome da campanha ativa', async () => {
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Missão')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Nova missão em Ascensão Carmesim'),
    ).toBeInTheDocument();
  });

  it('cria uma missão com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmMissao.mockResolvedValue({ id: 'nova-missao' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Título'));
    await user.type(screen.getByLabelText('Título'), 'Resgatar o Prefeito');
    await user.click(screen.getByRole('button', { name: 'Salvar Missão' }));

    await waitFor(() =>
      expect(addRmMissao).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Resgatar o Prefeito',
          status: 'nao_iniciada',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('adiciona um objetivo, marca como concluído e envia no submit', async () => {
    addRmMissao.mockResolvedValue({ id: 'nova-missao' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Título'));
    await user.type(screen.getByLabelText('Título'), 'Missão X');
    await user.click(
      screen.getByRole('button', { name: '+ Adicionar objetivo' }),
    );
    await user.type(
      screen.getByPlaceholderText('Descreva o objetivo'),
      'Encontrar o mapa',
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Salvar Missão' }));

    await waitFor(() =>
      expect(addRmMissao).toHaveBeenCalledWith(
        expect.objectContaining({
          objetivos: [{ texto: 'Encontrar o mapa', concluido: true }],
        }),
      ),
    );
  });

  it('adiciona e remove uma recompensa', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Título'));
    await user.click(
      screen.getByRole('button', { name: '+ Adicionar recompensa' }),
    );
    expect(screen.getByLabelText('Remover recompensa')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remover recompensa'));
    expect(
      screen.queryByLabelText('Remover recompensa'),
    ).not.toBeInTheDocument();
  });

  it('mostra "Editar Missão" preenchida e salva via updateRmMissao', async () => {
    updateRmMissao.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({
      missao: {
        id: 'missao1',
        titulo: 'Resgatar o Prefeito',
        objetivos: [],
        recompensas: [],
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar Missão')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Resgatar o Prefeito')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmMissao).toHaveBeenCalledWith(
        'missao1',
        expect.objectContaining({ titulo: 'Resgatar o Prefeito' }),
      ),
    );
    expect(addRmMissao).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de missões quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.queryByText('Nova Missão')).not.toBeInTheDocument(),
    );
  });
});
