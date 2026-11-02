import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { subscribePersonagem } from 'service/storage';
import useFichasDoGrid from './useFichasDoGrid';

vi.mock('service/storage', () => ({ subscribePersonagem: vi.fn() }));

const renderFichas = (chaveIds, ativo = true) =>
  renderHook(({ ids, ligado }) => useFichasDoGrid(ids, { ativo: ligado }), {
    initialProps: { ids: chaveIds, ligado: ativo },
  });

describe('useFichasDoGrid', () => {
  let emissores;
  let cancelamentos;

  beforeEach(() => {
    vi.clearAllMocks();
    emissores = {};
    cancelamentos = {};
    subscribePersonagem.mockImplementation((id, onChange, onError) => {
      emissores[id] = { onChange, onError };
      cancelamentos[id] = vi.fn();
      return cancelamentos[id];
    });
  });

  it('um listener por id; fichas chegam ao vivo (null enquanto carrega)', () => {
    const { result } = renderFichas('p1|p2');
    expect(subscribePersonagem).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ p1: null, p2: null });

    act(() => emissores.p1.onChange({ id: 'p1', nome: 'Aldric' }));
    expect(result.current.p1).toEqual({ id: 'p1', nome: 'Aldric' });
    // Ficha apagada.
    act(() => emissores.p2.onChange(null));
    expect(result.current.p2).toBeNull();
  });

  it('mudar o conjunto re-assina; desmontar cancela', () => {
    const { result, rerender, unmount } = renderFichas('p1');
    act(() => emissores.p1.onChange({ id: 'p1' }));
    const cancelarP1 = cancelamentos.p1;

    rerender({ ids: 'p1|p3', ligado: true });
    expect(cancelarP1).toHaveBeenCalled();
    expect(subscribePersonagem).toHaveBeenCalledWith(
      'p3',
      expect.any(Function),
      expect.any(Function),
    );
    // A ficha já recebida continua (sem piscar) até o snapshot novo.
    expect(result.current).toEqual({ p1: { id: 'p1' }, p3: null });

    rerender({ ids: 'p3', ligado: true });
    expect(result.current).toEqual({ p3: null });

    unmount();
    expect(cancelamentos.p3).toHaveBeenCalled();
  });

  it('sem ids ou inativo não escuta', () => {
    const { result } = renderFichas('');
    expect(result.current).toEqual({});
    renderFichas('p1', false);
    expect(subscribePersonagem).not.toHaveBeenCalled();
  });

  it('erro de leitura vira null e é registrado', () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderFichas('p1');
    act(() => emissores.p1.onChange({ id: 'p1' }));
    act(() => emissores.p1.onError(new Error('negado')));
    expect(result.current.p1).toBeNull();
    expect(espiao).toHaveBeenCalled();
    espiao.mockRestore();
  });
});
