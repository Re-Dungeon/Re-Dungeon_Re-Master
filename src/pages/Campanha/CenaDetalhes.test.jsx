import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
const getRmCenas = vi.fn();
const updateRmCampanha = vi.fn();
const recarregarCampanhas = vi.fn();
const removeRmCena = vi.fn();
const updateRmCena = vi.fn();
const registrarEventoSessao = vi.fn();
const notifyError = vi.fn();

vi.mock('common/utils/sessaoLog', () => ({
  TIPO_EVENTO_SESSAO: { CENA_ATUAL: 'cena_atual' },
  registrarEventoSessao: (...args) => registrarEventoSessao(...args),
}));

vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({ notifyError, notifySuccess: vi.fn() }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
    useParams: () => ({ cenaId: 'cena1' }),
  };
});

vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'm1' }, isAdmin: false }),
}));

vi.mock('context/CampanhaContext', () => {
  // Referência estável, como no contexto real (um objeto novo a cada render
  // refaria o efeito de carga em loop).
  const campanhaAtiva = {
    id: 'campanha-1',
    nome: 'Ascensão Carmesim',
    universoId: 'u1',
    mestreId: 'm1',
    cenaAtualId: 'cena2',
  };
  return {
    useCampanha: () => ({ campanhaAtiva, recarregarCampanhas }),
  };
});

vi.mock('service/storage', () => ({
  getRmCenas: (...args) => getRmCenas(...args),
  updateRmCampanha: (...args) => updateRmCampanha(...args),
  removeRmCena: (...args) => removeRmCena(...args),
  updateRmCena: (...args) => updateRmCena(...args),
}));

import CenaDetalhes from './CenaDetalhes';

const renderCenaDetalhes = () =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/campanha/cenas/cena1' }]}> 
      <CenaDetalhes />
    </MemoryRouter>,
  );

describe('CenaDetalhes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRmCenas.mockResolvedValue([
      {
        id: 'cena1',
        titulo: 'A Chegada',
        resumo: 'Resumo da cena',
        objetivo: 'Falar com o prefeito',
        descricaoNarracao: 'Narrativa da cena',
        estado: 'em_andamento',
        numeroCena: 1,
      },
      {
        id: 'cena2',
        titulo: 'O Encontro',
        estado: 'concluido',
        numeroCena: 2,
      },
    ]);
  });

  it('navega para o editor da cena ao clicar em Editar', async () => {
    const user = userEvent.setup();
    renderCenaDetalhes();

    await waitFor(() =>
      expect(screen.getAllByText('A Chegada').length).toBeGreaterThan(0),
    );

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(navigate).toHaveBeenCalledWith('/campanha/cenas/nova', {
      state: { cena: expect.objectContaining({ id: 'cena1', titulo: 'A Chegada' }) },
    });
  });

  it('marcar como cena atual atualiza a campanha e registra no log da sessão', async () => {
    updateRmCampanha.mockResolvedValue(undefined);
    recarregarCampanhas.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCenaDetalhes();

    await user.click(await screen.findByRole('button', { name: 'Marcar como Cena Atual' }));

    await waitFor(() =>
      expect(registrarEventoSessao).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'campanha-1' }),
        'cena_atual',
        'Cena atual: "A Chegada"',
        { cenaId: 'cena1' },
      ),
    );
    expect(updateRmCampanha).toHaveBeenCalledWith('campanha-1', { cenaAtualId: 'cena1' });
  });

  it('não registra no log quando marcar a cena atual falha', async () => {
    updateRmCampanha.mockRejectedValue(new Error('falha'));
    const user = userEvent.setup();
    renderCenaDetalhes();

    await user.click(await screen.findByRole('button', { name: 'Marcar como Cena Atual' }));

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith('Não foi possível marcar a cena atual.'),
    );
    expect(registrarEventoSessao).not.toHaveBeenCalled();
  });

  it('distingue "não encontrada" de falha ao carregar e deixa tentar de novo', async () => {
    const user = userEvent.setup();
    getRmCenas.mockRejectedValueOnce(new Error('offline'));
    renderCenaDetalhes();

    expect(
      await screen.findByText('Não foi possível carregar a cena'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Cena não encontrada')).not.toBeInTheDocument();
    expect(notifyError).toHaveBeenCalledWith('Não foi possível carregar a cena.');

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await waitFor(() =>
      expect(screen.getAllByText('A Chegada').length).toBeGreaterThan(0),
    );
    expect(getRmCenas).toHaveBeenCalledTimes(2);
  });

  it('mostra "Cena não encontrada" quando a lista carrega mas a cena não existe', async () => {
    getRmCenas.mockResolvedValue([{ id: 'outra', titulo: 'Outra' }]);
    renderCenaDetalhes();

    expect(await screen.findByText('Cena não encontrada')).toBeInTheDocument();
    expect(notifyError).not.toHaveBeenCalled();
  });
});
