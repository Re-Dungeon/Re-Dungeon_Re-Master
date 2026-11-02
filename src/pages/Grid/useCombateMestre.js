import { useCallback } from 'react';
import { montarMensagemCombate } from 'common/utils/chat';
import {
  inserirNoCombate,
  montarInicioDoCombate,
  moverNoCombate,
  normalizarCombate,
  removerDoCombate,
  rolarIniciativa,
} from 'common/utils/gridCombate';
import {
  alterarGridCombate,
  encerrarGridCombate,
  iniciarGridCombate,
} from 'service/storage';

/**
 * Ações do mestre sobre o combate da cena aberta (Fase 3A): iniciar (rola
 * 1d20 + Reação de todos e anuncia no chat), encerrar e ajustar os
 * participantes (adicionar/tirar/reordenar — sem mensagem no chat). Passar o
 * turno fica em `useGridCampanha().mudarTurno`. `tentar(acao, erro)` mostra o
 * erro no Snackbar e devolve undefined se a escrita falhar.
 */
const useCombateMestre = ({
  campanhaId,
  cenaId,
  combate,
  tokens,
  autor,
  tentar,
  notifySuccess,
}) => {
  const iniciar = useCallback(
    async participantes => {
      if (!cenaId || participantes.length === 0) return false;
      const ordem = rolarIniciativa(participantes);
      const { estado, mensagem } = montarInicioDoCombate(ordem, tokens);
      const ok = await tentar(
        () =>
          iniciarGridCombate(
            campanhaId,
            cenaId,
            estado,
            montarMensagemCombate(autor, { ...mensagem, cenaId }),
          ).then(() => true),
        'Não foi possível iniciar o combate.',
      );
      return Boolean(ok);
    },
    [autor, campanhaId, cenaId, tentar, tokens],
  );

  const encerrar = useCallback(
    async ({ confirmar = true } = {}) => {
      if (!cenaId || !combate) return false;
      if (confirmar && !window.confirm('Encerrar o combate desta cena?')) {
        return false;
      }
      const ok = await tentar(
        () =>
          encerrarGridCombate(
            campanhaId,
            cenaId,
            montarMensagemCombate(autor, { evento: 'fim', cenaId }),
          ).then(() => true),
        'Não foi possível encerrar o combate.',
      );
      return Boolean(ok);
    },
    [autor, campanhaId, cenaId, combate, tentar],
  );

  // Escreve o patch calculado sobre o estado do SERVIDOR (transação).
  const alterar = useCallback(
    (calcular, mensagemErro) =>
      tentar(
        () =>
          alterarGridCombate(campanhaId, cenaId, atual => {
            const servidor = normalizarCombate(atual);
            return servidor ? calcular(servidor) : null;
          }),
        mensagemErro,
      ),
    [campanhaId, cenaId, tentar],
  );

  // Quem entra no meio do combate rola a própria iniciativa na hora.
  const adicionar = useCallback(
    async ({ tokenId, reacao }) => {
      if (!combate) return false;
      const [rolada] = rolarIniciativa([{ tokenId, reacao }]);
      const ok = await alterar(
        servidor => inserirNoCombate(servidor, rolada),
        'Não foi possível adicionar ao combate.',
      );
      if (ok) {
        const nome = tokens.find(token => token.id === tokenId)?.nome;
        const sinal = rolada.reacao < 0 ? '−' : '+';
        notifySuccess(
          `${nome ?? 'O token'} entrou no combate: iniciativa ${rolada.iniciativa} (d20 ${rolada.d20} ${sinal} Reação ${Math.abs(rolada.reacao)}).`,
        );
      }
      return Boolean(ok);
    },
    [alterar, combate, notifySuccess, tokens],
  );

  // Tirar o último participante encerra o combate (com confirmação).
  const remover = useCallback(
    async tokenId => {
      if (!combate?.ordem.some(item => item.tokenId === tokenId)) return false;
      if (combate.ordem.length === 1) {
        if (
          !window.confirm(
            'Era o último participante: encerrar o combate desta cena?',
          )
        ) {
          return false;
        }
        return encerrar({ confirmar: false });
      }
      const ok = await alterar(servidor => {
        const resultado = removerDoCombate(servidor, tokenId, tokens);
        return resultado?.encerrar ? null : resultado;
      }, 'Não foi possível tirar do combate.');
      return Boolean(ok);
    },
    [alterar, combate, encerrar, tokens],
  );

  const mover = useCallback(
    async (tokenId, passo) => {
      const ok = await alterar(
        servidor => moverNoCombate(servidor, tokenId, passo),
        'Não foi possível reordenar o combate.',
      );
      return Boolean(ok);
    },
    [alterar],
  );

  return { iniciar, encerrar, adicionar, remover, mover };
};

export default useCombateMestre;
