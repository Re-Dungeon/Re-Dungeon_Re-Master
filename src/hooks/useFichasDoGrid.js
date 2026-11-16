import { useEffect, useMemo, useRef, useState } from 'react';

import { subscribePersonagem } from 'service/storage';

// Fichas ao vivo (somente leitura) dos tokens de jogador do grid, para as
// barras de PV/Energia/Fadiga e as condições (cópia nos dois sites — mudou
// um, mude o outro). `chaveIds` = ids dos personagens ordenados e unidos por
// '|' (o chamador calcula com useMemo): um `onSnapshot` por id. Quando o
// conjunto muda, só os ids novos abrem listener e só os removidos fecham (os
// que continuam não são re-assinados — cada assinatura nova relê a ficha).
// Retorna { [personagemId]: ficha | null } (null enquanto carrega, se a ficha
// não existe ou se a leitura falhou).
const SEM_FICHAS = {};

const useFichasDoGrid = (chaveIds, { ativo = true } = {}) => {
  // Mesclado (não limpa ao trocar o conjunto): as barras não piscam.
  const [fichas, setFichas] = useState(SEM_FICHAS);

  // id → unsubscribe dos listeners abertos.
  const assinaturas = useRef(new Map());

  useEffect(() => {
    const abertas = assinaturas.current;
    const desejados = new Set(ativo && chaveIds ? chaveIds.split('|') : []);
    abertas.forEach((parar, id) => {
      if (desejados.has(id)) return;
      parar();
      abertas.delete(id);
    });
    desejados.forEach(id => {
      if (abertas.has(id)) return;
      abertas.set(
        id,
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
    });
  }, [ativo, chaveIds]);

  // Desmontagem: fecha tudo que ainda estiver aberto.
  useEffect(() => {
    const abertas = assinaturas.current;
    return () => {
      abertas.forEach(parar => parar());
      abertas.clear();
    };
  }, []);

  return useMemo(() => {
    if (!ativo || !chaveIds) return SEM_FICHAS;
    return Object.fromEntries(chaveIds.split('|').map(id => [id, fichas[id] ?? null]));
  }, [ativo, chaveIds, fichas]);
};

export default useFichasDoGrid;
