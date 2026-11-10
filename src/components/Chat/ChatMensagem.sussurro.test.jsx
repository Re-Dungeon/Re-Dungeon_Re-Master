import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ChatMensagem from './ChatMensagem';

const sussurro = extra => ({
  id: 's1',
  uid: 'u1',
  autorNome: 'Wesley',
  isMestre: false,
  persona: 'jogador',
  tipo: 'texto',
  texto: 'psiu, vem cá',
  url: null,
  sussurro: true,
  paraNome: 'Mestre',
  createdAt: new Date(),
  ...extra,
});

const renderMensagem = (mensagem, minha) =>
  render(
    <ChatMensagem
      mensagem={mensagem}
      minha={minha}
      podeApagar={false}
      onApagar={vi.fn()}
    />,
  );

describe('ChatMensagem — sussurro', () => {
  it('quem sussurrou vê "Sussurro para X"', () => {
    renderMensagem(sussurro(), true);
    expect(screen.getByText('🤫 Sussurro para Mestre')).toBeInTheDocument();
    expect(screen.getByText('psiu, vem cá')).toBeInTheDocument();
  });

  it('o destinatário vê "X sussurrou"', () => {
    renderMensagem(
      sussurro({ uid: 'm1', autorNome: 'Mestre', isMestre: true, paraNome: 'Wesley' }),
      false,
    );
    expect(screen.getByText('🤫 Mestre sussurrou')).toBeInTheDocument();
  });

  it('mensagem comum não ganha a etiqueta', () => {
    const { container } = renderMensagem(sussurro({ sussurro: false }), false);
    expect(container.querySelector('[data-sussurro]')).toBeNull();
  });
});
