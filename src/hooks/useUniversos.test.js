import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getUniversos = vi.fn();
vi.mock('service/storage', () => ({
  getUniversos: (...args) => getUniversos(...args),
}));

describe('useUniversos', () => {
  beforeEach(() => {
    vi.resetModules();
    getUniversos.mockReset();
  });

  it('busca getUniversos() na primeira montagem', async () => {
    getUniversos.mockResolvedValue([{ id: 'u1', Nome: 'Prime' }]);
    const { default: useUniversos } = await import('./useUniversos');

    const { result } = renderHook(() => useUniversos());

    expect(result.current.loadingUniversos).toBe(true);
    await waitFor(() => expect(result.current.loadingUniversos).toBe(false));
    expect(result.current.universos).toEqual([{ id: 'u1', Nome: 'Prime' }]);
    expect(getUniversos).toHaveBeenCalledTimes(1);
  });

  it('reutiliza o cache de módulo em uma segunda montagem, sem nova leitura', async () => {
    getUniversos.mockResolvedValue([{ id: 'u1', Nome: 'Prime' }]);
    const { default: useUniversos } = await import('./useUniversos');

    const first = renderHook(() => useUniversos());
    await waitFor(() =>
      expect(first.result.current.loadingUniversos).toBe(false),
    );

    const second = renderHook(() => useUniversos());

    expect(second.result.current.loadingUniversos).toBe(false);
    expect(second.result.current.universos).toEqual([
      { id: 'u1', Nome: 'Prime' },
    ]);
    expect(getUniversos).toHaveBeenCalledTimes(1);
  });

  it('invalidateUniversosCache força nova leitura na próxima montagem', async () => {
    getUniversos.mockResolvedValueOnce([{ id: 'u1', Nome: 'Prime' }]);
    const { default: useUniversos, invalidateUniversosCache } =
      await import('./useUniversos');

    const first = renderHook(() => useUniversos());
    await waitFor(() =>
      expect(first.result.current.loadingUniversos).toBe(false),
    );

    invalidateUniversosCache();
    getUniversos.mockResolvedValueOnce([{ id: 'u2', Nome: 'Segundo' }]);

    const second = renderHook(() => useUniversos());
    expect(second.result.current.loadingUniversos).toBe(true);
    await waitFor(() =>
      expect(second.result.current.loadingUniversos).toBe(false),
    );
    expect(second.result.current.universos).toEqual([
      { id: 'u2', Nome: 'Segundo' },
    ]);
    expect(getUniversos).toHaveBeenCalledTimes(2);
  });
});
