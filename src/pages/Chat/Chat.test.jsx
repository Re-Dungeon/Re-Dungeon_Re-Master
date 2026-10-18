import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addChatMensagem = vi.fn();
const removeChatMensagem = vi.fn();
const subscribeChatMensagens = vi.fn();
const getPersonagens = vi.fn();
const getRmCampanhaNpcs = vi.fn();
const getRmCampanhaCriaturas = vi.fn();
const addChatRolagemSecreta = vi.fn();
const subscribeChatSecretasDoMestre = vi.fn();
const getChatMacros = vi.fn();
vi.mock('service/storage', () => ({
  addChatMensagem: (...args) => addChatMensagem(...args),
  removeChatMensagem: (...args) => removeChatMensagem(...args),
  subscribeChatMensagens: (...args) => subscribeChatMensagens(...args),
  getPersonagens: (...args) => getPersonagens(...args),
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  getRmCampanhaCriaturas: (...args) => getRmCampanhaCriaturas(...args),
  addChatRolagemSecreta: (...args) => addChatRolagemSecreta(...args),
  removeChatRolagemSecreta: vi.fn(),
  setChatMembro: vi.fn(),
  subscribeChatSecretasDoMestre: (...args) =>
    subscribeChatSecretasDoMestre(...args),
  subscribeChatSecretasDoUsuario: vi.fn(() => vi.fn()),
  getChatMacros: (...args) => getChatMacros(...args),
  addChatMacro: vi.fn(),
  updateChatMacro: vi.fn(),
  removeChatMacro: vi.fn(),
}));

vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'm1' } }),
}));

const notifyError = vi.fn();
vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({ notifyError }),
}));

let campanhaAtiva;
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva, loadingCampanhas: false }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

import Chat from './Chat';

const MENSAGENS = [
  {
    id: 'msg1',
    uid: 'jogador-1',
    personagemId: 'p1',
    autorNome: 'Aldric',
    isMestre: false,
    tipo: 'texto',
    texto: 'Abro a porta devagar.',
    url: null,
    createdAt: new Date(),
  },
  {
    id: 'msg2',
    uid: 'jogador-1',
    personagemId: 'p1',
    autorNome: 'Aldric',
    isMestre: false,
    tipo: 'imagem',
    texto: '',
    url: 'https://media.tenor.com/abc/porta.gif',
    createdAt: new Date(),
  },
];

const renderChat = () =>
  render(
    <MemoryRouter>
      <Chat />
    </MemoryRouter>,
  );

describe('Chat (Re:Master)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campanhaAtiva = {
      id: 'c1',
      nome: 'Ascensão Carmesim',
      universoId: 'u1',
      mestreId: 'm1',
    };
    getPersonagens.mockResolvedValue([
      {
        id: 'n1',
        tipo: 'NPC',
        nome: 'Bartolomeu',
        universo: 'u1',
        campanhas: ['c1'],
        linkImagem: 'https://ex.com/bart.png',
      },
      {
        id: 'cr1',
        tipo: 'Criatura',
        nome: 'Rato Gigante',
        universo: 'u1',
        campanhas: ['c1'],
      },
    ]);
    getRmCampanhaNpcs.mockResolvedValue([]);
    getRmCampanhaCriaturas.mockResolvedValue([]);
    addChatMensagem.mockResolvedValue();
    addChatRolagemSecreta.mockResolvedValue();
    subscribeChatSecretasDoMestre.mockImplementation(() => vi.fn());
    getChatMacros.mockResolvedValue([
      {
        id: 'mc1',
        nome: 'encontros',
        descricao: '',
        codigo: 'enviar(1)',
        somenteMestre: true,
        ordem: 1,
      },
    ]);
    removeChatMensagem.mockResolvedValue();
    subscribeChatMensagens.mockImplementation((_id, onChange) => {
      onChange(MENSAGENS);
      return vi.fn();
    });
  });

  it('assina o chat da campanha ativa e renderiza texto e GIF como imagem', async () => {
    renderChat();

    expect(
      await screen.findByText('Abro a porta devagar.'),
    ).toBeInTheDocument();
    expect(subscribeChatMensagens).toHaveBeenCalledWith(
      'c1',
      expect.any(Function),
      expect.any(Function),
    );
    expect(screen.getByAltText('Imagem enviada por Aldric')).toHaveAttribute(
      'src',
      'https://media.tenor.com/abc/porta.gif',
    );
  });

  it('envia mensagem assinada como Mestre', async () => {
    const user = userEvent.setup();
    renderChat();
    await screen.findByText('Abro a porta devagar.');

    await user.type(screen.getByLabelText('Mensagem'), 'Ela range.{Enter}');

    await waitFor(() =>
      expect(addChatMensagem).toHaveBeenCalledWith('c1', {
        uid: 'm1',
        personagemId: null,
        autorNome: 'Mestre',
        autorAvatar: null,
        isMestre: true,
        persona: 'mestre',
        tipo: 'texto',
        texto: 'Ela range.',
        url: null,
      }),
    );
  });

  it('mestre fala como um NPC da mesa', async () => {
    const user = userEvent.setup();
    renderChat();
    await screen.findByText('Abro a porta devagar.');

    await user.click(screen.getByLabelText(/falando como/i));
    expect(
      await screen.findByRole('option', { name: /rato gigante/i }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /bartolomeu/i }));

    await user.type(screen.getByLabelText('Mensagem'), 'O que vai ser?{Enter}');

    await waitFor(() =>
      expect(addChatMensagem).toHaveBeenCalledWith('c1', {
        uid: 'm1',
        personagemId: null,
        autorNome: 'Bartolomeu',
        autorAvatar: 'https://ex.com/bart.png',
        isMestre: true,
        persona: 'npc',
        tipo: 'texto',
        texto: 'O que vai ser?',
        url: null,
      }),
    );
  });

  it('mestre rola como NPC pelo comando, em segredo', async () => {
    const user = userEvent.setup();
    renderChat();
    await screen.findByText('Abro a porta devagar.');

    await user.click(screen.getByLabelText(/falando como/i));
    await user.click(
      await screen.findByRole('option', { name: /bartolomeu/i }),
    );
    await user.type(screen.getByLabelText('Mensagem'), '/gr 1d20+2{Enter}');

    await waitFor(() =>
      expect(addChatRolagemSecreta).toHaveBeenCalledWith(
        'c1',
        'm1',
        expect.objectContaining({
          tipo: 'rolagem',
          secreta: true,
          isMestre: true,
          persona: 'npc',
          autorNome: 'Bartolomeu',
        }),
      ),
    );
    expect(addChatMensagem).not.toHaveBeenCalled();
  });

  it('mestre vê as rolagens secretas dos jogadores', async () => {
    subscribeChatSecretasDoMestre.mockImplementation((_id, _uid, onChange) => {
      onChange([
        {
          id: 's1',
          uid: 'jogador-1',
          donoUid: 'jogador-1',
          autorNome: 'Aldric',
          isMestre: false,
          persona: 'jogador',
          tipo: 'rolagem',
          secreta: true,
          rolagem: {
            grupos: [{ quantidade: 1, faces: 20, resultados: [20] }],
            termos: [],
            modificador: 0,
            total: 20,
          },
          createdAt: new Date(),
        },
      ]);
      return vi.fn();
    });
    renderChat();

    const etiqueta = await screen.findByText('secreta');
    expect(etiqueta.closest('[data-testid="chat-mensagem"]')).toHaveTextContent(
      'Aldric rolou 1d20 = 20 {[20]}',
    );
    expect(subscribeChatSecretasDoMestre).toHaveBeenCalledWith(
      'c1',
      'm1',
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('mestre vê todas as macros (inclusive só mestre) e pode gerenciar', async () => {
    const user = userEvent.setup();
    renderChat();
    await screen.findByText('Abro a porta devagar.');
    await waitFor(() =>
      expect(getChatMacros).toHaveBeenCalledWith('c1', {
        incluirSomenteMestre: true,
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Macros' }));
    expect(await screen.findByText('encontros')).toBeInTheDocument();
    expect(screen.getByText('só mestre')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /adicionar macro/i }),
    ).toBeInTheDocument();
  });

  it('mestre pode apagar mensagem de jogador', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderChat();
    await screen.findByText('Abro a porta devagar.');

    const [primeiroApagar] = screen.getAllByRole('button', {
      name: /apagar mensagem/i,
    });
    await user.click(primeiroApagar);

    await waitFor(() =>
      expect(removeChatMensagem).toHaveBeenCalledWith('c1', 'msg1'),
    );
  });

  it('sem campanha ativa, volta para a tela de Campanha', async () => {
    campanhaAtiva = null;
    renderChat();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/campanha'));
    expect(subscribeChatMensagens).not.toHaveBeenCalled();
  });
});
