import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { enviarImagemUpload, uploadImagemDisponivel } from 'service/uploadImagem';

import ImagemUrlDialog from './ImagemUrlDialog';

vi.mock('service/uploadImagem', () => ({
  uploadImagemDisponivel: vi.fn(() => true),
  enviarImagemUpload: vi.fn(),
}));

// Canvas não existe no jsdom: a compressão devolve o próprio arquivo.
vi.mock('common/utils/imagemUpload', async importOriginal => ({
  ...(await importOriginal()),
  comprimirImagem: vi.fn(arquivo => Promise.resolve(arquivo)),
}));

const png = () => new File(['png'], 'mapa.png', { type: 'image/png' });

const renderDialog = (props = {}) => {
  const onConfirmar = vi.fn(() => Promise.resolve());
  const onClose = vi.fn();
  render(<ImagemUrlDialog open onClose={onClose} onConfirmar={onConfirmar} {...props} />);
  return { onConfirmar, onClose };
};

const escolher = arquivo =>
  fireEvent.change(screen.getByTestId('imagem-arquivo'), { target: { files: [arquivo] } });

describe('ImagemUrlDialog — enviar do PC', () => {
  beforeEach(() => {
    uploadImagemDisponivel.mockReturnValue(true);
    enviarImagemUpload.mockReset();
  });
  afterEach(() => vi.clearAllMocks());

  it('escolher arquivo mostra a prévia e "Enviar" posta o link do Cloudinary', async () => {
    enviarImagemUpload.mockResolvedValue('https://res.cloudinary.com/mesa/image/upload/v1/abc1234.png');
    const { onConfirmar } = renderDialog();
    expect(screen.getByText(/qualquer pessoa com o link pode vê-la/)).toBeInTheDocument();

    escolher(png());
    expect(await screen.findByAltText('Pré-visualização')).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/png/),
    );
    expect(screen.queryByLabelText('URL da imagem')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith('https://res.cloudinary.com/mesa/image/upload/v1/abc1234.png'));
    expect(enviarImagemUpload.mock.calls[0][0].name).toBe('mapa.png');
  });

  it('erro do envio aparece e o arquivo continua escolhido para tentar de novo', async () => {
    enviarImagemUpload.mockRejectedValueOnce(new Error('Limite de envios atingido.'));
    enviarImagemUpload.mockResolvedValueOnce('https://res.cloudinary.com/mesa/image/upload/v1/def5678.png');
    const { onConfirmar } = renderDialog();
    escolher(png());

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('Limite de envios atingido.')).toBeInTheDocument();
    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByText('mapa.png')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith('https://res.cloudinary.com/mesa/image/upload/v1/def5678.png'));
  });

  it('recusa arquivo que não é imagem', () => {
    renderDialog();
    escolher(new File(['x'], 'nota.pdf', { type: 'application/pdf' }));
    expect(screen.getByText(/Escolha um arquivo de imagem/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('arquivo vindo de colar/soltar abre na prévia com o aviso', async () => {
    renderDialog({ arquivoInicial: png(), avisoInicial: 'Envie uma imagem por vez — usamos a primeira.' });
    expect(await screen.findByAltText('Pré-visualização')).toBeInTheDocument();
    expect(screen.getByText(/Envie uma imagem por vez/)).toBeInTheDocument();
  });

  it('sem configuração de upload não há botão "Escolher do PC" (só o link)', () => {
    uploadImagemDisponivel.mockReturnValue(false);
    renderDialog();
    expect(screen.queryByRole('button', { name: 'Escolher do PC' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('URL da imagem')).toBeInTheDocument();
  });
});
