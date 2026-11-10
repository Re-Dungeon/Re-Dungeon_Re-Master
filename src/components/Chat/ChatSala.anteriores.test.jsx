import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ChatSala from './ChatSala';

// O AudioDialog do Re:Master (dentro do ChatSala) importa storage/auth: sem
// estes mocks o teste inicializaria o Firebase de verdade. No site dos
// jogadores são inofensivos.
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

vi.mock('service/storage', () => ({
  getRmMusicasBibliotecaPorMestre: vi.fn(() => Promise.resolve([])),
  getRmMusicasPastasPorMestre: vi.fn(() => Promise.resolve([])),
  getRmPlaylistsPorMestre: vi.fn(() => Promise.resolve([])),
}));

const msg = (id, createdAt = new Date()) => ({
  id,
  uid: 'u2',
  autorNome: 'Fulano',
  tipo: 'texto',
  texto: `texto ${id}`,
  createdAt,
});

const ontem = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

const props = {
  currentUid: 'u1',
  onEnviarTexto: vi.fn(),
  onEnviarImagem: vi.fn(),
  onRolar: vi.fn(),
  onApagar: vi.fn(),
};

describe('ChatSala — Carregar anteriores', () => {
  it('não mostra o botão sem a função ou sem mais mensagens', () => {
    const { rerender } = render(<ChatSala {...props} mensagens={[msg('a')]} temMaisAnteriores />);
    expect(screen.queryByRole('button', { name: /carregar anteriores/i })).not.toBeInTheDocument();

    rerender(
      <ChatSala
        {...props}
        mensagens={[msg('a')]}
        onCarregarAnteriores={vi.fn()}
        temMaisAnteriores={false}
      />,
    );
    expect(screen.queryByRole('button', { name: /carregar anteriores/i })).not.toBeInTheDocument();
  });

  it('clicar pede as anteriores e passa a mostrar o histórico de outros dias', () => {
    const onCarregarAnteriores = vi.fn(() => Promise.resolve(true));
    render(
      <ChatSala
        {...props}
        mensagens={[msg('antiga', ontem()), msg('hoje')]}
        onCarregarAnteriores={onCarregarAnteriores}
        temMaisAnteriores
      />,
    );
    expect(screen.queryByText('texto antiga')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /carregar anteriores/i }));

    expect(onCarregarAnteriores).toHaveBeenCalledTimes(1);
    expect(screen.getByText('texto antiga')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar histórico' })).toBeInTheDocument();
  });

  it('fica desabilitado enquanto carrega', () => {
    render(
      <ChatSala
        {...props}
        mensagens={[msg('a')]}
        onCarregarAnteriores={vi.fn()}
        temMaisAnteriores={false}
        carregandoAnteriores
      />,
    );
    expect(screen.getByRole('button', { name: /carregar anteriores/i })).toBeDisabled();
  });

  it('mantém o ponto de leitura quando as anteriores entram no topo', () => {
    const onCarregarAnteriores = vi.fn(() => Promise.resolve(true));
    const base = {
      ...props,
      onCarregarAnteriores,
      temMaisAnteriores: true,
    };
    const { rerender } = render(<ChatSala {...base} mensagens={[msg('c'), msg('d')]} />);

    const log = screen.getByRole('log');
    let altura = 500;
    let topo = 20;
    Object.defineProperty(log, 'scrollHeight', { configurable: true, get: () => altura });
    Object.defineProperty(log, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(log, 'scrollTop', {
      configurable: true,
      get: () => topo,
      set: valor => {
        topo = valor;
      },
    });
    fireEvent.scroll(log);

    fireEvent.click(screen.getByRole('button', { name: /carregar anteriores/i }));
    rerender(<ChatSala {...base} mensagens={[msg('c'), msg('d')]} carregandoAnteriores />);

    // chegam 2 mensagens antigas no topo: a lista cresce 300px
    altura = 800;
    rerender(
      <ChatSala
        {...base}
        mensagens={[msg('a'), msg('b'), msg('c'), msg('d')]}
        carregandoAnteriores={false}
      />,
    );

    expect(topo).toBe(320);
  });
});
