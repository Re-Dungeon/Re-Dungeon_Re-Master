import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useEntityCRUD from './useEntityCRUD';

describe('useEntityCRUD', () => {
  it('carrega os itens via getAll e expõe loading=false ao terminar', async () => {
    const getAll = vi.fn().mockResolvedValue([{ id: '1', nome: 'Elfo' }]);
    const remove = vi.fn();

    const { result } = renderHook(() => useEntityCRUD({ getAll, remove }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual([{ id: '1', nome: 'Elfo' }]);
  });

  it('remove chama a função remove e tira o item da lista local sem novo fetch', async () => {
    const getAll = vi.fn().mockResolvedValue([
      { id: '1', nome: 'Elfo' },
      { id: '2', nome: 'Anão' },
    ]);
    const remove = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() => useEntityCRUD({ getAll, remove }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.remove('1');
    });

    expect(remove).toHaveBeenCalledWith('1');
    expect(getAll).toHaveBeenCalledTimes(1);
    expect(result.current.items).toEqual([{ id: '2', nome: 'Anão' }]);
  });

  it('expõe o erro quando getAll rejeita, sem travar em loading', async () => {
    const falha = new Error('permission-denied');
    const getAll = vi.fn().mockRejectedValue(falha);
    const remove = vi.fn();

    const { result } = renderHook(() => useEntityCRUD({ getAll, remove }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(falha);
    expect(result.current.items).toEqual([]);
  });

  it('reload busca de novo e limpa o erro quando a nova tentativa dá certo', async () => {
    const getAll = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([{ id: '1', nome: 'Elfo' }]);
    const remove = vi.fn();

    const { result } = renderHook(() => useEntityCRUD({ getAll, remove }));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    act(() => {
      result.current.reload();
    });

    // Espera pelo resultado da nova busca (não por loading=false — logo
    // após chamar reload(), loading ainda está false do fetch anterior até
    // o efeito rodar de novo, o que faria esse waitFor passar cedo demais).
    await waitFor(() => expect(result.current.items).toEqual([{ id: '1', nome: 'Elfo' }]));
    expect(result.current.error).toBeNull();
    expect(getAll).toHaveBeenCalledTimes(2);
  });
});
