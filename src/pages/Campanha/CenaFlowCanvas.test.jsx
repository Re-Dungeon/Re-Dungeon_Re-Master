import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CenaFlowCanvas from './CenaFlowCanvas';

const NODES = [
  {
    id: 'cena1',
    type: 'cenaNode',
    position: { x: 0, y: 0 },
    data: {
      cena: { titulo: 'Chegada na Cidade', estado: 'concluido' },
      cor: '#facc15',
    },
  },
  {
    id: 'cena2',
    type: 'cenaNode',
    position: { x: 300, y: 0 },
    data: {
      cena: { titulo: 'Encontro', estado: 'em_andamento' },
      cor: '#eab308',
    },
  },
];

const EDGES = [{ id: 'conexao1', source: 'cena1', target: 'cena2' }];

const renderCanvas = propsOverride =>
  render(
    <CenaFlowCanvas
      nodes={NODES}
      edges={EDGES}
      podeEscrever
      onNodePositionChange={vi.fn()}
      onNodeDragStop={vi.fn()}
      onNodeClick={vi.fn()}
      onConnect={vi.fn()}
      onNovaCena={vi.fn()}
      {...propsOverride}
    />,
  );

describe('CenaFlowCanvas', () => {
  it('renderiza um nó por cena com o título e o estado', () => {
    renderCanvas();

    expect(screen.getByText(/Chegada na Cidade/)).toBeInTheDocument();
    expect(screen.getByText('Encontro')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('mostra o botão "+ Nova Cena" apenas quando podeEscrever é true', () => {
    const { rerender } = renderCanvas();
    expect(
      screen.getByRole('button', { name: '+ Nova Cena' }),
    ).toBeInTheDocument();

    rerender(
      <CenaFlowCanvas
        nodes={NODES}
        edges={EDGES}
        podeEscrever={false}
        onNodePositionChange={vi.fn()}
        onNodeDragStop={vi.fn()}
        onNodeClick={vi.fn()}
        onConnect={vi.fn()}
        onNovaCena={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: '+ Nova Cena' }),
    ).not.toBeInTheDocument();
  });

  it('chama onNovaCena ao clicar no botão do painel', async () => {
    const onNovaCena = vi.fn();
    const user = userEvent.setup();
    renderCanvas({ onNovaCena });

    await user.click(screen.getByRole('button', { name: '+ Nova Cena' }));
    expect(onNovaCena).toHaveBeenCalled();
  });

  it('chama onNodeClick com o id da cena ao clicar em um nó', () => {
    // Usa fireEvent (só o evento "click") em vez de userEvent.click: o
    // wrapper do nó também tem drag habilitado (d3-drag), e o mousedown que
    // o userEvent dispara acaba caindo num handler do d3 incompatível com o
    // jsdom (lê `event.view.document`, que aqui vem nulo).
    const onNodeClick = vi.fn();
    renderCanvas({ onNodeClick });

    fireEvent.click(screen.getByText(/Chegada na Cidade/));
    expect(onNodeClick).toHaveBeenCalledWith('cena1');
  });

  it('renderiza uma campanha sintética de 150 cenas sem travar (smoke de desempenho)', () => {
    const muitosNodes = Array.from({ length: 150 }, (_, i) => ({
      id: `cena-${i}`,
      type: 'cenaNode',
      position: { x: (i % 15) * 260, y: Math.floor(i / 15) * 160 },
      data: {
        cena: { titulo: `Cena ${i}`, estado: 'nao_iniciado' },
        cor: '#6b7280',
      },
    }));
    const muitasEdges = Array.from({ length: 149 }, (_, i) => ({
      id: `conexao-${i}`,
      source: `cena-${i}`,
      target: `cena-${i + 1}`,
    }));

    renderCanvas({ nodes: muitosNodes, edges: muitasEdges });

    expect(screen.getByText('Cena 0')).toBeInTheDocument();
  });
});
