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

  it('mudar o conjunto abre só os ids novos e fecha só os removidos', () => {
    const { result, rerender, unmount } = renderFichas('p1');
    act(() => emissores.p1.onChange({ id: 'p1' }));
    const cancelarP1 = cancelamentos.p1;
    expect(subscribePersonagem).toHaveBeenCalledTimes(1);

    rerender({ ids: 'p1|p3', ligado: true });
    // p1 segue com o mesmo listener; só p3 foi assinado.
    expect(cancelarP1).not.toHaveBeenCalled();
    expect(subscribePersonagem).toHaveBeenCalledTimes(2);
    expect(subscribePersonagem).toHaveBeenLastCalledWith(
      'p3',
      expect.any(Function),
      expect.any(Function),
    );
    // A ficha já recebida continua (sem piscar) até o snapshot novo.
    expect(result.current).toEqual({ p1: { id: 'p1' }, p3: null });

    rerender({ ids: 'p3', ligado: true });
    expect(cancelarP1).toHaveBeenCalledTimes(1);
    expect(cancelamentos.p3).not.toHaveBeenCalled();
    expect(subscribePersonagem).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({ p3: null });

    unmount();
    expect(cancelamentos.p3).toHaveBeenCalledTimes(1);
    expect(cancelarP1).toHaveBeenCalledTimes(1);
  });

  it('inativo fecha tudo e reativar reabre', () => {
    const { rerender } = renderFichas('p1|p2');
    const { p1: cancelarP1, p2: cancelarP2 } = cancelamentos;
    rerender({ ids: 'p1|p2', ligado: false });
    expect(cancelarP1).toHaveBeenCalledTimes(1);
    expect(cancelarP2).toHaveBeenCalledTimes(1);
    rerender({ ids: 'p1|p2', ligado: true });
    expect(subscribePersonagem).toHaveBeenCalledTimes(4);
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
