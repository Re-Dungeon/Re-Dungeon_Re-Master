import { useState } from 'react';

/**
 * Gera um id estável por posição para listas de um `FieldArray` do Formik,
 * evitando usar o índice do array como `key` do React (o que causa o
 * conteúdo dos itens "grudar" na posição errada ao remover um item do meio
 * da lista, especialmente com `FastField`). Os ids vivem só na UI — nunca
 * fazem parte de `values` do Formik, então não são persistidos.
 */
const useStableListKeys = initialLength => {
  const [keys, setKeys] = useState(() =>
    Array.from({ length: initialLength }, () => crypto.randomUUID()),
  );

  const addKey = () => setKeys(prev => [...prev, crypto.randomUUID()]);

  const removeKey = index =>
    setKeys(prev => prev.filter((_, i) => i !== index));

  return { keys, addKey, removeKey };
};

export default useStableListKeys;
