import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addGridDesenho,
  removeGridDesenhos,
  subscribeGridDesenhos,
} from 'service/storage';
import {
  DESENHOS_POR_USUARIO_MAX,
  normalizarDesenho,
  ordenarDesenhos,
} from 'common/utils/gridDesenho';

// Desenhos (traços) de uma cena do grid em tempo real (cópia nos dois sites —
// mudou um, mude o outro): docs gridCenas/{cenaId}/desenhos, um por traço
// (common/utils/gridDesenho.js). Todos veem e desenham; cada um apaga os seus
// e o mestre apaga todos. O limite por pessoa (DESENHOS_POR_USUARIO_MAX) é
// rolante: ao passar dele, a mesma escrita apaga os mais antigos.
const SEM_DOCS = [];

const useGridDesenhos = (
  campanhaId,
  cenaId,
  { ativo = true, uid = null, veTudo = false, onErro } = {},
) => {
  const chave =
    ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  const [recebido, setRecebido] = useState({ chave: null, docs: SEM_DOCS });

  useEffect(() => {
    if (!chave) return undefined;
    return subscribeGridDesenhos(
      campanhaId,
      cenaId,
      docs => setRecebido({ chave, docs }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir os desenhos do grid:', error);
        if (veTudo || error?.code !== 'permission-denied') {
          onErro?.('Não foi possível carregar os desenhos do mapa.');
        }
        setRecebido({ chave, docs: SEM_DOCS });
      },
    );
  }, [campanhaId, cenaId, chave, veTudo, onErro]);

  const docs = chave && recebido.chave === chave ? recebido.docs : SEM_DOCS;
  const desenhos = useMemo(
    () =>
      ordenarDesenhos(
        docs.map(doc => normalizarDesenho(doc, uid)).filter(Boolean),
      ),
    [docs, uid],
  );

  const desenhar = useCallback(
    async ({ cor, pontos }) => {
      if (!chave || !uid) return false;
      const meus = desenhos.filter(desenho => desenho.proprio);
      const excedentes = Math.max(
        0,
        meus.length - DESENHOS_POR_USUARIO_MAX + 1,
      );
      const idsParaApagar = meus
        .slice(0, excedentes)
        .map(desenho => desenho.id);
      try {
        await addGridDesenho(
          campanhaId,
          cenaId,
          { uid, cor, pontos },
          idsParaApagar,
        );
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao salvar desenho:', error);
        onErro?.('Não foi possível salvar o desenho.');
        return false;
      }
    },
    [campanhaId, cenaId, chave, desenhos, onErro, uid],
  );

  const apagar = useCallback(
    async ids => {
      if (!chave || !ids.length) return false;
      try {
        await removeGridDesenhos(campanhaId, cenaId, ids);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao apagar desenhos:', error);
        onErro?.('Não foi possível apagar os desenhos.');
        return false;
      }
    },
    [campanhaId, cenaId, chave, onErro],
  );

  const apagarMeus = useCallback(
    () =>
      apagar(
        desenhos.filter(desenho => desenho.proprio).map(desenho => desenho.id),
      ),
    [apagar, desenhos],
  );
  const apagarTodos = useCallback(
    () => apagar(desenhos.map(desenho => desenho.id)),
    [apagar, desenhos],
  );

  return {
    desenhos,
    desenhar,
    apagarMeus,
    apagarTodos: veTudo ? apagarTodos : undefined,
  };
};

export default useGridDesenhos;
