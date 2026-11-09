import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ChatSala from './ChatSala';

// O AudioDialog do Re:Master (dentro do ChatSala) importa storage/auth: sem
// estes mocks o teste inicializaria o Firebase de verdade (e quebra sem .env,
// como no CI). No site dos jogadores são inofensivos.
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

vi.mock('service/storage', () => ({
  getRmMusicasBibliotecaPorMestre: vi.fn(() => Promise.resolve([])),
  getRmMusicasPastasPorMestre: vi.fn(() => Promise.resolve([])),
  getRmPlaylistsPorMestre: vi.fn(() => Promise.resolve([])),
}));

const CHAVE = 'reDungeonChatHistorico_c1';

const renderSala = (props = {}) => {
  const onEnviarTexto = vi.fn(() => Promise.resolve());
  const onRolar = vi.fn(() => Promise.resolve());
  const utils = render(
    <ChatSala
      mensagens={[]}
      currentUid="u1"
      onEnviarTexto={onEnviarTexto}
      onEnviarImagem={vi.fn()}
      onRolar={onRolar}
      onApagar={vi.fn()}
      chaveHistorico={CHAVE}
      {...props}
    />,
  );
  return { ...utils, onEnviarTexto, onRolar };
};

const campo = () => screen.getByRole('textbox', { name: 'Mensagem' });
const tecla = key => fireEvent.keyDown(campo(), { key });

const enviar = async texto => {
  fireEvent.change(campo(), { target: { value: texto } });
  tecla('Enter');
  await waitFor(() => expect(campo()).toHaveValue(''));
};

describe('ChatSala — histórico do campo (↑/↓)', () => {
  afterEach(() => window.sessionStorage.clear());

  it('↑ traz o que foi enviado (inclusive comando), ↓ volta até limpar', async () => {
    const { onEnviarTexto, onRolar } = renderSala();
    await enviar('oi');
    await enviar('/r 1d20');
    expect(onEnviarTexto).toHaveBeenCalledWith('oi');
    expect(onRolar).toHaveBeenCalledTimes(1);

    tecla('ArrowUp');
    expect(campo()).toHaveValue('/r 1d20');
    tecla('ArrowUp');
    expect(campo()).toHaveValue('oi');
    tecla('ArrowUp');
    expect(campo()).toHaveValue('oi');
    tecla('ArrowDown');
    expect(campo()).toHaveValue('/r 1d20');
    tecla('ArrowDown');
    expect(campo()).toHaveValue('');
  });

  it('com texto digitado (ou item editado), as setas não trocam o texto', async () => {
    renderSala();
    await enviar('oi');

    fireEvent.change(campo(), { target: { value: 'escrevendo' } });
    tecla('ArrowUp');
    expect(campo()).toHaveValue('escrevendo');

    fireEvent.change(campo(), { target: { value: '' } });
    tecla('ArrowUp');
    expect(campo()).toHaveValue('oi');
    fireEvent.change(campo(), { target: { value: 'oi!' } });
    tecla('ArrowUp');
    expect(campo()).toHaveValue('oi!');
  });

  it('comando inválido não entra no histórico', async () => {
    renderSala();
    await enviar('oi');

    fireEvent.change(campo(), { target: { value: '/r 1d7' } });
    tecla('Enter');
    expect(campo()).toHaveValue('/r 1d7');

    fireEvent.change(campo(), { target: { value: '' } });
    tecla('ArrowUp');
    expect(campo()).toHaveValue('oi');
  });

  it('envio que falha não entra no histórico', async () => {
    const onEnviarTexto = vi.fn(() => Promise.reject(new Error('rede')));
    renderSala({ onEnviarTexto });
    fireEvent.change(campo(), { target: { value: 'falhou' } });
    tecla('Enter');
    await waitFor(() => expect(onEnviarTexto).toHaveBeenCalled());

    fireEvent.change(campo(), { target: { value: '' } });
    tecla('ArrowUp');
    expect(campo()).toHaveValue('');
  });

  it('o histórico sobrevive a desmontar e montar com a mesma chave', async () => {
    const { unmount } = renderSala();
    await enviar('lembra de mim');
    unmount();

    renderSala();
    tecla('ArrowUp');
    expect(campo()).toHaveValue('lembra de mim');
  });
});
