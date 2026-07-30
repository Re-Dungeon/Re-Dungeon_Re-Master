import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getPersonagens = vi.fn();
const getRmCampanhaLutaParticipantes = vi.fn();
const addRmCampanhaLutaParticipante = vi.fn();
const removeRmCampanhaLutaParticipante = vi.fn();
const updateRmCampanhaLutaParticipante = vi.fn();
vi.mock('service/storage', () => ({
  getPersonagens: (...args) => getPersonagens(...args),
  getRmCampanhaLutaParticipantes: (...args) =>
    getRmCampanhaLutaParticipantes(...args),
  addRmCampanhaLutaParticipante: (...args) =>
    addRmCampanhaLutaParticipante(...args),
  removeRmCampanhaLutaParticipante: (...args) =>
    removeRmCampanhaLutaParticipante(...args),
  updateRmCampanhaLutaParticipante: (...args) =>
    updateRmCampanhaLutaParticipante(...args),
}));

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canCreate, canWrite }),
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: 'm1',
};
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva: CAMPANHA_ATIVA,
    loadingCampanhas: false,
  }),
}));

import Luta from './Luta';

const PERSONAGENS_MOCK = [
  {
    id: 'rato',
    nome: 'Rato Gigante',
    tipo: 'Criatura',
    universo: 'u1',
    campanhas: ['c1'],
    linkImagem: '',
    statusMaximos: { hp: 12, fadiga: 4, energia: 0 },
    status: { hp: { atual: 12 }, fadiga: { atual: 4 }, energia: { atual: 0 } },
  },
  {
    id: 'npc1',
    nome: 'Grumnak, o Orc',
    tipo: 'NPC',
    universo: 'u1',
    campanhas: ['c1'],
  },
];

const PARTICIPANTE_MOCK = {
  id: 'part1',
  origemPersonagemId: 'rato',
  origemTipo: 'Criatura',
  nomeBase: 'Rato Gigante',
  nome: 'Rato Gigante',
  linkImagem: '',
  vidaAtual: 12,
  vidaMaxima: 12,
  fadigaAtual: 4,
  fadigaMaxima: 4,
  manaAtual: 0,
  manaMaxima: 0,
};

const renderLuta = () =>
  render(
    <MemoryRouter>
      <Luta />
    </MemoryRouter>,
  );

describe('Luta (participantes de combate da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
    getRmCampanhaLutaParticipantes.mockResolvedValue([PARTICIPANTE_MOCK]);
  });

  it('lista os participantes já na luta com seus status', async () => {
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    expect(getRmCampanhaLutaParticipantes).toHaveBeenCalledWith('c1');
    expect(screen.getByLabelText('Vida atual de Rato Gigante')).toHaveValue(12);
  });

  it('mostra o estado vazio quando não há participantes', async () => {
    getRmCampanhaLutaParticipantes.mockResolvedValue([]);
    renderLuta();

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum participante na luta'),
      ).toBeInTheDocument(),
    );
  });

  it('abre o dialog e adiciona várias cópias do mesmo personagem com nomes numerados', async () => {
    getRmCampanhaLutaParticipantes.mockResolvedValue([]);
    addRmCampanhaLutaParticipante.mockResolvedValue({ id: 'novo' });
    const user = userEvent.setup();
    renderLuta();

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum participante na luta'),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole('button', { name: '+ Adicionar Participante' }),
    );

    const quantidade = screen.getByLabelText('Quantidade de Rato Gigante');
    await user.clear(quantidade);
    await user.type(quantidade, '3');
    await user.click(screen.getAllByRole('button', { name: 'Adicionar' })[0]);

    await waitFor(() =>
      expect(addRmCampanhaLutaParticipante).toHaveBeenCalledTimes(3),
    );
    expect(addRmCampanhaLutaParticipante).toHaveBeenNthCalledWith(
      1,
      'c1',
      expect.objectContaining({ nome: 'Rato Gigante', vidaMaxima: 12 }),
    );
    expect(addRmCampanhaLutaParticipante).toHaveBeenNthCalledWith(
      2,
      'c1',
      expect.objectContaining({ nome: 'Rato Gigante #2' }),
    );
    expect(addRmCampanhaLutaParticipante).toHaveBeenNthCalledWith(
      3,
      'c1',
      expect.objectContaining({ nome: 'Rato Gigante #3' }),
    );
  });

  it('duplica um participante já na luta com o próximo nome numerado e stats cheios', async () => {
    addRmCampanhaLutaParticipante.mockResolvedValue({ id: 'novo' });
    const user = userEvent.setup();
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    await waitFor(() =>
      expect(addRmCampanhaLutaParticipante).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          nome: 'Rato Gigante #2',
          nomeBase: 'Rato Gigante',
          vidaAtual: 12,
          vidaMaxima: 12,
        }),
      ),
    );
  });

  it('remove um participante', async () => {
    removeRmCampanhaLutaParticipante.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() =>
      expect(removeRmCampanhaLutaParticipante).toHaveBeenCalledWith(
        'c1',
        'part1',
      ),
    );
  });

  it('ajusta a vida atual com o botão de diminuir e grava no Firestore', async () => {
    updateRmCampanhaLutaParticipante.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Diminuir Vida de Rato Gigante'));

    await waitFor(() =>
      expect(updateRmCampanhaLutaParticipante).toHaveBeenCalledWith(
        'c1',
        'part1',
        { vidaAtual: 11 },
      ),
    );
  });

  it('edita a vida atual digitando e grava ao sair do campo', async () => {
    updateRmCampanhaLutaParticipante.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    const campo = screen.getByLabelText('Vida atual de Rato Gigante');
    await user.clear(campo);
    await user.type(campo, '5');
    await user.tab();

    await waitFor(() =>
      expect(updateRmCampanhaLutaParticipante).toHaveBeenCalledWith(
        'c1',
        'part1',
        { vidaAtual: 5 },
      ),
    );
  });

  it('não mostra ações de adicionar/duplicar/remover e desabilita os campos quando canWrite retorna false', async () => {
    canWrite.mockReturnValue(false);
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole('button', { name: '+ Adicionar Participante' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Duplicar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remover' }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText('Vida atual de Rato Gigante')).toBeDisabled();
  });

  it('mostra o erro de carregamento e permite tentar de novo', async () => {
    getPersonagens.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderLuta();

    await waitFor(() =>
      expect(screen.getByText('Erro ao carregar a luta.')).toBeInTheDocument(),
    );

    getPersonagens.mockResolvedValue(PERSONAGENS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
  });
});
