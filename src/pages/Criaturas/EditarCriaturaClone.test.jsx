import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const addRmCampanhaCriatura = vi.fn();
const updateRmCampanhaCriatura = vi.fn();
vi.mock('service/storage', () => ({
  addRmCampanhaCriatura: (...args) => addRmCampanhaCriatura(...args),
  updateRmCampanhaCriatura: (...args) => updateRmCampanhaCriatura(...args),
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

import EditarCriaturaClone from './EditarCriaturaClone';

const PERSONAGEM = {
  id: 'p1',
  nome: 'Fera das Sombras',
  linkImagem: 'https://example.com/img.png',
  descricao: 'Assombra a floresta',
};

const renderTela = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/criaturas/clonar', state }]}>
      <EditarCriaturaClone />
    </MemoryRouter>,
  );

describe('EditarCriaturaClone', () => {
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
      expect(screen.getByText('Clonar Fera das Sombras')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Fera das Sombras')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.com/img.png'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('Assombra a floresta')).toBeInTheDocument();
  });

  it('cria o clone com campanhaId implícito e universoId/mestreId derivados da campanha ativa', async () => {
    addRmCampanhaCriatura.mockResolvedValue({ id: 'clone-novo' });
    const user = userEvent.setup();
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => screen.getByLabelText('Comportamento'));
    await user.type(screen.getByLabelText('Comportamento'), 'Ataca em bando');
    await user.click(screen.getByRole('button', { name: 'Salvar Clone' }));

    await waitFor(() =>
      expect(addRmCampanhaCriatura).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          origemPersonagemId: 'p1',
          nome: 'Fera das Sombras',
          comportamento: 'Ataca em bando',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
    expect(navigate).toHaveBeenCalledWith('/criaturas');
  });

  it('adiciona e remove uma entrada do histórico de encontros', async () => {
    const user = userEvent.setup();
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => screen.getByLabelText('Comportamento'));
    await user.click(
      screen.getByRole('button', { name: '+ Adicionar encontro' }),
    );
    expect(
      screen.getByLabelText('Remover entrada do histórico'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remover entrada do histórico'));
    expect(
      screen.queryByLabelText('Remover entrada do histórico'),
    ).not.toBeInTheDocument();
  });

  it('mostra "Editar clone" preenchido e salva via updateRmCampanhaCriatura', async () => {
    updateRmCampanhaCriatura.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTela({
      personagem: PERSONAGEM,
      clone: {
        id: 'clone1',
        origemPersonagemId: 'p1',
        nome: 'Fera das Sombras',
        habitat: 'Floresta Sombria',
      },
    });

    await waitFor(() =>
      expect(
        screen.getByText('Editar clone de Fera das Sombras'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Floresta Sombria')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCampanhaCriatura).toHaveBeenCalledWith(
        'c1',
        'clone1',
        expect.objectContaining({
          nome: 'Fera das Sombras',
          habitat: 'Floresta Sombria',
        }),
      ),
    );
    expect(addRmCampanhaCriatura).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de Criaturas quando não há personagem de origem no state', async () => {
    renderTela(undefined);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/criaturas'));
  });

  it('redireciona para a lista de Criaturas quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/criaturas'));
  });
});
