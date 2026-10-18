import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  moverGridToken,
  subscribeGrid,
  subscribeGridTokens,
} from 'service/storage';
import { configDoGrid, podeMoverToken } from 'common/utils/grid';
import useMembroDoChat from 'hooks/useMembroDoChat';

// Liga um componente ao grid de uma campanha em tempo real: configuração
// (rmCampanhas/{id}/grid/atual) + tokens (gridTokens). Mesmo acesso do chat
// (useMembroDoChat). `campanhaId` null deixa o hook inativo. Quem fala como
// mestre ou `ehMestreDaCampanha` vê também os tokens ocultos e move todos;
// o jogador vê os visíveis e move só os atribuídos a ele.
// Mover grava uma vez ao soltar — o cache local do Firestore aplica na hora
// (e desfaz se a regra recusar), então não há estado otimista próprio.
const SEM_TOKENS = [];

const useGridCampanha = (
  campanhaId,
  { uid, personagemId = null, isMestre = false, ehMestreDaCampanha = false },
) => {
  const [erro, setErro] = useState(null);
  // Dados guardados junto da campanha a que pertencem: ao trocar de campanha,
  // `carregando` volta a true sem setState síncrono no efeito.
  const [gridRecebido, setGridRecebido] = useState({
    campanhaId: null,
    dados: null,
  });
  const [tokensRecebidos, setTokensRecebidos] = useState({
    campanhaId: null,
    tokens: SEM_TOKENS,
  });

  const aoFalharMembro = useCallback(campanhaQueFalhou => {
    setErro('Não foi possível entrar no grid desta campanha.');
    setGridRecebido({ campanhaId: campanhaQueFalhou, dados: null });
    setTokensRecebidos({ campanhaId: campanhaQueFalhou, tokens: SEM_TOKENS });
  }, []);
  const podeOuvir = useMembroDoChat(campanhaId, {
    uid,
    personagemId,
    isMestre,
    onFalha: aoFalharMembro,
  });
  const veTudo = Boolean(isMestre || ehMestreDaCampanha);

  useEffect(() => {
    if (!podeOuvir) return undefined;
    return subscribeGrid(
      campanhaId,
      dados => setGridRecebido({ campanhaId, dados }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir o grid:', error);
        setErro('Sem permissão para ver o grid desta campanha.');
        setGridRecebido({ campanhaId, dados: null });
      },
    );
  }, [campanhaId, podeOuvir]);

  useEffect(() => {
    if (!podeOuvir) return undefined;
    return subscribeGridTokens(
      campanhaId,
      { incluirOcultos: veTudo },
      tokens => setTokensRecebidos({ campanhaId, tokens }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir os tokens do grid:', error);
        setErro('Não foi possível carregar os tokens do grid.');
        setTokensRecebidos({ campanhaId, tokens: SEM_TOKENS });
      },
    );
  }, [campanhaId, podeOuvir, veTudo]);

  const podeMover = useCallback(
    token => podeMoverToken(token, uid, veTudo),
    [uid, veTudo],
  );

  const mover = useCallback(
    async (token, col, lin) => {
      if (!podeMover(token) || (token.col === col && token.lin === lin)) return;
      try {
        await moverGridToken(campanhaId, token.id, col, lin);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao mover token:', error);
        setErro(`Não foi possível mover "${token.nome}".`);
      }
    },
    [campanhaId, podeMover],
  );

  const limparErro = useCallback(() => setErro(null), []);

  const carregando =
    gridRecebido.campanhaId !== campanhaId ||
    tokensRecebidos.campanhaId !== campanhaId;
  const dadosGrid =
    gridRecebido.campanhaId === campanhaId ? gridRecebido.dados : null;
  const config = useMemo(() => configDoGrid(dadosGrid), [dadosGrid]);
  const tokens =
    tokensRecebidos.campanhaId === campanhaId
      ? tokensRecebidos.tokens
      : SEM_TOKENS;

  return {
    config,
    configurado: dadosGrid !== null,
    tokens,
    carregando,
    erro,
    limparErro,
    podeMover,
    mover,
  };
};

export default useGridCampanha;
