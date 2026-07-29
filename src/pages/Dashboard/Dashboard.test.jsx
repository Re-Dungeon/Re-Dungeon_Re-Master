import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getRmNotas = vi.fn();
vi.mock('service/storage', () => ({
  getRmNotas: (...args) => getRmNotas(...args),
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

const CAMPANHA_ATIVA = { id: 'c1', nome: 'Ascensão Carmesim', universoId: 'u1', cenaAtualId: null };

const CENAS_MOCK = [
  { id: 'cena1', titulo: 'Chegada na Cidade', estado: 'em_andamento', objetivo: 'Entrar na cidade' },
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
    getRmNotas.mockResolvedValue([]);
  });

  it('mostra o estado vazio e navega para Campanha quando não há campanha ativa', async () => {
    campanhaAtiva = null;
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByText('Nenhuma campanha selecionada')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ir para Campanha' }));
    expect(navigate).toHaveBeenCalledWith('/campanha');
  });

  it('mostra o cabeçalho com o nome da campanha ativa', async () => {
    renderDashboard();

    expect(await screen.findByText('Dashboard — Ascensão Carmesim')).toBeInTheDocument();
  });

  it('mostra a Cena Atual com estado e permite abrir no fluxograma', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, cenaAtualId: 'cena1' };
    const user = userEvent.setup();
    renderDashboard();

    expect(await screen.findByText('Chegada na Cidade')).toBeInTheDocument();
    expect(screen.getByText('Em Andamento')).toBeInTheDocument();
    expect(screen.getByText('Entrar na cidade')).toBeInTheDocument();

    await user.click(screen.getByText('Abrir no Fluxograma →'));
    expect(navigate).toHaveBeenCalledWith('/campanha/cenas', {
      state: { selecionarCenaId: 'cena1' },
    });
  });

  it('mostra o prompt para marcar uma Cena Atual quando nenhuma está definida', async () => {
    renderDashboard();

    expect(
      await screen.findByText(/Nenhuma cena marcada como atual ainda/),
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
    const botaoProxima = screen.getByRole('button', { name: 'Encontro com o Prefeito' });
    await user.click(botaoProxima);

    expect(navigate).toHaveBeenCalledWith('/campanha/cenas', {
      state: { selecionarCenaId: 'cena2' },
    });
  });

  it('mostra as notas mais recentes e o link "Ver todas"', async () => {
    getRmNotas.mockResolvedValue([
      { id: 'nota1', campanhaId: 'c1', titulo: 'Ideia para a sessão', conteudo: 'Texto' },
    ]);
    renderDashboard();

    expect(await screen.findByText('Ideia para a sessão')).toBeInTheDocument();
    expect(screen.getByText('Ver todas →')).toBeInTheDocument();
  });

  it('mostra o estado vazio de notas quando não há nenhuma', async () => {
    renderDashboard();

    expect(await screen.findByText('Nenhuma nota registrada ainda.')).toBeInTheDocument();
  });

  it('renderiza o mini-grafo quando há cenas', async () => {
    renderDashboard();

    expect(await screen.findByText('canvas-mini-grafo')).toBeInTheDocument();
  });

  it('mostra o estado vazio do fluxograma quando não há cenas', async () => {
    grafoState = { ...grafoState, cenas: [], nodes: [] };
    renderDashboard();

    expect(await screen.findByText('Nenhuma cena cadastrada ainda')).toBeInTheDocument();
  });
});
