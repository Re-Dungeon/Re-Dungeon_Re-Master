import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SnackbarProvider } from 'context/SnackbarContext';

const addRmNota = vi.fn();
const updateRmNota = vi.fn();
const getRmCenas = vi.fn(() => Promise.resolve([]));
const getRmNotasPorCampanha = vi.fn(() => Promise.resolve([]));
vi.mock('service/storage', () => ({
  addRmNota: (...args) => addRmNota(...args),
  updateRmNota: (...args) => updateRmNota(...args),
  getRmCenas: (...args) => getRmCenas(...args),
  getRmNotasPorCampanha: (...args) => getRmNotasPorCampanha(...args),
}));

const CURRENT_USER_UID = 'mestre-1';
let authState;
vi.mock('context/AuthContext', () => ({
  useAuth: () => authState,
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: CURRENT_USER_UID,
};
let campanhaAtiva = CAMPANHA_ATIVA;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva, loadingCampanhas: false }),
}));

import NovaNota from './NovaNota';
import { renderNotaContentHtml } from './notaUtils';

const renderNova = state =>
  render(
    <SnackbarProvider>
      <MemoryRouter initialEntries={[{ pathname: '/notas/nova', state }]}>
        <Routes>
          <Route path="/notas/nova" element={<NovaNota />} />
        </Routes>
      </MemoryRouter>
    </SnackbarProvider>,
  );

describe('NovaNota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      currentUser: { uid: CURRENT_USER_UID },
      isAdmin: false,
      loadingPermissions: false,
    };
    campanhaAtiva = CAMPANHA_ATIVA;
    getRmCenas.mockResolvedValue([]);
  });

  it('mostra "Nova Nota" com o nome da campanha ativa', async () => {
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.getByText('Nova Nota')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Nova nota em Ascensão Carmesim'),
    ).toBeInTheDocument();
  });

  it('cria uma nota com campanhaId/universoId/mestreId derivados da campanha ativa', async () => {
    addRmNota.mockResolvedValue({ id: 'nova-nota' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Título'));
    await user.type(
      screen.getByLabelText('Título'),
      'Ideia para a próxima sessão',
    );
    await user.type(
      screen.getByLabelText('Conteúdo'),
      'O vilão pode aparecer na taverna.',
    );
    await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

    await waitFor(() =>
      expect(addRmNota).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Ideia para a próxima sessão',
          conteudo: 'O vilão pode aparecer na taverna.',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'mestre-1',
        }),
      ),
    );
  });

  it('salva tipo, resumo e imagem ao criar uma entidade do universo', async () => {
    addRmNota.mockResolvedValue({ id: 'nova-nota' });
    const user = userEvent.setup();
    renderNova(undefined);

    await waitFor(() => screen.getByLabelText('Título'));
    await user.type(screen.getByLabelText('Título'), 'Vila das Chamas');
    await user.type(screen.getByLabelText('Resumo'), 'Portal antigo guardado pelos clérigos.');
    await user.type(screen.getByLabelText('URL da imagem'), 'https://example.com/capa.jpg');
    await user.clear(screen.getByLabelText('Conteúdo'));
    await user.type(screen.getByLabelText('Conteúdo'), 'A vila foi fundada...');
    await user.click(screen.getByRole('button', { name: 'Salvar Nota' }));

    await waitFor(() =>
      expect(addRmNota).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Vila das Chamas',
          resumo: 'Portal antigo guardado pelos clérigos.',
          imagemUrl: 'https://example.com/capa.jpg',
          tipo: 'Local',
        }),
      ),
    );
  });

  it('mostra o seletor de cena quando a campanha tem cenas cadastradas', async () => {
    getRmCenas.mockResolvedValue([
      { id: 'cena1', campanhaId: 'c1', titulo: 'Chegada na Cidade' },
    ]);
    renderNova(undefined);

    await waitFor(() =>
      expect(
        screen.getByLabelText('Vincular a uma Cena (opcional)'),
      ).toBeInTheDocument(),
    );
  });

  it('abre um modal próprio para inserir link sem usar prompt do navegador', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null);
    renderNova(undefined);

    const campoConteudo = await screen.findByLabelText('Conteúdo');
    await user.clear(campoConteudo);
    await user.type(campoConteudo, 'Texto inicial');
    campoConteudo.setSelectionRange(0, 5);
    await user.click(screen.getByRole('button', { name: 'Inserir link' }));

    expect(promptSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Inserir link' })).toBeInTheDocument();
    expect(screen.getByLabelText('Texto')).toHaveValue('Texto');
    expect(screen.getByLabelText('URL')).toBeInTheDocument();
  });

  it('insere link real e não sintaxe markdown no conteúdo', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    const campoConteudo = await screen.findByLabelText('Conteúdo');
    await user.clear(campoConteudo);
    await user.type(campoConteudo, 'Google');
    campoConteudo.setSelectionRange(0, 6);
    await user.click(screen.getByRole('button', { name: 'Inserir link' }));
    await user.clear(screen.getByLabelText('URL'));
    await user.type(screen.getByLabelText('URL'), 'https://google.com');
    await user.click(screen.getByRole('button', { name: 'Inserir link' }));

    await waitFor(() =>
      expect(campoConteudo.value).toContain('<a href="https://google.com"'),
    );
    expect(campoConteudo.value).not.toContain('[Google](https://google.com)');
  });

  it('insere imagem real e linha horizontal sem sintaxe markdown', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    const campoConteudo = await screen.findByLabelText('Conteúdo');
    await user.clear(campoConteudo);
    await user.click(screen.getByRole('button', { name: 'Inserir imagem' }));

    const dialogImagem = await screen.findByRole('dialog', { name: 'Inserir imagem' });
    const campoImagemUrl = await within(dialogImagem).findByLabelText('URL da imagem');
    await user.clear(campoImagemUrl);
    await user.type(campoImagemUrl, 'https://exemplo.com/imagem.jpg');
    await user.click(within(dialogImagem).getByRole('button', { name: 'Inserir imagem' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Inserir imagem' })).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(campoConteudo.value).toContain('<img'),
    );
    expect(campoConteudo.value).not.toContain('![Imagem](');

    await user.click(screen.getByRole('button', { name: 'Linha horizontal' }));
    await waitFor(() =>
      expect(campoConteudo.value).toContain('<hr'),
    );
    expect(campoConteudo.value).not.toContain('---');
  });

  it('remove os títulos de grupo da toolbar e expõe alinhamento em ícones com tooltips em português', async () => {
    renderNova(undefined);

    await screen.findByLabelText('Conteúdo');

    expect(screen.queryByText('Texto')).not.toBeInTheDocument();
    expect(screen.queryByText('Inserção')).not.toBeInTheDocument();
    expect(screen.queryByText('Layout')).not.toBeInTheDocument();
    expect(screen.queryByText('Aparência')).not.toBeInTheDocument();
    expect(screen.queryByText('Histórico')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Alinhar à esquerda' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Centralizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alinhar à direita' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Justificar' })).toBeInTheDocument();
  });

  it('preserva o alinhamento real do parágrafo no conteúdo salvo e na renderização final', () => {
    const html = renderNotaContentHtml('<p style="text-align:center;">Parágrafo centralizado</p>');

    expect(html).toContain('text-align:center');
    expect(html).toContain('Parágrafo centralizado');
  });

  it('preserva alinhamento centralizado de imagem, vídeo e link em blocos independentes', () => {
    const imagemHtml = renderNotaContentHtml('<div style="text-align:center;"><img src="https://example.com/imagem.jpg" alt="Exemplo" /></div>');
    const videoHtml = renderNotaContentHtml('<div style="text-align:center;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vídeo" allowfullscreen></iframe></div>');
    const linkHtml = renderNotaContentHtml('<div style="text-align:center;"><a href="https://example.com" target="_blank" rel="noopener noreferrer">Link centralizado</a></div>');

    expect(imagemHtml).toContain('text-align:center');
    expect(imagemHtml).toContain('<img');
    expect(videoHtml).toContain('text-align:center');
    expect(videoHtml).toContain('youtube-nocookie.com/embed');
    expect(videoHtml).not.toContain('youtube.com/embed');
    expect(videoHtml).toContain('<iframe');
    expect(linkHtml).toContain('text-align:center');
    expect(linkHtml).toContain('https://example.com');
  });

  it('preserva o alinhamento de links em parágrafo sem perder o destino do link', () => {
    const html = renderNotaContentHtml('<p style="text-align:right;"><a href="https://example.com/portal" target="_blank" rel="noopener noreferrer">Portal</a></p>');

    expect(html).toContain('text-align:right');
    expect(html).toContain('href="https://example.com/portal"');
    expect(html).toContain('Portal');
  });

  it('centraliza imagem e link independentes através do editor de conteúdo em HTML', async () => {
    const user = userEvent.setup();
    renderNova(undefined);

    const campoConteudo = await screen.findByLabelText('Conteúdo');
    const htmlImagem = '<img src="https://example.com/imagem.jpg" alt="Exemplo" />';
    const htmlLink = '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Portal</a>';

    await user.clear(campoConteudo);
    await user.type(campoConteudo, `${htmlImagem}\n${htmlLink}`);

    const valorInicial = campoConteudo.value;
    const startImagem = valorInicial.indexOf('<img');
    const endImagem = startImagem + htmlImagem.length;
    campoConteudo.setSelectionRange(startImagem, endImagem);
    await user.click(screen.getByRole('button', { name: 'Centralizar' }));

    await waitFor(() => {
      expect(campoConteudo.value).toContain('text-align:center');
      expect(campoConteudo.value).toContain('margin:0 auto');
    });

    const valorDepoisImagem = campoConteudo.value;
    const startLink = valorDepoisImagem.indexOf('<a href="https://example.com');
    const endLink = startLink + htmlLink.length;
    campoConteudo.setSelectionRange(startLink, endLink);
    await user.click(screen.getByRole('button', { name: 'Centralizar' }));

    await waitFor(() => {
      expect(campoConteudo.value).toContain('text-align:center');
      expect(campoConteudo.value).toContain('https://example.com');
    });
  });

  it('mostra "Editar Nota" preenchida e salva via updateRmNota', async () => {
    updateRmNota.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNova({
      nota: {
        id: 'nota1',
        titulo: 'Ideia para a próxima sessão',
        conteudo: '',
      },
    });

    await waitFor(() =>
      expect(screen.getByText('Editar Nota')).toBeInTheDocument(),
    );
    expect(
      screen.getByDisplayValue('Ideia para a próxima sessão'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmNota).toHaveBeenCalledWith(
        'nota1',
        expect.objectContaining({ titulo: 'Ideia para a próxima sessão' }),
      ),
    );
    expect(addRmNota).not.toHaveBeenCalled();
  });

  it('carrega a nota pela rota de edição quando o estado de navegação não existe', async () => {
    updateRmNota.mockResolvedValue(undefined);
    getRmNotasPorCampanha.mockResolvedValue([
      {
        id: 'nota1',
        titulo: 'Ideia recuperada pela rota',
        conteudo: 'Conteúdo antigo',
        resumo: 'Resumo antigo',
        imagemUrl: '',
        tipo: 'Local',
        tags: ['velho'],
        cenaId: null,
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: CURRENT_USER_UID,
      },
    ]);

    const user = userEvent.setup();
    render(
      <SnackbarProvider>
        <MemoryRouter initialEntries={[{ pathname: '/notas/nota1/editar' }]}>
          <Routes>
            <Route path="/notas/:notaId/editar" element={<NovaNota />} />
          </Routes>
        </MemoryRouter>
      </SnackbarProvider>,
    );

    await waitFor(() =>
      expect(screen.getByText('Editar Nota')).toBeInTheDocument(),
    );
    const tituloInput = await screen.findByDisplayValue(
      'Ideia recuperada pela rota',
    );
    expect(tituloInput).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(updateRmNota).toHaveBeenCalledWith(
        'nota1',
        expect.objectContaining({ titulo: 'Ideia recuperada pela rota' }),
      ),
    );
  });

  it('salva o conteúdo atual da nota em edição e mostra estado de salvamento', async () => {
    let resolveUpdate;
    updateRmNota.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveUpdate = resolve;
        }),
    );

    const user = userEvent.setup();
    renderNova({
      nota: {
        id: 'nota1',
        titulo: 'Título antigo',
        conteudo: 'Texto antigo',
        resumo: 'Resumo antigo',
        imagemUrl: '',
        tipo: 'Local',
        tags: 'velho',
        cenaId: null,
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: CURRENT_USER_UID,
      },
    });

    const campoTitulo = await screen.findByLabelText('Título');
    const campoConteudo = await screen.findByLabelText('Conteúdo');

    await user.clear(campoTitulo);
    await user.type(campoTitulo, 'Título novo');
    await user.clear(campoConteudo);
    await user.type(campoConteudo, '<img src="https://example.com/novo.jpg" alt="novo" />');

    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeInTheDocument();

    await waitFor(() =>
      expect(updateRmNota).toHaveBeenCalledWith(
        'nota1',
        expect.objectContaining({
          titulo: 'Título novo',
          conteudo: '<img src="https://example.com/novo.jpg" alt="novo" />',
          resumo: 'Resumo antigo',
          tipo: 'Local',
        }),
      ),
    );

    resolveUpdate();
    await waitFor(() =>
      expect(screen.getByText('✓ Alterações salvas com sucesso')).toBeInTheDocument(),
    );
  });

  it('redireciona para a lista de notas quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderNova(undefined);

    await waitFor(() =>
      expect(screen.queryByText('Nova Nota')).not.toBeInTheDocument(),
    );
  });
});
