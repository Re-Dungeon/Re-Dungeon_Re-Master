import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import FaixaIniciativa from './FaixaIniciativa';

const faixa = {
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

describe('FaixaIniciativa', () => {
  it('NPC/Criatura derrotado aparece apagado (cinza e translúcido)', () => {
    render(<FaixaIniciativa faixa={faixa} acoes={{}} onCentralizar={vi.fn()} />);
    const retrato = id => document.querySelector(`[data-retrato="${id}"]`);
    const apagado = getComputedStyle(retrato('g').firstElementChild);
    const normal = getComputedStyle(retrato('a').firstElementChild);
    expect(apagado.filter).toBe('grayscale(1)');
    expect(Number(apagado.opacity)).toBeLessThan(1);
    expect(normal.filter).not.toBe('grayscale(1)');
    expect(Number(normal.opacity)).toBe(1);
    // Continua clicável para centralizar o mapa nele.
    expect(
      screen.getByRole('button', { name: 'Centralizar em Goblin' }),
    ).toBeEnabled();
  });
});
