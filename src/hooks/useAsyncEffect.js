import { useEffect } from 'react';

// Roda `effect` dentro de um `Promise.resolve().then(...)` — evita que o
// corpo do efeito chame setState sincronamente quando `effect` seta estado
// antes do primeiro `await` em algum ramo (ex.: retorno antecipado por
// usuário deslogado ou campanha ainda não carregada). Mesmo padrão que já
// era copiado manualmente em várias telas; ver useEntityCRUD.js para o caso
// com cancelamento (`active` flag), que continua separado por já cobrir
// cleanup próprio.
const useAsyncEffect = (effect, deps) => {
  useEffect(() => {
    Promise.resolve().then(() => effect());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

export default useAsyncEffect;
