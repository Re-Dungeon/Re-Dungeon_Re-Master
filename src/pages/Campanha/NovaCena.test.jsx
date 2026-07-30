import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmCena = vi.fn();
const updateRmCena = vi.fn();
const getRmCampanhaNpcs = vi.fn(() => Promise.resolve([]));
const getRmCampanhaCriaturas = vi.fn(() => Promise.resolve([]));
const getRmMissoesPorCampanha = vi.fn(() => Promise.resolve([]));
vi.mock('service/storage', () => ({
  addRmCena: (...args) => addRmCena(...args),
  updateRmCena: (...args) => updateRmCena(...args),
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  getRmCampanhaCriaturas: (...args) => getRmCampanhaCriaturas(...args),
  getRmMissoesPorCampanha: (...args) => getRmMissoesPorCampanha(...args),
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

import NovaCena from './NovaCena';

const renderNova = state =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/campanha/cenas/nova', state }]}
    >
      <NovaCena />
    </MemoryRouter>,
  );

describe('NovaCena', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
  });

  it('mostra "Nova Cena" com o nome da campanha ativa', async () => {
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Cena')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Nova cena em Ascensão Carmesim'),
    ).toBeInTheDocument();
  });

  it('cria uma cena com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmCena.mockResolvedValue({ id: 'nova-cena' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Cena')).toBeInTheDocument(),
    );

    await user.type(
      screen.getByLabelText('Título da Cena'),
      'Chegada na Cidade',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar Cena' }));

    await waitFor(() =>
      expect(addRmCena).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Chegada na Cidade',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
          estado: 'nao_iniciado',
        }),
      ),
    );
  });

  it('mostra "Editar Cena" preenchida e salva via updateRmCena', async () => {
    updateRmCena.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({
      cena: {
        id: 'cena1',
        titulo: 'Chegada na Cidade',
        estado: 'concluido',
        pontosImportantes: [],
        consequencias: [],
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar Cena')).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Chegada na Cidade')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCena).toHaveBeenCalledWith(
        'cena1',
        expect.objectContaining({ titulo: 'Chegada na Cidade' }),
      ),
    );
    expect(addRmCena).not.toHaveBeenCalled();
  });

  it('adiciona e remove um ponto importante', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Cena')).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: '+ Adicionar ponto importante' }),
    );
    expect(
      screen.getByLabelText('Remover ponto importante'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remover ponto importante'));
    expect(
      screen.queryByLabelText('Remover ponto importante'),
    ).not.toBeInTheDocument();
  });

  it('adiciona uma consequência com texto e envia no submit', async () => {
    addRmCena.mockResolvedValue({ id: 'nova-cena' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Cena')).toBeInTheDocument(),
    );

    await user.type(screen.getByLabelText('Título da Cena'), 'Cena X');
    await user.click(
      screen.getByRole('button', { name: '+ Adicionar consequência' }),
    );
    await user.type(
      screen.getByPlaceholderText('Descreva a consequência'),
      'O prefeito foi salvo',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar Cena' }));

    await waitFor(() =>
      expect(addRmCena).toHaveBeenCalledWith(
        expect.objectContaining({
          consequencias: [
            expect.objectContaining({ texto: 'O prefeito foi salvo' }),
          ],
        }),
      ),
    );
  });

  it('redireciona para a lista de cenas quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.queryByText('Nova Cena')).not.toBeInTheDocument(),
    );
  });
});
