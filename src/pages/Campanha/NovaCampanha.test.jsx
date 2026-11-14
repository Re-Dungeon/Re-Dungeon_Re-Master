import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmCampanha = vi.fn();
const updateRmCampanha = vi.fn();
const getUniversos = vi.fn();
vi.mock('service/storage', () => ({
  addRmCampanha: (...args) => addRmCampanha(...args),
  updateRmCampanha: (...args) => updateRmCampanha(...args),
  getUniversos: (...args) => getUniversos(...args),
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

import { invalidateUniversosCache } from 'hooks/useUniversos';
import NovaCampanha from './NovaCampanha';

const renderNova = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/campanha/nova', state }]}>
      <NovaCampanha />
    </MemoryRouter>,
  );

describe('NovaCampanha', () => {
  beforeEach(() => {
    invalidateUniversosCache();
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    recarregarCampanhas.mockResolvedValue(undefined);
    getUniversos.mockResolvedValue([
      { id: 'u1', Nome: 'Prime', ativo: true },
      { id: 'u2', Nome: 'Segundo', ativo: false },
      { id: 'u3', Nome: 'Terceiro' },
    ]);
  });

  it('mostra "Nova Campanha" e o placeholder de preview antes de preencher a imagem', async () => {
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Campanha')).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/cole uma url válida/i),
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

  it('não mostra universos inativos ao criar uma campanha nova', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Campanha')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: 'Universo' }));

    expect(await screen.findByRole('option', { name: 'Prime' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Segundo' })).not.toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Terceiro' })).toBeInTheDocument();
  });

  it('ordena os universos em ordem alfabética e permite pesquisar', async () => {
    getUniversos.mockResolvedValue([
      { id: 'u2', Nome: 'Zeta', ativo: true },
      { id: 'u1', Nome: 'Alfa', ativo: true },
      { id: 'u3', Nome: 'Beta', ativo: true },
    ]);

    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Campanha')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: 'Universo' }));

    const opcoes = await screen.findAllByRole('option');
    expect(opcoes.map(opcao => opcao.textContent)).toEqual(['Alfa', 'Beta', 'Zeta']);

    await user.clear(screen.getByRole('combobox', { name: 'Universo' }));
    await user.type(screen.getByRole('combobox', { name: 'Universo' }), 'be');

    expect(screen.getAllByRole('option').map(opcao => opcao.textContent)).toEqual([
      'Beta',
    ]);
  });

  it('preserva o universo inativo ao editar a campanha existente', async () => {
    updateRmCampanha.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({
      campanha: {
        id: 'c1',
        nome: 'Campanha Antiga',
        universoId: 'u2',
        mestreId: 'mestre-1',
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar Campanha')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('combobox', { name: 'Universo' }));
    expect(await screen.findByRole('option', { name: 'Segundo' })).toBeInTheDocument();
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
