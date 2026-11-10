import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { CHAT_JANELA_MENSAGENS, CHAT_PAGINA_ANTERIORES } from 'common/utils/chat';
import { getChatMensagensAntes, subscribeChatMensagens } from 'service/storage';
import useChatCampanha from './useChatCampanha';

// Só a paginação de "Carregar anteriores" é testada aqui; o resto do hook
// (áudio, macros, membro do chat) é isolado por mocks.
vi.mock('service/storage', () => ({
  addChatMensagem: vi.fn(),
  addChatRolagemSecreta: vi.fn(),
  getChatMensagensAntes: vi.fn(),
  removeChatMensagem: vi.fn(),
  removeChatRolagemSecreta: vi.fn(),
  subscribeChatMensagens: vi.fn(),
  subscribeChatSecretasDoMestre: vi.fn(() => vi.fn()),
  subscribeChatSecretasDoUsuario: vi.fn(() => vi.fn()),
}));
vi.mock('context/AudioMesaContext', () => ({
  useAudioDoChat: () => ({ erro: null, limparErro: vi.fn() }),
}));
vi.mock('hooks/useMacrosCampanha', () => ({
  default: () => ({
    macros: [],
    carregando: false,
    salvarMacro: vi.fn(),
    apagarMacro: vi.fn(),
    moverMacro: vi.fn(),
    erro: null,
    limparErro: vi.fn(),
  }),
}));
vi.mock('hooks/useMembroDoChat', () => ({ default: () => true }));

const AUTOR = {
  uid: 'u1',
  personagemId: 'p1',
  autorNome: 'Aldric',
  autorAvatar: null,
  isMestre: false,
};

const em = minuto => ({ toMillis: () => minuto * 60000 });
const msg = (id, minuto) => ({ id, uid: 'u2', tipo: 'texto', texto: id, createdAt: em(minuto) });

// Janela ao vivo cheia: m100..m199 (minutos 100..199).
const janelaCheia = () =>
  Array.from({ length: CHAT_JANELA_MENSAGENS }, (_, i) => msg(`m${100 + i}`, 100 + i));

const ids = result => result.current.mensagens.map(m => m.id);

describe('useChatCampanha — carregar anteriores', () => {
  let aoVivo;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    aoVivo = null;
    subscribeChatMensagens.mockImplementation((_campanhaId, onChange) => {
      aoVivo = onChange;
      return vi.fn();
    });
  });

  const montar = () => {
    const hook = renderHook(() => useChatCampanha('c1', AUTOR));
    return hook;
  };

  it('só oferece carregar quando a janela ao vivo está cheia', () => {
    const { result } = montar();
    act(() => aoVivo([msg('a', 1), msg('b', 2)]));
    expect(result.current.temMaisAntigas).toBe(false);

    act(() => aoVivo(janelaCheia()));
    expect(result.current.temMaisAntigas).toBe(true);
  });

  it('busca a página antes da mensagem mais antiga e a mescla à janela', async () => {
    getChatMensagensAntes.mockResolvedValue([msg('m098', 98), msg('m099', 99)]);
    const { result } = montar();
    act(() => aoVivo(janelaCheia()));

    let iniciou;
    await act(async () => {
      iniciou = await result.current.carregarAnteriores();
    });
    expect(iniciou).toBe(true);

    expect(getChatMensagensAntes).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ toMillis: expect.any(Function) }),
      CHAT_PAGINA_ANTERIORES,
    );
    expect(getChatMensagensAntes.mock.calls[0][1].toMillis()).toBe(100 * 60000);
    expect(ids(result).slice(0, 3)).toEqual(['m098', 'm099', 'm100']);
    expect(result.current.mensagens).toHaveLength(CHAT_JANELA_MENSAGENS + 2);
    // veio menos que uma página: acabou
    expect(result.current.temMaisAntigas).toBe(false);
  });

  it('com página completa continua oferecendo e usa a mais antiga já carregada como referência', async () => {
    const pagina1 = Array.from({ length: CHAT_PAGINA_ANTERIORES }, (_, i) =>
      msg(`a${i}`, 50 + i),
    );
    getChatMensagensAntes.mockResolvedValueOnce(pagina1).mockResolvedValueOnce([]);
    const { result } = montar();
    act(() => aoVivo(janelaCheia()));

    await act(async () => {
      await result.current.carregarAnteriores();
    });
    expect(result.current.temMaisAntigas).toBe(true);

    await act(async () => {
      await result.current.carregarAnteriores();
    });
    expect(getChatMensagensAntes).toHaveBeenCalledTimes(2);
    expect(getChatMensagensAntes.mock.calls[1][1].toMillis()).toBe(50 * 60000);
    expect(result.current.temMaisAntigas).toBe(false);

    // acabou: um novo pedido não busca nada
    let terceiro;
    await act(async () => {
      terceiro = await result.current.carregarAnteriores();
    });
    expect(terceiro).toBe(false);
    expect(getChatMensagensAntes).toHaveBeenCalledTimes(2);
  });

  it('mantém as antigas quando a janela ao vivo desliza e não repete ids', async () => {
    getChatMensagensAntes.mockResolvedValue([msg('m099', 99), msg('m100', 100)]);
    const { result } = montar();
    act(() => aoVivo(janelaCheia()));
    await act(async () => {
      await result.current.carregarAnteriores();
    });
    // m100 veio também na janela ao vivo: aparece uma vez só
    expect(ids(result).filter(id => id === 'm100')).toHaveLength(1);

    // chega m200 e m100 sai da janela ao vivo; m099 (carregada) continua
    act(() => aoVivo([...janelaCheia().slice(1), msg('m200', 200)]));
    expect(ids(result)).toContain('m099');
    expect(ids(result)).toContain('m200');
    expect(new Set(ids(result)).size).toBe(ids(result).length);
  });

  it('expõe carregandoAntigas durante a busca e ignora cliques repetidos', async () => {
    let resolver;
    getChatMensagensAntes.mockReturnValue(
      new Promise(resolve => {
        resolver = resolve;
      }),
    );
    const { result } = montar();
    act(() => aoVivo(janelaCheia()));

    let busca;
    act(() => {
      busca = result.current.carregarAnteriores();
    });
    expect(result.current.carregandoAntigas).toBe(true);
    act(() => {
      result.current.carregarAnteriores();
    });
    expect(getChatMensagensAntes).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolver([msg('m099', 99)]);
      await busca;
    });
    expect(result.current.carregandoAntigas).toBe(false);
  });

  it('erro na busca avisa e libera para tentar de novo', async () => {
    getChatMensagensAntes.mockRejectedValueOnce(new Error('falhou'));
    const { result } = montar();
    act(() => aoVivo(janelaCheia()));

    await act(async () => {
      await result.current.carregarAnteriores();
    });
    await waitFor(() =>
      expect(result.current.erro).toBe('Não foi possível carregar as mensagens anteriores.'),
    );
    expect(result.current.carregandoAntigas).toBe(false);
    expect(result.current.temMaisAntigas).toBe(true);
  });

  it('ao trocar de campanha descarta as antigas carregadas', async () => {
    getChatMensagensAntes.mockResolvedValue([msg('m099', 99)]);
    const hook = renderHook(({ campanhaId }) => useChatCampanha(campanhaId, AUTOR), {
      initialProps: { campanhaId: 'c1' },
    });
    act(() => aoVivo(janelaCheia()));
    await act(async () => {
      await hook.result.current.carregarAnteriores();
    });
    expect(ids(hook.result)).toContain('m099');

    hook.rerender({ campanhaId: 'c2' });
    act(() => aoVivo([msg('x', 5)]));
    expect(ids(hook.result)).toEqual(['x']);
  });
});
