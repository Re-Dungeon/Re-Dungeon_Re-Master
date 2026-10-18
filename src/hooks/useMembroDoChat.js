import { useEffect, useState } from 'react';

import { setChatMembro } from 'service/storage';

// Garante o ponteiro rmCampanhas/{id}/chatMembros/{uid} = {uid, personagemId}
// que as regras usam para liberar o chat e o grid da campanha ao jogador. O
// mestre não precisa dele (acesso via `mestreId` da campanha). Devolve true
// quando já dá para abrir as escutas; `onFalha(campanhaId)` (estável — use
// useCallback) é chamado se o ponteiro não puder ser gravado.
const useMembroDoChat = (
  campanhaId,
  { uid, personagemId, isMestre, onFalha },
) => {
  // Campanha para a qual o ponteiro já foi gravado ao menos uma vez. Trocar de
  // personagem dentro da mesma campanha regrava o ponteiro, mas não derruba as
  // escutas (a regra de leitura é revalidada a cada request).
  const [membroDaCampanha, setMembroDaCampanha] = useState(null);

  useEffect(() => {
    if (!campanhaId || !uid || isMestre || !personagemId) return undefined;
    let isMounted = true;
    setChatMembro(campanhaId, uid, personagemId)
      .then(() => {
        if (isMounted) setMembroDaCampanha(campanhaId);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao registrar na campanha:', error);
        if (isMounted) onFalha?.(campanhaId);
      });
    return () => {
      isMounted = false;
    };
  }, [campanhaId, uid, personagemId, isMestre, onFalha]);

  return Boolean(
    campanhaId && uid && (isMestre || membroDaCampanha === campanhaId),
  );
};

export default useMembroDoChat;
