import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { GRID_CONFIG_PADRAO } from 'common/utils/grid';

const subscribeGridCenaAtiva = vi.fn();
const subscribeGridCenas = vi.fn();
const subscribeGridCena = vi.fn();
const subscribeGridTokens = vi.fn();
const setGridCenaAtiva = vi.fn();
const subscribeGridAvisarAcoesChat = vi.fn();
const setGridAvisarAcoesChat = vi.fn();
const addGridCena = vi.fn();
const updateGridCena = vi.fn();
const duplicarGridCena = vi.fn();
const removeGridCena = vi.fn();
const addGridTokens = vi.fn();
const updateGridToken = vi.fn();
const removeGridToken = vi.fn();
const updateGridTokensEmLote = vi.fn();
const removeGridTokensEmLote = vi.fn();
const moverGridToken = vi.fn();
const getPersonagens = vi.fn();
const getPersonagensJogaveis = vi.fn();
const getCondicoes = vi.fn();
const subscribeGridPings = vi.fn(() => () => {});
const setGridPing = vi.fn(() => Promise.resolve());
const subscribePersonagem = vi.fn(() => () => {});
const subscribeGridCombate = vi.fn();
const alterarGridCombate = vi.fn();
const iniciarGridCombate = vi.fn();
const encerrarGridCombate = vi.fn();
const subscribeGridCamadas = vi.fn(() => () => {});
const setGridCamada = vi.fn(() => Promise.resolve());
const subscribeGridMarcadores = vi.fn(() => () => {});
const addGridMarcador = vi.fn(() => Promise.resolve('mk1'));
const updateGridMarcador = vi.fn(() => Promise.resolve());
const removeGridMarcador = vi.fn(() => Promise.resolve());
const subscribeGridDesenhos = vi.fn(() => () => {});
const addGridDesenho = vi.fn(() => Promise.resolve('d1'));
const removeGridDesenhos = vi.fn(() => Promise.resolve());
const subscribeAudioMesa = vi.fn((_id, onChange) => {
  onChange(null);
  return vi.fn();
});
const setAudioMesa = vi.fn(() => Promise.resolve());
const subscribeGridAreas = vi.fn(() => () => {});
const addGridArea = vi.fn(() => Promise.resolve('a1'));
const updateGridArea = vi.fn(() => Promise.resolve());
const removeGridArea = vi.fn(() => Promise.resolve());
const removeGridAreas = vi.fn(() => Promise.resolve());
const addChatMensagem = vi.fn(() => Promise.resolve());
vi.mock('service/storage', () => ({
  subscribeGridCenaAtiva: (...args) => subscribeGridCenaAtiva(...args),
  subscribeGridCenas: (...args) => subscribeGridCenas(...args),
  subscribeGridCena: (...args) => subscribeGridCena(...args),
  subscribeGridTokens: (...args) => subscribeGridTokens(...args),
  setGridCenaAtiva: (...args) => setGridCenaAtiva(...args),
  subscribeGridAvisarAcoesChat: (...args) =>
    subscribeGridAvisarAcoesChat(...args),
  setGridAvisarAcoesChat: (...args) => setGridAvisarAcoesChat(...args),
  addGridCena: (...args) => addGridCena(...args),
  updateGridCena: (...args) => updateGridCena(...args),
  duplicarGridCena: (...args) => duplicarGridCena(...args),
  removeGridCena: (...args) => removeGridCena(...args),
  addGridTokens: (...args) => addGridTokens(...args),
  updateGridToken: (...args) => updateGridToken(...args),
  removeGridToken: (...args) => removeGridToken(...args),
  updateGridTokensEmLote: (...args) => updateGridTokensEmLote(...args),
  removeGridTokensEmLote: (...args) => removeGridTokensEmLote(...args),
  moverGridToken: (...args) => moverGridToken(...args),
  subscribeGridPings: (...args) => subscribeGridPings(...args),
  setGridPing: (...args) => setGridPing(...args),
  subscribePersonagem: (...args) => subscribePersonagem(...args),
  subscribeGridCombate: (...args) => subscribeGridCombate(...args),
  alterarGridCombate: (...args) => alterarGridCombate(...args),
  iniciarGridCombate: (...args) => iniciarGridCombate(...args),
  encerrarGridCombate: (...args) => encerrarGridCombate(...args),
  subscribeGridCamadas: (...args) => subscribeGridCamadas(...args),
  setGridCamada: (...args) => setGridCamada(...args),
  subscribeGridMarcadores: (...args) => subscribeGridMarcadores(...args),
  addGridMarcador: (...args) => addGridMarcador(...args),
  updateGridMarcador: (...args) => updateGridMarcador(...args),
  removeGridMarcador: (...args) => removeGridMarcador(...args),
  subscribeGridDesenhos: (...args) => subscribeGridDesenhos(...args),
  addGridDesenho: (...args) => addGridDesenho(...args),
  removeGridDesenhos: (...args) => removeGridDesenhos(...args),
  subscribeGridAreas: (...args) => subscribeGridAreas(...args),
  addGridArea: (...args) => addGridArea(...args),
  updateGridArea: (...args) => updateGridArea(...args),
  removeGridArea: (...args) => removeGridArea(...args),
  removeGridAreas: (...args) => removeGridAreas(...args),
  getCondicoes: (...args) => getCondicoes(...args),
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
  addChatMensagem: (...args) => addChatMensagem(...args),
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

// Guarda as props que a página passa ao mapa, para os testes dispararem os
// callbacks de ferramenta (o clique no canvas em si é testado no GridMapa).
let propsDoMapa;
vi.mock('components/Grid/GridMapa', async importOriginal => {
  const real = await importOriginal();
  const Mapa = props => {
    propsDoMapa = props;
    return <real.default {...props} />;
  };
  return { default: Mapa };
});

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
    subscribeGridAvisarAcoesChat.mockImplementation((_id, onChange) => {
      onChange(false);
      return vi.fn();
    });
    setGridAvisarAcoesChat.mockResolvedValue();
    addGridCena.mockResolvedValue('cena-nova');
    updateGridCena.mockResolvedValue();
    duplicarGridCena.mockResolvedValue('cena-copia');
    removeGridCena.mockResolvedValue();
    addGridTokens.mockResolvedValue();
    updateGridToken.mockResolvedValue();
    removeGridToken.mockResolvedValue();
    moverGridToken.mockResolvedValue();
    subscribePersonagem.mockImplementation(() => () => {});
    subscribeGridCamadas.mockImplementation((_id, _cenaId, onChange) => {
      onChange({ paredes: null, nevoa: null });
      return vi.fn();
    });
    subscribeGridMarcadores.mockImplementation(
      (_id, _cenaId, _opcoes, onChange) => {
        onChange([]);
        return vi.fn();
      },
    );
    subscribeGridDesenhos.mockImplementation((_id, _cenaId, onChange) => {
      onChange([]);
      return vi.fn();
    });
    // Sem combate por padrão; os testes de combate emitem o estado.
    subscribeGridCombate.mockImplementation((_id, _cenaId, onChange) => {
      onChange(null);
      return vi.fn();
    });
    subscribeGridAreas.mockImplementation(() => () => {});
    addChatMensagem.mockResolvedValue();
    alterarGridCombate.mockResolvedValue(true);
    iniciarGridCombate.mockResolvedValue();
    encerrarGridCombate.mockResolvedValue();
    getCondicoes.mockResolvedValue([
      { id: 'cond1', nome: 'Envenenado' },
      { id: 'cond2', nome: 'Atordoado' },
    ]);
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

  it('mover um token visível grava o rastro do movimento', async () => {
    const user = userEvent.setup();
    renderGrid();

    (await screen.findByRole('button', { name: /Aldric, coluna/ })).focus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(moverGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't1', 2, 1, [
        { col: 1, lin: 1 },
        { col: 2, lin: 1 },
      ]),
    );
    expect(screen.getByText('1 q · 1,5 m')).toBeInTheDocument();
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

  it('liga e desliga o aviso no chat das ações dos jogadores', async () => {
    const user = userEvent.setup();
    let emitir;
    subscribeGridAvisarAcoesChat.mockImplementation((_id, onChange) => {
      emitir = onChange;
      onChange(false);
      return vi.fn();
    });
    renderGrid();

    const botao = await screen.findByRole('button', {
      name: 'Ações no chat: desligado',
    });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    await user.click(botao);
    expect(setGridAvisarAcoesChat).toHaveBeenCalledWith('c1', true);

    act(() => emitir(true));
    const ligado = screen.getByRole('button', {
      name: 'Ações no chat: ligado',
    });
    expect(ligado).toHaveAttribute('aria-pressed', 'true');
    await user.click(ligado);
    expect(setGridAvisarAcoesChat).toHaveBeenLastCalledWith('c1', false);
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
        metrosPorQuadrado: 1.5,
        multiplicadorCorrida: 2,
      }),
    );
    expect(
      screen.queryByRole('region', { name: 'Configurar grid' }),
    ).not.toBeInTheDocument();
  });

  it('configura os metros por quadrado da cena aberta', async () => {
    const user = userEvent.setup();
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });
    await user.click(screen.getByRole('button', { name: 'Configurar grid' }));
    const painel = await screen.findByRole('region', {
      name: 'Configurar grid',
    });

    const metros = within(painel).getByLabelText('Metros por quadrado');
    expect(metros).toHaveValue(1.5);
    await user.clear(metros);
    await user.type(metros, '2');
    await user.click(
      within(painel).getByRole('button', { name: 'Salvar grid' }),
    );

    await waitFor(() =>
      expect(updateGridCena).toHaveBeenCalledWith(
        'c1',
        'cena-1',
        expect.objectContaining({ metrosPorQuadrado: 2 }),
      ),
    );
  });

  it('metros por quadrado inválido desabilita o salvar', async () => {
    const user = userEvent.setup();
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });
    await user.click(screen.getByRole('button', { name: 'Configurar grid' }));
    const painel = await screen.findByRole('region', {
      name: 'Configurar grid',
    });

    const metros = within(painel).getByLabelText('Metros por quadrado');
    await user.clear(metros);
    await user.type(metros, '0');
    expect(
      within(painel).getByText(/Metros por quadrado: entre/),
    ).toBeInTheDocument();
    expect(
      within(painel).getByRole('button', { name: 'Salvar grid' }),
    ).toBeDisabled();
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

  describe('combate do token (grava na hora)', () => {
    const OGRO_COM_PV = {
      ...TOKENS_POR_CENA['cena-1'][1],
      pv: { atual: 10, max: 20 },
      energia: { atual: 0, max: 5 },
    };

    const abrirOgro = async user => {
      subscribeGridTokens.mockImplementation(
        (_id, cenaId, _opcoes, onChange) => {
          onChange(
            cenaId === 'cena-1'
              ? [TOKENS_POR_CENA['cena-1'][0], OGRO_COM_PV]
              : [],
          );
          return vi.fn();
        },
      );
      renderGrid();
      (await screen.findByRole('button', { name: /Ogro/ })).focus();
      await user.keyboard('{Enter}');
      return screen.findByRole('region', { name: 'Token selecionado' });
    };

    it('−/+ e o campo de PV gravam o recurso limitado a 0..máx', async () => {
      const user = userEvent.setup();
      const painel = await abrirOgro(user);

      await user.click(
        within(painel).getByRole('button', { name: 'Aumentar PV' }),
      );
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          pv: { atual: 11, max: 20 },
        }),
      );
      // Energia já em 0: não desce mais.
      expect(
        within(painel).getByRole('button', { name: 'Diminuir Energia' }),
      ).toBeDisabled();

      const atual = within(painel).getByLabelText('PV atual');
      await user.clear(atual);
      await user.type(atual, '35{Enter}');
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenLastCalledWith('c1', 'cena-1', 't2', {
          pv: { atual: 20, max: 20 },
        }),
      );
      expect(
        within(painel).getByRole('button', { name: 'Definir Fadiga' }),
      ).toBeInTheDocument();
      expect(notifySuccess).not.toHaveBeenCalled();
    });

    it('condições, visibilidade dos recursos e aura', async () => {
      const user = userEvent.setup();
      const painel = await abrirOgro(user);

      await user.type(
        within(painel).getByRole('combobox', { name: 'Condições' }),
        'Enven',
      );
      await user.click(
        await screen.findByRole('option', { name: 'Envenenado' }),
      );
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          condicoes: ['cond1'],
        }),
      );

      await user.click(
        within(painel).getByLabelText('Jogadores veem os recursos'),
      );
      await user.click(
        await screen.findByRole('option', { name: 'Barras e números' }),
      );
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          mostrarRecursos: 'numeros',
        }),
      );

      await user.click(within(painel).getByLabelText('Aura'));
      await user.click(await screen.findByRole('option', { name: 'Vermelho' }));
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          aura: { raio: 1, cor: '#e05555' },
        }),
      );
    });

    it('token de jogador mostra o resumo da ficha (só leitura)', async () => {
      const user = userEvent.setup();
      subscribePersonagem.mockImplementation((_id, onChange) => {
        onChange({
          id: 'pj1',
          status: { hp: { atual: 7 } },
          statusMaximos: { hp: 12 },
        });
        return () => {};
      });
      renderGrid();
      (await screen.findByRole('button', { name: /Aldric, coluna/ })).focus();
      await user.keyboard('{Enter}');
      const painel = await screen.findByRole('region', {
        name: 'Token selecionado',
      });

      expect(within(painel).getByText('Da ficha do jogador')).toBeVisible();
      expect(within(painel).getByText('PV 7/12')).toBeInTheDocument();
      expect(
        within(painel).queryByRole('button', { name: 'Aumentar PV' }),
      ).not.toBeInTheDocument();
      expect(subscribePersonagem).toHaveBeenCalledWith(
        'pj1',
        expect.any(Function),
        expect.any(Function),
      );
    });
  });

  it('NPC com status na ficha entra com PV/Energia/Fadiga cheios', async () => {
    const user = userEvent.setup();
    getPersonagens.mockResolvedValue([
      {
        id: 'n1',
        tipo: 'NPC',
        nome: 'Bartolomeu',
        universo: 'u1',
        campanhas: ['c1'],
        statusMaximos: { hp: 30, energia: 10, fadiga: { maximo: 4 } },
      },
    ]);
    renderGrid();
    await screen.findByRole('button', { name: /Aldric, coluna/ });

    await user.click(screen.getByRole('button', { name: 'Adicionar token' }));
    const dialogo = await screen.findByRole('dialog');
    await user.click(within(dialogo).getByRole('tab', { name: 'NPCs' }));
    await user.click(
      await within(dialogo).findByRole('button', {
        name: 'Adicionar Bartolomeu',
      }),
    );
    await waitFor(() =>
      expect(addGridTokens).toHaveBeenCalledWith('c1', 'cena-1', [
        expect.objectContaining({
          nome: 'Bartolomeu',
          tipo: 'npc',
          pv: { atual: 30, max: 30 },
          energia: { atual: 10, max: 10 },
          fadiga: { atual: 4, max: 4 },
        }),
      ]),
    );
  });

  it('o mestre tem o botão "Puxar vista" e escuta os sinais da cena', async () => {
    renderGrid();
    expect(
      await screen.findByRole('button', { name: 'Puxar vista' }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(subscribeGridPings).toHaveBeenCalledWith(
        'c1',
        'cena-1',
        expect.any(Function),
        expect.any(Function),
      ),
    );
    expect(getCondicoes).toHaveBeenCalledWith('u1');
  });

  describe('rolar do token (Fase 3C)', () => {
    it('só tokens que não são de jogador têm "Rolar…"', async () => {
      renderGrid();
      await screen.findByRole('button', { name: /Ogro.*oculto/ });
      const [aldric, ogro] = TOKENS_POR_CENA['cena-1'];
      expect(propsDoMapa.podeRolarToken(aldric)).toBe(false);
      expect(propsDoMapa.podeRolarToken(ogro)).toBe(true);
      expect(propsDoMapa.podeEditarArea({ uid: 'qualquer' })).toBe(true);
      expect(propsDoMapa.corAreaPadrao).toMatch(/^#/);
    });

    it('o painel do token (NPC/criatura) tem "Rolar pelo token" e abre o diálogo; o de jogador não', async () => {
      const user = userEvent.setup();
      renderGrid();

      (await screen.findByRole('button', { name: /Ogro/ })).focus();
      await user.keyboard('{Enter}');
      const painel = await screen.findByRole('region', {
        name: 'Token selecionado',
      });
      await user.click(
        within(painel).getByRole('button', { name: 'Rolar pelo token' }),
      );
      const dialogo = await screen.findByRole('dialog');
      expect(within(dialogo).getByLabelText('Expressão')).toBeInTheDocument();
    });

    it('rolar pelo NPC/criatura posta no chat com o nome do token, a persona e o rótulo', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Ogro.*oculto/ });

      act(() => propsDoMapa.onRolarToken(TOKENS_POR_CENA['cena-1'][1]));
      const dialogo = await screen.findByRole('dialog');
      await user.type(within(dialogo).getByLabelText('Expressão'), '1d20+2');
      await user.type(
        within(dialogo).getByLabelText('Rótulo (opcional)'),
        'Ataque: Pancada',
      );
      await user.click(within(dialogo).getByRole('button', { name: 'Rolar' }));

      await waitFor(() =>
        expect(addChatMensagem).toHaveBeenCalledWith(
          'c1',
          expect.objectContaining({
            tipo: 'rolagem',
            autorNome: 'Ogro',
            persona: 'criatura',
            isMestre: true,
            uid: 'm1',
            rotulo: 'Ataque: Pancada',
          }),
        ),
      );
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    });

    it('expressão inválida mostra o erro no diálogo e não posta', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Ogro.*oculto/ });

      act(() => propsDoMapa.onRolarToken(TOKENS_POR_CENA['cena-1'][1]));
      const dialogo = await screen.findByRole('dialog');
      await user.type(within(dialogo).getByLabelText('Expressão'), 'banana');
      await user.click(within(dialogo).getByRole('button', { name: 'Rolar' }));

      await waitFor(() =>
        expect(within(dialogo).getByLabelText('Expressão')).toHaveAttribute(
          'aria-invalid',
          'true',
        ),
      );
      expect(addChatMensagem).not.toHaveBeenCalled();
    });
  });

  describe('combate da cena (Fase 3A)', () => {
    const ORDEM = [
      { tokenId: 't1', iniciativa: 12, d20: 6, reacao: 6 },
      { tokenId: 't2', iniciativa: 9, d20: 9, reacao: 0 },
    ];
    const COMBATE = {
      ordem: ORDEM,
      indice: 0,
      rodada: 1,
      inicioTurno: { col: 1, lin: 1 },
      turnoEm: { seconds: 10, nanoseconds: 0 },
    };

    const emitirCombate = doc => {
      subscribeGridCombate.mockImplementation((_id, _cenaId, onChange) => {
        onChange(doc);
        return vi.fn();
      });
    };

    it('"Iniciar combate" rola 1d20 + Reação, grava o estado e anuncia no chat', async () => {
      const user = userEvent.setup();
      // [d20, sorteio] por participante: Aldric 5 + Reação 6 = 11; Ogro 10 + 0.
      const sequencia = [4, 0, 9, 0];
      const sorteio = vi
        .spyOn(globalThis.crypto, 'getRandomValues')
        .mockImplementation(buffer => {
          buffer[0] = sequencia.shift() ?? 0;
          return buffer;
        });
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });

      await user.click(screen.getByRole('button', { name: 'Iniciar combate' }));
      const dialogo = await screen.findByRole('dialog');
      // Aldric: Reação vem da ficha; Ogro (oculto) sem ficha: o mestre informa.
      expect(
        await within(dialogo).findByText('Reação 6 (da ficha)'),
      ).toBeInTheDocument();
      expect(
        within(dialogo).getByRole('checkbox', { name: /Ogro/ }),
      ).toBeChecked();
      expect(within(dialogo).getByLabelText('Reação de Ogro')).toHaveValue('0');
      await user.click(
        within(dialogo).getByRole('button', {
          name: 'Rolar iniciativa e iniciar',
        }),
      );

      await waitFor(() =>
        expect(iniciarGridCombate).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          {
            ordem: [
              { tokenId: 't1', iniciativa: 11, d20: 5, reacao: 6 },
              { tokenId: 't2', iniciativa: 10, d20: 10, reacao: 0 },
            ],
            indice: 0,
            rodada: 1,
            inicioTurno: { col: 1, lin: 1 },
          },
          expect.objectContaining({
            tipo: 'combate',
            isMestre: true,
            autorNome: 'Mestre',
            combate: {
              evento: 'inicio',
              cenaId: 'cena-1',
              rodada: 1,
              nome: 'Aldric',
              oculto: false,
              // O Ogro (oculto) fica fora da lista pública.
              iniciativa: [{ nome: 'Aldric', total: 11, d20: 5, reacao: 6 }],
            },
          }),
        ),
      );
      sorteio.mockRestore();
    });

    it('mostra a faixa, passa o turno (Próximo/Anterior) e encerra', async () => {
      const user = userEvent.setup();
      emitirCombate(COMBATE);
      renderGrid();

      expect(await screen.findByText('Rodada 1')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Centralizar em Aldric' }),
      ).toHaveAttribute('aria-current', 'true');
      expect(
        screen.queryByRole('button', { name: 'Iniciar combate' }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Próximo turno' }));
      await waitFor(() =>
        expect(alterarGridCombate).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          expect.any(Function),
        ),
      );
      // O calcular devolve o patch e a mensagem do mestre.
      const calcular = alterarGridCombate.mock.calls[0][2];
      expect(calcular(COMBATE)).toEqual({
        patch: { indice: 1, rodada: 1, inicioTurno: { col: 4, lin: 1 } },
        mudouTurno: true,
        mensagem: expect.objectContaining({
          tipo: 'combate',
          isMestre: true,
          combate: expect.objectContaining({
            evento: 'turno',
            cenaId: 'cena-1',
            // O Ogro está oculto: o chat não revela o nome.
            nome: null,
            oculto: true,
          }),
        }),
      });

      await user.click(screen.getByRole('button', { name: 'Anterior' }));
      await waitFor(() => expect(alterarGridCombate).toHaveBeenCalledTimes(2));

      vi.spyOn(window, 'confirm').mockReturnValue(true);
      await user.click(
        screen.getByRole('button', { name: 'Encerrar combate' }),
      );
      await waitFor(() =>
        expect(encerrarGridCombate).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          expect.objectContaining({
            tipo: 'combate',
            combate: { evento: 'fim', cenaId: 'cena-1' },
          }),
        ),
      );
    });

    it('"Participantes" sobe, desce, tira e acrescenta sem mensagem no chat', async () => {
      const user = userEvent.setup();
      const ogro = TOKENS_POR_CENA['cena-1'][1];
      const goblin = {
        id: 't3',
        nome: 'Goblin',
        tipo: 'npc',
        refId: null,
        col: 6,
        lin: 3,
        tamanho: 1,
        donos: [],
        oculto: false,
      };
      subscribeGridTokens.mockImplementation(
        (_id, cenaId, _opcoes, onChange) => {
          onChange(
            cenaId === 'cena-1'
              ? [TOKENS_POR_CENA['cena-1'][0], ogro, goblin]
              : [],
          );
          return vi.fn();
        },
      );
      emitirCombate(COMBATE);
      renderGrid();

      await user.click(
        await screen.findByRole('button', { name: 'Participantes' }),
      );
      const dialogo = await screen.findByRole('dialog');
      expect(
        within(dialogo).getByRole('button', { name: 'Subir Aldric' }),
      ).toBeDisabled();

      await user.click(
        within(dialogo).getByRole('button', { name: 'Descer Aldric' }),
      );
      await user.click(
        within(dialogo).getByRole('button', { name: 'Tirar Ogro do combate' }),
      );
      await waitFor(() => expect(alterarGridCombate).toHaveBeenCalledTimes(2));
      const [descer, tirar] = alterarGridCombate.mock.calls.map(c => c[2]);
      expect(descer(COMBATE)).toEqual({
        patch: { ordem: [ORDEM[1], ORDEM[0]], indice: 1 },
        mudouTurno: false,
      });
      expect(tirar(COMBATE).mensagem).toBeUndefined();

      // Quem estava fora entra com a iniciativa rolada na hora (Reação 3).
      const reacao = within(dialogo).getByLabelText('Reação de Goblin');
      await user.clear(reacao);
      await user.type(reacao, '3');
      await user.click(
        within(dialogo).getByRole('button', { name: 'Adicionar Goblin' }),
      );
      await waitFor(() => expect(alterarGridCombate).toHaveBeenCalledTimes(3));
      const adicionar = alterarGridCombate.mock.calls[2][2](COMBATE);
      expect(adicionar.mensagem).toBeUndefined();
      expect(adicionar.patch.ordem.map(e => e.tokenId)).toContain('t3');
      await waitFor(() =>
        expect(notifySuccess).toHaveBeenCalledWith(
          expect.stringContaining('Goblin entrou no combate'),
        ),
      );
    });

    it('remover o token da cena também o tira do combate', async () => {
      const user = userEvent.setup();
      emitirCombate(COMBATE);
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderGrid();

      (await screen.findByRole('button', { name: /Ogro, coluna/ })).focus();
      await user.keyboard('{Enter}');
      const painel = await screen.findByRole('region', {
        name: 'Token selecionado',
      });
      await user.click(within(painel).getByRole('button', { name: 'Remover' }));
      await waitFor(() =>
        expect(removeGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2'),
      );
      expect(alterarGridCombate).toHaveBeenCalledTimes(1);
      const resultado = alterarGridCombate.mock.calls[0][2](COMBATE);
      expect(resultado.patch.ordem).toEqual([ORDEM[0]]);
    });

    it('o seletor "Movimento" grava o travamento da cena', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });

      await user.click(screen.getByLabelText('Movimento'));
      await user.click(
        await screen.findByRole('option', { name: 'Só na sua vez' }),
      );
      await waitFor(() =>
        expect(updateGridCena).toHaveBeenCalledWith('c1', 'cena-1', {
          travamento: 'turno',
        }),
      );
    });

    it('o painel do grid escolhe quanto "Correr" rende e salva junto', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });
      await user.click(screen.getByRole('button', { name: 'Configurar grid' }));
      const painel = await screen.findByRole('region', {
        name: 'Configurar grid',
      });

      await user.click(within(painel).getByLabelText('Correr'));
      await user.click(await screen.findByRole('option', { name: '1,5×' }));
      await user.click(
        within(painel).getByRole('button', { name: 'Salvar grid' }),
      );
      await waitFor(() =>
        expect(updateGridCena).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          expect.objectContaining({ multiplicadorCorrida: 1.5 }),
        ),
      );
    });

    it('o campo "Deslocamento (m)" do token grava na hora', async () => {
      const user = userEvent.setup();
      renderGrid();
      (await screen.findByRole('button', { name: /Ogro, coluna/ })).focus();
      await user.keyboard('{Enter}');
      const painel = await screen.findByRole('region', {
        name: 'Token selecionado',
      });

      const campo = within(painel).getByLabelText('Deslocamento (m)');
      expect(campo).toHaveValue('9');
      await user.clear(campo);
      await user.type(campo, '7,5{Enter}');
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          deslocamento: 7.5,
        }),
      );
    });
  });

  describe('ferramentas do mapa (Fase 3B)', () => {
    const barra = () =>
      screen.findByRole('toolbar', { name: 'Ferramentas do mapa' });

    const escolher = async (user, nome) => {
      const grupo = within(await barra()).getByRole('group', {
        name: 'Ferramenta',
      });
      await user.click(within(grupo).getByRole('button', { name: nome }));
    };

    it('o seletor começa em Mover e troca de ferramenta', async () => {
      const user = userEvent.setup();
      renderGrid();
      const grupo = within(await barra()).getByRole('group', {
        name: 'Ferramenta',
      });
      expect(
        within(grupo).getByRole('button', { name: 'Mover' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(propsDoMapa.ferramenta).toBe('mover');

      await escolher(user, 'Paredes');
      expect(propsDoMapa.ferramenta).toBe('paredes');
      expect(
        screen.getByRole('button', { name: 'Limpar todas as paredes' }),
      ).toBeInTheDocument();

      await escolher(user, 'Marcadores');
      expect(propsDoMapa.ferramenta).toBe('marcadores');
      expect(screen.getByText(/Toque no mapa para criar/)).toBeInTheDocument();
    });

    it('esconde o painel do token e limpa a seleção fora de Mover', async () => {
      const user = userEvent.setup();
      renderGrid();
      (await screen.findByRole('button', { name: /Ogro, coluna/ })).focus();
      await user.keyboard('{Enter}');
      expect(
        await screen.findByRole('region', { name: 'Token selecionado' }),
      ).toBeInTheDocument();

      await escolher(user, 'Paredes');
      expect(
        screen.queryByRole('region', { name: 'Token selecionado' }),
      ).not.toBeInTheDocument();

      await escolher(user, 'Mover');
      expect(
        screen.queryByRole('region', { name: 'Token selecionado' }),
      ).not.toBeInTheDocument();
    });

    it('o interruptor "Névoa ativa" só aparece com a ferramenta Névoa e grava o doc completo', async () => {
      const user = userEvent.setup();
      renderGrid();
      await barra();
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();

      await escolher(user, 'Névoa');
      const interruptor = screen.getByRole('switch', { name: 'Névoa ativa' });
      expect(interruptor).not.toBeChecked();
      expect(
        screen.getByText('Névoa desligada: os jogadores veem tudo.'),
      ).toBeInTheDocument();

      await user.click(interruptor);
      await waitFor(() =>
        expect(setGridCamada).toHaveBeenCalledWith('c1', 'cena-1', 'nevoa', {
          ativa: true,
          trechos: '',
        }),
      );
    });

    it('Revelar vira "adicionar" e Cobrir vira "remover" na névoa', async () => {
      const user = userEvent.setup();
      renderGrid();
      await escolher(user, 'Névoa');
      expect(propsDoMapa.opcoesFerramenta.acao).toBe('adicionar');

      await user.click(screen.getByRole('button', { name: 'Cobrir' }));
      expect(propsDoMapa.opcoesFerramenta.acao).toBe('remover');

      await act(async () => {
        await propsDoMapa.onEditarCamada({
          camada: 'nevoa',
          acao: 'adicionar',
          celulas: [{ col: 2, lin: 3 }],
        });
      });
      expect(setGridCamada).toHaveBeenCalledWith(
        'c1',
        'cena-1',
        'nevoa',
        expect.objectContaining({ trechos: '3:2' }),
      );
    });

    it('cria um marcador (inclusive secreto) a partir de uma célula do mapa', async () => {
      const user = userEvent.setup();
      renderGrid();
      await escolher(user, 'Marcadores');

      act(() => propsDoMapa.onCelulaMarcador({ col: 2, lin: 3 }));
      const dialogo = await screen.findByRole('dialog');
      await user.type(within(dialogo).getByLabelText('Título'), 'Armadilha');
      await user.click(within(dialogo).getByRole('button', { name: 'Perigo' }));
      await user.click(
        within(dialogo).getByRole('switch', { name: 'Só o mestre vê' }),
      );
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar' }));

      await waitFor(() =>
        expect(addGridMarcador).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          expect.objectContaining({
            col: 2,
            lin: 3,
            icone: 'perigo',
            titulo: 'Armadilha',
            secreto: true,
          }),
        ),
      );
      expect(notifySuccess).toHaveBeenCalledWith('Marcador criado.');
    });

    it('cria um marcador com tamanho 3 (payload leva o tamanho)', async () => {
      const user = userEvent.setup();
      renderGrid();
      await escolher(user, 'Marcadores');

      act(() => propsDoMapa.onCelulaMarcador({ col: 2, lin: 3 }));
      const dialogo = await screen.findByRole('dialog');
      await user.type(within(dialogo).getByLabelText('Título'), 'Torre');
      await user.click(
        within(dialogo).getByRole('combobox', { name: 'Tamanho' }),
      );
      await user.click(await screen.findByRole('option', { name: '3×3' }));
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar' }));

      await waitFor(() =>
        expect(addGridMarcador).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          expect.objectContaining({
            col: 2,
            lin: 3,
            tamanho: 3,
            titulo: 'Torre',
          }),
        ),
      );
    });

    it('edita e apaga um marcador existente', async () => {
      const user = userEvent.setup();
      subscribeGridMarcadores.mockImplementation(
        (_id, _cenaId, _opcoes, onChange) => {
          onChange([
            {
              id: 'mk9',
              col: 1,
              lin: 1,
              icone: 'porta',
              cor: '#e8cb85',
              titulo: 'Porta velha',
              texto: '',
              secreto: false,
            },
          ]);
          return vi.fn();
        },
      );
      renderGrid();
      await escolher(user, 'Marcadores');

      act(() => propsDoMapa.onMarcadorClique(propsDoMapa.marcadores[0]));
      let dialogo = await screen.findByRole('dialog');
      const titulo = within(dialogo).getByLabelText('Título');
      expect(titulo).toHaveValue('Porta velha');
      await user.clear(titulo);
      await user.type(titulo, 'Porta secreta');
      await user.click(
        within(dialogo).getByRole('combobox', { name: 'Tamanho' }),
      );
      await user.click(await screen.findByRole('option', { name: '2×2' }));
      await user.click(within(dialogo).getByRole('button', { name: 'Salvar' }));
      await waitFor(() =>
        expect(updateGridMarcador).toHaveBeenCalledWith(
          'c1',
          'cena-1',
          'mk9',
          expect.objectContaining({
            titulo: 'Porta secreta',
            tamanho: 2,
            secreto: false,
          }),
        ),
      );
      expect(notifySuccess).toHaveBeenCalledWith('Marcador atualizado.');

      act(() => propsDoMapa.onMarcadorClique(propsDoMapa.marcadores[0]));
      dialogo = await screen.findByRole('dialog');
      await user.click(within(dialogo).getByRole('button', { name: 'Apagar' }));
      await waitFor(() =>
        expect(removeGridMarcador).toHaveBeenCalledWith('c1', 'cena-1', 'mk9'),
      );
    });

    it('"Apagar todos" os desenhos usa os ids ao vivo', async () => {
      subscribeGridDesenhos.mockImplementation((_id, _cenaId, onChange) => {
        onChange([
          { id: 'd1', uid: 'm1', cor: '#ffffff', pontos: [0, 0, 5, 5] },
          { id: 'd2', uid: 'outro', cor: '#ffffff', pontos: [0, 0, 9, 9] },
        ]);
        return vi.fn();
      });
      renderGrid();
      await barra();
      await act(async () => {
        await propsDoMapa.acoesDesenho.apagarTodos();
      });
      expect(removeGridDesenhos).toHaveBeenCalledWith('c1', 'cena-1', [
        'd1',
        'd2',
      ]);
    });
  });

  describe('seleção múltipla e ações em lote', () => {
    const GOBLIN = {
      id: 'g1',
      nome: 'Goblin',
      tipo: 'criatura',
      col: 3,
      lin: 3,
      tamanho: 1,
      donos: [],
      oculto: false,
      pv: { atual: 10, max: 12 },
      condicoes: ['cond2'],
    };
    const GOBLIN_2 = {
      ...GOBLIN,
      id: 'g2',
      nome: 'Goblin 2',
      tipo: 'npc',
      col: 4,
      pv: { atual: 3, max: 8 },
      condicoes: [],
    };
    const ALDRIC = { ...TOKENS_POR_CENA['cena-1'][0] };

    beforeEach(() => {
      subscribeGridTokens.mockImplementation(
        (_id, _cenaId, _opcoes, onChange) => {
          onChange([GOBLIN, GOBLIN_2, ALDRIC]);
          return vi.fn();
        },
      );
      updateGridTokensEmLote.mockResolvedValue();
      removeGridTokensEmLote.mockResolvedValue();
    });

    const selecionar = async (...tokens) => {
      await screen.findByRole('button', { name: /Goblin, coluna/ });
      tokens.forEach(token => act(() => propsDoMapa.onAlternarSelecao(token)));
      return screen.findByRole('region', { name: 'Ações em lote' });
    };

    it('Shift-clique em 2 tokens troca o painel do token pela barra de lote', async () => {
      renderGrid();
      await screen.findByRole('button', { name: /Goblin, coluna/ });

      // Um token só: continua o painel individual.
      act(() => propsDoMapa.onAlternarSelecao(GOBLIN));
      expect(
        await screen.findByRole('region', { name: 'Token selecionado' }),
      ).toBeInTheDocument();
      expect(propsDoMapa.selecionadoId).toBe('g1');

      act(() => propsDoMapa.onAlternarSelecao(GOBLIN_2));
      const barra = await screen.findByRole('region', {
        name: 'Ações em lote',
      });
      expect(
        screen.queryByRole('region', { name: 'Token selecionado' }),
      ).not.toBeInTheDocument();
      expect(within(barra).getByText('2 tokens selecionados')).toBeVisible();
      expect(propsDoMapa.selecionadosIds).toEqual(['g1', 'g2']);

      // Clique simples volta ao token único.
      act(() => propsDoMapa.onSelecionar(GOBLIN_2));
      expect(
        await screen.findByRole('region', { name: 'Token selecionado' }),
      ).toBeInTheDocument();
      expect(propsDoMapa.selecionadosIds).toEqual([]);
    });

    it('Esc limpa a seleção', async () => {
      const user = userEvent.setup();
      renderGrid();
      await selecionar(GOBLIN, GOBLIN_2);

      await user.keyboard('{Escape}');
      await waitFor(() =>
        expect(
          screen.queryByRole('region', { name: 'Ações em lote' }),
        ).not.toBeInTheDocument(),
      );
      expect(propsDoMapa.selecionadosIds).toEqual([]);
    });

    it('"-5" tira 5 de PV de cada selecionado, num lote só, e ignora jogadores', async () => {
      const user = userEvent.setup();
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2, ALDRIC);
      expect(within(barra).getByRole('note')).toHaveTextContent(
        '1 jogador (PV e condições vêm da ficha)',
      );

      await user.type(within(barra).getByLabelText('Dano/cura (PV)'), '-5');
      await user.click(within(barra).getByRole('button', { name: 'Aplicar' }));

      await waitFor(() =>
        expect(updateGridTokensEmLote).toHaveBeenCalledWith('c1', 'cena-1', [
          { id: 'g1', patch: { pv: { atual: 5, max: 12 } } },
          { id: 'g2', patch: { pv: { atual: 0, max: 8 } } },
        ]),
      );
      expect(updateGridTokensEmLote).toHaveBeenCalledTimes(1);
      expect(updateGridToken).not.toHaveBeenCalled();
      expect(notifySuccess).toHaveBeenCalledWith(
        'PV alterado em 2 tokens (1 ignorado).',
      );
    });

    it('dano que não muda nenhum PV avisa em vez de gravar', async () => {
      const user = userEvent.setup();
      renderGrid();
      const barra = await selecionar(GOBLIN, ALDRIC);

      await user.type(within(barra).getByLabelText('Dano/cura (PV)'), 'abc');
      await user.click(within(barra).getByRole('button', { name: 'Aplicar' }));
      await waitFor(() => expect(notifyError).toHaveBeenCalled());
      expect(updateGridTokensEmLote).not.toHaveBeenCalled();
    });

    it('adiciona e remove uma condição dos NPCs/criaturas selecionados', async () => {
      const user = userEvent.setup();
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2);

      await user.click(within(barra).getByLabelText('Condição'));
      await user.click(
        await screen.findByRole('option', { name: 'Envenenado' }),
      );
      await user.click(
        within(barra).getByRole('button', { name: 'Adicionar condição' }),
      );
      await waitFor(() =>
        expect(updateGridTokensEmLote).toHaveBeenCalledWith('c1', 'cena-1', [
          { id: 'g1', patch: { condicoes: ['cond2', 'cond1'] } },
          { id: 'g2', patch: { condicoes: ['cond1'] } },
        ]),
      );

      updateGridTokensEmLote.mockClear();
      await user.click(
        within(barra).getByRole('button', { name: 'Remover condição' }),
      );
      // Ninguém tem "Envenenado" ainda (os tokens não mudaram na escuta):
      // nada a gravar.
      await waitFor(() =>
        expect(notifySuccess).toHaveBeenCalledWith(
          'Nenhum token precisava de mudança.',
        ),
      );
      expect(updateGridTokensEmLote).not.toHaveBeenCalled();
    });

    it('Ocultar e Revelar gravam oculto só de quem está diferente', async () => {
      const user = userEvent.setup();
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2, ALDRIC);

      await user.click(within(barra).getByRole('button', { name: 'Ocultar' }));
      await waitFor(() =>
        expect(updateGridTokensEmLote).toHaveBeenCalledWith('c1', 'cena-1', [
          { id: 'g1', patch: { oculto: true } },
          { id: 'g2', patch: { oculto: true } },
          { id: 't1', patch: { oculto: true } },
        ]),
      );
    });

    it('Excluir pede confirmação e remove todos de uma vez', async () => {
      const user = userEvent.setup();
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2);

      await user.click(
        within(barra).getByRole('button', { name: 'Excluir 2 tokens' }),
      );
      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveTextContent('Excluir 2 tokens da cena?');
      expect(removeGridTokensEmLote).not.toHaveBeenCalled();

      await user.click(
        within(dialogo).getByRole('button', { name: 'Excluir' }),
      );
      await waitFor(() =>
        expect(removeGridTokensEmLote).toHaveBeenCalledWith('c1', 'cena-1', [
          'g1',
          'g2',
        ]),
      );
      await waitFor(() =>
        expect(
          screen.queryByRole('region', { name: 'Ações em lote' }),
        ).not.toBeInTheDocument(),
      );
    });

    it('cancelar a confirmação não exclui nada', async () => {
      const user = userEvent.setup();
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2);

      await user.click(
        within(barra).getByRole('button', { name: 'Excluir 2 tokens' }),
      );
      const dialogo = await screen.findByRole('dialog');
      await user.click(
        within(dialogo).getByRole('button', { name: 'Cancelar' }),
      );
      expect(removeGridTokensEmLote).not.toHaveBeenCalled();
    });

    it('em combate: "Adicionar ao combate" rola a iniciativa de todos numa transação só', async () => {
      const user = userEvent.setup();
      const COMBATE = {
        ordem: [{ tokenId: 't1', iniciativa: 12, d20: 6, reacao: 6 }],
        indice: 0,
        rodada: 1,
        inicioTurno: { col: 1, lin: 1 },
        turnoEm: { seconds: 10, nanoseconds: 0 },
      };
      subscribeGridCombate.mockImplementation((_id, _cenaId, onChange) => {
        onChange(COMBATE);
        return vi.fn();
      });
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2);

      await user.click(
        within(barra).getByRole('button', { name: 'Adicionar ao combate' }),
      );
      await waitFor(() => expect(alterarGridCombate).toHaveBeenCalledTimes(1));
      const resultado = alterarGridCombate.mock.calls[0][2](COMBATE);
      expect(resultado.patch.ordem.map(e => e.tokenId).sort()).toEqual([
        'g1',
        'g2',
        't1',
      ]);
      await waitFor(() =>
        expect(notifySuccess).toHaveBeenCalledWith(
          expect.stringContaining('2 tokens entraram no combate'),
        ),
      );
    });

    it('em combate: Excluir tira os participantes do combate antes de apagar os tokens', async () => {
      const user = userEvent.setup();
      const COMBATE = {
        ordem: [
          { tokenId: 'g1', iniciativa: 15, d20: 9, reacao: 6 },
          { tokenId: 't1', iniciativa: 12, d20: 6, reacao: 6 },
          { tokenId: 'g2', iniciativa: 3, d20: 3, reacao: 0 },
        ],
        indice: 1,
        rodada: 1,
        inicioTurno: { col: 1, lin: 1 },
        turnoEm: { seconds: 10, nanoseconds: 0 },
      };
      subscribeGridCombate.mockImplementation((_id, _cenaId, onChange) => {
        onChange(COMBATE);
        return vi.fn();
      });
      renderGrid();
      const barra = await selecionar(GOBLIN, GOBLIN_2);

      await user.click(
        within(barra).getByRole('button', { name: 'Excluir 2 tokens' }),
      );
      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveTextContent('Quem estiver no combate sai dele');
      await user.click(
        within(dialogo).getByRole('button', { name: 'Excluir' }),
      );

      await waitFor(() =>
        expect(removeGridTokensEmLote).toHaveBeenCalledWith('c1', 'cena-1', [
          'g1',
          'g2',
        ]),
      );
      expect(alterarGridCombate).toHaveBeenCalledTimes(1);
      const resultado = alterarGridCombate.mock.calls[0][2](COMBATE);
      expect(resultado.patch.ordem.map(e => e.tokenId)).toEqual(['t1']);
      // A vez era do Aldric (t1): continua dele.
      expect(resultado.patch.indice).toBe(0);
    });
  });
  describe('atalhos de teclado e ocultar com um clique', () => {
    const ORDEM = [
      { tokenId: 't1', iniciativa: 12, d20: 6, reacao: 6 },
      { tokenId: 't2', iniciativa: 9, d20: 9, reacao: 0 },
    ];
    const COMBATE = {
      ordem: ORDEM,
      indice: 0,
      rodada: 1,
      inicioTurno: { col: 1, lin: 1 },
      turnoEm: { seconds: 10, nanoseconds: 0 },
    };
    const GOBLIN = {
      id: 'g1',
      nome: 'Goblin',
      tipo: 'criatura',
      col: 3,
      lin: 3,
      tamanho: 1,
      donos: [],
      oculto: false,
    };
    const GOBLIN_2 = { ...GOBLIN, id: 'g2', nome: 'Goblin 2', col: 4 };

    const emitirCombate = doc =>
      subscribeGridCombate.mockImplementation((_id, _cenaId, onChange) => {
        onChange(doc);
        return vi.fn();
      });

    const selecionarOgro = async user => {
      (await screen.findByRole('button', { name: /Ogro/ })).focus();
      await user.keyboard('{Enter}');
      return screen.findByRole('region', { name: 'Token selecionado' });
    };

    it('o olho do painel revela/oculta na hora, sem "Salvar token"', async () => {
      const user = userEvent.setup();
      renderGrid();
      const painel = await selecionarOgro(user);

      await user.click(
        within(painel).getByRole('button', { name: 'Revelar aos jogadores' }),
      );
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          oculto: false,
        }),
      );
    });

    it('N não faz nada sem combate', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });
      await user.keyboard('n');
      expect(alterarGridCombate).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('com combate, N avança e Shift+N volta o turno', async () => {
      const user = userEvent.setup();
      emitirCombate(COMBATE);
      renderGrid();
      await screen.findByText('Rodada 1');

      await user.keyboard('n');
      await waitFor(() => expect(alterarGridCombate).toHaveBeenCalledTimes(1));
      expect(alterarGridCombate.mock.calls[0][2](COMBATE).patch.indice).toBe(1);

      await user.keyboard('{Shift>}n{/Shift}');
      await waitFor(() => expect(alterarGridCombate).toHaveBeenCalledTimes(2));
    });

    it('H revela o token selecionado quando ele já está oculto', async () => {
      const user = userEvent.setup();
      renderGrid();
      await selecionarOgro(user);

      await user.keyboard('h');
      await waitFor(() =>
        expect(updateGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2', {
          oculto: false,
        }),
      );
    });

    it('H em seleção múltipla oculta todos de uma vez', async () => {
      const user = userEvent.setup();
      subscribeGridTokens.mockImplementation(
        (_id, _cenaId, _opcoes, onChange) => {
          onChange([GOBLIN, GOBLIN_2]);
          return vi.fn();
        },
      );
      updateGridTokensEmLote.mockResolvedValue();
      renderGrid();
      await screen.findByRole('button', { name: /Goblin, coluna/ });
      act(() => propsDoMapa.onAlternarSelecao(GOBLIN));
      act(() => propsDoMapa.onAlternarSelecao(GOBLIN_2));
      await screen.findByRole('region', { name: 'Ações em lote' });

      await user.keyboard('h');
      await waitFor(() =>
        expect(updateGridTokensEmLote).toHaveBeenCalledWith('c1', 'cena-1', [
          { id: 'g1', patch: { oculto: true } },
          { id: 'g2', patch: { oculto: true } },
        ]),
      );
    });

    it('Delete exclui o token selecionado depois de confirmar', async () => {
      const user = userEvent.setup();
      const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderGrid();
      await selecionarOgro(user);

      await user.keyboard('{Delete}');
      expect(confirmar).toHaveBeenCalledWith('Remover "Ogro" da cena?');
      expect(removeGridToken).not.toHaveBeenCalled();

      confirmar.mockReturnValue(true);
      await user.keyboard('{Delete}');
      await waitFor(() =>
        expect(removeGridToken).toHaveBeenCalledWith('c1', 'cena-1', 't2'),
      );
    });

    it('V, W, F e M trocam a ferramenta do mapa', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });

      await user.keyboard('w');
      await waitFor(() => expect(propsDoMapa.ferramenta).toBe('paredes'));
      await user.keyboard('f');
      await waitFor(() => expect(propsDoMapa.ferramenta).toBe('nevoa'));
      await user.keyboard('m');
      await waitFor(() => expect(propsDoMapa.ferramenta).toBe('marcadores'));
      await user.keyboard('v');
      await waitFor(() => expect(propsDoMapa.ferramenta).toBe('mover'));
    });

    it('"?" abre a lista de atalhos e o botão "Atalhos" também', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });

      await user.keyboard('?');
      const dialogo = await screen.findByRole('dialog');
      expect(dialogo).toHaveTextContent('Atalhos do teclado');
      expect(dialogo).toHaveTextContent('Ocultar ou revelar');
      await user.click(within(dialogo).getByRole('button', { name: 'Fechar' }));
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );

      await user.click(screen.getByRole('button', { name: 'Atalhos' }));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
    });

    it('os atalhos não disparam enquanto se digita num campo', async () => {
      const user = userEvent.setup();
      renderGrid();
      const painel = await selecionarOgro(user);

      const nome = within(painel).getByLabelText('Nome');
      await user.clear(nome);
      await user.type(nome, 'hnw?');
      expect(nome).toHaveValue('hnw?');
      expect(updateGridToken).not.toHaveBeenCalled();
      expect(propsDoMapa.ferramenta).toBe('mover');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('com um diálogo aberto, as teclas ficam desligadas', async () => {
      const user = userEvent.setup();
      renderGrid();
      await screen.findByRole('button', { name: /Aldric, coluna/ });
      await user.click(screen.getByRole('button', { name: 'Atalhos' }));
      await screen.findByRole('dialog');

      await user.keyboard('w');
      expect(propsDoMapa.ferramenta).toBe('mover');
    });
  });
});
