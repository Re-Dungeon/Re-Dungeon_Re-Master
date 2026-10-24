import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ChatSala from './ChatSala';

const getRmMusicasBibliotecaPorMestre = vi.fn();
const getRmMusicasPastasPorMestre = vi.fn();
const getRmPlaylistsPorMestre = vi.fn();

vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

vi.mock('service/storage', () => ({
  getRmMusicasBibliotecaPorMestre: (...args) => getRmMusicasBibliotecaPorMestre(...args),
  getRmMusicasPastasPorMestre: (...args) => getRmMusicasPastasPorMestre(...args),
  getRmPlaylistsPorMestre: (...args) => getRmPlaylistsPorMestre(...args),
}));

const audioFalso = sobrescrever => ({
  tocando: true,
  pausado: false,
  repetir: true,
  titulo: 'Taverna ambiente',
  bloqueado: false,
  erroPlayer: null,
  podeControlar: false,
  volume: 50,
  mudo: false,
  setVolume: vi.fn(),
  setMudo: vi.fn(),
  liberarSom: vi.fn(),
  tocar: vi.fn(),
  pausar: vi.fn(),
  retomar: vi.fn(),
  parar: vi.fn(),
  setRepetir: vi.fn(),
  ...sobrescrever,
});

const renderSala = audio =>
  render(
    <ChatSala
      mensagens={[]}
      currentUid="u1"
      onEnviarTexto={vi.fn()}
      onEnviarImagem={vi.fn()}
      onRolar={vi.fn()}
      onApagar={vi.fn()}
      audio={audio}
    />,
  );

describe('ChatSala — música da mesa', () => {
  beforeEach(() => {
    getRmMusicasBibliotecaPorMestre.mockReset();
    getRmMusicasPastasPorMestre.mockReset();
    getRmPlaylistsPorMestre.mockReset();
    getRmMusicasBibliotecaPorMestre.mockResolvedValue([]);
    getRmMusicasPastasPorMestre.mockResolvedValue([]);
    getRmPlaylistsPorMestre.mockResolvedValue([]);
  });

  it('sem `audio`, não mostra o ícone', () => {
    renderSala(null);
    expect(
      screen.queryByRole('button', { name: 'Música da mesa' }),
    ).not.toBeInTheDocument();
  });

  it('autoplay bloqueado: o aviso libera o som num clique', () => {
    const audio = audioFalso({ bloqueado: true });
    renderSala(audio);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Clique para ouvir a música da mesa',
      }),
    );
    expect(audio.liberarSom).toHaveBeenCalled();
  });

  it('modal mostra o título e o volume muda só para quem ajustou', () => {
    const audio = audioFalso();
    renderSala(audio);
    expect(
      screen.queryByRole('button', {
        name: 'Clique para ouvir a música da mesa',
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Música da mesa' }));
    expect(
      screen.getByRole('status', { name: 'Música tocando' }),
    ).toHaveTextContent('Taverna ambiente');
    fireEvent.keyDown(
      screen.getByRole('slider', { name: 'Volume da música' }),
      {
        key: 'ArrowRight',
      },
    );
    expect(audio.setVolume).toHaveBeenCalledWith(51);
  });

  it('exibe as abas do centro musical com reprodução, biblioteca e playlists', () => {
    const audio = audioFalso();
    renderSala(audio);

    fireEvent.click(screen.getByRole('button', { name: 'Música da mesa' }));

    expect(screen.getByRole('tab', { name: 'Reprodutor' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Biblioteca' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Playlists' })).toBeInTheDocument();
  });

  it('mestre com música tocando: clicar no botão de repetir grava na mesa', () => {
    const audio = audioFalso({ podeControlar: true });
    renderSala(audio);
    fireEvent.click(screen.getByRole('button', { name: 'Música da mesa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desativar repetição' }));
    expect(audio.setRepetir).toHaveBeenCalledWith(false);
  });

  it('mostra navegação por pastas e filtra a biblioteca por pasta', async () => {
    const audio = audioFalso({ podeControlar: true });
    getRmMusicasBibliotecaPorMestre.mockResolvedValue([
      { id: 'm1', nome: 'Tema da Taverna', url: 'https://youtu.be/abc123', pastaId: 'p1', tags: ['ambiental'] },
      { id: 'm2', nome: 'Combate Rápido', url: 'https://youtu.be/def456', pastaId: 'p2', tags: ['luta'] },
    ]);
    getRmMusicasPastasPorMestre.mockResolvedValue([
      { id: 'p1', nome: 'Exploração' },
      { id: 'p2', nome: 'Luta' },
    ]);
    getRmPlaylistsPorMestre.mockResolvedValue([]);

    renderSala(audio);
    fireEvent.click(screen.getByRole('button', { name: 'Música da mesa' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Biblioteca' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Todas as músicas' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Luta' }));

    await waitFor(() => {
      expect(screen.getByText('Combate Rápido')).toBeInTheDocument();
      expect(screen.queryByText('Tema da Taverna')).not.toBeInTheDocument();
    });
  });

  it('exibe a navegação da biblioteca de playlists em lista compacta e com acesso direto à seleção', async () => {
    const audio = audioFalso({ podeControlar: true });
    getRmMusicasBibliotecaPorMestre.mockResolvedValue([
      { id: 'm1', nome: 'Tema da Taverna', url: 'https://youtu.be/abc123', pastaId: 'p1', tags: ['ambiental'] },
      { id: 'm2', nome: 'Combate Rápido', url: 'https://youtu.be/def456', pastaId: 'p2', tags: ['luta'] },
    ]);
    getRmMusicasPastasPorMestre.mockResolvedValue([
      { id: 'p1', nome: 'Exploração' },
      { id: 'p2', nome: 'Luta' },
    ]);
    getRmPlaylistsPorMestre.mockResolvedValue([
      { id: 'pl1', nome: 'Exploração', musicas: [{ musicaId: 'm1' }], descricao: 'Abertura' },
      { id: 'pl2', nome: 'Combate', musicas: [{ musicaId: 'm2' }], descricao: 'Ação' },
    ]);

    renderSala(audio);
    fireEvent.click(screen.getByRole('button', { name: 'Música da mesa' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Playlists' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Todas as playlists' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Combate' })).toBeInTheDocument();
    });
  });
});
