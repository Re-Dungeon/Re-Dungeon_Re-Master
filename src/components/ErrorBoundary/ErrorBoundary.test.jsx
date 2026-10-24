import { describe, expect, it } from 'vitest';
import { getSafeErrorMessage } from './ErrorBoundary';

describe('ErrorBoundary helpers', () => {
  it('preserva mensagens de erro reais e não quebra com objetos', () => {
    const erroPadrao = new Error('falha real do componente');
    expect(getSafeErrorMessage(erroPadrao)).toBe('falha real do componente');

    const objetoCru = { nome: 'Erro sem message', detalhe: 'valor' };
    expect(() => getSafeErrorMessage(objetoCru)).not.toThrow();
    expect(getSafeErrorMessage(objetoCru)).toContain('Erro sem message');
  });
});
