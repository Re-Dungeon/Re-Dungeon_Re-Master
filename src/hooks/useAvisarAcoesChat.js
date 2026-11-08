import { useEffect, useState } from 'react';

import { subscribeGridAvisarAcoesChat } from 'service/storage';

// Opção do mestre em `rmCampanhas/{id}/grid/atual` (`avisarAcoesChat`): as
// ações feitas na Central de Ações dos jogadores (aberta pelo Grid em combate)
// aparecem no chat (cópia nos dois sites — mudou um, mude o outro). Escuta em
// tempo real e devolve um boolean — false sem campanha, enquanto carrega ou
// se a leitura falhar (o padrão é não avisar).
const useAvisarAcoesChat = campanhaId => {
  // { campanhaId, avisar } — o valor só vale para a campanha atual (trocar de
  // campanha volta a false sem setState no efeito).
  const [estado, setEstado] = useState({ campanhaId: null, avisar: false });

  useEffect(() => {
    if (!campanhaId) return undefined;
    return subscribeGridAvisarAcoesChat(
      campanhaId,
      avisar => setEstado({ campanhaId, avisar }),
      () => setEstado({ campanhaId, avisar: false }),
    );
  }, [campanhaId]);

  return (
    Boolean(campanhaId) && estado.campanhaId === campanhaId && estado.avisar
  );
};

export default useAvisarAcoesChat;
