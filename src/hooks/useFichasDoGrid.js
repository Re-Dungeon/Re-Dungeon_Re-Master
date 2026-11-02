import { useEffect, useMemo, useState } from 'react';

import { subscribePersonagem } from 'service/storage';

// Fichas ao vivo (somente leitura) dos tokens de jogador do grid, para as
// barras de PV/Energia/Fadiga e as condições (cópia nos dois sites — mudou
// um, mude o outro). `chaveIds` = ids dos personagens ordenados e unidos por
// '|' (o chamador calcula com useMemo): um `onSnapshot` por id, re-assinados
// só quando o conjunto muda. Retorna { [personagemId]: ficha | null } (null
// enquanto carrega, se a ficha não existe ou se a leitura falhou).
const SEM_FICHAS = {};

const useFichasDoGrid = (chaveIds, { ativo = true } = {}) => {
  // Mesclado (não limpa ao trocar o conjunto): as barras não piscam.
  const [fichas, setFichas] = useState(SEM_FICHAS);

  useEffect(() => {
    if (!ativo || !chaveIds) return undefined;
    const cancelar = chaveIds.split('|').map(id =>
      subscribePersonagem(
        id,
        ficha => setFichas(atual => ({ ...atual, [id]: ficha })),
        error => {
          // eslint-disable-next-line no-console
          console.error('Falha ao ouvir a ficha do token:', error);
          setFichas(atual => ({ ...atual, [id]: null }));
        },
      ),
    );
    return () => cancelar.forEach(parar => parar());
  }, [ativo, chaveIds]);

  return useMemo(() => {
    if (!ativo || !chaveIds) return SEM_FICHAS;
    return Object.fromEntries(
      chaveIds.split('|').map(id => [id, fichas[id] ?? null]),
    );
  }, [ativo, chaveIds, fichas]);
};

export default useFichasDoGrid;
