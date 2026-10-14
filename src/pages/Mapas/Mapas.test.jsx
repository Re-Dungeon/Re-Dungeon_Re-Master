import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const getRmMapasPorCampanha = vi.fn();
const getRmMapasPastasPorCampanha = vi.fn();
const addRmMapaPasta = vi.fn();
const removeRmMapa = vi.fn();
const updateRmMapa = vi.fn();
const notifyError = vi.fn();
const notifySuccess = vi.fn();
vi.mock('service/storage', () => ({
  getRmMapasPorCampanha: (...args) => getRmMapasPorCampanha(...args),
  getRmMapasPastasPorCampanha: (...args) => getRmMapasPastasPorCampanha(...args),
  addRmMapaPasta: (...args) => addRmMapaPasta(...args),
  removeRmMapaPasta: vi.fn(),
  updateRmMapaPasta: vi.fn(),
  updateRmMapa: (...args) => updateRmMapa(...args),
  removeRmMapa: (...args) => removeRmMapa(...args),
}));

const CURRENT_USER_UID = 'm1';
let authState;
vi.mock('context/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({ notifyError, notifySuccess }),
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: CURRENT_USER_UID,
};
let campanhaAtiva = CAMPANHA_ATIVA;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva,
    loadingCampanhas: false,
  }),
}));

import Mapas from './Mapas';

const MAPAS_MOCK = [
  {
    id: 'mapa1',
    campanhaId: 'c1',
    nome: 'Mapa da Cidade',
    categoria: 'cidade',
    descricao: 'Ruas antigas e mercados em um centro comercial movimentado.',
    linkImagem: 'https://example.com/mapa-cidade.jpg',
    favorito: true,
    tags: ['mercado', 'rua'],
  },
  {
    id: 'mapa2',
    campanhaId: 'c1',
    nome: 'Masmorra Antiga',
    categoria: 'masmorra',
    descricao: 'Câmaras profundas, armadilhas e corredores sombrios.',
    linkImagem: 'https://example.com/masmorra-antiga.jpg',
    favorito: false,
    tags: ['tesouro'],
  },
];

const MAPAS_PASTAS_MOCK = [
  {
    id: 'pasta1',
    campanhaId: 'c1',
    universoId: 'u1',
    mestreId: CURRENT_USER_UID,
    nome: 'Entrada das Raízes',
    descricao: 'Área inicial da aventura.',
    imagemCapa: 'https://example.com/capa-entrada.jpg',
    ordem: 1,
  },
];

const renderMapas = () =>
  render(
    <MemoryRouter>
      <Mapas />
    </MemoryRouter>,
  );

describe('Mapas (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { currentUser: { uid: CURRENT_USER_UID }, isAdmin: false };
    campanhaAtiva = CAMPANHA_ATIVA;
    getRmMapasPorCampanha.mockResolvedValue(MAPAS_MOCK);
    getRmMapasPastasPorCampanha.mockResolvedValue(MAPAS_PASTAS_MOCK);
    addRmMapaPasta.mockResolvedValue({ id: 'nova-pasta', ...MAPAS_PASTAS_MOCK[0] });
    updateRmMapa.mockResolvedValue(undefined);
  });

  it('lista os mapas da campanha ativa com a categoria e metadado visual do card', async () => {
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );
    expect(screen.getByText('Masmorra Antiga')).toBeInTheDocument();
    expect(screen.getAllByText(/Cidade/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Masmorra/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MAPA/i).length).toBeGreaterThan(0);
    expect(screen.getByAltText('Mapa da Cidade')).toBeInTheDocument();
  });

  it('limita a área de descrição das pastas com texto longo em um card uniforme', async () => {
    const pastaLonga = {
      ...MAPAS_PASTAS_MOCK[0],
      id: 'pasta-longa',
      nome: 'As Raízes de Níðhöggr',
      descricao:
        'A profundidade das raízes percorre a terra e guarda lembranças de antigas batalhas, ruínas esquecidas, segredos ocultos e caminhos que só se revelam àqueles que ouvem o silêncio entre as pedras.',
    };

    getRmMapasPastasPorCampanha.mockResolvedValue([pastaLonga]);
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('As Raízes de Níðhöggr')).toBeInTheDocument(),
    );

    const descricao = screen.getByText(pastaLonga.descricao);
    const styles = window.getComputedStyle(descricao);

    expect(styles.overflowY).toBe('auto');
    expect(styles.overflowX).toBe('hidden');
    expect(styles.maxHeight).toBe('88px');
    expect(['0px', '0%']).toContain(styles.minHeight);
  });

  it('mostra o cabeçalho da biblioteca e a contagem de mapas', async () => {
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Biblioteca de Mapas')).toBeInTheDocument(),
    );
    expect(screen.getByText('Ascensão Carmesim')).toBeInTheDocument();
    expect(screen.getByText('2 mapas')).toBeInTheDocument();
  });

  it('filtra por busca e favoritos sem emitir o warning de inputProps no DOM', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );

    const buscaInput = screen.getByLabelText('Buscar mapa');
    await user.type(buscaInput, 'tesouro');
    expect(screen.getByText('Masmorra Antiga')).toBeInTheDocument();
    expect(screen.queryByText('Mapa da Cidade')).not.toBeInTheDocument();

    await user.clear(buscaInput);
    const favoritosToggle = screen.getByLabelText('Mostrar apenas favoritos');
    await user.click(favoritosToggle);
    expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument();
    expect(screen.queryByText('Masmorra Antiga')).not.toBeInTheDocument();
    expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain('inputProps');

    consoleErrorSpy.mockRestore();
  });

  it('oculta a seção de mapas sem pasta quando todos os mapas já estão em pastas', async () => {
    const mapasOrganizados = [
      { ...MAPAS_MOCK[0], id: 'mapa1', pastaId: 'pasta1' },
      { ...MAPAS_MOCK[1], id: 'mapa2', pastaId: 'pasta1' },
    ];
    getRmMapasPorCampanha.mockResolvedValue(mapasOrganizados);
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Entrada das Raízes')).toBeInTheDocument(),
    );

    expect(screen.queryByText('Mapas sem pasta')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum mapa criado')).not.toBeInTheDocument();
    expect(screen.getAllByText('2 mapas').length).toBeGreaterThan(0);
  });

  it('mostra a mensagem geral da biblioteca vazia quando não há mapas nem pastas', async () => {
    getRmMapasPorCampanha.mockResolvedValue([]);
    getRmMapasPastasPorCampanha.mockResolvedValue([]);
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Sua biblioteca de mapas está vazia.')).toBeInTheDocument(),
    );

    expect(screen.queryByText('Mapas sem pasta')).not.toBeInTheDocument();
    expect(screen.queryByText('Nenhum mapa criado')).not.toBeInTheDocument();
  });

  it('mostra mensagem de busca vazia quando a pesquisa não encontra resultados', async () => {
    const user = userEvent.setup();
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );

    const buscaInput = screen.getByLabelText('Buscar mapa');
    await user.type(buscaInput, 'termo-que-nao-existe');

    expect(screen.getByText('Nenhum mapa encontrado para essa busca.')).toBeInTheDocument();
    expect(screen.queryByText('Sua biblioteca de mapas está vazia.')).not.toBeInTheDocument();
  });

  it('reseta o formulário ao abrir um novo mapa depois de editar outro mapa', async () => {
    const user = userEvent.setup();
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );

    await user.click(screen.getByLabelText('Editar mapa Mapa da Cidade'));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

    const nomeInput = screen.getByLabelText('Nome');
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Mapa alterado');

    await user.click(screen.getByRole('button', { name: /fechar modal de mapa/i }));
    await user.click(screen.getByRole('button', { name: /descartar alterações/i }));

    const [novoMapaButton] = screen.getAllByRole('button', { name: /novo mapa/i });
    await user.click(novoMapaButton);

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    expect(screen.getByLabelText('Nome')).toHaveValue('');
  });

  it('cria uma nova pasta usando o modal', async () => {
    const user = userEvent.setup();
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Biblioteca de Mapas')).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /nova pasta/i }));
    await user.type(screen.getByLabelText('Nome da pasta'), 'Ponte dos Esquecidos');
    await user.type(screen.getByLabelText('Descrição'), 'Caminho do antigo abrigo.');
    await user.click(screen.getByRole('button', { name: /salvar pasta/i }));

    await waitFor(() => expect(addRmMapaPasta).toHaveBeenCalled());
  });

  it('abre o menu de contexto no clique direito e move o mapa para uma pasta', async () => {
    const user = userEvent.setup();
    const mapasMovimento = [
      { ...MAPAS_MOCK[0], id: 'mapa1', pastaId: null },
      { ...MAPAS_MOCK[1], id: 'mapa2', pastaId: null },
    ];
    getRmMapasPorCampanha.mockResolvedValue(mapasMovimento);
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );

    fireEvent.contextMenu(screen.getByText('Mapa da Cidade'));
    expect(screen.getByText('Ações do Mapa')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mover para Pasta/i }));
    expect(screen.getByText('Mover mapa para pasta')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Entrada das Raízes/i }));
    await user.click(screen.getByRole('button', { name: /Mover Mapa/i }));

    await waitFor(() =>
      expect(updateRmMapa).toHaveBeenCalledWith('mapa1', { pastaId: 'pasta1' }),
    );
    expect(notifySuccess).toHaveBeenCalled();
  });

  it('mostra o estado vazio quando não há mapas nem pastas', async () => {
    getRmMapasPorCampanha.mockResolvedValue([]);
    getRmMapasPastasPorCampanha.mockResolvedValue([]);
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Sua biblioteca de mapas está vazia.')).toBeInTheDocument(),
    );
  });

  it('remove um mapa', async () => {
    removeRmMapa.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText('Remover mapa Mapa da Cidade'));

    await waitFor(() => expect(removeRmMapa).toHaveBeenCalledWith('mapa1'));
  });

  it('não mostra ações de criar/editar/remover quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderMapas();

    await waitFor(() =>
      expect(screen.getByText('Mapa da Cidade')).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('Editar mapa Mapa da Cidade'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '+ Novo Mapa' }),
    ).not.toBeInTheDocument();
  });
});
