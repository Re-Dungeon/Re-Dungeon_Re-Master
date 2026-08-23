import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const canCreate = vi.fn(() => true);
const canWrite = vi.fn(() => true);
let authState;
vi.mock('context/AuthContext', () => ({
  useAuth: () => authState,
}));

const CURRENT_USER_UID = 'user-1';

const mockUniversosHook = vi.fn();
vi.mock('./useUniversos', () => ({
  default: (...args) => mockUniversosHook(...args),
}));

import useEntityFormGuard from './useEntityFormGuard';

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useEntityFormGuard', () => {
  beforeEach(() => {
    navigate.mockReset();
    canCreate.mockReset().mockReturnValue(true);
    canWrite.mockReset().mockReturnValue(true);
    authState = {
      currentUser: { uid: CURRENT_USER_UID },
      canCreate,
      canWrite,
      isAdmin: false,
      allowedUniversos: ['u1'],
      loadingPermissions: false,
    };
    mockUniversosHook.mockReset().mockReturnValue({
      universos: [
        { id: 'u1', Nome: 'Prime' },
        { id: 'u2', Nome: 'Segundo' },
      ],
      loadingUniversos: false,
    });
  });

  it('filtra universos por allowedUniversos quando não é admin', () => {
    const { result } = renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: null,
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    expect(result.current.universos).toEqual([{ id: 'u1', Nome: 'Prime' }]);
    expect(result.current.isEditing).toBe(false);
  });

  it('não filtra universos quando isAdmin é true', () => {
    authState.isAdmin = true;
    const { result } = renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: null,
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    expect(result.current.universos).toHaveLength(2);
  });

  it('não redireciona quando canCreate() retorna true (criação)', async () => {
    renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: null,
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    await waitFor(() => expect(canCreate).toHaveBeenCalled());
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redireciona para routeOnDeny quando canCreate() retorna false (criação)', async () => {
    canCreate.mockReturnValue(false);
    renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: null,
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/rota'));
  });

  it('avalia canWrite(universoDoItem) em vez de canCreate() quando está editando', async () => {
    canWrite.mockReturnValue(false);
    const { result } = renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: { id: '1', universo: 'u1' },
          universoDoItem: 'u1',
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    expect(result.current.isEditing).toBe(true);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/rota'));
    expect(canWrite).toHaveBeenCalledWith('u1');
    expect(canCreate).not.toHaveBeenCalled();
  });

  it('não avalia permissão nem redireciona enquanto loadingPermissions é true', () => {
    authState.loadingPermissions = true;
    renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: null,
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    expect(canCreate).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('repassa loadingUniversos de useUniversos', () => {
    mockUniversosHook.mockReturnValue({
      universos: [],
      loadingUniversos: true,
    });
    const { result } = renderHook(
      () =>
        useEntityFormGuard({
          itemParaEditar: null,
          routeOnDeny: '/rota',
        }),
      { wrapper },
    );

    expect(result.current.loadingUniversos).toBe(true);
  });

  describe('bypassUniversoPermission', () => {
    it('mostra todos os universos, ignorando allowedUniversos', () => {
      const { result } = renderHook(
        () =>
          useEntityFormGuard({
            itemParaEditar: null,
            routeOnDeny: '/rota',
            bypassUniversoPermission: true,
          }),
        { wrapper },
      );

      expect(result.current.universos).toHaveLength(2);
    });

    it('não redireciona ao criar, mesmo com canCreate() retornando false', async () => {
      canCreate.mockReturnValue(false);
      renderHook(
        () =>
          useEntityFormGuard({
            itemParaEditar: null,
            routeOnDeny: '/rota',
            bypassUniversoPermission: true,
          }),
        { wrapper },
      );

      await waitFor(() => expect(mockUniversosHook).toHaveBeenCalled());
      expect(navigate).not.toHaveBeenCalled();
      expect(canCreate).not.toHaveBeenCalled();
      expect(canWrite).not.toHaveBeenCalled();
    });

    it('não redireciona ao editar item do próprio usuário (mestreId === uid)', async () => {
      canWrite.mockReturnValue(false);
      renderHook(
        () =>
          useEntityFormGuard({
            itemParaEditar: { id: '1', mestreId: CURRENT_USER_UID },
            routeOnDeny: '/rota',
            bypassUniversoPermission: true,
          }),
        { wrapper },
      );

      await waitFor(() => expect(mockUniversosHook).toHaveBeenCalled());
      expect(navigate).not.toHaveBeenCalled();
    });

    it('redireciona ao editar item de outro usuário (mestreId !== uid) e não é admin', async () => {
      renderHook(
        () =>
          useEntityFormGuard({
            itemParaEditar: { id: '1', mestreId: 'outro-uid' },
            routeOnDeny: '/rota',
            bypassUniversoPermission: true,
          }),
        { wrapper },
      );

      await waitFor(() => expect(navigate).toHaveBeenCalledWith('/rota'));
    });

    it('não redireciona ao editar item de outro usuário quando isAdmin é true', async () => {
      authState.isAdmin = true;
      renderHook(
        () =>
          useEntityFormGuard({
            itemParaEditar: { id: '1', mestreId: 'outro-uid' },
            routeOnDeny: '/rota',
            bypassUniversoPermission: true,
          }),
        { wrapper },
      );

      await waitFor(() => expect(mockUniversosHook).toHaveBeenCalled());
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
