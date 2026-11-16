import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addGridDesenho,
  removeGridDesenhos,
  subscribeGridDesenhos,
} from 'service/storage';
import {
  DESENHO_REVISAO_MS,
  DESENHOS_POR_USUARIO_MAX,
  filtrarDesenhosVigentes,
  normalizarDesenho,
  ordenarDesenhos,
} from 'common/utils/gridDesenho';

// Desenhos (traços) de uma cena do grid em tempo real (cópia nos dois sites —
// mudou um, mude o outro): docs gridCenas/{cenaId}/desenhos, um por traço
// (common/utils/gridDesenho.js). Todos veem e desenham; cada um apaga os seus
// e o mestre apaga todos. O limite por pessoa (DESENHOS_POR_USUARIO_MAX) é
// rolante: ao passar dele, a mesma escrita apaga os mais antigos.
// Os traços são temporários (DESENHO_VALIDADE_MS): a consulta já traz só os
// recentes e, com o mapa aberto, um relógio local (sem nova leitura) esconde
// os que envelhecem.
// A consulta filtra por `createdAt`, e um serverTimestamp ainda pendente não
// casa com esse filtro no cache local — por isso o traço que acabo de criar
// entra numa lista "otimista" até o servidor confirmar (o doc chegar na consulta).
const SEM_DOCS = [];
const SEM_OTIMISTAS = [];

const useGridDesenhos = (
  campanhaId,
  cenaId,
  { ativo = true, uid = null, veTudo = false, onErro } = {},
) => {
  const chave = ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  const [recebido, setRecebido] = useState({ chave: null, docs: SEM_DOCS });
  const [otimistas, setOtimistas] = useState(SEM_OTIMISTAS);
  const [agora, setAgora] = useState(() => Date.now());

  // Reavalia a validade a cada minuto (só estado local, nenhuma leitura).
  useEffect(() => {
    if (!chave) return undefined;
    const intervalo = setInterval(() => setAgora(Date.now()), DESENHO_REVISAO_MS);
    return () => clearInterval(intervalo);
  }, [chave]);

  useEffect(() => {
    if (!chave) return undefined;
    return subscribeGridDesenhos(
      campanhaId,
      cenaId,
      docs => {
        setRecebido({ chave, docs });
        // O servidor já confirmou esses: saem da lista otimista.
        setOtimistas(lista =>
          lista.some(item => docs.some(doc => doc.id === item.id))
            ? lista.filter(item => !docs.some(doc => doc.id === item.id))
            : lista,
        );
      },
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
  const desenhos = useMemo(() => {
    const doServidor = new Set(docs.map(doc => doc.id));
    const locais = otimistas.filter(
      item => item.chave === chave && !doServidor.has(item.id),
    );
    const todos = [...docs, ...locais]
      .map(doc => normalizarDesenho(doc, uid))
      .filter(Boolean);
    return ordenarDesenhos(filtrarDesenhosVigentes(todos, agora));
  }, [agora, chave, docs, otimistas, uid]);

  const desenhar = useCallback(
    async ({ cor, pontos }) => {
      if (!chave || !uid) return false;
      const meus = desenhos.filter(desenho => desenho.proprio);
      const excedentes = Math.max(0, meus.length - DESENHOS_POR_USUARIO_MAX + 1);
      const idsParaApagar = meus.slice(0, excedentes).map(desenho => desenho.id);
      let idLocal = null;
      try {
        await addGridDesenho(campanhaId, cenaId, { uid, cor, pontos }, idsParaApagar, {
          aoCriarLocal: id => {
            idLocal = id;
            setOtimistas(lista => [
              ...lista,
              { chave, id, uid, cor, pontos, createdAt: Date.now() },
            ]);
          },
        });
        return true;
      } catch (error) {
        if (idLocal) setOtimistas(lista => lista.filter(item => item.id !== idLocal));
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
    () => apagar(desenhos.filter(desenho => desenho.proprio).map(desenho => desenho.id)),
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
