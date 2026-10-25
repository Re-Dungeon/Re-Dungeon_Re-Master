import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CardFluxExploracaoConfig from './CardFluxExploracaoConfig';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getCardfluxCartas = vi.fn();
const getRmCardfluxEstadosPorCampanha = vi.fn();
const getRmCardfluxExploracoesPorCampanha = vi.fn();
const getRmMapasPorCampanha = vi.fn();
const getRmMapasPastasPorCampanha = vi.fn();
const getUniversos = vi.fn();
vi.mock('service/storage', () => ({
  getCardfluxCartas: (...args) => getCardfluxCartas(...args),
  getRmCardfluxEstadosPorCampanha: (...args) =>
    getRmCardfluxEstadosPorCampanha(...args),
  getRmCardfluxExploracoesPorCampanha: (...args) =>
    getRmCardfluxExploracoesPorCampanha(...args),
  getRmMapasPorCampanha: (...args) => getRmMapasPorCampanha(...args),
  getRmMapasPastasPorCampanha: (...args) =>
    getRmMapasPastasPorCampanha(...args),
  getUniversos: (...args) => getUniversos(...args),
  updateRmCardfluxExploracao: vi.fn(),
  addRmCardfluxExploracao: vi.fn(),
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

import CardFlux from './CardFlux';
import CardFluxExploracaoPage from './CardFluxExploracaoPage';
import { gerarExploracaoGrid, sanitizarExploracaoParaPersistencia } from './exploracaoGrid';

const CARTAS_MOCK = [
  {
    id: 'carta1',
    deck: 'Eventos de Estrada',
    nome: 'Emboscada',
    tipo: 'Perigo',
    descricaoGeral: 'Uma emboscada.',
  },
  {
    id: 'carta2',
    deck: 'Eventos de Estrada',
    nome: 'Baú do Tesouro',
    tipo: 'Recompensa',
  },
];
const ESTADOS_MOCK = [
  {
    id: 'estado1',
    campanhaId: 'c1',
    cartaId: 'carta2',
    estadoNoBaralho: 'comprada',
  },
];

const renderCardFlux = () =>
  render(
    <MemoryRouter>
      <CardFlux />
    </MemoryRouter>,
  );

describe('CardFlux (baralhos agrupados a partir das cartas do cardflux)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
    getRmCardfluxEstadosPorCampanha.mockResolvedValue(ESTADOS_MOCK);
    getRmCardfluxExploracoesPorCampanha.mockResolvedValue([]);
    getRmMapasPorCampanha.mockResolvedValue([
      { id: 'm1', nome: 'Mapa da Torre', linkImagem: 'https://example.com/torre.jpg', pastaId: 'p1' },
      { id: 'm2', nome: 'Mapa Sem Pasta', linkImagem: 'https://example.com/sem-pasta.jpg', pastaId: null },
    ]);
    getRmMapasPastasPorCampanha.mockResolvedValue([
      { id: 'p1', nome: 'Pasta da Torre', imagemCapa: 'https://example.com/pasta-capa.jpg' },
    ]);
    getUniversos.mockResolvedValue([{ id: 'u1', Nome: 'Caverna do Dragão' }]);
  });

  it('abre o seletor de fundo com a busca e a estrutura de pastas em destaque', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CardFluxExploracaoConfig />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Gerar Grid de exploração')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Adicionar imagem de fundo/i }));

    await waitFor(() => expect(screen.getByText('Fundo do Grid')).toBeInTheDocument());
    expect(screen.getByPlaceholderText('Buscar mapas ou pastas...')).toBeInTheDocument();
    expect(screen.getByText('Pasta da Torre')).toBeInTheDocument();
  });

  it('busca as cartas do universo da campanha ativa e agrupa por deck', async () => {
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
    expect(getCardfluxCartas).toHaveBeenCalledWith('u1');
    expect(screen.getByText('1/2 cartas disponíveis')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há cartas cadastradas para o universo', async () => {
    getCardfluxCartas.mockResolvedValue([]);
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Nenhum baralho encontrado')).toBeInTheDocument(),
    );
  });

  it('navega para o motor de sorteio passando só o nome do baralho no state', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Sortear' }));

    expect(navigate).toHaveBeenCalledWith('/cardflux/sorteio', {
      state: { baralhos: ['Eventos de Estrada'] },
    });
  });

  it('navega para ver as cartas passando só o nome do baralho no state', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Ver Cartas' }));

    expect(navigate).toHaveBeenCalledWith('/cardflux/cartas', {
      state: { baralho: { nome: 'Eventos de Estrada' } },
    });
  });

  it('mostra os botões de geração de grid e navega para a configuração', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: 'Gerar Grid' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Grid' })[0]);

    expect(navigate).toHaveBeenCalledWith('/cardflux/exploracao/config', {
      state: { baralhos: ['Eventos de Estrada'] },
    });
  });

  it('mostra o botão de gerenciar explorações e navega diretamente para o gerenciador', async () => {
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );

    const button = screen.getByRole('button', { name: /gerenciar explorações|minhas explorações/i });
    expect(button).toBeInTheDocument();
    await user.click(button);

    expect(navigate).toHaveBeenCalledWith('/cardflux/exploracoes');
  });

  it('renderiza o painel de exploração com controles de zoom e grid central', async () => {
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 2, colunas: 2 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText('Grid de Teste')).toBeInTheDocument(),
    );

    expect(screen.getByRole('button', { name: /zoom \+/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ajustar à tela/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revelar/i })).toBeInTheDocument();
    expect(screen.getByText('Caverna do Dragão')).toBeInTheDocument();
    expect(screen.getAllByText('Emboscada').length).toBeGreaterThan(0);
  });

  it('mantém a imagem de fundo separada da opacidade do grid', async () => {
    const user = userEvent.setup();
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 2, colunas: 2 },
      baralhos: ['Eventos de Estrada'],
      imagemFundo: {
        url: 'https://example.com/fundo.jpg',
        ajuste: 'cover',
        opacidadeQuadrantes: 40,
      },
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

    const fundo = screen.getByAltText('Imagem de fundo da exploração');
    expect(fundo).toHaveStyle('opacity: 1');

    await user.click(screen.getByRole('button', { name: /ocultar grid/i }));

    expect(screen.getByRole('button', { name: /mostrar grid/i })).toBeInTheDocument();
    expect(fundo).toHaveStyle('opacity: 1');
  });

  it('não atribui marcador de categoria automaticamente e abre o menu contextual de marcação', async () => {
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 2, colunas: 2 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'revelado', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

    expect(document.querySelectorAll('.exploration-cell__category-icon').length).toBe(0);

    const quadrante = screen.getByRole('button', { name: /0,0/i });
    fireEvent.contextMenu(quadrante);

    await waitFor(() => expect(screen.getByText('Marcar Quadrante')).toBeInTheDocument());
    expect(screen.getByRole('menuitemradio', { name: /Combate/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Remover marcador/i })).toBeInTheDocument();
    expect(consoleErrorSpy.mock.calls.flat(Infinity).join(' ')).not.toContain('RovingTabIndexContext');

    consoleErrorSpy.mockRestore();
  });

  it('mantém o quadrante oculto visualmente como não explorado mesmo com marcador salvo', async () => {
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 1, colunas: 1 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [[{ x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', marcador: 'combate', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false }]],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

    const quadranteButton = screen.getByRole('button', { name: /0,0/i });
    expect(quadranteButton.querySelector('img[alt="Combate"]')).not.toBeInTheDocument();
    expect(quadranteButton.querySelector('img[alt="Não explorado"]')).toBeInTheDocument();
    expect(quadranteButton.querySelectorAll('img')).toHaveLength(1);
  });

  it('mostra ícone de carta quando o quadrante revelado possui carta vinculada', async () => {
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 1, colunas: 1 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [[{ x: 0, y: 0, estado: 'revelado', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false }]],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

    const quadranteButton = screen.getByRole('button', { name: /0,0/i });
    expect(quadranteButton.querySelector('img[alt="Carta"]')).toBeInTheDocument();
    expect(quadranteButton.querySelector('img[alt="Explorado"]')).not.toBeInTheDocument();
  });

  it('prioriza o marcador manual como ícone central do quadrante e remove o mini-ícone extra', async () => {
    const marcadores = [
      { marcador: 'combate', label: 'Combate' },
      { marcador: 'descoberta', label: 'Descoberta' },
      { marcador: 'interacao', label: 'Interação' },
      { marcador: 'perigo', label: 'Perigo' },
      { marcador: 'objetivo', label: 'Objetivo' },
      { marcador: 'ambiental', label: 'Ambiental' },
      { marcador: 'acampamento', label: 'Acampamento' },
    ];

    for (const { marcador, label } of marcadores) {
      const exploracao = {
        id: 'exp-1',
        nome: 'Grid de Teste',
        status: 'ativa',
        dimensoes: { linhas: 1, colunas: 1 },
        baralhos: ['Eventos de Estrada'],
        quadrantes: [[{ x: 0, y: 0, estado: 'revelado', cartaId: 'carta1', marcador, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false }]],
        configuracao: { densidade: 50, modo: 'predefinida' },
      };

      const { unmount } = render(
        <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
          <CardFluxExploracaoPage />
        </MemoryRouter>,
      );

      await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

      const quadranteButton = screen.getByRole('button', { name: /0,0/i });
      expect(quadranteButton.querySelector(`img[alt="${label}"]`)).toBeInTheDocument();
      expect(quadranteButton.querySelectorAll('img')).toHaveLength(1);

      unmount();
    }
  });

  it('mantém a geometria do grid estável ao alternar o estado de um quadrante', async () => {
    const user = userEvent.setup();
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 3, colunas: 3 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 2, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 2, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 2, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 2, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 2, y: 2, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

    const gridStage = screen.getByTestId('exploracao-grid-stage');
    const beforeWidth = gridStage.getAttribute('data-grid-width');
    const beforeHeight = gridStage.getAttribute('data-grid-height');

    const quadranteButton = Array.from(document.querySelectorAll('button')).find(button => button.textContent?.includes('0,0'));
    expect(quadranteButton).toBeTruthy();
    await user.click(quadranteButton);
    await user.click(screen.getByRole('button', { name: /revelar/i }));

    expect(gridStage.getAttribute('data-grid-width')).toBe(beforeWidth);
    expect(gridStage.getAttribute('data-grid-height')).toBe(beforeHeight);
  });

  it('oferece o gerenciador explícito de carta com confirmação antes de remover', async () => {
    const user = userEvent.setup();
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 2, colunas: 2 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Gerenciar carta')).toBeInTheDocument());

    const removerBotao = screen.getByRole('button', { name: /remover carta/i });
    await user.click(removerBotao);

    expect(screen.getAllByText('Confirmar remoção').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /confirmar remoção/i })).toBeInTheDocument();
  });

  it('mostra o botão de ajuda do grid e mantém o formulário ao abrir e fechar o modal', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/config', state: { baralhos: ['Eventos de Estrada'] } }]}>
        <CardFluxExploracaoConfig />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Nome da exploração')).toBeInTheDocument(),
    );

    const nomeInput = screen.getByLabelText('Nome da exploração');
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Grid de Teste');

    const ajudaButton = screen.getByRole('button', { name: /ajuda sobre o grid de exploração/i });
    await user.click(ajudaButton);

    expect(screen.getByText('Guia do Grid de Exploração')).toBeInTheDocument();
    expect(
      screen.getAllByText((_, node) =>
        node?.textContent?.includes('peso 0') &&
        node?.textContent?.includes('sorteio automático'),
      ).length,
    ).toBeGreaterThan(0);
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain('non-boolean attribute paragraph');

    await user.click(screen.getByRole('button', { name: /entendi/i }));
    expect(screen.getByLabelText('Nome da exploração')).toHaveValue('Grid de Teste');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByLabelText('Nome da exploração')).toHaveValue('Grid de Teste');

    consoleErrorSpy.mockRestore();
  });

  it('mostra a ajuda da exploração principal e preserva o quadrante selecionado', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid de Teste',
      status: 'ativa',
      dimensoes: { linhas: 2, colunas: 2 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', resultado: null, observacao: '', anotacao: 'Primeira nota', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid de Teste')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /ajuda da exploração/i }));
    expect(screen.getByText('Ajuda da Exploração')).toBeInTheDocument();
    expect(screen.getAllByText(/painel esquerdo/i).length).toBeGreaterThan(0);
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain('non-boolean attribute paragraph');

    await user.click(screen.getByRole('button', { name: /entendi/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /ajuda da exploração/i })).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue('Primeira nota')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('mostra o botão de acesso direto às explorações na configuração sem gerar uma nova exploração', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/config', state: { baralhos: ['Eventos de Estrada'] } }]}>
        <CardFluxExploracaoConfig />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Nome da exploração')).toBeInTheDocument(),
    );

    const button = screen.getByRole('button', { name: /minhas explorações/i });
    expect(button).toBeInTheDocument();
    await user.click(button);

    expect(navigate).toHaveBeenCalledWith('/cardflux/exploracoes');
  });

  it('mostra o erro de carregamento quando as cartas falham e permite tentar de novo', async () => {
    getCardfluxCartas.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderCardFlux();

    await waitFor(() =>
      expect(
        screen.getByText('Erro ao carregar o CardFlux.'),
      ).toBeInTheDocument(),
    );

    getCardfluxCartas.mockResolvedValue(CARTAS_MOCK);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() =>
      expect(screen.getByText('Eventos de Estrada')).toBeInTheDocument(),
    );
  });

  it('renderiza o formulário de exploração sem emitir o aviso de inputProps no DOM', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/config', state: { baralhos: ['Eventos de Estrada'] } }]}>
        <CardFluxExploracaoConfig />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Nome da exploração')).toBeInTheDocument(),
    );

    const linhasInput = screen.getByLabelText('Linhas');
    const colunasInput = screen.getByLabelText('Colunas');
    const densidadeInput = screen.getByLabelText('Densidade (%)');

    expect(linhasInput).toHaveAttribute('min', '1');
    expect(linhasInput).toHaveAttribute('max', '12');
    expect(colunasInput).toHaveAttribute('min', '1');
    expect(colunasInput).toHaveAttribute('max', '12');
    expect(densidadeInput).toHaveAttribute('min', '0');
    expect(densidadeInput).toHaveAttribute('max', '100');

    await user.clear(linhasInput);
    await user.type(linhasInput, '4');
    await user.clear(colunasInput);
    await user.type(colunasInput, '5');
    await user.clear(densidadeInput);
    await user.type(densidadeInput, '75');

    expect(linhasInput).toHaveValue(4);
    expect(colunasInput).toHaveValue(5);
    expect(densidadeInput).toHaveValue(75);
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain('inputProps');

    consoleErrorSpy.mockRestore();
  });

  it('preserva a imagem de fundo no objeto da exploração e no payload sanitizado', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Mapa com fundo',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['Eventos de Estrada'],
      linhas: 3,
      colunas: 3,
      densidade: 25,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_MOCK,
      imagemFundo: {
        url: 'https://exemplo.com/mapa.png',
        ajuste: 'contain',
        opacidadeQuadrantes: 35,
      },
    });

    expect(exploracao.imagemFundo).toEqual({
      origem: 'url',
      mapaId: null,
      url: 'https://exemplo.com/mapa.png',
      ajuste: 'contain',
      opacidadeQuadrantes: 35,
    });

    const payload = sanitizarExploracaoParaPersistencia(exploracao, { exigirCamposObrigatorios: false });
    expect(payload.imagemFundo).toEqual({
      origem: 'url',
      mapaId: null,
      url: 'https://exemplo.com/mapa.png',
      ajuste: 'contain',
      opacidadeQuadrantes: 35,
    });
  });

  it('preserva a origem do fundo quando a imagem vem de um mapa cadastrado', () => {
    const payload = sanitizarExploracaoParaPersistencia({
      id: 'exp-2',
      nome: 'Mapa da campanha',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['Eventos de Estrada'],
      linhas: 2,
      colunas: 2,
      densidade: 20,
      modo: 'predefinida',
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      imagemFundo: {
        origem: 'mapa',
        mapaId: 'mapa-1',
        url: 'https://exemplo.com/mapa-cadastrado.jpg',
        ajuste: 'cover',
        opacidadeQuadrantes: 42,
      },
    }, { exigirCamposObrigatorios: false });

    expect(payload.imagemFundo).toEqual({
      origem: 'mapa',
      mapaId: 'mapa-1',
      url: 'https://exemplo.com/mapa-cadastrado.jpg',
      ajuste: 'cover',
      opacidadeQuadrantes: 42,
    });
  });

  it('renderiza a imagem de fundo contínua do grid quando a exploração possui URL válida', async () => {
    const exploracao = {
      id: 'exp-1',
      nome: 'Grid com fundo',
      status: 'ativa',
      dimensoes: { linhas: 2, colunas: 2 },
      baralhos: ['Eventos de Estrada'],
      quadrantes: [
        [
          { x: 0, y: 0, estado: 'oculto', cartaId: 'carta1', resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
        [
          { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
        ],
      ],
      imagemFundo: {
        url: 'https://exemplo.com/mapa.png',
        ajuste: 'cover',
        opacidadeQuadrantes: 18,
      },
      configuracao: { densidade: 50, modo: 'predefinida' },
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-1', state: { exploracao } }]}>
        <CardFluxExploracaoPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Grid com fundo')).toBeInTheDocument());
    expect(screen.getByAltText('Imagem de fundo da exploração')).toHaveAttribute('src', 'https://exemplo.com/mapa.png');
    expect(screen.getByRole('button', { name: /configurar fundo/i })).toBeInTheDocument();
  });

  it('faz o grid seguir a proporção da imagem no modo Ajustar', async () => {
    const naturalWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth');
    const naturalHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalHeight');
    const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');

    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', {
      configurable: true,
      get() {
        return 1920;
      },
    });
    Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', {
      configurable: true,
      get() {
        return 1080;
      },
    });
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      get() {
        return this._src || '';
      },
      set(value) {
        this._src = value;
        queueMicrotask(() => {
          if (typeof this.onload === 'function') {
            this.onload();
          }
        });
      },
    });

    try {
      const exploracao = {
        id: 'exp-3',
        nome: 'Grid com proporção da imagem',
        status: 'ativa',
        dimensoes: { linhas: 2, colunas: 2 },
        baralhos: ['Eventos de Estrada'],
        quadrantes: [
          [
            { x: 0, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
            { x: 1, y: 0, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          ],
          [
            { x: 0, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
            { x: 1, y: 1, estado: 'oculto', cartaId: null, resultado: null, observacao: '', anotacao: '', bloqueado: false, fixo: false },
          ],
        ],
        imagemFundo: {
          url: 'https://exemplo.com/mapa-ajustar.png',
          ajuste: 'contain',
          opacidadeQuadrantes: 20,
        },
        configuracao: { densidade: 50, modo: 'predefinida' },
      };

      render(
        <MemoryRouter initialEntries={[{ pathname: '/cardflux/exploracao/exp-3', state: { exploracao } }]}>
          <CardFluxExploracaoPage />
        </MemoryRouter>,
      );

      await waitFor(() => expect(screen.getByText('Grid com proporção da imagem')).toBeInTheDocument());
      const stage = screen.getByTestId('exploracao-grid-stage');
      expect(window.getComputedStyle(stage).aspectRatio).toBe('1920/1080');
    } finally {
      if (naturalWidthDescriptor) {
        Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', naturalWidthDescriptor);
      } else {
        delete HTMLImageElement.prototype.naturalWidth;
      }
      if (naturalHeightDescriptor) {
        Object.defineProperty(HTMLImageElement.prototype, 'naturalHeight', naturalHeightDescriptor);
      } else {
        delete HTMLImageElement.prototype.naturalHeight;
      }
      if (srcDescriptor) {
        Object.defineProperty(HTMLImageElement.prototype, 'src', srcDescriptor);
      } else {
        delete HTMLImageElement.prototype.src;
      }
    }
  });
});
