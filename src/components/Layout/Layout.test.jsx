import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';

let celular = false;
vi.mock('@mui/material/useMediaQuery', () => ({
  default: () => celular,
}));

vi.mock('components/Sidebar/Sidebar', () => ({
  default: () => <nav aria-label="Menu principal">Menu</nav>,
}));
vi.mock('components/BuscaGlobal/BuscaGlobal', () => ({ default: () => null }));
vi.mock('components/SessionTimers/SessionTimers', () => ({
  default: () => null,
}));

import Layout from './Layout';

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/a']}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/a" element={<Link to="/b">ir para b</Link>} />
          <Route path="/b" element={<p>página b</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe('Layout — menu lateral', () => {
  beforeEach(() => {
    celular = false;
  });

  it('a partir de 600px a sidebar fica fixa e não há botão de menu', () => {
    renderLayout();

    expect(screen.getByLabelText('Menu principal')).toBeInTheDocument();
    expect(screen.queryByLabelText('Abrir menu')).not.toBeInTheDocument();
  });

  it('no celular o menu só aparece na gaveta aberta pelo botão ☰', () => {
    celular = true;
    renderLayout();

    expect(screen.queryByLabelText('Menu principal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Abrir menu'));

    expect(screen.getByLabelText('Menu principal')).toBeInTheDocument();
  });

  it('a gaveta fecha ao navegar para outra página', async () => {
    celular = true;
    renderLayout();
    fireEvent.click(screen.getByLabelText('Abrir menu'));
    expect(screen.getByLabelText('Menu principal')).toBeInTheDocument();

    // A gaveta tapa a página (modal): navega pelo link por baixo dela.
    fireEvent.click(screen.getByText('ir para b'));

    await waitFor(() =>
      expect(screen.queryByLabelText('Menu principal')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('página b')).toBeInTheDocument();
  });
});
