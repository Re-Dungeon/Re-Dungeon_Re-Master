import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const getRmNotas = vi.fn();
const removeRmNota = vi.fn();
const getRmCenas = vi.fn();
vi.mock('service/storage', () => ({
  getRmNotas: (...args) => getRmNotas(...args),
  removeRmNota: (...args) => removeRmNota(...args),
  getRmCenas: (...args) => getRmCenas(...args),
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

import Notas from './Notas';

const NOTAS_MOCK = [
  { id: 'nota1', campanhaId: 'c1', titulo: 'Ideia para a próxima sessão', conteudo: 'O vilão pode aparecer.' },
  { id: 'nota2', campanhaId: 'c1', titulo: 'Lembrete', conteudo: 'Não esquecer a recompensa.', cenaId: 'cena1' },
];
const CENAS_MOCK = [{ id: 'cena1', campanhaId: 'c1', titulo: 'Chegada na Cidade' }];

const renderNotas = () =>
  render(
    <MemoryRouter>
      <Notas />
    </MemoryRouter>,
  );

describe('Notas (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getRmNotas.mockResolvedValue(NOTAS_MOCK);
    getRmCenas.mockResolvedValue(CENAS_MOCK);
  });

  it('lista as notas da campanha ativa', async () => {
    renderNotas();

    await waitFor(() =>
      expect(screen.getByText('Ideia para a próxima sessão')).toBeInTheDocument(),
    );
    expect(screen.getByText('Lembrete')).toBeInTheDocument();
  });

  it('mostra a cena vinculada quando a nota tem cenaId', async () => {
    renderNotas();

    await waitFor(() =>
      expect(screen.getByText('Cena: Chegada na Cidade')).toBeInTheDocument(),
    );
  });

  it('mostra o estado vazio quando não há notas', async () => {
    getRmNotas.mockResolvedValue([]);
    renderNotas();

    await waitFor(() => expect(screen.getByText('Nenhuma nota cadastrada')).toBeInTheDocument());
  });

  it('remove uma nota', async () => {
    removeRmNota.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNotas();

    await waitFor(() =>
      expect(screen.getByText('Ideia para a próxima sessão')).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Remover nota Ideia para a próxima sessão'));

    await waitFor(() => expect(removeRmNota).toHaveBeenCalledWith('nota1'));
  });

  it('não mostra ações de criar/editar/remover quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNotas();

    await waitFor(() =>
      expect(screen.getByText('Ideia para a próxima sessão')).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('Editar nota Ideia para a próxima sessão'),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Nova Nota' })).not.toBeInTheDocument();
  });
});
