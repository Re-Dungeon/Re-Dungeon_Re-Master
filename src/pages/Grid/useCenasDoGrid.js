import { useCallback, useEffect, useMemo, useState } from 'react';
import { subscribeGridCenaAtiva, subscribeGridCenas } from 'service/storage';
import { ordenarCenas } from 'common/utils/grid';

const SEM_CENAS = [];

/**
 * Lista de cenas do grid (rmCampanhas/{id}/gridCenas, só o mestre lista) e a
 * cena ativa (grid/atual), em tempo real. Dados guardados junto da campanha:
 * trocar de campanha volta `carregando` a true sem setState no efeito.
 */
const useCenasDoGrid = campanhaId => {
  const [ponteiro, setPonteiro] = useState({
    campanhaId: null,
    cenaAtivaId: null,
  });
  const [lista, setLista] = useState({ campanhaId: null, cenas: SEM_CENAS });
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!campanhaId) return undefined;
    return subscribeGridCenaAtiva(
      campanhaId,
      cenaAtivaId => setPonteiro({ campanhaId, cenaAtivaId }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir a cena ativa:', error);
        setErro('Não foi possível carregar a cena ativa do grid.');
        setPonteiro({ campanhaId, cenaAtivaId: null });
      },
    );
  }, [campanhaId]);

  useEffect(() => {
    if (!campanhaId) return undefined;
    return subscribeGridCenas(
      campanhaId,
      cenas => setLista({ campanhaId, cenas }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir as cenas do grid:', error);
        setErro('Não foi possível carregar as cenas do grid.');
        setLista({ campanhaId, cenas: SEM_CENAS });
      },
    );
  }, [campanhaId]);

  const limparErro = useCallback(() => setErro(null), []);
  const cenasDaCampanha =
    lista.campanhaId === campanhaId ? lista.cenas : SEM_CENAS;
  const cenas = useMemo(() => ordenarCenas(cenasDaCampanha), [cenasDaCampanha]);

  return {
    cenas,
    cenaAtivaId:
      ponteiro.campanhaId === campanhaId ? ponteiro.cenaAtivaId : null,
    carregando:
      Boolean(campanhaId) &&
      (lista.campanhaId !== campanhaId || ponteiro.campanhaId !== campanhaId),
    erro,
    limparErro,
  };
};

export default useCenasDoGrid;
