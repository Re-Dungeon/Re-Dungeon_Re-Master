import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useStableListKeys from './useStableListKeys';

describe('useStableListKeys', () => {
  it('gera um id por item inicial', () => {
    const { result } = renderHook(() => useStableListKeys(3));

    expect(result.current.keys).toHaveLength(3);
    const [a, b, c] = result.current.keys;
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('addKey acrescenta um novo id ao final', () => {
    const { result } = renderHook(() => useStableListKeys(1));
    const originalFirstKey = result.current.keys[0];

    act(() => {
      result.current.addKey();
    });

    expect(result.current.keys).toHaveLength(2);
    expect(result.current.keys[0]).toBe(originalFirstKey);
  });

  it('removeKey remove o id da posição certa e mantém os ids dos itens restantes', () => {
    const { result } = renderHook(() => useStableListKeys(3));
    const [keyA, keyB, keyC] = result.current.keys;

    act(() => {
      result.current.removeKey(1);
    });

    expect(result.current.keys).toEqual([keyA, keyC]);
    expect(result.current.keys).not.toContain(keyB);
  });
});
