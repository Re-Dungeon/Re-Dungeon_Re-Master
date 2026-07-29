import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const getRmMapas = vi.fn();
const removeRmMapa = vi.fn();
vi.mock('service/storage', () => ({
  getRmMapas: (...args) => getRmMapas(...args),
  removeRmMapa: (...args) => removeRmMapa(...args),
}));

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canCreate, canWrite }),
}));

const CAMPANHA_ATIVA = { id: 'c1', nome: 'Ascensão Carmesim', universoId: 'u1', mestreId: 'm1' };
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva: CAMPANHA_ATIVA, loadingCampanhas: false }),
}));

import Mapas from './Mapas';

const MAPAS_MOCK = [
  { id: 'mapa1', campanhaId: 'c1', nome: 'Mapa da Cidade', categoria: 'cidade' },
  { id: 'mapa2', campanhaId: 'c1', nome: 'Masmorra Antiga', categoria: 'masmorra' },
];

const renderMapas = () =>
  render(
    <MemoryRouter>
      <Mapas />
    </MemoryRouter>,
  );

describe('Mapas (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmMapas.mockResolvedValue(MAPAS_MOCK);
  });

  it('lista os mapas da campanha ativa com a categoria', async () => {
    renderMapas();

    await waitFor(() => expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument());
    expect(screen.getByText('Masmorra Antiga')).toBeInTheDocument();
    expect(screen.getByText('Cidade')).toBeInTheDocument();
    expect(screen.getByText('Masmorra')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há mapas', async () => {
    getRmMapas.mockResolvedValue([]);
    renderMapas();

    await waitFor(() => expect(screen.getByText('Nenhum mapa cadastrado')).toBeInTheDocument());
  });

  it('remove um mapa', async () => {
    removeRmMapa.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderMapas();

    await waitFor(() => expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument());
    await user.click(screen.getByLabelText('Remover mapa Mapa da Cidade'));

    await waitFor(() => expect(removeRmMapa).toHaveBeenCalledWith('mapa1'));
  });

  it('não mostra ações de criar/editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderMapas();

    await waitFor(() => expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument());
    expect(screen.queryByLabelText('Editar mapa Mapa da Cidade')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Novo Mapa' })).not.toBeInTheDocument();
  });
});
