import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addRmNpc = vi.fn();
const updateRmNpc = vi.fn();
const getPersonagens = vi.fn();
vi.mock('service/storage', () => ({
  addRmNpc: (...args) => addRmNpc(...args),
  updateRmNpc: (...args) => updateRmNpc(...args),
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

import NovoNpc from './NovoNpc';

const PERSONAGENS_MOCK = [
  { id: 'p1', nome: 'Grumnak, o Orc', tipo: 'NPC', universo: 'u1', linkImagem: 'https://x/img.png', descricao: 'Um orc' },
  { id: 'p2', nome: 'Fera das Sombras', tipo: 'Criatura', universo: 'u1' },
  { id: 'p3', nome: 'De outro universo', tipo: 'NPC', universo: 'outro' },
];

const renderNovo = state =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/npcs/novo', state }]}>
      <NovoNpc />
    </MemoryRouter>,
  );

describe('NovoNpc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canWrite.mockReturnValue(true);
    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
  });

  it('mostra "Novo NPC" com o nome da campanha ativa', async () => {
    renderNovo(undefined);

    await waitFor(() => expect(screen.getByText('Novo NPC')).toBeInTheDocument());
    expect(screen.getByText('Novo NPC em Ascensão Carmesim')).toBeInTheDocument();
  });

  it('lista apenas personagens do tipo NPC do Universo da campanha para importar', async () => {
    const user = userEvent.setup();
    renderNovo(undefined);

    await waitFor(() => screen.getByLabelText('Importar de um personagem'));
    await user.click(screen.getByLabelText('Importar de um personagem'));

    expect(screen.getByRole('option', { name: 'Grumnak, o Orc' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Fera das Sombras' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'De outro universo' })).not.toBeInTheDocument();
  });

  it('importar preenche nome/imagem/descrição a partir do personagem', async () => {
    const user = userEvent.setup();
    renderNovo(undefined);

    await waitFor(() => screen.getByLabelText('Importar de um personagem'));
    await user.click(screen.getByLabelText('Importar de um personagem'));
    await user.click(screen.getByRole('option', { name: 'Grumnak, o Orc' }));
    await user.click(screen.getByRole('button', { name: 'Importar' }));

    expect(screen.getByDisplayValue('Grumnak, o Orc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://x/img.png')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Um orc')).toBeInTheDocument();
  });

  it('cria um NPC com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmNpc.mockResolvedValue({ id: 'novo-npc' });
    const user = userEvent.setup();
    renderNovo(undefined);

    await waitFor(() => screen.getByLabelText('Nome'));
    await user.type(screen.getByLabelText('Nome'), 'Novo NPC do Zero');
    await user.click(screen.getByRole('button', { name: 'Salvar NPC' }));

    await waitFor(() =>
      expect(addRmNpc).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Novo NPC do Zero',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('mostra "Editar NPC" preenchido e salva via updateRmNpc', async () => {
    updateRmNpc.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNovo({ npc: { id: 'npc1', nome: 'Grumnak, o Orc' } });

    await waitFor(() => expect(screen.getByText('Editar NPC')).toBeInTheDocument());
    expect(screen.getByDisplayValue('Grumnak, o Orc')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmNpc).toHaveBeenCalledWith(
        'npc1',
        expect.objectContaining({ nome: 'Grumnak, o Orc' }),
      ),
    );
    expect(addRmNpc).not.toHaveBeenCalled();
  });

  it('redireciona para a lista de NPCs quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderNovo(undefined);

    await waitFor(() => expect(screen.queryByText('Novo NPC')).not.toBeInTheDocument());
  });
});
