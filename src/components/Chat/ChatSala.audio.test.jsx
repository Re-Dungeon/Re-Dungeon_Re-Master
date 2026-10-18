import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ChatSala from './ChatSala';

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

  it('mestre com música tocando: mudar o "Repetir" grava na mesa', () => {
    const audio = audioFalso({ podeControlar: true });
    renderSala(audio);
    fireEvent.click(screen.getByRole('button', { name: 'Música da mesa' }));
    fireEvent.click(screen.getByRole('switch'));
    expect(audio.setRepetir).toHaveBeenCalledWith(false);
  });
});
