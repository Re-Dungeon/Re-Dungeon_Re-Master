import { useCallback, useEffect, useState } from 'react';

/**
 * Encapsula o padrão repetido em toda página de listagem de entidade:
 * buscar todos os itens ao montar, expor um erro de carregamento (com
 * `reload` para tentar de novo) e remover um item otimisticamente da
 * lista local depois de removê-lo no Firestore.
 * @param {{ getAll: () => Promise<Array>, remove: (id: string) => Promise<void> }} params
 */
const useEntityCRUD = ({ getAll, remove }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
      getAll()
        .then(data => {
          if (active) setItems(data);
        })
        .catch(err => {
          if (active) setError(err);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    });
    return () => {
      active = false;
    };
  }, [getAll, reloadToken]);

  const reload = useCallback(() => setReloadToken(token => token + 1), []);

  const removeItem = useCallback(
    async id => {
      await remove(id);
      setItems(prev => prev.filter(item => item.id !== id));
    },
    [remove],
  );

  return { items, setItems, loading, error, reload, remove: removeItem };
};

export default useEntityCRUD;
