import { describe, it, expect } from 'vitest';
import {
  formatDuracao,
  parseDuracaoParaSegundos,
  tickTimer,
} from './sessionTimersUtils';

describe('formatDuracao', () => {
  it('formata segundos como MM:SS abaixo de uma hora', () => {
    expect(formatDuracao(0)).toBe('00:00');
    expect(formatDuracao(65)).toBe('01:05');
    expect(formatDuracao(3599)).toBe('59:59');
  });

  it('formata como H:MM:SS a partir de uma hora', () => {
    expect(formatDuracao(3600)).toBe('1:00:00');
    expect(formatDuracao(3725)).toBe('1:02:05');
  });

  it('trata valores negativos como 0', () => {
    expect(formatDuracao(-10)).toBe('00:00');
  });
});

describe('parseDuracaoParaSegundos', () => {
  it('converte minutos e segundos separados para o total em segundos', () => {
    expect(parseDuracaoParaSegundos('3', '30')).toBe(210);
  });

  it('trata campos vazios/inválidos/negativos como 0', () => {
    expect(parseDuracaoParaSegundos('', '')).toBe(0);
    expect(parseDuracaoParaSegundos('abc', '10')).toBe(10);
    expect(parseDuracaoParaSegundos('-5', '10')).toBe(10);
  });
});

describe('tickTimer', () => {
  it('não altera um temporizador pausado', () => {
    const timer = { restanteSegundos: 10, running: false };
    expect(tickTimer(timer)).toBe(timer);
  });

  it('decrementa um temporizador rodando', () => {
    const timer = { restanteSegundos: 10, running: true };
    expect(tickTimer(timer)).toEqual({ restanteSegundos: 9, running: true });
  });

  it('para em 0 e marca esgotado ao chegar no fim, sem ir negativo', () => {
    const timer = { restanteSegundos: 1, running: true };
    expect(tickTimer(timer)).toEqual({
      restanteSegundos: 0,
      running: false,
      esgotado: true,
    });
  });
});
