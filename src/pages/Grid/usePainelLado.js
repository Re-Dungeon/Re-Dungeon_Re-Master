import { useCallback, useState } from 'react';

export const CHAVE_LADO_PAINEL = 'remaster_grid_lado_painel_token';
const LADOS = ['left', 'right'];

const lerLado = () => {
  try {
    const salvo = window.localStorage.getItem(CHAVE_LADO_PAINEL);
    return LADOS.includes(salvo) ? salvo : 'left';
  } catch {
    return 'left';
  }
};

/**
 * Lado do mapa ('left' | 'right') em que ficam o painel do token e as ações em
 * lote. É uma preferência deste navegador (localStorage, lida e gravada com
 * try/catch: bloqueado ou cheio, vale só até recarregar). `trocar()` alterna.
 */
const usePainelLado = () => {
  const [lado, setLado] = useState(lerLado);

  const trocar = useCallback(() => {
    setLado(atual => {
      const novo = atual === 'left' ? 'right' : 'left';
      try {
        window.localStorage.setItem(CHAVE_LADO_PAINEL, novo);
      } catch {
        // Sem armazenamento: a escolha vale até recarregar.
      }
      return novo;
    });
  }, []);

  return [lado, trocar];
};

export default usePainelLado;
