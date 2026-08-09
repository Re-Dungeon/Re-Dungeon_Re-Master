import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const getUserPermissions = vi.fn();
vi.mock('service/storage', () => ({
  getUserPermissions: (...args) => getUserPermissions(...args),
}));

describe('usePermissions', () => {
  beforeEach(() => {
    vi.resetModules();
    getUserPermissions.mockReset();
  });

  it('sem currentUser, não busca permissões e libera loading com defaults', async () => {
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() => usePermissions(null));

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.allowedUniversos).toEqual([]);
    expect(getUserPermissions).not.toHaveBeenCalled();
  });

  it('usuário admin: canCreate() e canWrite() são true independente de allowedUniversos', async () => {
    getUserPermissions.mockResolvedValue({ isAdmin: true, universos: [] });
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() =>
      usePermissions({ uid: 'admin-uid' }),
    );

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canCreate()).toBe(true);
    expect(result.current.canWrite('universo-qualquer')).toBe(true);
  });

  it('allowedUniversos vazio: canCreate() e canWrite() são false', async () => {
    getUserPermissions.mockResolvedValue({ isAdmin: false, universos: [] });
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() => usePermissions({ uid: 'uid-1' }));

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.allowedUniversos).toEqual([]);
    expect(result.current.canCreate()).toBe(false);
    expect(result.current.canWrite('u1')).toBe(false);
  });

  it('allowedUniversos populado: canCreate() é true e canWrite() reflete os ids permitidos', async () => {
    getUserPermissions.mockResolvedValue({
      isAdmin: false,
      universos: ['u1', 'u2'],
    });
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() => usePermissions({ uid: 'uid-2' }));

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.allowedUniversos).toEqual(['u1', 'u2']);
    expect(result.current.canCreate()).toBe(true);
    expect(result.current.canWrite('u1')).toBe(true);
    expect(result.current.canWrite('u3')).toBe(false);
  });

  it('canWrite() aceita um array de ids e retorna true se puder escrever em pelo menos um', async () => {
    getUserPermissions.mockResolvedValue({
      isAdmin: false,
      universos: ['u1'],
    });
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() => usePermissions({ uid: 'uid-3' }));

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.canWrite(['u2', 'u1'])).toBe(true);
    expect(result.current.canWrite(['u2', 'u3'])).toBe(false);
  });

  it('documento userPermissions/{uid} ausente (getUserPermissions resolve com defaults)', async () => {
    getUserPermissions.mockResolvedValue({ isAdmin: false, universos: [] });
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() => usePermissions({ uid: 'sem-doc' }));

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.allowedUniversos).toEqual([]);
  });

  it('erro ao buscar permissões cai para isAdmin/allowedUniversos vazios', async () => {
    getUserPermissions.mockRejectedValue(new Error('boom'));
    const { default: usePermissions } = await import('./usePermissions');

    const { result } = renderHook(() => usePermissions({ uid: 'uid-4' }));

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.allowedUniversos).toEqual([]);
  });

  it('re-busca as permissões quando currentUser muda', async () => {
    getUserPermissions.mockResolvedValueOnce({
      isAdmin: false,
      universos: ['u1'],
    });
    const { default: usePermissions } = await import('./usePermissions');

    const { result, rerender } = renderHook(
      ({ user }) => usePermissions(user),
      { initialProps: { user: { uid: 'uid-a' } } },
    );

    await waitFor(() =>
      expect(result.current.loadingPermissions).toBe(false),
    );
    expect(result.current.allowedUniversos).toEqual(['u1']);

    getUserPermissions.mockResolvedValueOnce({
      isAdmin: false,
      universos: ['u2'],
    });
    rerender({ user: { uid: 'uid-b' } });

    await waitFor(() =>
      expect(result.current.allowedUniversos).toEqual(['u2']),
    );
    expect(getUserPermissions).toHaveBeenCalledTimes(2);
    expect(getUserPermissions).toHaveBeenNthCalledWith(2, 'uid-b');
  });
});
