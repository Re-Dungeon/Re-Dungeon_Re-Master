import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('lista as consequências e confirma', async () => {
    const onConfirmar = vi.fn().mockResolvedValue();
    render(
      <ConfirmDialog
        open
        titulo="Excluir Núcleo?"
        mensagem="Fogo será removido."
        consequencias={['2 Artes', '', '1 Variante']}
        onConfirmar={onConfirmar}
        onCancelar={vi.fn()}
      />,
    );

    expect(screen.getByText('Também será apagado:')).toBeInTheDocument();
    expect(screen.getByText('2 Artes')).toBeInTheDocument();
    expect(screen.getByText('1 Variante')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(onConfirmar).toHaveBeenCalledTimes(1));
  });

  it('com exigirDigitar, só libera depois de digitar o texto exato', () => {
    const onConfirmar = vi.fn();
    render(
      <ConfirmDialog
        open
        titulo="Excluir campanha?"
        exigirDigitar="Ruínas de Kael"
        onConfirmar={onConfirmar}
        onCancelar={vi.fn()}
      />,
    );

    const botao = screen.getByRole('button', { name: 'Excluir' });
    expect(botao).toBeDisabled();
    const campo = screen.getByLabelText('Digite "Ruínas de Kael" para confirmar');
    fireEvent.change(campo, { target: { value: 'Ruínas' } });
    expect(botao).toBeDisabled();
    fireEvent.change(campo, { target: { value: 'Ruínas de Kael' } });
    expect(botao).toBeEnabled();
  });

  it('Cancelar não confirma e um erro na confirmação mantém o diálogo aberto', async () => {
    const onCancelar = vi.fn();
    const onConfirmar = vi.fn().mockRejectedValue(new Error('offline'));
    render(
      <ConfirmDialog
        open
        titulo="Excluir?"
        onConfirmar={onConfirmar}
        onCancelar={onCancelar}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled(),
    );
    expect(screen.getByText('Excluir?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });
});
