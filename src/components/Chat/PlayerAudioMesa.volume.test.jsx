import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';

import { AUDIO_ESTADOS } from 'common/utils/audioMesa';
import PlayerAudioMesa from './PlayerAudioMesa';

// Player do YouTube falso: guarda os eventos para o teste disparar
// onReady/onStateChange e espiona setVolume/mute.
let eventos = null;
let player = null;

vi.mock('common/utils/youtubeApi', () => ({
  carregarApiYoutube: () =>
    Promise.resolve({
      Player: function Player(_alvo, opcoes) {
        eventos = opcoes.events;
        player = {
          setVolume: vi.fn(),
          mute: vi.fn(),
          unMute: vi.fn(),
          isMuted: vi.fn(() => false),
          loadVideoById: vi.fn(),
          cueVideoById: vi.fn(),
          playVideo: vi.fn(),
          pauseVideo: vi.fn(),
          stopVideo: vi.fn(),
          seekTo: vi.fn(),
          destroy: vi.fn(),
          getVideoData: vi.fn(() => ({ video_id: 'dQw4w9WgXcQ', title: 'Faixa' })),
          getDuration: vi.fn(() => 200),
          getCurrentTime: vi.fn(() => 0),
          getPlayerState: vi.fn(() => 1),
        };
        return player;
      },
    }),
}));

const ATUAL = {
  videoId: 'dQw4w9WgXcQ',
  estado: AUDIO_ESTADOS.PAUSADO,
  posicaoBase: 0,
  referenciaEm: 0,
  repetir: true,
};

const renderPlayer = props =>
  render(
    <PlayerAudioMesa
      atual={ATUAL}
      volume={10}
      mudo={false}
      controleRef={{ current: null }}
      onStatus={vi.fn()}
      {...props}
    />,
  );

describe('PlayerAudioMesa — volume', () => {
  beforeEach(() => {
    eventos = null;
    player = null;
  });

  it('aplica o volume pela curva e reaplica quando a faixa carrega e começa a tocar', async () => {
    renderPlayer();
    await waitFor(() => expect(eventos).not.toBeNull());
    act(() => eventos.onReady());
    // slider 10% → 1 no YouTube (não 10).
    expect(player.setVolume).toHaveBeenCalledWith(1);
    expect(player.setVolume).not.toHaveBeenCalledWith(10);

    player.setVolume.mockClear();
    act(() => eventos.onStateChange({ data: 5 })); // PREPARADO
    expect(player.setVolume).toHaveBeenCalledWith(1);

    player.setVolume.mockClear();
    act(() => eventos.onStateChange({ data: 1 })); // TOCANDO
    expect(player.setVolume).toHaveBeenCalledWith(1);
  });

  it('mudo continua mudo ao reaplicar', async () => {
    renderPlayer({ mudo: true });
    await waitFor(() => expect(eventos).not.toBeNull());
    act(() => eventos.onReady());
    player.mute.mockClear();
    act(() => eventos.onStateChange({ data: 1 }));
    expect(player.mute).toHaveBeenCalled();
  });
});
