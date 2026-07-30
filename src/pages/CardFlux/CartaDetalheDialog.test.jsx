import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CartaDetalheDialog from './CartaDetalheDialog';

const CARTA_COMPLETA = {
  nome: 'A Estrada que Não Existia',
  tipo: '👻 Evento Sobrenatural',
  raridade: 'Épica',
  deck: '🚩 Jornada',
  peso: 2,
  cd: 5,
  intensidade: 8,
  tags: 'Realidade, Ilusão, Mistério',
  linkImagem: 'https://i.imgur.com/xxh4CyT.png',
  descricaoGeral: 'Durante a viagem, uma nova estrada surge à frente.',
  comoApresentar: 'A estrada parece encurtar drasticamente o caminho.',
  mecanicasDesafios:
    'Percepção: notar inconsistências\nIntelecto: reconhecer fenômeno anormal',
  seConseguirem: 'O grupo percebe que a estrada não é natural.',
  seFalharem: 'Entram na estrada sem perceber o perigo.',
  recompensas: 'Acesso a local único',
  impactoMundo: 'Desorientação',
  ganchosNarrativos: 'Estrada aparece novamente',
};

describe('CartaDetalheDialog', () => {
  it('mostra título, subtítulo, stats, tags e as três seções de texto quando a carta tem todos os campos', () => {
    render(
      <CartaDetalheDialog open carta={CARTA_COMPLETA} onClose={vi.fn()} />,
    );

    expect(screen.getByText('A Estrada que Não Existia')).toBeInTheDocument();
    expect(
      screen.getByText('👻 Evento Sobrenatural · Épica'),
    ).toBeInTheDocument();

    expect(screen.getByText('🚩 Jornada')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('Ilusão')).toBeInTheDocument();

    expect(screen.getByText('Narrativa')).toBeInTheDocument();
    expect(screen.getByText('Descrição Geral')).toBeInTheDocument();
    expect(screen.getByText(CARTA_COMPLETA.descricaoGeral)).toBeInTheDocument();

    expect(screen.getByText('Resultados')).toBeInTheDocument();
    expect(screen.getByText('Se Falharem')).toBeInTheDocument();

    expect(screen.getByText('Consequências')).toBeInTheDocument();
    expect(screen.getByText('Ganchos Narrativos')).toBeInTheDocument();
  });

  it('não mostra seções cujos campos estão todos vazios', () => {
    render(
      <CartaDetalheDialog
        open
        carta={{
          nome: 'Carta Simples',
          descricaoGeral: 'Uma descrição qualquer.',
        }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Narrativa')).toBeInTheDocument();
    expect(screen.queryByText('Resultados')).not.toBeInTheDocument();
    expect(screen.queryByText('Consequências')).not.toBeInTheDocument();
  });
});
