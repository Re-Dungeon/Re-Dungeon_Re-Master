import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import useAcumuladorRecurso, { ATRASO_ACUMULADOR_MS } from './useAcumuladorRecurso';

const avancar = ms =>
  act(async () => {
    vi.advanceTimersByTime(ms);
  });

describe('useAcumuladorRecurso', () => {
  let gravar;

  beforeEach(() => {
    vi.useFakeTimers();
    gravar = vi.fn(() => Promise.resolve());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('N cliques rápidos viram uma escrita só, com o valor final', async () => {
    const { result } = renderHook(() => useAcumuladorRecurso(10, gravar));
    expect(result.current.valor).toBe(10);

    act(() => result.current.definir(9));
    act(() => result.current.definir(8));
    act(() => result.current.definir(7));
    expect(result.current.valor).toBe(7);
    expect(gravar).not.toHaveBeenCalled();

    await avancar(ATRASO_ACUMULADOR_MS);
    expect(gravar).toHaveBeenCalledTimes(1);
    expect(gravar).toHaveBeenCalledWith(7);
  });

  it('o prazo recomeça a cada clique', async () => {
    const { result } = renderHook(() => useAcumuladorRecurso(10, gravar));
    act(() => result.current.definir(9));
    await avancar(700);
    act(() => result.current.definir(8));
    await avancar(700);
    expect(gravar).not.toHaveBeenCalled();
    await avancar(100);
    expect(gravar).toHaveBeenCalledTimes(1);
    expect(gravar).toHaveBeenCalledWith(8);
  });

  it('descarregar grava na hora e o prazo não grava de novo', async () => {
    const { result } = renderHook(() => useAcumuladorRecurso(10, gravar));
    act(() => result.current.definir(4));
    act(() => result.current.descarregar());
    expect(gravar).toHaveBeenCalledWith(4);
    await avancar(2000);
    expect(gravar).toHaveBeenCalledTimes(1);
  });

  it('desmontar com cliques pendentes grava (não descarta)', () => {
    const { result, unmount } = renderHook(() => useAcumuladorRecurso(10, gravar));
    act(() => result.current.definir(9));
    act(() => result.current.definir(8));
    unmount();
    expect(gravar).toHaveBeenCalledTimes(1);
    expect(gravar).toHaveBeenCalledWith(8);
  });

  it('voltar ao valor de partida não grava', async () => {
    const { result } = renderHook(() => useAcumuladorRecurso(10, gravar));
    act(() => result.current.definir(9));
    act(() => result.current.definir(10));
    await avancar(2000);
    expect(gravar).not.toHaveBeenCalled();
    expect(result.current.valor).toBe(10);
  });

  it('mantém o valor novo até a ficha chegar e depois passa a mostrar o dela', async () => {
    const { result, rerender } = renderHook(
      ({ externo }) => useAcumuladorRecurso(externo, gravar),
      { initialProps: { externo: 10 } },
    );
    act(() => result.current.definir(9));
    await avancar(ATRASO_ACUMULADOR_MS);
    expect(result.current.valor).toBe(9);

    rerender({ externo: 9 });
    expect(result.current.valor).toBe(9);
    rerender({ externo: 12 });
    expect(result.current.valor).toBe(12);
  });

  it('falha: volta ao valor do servidor e chama onFalha', async () => {
    const erro = new Error('negado');
    gravar.mockRejectedValue(erro);
    const onFalha = vi.fn();
    const { result } = renderHook(() => useAcumuladorRecurso(10, gravar, { onFalha }));
    act(() => result.current.definir(6));
    await avancar(ATRASO_ACUMULADOR_MS);
    expect(onFalha).toHaveBeenCalledWith(erro);
    expect(result.current.valor).toBe(10);
  });

  it('clique durante a escrita em andamento grava o novo valor final depois', async () => {
    const { result } = renderHook(() => useAcumuladorRecurso(10, gravar));
    act(() => result.current.definir(9));
    await avancar(ATRASO_ACUMULADOR_MS);
    act(() => result.current.definir(8));
    await avancar(ATRASO_ACUMULADOR_MS);
    expect(gravar).toHaveBeenCalledTimes(2);
    expect(gravar).toHaveBeenNthCalledWith(1, 9);
    expect(gravar).toHaveBeenNthCalledWith(2, 8);
  });
});
