import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import AreasGrid from './AreasGrid';
import AreaRotulos from './AreaRotulos';
import AreaPopover from './AreaPopover';
import TokenAcoes from './TokenAcoes';

const config = { celula: 50, deslocamentoX: 0, deslocamentoY: 0 };

describe('AreasGrid', () => {
  it('desenha um retângulo por trecho (células vizinhas se fundem), o tracejado e a prévia', () => {
    const area = {
      id: 'a1',
      cor: '#e05555',
      origem: { col: 0, lin: 0 },
      alvo: { col: 2, lin: 0 },
      celulas: [
        { col: 1, lin: 0 },
        { col: 2, lin: 0 },
      ],
    };
    const { container } = render(
      <AreasGrid
        config={config}
        areas={[area]}
        previa={{ ...area, id: 'p', cor: undefined }}
        largura={500}
        altura={500}
      />,
    );
    expect(container.querySelectorAll('[data-area="a1"] rect')).toHaveLength(1);
    expect(container.querySelectorAll('[data-area="a1"] line')).toHaveLength(1);
    expect(container.querySelectorAll('[data-area="previa"] rect')).toHaveLength(1);
  });
});

describe('AreaRotulos', () => {
  const areas = [
    {
      id: 'a1',
      forma: 'cone',
      cor: '#e05555',
      rotulo: 'Cone · 9 m (6 q)',
      autorNome: 'Wesley',
      atingidos: 'Atinge: Goblin',
      podeEditar: true,
    },
    { id: 'a2', forma: 'raio', rotulo: 'Raio · 3 m', podeEditar: false },
  ];
  const props = () => ({
    areas,
    posicaoDe: () => ({ left: 10, top: 20 }),
    onSelecionar: vi.fn(),
    onRemover: vi.fn(),
    onAlcaPointerDown: vi.fn(),
  });

  it('mostra o chip curto e seleciona ao tocar', () => {
    const p = props();
    render(<AreaRotulos {...p} />);
    fireEvent.click(screen.getByText('Cone · 9 m (6 q)'));
    expect(p.onSelecionar).toHaveBeenCalledWith('a1');
  });

  it('selecionada: texto completo, lixeira e alças que iniciam o gesto', () => {
    const p = props();
    const { container } = render(<AreaRotulos {...p} selecionadaId="a1" />);
    expect(screen.getByText('Wesley — Cone · 9 m (6 q) — Atinge: Goblin')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Remover área'));
    expect(p.onRemover).toHaveBeenCalledWith('a1');
    const alcas = container.querySelectorAll('[data-area-alca]');
    expect(alcas).toHaveLength(2);
    fireEvent.pointerDown(container.querySelector('[data-area-alca="alvo"]'));
    expect(p.onAlcaPointerDown).toHaveBeenCalledWith('a1', 'alvo', expect.anything());
  });

  it('sem permissão: sem lixeira nem alças; raio só tem a origem', () => {
    const p = props();
    const { container, rerender } = render(<AreaRotulos {...p} selecionadaId="a2" />);
    expect(screen.queryByLabelText('Remover área')).toBeNull();
    expect(container.querySelectorAll('[data-area-alca]')).toHaveLength(0);
    rerender(
      <AreaRotulos
        {...p}
        areas={[{ ...areas[1], podeEditar: true }]}
        selecionadaId="a2"
      />,
    );
    expect(container.querySelectorAll('[data-area-alca]')).toHaveLength(1);
    expect(container.querySelector('[data-area-alca="origem"]')).toBeTruthy();
  });
});

describe('AreaPopover', () => {
  const montar = extra => {
    const onPosicionar = vi.fn();
    const onClose = vi.fn();
    render(
      <AreaPopover
        open
        anchorEl={document.body}
        onClose={onClose}
        onPosicionar={onPosicionar}
        metrosPorQuadrado={1.5}
        corPadrao="#e8cb85"
        {...extra}
      />,
    );
    return { onPosicionar, onClose };
  };

  it('converte metros em quadrados e entrega a configuração', () => {
    const { onPosicionar, onClose } = montar();
    const botao = screen.getByText('Posicionar no mapa');
    expect(botao.closest('button').disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Tamanho (m)'), { target: { value: '9' } });
    expect(screen.getByText('= 6 q')).toBeTruthy();
    fireEvent.click(screen.getByText('Raio'));
    fireEvent.click(screen.getByLabelText('Cor #f5a742'));
    fireEvent.click(botao);
    expect(onPosicionar).toHaveBeenCalledWith({
      forma: 'raio',
      metros: 9,
      cor: '#f5a742',
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('só mostra "Remover todos" com onRemoverTodas e pede confirmação', () => {
    montar();
    expect(screen.queryByText('Remover todos')).toBeNull();
  });

  it('remover todos confirma antes (diálogo, sem window.confirm)', async () => {
    const onRemoverTodas = vi.fn();
    const confirmar = vi.spyOn(window, 'confirm');
    montar({ onRemoverTodas });
    fireEvent.click(screen.getByText('Remover todos'));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /Remover todas/ })).toBeNull());
    expect(onRemoverTodas).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Remover todos'));
    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(onRemoverTodas).toHaveBeenCalledTimes(1));
    expect(confirmar).not.toHaveBeenCalled();
    confirmar.mockRestore();
  });
});

describe('TokenAcoes', () => {
  it('"Rolar…" chama onRolar', () => {
    const onRolar = vi.fn();
    render(<TokenAcoes posicao={{ left: 5, top: 5 }} onRolar={onRolar} />);
    fireEvent.click(screen.getByText('Rolar…'));
    expect(onRolar).toHaveBeenCalled();
  });
});
