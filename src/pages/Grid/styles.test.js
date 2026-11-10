import { describe, it, expect } from 'vitest';
import {
  MOBILE_QUERY,
  painelAbaixoDaFaixaSx,
  painelLadoSx,
  painelMinimizadoSx,
  painelSx,
} from './styles';

describe('painelMinimizadoSx', () => {
  it('barrinha no lado e na altura do painel; celular: base de ponta a ponta', () => {
    expect(painelMinimizadoSx('right')).toMatchObject({ right: 12, top: 12 });
    expect(painelMinimizadoSx('left', true)).toMatchObject({
      left: 12,
      top: painelAbaixoDaFaixaSx.top,
    });
    const chaves = Object.keys(painelMinimizadoSx('left'));
    expect(chaves[chaves.length - 1]).toBe(MOBILE_QUERY);
    expect(painelMinimizadoSx('left')[MOBILE_QUERY]).toMatchObject({
      bottom: 0,
      left: 0,
      right: 0,
    });
  });
});

describe('painelLadoSx', () => {
  it('desktop: cartão de 300px colado no lado pedido, como sempre', () => {
    const sx = painelLadoSx('left');
    expect(sx).toMatchObject({ left: 12, width: 300, top: 12 });
    expect(painelLadoSx('right').right).toBe(12);
    expect(sx.top).toBe(painelSx.top);
  });

  it('com a faixa de iniciativa o painel desce', () => {
    const sx = painelLadoSx('right', true);
    expect(sx.top).toBe(painelAbaixoDaFaixaSx.top);
    expect(sx.maxHeight).toBe(painelAbaixoDaFaixaSx.maxHeight);
  });

  it('celular: folha na base de ponta a ponta, e o bloco vem depois de left/right', () => {
    const sx = painelLadoSx('left', true);
    expect(sx[MOBILE_QUERY]).toMatchObject({
      top: 'auto',
      bottom: 0,
      left: 0,
      right: 0,
      width: 'auto',
      maxWidth: 'none',
    });
    const chaves = Object.keys(sx);
    // Vence o `left: 12` por vir depois dele na folha de estilo.
    expect(chaves.indexOf(MOBILE_QUERY)).toBeGreaterThan(
      chaves.indexOf('left'),
    );
    expect(chaves[chaves.length - 1]).toBe(MOBILE_QUERY);
  });
});
