import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const getPersonagens = vi.fn();
const getPersonagensJogaveis = vi.fn();
const getRmCampanhaNpcs = vi.fn();
const getRmCampanhaCriaturas = vi.fn();
const getRmCampanhaJogadores = vi.fn();
vi.mock('service/storage', () => ({
  getPersonagens: (...args) => getPersonagens(...args),
  getPersonagensJogaveis: (...args) => getPersonagensJogaveis(...args),
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  getRmCampanhaCriaturas: (...args) => getRmCampanhaCriaturas(...args),
  getRmCampanhaJogadores: (...args) => getRmCampanhaJogadores(...args),
}));

const notifyError = vi.fn();
vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({ notifyError }),
}));

import useFontesDaMesa from './useFontesDaMesa';

const CAMPANHA = { id: 'c1', universoId: 'u1', mestreId: 'm1' };

describe('useFontesDaMesa — cache de personagens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPersonagens.mockResolvedValue([]);
    getPersonagensJogaveis.mockResolvedValue([]);
    getRmCampanhaNpcs.mockResolvedValue([]);
    getRmCampanhaCriaturas.mockResolvedValue([]);
    getRmCampanhaJogadores.mockResolvedValue([]);
  });

  it('lê só o universo da campanha, usando o cache na primeira carga e ignorando-o ao recarregar', async () => {
    const { result } = renderHook(() =>
      useFontesDaMesa(CAMPANHA, { incluirJogadores: true }),
    );

    await waitFor(() => expect(result.current.campanhaId).toBe('c1'));
    expect(getPersonagens).toHaveBeenLastCalledWith('u1', { forcar: false });
    expect(getPersonagensJogaveis).toHaveBeenLastCalledWith('u1', {
      forcar: false,
    });

    act(() => result.current.recarregar());

    await waitFor(() =>
      expect(getPersonagens).toHaveBeenLastCalledWith('u1', { forcar: true }),
    );
    expect(getPersonagensJogaveis).toHaveBeenLastCalledWith('u1', {
      forcar: true,
    });
  });

  it('os clones também recebem a opção forcar (primeira carga usa cache, recarregar ignora)', async () => {
    const { result } = renderHook(() =>
      useFontesDaMesa(CAMPANHA, { incluirJogadores: true }),
    );

    await waitFor(() => expect(result.current.campanhaId).toBe('c1'));
    expect(getRmCampanhaNpcs).toHaveBeenLastCalledWith('c1', 'u1', 'm1', {
      forcar: false,
    });
    expect(getRmCampanhaCriaturas).toHaveBeenLastCalledWith('c1', 'u1', 'm1', {
      forcar: false,
    });
    expect(getRmCampanhaJogadores).toHaveBeenLastCalledWith('c1', 'u1', 'm1', {
      forcar: false,
    });

    act(() => result.current.recarregar());

    await waitFor(() =>
      expect(getRmCampanhaNpcs).toHaveBeenLastCalledWith('c1', 'u1', 'm1', {
        forcar: true,
      }),
    );
  });

  it('não relê quando o objeto campanha muda de identidade mas id/universo/mestre são os mesmos', async () => {
    const { result, rerender } = renderHook(
      ({ campanha }) => useFontesDaMesa(campanha, { incluirJogadores: true }),
      { initialProps: { campanha: { ...CAMPANHA, nome: 'A' } } },
    );

    await waitFor(() => expect(result.current.campanhaId).toBe('c1'));
    expect(getPersonagens).toHaveBeenCalledTimes(1);

    rerender({ campanha: { ...CAMPANHA, nome: 'A renomeada' } });
    rerender({ campanha: { ...CAMPANHA, nome: 'A renomeada de novo' } });

    expect(getPersonagens).toHaveBeenCalledTimes(1);
    expect(getRmCampanhaNpcs).toHaveBeenCalledTimes(1);
    expect(getRmCampanhaJogadores).toHaveBeenCalledTimes(1);
  });

  it('relê quando a campanha realmente muda', async () => {
    const { result, rerender } = renderHook(
      ({ campanha }) => useFontesDaMesa(campanha),
      { initialProps: { campanha: CAMPANHA } },
    );

    await waitFor(() => expect(result.current.campanhaId).toBe('c1'));
    rerender({ campanha: { ...CAMPANHA, id: 'c2' } });

    await waitFor(() => expect(result.current.campanhaId).toBe('c2'));
    expect(getRmCampanhaNpcs).toHaveBeenLastCalledWith('c2', 'u1', 'm1', {
      forcar: false,
    });
  });

  it('avisa quando a leitura falha', async () => {
    const consoleErro = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPersonagens.mockRejectedValue(new Error('offline'));

    renderHook(() => useFontesDaMesa(CAMPANHA));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    consoleErro.mockRestore();
  });
});
