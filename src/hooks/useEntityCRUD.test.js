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
});
