import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import FaixaIniciativa from './FaixaIniciativa';

// Celular: o jsdom não aplica media query, então a consulta é simulada.
const mocks = vi.hoisted(() => ({ celular: true }));
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => mocks.celular }));

const FAIXA = {
  rodada: 1,
  itens: [
    { tokenId: 't1', nome: 'Wesley Chase', tipo: 'jogador', atual: true, iniciativa: 18 },
    { tokenId: 't2', nome: 'Goblin', tipo: 'npc', atual: false, iniciativa: 12 },
  ],
  vezDoMestre: false,
};

describe('FaixaIniciativa — nome do retrato', () => {
  beforeEach(() => {
    mocks.celular = true;
    vi.useRealTimers();
  });

  it('no celular, tocar no retrato centraliza e mostra o nome por alguns segundos', () => {
    vi.useFakeTimers();
    const onCentralizar = vi.fn();
    render(<FaixaIniciativa faixa={FAIXA} acoes={{}} onCentralizar={onCentralizar} />);
    const retrato = screen.getByRole('button', { name: 'Centralizar em Goblin' });
    expect(retrato).not.toHaveAttribute('title');
    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.click(retrato);
    expect(onCentralizar).toHaveBeenCalledWith('t2');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Goblin');

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.queryByRole('tooltip')).toBeNull();
    vi.useRealTimers();
  });

  it('no desktop o nome continua no atributo title', () => {
    mocks.celular = false;
    render(<FaixaIniciativa faixa={FAIXA} acoes={{}} onCentralizar={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Centralizar em Goblin' })).toHaveAttribute(
      'title',
      'Goblin',
    );
  });
});

const FAIXA_DERROTADO = {
  rodada: 2,
  vezDoMestre: false,
  itens: [
    {
      tokenId: 'a',
      nome: 'Aldric',
      tipo: 'jogador',
      oculto: false,
      derrotado: false,
      atual: true,
      iniciativa: 18,
    },
    {
      tokenId: 'g',
      nome: 'Goblin',
      tipo: 'criatura',
      oculto: false,
      derrotado: true,
      atual: false,
      iniciativa: 9,
    },
  ],
};

describe('FaixaIniciativa — derrotado', () => {
  beforeEach(() => {
    mocks.celular = false;
  });

  it('NPC/Criatura derrotado aparece apagado (cinza e translúcido)', () => {
    render(<FaixaIniciativa faixa={FAIXA_DERROTADO} acoes={{}} onCentralizar={vi.fn()} />);
    const retrato = id => document.querySelector(`[data-retrato="${id}"]`);
    const apagado = getComputedStyle(retrato('g').firstElementChild);
    const normal = getComputedStyle(retrato('a').firstElementChild);
    expect(apagado.filter).toBe('grayscale(1)');
    expect(Number(apagado.opacity)).toBeLessThan(1);
    expect(normal.filter).not.toBe('grayscale(1)');
    expect(Number(normal.opacity)).toBe(1);
    // Continua clicável para centralizar o mapa nele.
    expect(screen.getByRole('button', { name: 'Centralizar em Goblin' })).toBeEnabled();
  });
});
