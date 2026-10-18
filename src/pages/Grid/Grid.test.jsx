import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const subscribeGrid = vi.fn();
const subscribeGridTokens = vi.fn();
const addGridToken = vi.fn();
const updateGridToken = vi.fn();
const removeGridToken = vi.fn();
const setGridConfig = vi.fn();
const moverGridToken = vi.fn();
const getPersonagens = vi.fn();
const getPersonagensJogaveis = vi.fn();
vi.mock('service/storage', () => ({
  subscribeGrid: (...args) => subscribeGrid(...args),
  subscribeGridTokens: (...args) => subscribeGridTokens(...args),
  addGridToken: (...args) => addGridToken(...args),
  updateGridToken: (...args) => updateGridToken(...args),
  removeGridToken: (...args) => removeGridToken(...args),
  setGridConfig: (...args) => setGridConfig(...args),
  moverGridToken: (...args) => moverGridToken(...args),
  getRmMapasPorCampanha: vi.fn(() =>
    Promise.resolve([
      {
        id: 'mapa1',
        nome: 'Taverna',
        linkImagem: 'https://ex.com/taverna.png',
      },
    ]),
  ),
  getPersonagens: (...args) => getPersonagens(...args),
  getPersonagensJogaveis: (...args) => getPersonagensJogaveis(...args),
  getRmCampanhaNpcs: vi.fn(() => Promise.resolve([])),
  getRmCampanhaCriaturas: vi.fn(() => Promise.resolve([])),
  getRmCampanhaJogadores: vi.fn(() => Promise.resolve([])),
  // Painel de chat ao lado do grid.
  subscribeChatMensagens: vi.fn((_id, onChange) => {
    onChange([]);
    return vi.fn();
  }),
  subscribeChatSecretasDoMestre: vi.fn(() => vi.fn()),
  subscribeChatSecretasDoUsuario: vi.fn(() => vi.fn()),
  addChatMensagem: vi.fn(),
  removeChatMensagem: vi.fn(),
  addChatRolagemSecreta: vi.fn(),
  removeChatRolagemSecreta: vi.fn(),
  setChatMembro: vi.fn(),
  getChatMacros: vi.fn(() => Promise.resolve([])),
  addChatMacro: vi.fn(),
  updateChatMacro: vi.fn(),
  removeChatMacro: vi.fn(),
}));

vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'm1' } }),
}));

const notifyError = vi.fn();
const notifySuccess = vi.fn();
vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({ notifyError, notifySuccess }),
}));

let campanhaAtiva;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva, loadingCampanhas: false }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

import Grid from './Grid';

const TOKENS = [
  {
    id: 't1',
    nome: 'Aldric',
    tipo: 'jogador',
    refId: 'pj1',
    col: 1,
    lin: 1,
    tamanho: 1,
    donos: ['jogador-1'],
    oculto: false,
  },
  {
    id: 't2',
    nome: 'Ogro',
    tipo: 'criatura',
    refId: 'cr1',
    col: 4,
    lin: 1,
    tamanho: 2,
    donos: [],
    oculto: true,
  },
];

const renderGrid = () =>
  render(
    <MemoryRouter>
      <Grid />
    </MemoryRouter>,
  );

describe('Grid (Re:Master)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campanhaAtiva = {
      id: 'c1',
      nome: 'Ascensão Carmesim',
      universoId: 'u1',
      mestreId: 'm1',
    };
    subscribeGrid.mockImplementation((_id, onChange) => {
      onChange(null);
      return vi.fn();
    });
    subscribeGridTokens.mockImplementation((_id, _opcoes, onChange) => {
      onChange(TOKENS);
      return vi.fn();
    });
    getPersonagens.mockResolvedValue([
      {
        id: 'n1',
        tipo: 'NPC',
        nome: 'Bartolomeu',
        universo: 'u1',
        campanhas: ['c1'],
        linkImagem: 'https://ex.com/bart.png',
      },
    ]);
    getPersonagensJogaveis.mockResolvedValue([
      {
        id: 'pj1',
        uid: 'jogador-1',
        tipo: 'Personagem Jogável',
        nome: 'Aldric',
        universo: 'u1',
        campanhas: ['c1'],
      },
    ]);
    addGridToken.mockResolvedValue('novo');
    updateGridToken.mockResolvedValue();
    removeGridToken.mockResolvedValue();
    setGridConfig.mockResolvedValue();
    moverGridToken.mockResolvedValue();
  });

  it('mestre vê todos os tokens, inclusive os ocultos, e move qualquer um', async () => {
    const user = userEvent.setup();
    renderGrid();

    expect(
      await screen.findByRole('button', { name: /Ogro.*oculto/ }),
    ).toBeInTheDocument();
    expect(subscribeGridTokens).toHaveBeenCalledWith(
      'c1',
      { incluirOcultos: true },
      expect.any(Function),
      expect.any(Function),
    );

    screen.getByRole('button', { name: /Ogro/ }).focus();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(moverGridToken).toHaveBeenCalledWith('c1', 't2', 3, 1),
    );
  });

  it('adiciona token de NPC e de jogador (dono = dono da ficha)', async () => {
    const user = userEvent.setup();
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });

    await user.click(screen.getByRole('button', { name: 'Adicionar token' }));
    const dialogo = await screen.findByRole('dialog');

    await user.click(
      await within(dialogo).findByRole('button', { name: 'Adicionar Aldric' }),
    );
    await waitFor(() =>
      expect(addGridToken).toHaveBeenCalledWith('c1', {
        nome: 'Aldric',
        imagemUrl: null,
        tipo: 'jogador',
        refId: 'pj1',
        donos: ['jogador-1'],
        tamanho: 1,
        oculto: false,
        col: 0,
        lin: 0,
      }),
    );

    await user.click(within(dialogo).getByRole('tab', { name: 'NPCs' }));
    await user.click(
      within(dialogo).getByRole('button', { name: 'Adicionar Bartolomeu' }),
    );
    await waitFor(() =>
      expect(addGridToken).toHaveBeenLastCalledWith(
        'c1',
        expect.objectContaining({
          nome: 'Bartolomeu',
          imagemUrl: 'https://ex.com/bart.png',
          tipo: 'npc',
          refId: 'n1',
          donos: [],
        }),
      ),
    );
    expect(notifySuccess).toHaveBeenCalledWith('Bartolomeu entrou no grid.');
  });

  it('adiciona token avulso', async () => {
    const user = userEvent.setup();
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });

    await user.click(screen.getByRole('button', { name: 'Adicionar token' }));
    const dialogo = await screen.findByRole('dialog');
    await user.click(within(dialogo).getByRole('tab', { name: 'Avulso' }));
    await user.type(within(dialogo).getByLabelText('Nome do token'), 'Baú');
    await user.click(
      within(dialogo).getByRole('button', { name: 'Adicionar avulso' }),
    );

    await waitFor(() =>
      expect(addGridToken).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ nome: 'Baú', tipo: 'avulso', donos: [] }),
      ),
    );
  });

  it('seleciona um token, edita e remove', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderGrid();

    screen.getByRole('button', { name: /Ogro/ }).focus();
    await screen.findByRole('button', { name: /Ogro/ });
    await user.keyboard('{Enter}');

    const painel = await screen.findByRole('region', {
      name: 'Token selecionado',
    });
    const nome = within(painel).getByLabelText('Nome');
    await user.clear(nome);
    await user.type(nome, 'Ogro Chefe');
    await user.click(within(painel).getByRole('switch'));
    await user.click(
      within(painel).getByRole('button', { name: 'Salvar token' }),
    );

    await waitFor(() =>
      expect(updateGridToken).toHaveBeenCalledWith('c1', 't2', {
        nome: 'Ogro Chefe',
        imagemUrl: null,
        tamanho: 2,
        donos: [],
        oculto: false,
        col: 4,
        lin: 1,
      }),
    );

    await user.click(within(painel).getByRole('button', { name: 'Remover' }));
    await waitFor(() =>
      expect(removeGridToken).toHaveBeenCalledWith('c1', 't2'),
    );
  });

  it('configura imagem (pelos Mapas da campanha) e célula do grid', async () => {
    const user = userEvent.setup();
    subscribeGridTokens.mockImplementation((_id, _opcoes, onChange) => {
      onChange([]);
      return vi.fn();
    });
    renderGrid();
    expect(await screen.findByRole('status')).toHaveTextContent('Grid vazio');

    await user.click(screen.getByRole('button', { name: 'Configurar grid' }));
    const painel = await screen.findByRole('region', {
      name: 'Configurar grid',
    });

    await user.click(within(painel).getByLabelText('Mapa da campanha'));
    await user.click(await screen.findByRole('option', { name: 'Taverna' }));
    const celula = within(painel).getByLabelText(/Tamanho da célula/);
    await user.clear(celula);
    await user.type(celula, '64');
    await user.click(
      within(painel).getByRole('button', { name: 'Salvar grid' }),
    );

    await waitFor(() =>
      expect(setGridConfig).toHaveBeenCalledWith('c1', {
        imagemUrl: 'https://ex.com/taverna.png',
        celula: 64,
        deslocamentoX: 0,
        deslocamentoY: 0,
        mostrarGrade: true,
        corGrade: '#ffffff',
        opacidadeGrade: 0.25,
      }),
    );
    expect(
      screen.queryByRole('region', { name: 'Configurar grid' }),
    ).not.toBeInTheDocument();
  });

  it('célula inválida desabilita o salvar', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(
      await screen.findByRole('button', { name: 'Configurar grid' }),
    );
    const painel = await screen.findByRole('region', {
      name: 'Configurar grid',
    });
    const celula = within(painel).getByLabelText(/Tamanho da célula/);
    await user.clear(celula);
    await user.type(celula, '5');
    expect(
      within(painel).getByText(/célula deve ser entre/),
    ).toBeInTheDocument();
    expect(
      within(painel).getByRole('button', { name: 'Salvar grid' }),
    ).toBeDisabled();
  });

  it('sem campanha ativa, volta para a tela de Campanha', async () => {
    campanhaAtiva = null;
    renderGrid();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/campanha'));
    expect(subscribeGrid).not.toHaveBeenCalled();
  });
});
