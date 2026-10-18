import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  moverGridToken,
  subscribeGridCena,
  subscribeGridCenaAtiva,
  subscribeGridTokens,
} from 'service/storage';
import { configDoGrid, nomeDaCena, podeMoverToken } from 'common/utils/grid';
import useMembroDoChat from 'hooks/useMembroDoChat';

// Liga um componente a uma cena do grid da campanha em tempo real: a cena
// (rmCampanhas/{id}/gridCenas/{cenaId} — nome, imagem, grade) + os tokens
// dela. Mesmo acesso do chat (useMembroDoChat). `campanhaId` null deixa o
// hook inativo. Sem `cenaId`, segue a cena ATIVA (grid/atual) — é o que o
// jogador vê, e a tela troca sozinha quando o mestre mostra outra cena; o
// mestre passa `cenaId` (string ou null) para abrir qualquer cena.
// Quem fala como mestre ou `ehMestreDaCampanha` vê também os tokens ocultos e
// move todos; o jogador vê os visíveis e move só os atribuídos a ele.
// Mover grava uma vez ao soltar — o cache local do Firestore aplica na hora
// (e desfaz se a regra recusar), então não há estado otimista próprio.
const SEM_TOKENS = [];

const useGridCampanha = (
  campanhaId,
  {
    uid,
    personagemId = null,
    isMestre = false,
    ehMestreDaCampanha = false,
    cenaId: cenaEscolhida,
  },
) => {
  const [erro, setErro] = useState(null);
  // Dados guardados junto da campanha/cena a que pertencem: ao trocar,
  // `carregando` volta a true sem setState síncrono no efeito.
  const [ponteiro, setPonteiro] = useState({
    campanhaId: null,
    cenaAtivaId: null,
  });
  const [cenaRecebida, setCenaRecebida] = useState({ chave: null, cena: null });
  const [tokensRecebidos, setTokensRecebidos] = useState({
    chave: null,
    tokens: SEM_TOKENS,
  });

  const aoFalharMembro = useCallback(campanhaQueFalhou => {
    setErro('Não foi possível entrar no grid desta campanha.');
    setPonteiro({ campanhaId: campanhaQueFalhou, cenaAtivaId: null });
  }, []);
  const podeOuvir = useMembroDoChat(campanhaId, {
    uid,
    personagemId,
    isMestre,
    onFalha: aoFalharMembro,
  });
  const veTudo = Boolean(isMestre || ehMestreDaCampanha);
  const seguirAtiva = cenaEscolhida === undefined;

  useEffect(() => {
    if (!podeOuvir || !seguirAtiva) return undefined;
    return subscribeGridCenaAtiva(
      campanhaId,
      cenaAtivaId => setPonteiro({ campanhaId, cenaAtivaId }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir o grid:', error);
        setErro('Sem permissão para ver o grid desta campanha.');
        setPonteiro({ campanhaId, cenaAtivaId: null });
      },
    );
  }, [campanhaId, podeOuvir, seguirAtiva]);

  const ponteiroCarregado = !seguirAtiva || ponteiro.campanhaId === campanhaId;
  let cenaId = null;
  if (campanhaId) {
    if (!seguirAtiva) cenaId = cenaEscolhida;
    else if (ponteiro.campanhaId === campanhaId) cenaId = ponteiro.cenaAtivaId;
  }
  const chave = campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;

  useEffect(() => {
    if (!podeOuvir || !chave) return undefined;
    return subscribeGridCena(
      campanhaId,
      cenaId,
      cena => setCenaRecebida({ chave, cena }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir a cena do grid:', error);
        // Jogador sem permissão numa cena que acabou de deixar de ser a
        // ativa (o ponteiro novo ainda não chegou): não é erro, a escuta vai
        // ser trocada.
        if (veTudo || error?.code !== 'permission-denied') {
          setErro('Não foi possível carregar a cena do grid.');
        }
        setCenaRecebida({ chave, cena: null });
      },
    );
  }, [campanhaId, cenaId, chave, podeOuvir, veTudo]);

  useEffect(() => {
    if (!podeOuvir || !chave) return undefined;
    return subscribeGridTokens(
      campanhaId,
      cenaId,
      { incluirOcultos: veTudo },
      tokens => setTokensRecebidos({ chave, tokens }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir os tokens do grid:', error);
        if (veTudo || error?.code !== 'permission-denied') {
          setErro('Não foi possível carregar os tokens do grid.');
        }
        setTokensRecebidos({ chave, tokens: SEM_TOKENS });
      },
    );
  }, [campanhaId, cenaId, chave, podeOuvir, veTudo]);

  const podeMover = useCallback(
    token => podeMoverToken(token, uid, veTudo),
    [uid, veTudo],
  );

  const mover = useCallback(
    async (token, col, lin) => {
      if (
        !cenaId ||
        !podeMover(token) ||
        (token.col === col && token.lin === lin)
      ) {
        return;
      }
      try {
        await moverGridToken(campanhaId, cenaId, token.id, col, lin);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao mover token:', error);
        setErro(`Não foi possível mover "${token.nome}".`);
      }
    },
    [campanhaId, cenaId, podeMover],
  );

  const limparErro = useCallback(() => setErro(null), []);

  const carregando =
    !ponteiroCarregado ||
    (chave !== null &&
      (cenaRecebida.chave !== chave || tokensRecebidos.chave !== chave));
  const cena = chave && cenaRecebida.chave === chave ? cenaRecebida.cena : null;
  const config = useMemo(() => configDoGrid(cena), [cena]);
  const tokens =
    chave && tokensRecebidos.chave === chave
      ? tokensRecebidos.tokens
      : SEM_TOKENS;

  return {
    // Cena exibida (a ativa, se o hook segue o ponteiro) e se ela existe.
    cenaId,
    nomeCena: cena ? nomeDaCena(cena) : null,
    semCena: !carregando && !cena,
    config,
    tokens,
    carregando,
    erro,
    limparErro,
    podeMover,
    mover,
  };
};

export default useGridCampanha;
