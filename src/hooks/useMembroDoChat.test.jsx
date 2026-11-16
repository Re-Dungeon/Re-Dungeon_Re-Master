import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { setChatMembro } from 'service/storage';
import useMembroDoChat, {
  JANELA_REGISTRO_MEMBRO_MS,
  esquecerRegistroMembroDoChat,
  limparRegistroMembroDoChat,
  registrarMembroDoChat,
} from './useMembroDoChat';

vi.mock('service/storage', () => ({ setChatMembro: vi.fn() }));

const OPCOES = { uid: 'u1', personagemId: 'p1', isMestre: false };

describe('useMembroDoChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    limparRegistroMembroDoChat();
    setChatMembro.mockResolvedValue();
  });

  it('grava o ponteiro e só então libera as escutas', async () => {
    const { result } = renderHook(() => useMembroDoChat('c1', OPCOES));
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
    expect(setChatMembro).toHaveBeenCalledWith('c1', 'u1', 'p1');
  });

  it('mestre libera sem gravar', () => {
    const { result } = renderHook(() => useMembroDoChat('c1', { ...OPCOES, isMestre: true }));
    expect(result.current).toBe(true);
    expect(setChatMembro).not.toHaveBeenCalled();
  });

  it('duas montagens ao mesmo tempo (chat + grid) gravam uma vez só', async () => {
    const a = renderHook(() => useMembroDoChat('c1', OPCOES));
    const b = renderHook(() => useMembroDoChat('c1', OPCOES));
    await waitFor(() => expect(a.result.current && b.result.current).toBe(true));
    expect(setChatMembro).toHaveBeenCalledTimes(1);
  });

  it('segunda montagem na janela não grava e libera logo', async () => {
    const primeira = renderHook(() => useMembroDoChat('c1', OPCOES));
    await waitFor(() => expect(primeira.result.current).toBe(true));
    primeira.unmount();

    const segunda = renderHook(() => useMembroDoChat('c1', OPCOES));
    await waitFor(() => expect(segunda.result.current).toBe(true));
    expect(setChatMembro).toHaveBeenCalledTimes(1);
  });

  it('o registro fica só em memória: recarregar (memória limpa) grava de novo', async () => {
    await registrarMembroDoChat('c1', 'u1', 'p1');
    expect(setChatMembro).toHaveBeenCalledTimes(1);
    expect(Object.keys(localStorage).some(chave => chave.startsWith('chat_membro_'))).toBe(false);
    limparRegistroMembroDoChat();
    await registrarMembroDoChat('c1', 'u1', 'p1');
    expect(setChatMembro).toHaveBeenCalledTimes(2);
  });

  it('esquecer o registro de uma campanha faz a próxima montagem gravar', async () => {
    await registrarMembroDoChat('c1', 'u1', 'p1');
    await registrarMembroDoChat('c2', 'u1', 'p1');
    esquecerRegistroMembroDoChat('c1', 'u1');
    await registrarMembroDoChat('c1', 'u1', 'p1');
    await registrarMembroDoChat('c2', 'u1', 'p1');
    expect(setChatMembro).toHaveBeenCalledTimes(3);
  });

  it('trocar de personagem grava na hora', async () => {
    const { result, rerender } = renderHook(
      ({ personagemId }) => useMembroDoChat('c1', { ...OPCOES, personagemId }),
      { initialProps: { personagemId: 'p1' } },
    );
    await waitFor(() => expect(result.current).toBe(true));
    rerender({ personagemId: 'p2' });
    await waitFor(() => expect(setChatMembro).toHaveBeenCalledTimes(2));
    expect(setChatMembro).toHaveBeenLastCalledWith('c1', 'u1', 'p2');
  });

  it('campanha ou usuário diferentes gravam', async () => {
    await registrarMembroDoChat('c1', 'u1', 'p1');
    await registrarMembroDoChat('c2', 'u1', 'p1');
    await registrarMembroDoChat('c1', 'u2', 'p1');
    expect(setChatMembro).toHaveBeenCalledTimes(3);
  });

  it('passadas 12 h regrava (mantém a janela de atividade de 14 dias)', async () => {
    const t0 = 1_700_000_000_000;
    await registrarMembroDoChat('c1', 'u1', 'p1', t0);
    await registrarMembroDoChat('c1', 'u1', 'p1', t0 + JANELA_REGISTRO_MEMBRO_MS - 1);
    expect(setChatMembro).toHaveBeenCalledTimes(1);
    await registrarMembroDoChat('c1', 'u1', 'p1', t0 + JANELA_REGISTRO_MEMBRO_MS);
    expect(setChatMembro).toHaveBeenCalledTimes(2);
  });

  it('falha não vira registro: avisa e a próxima montagem tenta de novo', async () => {
    setChatMembro.mockRejectedValueOnce(new Error('negado'));
    const onFalha = vi.fn();
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useMembroDoChat('c1', { ...OPCOES, onFalha }));
    await waitFor(() => expect(onFalha).toHaveBeenCalledWith('c1'));
    expect(result.current).toBe(false);
    unmount();

    const outra = renderHook(() => useMembroDoChat('c1', OPCOES));
    await waitFor(() => expect(outra.result.current).toBe(true));
    expect(setChatMembro).toHaveBeenCalledTimes(2);
    erro.mockRestore();
  });
});
