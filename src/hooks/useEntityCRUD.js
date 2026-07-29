import { useCallback, useEffect, useState } from 'react';

/**
 * Encapsula o padrão repetido em toda página de listagem de entidade:
 * buscar todos os itens ao montar e remover um item otimisticamente da
 * lista local depois de removê-lo no Firestore.
 * @param {{ getAll: () => Promise<Array>, remove: (id: string) => Promise<void> }} params
 */
const useEntityCRUD = ({ getAll, remove }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAll()
      .then(data => {
        if (active) setItems(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getAll]);

  const removeItem = useCallback(
    async id => {
      await remove(id);
      setItems(prev => prev.filter(item => item.id !== id));
    },
    [remove],
  );

  return { items, setItems, loading, remove: removeItem };
};

export default useEntityCRUD;
