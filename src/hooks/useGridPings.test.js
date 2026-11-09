import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { setGridPing, subscribeGridPings } from 'service/storage';
import { CORES_PING } from 'common/utils/grid';
import useGridPings from './useGridPings';

vi.mock('service/storage', () => ({
  subscribeGridPings: vi.fn(),
  setGridPing: vi.fn(),
}));

const horario = segundos => ({ seconds: segundos, nanoseconds: 0 });

let emitir;
const emitirPings = docs => act(() => emitir(docs));

const renderPings = (opcoes = {}, cenaId = 'cena') =>
  renderHook(
    ({ cena, ...props }) =>
      useGridPings('c', cena, {
        ativo: true,
        uid: 'u1',
        nome: 'Aldric',
        mestreId: 'm1',
        ...props,
      }),
    { initialProps: { cena: cenaId, ...opcoes } },
  );

describe('useGridPings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    subscribeGridPings.mockImplementation((_campanhaId, _cenaId, onChange) => {
      emitir = onChange;
      onChange([{ uid: 'u2', x: 1, y: 1, puxar: false, criadoEm: horario(1) }]);
      return vi.fn();
    });
    setGridPing.mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carga inicial não mostra; sinal ao vivo aparece com cor e nome e some em 3 s', () => {
    const { result } = renderPings();
    expect(result.current.pings).toEqual([]);

    emitirPings([
      { uid: 'u2', x: 40, y: 60, nome: 'Brina', puxar: false, criadoEm: horario(2) },
    ]);
    expect(result.current.pings).toEqual([
      {
        uid: 'u2',
        chave: expect.any(String),
        x: 40,
        y: 60,
        nome: 'Brina',
        puxar: false,
        proprio: false,
        cor: expect.any(String),
      },
    ]);
    expect(CORES_PING).toContain(result.current.pings[0].cor);

    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.pings).toHaveLength(1);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.pings).toEqual([]);
  });

  it('ignora os docs do próprio uid e as escritas pendentes', () => {
    const { result } = renderPings();
    emitirPings([
      { uid: 'u1', x: 1, y: 1, criadoEm: horario(5) },
      { uid: 'u3', x: 1, y: 1, criadoEm: null },
    ]);
    expect(result.current.pings).toEqual([]);
  });

  it('sinal de puxar vista do mestre chega sinalizado, em dourado', () => {
    const { result } = renderPings();
    emitirPings([{ uid: 'm1', x: 1, y: 2, puxar: true, criadoEm: horario(3) }]);
    expect(result.current.pings[0]).toMatchObject({
      uid: 'm1',
      puxar: true,
      cor: '#e8cb85',
    });
  });

  it('pingar mostra na hora, grava e ignora o segundo sinal em menos de 1 s', () => {
    const { result } = renderPings();
    let saiu;
    act(() => {
      saiu = result.current.pingar({ x: 10.4, y: 20, puxar: true });
    });
    expect(saiu).toBe(true);
    // Sem podePuxar, `puxar` vai false.
    expect(setGridPing).toHaveBeenCalledWith('c', 'cena', 'u1', {
      x: 10,
      y: 20,
      puxar: false,
      nome: 'Aldric',
    });
    expect(result.current.pings).toEqual([
      expect.objectContaining({ uid: 'u1', x: 10, y: 20, proprio: true, puxar: false }),
    ]);

    act(() => {
      saiu = result.current.pingar({ x: 30, y: 30 });
    });
    expect(saiu).toBe(false);
    expect(setGridPing).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1000));
    act(() => {
      result.current.pingar({ x: 30, y: 30 });
    });
    expect(setGridPing).toHaveBeenCalledTimes(2);
  });

  it('com podePuxar, grava puxar: true (mas o meu sinal não puxa a minha vista)', () => {
    const { result } = renderPings({ uid: 'm1', podePuxar: true });
    act(() => {
      result.current.pingar({ x: 1, y: 1, puxar: true });
    });
    expect(setGridPing).toHaveBeenCalledWith(
      'c',
      'cena',
      'm1',
      expect.objectContaining({ puxar: true }),
    );
    expect(result.current.pings[0]).toMatchObject({ proprio: true, puxar: false });
  });

  it('trocar de cena esvazia os sinais e recomeça a carga inicial', () => {
    const { result, rerender } = renderPings();
    emitirPings([{ uid: 'u2', x: 1, y: 1, criadoEm: horario(2) }]);
    expect(result.current.pings).toHaveLength(1);

    rerender({ cena: 'outra' });
    expect(result.current.pings).toEqual([]);
    expect(subscribeGridPings).toHaveBeenLastCalledWith(
      'c',
      'outra',
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('inativo não escuta nem grava', () => {
    const { result } = renderPings({ ativo: false });
    expect(subscribeGridPings).not.toHaveBeenCalled();
    let saiu;
    act(() => {
      saiu = result.current.pingar({ x: 1, y: 1 });
    });
    expect(saiu).toBe(false);
    expect(setGridPing).not.toHaveBeenCalled();
  });

  it('escrita recusada avisa uma vez só', async () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => {});
    setGridPing.mockRejectedValue(
      Object.assign(new Error('negado'), { code: 'permission-denied' }),
    );
    const onErro = vi.fn();
    const { result } = renderPings({ onErro });

    await act(async () => {
      result.current.pingar({ x: 1, y: 1 });
    });
    act(() => vi.advanceTimersByTime(1000));
    await act(async () => {
      result.current.pingar({ x: 2, y: 2 });
    });
    expect(setGridPing).toHaveBeenCalledTimes(2);
    expect(onErro).toHaveBeenCalledTimes(1);
    expect(onErro).toHaveBeenCalledWith('Não foi possível mostrar o sinal para a mesa.');
    espiao.mockRestore();
  });
});
