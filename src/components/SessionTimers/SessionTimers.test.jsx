import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SessionTimers from './SessionTimers';

const abrirPopover = () => {
  fireEvent.click(
    screen.getByLabelText('Cronômetro de sessão e temporizadores'),
  );
};

describe('SessionTimers (widget do Header — cronômetro de sessão + temporizadores)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('inicia parado, mostrando 00:00 no tempo de sessão', () => {
    render(<SessionTimers />);
    abrirPopover();

    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('conta o tempo de sessão quando iniciado', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.click(screen.getByLabelText('Iniciar tempo de sessão'));
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('00:03')).toBeInTheDocument();
  });

  it('pausa o tempo de sessão e para de incrementar', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.click(screen.getByLabelText('Iniciar tempo de sessão'));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByLabelText('Pausar tempo de sessão'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('00:02')).toBeInTheDocument();
  });

  it('zera o tempo de sessão', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.click(screen.getByLabelText('Iniciar tempo de sessão'));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    fireEvent.click(screen.getByLabelText('Zerar tempo de sessão'));

    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('não adiciona um temporizador com duração 0', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('Nenhum temporizador ativo.')).toBeInTheDocument();
  });

  it('adiciona um temporizador nomeado, conta regressivamente e marca esgotado ao chegar em 0', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.change(screen.getByLabelText('Rótulo do novo temporizador'), {
      target: { value: 'A ponte desaba' },
    });
    fireEvent.change(screen.getByLabelText('Segundos do novo temporizador'), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(screen.getByText('A ponte desaba')).toBeInTheDocument();
    expect(screen.getByText('00:03')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('Esgotado!')).toBeInTheDocument();
  });

  it('pausa um temporizador e ele não continua contando', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.change(screen.getByLabelText('Minutos do novo temporizador'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    fireEvent.click(screen.getByLabelText('Pausar temporizador Temporizador'));
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('reinicia um temporizador de volta à duração original', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.change(screen.getByLabelText('Segundos do novo temporizador'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.getByText('00:06')).toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText('Reiniciar temporizador Temporizador'),
    );

    expect(screen.getByText('00:10')).toBeInTheDocument();
  });

  it('remove um temporizador', () => {
    render(<SessionTimers />);
    abrirPopover();

    fireEvent.change(screen.getByLabelText('Minutos do novo temporizador'), {
      target: { value: '1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    fireEvent.click(screen.getByLabelText('Remover temporizador Temporizador'));

    expect(screen.getByText('Nenhum temporizador ativo.')).toBeInTheDocument();
  });
});
