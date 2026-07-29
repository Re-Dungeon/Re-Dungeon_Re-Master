import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const getRmCampanhas = vi.fn();
vi.mock('service/storage', () => ({
  getRmCampanhas: (...args) => getRmCampanhas(...args),
}));

let mockAuth = { currentUser: { uid: 'mestre-1' }, loading: false };
vi.mock('context/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

import { CampanhaProvider, useCampanha } from './CampanhaContext';

const CAMPANHAS_MOCK = [
  { id: 'c1', nome: 'Ascensão Carmesim', mestreId: 'mestre-1' },
  { id: 'c2', nome: 'Campanha de Outro Mestre', mestreId: 'mestre-2' },
];

const Consumidor = () => {
  const {
    campanhas,
    loadingCampanhas,
    campanhaAtivaId,
    campanhaAtiva,
    setCampanhaAtiva,
  } = useCampanha();

  if (loadingCampanhas) return <div>Carregando...</div>;

  return (
    <div>
      <div data-testid="campanhas-count">{campanhas.length}</div>
      <div data-testid="campanha-ativa-id">{campanhaAtivaId ?? 'nenhuma'}</div>
      <div data-testid="campanha-ativa-nome">
        {campanhaAtiva?.nome ?? 'nenhuma'}
      </div>
      {campanhas.map(c => (
        <button key={c.id} onClick={() => setCampanhaAtiva(c.id)}>
          Selecionar {c.nome}
        </button>
      ))}
      <button onClick={() => setCampanhaAtiva(null)}>Limpar seleção</button>
    </div>
  );
};

const renderComProvider = () =>
  render(
    <CampanhaProvider>
      <Consumidor />
    </CampanhaProvider>,
  );

describe('CampanhaContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuth = { currentUser: { uid: 'mestre-1' }, loading: false };
    getRmCampanhas.mockResolvedValue(CAMPANHAS_MOCK);
  });

  it('filtra as campanhas para mostrar só as do mestre logado', async () => {
    renderComProvider();

    await waitFor(() =>
      expect(screen.getByTestId('campanhas-count')).toHaveTextContent('1'),
    );
    expect(screen.getByText('Selecionar Ascensão Carmesim')).toBeInTheDocument();
    expect(
      screen.queryByText('Selecionar Campanha de Outro Mestre'),
    ).not.toBeInTheDocument();
  });

  it('não busca campanhas enquanto a autenticação ainda está carregando', () => {
    mockAuth = { currentUser: null, loading: true };
    renderComProvider();

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(getRmCampanhas).not.toHaveBeenCalled();
  });

  it('zera a lista quando não há usuário autenticado', async () => {
    mockAuth = { currentUser: null, loading: false };
    renderComProvider();

    await waitFor(() =>
      expect(screen.getByTestId('campanhas-count')).toHaveTextContent('0'),
    );
    expect(getRmCampanhas).not.toHaveBeenCalled();
  });

  it('seleciona uma campanha ativa e persiste em localStorage', async () => {
    const user = userEvent.setup();
    renderComProvider();

    await waitFor(() =>
      expect(screen.getByText('Selecionar Ascensão Carmesim')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Selecionar Ascensão Carmesim'));

    expect(screen.getByTestId('campanha-ativa-id')).toHaveTextContent('c1');
    expect(screen.getByTestId('campanha-ativa-nome')).toHaveTextContent(
      'Ascensão Carmesim',
    );
    expect(localStorage.getItem('remaster_campanha_ativa_id')).toBe('c1');
  });

  it('limpa a seleção ativa e remove do localStorage', async () => {
    const user = userEvent.setup();
    renderComProvider();

    await waitFor(() =>
      expect(screen.getByText('Selecionar Ascensão Carmesim')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Selecionar Ascensão Carmesim'));
    await user.click(screen.getByText('Limpar seleção'));

    expect(screen.getByTestId('campanha-ativa-id')).toHaveTextContent('nenhuma');
    expect(localStorage.getItem('remaster_campanha_ativa_id')).toBeNull();
  });

  it('limpa um id de campanha ativa salvo que não existe mais na lista', async () => {
    localStorage.setItem('remaster_campanha_ativa_id', 'id-fantasma');
    renderComProvider();

    await waitFor(() =>
      expect(screen.getByTestId('campanha-ativa-id')).toHaveTextContent(
        'nenhuma',
      ),
    );
    expect(localStorage.getItem('remaster_campanha_ativa_id')).toBeNull();
  });
});
