import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CenaForm from './CenaForm';
import { CENA_INITIAL_VALUES } from './cenaUtils';

const getRmNpcs = vi.fn();
const getRmCriaturas = vi.fn();
const getRmMissoes = vi.fn();
vi.mock('service/storage', () => ({
  getRmNpcs: (...args) => getRmNpcs(...args),
  getRmCriaturas: (...args) => getRmCriaturas(...args),
  getRmMissoes: (...args) => getRmMissoes(...args),
}));

const NPCS_MOCK = [
  { id: 'npc1', campanhaId: 'c1', nome: 'Grumnak, o Orc' },
  { id: 'npc2', campanhaId: 'outra', nome: 'De outra campanha' },
];
const CRIATURAS_MOCK = [{ id: 'criatura1', campanhaId: 'c1', nome: 'Fera das Sombras' }];
const MISSOES_MOCK = [{ id: 'missao1', campanhaId: 'c1', titulo: 'Resgatar o Prefeito' }];

const renderForm = propsOverride =>
  render(
    <CenaForm
      initialValues={CENA_INITIAL_VALUES}
      onSubmit={vi.fn()}
      onCancelar={vi.fn()}
      labelSalvar="Salvar Cena"
      campanhaId="c1"
      {...propsOverride}
    />,
  );

describe('CenaForm — seletores de NPCs/Criaturas/Missões', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRmNpcs.mockResolvedValue(NPCS_MOCK);
    getRmCriaturas.mockResolvedValue(CRIATURAS_MOCK);
    getRmMissoes.mockResolvedValue(MISSOES_MOCK);
  });

  it('busca apenas NPCs/Criaturas/Missões da campanha informada', async () => {
    renderForm();

    await waitFor(() =>
      expect(screen.getByLabelText('NPCs participantes')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Criaturas envolvidas')).toBeInTheDocument();
    expect(screen.getByLabelText('Missões relacionadas')).toBeInTheDocument();
  });

  it('mostra mensagem de placeholder quando não há NPCs/Criaturas na campanha', async () => {
    getRmNpcs.mockResolvedValue([]);
    getRmCriaturas.mockResolvedValue([]);
    getRmMissoes.mockResolvedValue([]);
    renderForm();

    await waitFor(() =>
      expect(
        screen.getByText(/Nenhum NPC cadastrado nesta campanha/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Nenhuma criatura cadastrada nesta campanha/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma missão cadastrada nesta campanha/),
    ).toBeInTheDocument();
  });

  it('permite selecionar um NPC e envia o id no submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderForm({ onSubmit });

    await waitFor(() => screen.getByLabelText('NPCs participantes'));
    await user.click(screen.getByLabelText('NPCs participantes'));
    await user.click(screen.getByRole('option', { name: 'Grumnak, o Orc' }));
    await user.keyboard('{Escape}');

    await user.type(screen.getByLabelText('Título da Cena'), 'Cena com NPC');
    await user.click(screen.getByRole('button', { name: 'Salvar Cena' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ npcsParticipantes: ['npc1'] }),
        expect.anything(),
      ),
    );
  });

  it('não inclui NPCs de outra campanha nas opções', async () => {
    const user = userEvent.setup();
    renderForm();

    await waitFor(() => screen.getByLabelText('NPCs participantes'));
    await user.click(screen.getByLabelText('NPCs participantes'));

    expect(
      screen.queryByRole('option', { name: 'De outra campanha' }),
    ).not.toBeInTheDocument();
  });
});
