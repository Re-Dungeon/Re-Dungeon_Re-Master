import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const addRmCampanhaJogador = vi.fn();
const updateRmCampanhaJogador = vi.fn();
vi.mock('service/storage', () => ({
  addRmCampanhaJogador: (...args) => addRmCampanhaJogador(...args),
  updateRmCampanhaJogador: (...args) => updateRmCampanhaJogador(...args),
}));

const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canWrite, loadingPermissions: false }),
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: 'mestre-1',
};
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva: CAMPANHA_ATIVA,
    loadingCampanhas: false,
  }),
}));

import EditarJogadorClone from './EditarJogadorClone';

const PERSONAGEM = {
  id: 'p1',
  nome: 'Kaelen',
  linkImagem: 'https://example.com/img.png',
  descricao: 'Um caçador de recompensas taciturno',
};

const renderTela = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/jogadores/clonar', state }]}>
      <EditarJogadorClone />
    </MemoryRouter>,
  );

describe('EditarJogadorClone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
  });

  it('mostra "Clonar {nome}" e pré-preenche nome/imagem/descrição a partir do personagem', async () => {
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() =>
      expect(screen.getByText('Clonar Kaelen')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Kaelen')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.com/img.png'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Um caçador de recompensas taciturno'),
    ).toBeInTheDocument();
  });

  it('cria o clone com campanhaId implícito e universoId/mestreId derivados da campanha ativa', async () => {
    addRmCampanhaJogador.mockResolvedValue({ id: 'clone-novo' });
    const user = userEvent.setup();
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => screen.getByLabelText('Personalidade'));
    await user.type(screen.getByLabelText('Personalidade'), 'Calado e leal');
    await user.click(screen.getByRole('button', { name: 'Salvar Clone' }));

    await waitFor(() =>
      expect(addRmCampanhaJogador).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          origemPersonagemId: 'p1',
          nome: 'Kaelen',
          personalidade: 'Calado e leal',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
    expect(navigate).toHaveBeenCalledWith('/jogadores');
  });

  it('mostra "Editar clone" preenchido e salva via updateRmCampanhaJogador', async () => {
    updateRmCampanhaJogador.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderTela({
      personagem: PERSONAGEM,
      clone: {
        id: 'clone1',
        origemPersonagemId: 'p1',
        nome: 'Kaelen',
        estadoAtual: 'Ferido',
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar clone de Kaelen')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Ferido')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCampanhaJogador).toHaveBeenCalledWith(
        'c1',
        'clone1',
        expect.objectContaining({ nome: 'Kaelen', estadoAtual: 'Ferido' }),
      ),
    );
    expect(addRmCampanhaJogador).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de Jogadores quando não há personagem de origem no state', async () => {
    renderTela(undefined);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/jogadores'));
  });

  it('redireciona para a lista de Jogadores quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderTela({ personagem: PERSONAGEM });

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/jogadores'));
  });
});
