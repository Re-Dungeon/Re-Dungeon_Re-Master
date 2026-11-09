import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { setGridPing, subscribeGridPings } from 'service/storage';
import {
  PING_DURACAO_MS,
  PING_INTERVALO_MS,
  corDoPing,
  detectarPings,
  normalizarPing,
} from 'common/utils/grid';

// Sinais no mapa (pings) de uma cena do grid, em tempo real (cópia nos dois
// sites — mudou um, mude o outro). Cada pessoa tem um doc
// (gridCenas/{cenaId}/pings/{uid}) sobrescrito a cada sinal; um sinal aparece
// quando chega um `criadoEm` novo (a carga inicial não mostra, como os
// rastros) e some em PING_DURACAO_MS. O meu sinal aparece na hora, local —
// os docs do meu uid que voltam do servidor são ignorados (assim o meu
// "puxar vista" nunca move a minha própria vista). `pingar` aceita no máximo
// um sinal por PING_INTERVALO_MS; `puxar` só vale com `podePuxar` (mestre).
// Retorna `pings`: [{ chave, uid, x, y, nome, puxar, proprio, cor }] (px do
// mundo — GridMapa, prop `pings`).
const SEM_PINGS = [];
const PINGS_VAZIOS = { chave: null, porUid: {} };

const useGridPings = (
  campanhaId,
  cenaId,
  { ativo = true, uid, nome = null, mestreId = null, podePuxar = false, onErro },
) => {
  const chave = ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  // Sinais na tela, da cena `chave` (trocar de cena esvazia sem setState no
  // efeito). Os refs só são lidos em callbacks/efeitos.
  const [estado, setEstado] = useState(PINGS_VAZIOS);
  const vistosRef = useRef({ chave: null, mapa: null });
  const temporizadoresRef = useRef(new Map());
  const contadorRef = useRef(0);
  const ultimoPingRef = useRef(0);
  const erroAvisadoRef = useRef(false);

  const mostrarPing = useCallback((chaveCena, ping) => {
    const temporizadores = temporizadoresRef.current;
    clearTimeout(temporizadores.get(ping.uid));
    contadorRef.current += 1;
    const id = `${ping.uid}-${contadorRef.current}`;
    setEstado(atual => ({
      chave: chaveCena,
      porUid: {
        ...(atual.chave === chaveCena ? atual.porUid : {}),
        [ping.uid]: {
          uid: ping.uid,
          chave: id,
          x: ping.x,
          y: ping.y,
          nome: ping.nome,
          puxar: ping.puxar,
          proprio: ping.proprio,
        },
      },
    }));
    temporizadores.set(
      ping.uid,
      setTimeout(() => {
        temporizadores.delete(ping.uid);
        setEstado(atual => {
          if (atual.chave !== chaveCena || atual.porUid[ping.uid]?.chave !== id)
            return atual;
          const porUid = { ...atual.porUid };
          delete porUid[ping.uid];
          return { chave: atual.chave, porUid };
        });
      }, PING_DURACAO_MS),
    );
  }, []);

  useEffect(() => {
    if (!chave) return undefined;
    // Cada escuta começa com uma carga inicial (sem sinais).
    vistosRef.current = { chave, mapa: null };
    const temporizadores = temporizadoresRef.current;
    const cancelar = subscribeGridPings(
      campanhaId,
      cenaId,
      docs => {
        const pings = docs.map(normalizarPing).filter(Boolean);
        const { vistos, novos } = detectarPings(vistosRef.current.mapa, pings);
        vistosRef.current = { chave, mapa: vistos };
        novos.forEach(ping => {
          if (ping.uid !== uid) mostrarPing(chave, { ...ping, proprio: false });
        });
      },
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir os sinais do grid:', error);
        // Jogador numa cena que acabou de deixar de ser a ativa: a escuta vai
        // ser trocada, não é erro.
        if (podePuxar || error?.code !== 'permission-denied') {
          onErro?.('Não foi possível receber os sinais do mapa.');
        }
      },
    );
    return () => {
      cancelar();
      temporizadores.forEach(clearTimeout);
      temporizadores.clear();
      // Sem os timers, nada tiraria os sinais da tela.
      setEstado(PINGS_VAZIOS);
    };
  }, [campanhaId, cenaId, chave, uid, podePuxar, onErro, mostrarPing]);

  // { x, y, puxar } em px do mundo → true se o sinal saiu.
  const pingar = useCallback(
    ({ x, y, puxar = false }) => {
      if (!chave) return false;
      const agora = Date.now();
      if (agora - ultimoPingRef.current < PING_INTERVALO_MS) return false;
      const ping = normalizarPing({
        uid,
        x,
        y,
        puxar: Boolean(puxar && podePuxar),
        nome,
      });
      if (!ping) return false;
      ultimoPingRef.current = agora;
      mostrarPing(chave, { ...ping, puxar: false, proprio: true });
      setGridPing(campanhaId, cenaId, uid, {
        x: ping.x,
        y: ping.y,
        puxar: ping.puxar,
        nome: ping.nome,
      }).catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao gravar o sinal do grid:', error);
        if (erroAvisadoRef.current) return;
        erroAvisadoRef.current = true;
        onErro?.('Não foi possível mostrar o sinal para a mesa.');
      });
      return true;
    },
    [campanhaId, cenaId, chave, mostrarPing, nome, onErro, podePuxar, uid],
  );

  const pings = useMemo(() => {
    if (!chave || estado.chave !== chave) return SEM_PINGS;
    const lista = Object.values(estado.porUid);
    return lista.length
      ? lista.map(entrada => ({ ...entrada, cor: corDoPing(entrada.uid, mestreId) }))
      : SEM_PINGS;
  }, [chave, estado, mestreId]);

  return { pings, pingar };
};

export default useGridPings;
