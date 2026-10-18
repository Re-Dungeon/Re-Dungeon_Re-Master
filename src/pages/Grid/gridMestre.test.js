import { describe, it, expect } from 'vitest';
import { OPCOES_TAMANHO_TOKEN, opcoesDeDonos } from './gridMestre';

describe('opcoesDeDonos', () => {
  it('agrupa os personagens por dono e ignora quem não tem uid', () => {
    expect(
      opcoesDeDonos([
        { uid: 'u2', label: 'Zara' },
        { uid: 'u1', label: 'Aldric' },
        { uid: 'u2', label: 'Lobo' },
        { uid: null, label: 'Sem dono' },
      ]),
    ).toEqual([
      { uid: 'u1', label: 'Aldric' },
      { uid: 'u2', label: 'Zara, Lobo' },
    ]);
  });

  it('mantém donos já atribuídos que saíram da campanha', () => {
    expect(
      opcoesDeDonos([{ uid: 'u1', label: 'Aldric' }], ['u1', 'u9']),
    ).toEqual([
      { uid: 'u1', label: 'Aldric' },
      { uid: 'u9', label: 'Jogador fora da campanha' },
    ]);
  });
});

describe('OPCOES_TAMANHO_TOKEN', () => {
  it('vai de 1×1 a 10×10', () => {
    expect(OPCOES_TAMANHO_TOKEN).toHaveLength(10);
    expect(OPCOES_TAMANHO_TOKEN[2]).toEqual({ value: 3, label: '3×3' });
  });
});
