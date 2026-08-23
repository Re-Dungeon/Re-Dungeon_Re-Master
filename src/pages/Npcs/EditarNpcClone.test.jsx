import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const addRmCampanhaNpc = vi.fn();
const updateRmCampanhaNpc = vi.fn();
vi.mock('service/storage', () => ({
  addRmCampanhaNpc: (...args) => addRmCampanhaNpc(...args),
  updateRmCampanhaNpc: (...args) => updateRmCampanhaNpc(...args),
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

import EditarNpcClone from './EditarNpcClone';

const PERSONAGEM = {
  id: 'p1',
  nome: 'Grumnak, o Orc',
  linkImagem: 'https://example.com/img.png',
  descricao: 'Um orc',
};

const renderTela = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/npcs/clonar', state }]}>
      <EditarNpcClone />
    </MemoryRouter>,
  );

describe('EditarNpcClone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      currentUser: { uid: CURRENT_USER_UID },
      isAdmin: false,
      loadingPermissions: false,
    };
    campanhaAtiva = CAMPANHA_ATIVA;
  });

  it('mostra "Clonar {nome}" e pré-preenche nome/imagem/descrição a partir do personagem', async () => {
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() =>
      expect(screen.getByText('Clonar Grumnak, o Orc')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Grumnak, o Orc')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.com/img.png'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Um orc')).toBeInTheDocument();
  });

  it('cria o clone com campanhaId implícito e universoId/mestreId derivados da campanha ativa', async () => {
    addRmCampanhaNpc.mockResolvedValue({ id: 'clone-novo' });
    const user = userEvent.setup();
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => screen.getByLabelText('Personalidade'));
    await user.type(
      screen.getByLabelText('Personalidade'),
      'Rabugento, mas leal',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar Clone' }));

    await waitFor(() =>
      expect(addRmCampanhaNpc).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          origemPersonagemId: 'p1',
          nome: 'Grumnak, o Orc',
          personalidade: 'Rabugento, mas leal',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
    expect(navigate).toHaveBeenCalledWith('/npcs');
  });

  it('mostra "Editar clone" preenchido e salva via updateRmCampanhaNpc', async () => {
    updateRmCampanhaNpc.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTela({
      personagem: PERSONAGEM,
      clone: {
        id: 'clone1',
        origemPersonagemId: 'p1',
        nome: 'Grumnak, o Orc',
        estadoAtual: 'Ferido',
      },
    });

    await waitFor(() =>
      expect(
        screen.getByText('Editar clone de Grumnak, o Orc'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Ferido')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCampanhaNpc).toHaveBeenCalledWith(
        'c1',
        'clone1',
        expect.objectContaining({
          nome: 'Grumnak, o Orc',
          estadoAtual: 'Ferido',
        }),
      ),
    );
    expect(addRmCampanhaNpc).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de NPCs quando não há personagem de origem no state', async () => {
    renderTela(undefined);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/npcs'));
  });

  it('redireciona para a lista de NPCs quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/npcs'));
  });
});
