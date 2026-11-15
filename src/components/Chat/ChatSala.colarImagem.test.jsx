import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { uploadImagemDisponivel } from 'service/uploadImagem';

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

vi.mock('service/uploadImagem', () => ({
  uploadImagemDisponivel: vi.fn(() => true),
  enviarImagemUpload: vi.fn(),
}));

const renderSala = () =>
  render(
    <ChatSala
      mensagens={[]}
      currentUid="u1"
      onEnviarTexto={vi.fn(() => Promise.resolve())}
      onEnviarImagem={vi.fn(() => Promise.resolve())}
      onRolar={vi.fn(() => Promise.resolve())}
      onApagar={vi.fn()}
    />,
  );

const campo = () => screen.getByRole('textbox', { name: 'Mensagem' });
const png = nome => new File(['png'], nome, { type: 'image/png' });
const itemArquivo = arquivo => ({ kind: 'file', type: arquivo.type, getAsFile: () => arquivo });
const itemTexto = { kind: 'string', type: 'text/plain', getAsFile: () => null };

describe('ChatSala — colar e arrastar imagem', () => {
  beforeEach(() => {
    uploadImagemDisponivel.mockReturnValue(true);
  });
  afterEach(() => vi.clearAllMocks());

  it('Ctrl+V com imagem (mesmo com texto junto) abre o diálogo com a prévia', async () => {
    renderSala();
    fireEvent.paste(campo(), {
      clipboardData: { items: [itemTexto, itemArquivo(png('print.png'))], files: [] },
    });
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('print.png')).toBeInTheDocument();
    expect(await screen.findByAltText('Pré-visualização')).toBeInTheDocument();
  });

  it('Ctrl+V só com texto não abre o diálogo', () => {
    renderSala();
    fireEvent.paste(campo(), { clipboardData: { items: [itemTexto], files: [] } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('soltar duas imagens usa a primeira e avisa', async () => {
    const { container } = renderSala();
    const painel = container.firstChild;
    const dataTransfer = {
      types: ['Files'],
      items: [],
      files: [png('a.png'), png('b.png')],
    };
    fireEvent.dragEnter(painel, { dataTransfer });
    expect(screen.getByText('Solte para enviar a imagem')).toBeInTheDocument();
    fireEvent.drop(painel, { dataTransfer });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('Solte para enviar a imagem')).not.toBeInTheDocument();
    expect(screen.getByText('a.png')).toBeInTheDocument();
    expect(screen.getByText(/Envie uma imagem por vez/)).toBeInTheDocument();
  });

  it('sem configuração de upload, colar e soltar ficam como antes', () => {
    uploadImagemDisponivel.mockReturnValue(false);
    const { container } = renderSala();
    fireEvent.paste(campo(), {
      clipboardData: { items: [itemArquivo(png('print.png'))], files: [] },
    });
    fireEvent.dragEnter(container.firstChild, { dataTransfer: { types: ['Files'], files: [] } });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Solte para enviar a imagem')).not.toBeInTheDocument();
  });
});
