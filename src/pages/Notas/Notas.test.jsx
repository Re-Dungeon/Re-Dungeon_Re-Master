import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const getRmNotasPorCampanha = vi.fn();
const removeRmNota = vi.fn();
const getRmCenas = vi.fn();
vi.mock('service/storage', () => ({
  getRmNotasPorCampanha: (...args) => getRmNotasPorCampanha(...args),
  removeRmNota: (...args) => removeRmNota(...args),
  getRmCenas: (...args) => getRmCenas(...args),
}));

const CURRENT_USER_UID = 'm1';
let authState;
vi.mock('context/AuthContext', () => ({
  useAuth: () => authState,
}));

const CAMPANHA_ATIVA = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: CURRENT_USER_UID,
};
let campanhaAtiva = CAMPANHA_ATIVA;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva,
    loadingCampanhas: false,
  }),
}));

import Notas from './Notas';
import NotaDetalhes from './NotaDetalhes';

const NOTAS_MOCK = [
  {
    id: 'nota1',
    campanhaId: 'c1',
    titulo: 'Ideia para a próxima sessão',
    conteudo: 'O vilão pode aparecer.',
  },
  {
    id: 'nota2',
    campanhaId: 'c1',
    titulo: 'Lembrete',
    conteudo: 'Não esquecer a recompensa.',
    cenaId: 'cena1',
  },
];
const CENAS_MOCK = [
  { id: 'cena1', campanhaId: 'c1', titulo: 'Chegada na Cidade' },
];

const renderNotas = () =>
  render(
    <MemoryRouter>
      <Notas />
    </MemoryRouter>,
  );

describe('Notas (lista da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { currentUser: { uid: CURRENT_USER_UID }, isAdmin: false };
    campanhaAtiva = CAMPANHA_ATIVA;
    getRmNotasPorCampanha.mockResolvedValue(NOTAS_MOCK);
    getRmCenas.mockResolvedValue(CENAS_MOCK);
  });

  it('lista as notas da campanha ativa e mostra a identidade Universo', async () => {
    renderNotas();

    await waitFor(() =>
      expect(
        screen.getByText('Ideia para a próxima sessão'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText('Lembrete')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Universo' })).toBeInTheDocument();
  });

  it('mostra a cena vinculada quando a nota tem cenaId', async () => {
    renderNotas();

    await waitFor(() =>
      expect(screen.getByText('Cena: Chegada na Cidade')).toBeInTheDocument(),
    );
  });

  it('mostra o estado vazio quando não há notas', async () => {
    getRmNotasPorCampanha.mockResolvedValue([]);
    renderNotas();

    await waitFor(() =>
      expect(screen.getByText('Nenhuma nota cadastrada')).toBeInTheDocument(),
    );
  });

  it('remove uma nota', async () => {
    removeRmNota.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderNotas();

    await waitFor(() =>
      expect(
        screen.getByText('Ideia para a próxima sessão'),
      ).toBeInTheDocument(),
    );
    await user.click(
      screen.getByLabelText('Remover nota Ideia para a próxima sessão'),
    );

    await waitFor(() => expect(removeRmNota).toHaveBeenCalledWith('nota1'));
  });

  it('renderiza filtros por tipo real com contagem correta', async () => {
    getRmNotasPorCampanha.mockResolvedValue([
      {
        id: 'nota1',
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: CURRENT_USER_UID,
        titulo: 'Amaterasu',
        tipo: 'Divindade',
      },
      {
        id: 'nota2',
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: CURRENT_USER_UID,
        titulo: 'Aiko',
        tipo: 'Personagem',
      },
      {
        id: 'nota3',
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: CURRENT_USER_UID,
        titulo: 'Mármore do sol',
        tipo: 'Divindade',
      },
    ]);

    renderNotas();

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Divindades/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /Divindades 2/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Personagens 1/i })).toBeInTheDocument();
  });

  it('não mostra ações de criar/editar/remover quando a campanha ativa não é do usuário logado', async () => {
    campanhaAtiva = { ...CAMPANHA_ATIVA, mestreId: 'outro-uid' };
    renderNotas();

    await waitFor(() =>
      expect(
        screen.getByText('Ideia para a próxima sessão'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByLabelText('Editar nota Ideia para a próxima sessão'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Nova entidade' }),
    ).not.toBeInTheDocument();
  });

  it('carrega a página de detalhes de uma entidade pelo id da rota', async () => {
    getRmNotasPorCampanha.mockResolvedValue([
      {
        id: 'nota1',
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: 'm1',
        titulo: 'Amaterasu',
        tipo: 'Divindade',
        resumo: 'Deusa do sol e da justiça.',
        imagemUrl: 'https://example.com/amaterasu.jpg',
        conteudo: '**Amaterasu** foi venerada no reino.\n\n- O sol era seu símbolo.\n- Sua corte guardava os ancestrais.',
        tags: ['sol', 'divindade'],
      },
    ]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/notas/nota1' }]}>
        <Routes>
          <Route path="/notas/:notaId" element={<NotaDetalhes />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Amaterasu' }),
      ).toBeInTheDocument(),
    );
    expect(screen.getAllByText('Divindade').length).toBeGreaterThan(1);
    expect(screen.getByText('Deusa do sol e da justiça.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar para Universo' })).toBeInTheDocument();
  });

  it('renderiza destaque, sublinhado e citação suportados pelo markdown do editor', async () => {
    getRmNotasPorCampanha.mockResolvedValue([
      {
        id: 'nota2',
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: 'm1',
        titulo: 'Registro do mestre',
        tipo: 'Local',
        conteudo: '__sublinhado__\n\n~~apagado~~\n\n> A lua não mente.',
      },
    ]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/notas/nota2' }]}>
        <Routes>
          <Route path="/notas/:notaId" element={<NotaDetalhes />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Registro do mestre' }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByText('sublinhado')).toBeInTheDocument();
    const sublinhado = screen.getByText('sublinhado');
    expect(sublinhado.tagName).toBe('U');
    expect(screen.getByText('apagado')).toBeInTheDocument();
    expect(screen.getByText('A lua não mente.')).toBeInTheDocument();
  });

  it('renderiza links, imagens, vídeos e separadores de conteúdo HTML armazenados sem expor as tags', async () => {
    getRmNotasPorCampanha.mockResolvedValue([
      {
        id: 'nota3',
        campanhaId: 'c1',
        universoId: 'u1',
        mestreId: 'm1',
        titulo: 'Conteúdo rico',
        tipo: 'Local',
        conteudo: '<p>Clique <a href="https://example.com" target="_blank" rel="noopener noreferrer">aqui</a> para acessar.</p><img src="https://example.com/image.png" alt="Exemplo" /><hr /><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="Vídeo de exemplo" allowfullscreen></iframe>',
      },
    ]);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/notas/nota3' }]}>
        <Routes>
          <Route path="/notas/:notaId" element={<NotaDetalhes />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Conteúdo rico' }),
      ).toBeInTheDocument(),
    );

    expect(screen.getByRole('link', { name: 'aqui' })).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByAltText('Exemplo')).toHaveAttribute('src', 'https://example.com/image.png');
    expect(screen.getByTitle('Vídeo de exemplo')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.queryByText(/<a href=|<img|<hr|<iframe/i)).not.toBeInTheDocument();
  });
});
