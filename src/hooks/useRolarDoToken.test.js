import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { addChatMensagem } from 'service/storage';
import useRolarDoToken from './useRolarDoToken';

vi.mock('service/storage', () => ({ addChatMensagem: vi.fn() }));

const AUTOR_TOKEN = {
  uid: 'u1',
  personagemId: 'p1',
  autorNome: 'Aldric (token)',
  autorAvatar: null,
  isMestre: false,
  persona: 'jogador',
};

describe('useRolarDoToken', () => {
  const onErro = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    addChatMensagem.mockResolvedValue();
  });

  it('rola e posta a mensagem pública com o autor do token e o rótulo', async () => {
    const { result } = renderHook(() => useRolarDoToken('camp', { onErro }));
    let retorno;
    await act(async () => {
      retorno = await result.current({
        autor: AUTOR_TOKEN,
        expressao: '2d6+3',
        rotulo: 'Ataque: Golpe Duplo',
      });
    });
    expect(retorno).toBe(true);
    expect(addChatMensagem).toHaveBeenCalledTimes(1);
    const [campanhaId, mensagem] = addChatMensagem.mock.calls[0];
    expect(campanhaId).toBe('camp');
    expect(mensagem).toMatchObject({
      tipo: 'rolagem',
      autorNome: 'Aldric (token)',
      personagemId: 'p1',
      rotulo: 'Ataque: Golpe Duplo',
    });
    expect(mensagem.secreta).toBeUndefined();
    expect(mensagem.rolagem.grupos[0]).toMatchObject({ quantidade: 2, faces: 6 });
    expect(mensagem.rolagem.modificador).toBe(3);
  });

  it('aceita o prefixo /r e omite o rótulo vazio', async () => {
    const { result } = renderHook(() => useRolarDoToken('camp', { onErro }));
    await act(async () => {
      await result.current({ autor: AUTOR_TOKEN, expressao: '/r d20', rotulo: '  ' });
    });
    expect(addChatMensagem.mock.calls[0][1].rotulo).toBeUndefined();
  });

  it('expressão inválida volta { erro } sem postar nem avisar', async () => {
    const { result } = renderHook(() => useRolarDoToken('camp', { onErro }));
    let retorno;
    await act(async () => {
      retorno = await result.current({ autor: AUTOR_TOKEN, expressao: 'abc' });
    });
    expect(retorno.erro).toEqual(expect.any(String));
    expect(addChatMensagem).not.toHaveBeenCalled();
    expect(onErro).not.toHaveBeenCalled();
  });

  it('erro de escrita avisa e devolve false; sem autor não faz nada', async () => {
    addChatMensagem.mockRejectedValueOnce(new Error('x'));
    const { result } = renderHook(() => useRolarDoToken('camp', { onErro }));
    let retorno;
    await act(async () => {
      retorno = await result.current({ autor: AUTOR_TOKEN, expressao: '1d4' });
    });
    expect(retorno).toBe(false);
    expect(onErro).toHaveBeenCalledWith('Não foi possível enviar a rolagem.');
    await act(async () => {
      retorno = await result.current({ autor: null, expressao: '1d4' });
    });
    expect(retorno).toBe(false);
    expect(addChatMensagem).toHaveBeenCalledTimes(1);
  });
});
