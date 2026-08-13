import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CenaForm from './CenaForm';
import { CENA_INITIAL_VALUES } from './cenaUtils';

const getRmCampanhaNpcs = vi.fn();
const getRmCampanhaCriaturas = vi.fn();
const getRmMissoesPorCampanha = vi.fn();
vi.mock('service/storage', () => ({
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  getRmCampanhaCriaturas: (...args) => getRmCampanhaCriaturas(...args),
  getRmMissoesPorCampanha: (...args) => getRmMissoesPorCampanha(...args),
}));

const NPCS_MOCK = [{ id: 'npc1', nome: 'Grumnak, o Orc' }];
const CRIATURAS_MOCK = [{ id: 'criatura1', nome: 'Fera das Sombras' }];
const MISSOES_MOCK = [
  {
    id: 'missao1',
    campanhaId: 'c1',
    titulo: 'Resgatar o Prefeito',
    cenasVinculadas: ['cena1'],
  },
  {
    id: 'missao2',
    campanhaId: 'c1',
    titulo: 'Investigar a Praça',
    cenasVinculadas: ['cena-outra'],
  },
];

const renderForm = propsOverride =>
  render(
    <CenaForm
      initialValues={CENA_INITIAL_VALUES}
      onSubmit={vi.fn()}
      onCancelar={vi.fn()}
      labelSalvar="Salvar Cena"
      campanhaId="c1"
      universoId="u1"
      mestreId="m1"
      {...propsOverride}
    />,
  );

describe('CenaForm — seletores de NPCs/Criaturas/Missões', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRmCampanhaNpcs.mockResolvedValue(NPCS_MOCK);
    getRmCampanhaCriaturas.mockResolvedValue(CRIATURAS_MOCK);
    getRmMissoesPorCampanha.mockResolvedValue(MISSOES_MOCK);
  });

  it('busca os NPCs/Criaturas clonados da campanha informada (subcoleção) e as Missões da campanha', async () => {
    renderForm();

    await waitFor(() =>
      expect(screen.getByLabelText('NPCs participantes')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('Criaturas envolvidas')).toBeInTheDocument();
    expect(
      screen.getByText('Missões que avançam nesta cena'),
    ).toBeInTheDocument();
    expect(getRmCampanhaNpcs).toHaveBeenCalledWith('c1', 'u1', 'm1');
    expect(getRmCampanhaCriaturas).toHaveBeenCalledWith('c1', 'u1', 'm1');
  });

  it('mostra mensagem de placeholder quando não há NPCs/Criaturas na campanha', async () => {
    getRmCampanhaNpcs.mockResolvedValue([]);
    getRmCampanhaCriaturas.mockResolvedValue([]);
    getRmMissoesPorCampanha.mockResolvedValue([]);
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
      screen.getByText(/Nenhuma missão vinculada a esta cena ainda/),
    ).toBeInTheDocument();
  });

  it('lista, só leitura, as Missões cujo cenasVinculadas inclui esta Cena — não as de outras Cenas', async () => {
    renderForm({
      initialValues: { ...CENA_INITIAL_VALUES, id: 'cena1' },
    });

    await waitFor(() =>
      expect(screen.getByText('Resgatar o Prefeito')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Investigar a Praça')).not.toBeInTheDocument();
    // Só-leitura: não é um <select> nem tem role de combobox/listbox.
    expect(
      screen.queryByLabelText('Missões relacionadas'),
    ).not.toBeInTheDocument();
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

  it('permite mais de 900 caracteres no resumo do input', async () => {
    renderForm();

    const input = screen.getByLabelText('Resumo');
    const value = 'a'.repeat(1200);
    fireEvent.change(input, { target: { value } });

    expect(input).toHaveValue(value);
  });
});
