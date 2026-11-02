import { useCallback, useEffect, useMemo, useState } from 'react';

import { alterarGridCombate, subscribeGridCombate } from 'service/storage';
import { montarMensagemCombate } from 'common/utils/chat';
import { normalizarCombate, trocarTurno } from 'common/utils/gridCombate';

// Combate de uma cena do grid em tempo real (cópia nos dois sites — mudou um,
// mude o outro): o doc gridCenas/{cenaId}/combate/atual (common/utils/
// gridCombate.js). `tokens` = os que quem usa o hook vê (o mestre vê os
// ocultos). `mudarTurno(±1)` troca o turno numa transação (alterarGridCombate)
// que relê o servidor e desiste se alguém trocou antes (o turno esperado não
// bate) — com `autor`, a mensagem de combate vai junto. `encerrarTurno` é o
// "Encerrar meu turno" do jogador da vez (ou o mestre).
const SEM_TOKENS = [];

const useGridCombate = (
  campanhaId,
  cenaId,
  {
    ativo = true,
    uid = null,
    veTudo = false,
    tokens = SEM_TOKENS,
    autor = null,
    onErro,
  },
) => {
  const chave =
    ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  // Doc guardado junto da cena a que pertence (trocar de cena esvazia sem
  // setState síncrono no efeito).
  const [recebido, setRecebido] = useState({ chave: null, doc: null });

  useEffect(() => {
    if (!chave) return undefined;
    return subscribeGridCombate(
      campanhaId,
      cenaId,
      doc => setRecebido({ chave, doc }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir o combate do grid:', error);
        // Jogador numa cena que acabou de deixar de ser a ativa: a escuta vai
        // ser trocada, não é erro.
        if (veTudo || error?.code !== 'permission-denied') {
          onErro?.('Não foi possível carregar o combate da cena.');
        }
        setRecebido({ chave, doc: null });
      },
    );
  }, [campanhaId, cenaId, chave, veTudo, onErro]);

  const doc = chave && recebido.chave === chave ? recebido.doc : null;
  const combate = useMemo(() => normalizarCombate(doc), [doc]);
  const tokenDaVez = useMemo(
    () =>
      combate
        ? (tokens.find(token => token.id === combate.tokenDaVezId) ?? null)
        : null,
    [combate, tokens],
  );
  const meuTurno = Boolean(
    uid &&
    tokenDaVez &&
    !tokenDaVez.oculto &&
    (tokenDaVez.donos ?? []).includes(uid),
  );

  // Resolve true se trocou; false se não havia o que trocar, outra pessoa
  // trocou antes ou a escrita falhou (com aviso).
  const mudarTurno = useCallback(
    async passo => {
      if (!chave || !combate) return false;
      const esperado = { indice: combate.indice, rodada: combate.rodada };
      try {
        return await alterarGridCombate(campanhaId, cenaId, atual => {
          const servidor = normalizarCombate(atual);
          if (
            !servidor ||
            servidor.indice !== esperado.indice ||
            servidor.rodada !== esperado.rodada
          ) {
            return null;
          }
          const troca = trocarTurno(servidor, passo, tokens);
          if (!troca) return null;
          return {
            patch: troca.patch,
            mudouTurno: true,
            mensagem: autor
              ? montarMensagemCombate(autor, { ...troca.mensagem, cenaId })
              : null,
          };
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao passar o turno:', error);
        onErro?.('Não foi possível passar o turno.');
        return false;
      }
    },
    [autor, campanhaId, cenaId, chave, combate, onErro, tokens],
  );

  const encerrarTurno = useCallback(
    () => (meuTurno || veTudo ? mudarTurno(1) : Promise.resolve(false)),
    [meuTurno, mudarTurno, veTudo],
  );

  return { combate, tokenDaVez, meuTurno, mudarTurno, encerrarTurno };
};

export default useGridCombate;
