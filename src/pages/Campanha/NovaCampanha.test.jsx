import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmCampanha = vi.fn();
const updateRmCampanha = vi.fn();
vi.mock('service/storage', () => ({
  addRmCampanha: (...args) => addRmCampanha(...args),
  updateRmCampanha: (...args) => updateRmCampanha(...args),
  getUniversos: vi.fn().mockResolvedValue([{ id: 'u1', Nome: 'Prime' }]),
}));

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({
    canCreate,
    canWrite,
    isAdmin: true,
    allowedUniversos: [],
    loadingPermissions: false,
    currentUser: { uid: 'mestre-1' },
  }),
}));

const recarregarCampanhas = vi.fn();
const setCampanhaAtiva = vi.fn();
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ recarregarCampanhas, setCampanhaAtiva }),
}));

import NovaCampanha from './NovaCampanha';

const renderNova = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/campanha/nova', state }]}>
      <NovaCampanha />
    </MemoryRouter>,
  );

describe('NovaCampanha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    recarregarCampanhas.mockResolvedValue(undefined);
  });

  it('mostra "Nova Campanha" e o placeholder de preview antes de preencher a imagem', async () => {
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Campanha')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Insira um link para ver o preview'),
    ).toBeInTheDocument();
  });

  it('cria uma campanha com mestreId do usuário logado, recarrega e a ativa', async () => {
    addRmCampanha.mockResolvedValue({ id: 'nova-id', nome: 'Nova Aventura' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Campanha')).toBeInTheDocument(),
    );

    await user.type(
      screen.getByLabelText('Nome da Campanha'),
      'Nova Aventura',
    );
    await user.click(screen.getByRole('combobox', { name: 'Universo' }));
    await user.click(await screen.findByRole('option', { name: 'Prime' }));
    await user.click(screen.getByRole('button', { name: 'Salvar Campanha' }));

    await waitFor(() =>
      expect(addRmCampanha).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Nova Aventura',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
    expect(updateRmCampanha).not.toHaveBeenCalled();
    await waitFor(() => expect(recarregarCampanhas).toHaveBeenCalledTimes(1));
    expect(setCampanhaAtiva).toHaveBeenCalledWith('nova-id');
  });

  it('mostra "Editar Campanha" preenchida e salva via updateRmCampanha sem mexer no mestreId', async () => {
    updateRmCampanha.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({
      campanha: {
        id: 'c1',
        nome: 'Ascensão Carmesim',
        universoId: 'u1',
        mestreId: 'mestre-1',
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar Campanha')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Ascensão Carmesim')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCampanha).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ nome: 'Ascensão Carmesim', mestreId: 'mestre-1' }),
      ),
    );
    expect(addRmCampanha).not.toHaveBeenCalled();
    expect(setCampanhaAtiva).not.toHaveBeenCalled();
  });

  it('exige a seleção de um Universo', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Campanha')).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText('Nome da Campanha'), 'Aventura');
    await user.click(screen.getByRole('button', { name: 'Salvar Campanha' }));

    expect(await screen.findByText('Selecione um Universo')).toBeInTheDocument();
    expect(addRmCampanha).not.toHaveBeenCalled();
  });
});
