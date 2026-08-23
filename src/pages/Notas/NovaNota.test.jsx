import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmNota = vi.fn();
const updateRmNota = vi.fn();
const getRmCenas = vi.fn(() => Promise.resolve([]));
vi.mock('service/storage', () => ({
  addRmNota: (...args) => addRmNota(...args),
  updateRmNota: (...args) => updateRmNota(...args),
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
  useCampanha: () => ({ campanhaAtiva, loadingCampanhas: false }),
}));

import NovaNota from './NovaNota';

const renderNova = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/notas/nova', state }]}>
      <NovaNota />
    </MemoryRouter>,
  );

describe('NovaNota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      currentUser: { uid: CURRENT_USER_UID },
      isAdmin: false,
      loadingPermissions: false,
    };
    campanhaAtiva = CAMPANHA_ATIVA;
    getRmCenas.mockResolvedValue([]);
  });

  it('mostra "Nova Nota" com o nome da campanha ativa', async () => {
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Nota')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Nova nota em Ascensão Carmesim'),
    ).toBeInTheDocument();
  });

  it('cria uma nota com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmNota.mockResolvedValue({ id: 'nova-nota' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Título'));
    await user.type(
      screen.getByLabelText('Título'),
      'Ideia para a próxima sessão',
    );
    await user.type(
      screen.getByLabelText('Conteúdo'),
      'O vilão pode aparecer na taverna.',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

    await waitFor(() =>
      expect(addRmNota).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Ideia para a próxima sessão',
          conteudo: 'O vilão pode aparecer na taverna.',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('mostra o seletor de cena quando a campanha tem cenas cadastradas', async () => {
    getRmCenas.mockResolvedValue([
      { id: 'cena1', campanhaId: 'c1', titulo: 'Chegada na Cidade' },
    ]);
    renderNova(undefined);

    await waitFor(() =>
      expect(
        screen.getByLabelText('Vincular a uma Cena (opcional)'),
      ).toBeInTheDocument(),
    );
  });

  it('mostra "Editar Nota" preenchida e salva via updateRmNota', async () => {
    updateRmNota.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({
      nota: {
        id: 'nota1',
        titulo: 'Ideia para a próxima sessão',
        conteudo: '',
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar Nota')).toBeInTheDocument(),
    );
    expect(
      screen.getByDisplayValue('Ideia para a próxima sessão'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmNota).toHaveBeenCalledWith(
        'nota1',
        expect.objectContaining({ titulo: 'Ideia para a próxima sessão' }),
      ),
    );
    expect(addRmNota).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de notas quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.queryByText('Nova Nota')).not.toBeInTheDocument(),
    );
  });
});
