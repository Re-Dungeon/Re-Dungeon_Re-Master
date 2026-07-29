import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ImagePreviewPanel from './ImagePreviewPanel';

describe('ImagePreviewPanel', () => {
  it('mostra o placeholder quando src está vazio', () => {
    render(<ImagePreviewPanel src="" alt="Preview" />);

    expect(
      screen.getByText('Insira um link para ver o preview'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mostra a imagem quando src é válido', () => {
    render(
      <ImagePreviewPanel src="https://exemplo.com/img.png" alt="Preview" />,
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://exemplo.com/img.png');
  });

  it('mostra mensagem de erro quando a imagem falha ao carregar', () => {
    render(
      <ImagePreviewPanel src="https://exemplo.com/img.png" alt="Preview" />,
    );

    fireEvent.error(screen.getByRole('img'));

    expect(screen.getByText('Imagem não encontrada')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('reseta o erro quando src muda', () => {
    const { rerender } = render(
      <ImagePreviewPanel src="https://exemplo.com/img.png" alt="Preview" />,
    );

    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByText('Imagem não encontrada')).toBeInTheDocument();

    rerender(
      <ImagePreviewPanel src="https://exemplo.com/outra.png" alt="Preview" />,
    );

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://exemplo.com/outra.png',
    );
  });
});
