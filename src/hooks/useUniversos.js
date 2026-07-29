import { useEffect, useState } from 'react';
import { getUniversos } from 'service/storage';

let universosCache = null;
let inFlightRequest = null;

/**
 * Invalida o cache de módulo do useUniversos.
 * Chamar depois de criar/editar/remover um Universo, para que a próxima
 * leitura busque dados atualizados do Firestore em vez do cache.
 */
export const invalidateUniversosCache = () => {
  universosCache = null;
};

/**
 * Busca a coleção `Universo` uma única vez por sessão (cache em nível de
 * módulo compartilhado entre todas as páginas que usam este hook), evitando
 * uma leitura Firestore redundante a cada navegação.
 */
const useUniversos = () => {
  const [universos, setUniversos] = useState(universosCache ?? []);
  const [loadingUniversos, setLoadingUniversos] = useState(
    universosCache === null,
  );

  useEffect(() => {
    if (universosCache !== null) {
      return undefined;
    }

    if (!inFlightRequest) {
      inFlightRequest = getUniversos().finally(() => {
        inFlightRequest = null;
      });
    }

    let active = true;
    inFlightRequest.then(data => {
      universosCache = data;
      if (active) {
        setUniversos(data);
        setLoadingUniversos(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return { universos, loadingUniversos };
};

export default useUniversos;
