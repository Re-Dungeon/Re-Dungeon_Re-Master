import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('GridMapa — sinais, estado dos tokens, auras e seguir', () => {
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
  const mundoDe = container =>
    container.querySelector('[data-token-id]').parentElement;
  const transformDe = elemento => {
    const [, x, y, zoom] = elemento.style.transform
      .match(/translate\((.+)px, (.+)px\) scale\((.+)\)/)
      .map(Number);
    return { x, y, zoom };
  };
  const mapa = props => (
    <GridMapa
      config={GRID_CONFIG_PADRAO}
      tokens={TOKENS}
      podeMover={podeMoverDoJogador}
      onMover={vi.fn()}
      {...props}
    />
  );

  // O jsdom não mede elementos: viewport de 800×600 só nos testes que
  // precisam centralizar a vista.
  const comViewport = () => {
    class ResizeObserverDeTeste {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 800, height: 600 } }]);
      }

      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverDeTeste);
  };

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('pressão longa e Alt+clique', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('segurar 3 s no fundo sinaliza no ponto (px do mundo) e soltar não seleciona', () => {
      const onPing = vi.fn();
      const onSelecionar = vi.fn();
      renderMapa({ onPing, onSelecionar });

      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425));
      act(() => vi.advanceTimersByTime(2999));
      expect(onPing).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onPing).toHaveBeenCalledWith({ x: 325, y: 425, puxar: false });

      fireEvent.pointerUp(viewportDe(), ponteiro(325, 425));
      expect(onSelecionar).not.toHaveBeenCalled();
    });

    it('mover mais de 4 px antes cancela (o pan segue normal)', () => {
      const onPing = vi.fn();
      const { container } = renderMapa({ onPing });
      const antes = mundoDe(container).style.transform;

      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425));
      fireEvent.pointerMove(viewportDe(), ponteiro(330, 425));
      act(() => vi.advanceTimersByTime(3000));
      expect(onPing).not.toHaveBeenCalled();
      expect(mundoDe(container).style.transform).not.toBe(antes);
    });

    it('segurar o próprio token sinaliza e cancela o arraste', () => {
      const onPing = vi.fn();
      const onMover = vi.fn();
      const onSelecionar = vi.fn();
      renderMapa({ onPing, onMover, onSelecionar });

      fireEvent.pointerDown(
        screen.getByRole('button', { name: /Wesley/ }),
        ponteiro(110, 160),
      );
      act(() => vi.advanceTimersByTime(3000));
      expect(onPing).toHaveBeenCalledWith({ x: 110, y: 160, puxar: false });

      fireEvent.pointerMove(viewportDe(), ponteiro(210, 210));
      expect(screen.queryByText(/ q · /)).not.toBeInTheDocument();
      fireEvent.pointerUp(viewportDe(), ponteiro(210, 210));
      expect(onMover).not.toHaveBeenCalled();
      expect(onSelecionar).not.toHaveBeenCalled();
    });

    it('pinça cancela a pressão longa; sem onPing não há sinal', () => {
      const onPing = vi.fn();
      renderMapa({ onPing });
      fireEvent.pointerDown(
        viewportDe(),
        ponteiro(100, 100, { pointerType: 'touch' }),
      );
      fireEvent.pointerDown(
        viewportDe(),
        ponteiro(200, 200, { pointerType: 'touch', pointerId: 2 }),
      );
      act(() => vi.advanceTimersByTime(3000));
      expect(onPing).not.toHaveBeenCalled();
    });

    it('sem onPing, segurar não faz nada e o clique continua selecionando', () => {
      const onSelecionar = vi.fn();
      renderMapa({ onSelecionar });
      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425, { altKey: true }));
      act(() => vi.advanceTimersByTime(3000));
      fireEvent.pointerUp(viewportDe(), ponteiro(325, 425));
      expect(onSelecionar).toHaveBeenCalledWith(null);
    });

    it('Alt+clique sinaliza na hora, sem pan nem seleção', () => {
      const onPing = vi.fn();
      const onSelecionar = vi.fn();
      const { container } = renderMapa({ onPing, onSelecionar });
      const antes = mundoDe(container).style.transform;

      fireEvent.pointerDown(
        screen.getByRole('button', { name: /Goblin/ }),
        ponteiro(40, 40, { altKey: true }),
      );
      expect(onPing).toHaveBeenCalledWith({ x: 40, y: 40, puxar: false });
      fireEvent.pointerMove(viewportDe(), ponteiro(140, 140, { altKey: true }));
      fireEvent.pointerUp(viewportDe(), ponteiro(140, 140));
      expect(mundoDe(container).style.transform).toBe(antes);
      expect(onSelecionar).not.toHaveBeenCalled();
      // Nem a pressão longa dispara depois.
      act(() => vi.advanceTimersByTime(3000));
      expect(onPing).toHaveBeenCalledTimes(1);
    });

    it('Shift+Alt+clique puxa a vista só para o mestre (e não mede)', () => {
      const onPing = vi.fn();
      const { rerender } = render(mapa({ onPing }));
      fireEvent.pointerDown(
        viewportDe(),
        ponteiro(325, 425, { altKey: true, shiftKey: true }),
      );
      fireEvent.pointerUp(viewportDe(), ponteiro(325, 425));
      expect(onPing).toHaveBeenLastCalledWith({ x: 325, y: 425, puxar: false });

      rerender(mapa({ onPing, mestre: true }));
      fireEvent.pointerDown(
        viewportDe(),
        ponteiro(325, 425, { altKey: true, shiftKey: true }),
      );
      fireEvent.pointerUp(viewportDe(), ponteiro(325, 425));
      expect(onPing).toHaveBeenLastCalledWith({ x: 325, y: 425, puxar: true });
      expect(screen.queryByText(/ q · /)).not.toBeInTheDocument();
    });

    it('"Puxar vista" só para o mestre: liga, o próximo sinal puxa e desliga', () => {
      const onPing = vi.fn();
      const { rerender } = render(mapa({ onPing }));
      expect(
        screen.queryByRole('button', { name: 'Puxar vista' }),
      ).not.toBeInTheDocument();

      rerender(mapa({ onPing, mestre: true }));
      const puxar = screen.getByRole('button', { name: 'Puxar vista' });
      expect(puxar).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(puxar);
      expect(puxar).toHaveAttribute('aria-pressed', 'true');

      fireEvent.pointerDown(viewportDe(), ponteiro(325, 425));
      act(() => vi.advanceTimersByTime(3000));
      expect(onPing).toHaveBeenCalledWith({ x: 325, y: 425, puxar: true });
      expect(puxar).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('bloqueia o menu de contexto do navegador no mapa', () => {
    renderMapa({ onPing: vi.fn() });
    expect(fireEvent.contextMenu(viewportDe())).toBe(false);
  });

  it('desenha os sinais recebidos com o nome', () => {
    const { container } = renderMapa({
      pings: [
        {
          chave: 'u2-1',
          uid: 'u2',
          x: 100,
          y: 80,
          nome: 'Brina',
          cor: '#5b7cfa',
        },
      ],
    });
    const sinal = container.querySelector('[data-ping="u2"]');
    expect(sinal).toHaveStyle({ left: '100px', top: '80px' });
    expect(sinal).toHaveTextContent('Brina');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('sinal de puxar vista de outra pessoa centraliza a vista (zoom mantido); o meu não', () => {
    comViewport();
    const { container, rerender } = render(mapa());
    const antes = transformDe(mundoDe(container));

    rerender(
      mapa({
        pings: [
          {
            chave: 'eu-1',
            uid: 'u1',
            x: 10,
            y: 10,
            puxar: true,
            proprio: true,
          },
        ],
      }),
    );
    expect(transformDe(mundoDe(container))).toEqual(antes);

    rerender(
      mapa({
        pings: [
          {
            chave: 'm-1',
            uid: 'm',
            x: 500,
            y: 300,
            puxar: true,
            proprio: false,
          },
        ],
      }),
    );
    const depois = transformDe(mundoDe(container));
    expect(depois.zoom).toBe(antes.zoom);
    expect(depois.x).toBeCloseTo(400 - 500 * antes.zoom);
    expect(depois.y).toBeCloseTo(300 - 300 * antes.zoom);
    expect(mundoDe(container).style.transition).toContain('transform');

    // O mesmo sinal não puxa de novo depois de um pan.
    fireEvent.pointerDown(viewportDe(), ponteiro(325, 425));
    fireEvent.pointerMove(viewportDe(), ponteiro(345, 425));
    fireEvent.pointerUp(viewportDe(), ponteiro(345, 425));
    expect(transformDe(mundoDe(container)).x).toBeCloseTo(depois.x + 20);
    expect(mundoDe(container).style.transition).toBe('');
  });

  it('barras de recursos e ícones de condição (+N) sobre o token', () => {
    const condicao = (id, nome) => ({ id, nome, icone: null, stack: null });
    const { container } = renderMapa({
      detalhes: {
        t1: {
          recursos: {
            pv: { atual: 6, max: 10 },
            energia: null,
            fadiga: { atual: 10, max: 10 },
            numeros: false,
          },
          condicoes: [
            condicao('c1', 'Envenenado'),
            condicao('c2', 'Atordoado'),
            condicao('c3', 'Cego'),
            condicao('c4', 'Lento'),
          ],
        },
      },
    });
    const wesley = container.querySelector('[data-token-id="t1"]');
    expect(wesley.querySelector('[data-barra="pv"] > span')).toHaveStyle({
      width: '60%',
    });
    // Fadiga descansada = barra vazia.
    expect(wesley.querySelector('[data-barra="fadiga"] > span')).toHaveStyle({
      width: '0%',
    });
    expect(wesley.querySelector('[data-barra="energia"]')).toBeNull();
    expect(wesley.querySelectorAll('[data-condicao]')).toHaveLength(3);
    expect(wesley.querySelector('[data-condicoes]')).toHaveTextContent('+1');
    expect(
      container.querySelector('[data-token-id="t2"] [data-barra]'),
    ).toBeNull();
  });

  it('hover num token mostra o cartão com a distância borda a borda do meu token', () => {
    const recursos = numeros => ({
      pv: { atual: 3, max: 10 },
      energia: null,
      fadiga: null,
      numeros,
    });
    const detalhesCom = numeros => ({
      t2: {
        recursos: recursos(numeros),
        condicoes: [{ id: 'c1', nome: 'Envenenado', icone: null, stack: 2 }],
      },
    });
    const { container, rerender } = render(
      mapa({ detalhes: detalhesCom(false) }),
    );
    const goblin = screen.getByRole('button', { name: /Goblin/ });

    fireEvent.pointerOver(goblin, { pointerType: 'mouse' });
    const cartao = container.querySelector('[data-detalhe]');
    expect(cartao).toHaveTextContent('Goblin');
    expect(cartao).toHaveTextContent('Envenenado ×2');
    // Goblin 2×2 em (0,0); Wesley em (2,3): 2 quadrados.
    expect(cartao).toHaveTextContent('2 q · 3 m de Wesley Chase');
    expect(cartao).not.toHaveTextContent('PV');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(mapa({ detalhes: detalhesCom(true) }));
    expect(container.querySelector('[data-detalhe]')).toHaveTextContent(
      'PV 3/10',
    );

    fireEvent.pointerOut(goblin, { pointerType: 'mouse' });
    expect(container.querySelector('[data-detalhe]')).toBeNull();
  });

  it('toque num token mostra o cartão por 3 s', () => {
    vi.useFakeTimers();
    const { container } = renderMapa();
    const goblin = screen.getByRole('button', { name: /Goblin/ });
    fireEvent.pointerDown(goblin, ponteiro(40, 40, { pointerType: 'touch' }));
    fireEvent.pointerUp(
      viewportDe(),
      ponteiro(40, 40, { pointerType: 'touch' }),
    );
    expect(container.querySelector('[data-detalhe]')).toHaveTextContent(
      '2 q · 3 m de Wesley Chase',
    );
    act(() => vi.advanceTimersByTime(3000));
    expect(container.querySelector('[data-detalhe]')).toBeNull();
  });

  it('desenha a aura em volta do token, recortada ao mapa', () => {
    const { container } = renderMapa({
      tokens: [
        { ...TOKENS[0], aura: { raio: 1, cor: '#e05555' } },
        { ...TOKENS[1], aura: { raio: 2, cor: '#5b7cfa' } },
        { ...TOKENS[2], aura: { raio: 0, cor: '#5b7cfa' } },
      ],
    });
    // Wesley (2,3), 1×1, raio 1 → células 1–3 × 2–4.
    expect(container.querySelector('[data-aura="t1"]')).toHaveStyle({
      left: '50px',
      top: '100px',
      width: '150px',
      height: '150px',
    });
    // Goblin 2×2 no canto (0,0), raio 2 → 0–3 × 0–3.
    expect(container.querySelector('[data-aura="t2"]')).toHaveStyle({
      left: '0px',
      top: '0px',
      width: '200px',
      height: '200px',
    });
    expect(container.querySelector('[data-aura="t3"]')).toBeNull();
  });

  it('"Seguir token" centraliza no meu token, acompanha o movimento e desliga no pan', () => {
    comViewport();
    const { container, rerender } = render(mapa());
    const seguir = screen.getByRole('button', { name: 'Seguir token' });
    const { zoom } = transformDe(mundoDe(container));

    fireEvent.click(seguir);
    expect(seguir).toHaveAttribute('aria-pressed', 'true');
    // Centro do Wesley (2,3): (125, 175).
    let vista = transformDe(mundoDe(container));
    expect(vista.zoom).toBe(zoom);
    expect(vista.x).toBeCloseTo(400 - 125 * zoom);
    expect(vista.y).toBeCloseTo(300 - 175 * zoom);

    rerender(
      mapa({ tokens: [{ ...TOKENS[0], col: 6 }, TOKENS[1], TOKENS[2]] }),
    );
    vista = transformDe(mundoDe(container));
    expect(vista.x).toBeCloseTo(400 - 325 * zoom);

    fireEvent.pointerDown(viewportDe(), ponteiro(700, 500));
    fireEvent.pointerMove(viewportDe(), ponteiro(720, 500));
    fireEvent.pointerUp(viewportDe(), ponteiro(720, 500));
    expect(seguir).toHaveAttribute('aria-pressed', 'false');
  });

  it('"Seguir token" fica desabilitado sem token de referência (mestre sem seleção)', () => {
    renderMapa({ mestre: true, podeMover: () => true, onSelecionar: vi.fn() });
    expect(screen.getByRole('button', { name: 'Seguir token' })).toBeDisabled();
  });
});

describe('GridMapa — combate (Fase 3A)', () => {
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
  // Já normalizado (useGridCampanha → combate).
  const combate = ({
    indice = 0,
    rodada = 2,
    inicioTurno = null,
    ordem,
  } = {}) => {
    const lista = ordem ?? [
      { tokenId: 't1', iniciativa: 18, d20: 13, reacao: 5 },
      { tokenId: 't2', iniciativa: 12, d20: 10, reacao: 2 },
      { tokenId: 't3', iniciativa: 7, d20: 5, reacao: 2 },
    ];
    return {
      ordem: lista,
      indice,
      rodada,
      inicioTurno,
      chaveTurno: '1:0',
      tokenDaVezId: lista[indice].tokenId,
    };
  };
  const mapa = props => (
    <GridMapa
      config={GRID_CONFIG_PADRAO}
      tokens={TOKENS}
      podeMover={podeMoverDoJogador}
      onMover={vi.fn()}
      {...props}
    />
  );
  const comViewport = () => {
    class ResizeObserverDeTeste {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 800, height: 600 } }]);
      }

      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverDeTeste);
  };
  const transformDe = container => {
    const [, x, y, zoom] = container
      .querySelector('[data-token-id]')
      .parentElement.style.transform.match(
        /translate\((.+)px, (.+)px\) scale\((.+)\)/,
      )
      .map(Number);
    return { x, y, zoom };
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sem combate não há faixa, anel nem alcance', () => {
    const { container } = render(mapa());
    expect(container.querySelector('[data-faixa-iniciativa]')).toBeNull();
    expect(container.querySelector('[data-da-vez]')).toBeNull();
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /^Wesley Chase, coluna/ }),
      ponteiro(110, 160),
    );
    fireEvent.pointerMove(viewportDe(), ponteiro(160, 160));
    expect(container.querySelector('[data-alcance]')).toBeNull();
    expect(screen.getByText('1 q · 1,5 m')).not.toHaveAttribute('data-faixa');
  });

  it('faixa: rodada, retratos na ordem (jogador não vê o oculto) e o da vez marcado', () => {
    const { container } = render(mapa({ combate: combate() }));
    expect(screen.getByText('Rodada 2')).toBeInTheDocument();
    const lista = screen.getByRole('list', { name: 'Ordem de iniciativa' });
    const retratos = lista.querySelectorAll('button');
    expect(
      [...retratos].map(botao => botao.getAttribute('aria-label')),
    ).toEqual(['Centralizar em Wesley Chase', 'Centralizar em Goblin']);
    expect(retratos[0]).toHaveAttribute('aria-current', 'true');
    expect(retratos[1]).not.toHaveAttribute('aria-current');
    expect(retratos[0]).toHaveTextContent('18');
    // Anel no token da vez.
    const daVez = container.querySelector('[data-da-vez]');
    expect(daVez).toHaveAttribute('data-token-id', 't1');
    expect(
      screen.getByRole('button', {
        name: 'Wesley Chase, coluna 3, linha 4, turno atual',
      }),
    ).toBeInTheDocument();
    // A faixa não é anunciada (o aviso continua o único status).
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Vez do mestre')).not.toBeInTheDocument();
  });

  it('mestre vê o oculto na faixa; jogador, na vez do oculto, vê "Vez do mestre"', () => {
    const { rerender } = render(
      mapa({ combate: combate({ indice: 2 }), mestre: true }),
    );
    expect(
      screen.getByRole('button', { name: 'Centralizar em Emboscada' }),
    ).toHaveAttribute('aria-current', 'true');
    expect(screen.queryByText('Vez do mestre')).not.toBeInTheDocument();

    rerender(mapa({ combate: combate({ indice: 2 }) }));
    expect(
      screen.queryByRole('button', { name: 'Centralizar em Emboscada' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Vez do mestre')).toBeInTheDocument();
  });

  it('clicar no retrato centraliza no token mantendo o zoom', () => {
    comViewport();
    const { container } = render(mapa({ combate: combate() }));
    const { zoom } = transformDe(container);
    fireEvent.click(
      screen.getByRole('button', { name: 'Centralizar em Goblin' }),
    );
    // Goblin 2×2 em (0,0): centro (50, 50).
    const vista = transformDe(container);
    expect(vista.zoom).toBe(zoom);
    expect(vista.x).toBeCloseTo(400 - 50 * zoom);
    expect(vista.y).toBeCloseTo(300 - 50 * zoom);
  });

  it('cada botão da faixa só aparece com a função, e chama ela', async () => {
    const { rerender } = render(mapa({ combate: combate() }));
    const rotulos = [
      'Anterior',
      'Próximo turno',
      'Encerrar meu turno',
      'Seu turno! Restaurar PP',
    ];
    rotulos.forEach(rotulo =>
      expect(
        screen.queryByRole('button', { name: rotulo }),
      ).not.toBeInTheDocument(),
    );

    const acoes = {
      anterior: vi.fn(),
      proximo: vi.fn(),
      encerrarTurno: vi.fn(() => Promise.resolve(true)),
      restaurarPp: vi.fn(),
    };
    rerender(mapa({ combate: combate(), acoesCombate: acoes }));
    for (const rotulo of rotulos) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: rotulo }));
      });
    }
    expect(acoes.anterior).toHaveBeenCalledTimes(1);
    expect(acoes.proximo).toHaveBeenCalledTimes(1);
    expect(acoes.encerrarTurno).toHaveBeenCalledTimes(1);
    expect(acoes.restaurarPp).toHaveBeenCalledTimes(1);

    rerender(
      mapa({ combate: combate(), acoesCombate: { encerrarTurno: vi.fn() } }),
    );
    expect(
      screen.queryByRole('button', { name: 'Próximo turno' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Encerrar meu turno' }),
    ).toBeInTheDocument();
  });

  it('arrastar o próprio token em combate mostra o alcance (9 m, 1,5 m/q, 2×)', async () => {
    const { container } = render(mapa({ combate: combate() }));
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /^Wesley Chase, coluna/ }),
      ponteiro(110, 160),
    );
    fireEvent.pointerMove(viewportDe(), ponteiro(160, 160));
    const mover = container.querySelectorAll('[data-alcance="mover"]');
    const correr = container.querySelectorAll('[data-alcance="correr"]');
    // Wesley (2,3): Mover 6 → linhas 0–9, colunas 0–8 (recortado à esquerda).
    expect(mover).toHaveLength(10);
    expect(mover[0]).toHaveAttribute('width', String(9 * 50));
    expect(mover[0]).toHaveAttribute('x', '0');
    // Correr 12 → linhas 0–15.
    expect(correr).toHaveLength(16);

    await act(async () =>
      fireEvent.pointerUp(viewportDe(), ponteiro(160, 160)),
    );
    expect(container.querySelector('[data-alcance]')).toBeNull();
  });

  it('token alheio não mostra alcance; tocar o próprio mostra até Esc ou o mapa vazio', () => {
    const { container } = render(mapa({ combate: combate() }));
    const goblin = screen.getByRole('button', { name: /^Goblin, coluna/ });
    fireEvent.pointerDown(goblin, ponteiro(40, 40));
    fireEvent.pointerUp(viewportDe(), ponteiro(40, 40));
    expect(container.querySelector('[data-alcance]')).toBeNull();

    const wesley = screen.getByRole('button', {
      name: /^Wesley Chase, coluna/,
    });
    fireEvent.pointerDown(wesley, ponteiro(110, 160));
    fireEvent.pointerUp(viewportDe(), ponteiro(110, 160));
    expect(container.querySelector('[data-alcance="mover"]')).not.toBeNull();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('[data-alcance]')).toBeNull();

    fireEvent.pointerDown(wesley, ponteiro(110, 160));
    fireEvent.pointerUp(viewportDe(), ponteiro(110, 160));
    expect(container.querySelector('[data-alcance]')).not.toBeNull();
    fireEvent.pointerDown(viewportDe(), ponteiro(700, 700));
    fireEvent.pointerUp(viewportDe(), ponteiro(700, 700));
    expect(container.querySelector('[data-alcance]')).toBeNull();
  });

  it('rótulo do arraste conta desde o início do turno, verde → amarelo → vermelho', () => {
    render(mapa({ combate: combate({ inicioTurno: { col: 0, lin: 3 } }) }));
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /^Wesley Chase, coluna/ }),
      ponteiro(110, 160),
    );
    fireEvent.pointerMove(viewportDe(), ponteiro(160, 160)); // → (3,3): 3 desde (0,3)
    expect(screen.getByText('3 q · 4,5 m')).toHaveAttribute(
      'data-faixa',
      'mover',
    );
    fireEvent.pointerMove(viewportDe(), ponteiro(410, 160)); // → (8,3): 8
    expect(screen.getByText('8 q · 12 m')).toHaveAttribute(
      'data-faixa',
      'correr',
    );
    fireEvent.pointerMove(viewportDe(), ponteiro(760, 160)); // → (15,3): 15
    expect(screen.getByText('15 q · 22,5 m')).toHaveAttribute(
      'data-faixa',
      'alem',
    );
  });

  it('usa o deslocamento do token e o multiplicador de corrida da cena', () => {
    const { container } = render(
      mapa({
        combate: combate(),
        config: { ...GRID_CONFIG_PADRAO, multiplicadorCorrida: 1.5 },
        tokens: [{ ...TOKENS[0], deslocamento: 3 }, TOKENS[1], TOKENS[2]],
      }),
    );
    fireEvent.pointerDown(
      screen.getByRole('button', { name: /^Wesley Chase, coluna/ }),
      ponteiro(110, 160),
    );
    fireEvent.pointerMove(viewportDe(), ponteiro(160, 160));
    // 3 m → Mover 2 (linhas 1–5); 1,5× → Correr 3 (linhas 0–6).
    expect(container.querySelectorAll('[data-alcance="mover"]')).toHaveLength(
      5,
    );
    expect(container.querySelectorAll('[data-alcance="correr"]')).toHaveLength(
      7,
    );
  });

  it('aviso do travamento só para o jogador; o aviso de status continua com a faixa', () => {
    const { container, rerender } = render(mapa({ travamento: 'congelado' }));
    expect(container.querySelector('[data-travamento]')).toHaveTextContent(
      'Movimento congelado pelo mestre',
    );
    rerender(mapa({ travamento: 'turno' }));
    expect(container.querySelector('[data-travamento]')).toHaveTextContent(
      'Movimento só na sua vez',
    );
    rerender(mapa({ travamento: 'livre' }));
    expect(container.querySelector('[data-travamento]')).toBeNull();
    rerender(mapa({ travamento: 'congelado', mestre: true }));
    expect(container.querySelector('[data-travamento]')).toBeNull();

    rerender(mapa({ aviso: 'Carregando…', combate: combate() }));
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…');
  });

  it('com o movimento travado, o token continua sendo a referência ("Seguir token")', () => {
    render(mapa({ podeMover: () => false, ehMeu: podeMoverDoJogador }));
    expect(
      screen.getByRole('button', { name: 'Seguir token' }),
    ).not.toBeDisabled();
  });

  it('cartão do token mostra o PP (quando o detalhe traz)', () => {
    const { container } = render(
      mapa({
        detalhes: {
          t1: { recursos: null, condicoes: [], pp: { atual: 3, max: 10 } },
        },
      }),
    );
    fireEvent.pointerOver(
      screen.getByRole('button', { name: /^Wesley Chase, coluna/ }),
      {
        pointerType: 'mouse',
      },
    );
    expect(container.querySelector('[data-detalhe]')).toHaveTextContent(
      'PP 3/10',
    );
  });
});
