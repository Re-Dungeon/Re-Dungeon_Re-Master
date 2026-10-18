import { describe, expect, it } from 'vitest';

import {
  AUDIO_ESTADOS,
  audioTerminou,
  extrairVideoYoutube,
  mensagemErroYoutube,
  montarAudioPausado,
  montarAudioRepetir,
  montarAudioRetomado,
  montarAudioTocar,
  posicaoAtual,
} from './audioMesa';

const ID = 'dQw4w9WgXcQ';

describe('extrairVideoYoutube', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`, 0],
    [`https://youtube.com/watch?v=${ID}&list=PL123&index=2`, 0],
    [`https://m.youtube.com/watch?v=${ID}&t=90`, 90],
    [`https://youtu.be/${ID}?t=1m30s`, 90],
    [`https://www.youtube.com/shorts/${ID}`, 0],
    [`https://www.youtube.com/embed/${ID}?start=12`, 12],
    [`https://www.youtube.com/live/${ID}`, 0],
    [`https://music.youtube.com/watch?v=${ID}&t=1h0m5s`, 3605],
  ])('%s', (link, inicio) => {
    expect(extrairVideoYoutube(link)).toEqual({ videoId: ID, inicio });
  });

  it.each([
    'não é link',
    'https://vimeo.com/123',
    'https://www.youtube.com/playlist?list=PL123',
    'https://www.youtube.com/watch?v=curto',
    `javascript:alert('${ID}')`,
    null,
  ])('recusa %s', link => {
    expect(extrairVideoYoutube(link)).toBeNull();
  });

  it('tempo inválido vira 0', () => {
    expect(extrairVideoYoutube(`https://youtu.be/${ID}?t=abc`).inicio).toBe(0);
  });
});

describe('posição sincronizada', () => {
  const tocando = {
    videoId: ID,
    estado: AUDIO_ESTADOS.TOCANDO,
    posicaoBase: 10,
    repetir: true,
    referenciaEm: 1_000_000,
  };

  it('soma o tempo desde a referência enquanto toca', () => {
    expect(posicaoAtual(tocando, 1_030_000)).toBe(40);
  });

  it('pausada fica parada na base', () => {
    expect(
      posicaoAtual({ ...tocando, estado: AUDIO_ESTADOS.PAUSADO }, 1_030_000),
    ).toBe(10);
  });

  it('com repetir dá a volta; sem repetir para no fim', () => {
    expect(posicaoAtual(tocando, 1_100_000, 60)).toBe(50); // 110 % 60
    expect(posicaoAtual({ ...tocando, repetir: false }, 1_100_000, 60)).toBe(
      60,
    );
    expect(audioTerminou({ ...tocando, repetir: false }, 1_100_000, 60)).toBe(
      true,
    );
    expect(audioTerminou(tocando, 1_100_000, 60)).toBe(false);
  });

  it('sem faixa → 0; relógio adiantado não volta no tempo', () => {
    expect(posicaoAtual({ videoId: null }, 5)).toBe(0);
    expect(posicaoAtual(tocando, 900_000)).toBe(10);
  });
});

describe('payloads do mestre', () => {
  const tocando = {
    videoId: ID,
    estado: AUDIO_ESTADOS.TOCANDO,
    posicaoBase: 0,
    repetir: true,
    referenciaEm: 0,
  };

  it('tocar começa no início do link', () => {
    expect(montarAudioTocar({ videoId: ID, inicio: 90 }, false)).toEqual({
      videoId: ID,
      estado: 'tocando',
      posicaoBase: 90,
      repetir: false,
    });
  });

  it('pausar guarda a posição atual; retomar continua dela', () => {
    const pausado = montarAudioPausado(tocando, 42_500, 0);
    expect(pausado).toEqual({
      videoId: ID,
      estado: 'pausado',
      posicaoBase: 42.5,
      repetir: true,
    });
    expect(
      montarAudioRetomado({ ...pausado, referenciaEm: 50_000 }, 99_000, 0),
    ).toEqual({
      ...pausado,
      estado: 'tocando',
    });
  });

  it('mudar o repetir não pula a música', () => {
    expect(montarAudioRepetir(tocando, 20_000, 0, false)).toEqual({
      videoId: ID,
      estado: 'tocando',
      posicaoBase: 20,
      repetir: false,
    });
  });
});

describe('mensagemErroYoutube', () => {
  it('traduz os códigos do player', () => {
    expect(mensagemErroYoutube(150)).toMatch(/fora do YouTube/);
    expect(mensagemErroYoutube(100)).toMatch(/não encontrado/);
    expect(mensagemErroYoutube(5)).toMatch(/não conseguiu/);
  });
});
