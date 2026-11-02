import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addGridMarcador,
  removeGridMarcador,
  subscribeGridMarcadores,
  updateGridMarcador,
} from 'service/storage';
import {
  MARCADORES_POR_CENA_MAX,
  montarMarcador,
  normalizarMarcadores,
  validarMarcador,
} from 'common/utils/gridMarcadores';

// Marcadores de uma cena do grid em tempo real (cópia nos dois sites — mudou
// um, mude o outro): docs gridCenas/{cenaId}/marcadores (common/utils/
// gridMarcadores.js). O mestre vê e grava todos; os `secreto` só chegam a ele
// (a consulta do jogador filtra `secreto == false`, e a regra confere).
const SEM_DOCS = [];

const useGridMarcadores = (
  campanhaId,
  cenaId,
  { ativo = true, veTudo = false, onErro } = {},
) => {
  const chave =
    ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  const [recebido, setRecebido] = useState({ chave: null, docs: SEM_DOCS });

  useEffect(() => {
    if (!chave) return undefined;
    return subscribeGridMarcadores(
      campanhaId,
      cenaId,
      { incluirSecretos: veTudo },
      docs => setRecebido({ chave, docs }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir os marcadores do grid:', error);
        if (veTudo || error?.code !== 'permission-denied') {
          onErro?.('Não foi possível carregar os marcadores do mapa.');
        }
        setRecebido({ chave, docs: SEM_DOCS });
      },
    );
  }, [campanhaId, cenaId, chave, veTudo, onErro]);

  const docs = chave && recebido.chave === chave ? recebido.docs : SEM_DOCS;
  const marcadores = useMemo(() => normalizarMarcadores(docs), [docs]);

  // Devolve o id do marcador criado, ou null (com aviso) se não gravou.
  const criarMarcador = useCallback(
    async dados => {
      if (!chave || !veTudo) return null;
      const marcador = montarMarcador(dados);
      const problema = validarMarcador(marcador);
      if (problema) {
        onErro?.(problema);
        return null;
      }
      if (marcadores.length >= MARCADORES_POR_CENA_MAX) {
        onErro?.(`Esta cena já tem ${MARCADORES_POR_CENA_MAX} marcadores.`);
        return null;
      }
      try {
        return await addGridMarcador(campanhaId, cenaId, marcador);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao criar marcador:', error);
        onErro?.('Não foi possível criar o marcador.');
        return null;
      }
    },
    [campanhaId, cenaId, chave, marcadores.length, onErro, veTudo],
  );

  // `patch` mescla com o marcador atual; resolve true se gravou.
  const salvarMarcador = useCallback(
    async (marcadorId, patch) => {
      if (!chave || !veTudo) return false;
      const atual = marcadores.find(item => item.id === marcadorId);
      if (!atual) return false;
      const marcador = montarMarcador({ ...atual, ...patch });
      const problema = validarMarcador(marcador);
      if (problema) {
        onErro?.(problema);
        return false;
      }
      try {
        await updateGridMarcador(campanhaId, cenaId, marcadorId, marcador);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao salvar marcador:', error);
        onErro?.('Não foi possível salvar o marcador.');
        return false;
      }
    },
    [campanhaId, cenaId, chave, marcadores, onErro, veTudo],
  );

  const apagarMarcador = useCallback(
    async marcadorId => {
      if (!chave || !veTudo || !marcadorId) return false;
      try {
        await removeGridMarcador(campanhaId, cenaId, marcadorId);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao apagar marcador:', error);
        onErro?.('Não foi possível apagar o marcador.');
        return false;
      }
    },
    [campanhaId, cenaId, chave, onErro, veTudo],
  );

  return { marcadores, criarMarcador, salvarMarcador, apagarMarcador };
};

export default useGridMarcadores;
