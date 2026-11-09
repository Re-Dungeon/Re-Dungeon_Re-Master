import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addGridArea,
  removeGridArea,
  removeGridAreas,
  subscribeGridAreas,
  updateGridArea,
} from 'service/storage';
import {
  AREAS_POR_CENA_MAX,
  AREAS_POR_PESSOA_MAX,
  montarArea,
  normalizarArea,
} from 'common/utils/gridAreas';

// Templates de área (raio/linha/cone/quadrado) de uma cena do grid em tempo
// real (cópia nos dois sites — mudou um, mude o outro): docs
// gridCenas/{cenaId}/templates (common/utils/gridAreas.js). Todos que veem a
// cena criam; o autor (ou o mestre) move e apaga; `removerTodas` só existe
// para quem vê tudo. Os limites por cena/pessoa são só da UI. As áreas são
// guardadas junto da cena a que pertencem (trocar de cena esvazia sem
// setState no efeito). Permissão negada numa cena que deixou de ser a ativa
// não é erro para o jogador.
const SEM_DOCS = [];

// createdAt pendente (escrita local ainda sem horário do servidor) vai por último.
const segundosDe = valor => {
  if (valor && typeof valor.seconds === 'number') return valor.seconds;
  if (typeof valor?.toMillis === 'function') return valor.toMillis() / 1000;
  return Number.POSITIVE_INFINITY;
};

const useGridAreas = (
  campanhaId,
  cenaId,
  { ativo = true, uid = null, nome = null, veTudo = false, onErro } = {},
) => {
  const chave = ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  const [recebido, setRecebido] = useState({ chave: null, docs: SEM_DOCS });

  useEffect(() => {
    if (!chave) return undefined;
    return subscribeGridAreas(
      campanhaId,
      cenaId,
      docs => setRecebido({ chave, docs }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir as áreas do grid:', error);
        if (veTudo || error?.code !== 'permission-denied') {
          onErro?.('Não foi possível carregar as áreas do mapa.');
        }
        setRecebido({ chave, docs: SEM_DOCS });
      },
    );
  }, [campanhaId, cenaId, chave, veTudo, onErro]);

  const docs = chave && recebido.chave === chave ? recebido.docs : SEM_DOCS;
  const areas = useMemo(
    () =>
      docs
        .map((doc, indice) => ({
          indice,
          segundos: segundosDe(doc.createdAt),
          area: normalizarArea(doc),
        }))
        .filter(item => item.area)
        .sort((a, b) =>
          a.segundos === b.segundos ? a.indice - b.indice : a.segundos - b.segundos,
        )
        .map(item => item.area),
    [docs],
  );

  const falhar = useCallback(
    (error, mensagem) => {
      // eslint-disable-next-line no-console
      console.error(mensagem, error);
      onErro?.(mensagem);
      return false;
    },
    [onErro],
  );

  const criar = useCallback(
    async ({ forma, origem, alvo = null, metros, cor }) => {
      if (!chave || !uid) return false;
      if (areas.length >= AREAS_POR_CENA_MAX) {
        onErro?.('Há áreas demais na cena. Remova alguma antes de criar outra.');
        return false;
      }
      if (areas.filter(area => area.uid === uid).length >= AREAS_POR_PESSOA_MAX) {
        onErro?.('Você já tem áreas demais. Remova alguma antes de criar outra.');
        return false;
      }
      const payload = montarArea({ forma, origem, alvo, metros, cor, uid, nome });
      try {
        await addGridArea(campanhaId, cenaId, payload);
        return true;
      } catch (error) {
        return falhar(error, 'Não foi possível criar a área.');
      }
    },
    [areas, campanhaId, cenaId, chave, falhar, nome, onErro, uid],
  );

  const atualizar = useCallback(
    async (areaId, { origem, alvo = null }) => {
      if (!chave || !areas.some(area => area.id === areaId)) return false;
      try {
        await updateGridArea(campanhaId, cenaId, areaId, { origem, alvo });
        return true;
      } catch (error) {
        return falhar(error, 'Não foi possível mover a área.');
      }
    },
    [areas, campanhaId, cenaId, chave, falhar],
  );

  const remover = useCallback(
    async areaId => {
      if (!chave || !areaId) return false;
      try {
        await removeGridArea(campanhaId, cenaId, areaId);
        return true;
      } catch (error) {
        return falhar(error, 'Não foi possível remover a área.');
      }
    },
    [campanhaId, cenaId, chave, falhar],
  );

  const removerTodas = useCallback(async () => {
    if (!chave || !veTudo || !areas.length) return false;
    try {
      await removeGridAreas(
        campanhaId,
        cenaId,
        areas.map(area => area.id),
      );
      return true;
    } catch (error) {
      return falhar(error, 'Não foi possível remover as áreas.');
    }
  }, [areas, campanhaId, cenaId, chave, falhar, veTudo]);

  return { areas, criar, atualizar, remover, removerTodas };
};

export default useGridAreas;
