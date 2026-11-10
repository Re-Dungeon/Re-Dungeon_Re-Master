import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ChatSala from './ChatSala';

// O AudioDialog do Re:Master (dentro do ChatSala) importa storage/auth: sem
// estes mocks o teste inicializaria o Firebase de verdade.
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

vi.mock('service/storage', () => ({
  getRmMusicasBibliotecaPorMestre: vi.fn(() => Promise.resolve([])),
  getRmMusicasPastasPorMestre: vi.fn(() => Promise.resolve([])),
  getRmPlaylistsPorMestre: vi.fn(() => Promise.resolve([])),
}));

const JOGADORES = [
  { uid: 'u-wesley', nome: 'Wesley Chase' },
  { uid: 'u-ana', nome: 'Ana' },
  { uid: 'u-clara', nome: 'Ana Clara' },
];

const renderSala = props => {
  const handlers = {
    onEnviarTexto: vi.fn(() => Promise.resolve()),
    onEnviarImagem: vi.fn(),
    onRolar: vi.fn(),
    onApagar: vi.fn(),
  };
  render(<ChatSala mensagens={[]} currentUid="u1" {...handlers} {...props} />);
  return handlers;
};

const enviar = texto => {
  fireEvent.change(screen.getByLabelText('Mensagem'), { target: { value: texto } });
  fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));
};

describe('ChatSala — sussurro (/w)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('jogador: "/w mestre ..." sussurra e não vai para o chat público', async () => {
    const onSussurrar = vi.fn(() => Promise.resolve());
    const { onEnviarTexto } = renderSala({ onSussurrar });
    enviar('/w mestre posso abrir o baú?');

    await waitFor(() =>
      expect(onSussurrar).toHaveBeenCalledWith({
        jogadorUid: null,
        paraNome: 'Mestre',
        texto: 'posso abrir o baú?',
      }),
    );
    expect(onEnviarTexto).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByLabelText('Mensagem')).toHaveValue(''));
  });

  it('mestre: escolhe o jogador pelo começo do nome', async () => {
    const onSussurrar = vi.fn(() => Promise.resolve());
    const { onEnviarTexto } = renderSala({ onSussurrar, destinatariosSussurro: JOGADORES });
    enviar('/w wes cuidado com o altar');

    await waitFor(() =>
      expect(onSussurrar).toHaveBeenCalledWith({
        jogadorUid: 'u-wesley',
        paraNome: 'Wesley Chase',
        texto: 'cuidado com o altar',
      }),
    );
    expect(onEnviarTexto).not.toHaveBeenCalled();
  });

  it('nome desconhecido ou ambíguo mostra o erro e mantém o texto', () => {
    const onSussurrar = vi.fn();
    const { onEnviarTexto } = renderSala({ onSussurrar, destinatariosSussurro: JOGADORES });

    enviar('/w zeca oi');
    expect(screen.getByText(/Não encontrei "zeca"/)).toBeInTheDocument();
    expect(screen.getByLabelText('Mensagem')).toHaveValue('/w zeca oi');

    enviar('/w an oi');
    expect(
      screen.getByText('"an" combina com Ana e Ana Clara. Digite mais letras do nome.'),
    ).toBeInTheDocument();
    expect(onSussurrar).not.toHaveBeenCalled();
    expect(onEnviarTexto).not.toHaveBeenCalled();
  });

  it('sem onSussurrar, "/w" nunca vira mensagem pública', () => {
    const { onEnviarTexto } = renderSala();
    enviar('/w mestre segredo');
    expect(screen.getByText('Sussurros não estão disponíveis aqui.')).toBeInTheDocument();
    expect(onEnviarTexto).not.toHaveBeenCalled();
  });

  it('se o envio falhar, o texto fica no campo para tentar de novo', async () => {
    const onSussurrar = vi.fn(() => Promise.reject(new Error('recusado')));
    renderSala({ onSussurrar });
    enviar('/w oi');
    await waitFor(() => expect(onSussurrar).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByLabelText('Mensagem')).toHaveValue('/w oi'));
  });

  it('texto comum continua indo para o chat público', async () => {
    const onSussurrar = vi.fn();
    const { onEnviarTexto } = renderSala({ onSussurrar });
    enviar('olá, mesa');
    await waitFor(() => expect(onEnviarTexto).toHaveBeenCalledWith('olá, mesa'));
    expect(onSussurrar).not.toHaveBeenCalled();
  });
});
