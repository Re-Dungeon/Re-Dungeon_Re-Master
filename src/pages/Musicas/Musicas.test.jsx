import PropTypes from 'prop-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const getRmMusicasBibliotecaPorMestre = vi.fn();
const getRmMusicasPastasPorMestre = vi.fn();
const getRmPlaylistsPorMestre = vi.fn();

vi.mock('service/storage', () => ({
  addRmMusicaBiblioteca: vi.fn(),
  addRmMusicaPasta: vi.fn(),
  addRmPlaylist: vi.fn(),
  getRmMusicasBibliotecaPorMestre: (...args) => getRmMusicasBibliotecaPorMestre(...args),
  getRmMusicasPastasPorMestre: (...args) => getRmMusicasPastasPorMestre(...args),
  getRmPlaylistsPorMestre: (...args) => getRmPlaylistsPorMestre(...args),
  removeRmMusicaBiblioteca: vi.fn(),
  removeRmMusicaPasta: vi.fn(),
  removeRmPlaylist: vi.fn(),
  updateRmMusicaBiblioteca: vi.fn(),
  updateRmMusicaPasta: vi.fn(),
  updateRmPlaylist: vi.fn(),
}));

let authState;
vi.mock('context/AuthContext', () => ({
  useAuth: () => authState,
}));

import Musicas, { PlaylistMusicManager } from './Musicas';

describe('Musicas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = {
      currentUser: { uid: 'mestre-1' },
    };

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([]);
    getRmMusicasPastasPorMestre.mockResolvedValue([]);
    getRmPlaylistsPorMestre.mockResolvedValue([]);
  });

  it('carrega a biblioteca sem emitir warning de inputProps no DOM', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Biblioteca Musical')).toBeInTheDocument();
    });

    expect(consoleErrorSpy.mock.calls.flat().join(' ')).not.toContain('inputProps');
    consoleErrorSpy.mockRestore();
  });

  it('abre o menu de contexto com o clique direito e copia o link correto da música', async () => {
    const clipboardWriteText = vi.fn().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteText },
      configurable: true,
    });

    const musica1 = {
      id: 'm1',
      nome: 'Tema Heroico',
      url: 'https://www.youtube.com/watch?v=abc123XYZ99',
      descricao: 'Descrição da música',
      tags: ['combate', 'boss'],
      pastaId: 'p1',
      mestreId: 'mestre-1',
    };

    const musica2 = {
      id: 'm2',
      nome: 'Tema de Exploração',
      url: 'https://www.youtube.com/watch?v=xyz987abc12',
      descricao: 'Outra música',
      tags: ['exploração'],
      pastaId: 'p2',
      mestreId: 'mestre-1',
    };

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([musica1, musica2]);
    getRmMusicasPastasPorMestre.mockResolvedValue([
      { id: 'p1', nome: 'Luta', mestreId: 'mestre-1' },
      { id: 'p2', nome: 'Exploração', mestreId: 'mestre-1' },
    ]);
    getRmPlaylistsPorMestre.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tema Heroico')).toBeInTheDocument();
    });

    const cardTemaHeroico = screen.getByText('Tema Heroico').closest('.MuiCard-root');
    fireEvent.contextMenu(cardTemaHeroico);

    await screen.findByRole('menu', { name: /menu de contexto da música tema heroico/i });
    fireEvent.click(screen.getByRole('menuitem', { name: /copiar link do youtube/i }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith(musica1.url);
      expect(screen.getByText('Link do YouTube copiado!')).toBeInTheDocument();
    });

    fireEvent.contextMenu(screen.getByText('Tema de Exploração').closest('.MuiCard-root'));
    const menuExploracao = await screen.findByRole('menu', { name: /menu de contexto da música tema de exploração/i });
    fireEvent.click(within(menuExploracao).getByRole('menuitem', { name: /copiar link do youtube/i }));

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenLastCalledWith(musica2.url);
    });
  });

  it('usa modal personalizado para confirmação de exclusão e não dispara window.confirm', async () => {
    const musica = {
      id: 'm1',
      nome: 'Tema Heroico',
      url: 'https://www.youtube.com/watch?v=abc123XYZ99',
      descricao: 'Descrição da música',
      tags: ['combate', 'boss'],
      pastaId: 'p1',
      mestreId: 'mestre-1',
    };

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([musica]);
    getRmMusicasPastasPorMestre.mockResolvedValue([{ id: 'p1', nome: 'Luta', mestreId: 'mestre-1' }]);
    getRmPlaylistsPorMestre.mockResolvedValue([]);

    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tema Heroico')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /excluir música tema heroico/i }));

    await waitFor(() => {
      expect(screen.getByText('Excluir música')).toBeInTheDocument();
      expect(screen.getAllByText(/tema heroico/i).length).toBeGreaterThan(0);
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('carrega os dados da música ao abrir o modal de edição', async () => {
    const musica = {
      id: 'm1',
      nome: 'Tema Heroico',
      url: 'https://www.youtube.com/watch?v=abc123XYZ99',
      descricao: 'Descrição da música',
      tags: ['combate', 'boss'],
      pastaId: 'p1',
      mestreId: 'mestre-1',
    };

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([musica]);
    getRmMusicasPastasPorMestre.mockResolvedValue([{ id: 'p1', nome: 'Luta', mestreId: 'mestre-1' }]);
    getRmPlaylistsPorMestre.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tema Heroico')).toBeInTheDocument();
    });

    screen.getByRole('button', { name: /editar música tema heroico/i }).click();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Tema Heroico')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://www.youtube.com/watch?v=abc123XYZ99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Descrição da música')).toBeInTheDocument();
      expect(screen.getByDisplayValue('combate, boss')).toBeInTheDocument();
    });
  });

  it('renderiza a aba de playlists com dados da biblioteca', async () => {
    const playlist = {
      id: 'p-list',
      nome: 'Playlist de combate',
      descricao: 'Músicas do encontro final',
      mestreId: 'mestre-1',
      musicas: [{ musicaId: 'm1', ordem: 0 }],
    };

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([
      {
        id: 'm1',
        nome: 'Tema Heroico',
        url: 'https://www.youtube.com/watch?v=abc123XYZ99',
        tags: ['combate'],
        mestreId: 'mestre-1',
      },
    ]);
    getRmMusicasPastasPorMestre.mockResolvedValue([]);
    getRmPlaylistsPorMestre.mockResolvedValue([playlist]);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tema Heroico')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /playlists/i }));

    await waitFor(() => {
      expect(screen.getByText('Playlist de combate')).toBeInTheDocument();
      expect(screen.getByText('1 músicas')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /gerenciar playlist playlist de combate/i })).toBeInTheDocument();
    });
  });

  it('exibe busca, filtro e botão de criação na aba playlists e filtra resultados em conjunto', async () => {
    const playlists = [
      { id: 'p1', nome: 'Combate Final', descricao: 'Aberturas para encontro final', mestreId: 'mestre-1', musicas: [{ musicaId: 'm1', ordem: 0 }] },
      { id: 'p2', nome: 'Exploração', descricao: 'Trilhas leves', mestreId: 'mestre-1', musicas: [{ musicaId: 'm2', ordem: 0 }] },
    ];

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([
      { id: 'm1', nome: 'Tema Heroico', url: 'https://www.youtube.com/watch?v=abc123XYZ99', tags: ['combate'], mestreId: 'mestre-1' },
      { id: 'm2', nome: 'Trilha Leve', url: 'https://www.youtube.com/watch?v=def456UVW88', tags: ['exploracao'], mestreId: 'mestre-1' },
    ]);
    getRmMusicasPastasPorMestre.mockResolvedValue([]);
    getRmPlaylistsPorMestre.mockResolvedValue(playlists);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^playlists$/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar playlist/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /nova playlist/i })).toBeInTheDocument();
      expect(screen.getByText('Combate Final')).toBeInTheDocument();
      expect(screen.getByText('Exploração')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/buscar playlist/i), { target: { value: 'final' } });
    expect(screen.getByRole('button', { name: /gerenciar playlist combate final/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /gerenciar playlist exploração/i })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/buscar playlist/i), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText(/buscar playlist/i), { target: { value: '' } });
    fireEvent.mouseDown(screen.getByLabelText(/filtrar playlists/i));
    fireEvent.click(screen.getByRole('option', { name: /exploração/i }));
    expect(screen.queryByRole('button', { name: /gerenciar playlist combate final/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gerenciar playlist exploração/i })).toBeInTheDocument();
  });

  it('abrir o select de pasta mostra busca embutida e mantém a lista compacta', async () => {
    const pastas = [
      { id: 'p1', nome: 'Combate' },
      { id: 'p2', nome: 'Exploração' },
      { id: 'p3', nome: 'Boss' },
      { id: 'p4', nome: 'Loja' },
      { id: 'p5', nome: 'Luta' },
      { id: 'p6', nome: 'Narrativa' },
    ];

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([]);
    getRmMusicasPastasPorMestre.mockResolvedValue(pastas);
    getRmPlaylistsPorMestre.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /adicionar música/i }));

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /^Pasta$/i })).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /^Pasta$/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/buscar pasta/i)).toBeInTheDocument();
    });
  });

  it('usa um link de imagem customizado para a capa da playlist e expõe o campo no modal de edição', async () => {
    const playlist = {
      id: 'p-list-link',
      nome: 'Playlist com capa',
      descricao: 'Músicas do encontro final',
      linkImagem: 'https://exemplo.com/playlist-capa.jpg',
      mestreId: 'mestre-1',
      musicas: [{ musicaId: 'm1', ordem: 0 }],
    };

    getRmMusicasBibliotecaPorMestre.mockResolvedValue([
      {
        id: 'm1',
        nome: 'Tema Heroico',
        url: 'https://www.youtube.com/watch?v=abc123XYZ99',
        tags: ['combate'],
        mestreId: 'mestre-1',
      },
    ]);
    getRmMusicasPastasPorMestre.mockResolvedValue([]);
    getRmPlaylistsPorMestre.mockResolvedValue([playlist]);

    render(
      <MemoryRouter>
        <Musicas />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /playlists/i }));

    await waitFor(() => {
      expect(screen.getByText('Playlist com capa')).toBeInTheDocument();
    });

    const capaPlaylist = screen.getByAltText('Playlist com capa');
    expect(capaPlaylist).toHaveAttribute('src', 'https://exemplo.com/playlist-capa.jpg');

    fireEvent.click(screen.getByRole('button', { name: /editar playlist playlist com capa/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/link da imagem/i)).toHaveValue('https://exemplo.com/playlist-capa.jpg');
    });
  });

  it('ativa rolagem da lista apenas quando a playlist tem mais de 6 músicas', () => {
    const musicas = Array.from({ length: 7 }, (_, index) => ({
      id: `m${index + 1}`,
      nome: `Música ${index + 1}`,
      url: 'https://www.youtube.com/watch?v=abc123XYZ99',
      descricao: `Descrição ${index + 1}`,
    }));

    const PlaylistHarness = ({ playlist, items }) => (
      <PlaylistMusicManager
        key={['playlist-manager', playlist.id, items.map(item => item.id).join(','), 'open'].join('-')}
        open
        onClose={() => {}}
        playlist={playlist}
        musicas={items}
        onSave={() => {}}
      />
    );

    PlaylistHarness.propTypes = {
      playlist: PropTypes.shape({
        id: PropTypes.string.isRequired,
        nome: PropTypes.string,
        musicas: PropTypes.arrayOf(
          PropTypes.shape({
            musicaId: PropTypes.string,
            ordem: PropTypes.number,
          }),
        ),
      }).isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          nome: PropTypes.string,
        }),
      ).isRequired,
    };

    const { rerender } = render(
      <PlaylistHarness
        playlist={{
          id: 'playlist-1',
          nome: 'Playlist grande',
          musicas: musicas.map((musica, index) => ({ musicaId: musica.id, ordem: index })),
        }}
        items={musicas}
      />,
    );

    expect(screen.getByTestId('playlist-music-list')).toHaveAttribute('data-scrollable', 'true');

    rerender(
      <PlaylistHarness
        playlist={{
          id: 'playlist-1',
          nome: 'Playlist pequena',
          musicas: musicas.slice(0, 6).map((musica, index) => ({ musicaId: musica.id, ordem: index })),
        }}
        items={musicas.slice(0, 6)}
      />,
    );

    expect(screen.getByTestId('playlist-music-list')).toHaveAttribute('data-scrollable', 'false');
  });

  it('reidrata a lista de músicas quando a playlist recebida pelo modal muda', () => {
    const musicas = [
      { id: 'm1', nome: 'Tema Heroico', url: 'https://www.youtube.com/watch?v=abc123XYZ99', descricao: 'Intro' },
      { id: 'm2', nome: 'Boss Fight', url: 'https://www.youtube.com/watch?v=def456UVW88', descricao: 'Luta' },
    ];

    const PlaylistHarness = ({ playlist }) => (
      <PlaylistMusicManager
        key={['playlist-manager', playlist.id, playlist.musicas.map(item => item.musicaId).join(','), 'open'].join('-')}
        open
        onClose={() => {}}
        playlist={playlist}
        musicas={musicas}
        onSave={() => {}}
      />
    );

    PlaylistHarness.propTypes = {
      playlist: PropTypes.shape({
        id: PropTypes.string.isRequired,
        nome: PropTypes.string,
        musicas: PropTypes.arrayOf(
          PropTypes.shape({
            musicaId: PropTypes.string,
          }),
        ).isRequired,
      }).isRequired,
    };

    const { rerender } = render(
      <PlaylistHarness playlist={{ id: 'playlist-1', nome: 'Playlist', musicas: [{ musicaId: 'm1', ordem: 0 }] }} />,
    );

    expect(screen.getByText('Tema Heroico')).toBeInTheDocument();
    expect(screen.queryByText('Boss Fight')).not.toBeInTheDocument();

    rerender(
      <PlaylistHarness playlist={{ id: 'playlist-1', nome: 'Playlist', musicas: [{ musicaId: 'm2', ordem: 0 }, { musicaId: 'm1', ordem: 1 }] }} />,
    );

    expect(screen.getByText('Boss Fight')).toBeInTheDocument();
    expect(screen.getByText('Tema Heroico')).toBeInTheDocument();
  });
});
