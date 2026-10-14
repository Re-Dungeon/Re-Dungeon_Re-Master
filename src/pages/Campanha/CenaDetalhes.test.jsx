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

vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva: {
      id: 'campanha-1',
      nome: 'Ascensão Carmesim',
      universoId: 'u1',
      mestreId: 'm1',
      cenaAtualId: 'cena2',
    },
    recarregarCampanhas,
  }),
}));

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
});
