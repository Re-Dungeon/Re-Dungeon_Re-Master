import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GRID_CONFIG_PADRAO } from 'common/utils/grid';

const subscribeGridCenaAtiva = vi.fn();
const subscribeGridCenas = vi.fn();
const subscribeGridCena = vi.fn();
const subscribeGridTokens = vi.fn();
const setGridCenaAtiva = vi.fn();
const addGridCena = vi.fn();
const updateGridCena = vi.fn();
const duplicarGridCena = vi.fn();
const removeGridCena = vi.fn();
const addGridTokens = vi.fn();
const updateGridToken = vi.fn();
const removeGridToken = vi.fn();
const moverGridToken = vi.fn();
const getPersonagens = vi.fn();
const getPersonagensJogaveis = vi.fn();
const subscribeAudioMesa = vi.fn((_id, onChange) => {
  onChange(null);
  return vi.fn();
});
const setAudioMesa = vi.fn(() => Promise.resolve());
vi.mock('service/storage', () => ({
  subscribeGridCenaAtiva: (...args) => subscribeGridCenaAtiva(...args),
  subscribeGridCenas: (...args) => subscribeGridCenas(...args),
  subscribeGridCena: (...args) => subscribeGridCena(...args),
  subscribeGridTokens: (...args) => subscribeGridTokens(...args),
  setGridCenaAtiva: (...args) => setGridCenaAtiva(...args),
  addGridCena: (...args) => addGridCena(...args),
  updateGridCena: (...args) => updateGridCena(...args),
  duplicarGridCena: (...args) => duplicarGridCena(...args),
  removeGridCena: (...args) => removeGridCena(...args),
  addGridTokens: (...args) => addGridTokens(...args),
  updateGridToken: (...args) => updateGridToken(...args),
  removeGridToken: (...args) => removeGridToken(...args),
  moverGridToken: (...args) => moverGridToken(...args),
  getRmMapasPorCampanha: vi.fn(() =>
    Promise.resolve([
      {
        id: 'mapa1',
        nome: 'Taverna do Porto',
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
  subscribeAudioMesa: (...args) => subscribeAudioMesa(...args),
  setAudioMesa: (...args) => setAudioMesa(...args),
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

const CENAS = [
  { id: 'cena-1', nome: 'Taverna', ...GRID_CONFIG_PADRAO, createdAt: 1 },
  { id: 'cena-2', nome: 'Masmorra', ...GRID_CONFIG_PADRAO, createdAt: 2 },
];

const TOKENS_POR_CENA = {
  'cena-1': [
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
  ],
  'cena-2': [],
};

const TOKEN_ALDRIC_NOVO = {
  nome: 'Aldric',
  imagemUrl: null,
  tipo: 'jogador',
  refId: 'pj1',
  donos: ['jogador-1'],
  tamanho: 1,
  oculto: false,
  col: 0,
  lin: 0,
};

const renderGrid = () =>
  render(
    <MemoryRouter>
      <Grid />
    </MemoryRouter>,
  );

const abrirMenuDaCena = async (user, nome) => {
  await user.click(
    await screen.findByRole('button', { name: `Opções da cena ${nome}` }),
  );
  return screen.findByRole('menu');
};

describe('Grid (Re:Master)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campanhaAtiva = {
      id: 'c1',
      nome: 'Ascensão Carmesim',
      universoId: 'u1',
      mestreId: 'm1',
    };
    subscribeGridCenaAtiva.mockImplementation((_id, onChange) => {
      onChange('cena-1');
      return vi.fn();
    });
    subscribeGridCenas.mockImplementation((_id, onChange) => {
      onChange(CENAS);
      return vi.fn();
    });
    subscribeGridCena.mockImplementation((_id, cenaId, onChange) => {
      onChange(CENAS.find(cena => cena.id === cenaId) ?? null);
      return vi.fn();
    });
    subscribeGridTokens.mockImplementation((_id, cenaId, _opcoes, onChange) => {
      onChange(TOKENS_POR_CENA[cenaId] ?? []);
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
    setGridCenaAtiva.mockResolvedValue();
    addGridCena.mockResolvedValue('cena-nova');
    updateGridCena.mockResolvedValue();
    duplicarGridCena.mockResolvedValue('cena-copia');
    removeGridCena.mockResolvedValue();
    addGridTokens.mockResolvedValue();
    updateGridToken.mockResolvedValue();
    removeGridToken.mockResolvedValue();
    moverGridToken.mockResolvedValue();
  });

  it('abre a cena ativa, com os tokens ocultos, e move qualquer token', async () => {
    const user = userEvent.setup();
    renderGrid();

    expect(
      await screen.findByRole('button', { name: /Ogro.*oculto/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Taverna (visível aos jogadores)' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('▶ Os jogadores estão vendo esta cena'),
    ).toBeInTheDocument();
    expect(subscribeGridTokens).toHaveBeenCalledWith(
      'c1',
      'cena-1',
      { incluirOcultos: true },
      expect.any(Function),
      expect.any(Function),
    );

    screen.getByRole('button', { name: /Ogro/ }).focus();
    await user.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(moverGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', 3, 1),
    );
  });

  it('abre outra cena em segredo e a mostra aos jogadores', async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(await screen.findByRole('button', { name: 'Masmorra' }));
    await waitFor(() =>
      expect(subscribeGridTokens).toHaveBeenCalledWith(
        'c1',
        'cena-2',
        { incluirOcultos: true },
        expect.any(Function),
        expect.any(Function),
      ),
    );
    expect(setGridCenaAtiva).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: /Ogro/ }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Mostrar aos jogadores' }),
    );
    await waitFor(() =>
      expect(setGridCenaAtiva).toHaveBeenCalledWith('c1', 'cena-2'),
    );
    expect(notifySuccess).toHaveBeenCalledWith(
      'Os jogadores agora veem "Masmorra".',
    );
  });

  it('cria uma cena a partir de um Mapa, já com os jogadores', async () => {
    const user = userEvent.setup();
    renderGrid();

    await user.click(await screen.findByRole('button', { name: 'Nova cena' }));
    const dialogo = await screen.findByRole('dialog');
    await user.click(within(dialogo).getByLabelText(/Mapa da campanha/));
    await user.click(
      await screen.findByRole('option', { name: 'Taverna do Porto' }),
    );
    expect(within(dialogo).getByLabelText('Nome da cena')).toHaveValue(
      'Taverna do Porto',
    );
    await waitFor(() =>
      expect(
        within(dialogo).getByLabelText('Adicionar todos os jogadores'),
      ).toBeChecked(),
    );
    await user.click(
      within(dialogo).getByRole('button', { name: 'Criar cena' }),
    );

    await waitFor(() =>
      expect(addGridCena).toHaveBeenCalledWith(
        'c1',
        {
          ...GRID_CONFIG_PADRAO,
          nome: 'Taverna do Porto',
          imagemUrl: 'https://ex.com/taverna.png',
        },
        [TOKEN_ALDRIC_NOVO],
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('cena sem nome não é criada', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(await screen.findByRole('button', { name: 'Nova cena' }));
    const dialogo = await screen.findByRole('dialog');
    await user.click(
      within(dialogo).getByRole('button', { name: 'Criar cena' }),
    );
    expect(
      await within(dialogo).findByText('Dê um nome à cena.'),
    ).toBeInTheDocument();
    expect(addGridCena).not.toHaveBeenCalled();
  });

  it('renomeia, duplica e apaga pelo menu da cena (a ativa não pode ser apagada)', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderGrid();

    let menu = await abrirMenuDaCena(user, 'Taverna');
    expect(
      within(menu).getByRole('menuitem', { name: /Apagar/ }),
    ).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Escape}');

    menu = await abrirMenuDaCena(user, 'Masmorra');
    await user.click(within(menu).getByRole('menuitem', { name: 'Renomear' }));
    const dialogo = await screen.findByRole('dialog');
    const nome = within(dialogo).getByLabelText('Nome da cena');
    expect(nome).toHaveValue('Masmorra');
    await user.clear(nome);
    await user.type(nome, 'Cripta');
    await user.click(within(dialogo).getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(updateGridCena).toHaveBeenCalledWith('c1', 'cena-2', {
        nome: 'Cripta',
      }),
    );

    menu = await abrirMenuDaCena(user, 'Masmorra');
    await user.click(within(menu).getByRole('menuitem', { name: 'Duplicar' }));
    await waitFor(() =>
      expect(duplicarGridCena).toHaveBeenCalledWith(
        'c1',
        'cena-2',
        'Masmorra (cópia)',
      ),
    );

    menu = await abrirMenuDaCena(user, 'Masmorra');
    await user.click(within(menu).getByRole('menuitem', { name: /Apagar/ }));
    await waitFor(() =>
      expect(removeGridCena).toHaveBeenCalledWith('c1', 'cena-2'),
    );
  });

  it('oculta a cena ativa dos jogadores', async () => {
    const user = userEvent.setup();
    renderGrid();
    const menu = await abrirMenuDaCena(user, 'Taverna');
    await user.click(
      within(menu).getByRole('menuitem', { name: 'Ocultar dos jogadores' }),
    );
    await waitFor(() =>
      expect(setGridCenaAtiva).toHaveBeenCalledWith('c1', null),
    );
  });

  it('adiciona token de NPC e avulso na cena aberta', async () => {
    const user = userEvent.setup();
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });

    await user.click(screen.getByRole('button', { name: 'Adicionar token' }));
    const dialogo = await screen.findByRole('dialog');
    expect(
      await within(dialogo).findByRole('button', {
        name: 'Todos os jogadores já estão na cena',
      }),
    ).toBeDisabled();

    await user.click(within(dialogo).getByRole('tab', { name: 'NPCs' }));
    await user.click(
      await within(dialogo).findByRole('button', {
        name: 'Adicionar Bartolomeu',
      }),
    );
    await waitFor(() =>
      expect(addGridTokens).toHaveBeenCalledWith('c1', 'cena-1', [
        {
          nome: 'Bartolomeu',
          imagemUrl: 'https://ex.com/bart.png',
          tipo: 'npc',
          refId: 'n1',
          donos: [],
          tamanho: 1,
          oculto: false,
          col: 0,
          lin: 0,
        },
      ]),
    );
    expect(notifySuccess).toHaveBeenCalledWith('Bartolomeu entrou na cena.');

    await user.click(within(dialogo).getByRole('tab', { name: 'Avulso' }));
    await user.type(within(dialogo).getByLabelText('Nome do token'), 'Baú');
    await user.click(
      within(dialogo).getByRole('button', { name: 'Adicionar avulso' }),
    );
    await waitFor(() =>
      expect(addGridTokens).toHaveBeenLastCalledWith('c1', 'cena-1', [
        expect.objectContaining({ nome: 'Baú', tipo: 'avulso', donos: [] }),
      ]),
    );
  });

  it('"Adicionar todos os jogadores" traz os que faltam na cena', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(await screen.findByRole('button', { name: 'Masmorra' }));

    await user.click(screen.getByRole('button', { name: 'Adicionar token' }));
    const dialogo = await screen.findByRole('dialog');
    await user.click(
      await within(dialogo).findByRole('button', {
        name: 'Adicionar todos os jogadores (1)',
      }),
    );
    await waitFor(() =>
      expect(addGridTokens).toHaveBeenCalledWith('c1', 'cena-2', [
        TOKEN_ALDRIC_NOVO,
      ]),
    );
  });

  it('seleciona um token, edita e remove', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderGrid();

    (await screen.findByRole('button', { name: /Ogro/ })).focus();
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
      expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
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
      expect(removeGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2'),
    );
  });

  it('configura imagem (pelos Mapas da campanha) e célula da cena aberta', async () => {
    const user = userEvent.setup();
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });

    await user.click(screen.getByRole('button', { name: 'Configurar grid' }));
    const painel = await screen.findByRole('region', {
      name: 'Configurar grid',
    });

    await user.click(within(painel).getByLabelText('Mapa da campanha'));
    await user.click(
      await screen.findByRole('option', { name: 'Taverna do Porto' }),
    );
    const celula = within(painel).getByLabelText(/Tamanho da célula/);
    await user.clear(celula);
    await user.type(celula, '64');
    await user.click(
      within(painel).getByRole('button', { name: 'Salvar grid' }),
    );

    await waitFor(() =>
      expect(updateGridCena).toHaveBeenCalledWith('c1', 'cena-1', {
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
    await screen.findByRole('button', { name: /Aldric, coluna/ });
    await user.click(screen.getByRole('button', { name: 'Configurar grid' }));
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

  it('sem cenas, orienta a criar a primeira', async () => {
    subscribeGridCenas.mockImplementation((_id, onChange) => {
      onChange([]);
      return vi.fn();
    });
    subscribeGridCenaAtiva.mockImplementation((_id, onChange) => {
      onChange(null);
      return vi.fn();
    });
    renderGrid();
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Nenhuma cena ainda',
    );
    expect(
      screen.getByRole('button', { name: 'Adicionar token' }),
    ).toBeDisabled();
    expect(subscribeGridTokens).not.toHaveBeenCalled();
  });

  it('sem campanha ativa, volta para a tela de Campanha', async () => {
    campanhaAtiva = null;
    renderGrid();
    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/campanha'));
    expect(subscribeGridCenas).not.toHaveBeenCalled();
  });
});
