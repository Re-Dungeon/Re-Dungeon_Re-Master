import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { setGridCamada, subscribeGridCamadas } from 'service/storage';
import useGridCamadas from './useGridCamadas';

vi.mock('service/storage', () => ({
  subscribeGridCamadas: vi.fn(),
  setGridCamada: vi.fn(),
}));

let emitir;
let falhar;
const onErro = vi.fn();

const renderCamadas = (opcoes = {}, cenaId = 'cena-1') =>
  renderHook(
    ({ cena, ...props }) =>
      useGridCamadas('c1', cena, { ativo: true, veTudo: true, onErro, ...props }),
    { initialProps: { cena: cenaId, ...opcoes } },
  );

describe('useGridCamadas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeGridCamadas.mockImplementation((_c, _cena, onChange, onError) => {
      emitir = onChange;
      falhar = onError;
      onChange({
        paredes: { trechos: '3:5,8-9' },
        nevoa: { ativa: true, trechos: '0:0-1' },
      });
      return vi.fn();
    });
    setGridCamada.mockResolvedValue();
  });

  it('expõe paredes e névoa como Sets; sem docs, tudo vazio', () => {
    const { result } = renderCamadas();
    expect([...result.current.bloqueadas].sort()).toEqual(['5,3', '8,3', '9,3']);
    expect(result.current.nevoa.ativa).toBe(true);
    expect([...result.current.nevoa.reveladas]).toEqual(['0,0', '1,0']);

    act(() => emitir({ paredes: null, nevoa: null }));
    expect(result.current.bloqueadas.size).toBe(0);
    expect(result.current.nevoa.ativa).toBe(false);
  });

  it('inativo não escuta', () => {
    renderCamadas({ ativo: false });
    expect(subscribeGridCamadas).not.toHaveBeenCalled();
  });

  it('editarCamada grava o doc inteiro; escritas seguidas partem da anterior', async () => {
    const { result } = renderCamadas();
    await act(async () => {
      await result.current.editarCamada('paredes', 'adicionar', [{ col: 6, lin: 3 }]);
      await result.current.editarCamada('paredes', 'remover', [{ col: 5, lin: 3 }]);
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(1, 'c1', 'cena-1', 'paredes', {
      trechos: '3:5-6,8-9',
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(2, 'c1', 'cena-1', 'paredes', {
      trechos: '3:6,8-9',
    });
  });

  it('na névoa mantém ativa; definirNevoaAtiva grava o doc completo', async () => {
    const { result } = renderCamadas();
    await act(async () => {
      await result.current.editarCamada('nevoa', 'adicionar', [{ col: 4, lin: 0 }]);
      await result.current.definirNevoaAtiva(false);
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(1, 'c1', 'cena-1', 'nevoa', {
      ativa: true,
      trechos: '0:0-1,4',
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(2, 'c1', 'cena-1', 'nevoa', {
      ativa: false,
      trechos: '0:0-1,4',
    });
  });

  it('ignora células fora dos limites; preencherCamada cobre e limpa', async () => {
    const { result } = renderCamadas();
    const limites = { colunas: 2, linhas: 2 };
    await act(async () => {
      await result.current.editarCamada(
        'paredes',
        'adicionar',
        [{ col: 9, lin: 9 }],
        limites,
      );
      await result.current.preencherCamada('nevoa', 'adicionar', limites);
      await result.current.preencherCamada('paredes', 'remover', limites);
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(1, 'c1', 'cena-1', 'paredes', {
      trechos: '3:5,8-9',
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(2, 'c1', 'cena-1', 'nevoa', {
      ativa: true,
      trechos: '0:0-1;1:0-1',
    });
    expect(setGridCamada).toHaveBeenNthCalledWith(3, 'c1', 'cena-1', 'paredes', {
      trechos: '',
    });
  });

  it('estouro do texto não grava e avisa', async () => {
    const { result } = renderCamadas();
    // Colunas alternadas em todas as linhas: um trecho por célula.
    const celulas = [];
    for (let lin = 0; lin < 500; lin += 1) {
      for (let col = 0; col < 500; col += 2) celulas.push({ col, lin });
    }
    let ok;
    await act(async () => {
      ok = await result.current.editarCamada('paredes', 'adicionar', celulas);
    });
    expect(ok).toBe(false);
    expect(setGridCamada).not.toHaveBeenCalled();
    expect(onErro).toHaveBeenCalledWith('Muitas áreas separadas para salvar.');
  });

  it('falha de escrita avisa e volta ao estado anterior', async () => {
    setGridCamada.mockRejectedValueOnce(new Error('falhou'));
    const { result } = renderCamadas();
    let ok;
    await act(async () => {
      ok = await result.current.editarCamada('paredes', 'adicionar', [
        { col: 1, lin: 1 },
      ]);
    });
    expect(ok).toBe(false);
    expect(onErro).toHaveBeenCalledWith('Não foi possível salvar as alterações do mapa.');
    await act(async () => {
      await result.current.editarCamada('paredes', 'adicionar', [{ col: 2, lin: 2 }]);
    });
    expect(setGridCamada).toHaveBeenLastCalledWith('c1', 'cena-1', 'paredes', {
      trechos: '2:2;3:5,8-9',
    });
  });

  it('sem veTudo não grava; permission-denied só avisa o mestre', async () => {
    const jogador = renderCamadas({ veTudo: false });
    let ok;
    await act(async () => {
      ok = await jogador.result.current.editarCamada('paredes', 'adicionar', [
        { col: 1, lin: 1 },
      ]);
    });
    expect(ok).toBe(false);
    expect(setGridCamada).not.toHaveBeenCalled();
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).not.toHaveBeenCalled();

    renderCamadas();
    act(() => falhar({ code: 'permission-denied' }));
    expect(onErro).toHaveBeenCalledTimes(1);
  });

  it('trocar de cena esvazia até chegar o snapshot', () => {
    const { result, rerender } = renderCamadas();
    expect(result.current.bloqueadas.size).toBe(3);
    subscribeGridCamadas.mockImplementation(() => vi.fn());
    rerender({ cena: 'cena-2' });
    expect(result.current.bloqueadas.size).toBe(0);
  });
});
