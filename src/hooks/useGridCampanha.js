import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  moverGridToken,
  subscribeGridCena,
  subscribeGridCenaAtiva,
  subscribeGridTokens,
} from 'service/storage';
import {
  RASTRO_DURACAO_MS,
  RASTRO_FADE_MS,
  configDoGrid,
  detectarMovimentos,
  mesmaCelula,
  montarRastro,
  nomeDaCena,
  normalizarRastro,
  podeMoverToken,
  rastrosIguais,
} from 'common/utils/grid';
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
// Rastro: o movimento grava junto o caminho (`rastro`) e `movidoEm` (horário
// do servidor). Todos mostram o rastro quando chega um snapshot com
// `movidoEm` novo (a carga inicial não mostra) por RASTRO_DURACAO_MS, e quem
// moveu mostra na hora, antes da escrita. Movimento que começa onde o rastro
// ainda visível termina (setas, arrastos seguidos) continua o mesmo rastro.
// Token oculto só tem rastro local (na tela do mestre). Se a regra do
// Firestore ainda não aceitar o rastro, regrava só col/lin.
const SEM_TOKENS = [];
const SEM_RASTROS = [];
const RASTROS_VAZIOS = { chave: null, porToken: {} };

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
  // Rastros na tela, da cena `chave`: porToken[tokenId] = { tokenId, chave
  // (id deste rastro), pontos, saindo (esmaecendo), aguardando (meu
  // movimento, esperando a confirmação do servidor) }. Os refs só são lidos
  // em callbacks/efeitos.
  const [rastros, setRastros] = useState(RASTROS_VAZIOS);
  const rastrosRef = useRef(RASTROS_VAZIOS);
  // movidoEm já vistos por token (detectarMovimentos); mapa null = o próximo
  // snapshot é a carga inicial.
  const vistosRef = useRef({ chave: null, mapa: null });
  // tokenId → [timer do esmaecer, timer da remoção]
  const temporizadoresRef = useRef(new Map());
  const contadorRef = useRef(0);
  // Regra antiga (sem rastro) recusou nesta sessão: grava só col/lin.
  const semRastroNoServidorRef = useRef(false);

  const definirRastros = useCallback(calcular => {
    const proximo = calcular(rastrosRef.current);
    if (proximo === rastrosRef.current) return;
    rastrosRef.current = proximo;
    setRastros(proximo);
  }, []);

  const limparTemporizadores = useCallback(tokenId => {
    (temporizadoresRef.current.get(tokenId) ?? []).forEach(clearTimeout);
    temporizadoresRef.current.delete(tokenId);
  }, []);

  // Altera a entrada do token se ela ainda é a da cena (e, com `id`, a do
  // mesmo rastro) — `alterar(entrada)` devolve a nova entrada ou null.
  const alterarRastro = useCallback(
    (chaveCena, tokenId, id, alterar) =>
      definirRastros(atual => {
        const entrada =
          atual.chave === chaveCena ? atual.porToken[tokenId] : null;
        if (!entrada || (id && entrada.chave !== id)) return atual;
        const porToken = { ...atual.porToken };
        const nova = alterar(entrada);
        if (nova) porToken[tokenId] = nova;
        else delete porToken[tokenId];
        return { chave: atual.chave, porToken };
      }),
    [definirRastros],
  );

  const apagarRastro = useCallback(
    (chaveCena, tokenId, id = null) => {
      const entrada =
        rastrosRef.current.chave === chaveCena
          ? rastrosRef.current.porToken[tokenId]
          : null;
      if (entrada && (!id || entrada.chave === id))
        limparTemporizadores(tokenId);
      alterarRastro(chaveCena, tokenId, id, () => null);
    },
    [alterarRastro, limparTemporizadores],
  );

  const confirmarRastro = useCallback(
    (chaveCena, tokenId, id = null) =>
      alterarRastro(chaveCena, tokenId, id, entrada => ({
        ...entrada,
        aguardando: false,
      })),
    [alterarRastro],
  );

  // Mostra (ou substitui) o rastro do token e agenda o esmaecer e a remoção.
  // Devolve o id do rastro.
  const mostrarRastro = useCallback(
    (chaveCena, tokenId, pontos, aguardando) => {
      limparTemporizadores(tokenId);
      contadorRef.current += 1;
      const id = `${tokenId}-${contadorRef.current}`;
      definirRastros(atual => ({
        chave: chaveCena,
        porToken: {
          ...(atual.chave === chaveCena ? atual.porToken : {}),
          [tokenId]: { tokenId, chave: id, pontos, saindo: false, aguardando },
        },
      }));
      temporizadoresRef.current.set(tokenId, [
        setTimeout(
          () =>
            alterarRastro(chaveCena, tokenId, id, entrada => ({
              ...entrada,
              saindo: true,
            })),
          RASTRO_DURACAO_MS - RASTRO_FADE_MS,
        ),
        setTimeout(() => {
          temporizadoresRef.current.delete(tokenId);
          alterarRastro(chaveCena, tokenId, id, () => null);
        }, RASTRO_DURACAO_MS),
      ]);
      return id;
    },
    [alterarRastro, definirRastros, limparTemporizadores],
  );

  // Snapshot de tokens da cena: rastro para quem acabou de se mover.
  const processarMovimentos = useCallback(
    (chaveCena, tokens) => {
      const { vistos, movidos } = detectarMovimentos(
        vistosRef.current.mapa,
        tokens,
      );
      vistosRef.current = { chave: chaveCena, mapa: vistos };
      const idsMovidos = new Set();
      movidos.forEach(token => {
        idsMovidos.add(token.id);
        const pontos = normalizarRastro(token.rastro);
        const valido = pontos && mesmaCelula(pontos[pontos.length - 1], token);
        const atual = rastrosRef.current;
        const local =
          atual.chave === chaveCena ? atual.porToken[token.id] : null;
        if (!valido) apagarRastro(chaveCena, token.id);
        // Confirmação do meu movimento: já está na tela, sem piscar de novo.
        else if (local?.aguardando && rastrosIguais(local.pontos, pontos)) {
          confirmarRastro(chaveCena, token.id);
        } else mostrarRastro(chaveCena, token.id, pontos, false);
      });
      // Rastro vivo de token que sumiu ou mudou de lugar sem movimento novo
      // (cliente antigo, gravação sem rastro): o rastro não vale mais.
      const atual = rastrosRef.current;
      if (atual.chave !== chaveCena) return;
      Object.values(atual.porToken).forEach(entrada => {
        if (entrada.aguardando || idsMovidos.has(entrada.tokenId)) return;
        const token = tokens.find(t => t.id === entrada.tokenId);
        if (
          !token ||
          !mesmaCelula(token, entrada.pontos[entrada.pontos.length - 1])
        ) {
          apagarRastro(chaveCena, entrada.tokenId);
        }
      });
    },
    [apagarRastro, confirmarRastro, mostrarRastro],
  );

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
    // Cada escuta começa com uma carga inicial (sem rastros).
    vistosRef.current = { chave, mapa: null };
    const temporizadores = temporizadoresRef.current;
    const cancelar = subscribeGridTokens(
      campanhaId,
      cenaId,
      { incluirOcultos: veTudo },
      tokens => {
        setTokensRecebidos({ chave, tokens });
        processarMovimentos(chave, tokens);
      },
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir os tokens do grid:', error);
        if (veTudo || error?.code !== 'permission-denied') {
          setErro('Não foi possível carregar os tokens do grid.');
        }
        setTokensRecebidos({ chave, tokens: SEM_TOKENS });
      },
    );
    return () => {
      cancelar();
      temporizadores.forEach(ids => ids.forEach(clearTimeout));
      temporizadores.clear();
      definirRastros(() => RASTROS_VAZIOS);
    };
  }, [
    campanhaId,
    cenaId,
    chave,
    podeOuvir,
    veTudo,
    processarMovimentos,
    definirRastros,
  ]);

  const podeMover = useCallback(
    token => podeMoverToken(token, uid, veTudo),
    [uid, veTudo],
  );

  // `caminho` (opcional): células atravessadas, da posição atual do token até
  // col/lin (GridMapa); sem ele, o rastro é a linha reta origem → destino.
  const mover = useCallback(
    async (token, col, lin, caminho = null) => {
      if (
        !chave ||
        !cenaId ||
        !podeMover(token) ||
        (token.col === col && token.lin === lin)
      ) {
        return;
      }
      const origem = { col: token.col, lin: token.lin };
      const destino = { col, lin };
      const passos =
        Array.isArray(caminho) &&
        caminho.length >= 2 &&
        mesmaCelula(caminho[0], origem) &&
        mesmaCelula(caminho[caminho.length - 1], destino)
          ? caminho
          : [origem, destino];
      const atual = rastrosRef.current;
      const local = atual.chave === chave ? atual.porToken[token.id] : null;
      const rastro = montarRastro(local?.pontos ?? null, passos);
      const persistir = !token.oculto && !semRastroNoServidorRef.current;
      const id = mostrarRastro(chave, token.id, rastro, persistir);
      try {
        if (!persistir) {
          await moverGridToken(campanhaId, cenaId, token.id, col, lin);
          return;
        }
        try {
          await moverGridToken(campanhaId, cenaId, token.id, col, lin, rastro);
        } catch (error) {
          if (error?.code !== 'permission-denied') throw error;
          // Regra ainda sem o rastro: move sem ele (rastro só local).
          await moverGridToken(campanhaId, cenaId, token.id, col, lin);
          semRastroNoServidorRef.current = true;
          confirmarRastro(chave, token.id, id);
        }
      } catch (error) {
        apagarRastro(chave, token.id, id);
        // eslint-disable-next-line no-console
        console.error('Falha ao mover token:', error);
        setErro(`Não foi possível mover "${token.nome}".`);
      }
    },
    [
      apagarRastro,
      campanhaId,
      cenaId,
      chave,
      confirmarRastro,
      mostrarRastro,
      podeMover,
    ],
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
  const rastrosAtivos = useMemo(
    () =>
      chave && rastros.chave === chave
        ? Object.values(rastros.porToken).map(
            ({ tokenId, chave: id, pontos, saindo }) => ({
              tokenId,
              chave: id,
              pontos,
              saindo,
            }),
          )
        : SEM_RASTROS,
    [chave, rastros],
  );

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
    // Rastros do último movimento na tela: { tokenId, chave, pontos, saindo }[]
    // (GridMapa, prop `rastros`).
    rastrosAtivos,
  };
};

export default useGridCampanha;
