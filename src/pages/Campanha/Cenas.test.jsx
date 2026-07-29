import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ canCreate, canWrite }),
}));

const updateRmCampanha = vi.fn();
vi.mock('service/storage', () => ({
  updateRmCampanha: (...args) => updateRmCampanha(...args),
}));

const CAMPANHA_ATIVA = { id: 'c1', nome: 'Ascensão Carmesim', universoId: 'u1', mestreId: 'm1' };
let campanhaAtiva = CAMPANHA_ATIVA;
let loadingCampanhas = false;
const recarregarCampanhas = vi.fn();
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva, loadingCampanhas, recarregarCampanhas }),
}));

const moveCenaLocal = vi.fn();
const persistirPosicaoCena = vi.fn();
const createConexao = vi.fn();
const updateCena = vi.fn();
const removeCena = vi.fn();
const setSelectedCenaId = vi.fn();
const recarregarGrafo = vi.fn();
let grafoState = {};
vi.mock('./useCampanhaGrafo', () => ({
  default: () => grafoState,
}));

vi.mock('./CenaFlowCanvas', () => ({
  default: ({ nodes, onNodeClick, onNovaCena, podeEscrever }) => (
    <div>
      <button type="button" onClick={onNovaCena}>
        canvas-nova-cena
      </button>
      {podeEscrever && <span>modo-edicao</span>}
      {nodes.map(n => (
        <button key={n.id} type="button" onClick={() => onNodeClick(n.id)}>
          {n.data.cena.titulo}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('./CenaDetailPanel', () => ({
  default: ({ cena, ehCenaAtual, onClose, onSave, onDelete, onMarcarCenaAtual }) =>
    cena ? (
      <div>
        <span>painel-{cena.titulo}</span>
        {ehCenaAtual && <span>e-cena-atual</span>}
        <button type="button" onClick={() => onSave(cena.id, { titulo: 'Editado' })}>
          salvar-painel
        </button>
        <button type="button" onClick={() => onDelete(cena.id)}>
          remover-painel
        </button>
        <button type="button" onClick={onClose}>
          fechar-painel
        </button>
        <button type="button" onClick={() => onMarcarCenaAtual(cena.id)}>
          marcar-atual-painel
        </button>
      </div>
    ) : null,
}));

import Cenas from './Cenas';

const CENAS_MOCK = [
  { id: 'cena1', titulo: 'Chegada na Cidade', campanhaId: 'c1', estado: 'concluido' },
  { id: 'cena2', titulo: 'Encontro com o Prefeito', campanhaId: 'c1', estado: 'em_andamento' },
];

const renderCenas = (state = undefined) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/campanha/cenas', state }]}>
      <Cenas />
    </MemoryRouter>,
  );

describe('Cenas (grafo da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    canCreate.mockReturnValue(true);
    canWrite.mockReturnValue(true);
    campanhaAtiva = CAMPANHA_ATIVA;
    loadingCampanhas = false;
    grafoState = {
      cenas: CENAS_MOCK,
      nodes: CENAS_MOCK.map(c => ({ id: c.id, data: { cena: c } })),
      edges: [],
      loading: false,
      error: null,
      recarregar: recarregarGrafo,
      selectedCenaId: null,
      setSelectedCenaId,
      moveCenaLocal,
      persistirPosicaoCena,
      createConexao,
      updateCena,
      removeCena,
    };
  });

  it('renderiza o canvas com as cenas da campanha ativa', () => {
    renderCenas();

    expect(screen.getByText('Chegada na Cidade')).toBeInTheDocument();
    expect(screen.getByText('Encontro com o Prefeito')).toBeInTheDocument();
    expect(screen.getByText('modo-edicao')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há cenas', () => {
    grafoState = { ...grafoState, cenas: [], nodes: [] };
    renderCenas();

    expect(screen.getByText('Nenhuma cena cadastrada')).toBeInTheDocument();
  });

  it('navega para Nova Cena ao clicar no botão do canvas', async () => {
    const user = userEvent.setup();
    renderCenas();

    await user.click(screen.getByText('canvas-nova-cena'));
    expect(navigate).toHaveBeenCalledWith('/campanha/cenas/nova');
  });

  it('seleciona uma cena ao clicar no nó e abre o painel de detalhes', async () => {
    grafoState = { ...grafoState, selectedCenaId: 'cena1' };
    const user = userEvent.setup();
    renderCenas();

    expect(screen.getByText('painel-Chegada na Cidade')).toBeInTheDocument();

    await user.click(screen.getByText('Encontro com o Prefeito'));
    expect(setSelectedCenaId).toHaveBeenCalledWith('cena2');
  });

  it('salva as alterações do painel via updateCena', async () => {
    grafoState = { ...grafoState, selectedCenaId: 'cena1' };
    updateCena.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCenas();

    await user.click(screen.getByText('salvar-painel'));
    expect(updateCena).toHaveBeenCalledWith('cena1', { titulo: 'Editado' });
  });

  it('remove a cena selecionada via removeCena', async () => {
    grafoState = { ...grafoState, selectedCenaId: 'cena1' };
    removeCena.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCenas();

    await user.click(screen.getByText('remover-painel'));
    expect(removeCena).toHaveBeenCalledWith('cena1');
  });

  it('fecha o painel chamando setSelectedCenaId(null)', async () => {
    grafoState = { ...grafoState, selectedCenaId: 'cena1' };
    const user = userEvent.setup();
    renderCenas();

    await user.click(screen.getByText('fechar-painel'));
    expect(setSelectedCenaId).toHaveBeenCalledWith(null);
  });

  it('não mostra o botão de edição do canvas quando canWrite retorna false', () => {
    canWrite.mockReturnValue(false);
    renderCenas();

    expect(screen.queryByText('modo-edicao')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '+ Nova Cena' }),
    ).not.toBeInTheDocument();
  });

  it('redireciona para /campanha quando não há campanha ativa', () => {
    campanhaAtiva = null;
    renderCenas();

    expect(navigate).toHaveBeenCalledWith('/campanha');
  });

  it('marca a cena selecionada como Cena Atual via updateRmCampanha', async () => {
    grafoState = { ...grafoState, selectedCenaId: 'cena1' };
    updateRmCampanha.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderCenas();

    await user.click(screen.getByText('marcar-atual-painel'));

    expect(updateRmCampanha).toHaveBeenCalledWith('c1', { cenaAtualId: 'cena1' });
    expect(recarregarCampanhas).toHaveBeenCalled();
  });

  it('indica ao painel quando a cena selecionada já é a Cena Atual', () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, cenaAtualId: 'cena1' };
    grafoState = { ...grafoState, selectedCenaId: 'cena1' };
    renderCenas();

    expect(screen.getByText('e-cena-atual')).toBeInTheDocument();
  });

  it('pré-seleciona a cena vinda do state de navegação (ex.: link do Dashboard)', () => {
    renderCenas({ selecionarCenaId: 'cena2' });

    expect(setSelectedCenaId).toHaveBeenCalledWith('cena2');
  });

  it('mostra o erro de carregamento do grafo e permite tentar de novo', async () => {
    grafoState = { ...grafoState, error: new Error('offline') };
    const user = userEvent.setup();
    renderCenas();

    expect(screen.getByText('Erro ao carregar as cenas.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(recarregarGrafo).toHaveBeenCalled();
  });
});
