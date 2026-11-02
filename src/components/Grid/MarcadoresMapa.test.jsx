import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ICONES_MARCADOR } from 'common/utils/gridMarcadores';
import MarcadorPino from './MarcadorPino';
import MarcadorCartao from './MarcadorCartao';
import PaletaDesenho from './PaletaDesenho';

const config = { celula: 50, deslocamentoX: 10, deslocamentoY: 20 };
const marcador = {
  id: 'm1',
  col: 2,
  lin: 1,
  icone: 'caveira',
  cor: '#e05555',
  titulo: 'Armadilha',
  texto: 'Cuidado com o piso',
  secreto: true,
};

describe('MarcadorPino', () => {
  it('centra na célula e chama onClick', () => {
    const onClick = vi.fn();
    render(
      <MarcadorPino marcador={marcador} config={config} onClick={onClick} />,
    );
    const pino = screen.getByRole('button', { name: 'Marcador: Armadilha' });
    expect(pino.getAttribute('data-marcador-id')).toBe('m1');
    expect(pino.style.width).toBe('30px');
    expect(pino.style.left).toBe('120px'); // 10 + 2*50 + (50-30)/2
    fireEvent.click(pino);
    expect(onClick).toHaveBeenCalledWith(marcador);
  });

  it('cadeado só para o mestre', () => {
    const { container, rerender } = render(
      <MarcadorPino marcador={marcador} config={config} />,
    );
    expect(container.querySelector('[data-cadeado]')).toBeNull();
    rerender(<MarcadorPino marcador={marcador} config={config} mestre />);
    expect(container.querySelector('[data-cadeado]')).not.toBeNull();
  });

  it('renderiza todos os ícones do catálogo', () => {
    ICONES_MARCADOR.forEach(({ id }) => {
      const { container, unmount } = render(
        <MarcadorPino marcador={{ ...marcador, icone: id }} config={config} />,
      );
      expect(container.querySelector(`[data-icone="${id}"]`)).not.toBeNull();
      unmount();
    });
  });
});

describe('MarcadorCartao', () => {
  it('mostra título, texto e selo, e fecha por botão, Esc e toque fora', () => {
    const onFechar = vi.fn();
    render(
      <MarcadorCartao
        marcador={marcador}
        posicao={{ left: 10, top: 20 }}
        onFechar={onFechar}
      />,
    );
    expect(
      screen.getByRole('dialog', { name: 'Marcador: Armadilha' }),
    ).toBeTruthy();
    expect(screen.getByText('Só o mestre vê')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerDown(document.body);
    expect(onFechar).toHaveBeenCalledTimes(3);
  });

  it('tocar dentro não fecha', () => {
    const onFechar = vi.fn();
    render(
      <MarcadorCartao
        marcador={marcador}
        posicao={{ left: 0, top: 0 }}
        onFechar={onFechar}
      />,
    );
    fireEvent.pointerDown(screen.getByText('Armadilha'));
    expect(onFechar).not.toHaveBeenCalled();
  });
});

describe('PaletaDesenho', () => {
  it('escolhe cor e apaga os meus; "Apagar todos" só com onApagarTodos e confirma', () => {
    const onCor = vi.fn();
    const onApagarMeus = vi.fn();
    const { rerender } = render(
      <PaletaDesenho cor="#ffffff" onCor={onCor} onApagarMeus={onApagarMeus} />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Cor #ffffff' })
        .getAttribute('aria-pressed'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Cor #e05555' }));
    expect(onCor).toHaveBeenCalledWith('#e05555');
    fireEvent.click(screen.getByText('Apagar meus desenhos'));
    expect(onApagarMeus).toHaveBeenCalled();
    expect(screen.queryByText('Apagar todos')).toBeNull();

    const onApagarTodos = vi.fn();
    rerender(
      <PaletaDesenho
        cor="#ffffff"
        onCor={onCor}
        onApagarMeus={onApagarMeus}
        onApagarTodos={onApagarTodos}
      />,
    );
    const confirmar = vi.spyOn(window, 'confirm');
    confirmar.mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getByText('Apagar todos'));
    expect(onApagarTodos).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Apagar todos'));
    expect(onApagarTodos).toHaveBeenCalledTimes(1);
    confirmar.mockRestore();
  });
});
