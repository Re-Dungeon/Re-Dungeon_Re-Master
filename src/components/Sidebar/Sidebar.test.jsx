import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let mockAuth = {};
vi.mock('context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

import Sidebar from './Sidebar';

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );

describe('Sidebar', () => {
  beforeEach(() => {
    mockAuth = {
      currentUser: null,
      logout: vi.fn(),
      isAdmin: false,
      allowedUniversos: [],
      loadingPermissions: false,
    };
  });

  it('não mostra itens de navegação nem o aviso de permissão quando não há usuário logado', () => {
    renderSidebar();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Você ainda não tem acesso a nenhum Universo/),
    ).not.toBeInTheDocument();
  });

  it('não mostra nada (nem menu nem aviso) enquanto as permissões ainda carregam', () => {
    mockAuth = {
      ...mockAuth,
      currentUser: { uid: 'u1', email: 'mestre@example.com' },
      loadingPermissions: true,
    };
    renderSidebar();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Você ainda não tem acesso a nenhum Universo/),
    ).not.toBeInTheDocument();
  });

  it('mostra o aviso de permissão em vez do menu quando o usuário não tem nenhum Universo liberado', () => {
    mockAuth = {
      ...mockAuth,
      currentUser: { uid: 'u1', email: 'mestre@example.com' },
      isAdmin: false,
      allowedUniversos: [],
      loadingPermissions: false,
    };
    renderSidebar();

    expect(
      screen.getByText(/Você ainda não tem acesso a nenhum Universo/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('mostra o menu de navegação quando o usuário tem pelo menos um Universo liberado', () => {
    mockAuth = {
      ...mockAuth,
      currentUser: { uid: 'u1', email: 'mestre@example.com' },
      isAdmin: false,
      allowedUniversos: ['universo-1'],
      loadingPermissions: false,
    };
    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Campanha')).toBeInTheDocument();
    expect(
      screen.queryByText(/Você ainda não tem acesso a nenhum Universo/),
    ).not.toBeInTheDocument();
  });

  it('mostra o menu de navegação para admin mesmo sem nenhum Universo liberado', () => {
    mockAuth = {
      ...mockAuth,
      currentUser: { uid: 'u1', email: 'admin@example.com' },
      isAdmin: true,
      allowedUniversos: [],
      loadingPermissions: false,
    };
    renderSidebar();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
