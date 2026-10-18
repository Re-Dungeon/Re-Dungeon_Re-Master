import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const addChatMensagem = vi.fn();
const removeChatMensagem = vi.fn();
const subscribeChatMensagens = vi.fn();
vi.mock('service/storage', () => ({
  addChatMensagem: (...args) => addChatMensagem(...args),
  removeChatMensagem: (...args) => removeChatMensagem(...args),
  subscribeChatMensagens: (...args) => subscribeChatMensagens(...args),
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
    campanhaAtiva = { id: 'c1', nome: 'Ascensão Carmesim', mestreId: 'm1' };
    addChatMensagem.mockResolvedValue();
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
        tipo: 'texto',
        texto: 'Ela range.',
        url: null,
      }),
    );
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
