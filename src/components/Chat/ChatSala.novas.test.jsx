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

const msg = (id, texto = `texto ${id}`) => ({
  id,
  uid: 'u2',
  autorNome: 'Fulano',
  tipo: 'texto',
  texto,
  createdAt: new Date(),
});

const props = {
  currentUid: 'u1',
  onEnviarTexto: vi.fn(),
  onEnviarImagem: vi.fn(),
  onRolar: vi.fn(),
  onApagar: vi.fn(),
};

// jsdom não tem layout: simula uma lista rolável de 1000px com janela de 200px.
const simularLista = (log, scrollTopInicial) => {
  let scrollTop = scrollTopInicial;
  Object.defineProperty(log, 'scrollHeight', { configurable: true, value: 1000 });
  Object.defineProperty(log, 'clientHeight', { configurable: true, value: 200 });
  Object.defineProperty(log, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: valor => {
      scrollTop = valor;
    },
  });
  return () => scrollTop;
};

const rolarPara = (log, topo) => {
  log.scrollTop = topo;
  fireEvent.scroll(log);
};

describe('ChatSala — pílula "Novas mensagens"', () => {
  it('não aparece quando a mensagem chega e o usuário está acompanhando o fim', () => {
    const { rerender } = render(<ChatSala {...props} mensagens={[msg('a')]} />);
    simularLista(screen.getByRole('log'), 800);
    rerender(<ChatSala {...props} mensagens={[msg('a'), msg('b')]} />);
    expect(screen.queryByRole('button', { name: /novas mensagens/i })).not.toBeInTheDocument();
  });

  it('aparece com a contagem quando chega mensagem com o usuário lendo mais acima', () => {
    const { rerender } = render(<ChatSala {...props} mensagens={[msg('a'), msg('b')]} />);
    const log = screen.getByRole('log');
    const lerTopo = simularLista(log, 0);
    rolarPara(log, 100);

    rerender(<ChatSala {...props} mensagens={[msg('a'), msg('b'), msg('c')]} />);
    expect(screen.getByRole('button', { name: 'Novas mensagens (1) ↓' })).toBeInTheDocument();
    expect(lerTopo()).toBe(100);

    rerender(
      <ChatSala {...props} mensagens={[msg('a'), msg('b'), msg('c'), msg('d'), msg('e')]} />,
    );
    expect(screen.getByRole('button', { name: 'Novas mensagens (3) ↓' })).toBeInTheDocument();
  });

  it('o clique rola até o fim e some com a pílula', () => {
    const { rerender } = render(<ChatSala {...props} mensagens={[msg('a')]} />);
    const log = screen.getByRole('log');
    const lerTopo = simularLista(log, 0);
    rolarPara(log, 100);
    rerender(<ChatSala {...props} mensagens={[msg('a'), msg('b')]} />);

    fireEvent.click(screen.getByRole('button', { name: /novas mensagens/i }));
    expect(lerTopo()).toBe(1000);
    expect(screen.queryByRole('button', { name: /novas mensagens/i })).not.toBeInTheDocument();

    // voltou a acompanhar: a próxima mensagem rola sozinha, sem pílula.
    rerender(<ChatSala {...props} mensagens={[msg('a'), msg('b'), msg('c')]} />);
    expect(screen.queryByRole('button', { name: /novas mensagens/i })).not.toBeInTheDocument();
  });

  it('some sozinha quando o usuário rola de volta até o fim', () => {
    const { rerender } = render(<ChatSala {...props} mensagens={[msg('a')]} />);
    const log = screen.getByRole('log');
    simularLista(log, 0);
    rolarPara(log, 100);
    rerender(<ChatSala {...props} mensagens={[msg('a'), msg('b')]} />);
    expect(screen.getByRole('button', { name: /novas mensagens/i })).toBeInTheDocument();

    rolarPara(log, 790);
    expect(screen.queryByRole('button', { name: /novas mensagens/i })).not.toBeInTheDocument();
  });

  it('mensagens antigas inseridas no topo não contam como novas', () => {
    const { rerender } = render(<ChatSala {...props} mensagens={[msg('c'), msg('d')]} />);
    const log = screen.getByRole('log');
    simularLista(log, 0);
    rolarPara(log, 100);

    rerender(<ChatSala {...props} mensagens={[msg('a'), msg('b'), msg('c'), msg('d')]} />);
    expect(screen.queryByRole('button', { name: /novas mensagens/i })).not.toBeInTheDocument();
  });
});
