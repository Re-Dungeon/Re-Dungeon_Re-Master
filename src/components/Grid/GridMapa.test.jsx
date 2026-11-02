import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { GRID_CONFIG_PADRAO } from 'common/utils/grid';
import GridMapa from './GridMapa';

// O jsdom não tem PointerEvent: sem ele o fireEvent.pointer* cria um Event
// sem clientX/pointerId. Basta um MouseEvent com os campos de ponteiro.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventDeTeste extends MouseEvent {
    constructor(tipo, init = {}) {
      super(tipo, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  window.PointerEvent = PointerEventDeTeste;
}

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
    expect(onMover).toHaveBeenCalledWith(TOKENS[0], 3, 3, [
      { col: 2, lin: 3 },
      { col: 3, lin: 3 },
    ]);

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

  // Viewport sem tamanho no jsdom: vista { x: 0, y: 0, zoom: 1 }, então px do
  // cliente = px do mundo (célula padrão de 50 px, sem deslocamento).
  describe('arraste, rastros e régua', () => {
    const viewportDe = () =>
      screen.getByRole('application', { name: 'Grid da campanha' });
    const ponteiro = (clientX, clientY, extra = {}) => ({
      clientX,
      clientY,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      ...extra,
    });

    it('arrastar mostra fantasma, caminho e distância; soltar envia o caminho', async () => {
      const onMover = vi.fn();
      const { container } = renderMapa({ onMover });
      const wesley = screen.getByRole('button', { name: /Wesley/ });

      // Wesley em (2,3) → canto em (100,150).
      fireEvent.pointerDown(wesley, ponteiro(110, 160));
      fireEvent.pointerMove(viewportDe(), ponteiro(160, 160)); // → (3,3)
      fireEvent.pointerMove(viewportDe(), ponteiro(210, 210)); // → (4,4)

      expect(screen.getByText('2 q · 3 m')).toBeInTheDocument();
      expect(container.querySelector('[data-fantasma]')).not.toBeNull();

      // Soltar grava (onMover) e, ao terminar, libera a posição do arraste.
      await act(async () =>
        fireEvent.pointerUp(viewportDe(), ponteiro(210, 210)),
      );
      expect(onMover).toHaveBeenCalledWith(TOKENS[0], 4, 4, [
        { col: 2, lin: 3 },
        { col: 3, lin: 3 },
        { col: 4, lin: 4 },
      ]);
      expect(container.querySelector('[data-fantasma]')).toBeNull();
      expect(screen.queryByText('2 q · 3 m')).not.toBeInTheDocument();
    });

    it('arrastar de volta à origem não move', () => {
      const onMover = vi.fn();
      renderMapa({ onMover });
      fireEvent.pointerDown(
        screen.getByRole('button', { name: /Wesley/ }),
        ponteiro(110, 160),
      );
      fireEvent.pointerMove(viewportDe(), ponteiro(160, 160));
      fireEvent.pointerMove(viewportDe(), ponteiro(112, 162));
      expect(screen.queryByText(/ q · /)).not.toBeInTheDocument();
      fireEvent.pointerUp(viewportDe(), ponteiro(112, 162));
      expect(onMover).not.toHaveBeenCalled();
    });

    it('desenha os rastros recebidos com a distância (e ignora token ausente)', () => {
      const { container } = renderMapa({
        rastros: [
          {
            tokenId: 't1',
            chave: 't1-1',
            pontos: [
              { col: 0, lin: 3 },
              { col: 2, lin: 3 },
            ],
            saindo: false,
          },
          {
            tokenId: 'sumiu',
            chave: 'sumiu-1',
            pontos: [
              { col: 9, lin: 9 },
              { col: 9, lin: 5 },
            ],
            saindo: false,
          },
        ],
      });
      expect(screen.getByText('2 q · 3 m')).toBeInTheDocument();
      expect(container.querySelector('[data-rastro="t1"]')).not.toBeNull();
      expect(container.querySelector('[data-rastro="sumiu"]')).toBeNull();
      expect(screen.queryByText('4 q · 6 m')).not.toBeInTheDocument();
      // O aviso continua sendo o único status da tela.
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('usa os metros por quadrado da cena', () => {
      renderMapa({
        config: { ...GRID_CONFIG_PADRAO, metrosPorQuadrado: 2 },
        rastros: [
          {
            tokenId: 't1',
            chave: 't1-1',
            pontos: [
              { col: 0, lin: 3 },
              { col: 2, lin: 3 },
            ],
            saindo: true,
          },
        ],
      });
      expect(screen.getByText('2 q · 4 m')).toBeInTheDocument();
    });

    it('o arraste mostra o total encadeado ao rastro ainda visível do token', () => {
      renderMapa({
        rastros: [
          {
            tokenId: 't1',
            chave: 't1-1',
            pontos: [
              { col: 0, lin: 3 },
              { col: 2, lin: 3 },
            ],
            saindo: false,
          },
        ],
      });
      fireEvent.pointerDown(
        screen.getByRole('button', { name: /Wesley/ }),
        ponteiro(110, 160),
      );
      fireEvent.pointerMove(viewportDe(), ponteiro(160, 160)); // → (3,3)
      // 2 do rastro + 1 do arraste; o rótulo do rastro antigo some.
      expect(screen.getByText('3 q · 4,5 m')).toBeInTheDocument();
      expect(screen.queryByText('2 q · 3 m')).not.toBeInTheDocument();
    });

    it('régua: botão liga, arrastar no fundo mede sem pan, toque limpa, Esc desliga', () => {
      const { container } = renderMapa();
      const regua = screen.getByRole('button', { name: 'Régua' });
      expect(regua).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(regua);
      expect(regua).toHaveAttribute('aria-pressed', 'true');

      const mundo = container.querySelector('[data-token-id]').parentElement;
      const transformAntes = mundo.style.transform;
      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425)); // (6,8)
      fireEvent.pointerMove(viewportDe(), ponteiro(475, 475)); // (9,9)
      expect(screen.getByText('3 q · 4,5 m')).toBeInTheDocument();
      expect(mundo.style.transform).toBe(transformAntes);

      // A medição fica depois de soltar…
      fireEvent.pointerUp(viewportDe(), ponteiro(475, 475));
      expect(screen.getByText('3 q · 4,5 m')).toBeInTheDocument();
      // …até o próximo toque.
      fireEvent.pointerDown(viewportDe(), ponteiro(600, 600));
      fireEvent.pointerUp(viewportDe(), ponteiro(600, 600));
      expect(screen.queryByText('3 q · 4,5 m')).not.toBeInTheDocument();
      expect(regua).toHaveAttribute('aria-pressed', 'true');

      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425));
      fireEvent.pointerMove(viewportDe(), ponteiro(375, 425));
      fireEvent.pointerUp(viewportDe(), ponteiro(375, 425));
      expect(screen.getByText('1 q · 1,5 m')).toBeInTheDocument();
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(regua).toHaveAttribute('aria-pressed', 'false');
      expect(screen.queryByText('1 q · 1,5 m')).not.toBeInTheDocument();
    });

    it('Shift+arrastar mede sem ligar o modo régua; sem Shift, arrastar o fundo é pan', () => {
      const { container } = renderMapa();
      const mundo = container.querySelector('[data-token-id]').parentElement;
      const transformAntes = mundo.style.transform;

      fireEvent.pointerDown(
        viewportDe(),
        ponteiro(325, 425, { shiftKey: true }),
      );
      fireEvent.pointerMove(
        viewportDe(),
        ponteiro(425, 425, { shiftKey: true }),
      );
      fireEvent.pointerUp(viewportDe(), ponteiro(425, 425));
      expect(screen.getByText('2 q · 3 m')).toBeInTheDocument();
      expect(mundo.style.transform).toBe(transformAntes);
      expect(screen.getByRole('button', { name: 'Régua' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );

      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425));
      fireEvent.pointerMove(viewportDe(), ponteiro(345, 425));
      fireEvent.pointerUp(viewportDe(), ponteiro(345, 425));
      expect(mundo.style.transform).not.toBe(transformAntes);
    });
  });
});
