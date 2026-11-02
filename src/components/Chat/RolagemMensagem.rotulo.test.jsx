import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ChatMensagem from './ChatMensagem';

const rolagem = {
  modificador: 12,
  grupos: [{ quantidade: 3, faces: 8, resultados: [5, 6, 4] }],
  termos: [12],
  total: 27,
};

const renderRolagem = (extra = {}) =>
  render(
    <ChatMensagem
      mensagem={{
        id: 'm1',
        uid: 'u1',
        autorNome: 'Wesley',
        isMestre: false,
        tipo: 'rolagem',
        createdAt: new Date(),
        rolagem,
        ...extra,
      }}
      minha={false}
      podeApagar={false}
      onApagar={vi.fn()}
    />,
  );

describe('RolagemMensagem — rótulo', () => {
  it('sem rótulo mantém "rolou"', () => {
    renderRolagem();
    const linha = screen.getByTestId('chat-mensagem');
    expect(linha).toHaveTextContent('Wesley rolou');
    expect(linha).toHaveTextContent('= 27');
  });

  it('com rótulo troca "rolou" por "— rótulo ·"', () => {
    renderRolagem({ rotulo: 'Ataque: Golpe Duplo' });
    const linha = screen.getByTestId('chat-mensagem');
    expect(linha).not.toHaveTextContent('rolou');
    expect(linha.textContent).toMatch(
      /Wesley\s*—\s*Ataque: Golpe Duplo\s*·\s*3d8/,
    );
    expect(linha).toHaveTextContent('= 27');
  });

  it('rolagem secreta com rótulo também mostra o rótulo', () => {
    renderRolagem({ rotulo: 'Furtividade', secreta: true });
    const linha = screen.getByTestId('chat-mensagem');
    expect(linha).toHaveTextContent('secreta');
    expect(linha).toHaveTextContent('— Furtividade ·');
  });

  it('rótulo é texto, nunca HTML', () => {
    renderRolagem({ rotulo: '<b>x</b>' });
    const linha = screen.getByTestId('chat-mensagem');
    expect(linha.querySelector('b')).toBeNull();
    expect(linha).toHaveTextContent('<b>x</b>');
  });
});
