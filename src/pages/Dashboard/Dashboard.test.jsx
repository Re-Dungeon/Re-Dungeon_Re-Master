import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getRmNotasPorCampanha = vi.fn();
const getRmSessaoLogsPorCampanha = vi.fn();
vi.mock('service/storage', () => ({
  getRmNotasPorCampanha: (...args) => getRmNotasPorCampanha(...args),
  getRmSessaoLogsPorCampanha: (...args) => getRmSessaoLogsPorCampanha(...args),
}));

let campanhaAtiva = null;
let loadingCampanhas = false;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva, loadingCampanhas }),
}));

let grafoState = {};
vi.mock('pages/Campanha/useCampanhaGrafo', () => ({
  default: () => grafoState,
}));

vi.mock('pages/Campanha/CenaFlowCanvas', () => ({
  default: ({ nodes, onNodeClick }) => (
    <div>
      canvas-mini-grafo
      {nodes.map(n => (
        <button key={n.id} type="button" onClick={() => onNodeClick(n.id)}>
          nó-{n.id}
        </button>
      ))}
    </div>
  ),
}));

import Dashboard from './Dashboard';

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  cenaAtualId: null,
};

const CENAS_MOCK = [
  {
    id: 'cena1',
    titulo: 'Chegada na Cidade',
    estado: 'em_andamento',
    objetivo: 'Entrar na cidade',
  },
  { id: 'cena2', titulo: 'Encontro com o Prefeito', estado: 'nao_iniciado' },
];

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campanhaAtiva = CAMPANHA_ATIVA;
    loadingCampanhas = false;
    grafoState = {
      cenas: CENAS_MOCK,
      nodes: CENAS_MOCK.map(c => ({ id: c.id, data: { cena: c } })),
      edges: [],
      loading: false,
    };
    getRmNotasPorCampanha.mockResolvedValue([]);
    getRmSessaoLogsPorCampanha.mockResolvedValue([]);
  });

  it('mostra o estado vazio e navega para Campanha quando não há campanha ativa', async () => {
    campanhaAtiva = null;
    const user = userEvent.setup();
    renderDashboard();

    expect(
      screen.getByText('Nenhuma campanha selecionada'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ir para Campanha' }));
    expect(navigate).toHaveBeenCalledWith('/campanha');
  });

  it('mostra o cabeçalho da dashboard quando há campanha ativa', async () => {
    renderDashboard();

    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
    expect(await screen.findByText('Sentinelas da Coroa')).toBeInTheDocument();
  });

  it('mostra a Cena Atual com estado e permite abrir o fluxograma', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, cenaAtualId: 'cena1' };
    const user = userEvent.setup();
    renderDashboard();

    expect(await screen.findByText('Chegada na Cidade')).toBeInTheDocument();
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Entrar na cidade')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Abrir Fluxograma' }));
    expect(navigate).toHaveBeenCalledWith('/campanha/cenas');
  });

  it('mostra o prompt para marcar uma Cena Atual quando nenhuma está definida', async () => {
    renderDashboard();

    expect(
      await screen.findByText(
        'Ainda não existe uma cena ativa. Selecione uma para iniciar o comando da sua sessão.',
      ),
    ).toBeInTheDocument();
  });

  it('lista as próximas cenas a partir das conexões de saída da Cena Atual', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, cenaAtualId: 'cena1' };
    grafoState = {
      ...grafoState,
      edges: [{ id: 'conexao1', source: 'cena1', target: 'cena2' }],
    };
    const user = userEvent.setup();
    renderDashboard();

    await screen.findByText('Próximas Cenas');
    await screen.findByText('Encontro com o Prefeito');
    const botaoProxima = screen.getByRole('button', { name: 'Ver' });
    await user.click(botaoProxima);

    expect(navigate).toHaveBeenCalledWith('/campanha/cenas', {
      state: { selecionarCenaId: 'cena2' },
    });
  });

  it('mostra as notas mais recentes quando há notas', async () => {
    getRmNotasPorCampanha.mockResolvedValue([
      {
        id: 'nota1',
        campanhaId: 'c1',
        titulo: 'Ideia para a sessão',
        conteudo: 'Texto',
      },
    ]);
    renderDashboard();

    expect(await screen.findByText('Ideia para a sessão')).toBeInTheDocument();
  });

  it('mostra o estado vazio de notas quando não há nenhuma', async () => {
    renderDashboard();

    expect(
      await screen.findByText(/Nenhuma nota registrada ainda\./),
    ).toBeInTheDocument();
  });

  it('renderiza o mini-grafo quando há cenas', async () => {
    renderDashboard();

    expect(await screen.findByText('canvas-mini-grafo')).toBeInTheDocument();
  });

  it('mostra o estado vazio do fluxograma quando não há cenas', async () => {
    grafoState = { ...grafoState, cenas: [], nodes: [] };
    renderDashboard();

    expect(
      await screen.findByText('Nenhuma cena cadastrada ainda'),
    ).toBeInTheDocument();
  });

  it('mostra o Registro da Sessão ordenado do mais recente, com ícone e hora', async () => {
    getRmSessaoLogsPorCampanha.mockResolvedValue([
      {
        id: 'log1',
        tipo: 'cena_atual',
        mensagem: 'Cena atual: "Chegada"',
        createdAt: { toDate: () => new Date(2026, 6, 30, 9, 0) },
      },
      {
        id: 'log2',
        tipo: 'carta_sorteada',
        mensagem: 'Carta sorteada: "Emboscada" (Estrada)',
        createdAt: { toDate: () => new Date(2026, 6, 30, 10, 30) },
      },
    ]);
    renderDashboard();

    await screen.findByText('Registro da Sessão');
    const mensagens = await screen.findAllByText(/Cena atual:|Carta sorteada:/);
    expect(mensagens.map(el => el.textContent)).toEqual([
      'Carta sorteada: "Emboscada" (Estrada)',
      'Cena atual: "Chegada"',
    ]);
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('mostra o estado vazio do Registro da Sessão quando não há eventos', async () => {
    renderDashboard();

    expect(
      await screen.findByText(/Nenhum evento registrado ainda/),
    ).toBeInTheDocument();
  });
});
