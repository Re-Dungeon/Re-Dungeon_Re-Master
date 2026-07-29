import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmCriatura = vi.fn();
const updateRmCriatura = vi.fn();
const getPersonagens = vi.fn();
vi.mock('service/storage', () => ({
  addRmCriatura: (...args) => addRmCriatura(...args),
  updateRmCriatura: (...args) => updateRmCriatura(...args),
  getPersonagens: (...args) => getPersonagens(...args),
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
  useCampanha: () => ({ campanhaAtiva: CAMPANHA_ATIVA, loadingCampanhas: false }),
}));

import NovaCriatura from './NovaCriatura';

const PERSONAGENS_MOCK = [
  { id: 'p1', nome: 'Fera das Sombras', tipo: 'Criatura', universo: 'u1', linkImagem: 'https://x/img.png', descricao: 'Assombra a floresta' },
  { id: 'p2', nome: 'Grumnak, o Orc', tipo: 'NPC', universo: 'u1' },
];

const renderNova = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/criaturas/nova', state }]}>
      <NovaCriatura />
    </MemoryRouter>,
  );

describe('NovaCriatura', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
  });

  it('mostra "Nova Criatura" com o nome da campanha ativa', async () => {
    renderNova(undefined);

    await waitFor(() => expect(screen.getByText('Nova Criatura')).toBeInTheDocument());
    expect(screen.getByText('Nova criatura em Ascensão Carmesim')).toBeInTheDocument();
  });

  it('lista apenas personagens do tipo Criatura para importar', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Importar de um personagem'));
    await user.click(screen.getByLabelText('Importar de um personagem'));

    expect(screen.getByRole('option', { name: 'Fera das Sombras' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Grumnak, o Orc' })).not.toBeInTheDocument();
  });

  it('cria uma criatura com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmCriatura.mockResolvedValue({ id: 'nova-criatura' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Criatura do Zero');
    await user.click(screen.getByRole('button', { name: 'Salvar Criatura' }));

    await waitFor(() =>
      expect(addRmCriatura).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Criatura do Zero',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('adiciona e remove uma entrada do histórico de encontros', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Nome'));
    await user.click(screen.getByRole('button', { name: '+ Adicionar encontro' }));
    expect(screen.getByLabelText('Remover entrada do histórico')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remover entrada do histórico'));
    expect(screen.queryByLabelText('Remover entrada do histórico')).not.toBeInTheDocument();
  });

  it('mostra "Editar Criatura" preenchida e salva via updateRmCriatura', async () => {
    updateRmCriatura.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({ criatura: { id: 'criatura1', nome: 'Fera das Sombras' } });

    await waitFor(() => expect(screen.getByText('Editar Criatura')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Fera das Sombras')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmCriatura).toHaveBeenCalledWith(
        'criatura1',
        expect.objectContaining({ nome: 'Fera das Sombras' }),
      ),
    );
    expect(addRmCriatura).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de criaturas quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNova(undefined);

    await waitFor(() => expect(screen.queryByText('Nova Criatura')).not.toBeInTheDocument());
  });
});
