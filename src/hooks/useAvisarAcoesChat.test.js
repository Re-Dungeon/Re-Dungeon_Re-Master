import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { subscribeGridAvisarAcoesChat } from 'service/storage';
import useAvisarAcoesChat from './useAvisarAcoesChat';

vi.mock('service/storage', () => ({
  subscribeGridAvisarAcoesChat: vi.fn(),
}));

let emitir;
let falhar;
const cancelar = vi.fn();

describe('useAvisarAcoesChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeGridAvisarAcoesChat.mockImplementation((_c, onChange, onError) => {
      emitir = onChange;
      falhar = onError;
      return cancelar;
    });
  });

  it('começa desligado e acompanha a opção do mestre', () => {
    const { result } = renderHook(() => useAvisarAcoesChat('c1'));
    expect(subscribeGridAvisarAcoesChat).toHaveBeenCalledWith(
      'c1',
      expect.any(Function),
      expect.any(Function),
    );
    expect(result.current).toBe(false);

    act(() => emitir(true));
    expect(result.current).toBe(true);

    act(() => emitir(false));
    expect(result.current).toBe(false);
  });

  it('erro na leitura volta a desligado', () => {
    const { result } = renderHook(() => useAvisarAcoesChat('c1'));
    act(() => emitir(true));
    act(() => falhar(new Error('negado')));
    expect(result.current).toBe(false);
  });

  it('sem campanha não escuta', () => {
    const { result } = renderHook(() => useAvisarAcoesChat(null));
    expect(subscribeGridAvisarAcoesChat).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  it('trocar de campanha não reaproveita o valor da anterior', () => {
    const { result, rerender, unmount } = renderHook(
      ({ id }) => useAvisarAcoesChat(id),
      { initialProps: { id: 'c1' } },
    );
    act(() => emitir(true));
    rerender({ id: 'c2' });
    expect(result.current).toBe(false);
    expect(cancelar).toHaveBeenCalledTimes(1);
    unmount();
    expect(cancelar).toHaveBeenCalledTimes(2);
  });
});
