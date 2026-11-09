import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { alterarGridCombate, subscribeGridCombate } from 'service/storage';
import useGridCombate from './useGridCombate';

vi.mock('service/storage', () => ({
  subscribeGridCombate: vi.fn(),
  alterarGridCombate: vi.fn(),
}));

const TOKENS = [
  {
    id: 't1',
    nome: 'Aldric',
    tipo: 'jogador',
    col: 1,
    lin: 1,
    donos: ['u1'],
    oculto: false,
  },
  { id: 't2', nome: 'Ogro', tipo: 'criatura', col: 4, lin: 1, donos: [], oculto: false },
];
const AUTOR = { uid: 'u1', personagemId: 'p1', autorNome: 'Aldric', isMestre: false };

const DOC = {
  ordem: [
    { tokenId: 't1', iniciativa: 18, d20: 15, reacao: 3 },
    { tokenId: 't2', iniciativa: 12, d20: 10, reacao: 2 },
  ],
  indice: 0,
  rodada: 2,
  inicioTurno: { col: 0, lin: 1 },
  turnoEm: { seconds: 7, nanoseconds: 0 },
};

let emitir;
let falhar;

const renderCombate = (opcoes = {}, cenaId = 'cena-1') =>
  renderHook(
    ({ cena, ...props }) =>
      useGridCombate('c1', cena, {
        ativo: true,
        uid: 'u1',
        tokens: TOKENS,
        autor: AUTOR,
        ...props,
      }),
    { initialProps: { cena: cenaId, ...opcoes } },
  );

// alterarGridCombate falso: roda o `calcular` com o doc do "servidor".
const servidorCom = doc =>
  alterarGridCombate.mockImplementation(async (_c, _cena, calcular) => {
    const resultado = calcular(doc);
    return Boolean(resultado);
  });

describe('useGridCombate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribeGridCombate.mockImplementation((_c, _cena, onChange, onError) => {
      emitir = onChange;
      falhar = onError;
      onChange(DOC);
      return vi.fn();
    });
  });

  it('normaliza o snapshot e diz de quem é a vez', () => {
    const { result } = renderCombate();
    expect(result.current.combate).toMatchObject({
      indice: 0,
      rodada: 2,
      tokenDaVezId: 't1',
      chaveTurno: '7:0',
      inicioTurno: { col: 0, lin: 1 },
    });
    expect(result.current.tokenDaVez).toBe(TOKENS[0]);
    expect(result.current.meuTurno).toBe(true);

    act(() => emitir({ ...DOC, indice: 1 }));
    expect(result.current.meuTurno).toBe(false);
    act(() => emitir(null));
    expect(result.current.combate).toBeNull();
    expect(result.current.tokenDaVez).toBeNull();
  });

  it('encerrarTurno grava o próximo índice com a mensagem "turno"', async () => {
    servidorCom(DOC);
    const { result } = renderCombate();
    let trocou;
    await act(async () => {
      trocou = await result.current.encerrarTurno();
    });
    expect(trocou).toBe(true);
    const [campanhaId, cenaId, calcular] = alterarGridCombate.mock.calls[0];
    expect([campanhaId, cenaId]).toEqual(['c1', 'cena-1']);
    expect(calcular(DOC)).toEqual({
      patch: { indice: 1, rodada: 2, inicioTurno: { col: 4, lin: 1 } },
      mudouTurno: true,
      mensagem: expect.objectContaining({
        tipo: 'combate',
        uid: 'u1',
        personagemId: 'p1',
        persona: 'jogador',
        combate: {
          evento: 'turno',
          cenaId: 'cena-1',
          rodada: 2,
          nome: 'Ogro',
          oculto: false,
        },
      }),
    });
  });

  it('no último da ordem, a vez volta ao primeiro com a rodada nova', async () => {
    const ultimo = { ...DOC, indice: 1 };
    subscribeGridCombate.mockImplementation((_c, _cena, onChange) => {
      onChange(ultimo);
      return vi.fn();
    });
    servidorCom(ultimo);
    const { result } = renderCombate({ veTudo: true });
    await act(async () => {
      await result.current.mudarTurno(1);
    });
    const calcular = alterarGridCombate.mock.calls[0][2];
    expect(calcular(ultimo)).toMatchObject({
      patch: { indice: 0, rodada: 3 },
      mensagem: { combate: { evento: 'rodada', rodada: 3, nome: 'Aldric' } },
    });
  });

  it('turno já trocado por outra pessoa (servidor diverge) não grava nada', async () => {
    servidorCom({ ...DOC, indice: 1 });
    const { result } = renderCombate();
    let trocou;
    await act(async () => {
      trocou = await result.current.mudarTurno(1);
    });
    expect(trocou).toBe(false);
    const calcular = alterarGridCombate.mock.calls[0][2];
    expect(calcular({ ...DOC, indice: 1 })).toBeNull();
    expect(calcular(null)).toBeNull();
  });

  it('sem ser a vez dele, o jogador não encerra o turno', async () => {
    subscribeGridCombate.mockImplementation((_c, _cena, onChange) => {
      onChange({ ...DOC, indice: 1 });
      return vi.fn();
    });
    const { result } = renderCombate();
    let trocou;
    await act(async () => {
      trocou = await result.current.encerrarTurno();
    });
    expect(trocou).toBe(false);
    expect(alterarGridCombate).not.toHaveBeenCalled();
  });

  it('falha ao gravar avisa; erro de escuta só fora do permission-denied do jogador', async () => {
    const espiao = vi.spyOn(console, 'error').mockImplementation(() => {});
    alterarGridCombate.mockRejectedValue(new Error('rede'));
    const onErro = vi.fn();
    const { result } = renderCombate({ onErro });
    await act(async () => {
      await result.current.encerrarTurno();
    });
    expect(onErro).toHaveBeenCalledWith('Não foi possível passar o turno.');

    act(() => falhar(Object.assign(new Error('negado'), { code: 'permission-denied' })));
    expect(onErro).toHaveBeenCalledTimes(1);
    expect(result.current.combate).toBeNull();
    act(() => falhar(new Error('outro')));
    expect(onErro).toHaveBeenLastCalledWith(
      'Não foi possível carregar o combate da cena.',
    );
    espiao.mockRestore();
  });

  it('trocar de cena esvazia o combate até o novo snapshot', () => {
    subscribeGridCombate.mockImplementation((_c, cena, onChange) => {
      if (cena === 'cena-1') onChange(DOC);
      return vi.fn();
    });
    const { result, rerender } = renderCombate();
    expect(result.current.combate).not.toBeNull();
    rerender({ cena: 'cena-2' });
    expect(result.current.combate).toBeNull();
    expect(subscribeGridCombate).toHaveBeenLastCalledWith(
      'c1',
      'cena-2',
      expect.any(Function),
      expect.any(Function),
    );
  });

  it('inativo não escuta', () => {
    const { result } = renderCombate({ ativo: false });
    expect(subscribeGridCombate).not.toHaveBeenCalled();
    expect(result.current.combate).toBeNull();
  });
});
