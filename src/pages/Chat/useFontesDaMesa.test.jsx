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

  it('avisa quando a leitura falha', async () => {
    const consoleErro = vi.spyOn(console, 'error').mockImplementation(() => {});
    getPersonagens.mockRejectedValue(new Error('offline'));

    renderHook(() => useFontesDaMesa(CAMPANHA));

    await waitFor(() => expect(notifyError).toHaveBeenCalled());
    consoleErro.mockRestore();
  });
});
