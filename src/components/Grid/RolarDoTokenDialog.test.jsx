import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import RolarDoTokenDialog from './RolarDoTokenDialog';

const grupos = [
  {
    id: 'ataque',
    titulo: 'Ataque',
    itens: [
      { id: 'c1', rotulo: 'Golpe Duplo', expressao: '3d8+12' },
      {
        id: 'c2',
        rotulo: 'Soco',
        expressao: '',
        desabilitado: true,
        motivo: 'Sem dados',
      },
    ],
  },
  {
    id: 'arte',
    titulo: 'Artes',
    itens: [{ id: 'a1', rotulo: 'Bola de Fogo', expressao: '8d6' }],
  },
];

const montar = (onRolar, extra) => {
  const onClose = vi.fn();
  render(
    <RolarDoTokenDialog
      open
      token={{ nome: 'Wesley' }}
      grupos={grupos}
      onRolar={onRolar}
      onClose={onClose}
      {...extra}
    />,
  );
  return onClose;
};

describe('RolarDoTokenDialog', () => {
  it('toque num item rola com a fórmula e o rótulo e fecha', async () => {
    const onRolar = vi.fn().mockResolvedValue(true);
    const onClose = montar(onRolar);
    expect(screen.getByText('3d8+12')).toBeTruthy();
    fireEvent.click(screen.getByText('Golpe Duplo'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onRolar).toHaveBeenCalledWith('3d8+12', 'Golpe Duplo');
  });

  it('item desabilitado mostra o motivo e não rola', () => {
    const onRolar = vi.fn();
    montar(onRolar);
    expect(screen.getByText('Sem dados')).toBeTruthy();
    expect(screen.getByText('Soco').closest('button').disabled).toBe(true);
  });

  it('rolagem livre: Enter envia expressão e rótulo opcional', async () => {
    const onRolar = vi.fn().mockResolvedValue(true);
    const onClose = montar(onRolar);
    fireEvent.change(screen.getByLabelText('Rótulo (opcional)'), {
      target: { value: 'Fúria' },
    });
    const campo = screen.getByLabelText('Expressão');
    fireEvent.change(campo, { target: { value: '2d6+3' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    await waitFor(() => expect(onRolar).toHaveBeenCalledWith('2d6+3', 'Fúria'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('mostra o erro devolvido e mantém aberto', async () => {
    const onRolar = vi.fn().mockResolvedValue({ erro: 'Expressão inválida' });
    const onClose = montar(onRolar);
    fireEvent.change(screen.getByLabelText('Expressão'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByText('Rolar'));
    expect(await screen.findByText('Expressão inválida')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sem permitirSecreta não há opção secreta', () => {
    montar(vi.fn());
    expect(screen.queryByLabelText('Secreta (só o mestre vê)')).toBeNull();
  });

  it('com permitirSecreta, o item rola com { secreta: false } por padrão', async () => {
    const onRolar = vi.fn().mockResolvedValue(true);
    montar(onRolar, { permitirSecreta: true });
    fireEvent.click(screen.getByText('Golpe Duplo'));
    await waitFor(() =>
      expect(onRolar).toHaveBeenCalledWith('3d8+12', 'Golpe Duplo', { secreta: false }),
    );
  });

  it('marcar "Secreta" faz a rolagem livre sair secreta', async () => {
    const onRolar = vi.fn().mockResolvedValue(true);
    montar(onRolar, { permitirSecreta: true });
    fireEvent.click(screen.getByLabelText('Secreta (só o mestre vê)'));
    fireEvent.change(screen.getByLabelText('Expressão'), { target: { value: '2d6+3' } });
    fireEvent.click(screen.getByText('Rolar'));
    await waitFor(() =>
      expect(onRolar).toHaveBeenCalledWith('2d6+3', undefined, { secreta: true }),
    );
  });

  it('tem botão Fechar e limita o rótulo a 100', () => {
    const onClose = montar(vi.fn());
    expect(screen.getByLabelText('Rótulo (opcional)').getAttribute('maxlength')).toBe(
      '100',
    );
    fireEvent.click(screen.getByText('Fechar'));
    expect(onClose).toHaveBeenCalled();
  });
});
