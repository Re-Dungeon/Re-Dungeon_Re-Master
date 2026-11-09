import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import ChatMensagem from './ChatMensagem';

const mensagem = combate => ({
  id: 'm1',
  uid: 'u-mestre',
  autorNome: 'Mestre',
  isMestre: true,
  persona: 'mestre',
  tipo: 'combate',
  texto: '',
  url: null,
  createdAt: new Date(),
  combate,
});

const renderMensagem = (combate, props = {}) =>
  render(
    <ChatMensagem
      mensagem={mensagem(combate)}
      minha={false}
      podeApagar={false}
      onApagar={vi.fn()}
      {...props}
    />,
  );

describe('ChatMensagem — combate', () => {
  it('início: cartão centralizado com a lista de iniciativa e quem iniciou', () => {
    renderMensagem({
      evento: 'inicio',
      cenaId: 'c',
      rodada: 1,
      nome: 'Wesley',
      oculto: false,
      iniciativa: [
        { nome: 'Wesley', total: 17, d20: 12, reacao: 5 },
        { nome: 'Brina', total: 9, d20: 11, reacao: -2 },
      ],
    });
    const cartao = screen.getByTestId('chat-mensagem');
    expect(cartao).toHaveAttribute('data-combate', 'inicio');
    expect(cartao).toHaveTextContent('Combate iniciado');
    const lista = within(cartao).getByRole('list', { name: 'Iniciativa' });
    expect(
      within(lista)
        .getAllByRole('listitem')
        .map(item => item.textContent),
    ).toEqual(['Wesley 17 (d20 12 + Reação 5)', 'Brina 9 (d20 11 − Reação 2)']);
    expect(cartao).toHaveTextContent('Rodada 1 · Turno de Wesley');
    expect(cartao).toHaveTextContent(/Mestre · \d\d:\d\d/);
    // Sem balão nem avatar de mensagem comum.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('turno de oponente oculto, sem nome', () => {
    renderMensagem({ evento: 'turno', cenaId: 'c', rodada: 2, nome: null, oculto: true });
    expect(screen.getByTestId('chat-mensagem')).toHaveTextContent(
      'Turno de um oponente oculto',
    );
  });

  it('rodada nova e combate encerrado', () => {
    const { unmount } = renderMensagem({
      evento: 'rodada',
      cenaId: 'c',
      rodada: 3,
      nome: 'Brina',
      oculto: false,
    });
    expect(screen.getByTestId('chat-mensagem')).toHaveTextContent(
      'Rodada 3Turno de Brina',
    );
    unmount();
    renderMensagem({ evento: 'fim', cenaId: 'c' });
    expect(screen.getByTestId('chat-mensagem')).toHaveTextContent('Combate encerrado');
  });

  it('apagar só com podeApagar e confirma em popup estilizado', () => {
    const onApagar = vi.fn();
    const { unmount } = renderMensagem({ evento: 'fim', cenaId: 'c' });
    expect(
      screen.queryByRole('button', { name: 'Apagar mensagem' }),
    ).not.toBeInTheDocument();
    unmount();
    renderMensagem({ evento: 'fim', cenaId: 'c' }, { podeApagar: true, onApagar });
    fireEvent.click(screen.getByRole('button', { name: 'Apagar mensagem' }));
    expect(screen.getByText('Excluir mensagem?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onApagar).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }));
  });
});
