import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { GRID_CONFIG_PADRAO } from 'common/utils/grid';
import GridMapa from './GridMapa';

const TOKENS = [
  {
    id: 't1',
    nome: 'Wesley Chase',
    tipo: 'jogador',
    col: 2,
    lin: 3,
    tamanho: 1,
    donos: ['u1'],
    oculto: false,
  },
  {
    id: 't2',
    nome: 'Goblin',
    tipo: 'criatura',
    col: 0,
    lin: 0,
    tamanho: 2,
    donos: [],
    oculto: false,
  },
  {
    id: 't3',
    nome: 'Emboscada',
    tipo: 'criatura',
    col: 5,
    lin: 5,
    tamanho: 1,
    donos: [],
    oculto: true,
  },
];

const podeMoverDoJogador = token => token.donos.includes('u1');

const renderMapa = props =>
  render(
    <GridMapa
      config={GRID_CONFIG_PADRAO}
      tokens={TOKENS}
      podeMover={podeMoverDoJogador}
      onMover={vi.fn()}
      {...props}
    />,
  );

describe('GridMapa', () => {
  it('posiciona os tokens pelas células e mostra os nomes', () => {
    renderMapa();
    const wesley = screen.getByRole('button', {
      name: 'Wesley Chase, coluna 3, linha 4',
    });
    expect(wesley).toHaveStyle({ left: '100px', top: '150px', width: '50px' });
    expect(screen.getByRole('button', { name: /Goblin/ })).toHaveStyle({
      width: '100px',
    });
    expect(
      screen.getByRole('button', { name: /Emboscada.*oculto/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Wesley Chase')).toBeInTheDocument();
  });

  it('setas movem uma célula só os tokens que o usuário pode mover', () => {
    const onMover = vi.fn();
    renderMapa({ onMover });

    fireEvent.keyDown(screen.getByRole('button', { name: /Wesley/ }), {
      key: 'ArrowRight',
    });
    expect(onMover).toHaveBeenCalledWith(TOKENS[0], 3, 3);

    fireEvent.keyDown(screen.getByRole('button', { name: /Goblin/ }), {
      key: 'ArrowRight',
    });
    expect(onMover).toHaveBeenCalledTimes(1);
  });

  it('não deixa o token sair do grid', () => {
    const onMover = vi.fn();
    renderMapa({ onMover, podeMover: () => true });
    fireEvent.keyDown(screen.getByRole('button', { name: /Goblin/ }), {
      key: 'ArrowUp',
    });
    expect(onMover).not.toHaveBeenCalled();
  });

  it('Enter seleciona o token quando há onSelecionar', () => {
    const onSelecionar = vi.fn();
    renderMapa({ onSelecionar, selecionadoId: 't2' });
    expect(screen.getByRole('button', { name: /Goblin/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.keyDown(screen.getByRole('button', { name: /Wesley/ }), {
      key: 'Enter',
    });
    expect(onSelecionar).toHaveBeenCalledWith(TOKENS[0]);
  });

  it('mostra o aviso e os controles de zoom', () => {
    renderMapa({ aviso: 'O mestre ainda não montou o grid desta campanha.' });
    expect(screen.getByRole('status')).toHaveTextContent(
      'O mestre ainda não montou o grid',
    );
    expect(
      screen.getByRole('button', { name: 'Aproximar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Centralizar mapa' }),
    ).toBeInTheDocument();
  });

  it('com imagem, desenha a imagem de fundo', () => {
    const { container } = renderMapa({
      config: {
        ...GRID_CONFIG_PADRAO,
        imagemUrl: 'https://exemplo.com/mapa.png',
      },
    });
    expect(
      container.querySelector('img[src="https://exemplo.com/mapa.png"]'),
    ).not.toBeNull();
  });
});
