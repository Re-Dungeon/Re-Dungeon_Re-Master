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
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
} from 'common/utils/sessaoLog';
import {
  alterarGridCombate,
  encerrarGridCombate,
  iniciarGridCombate,
} from 'service/storage';
import { inserirVariosNoCombate, removerVariosDoCombate } from './gridMestre';

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
  campanha = null,
  cenaNome = '',
  confirmar,
}) => {
  // Registro automático da sessão (best-effort: nunca interrompe a ação).
  const registrar = useCallback(
    (tipo, mensagem) => {
      if (campanha) registrarEventoSessao(campanha, tipo, mensagem);
    },
    [campanha],
  );

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
      if (ok) {
        registrar(
          TIPO_EVENTO_SESSAO.COMBATE_INICIADO,
          `Combate iniciado em "${cenaNome}" com ${participantes.length} participantes.`,
        );
      }
      return Boolean(ok);
    },
    [autor, campanhaId, cenaId, cenaNome, registrar, tentar, tokens],
  );

  const encerrar = useCallback(
    async ({ confirmar: pedirConfirmacao = true } = {}) => {
      if (!cenaId || !combate) return false;
      if (
        pedirConfirmacao &&
        !(await confirmar({
          titulo: 'Encerrar o combate?',
          mensagem: 'Encerrar o combate desta cena?',
          confirmarTexto: 'Encerrar',
        }))
      ) {
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
      if (ok) {
        registrar(
          TIPO_EVENTO_SESSAO.COMBATE_ENCERRADO,
          `Combate encerrado em "${cenaNome}" na rodada ${combate.rodada}.`,
        );
      }
      return Boolean(ok);
    },
    [autor, campanhaId, cenaId, cenaNome, combate, confirmar, registrar, tentar],
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
        const confirmado = await confirmar({
          titulo: 'Encerrar o combate?',
          mensagem: 'Era o último participante: encerrar o combate desta cena?',
          confirmarTexto: 'Encerrar',
        });
        if (!confirmado) return false;
        return encerrar({ confirmar: false });
      }
      const ok = await alterar(servidor => {
        const resultado = removerDoCombate(servidor, tokenId, tokens);
        return resultado?.encerrar ? null : resultado;
      }, 'Não foi possível tirar do combate.');
      return Boolean(ok);
    },
    [alterar, combate, confirmar, encerrar, tokens],
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

  // Ação em lote: vários tokens entram no combate numa transação só, cada um
  // rolando a própria iniciativa. `entradas` = [{ tokenId, reacao }]. Devolve
  // quantos entraram (0 = ninguém / falha).
  const adicionarVarios = useCallback(
    async entradas => {
      if (!combate || entradas.length === 0) return 0;
      const novos = entradas.filter(
        entrada =>
          !combate.ordem.some(item => item.tokenId === entrada.tokenId),
      );
      if (novos.length === 0) return 0;
      const roladas = rolarIniciativa(novos);
      const ok = await alterar(
        servidor => inserirVariosNoCombate(servidor, roladas),
        'Não foi possível adicionar ao combate.',
      );
      return ok ? novos.length : 0;
    },
    [alterar, combate],
  );

  // Ação em lote: tira vários do combate numa transação só (sem perguntar —
  // quem chama já confirmou). Se saírem todos, o combate é encerrado.
  const removerVarios = useCallback(
    async tokenIds => {
      if (!combate) return true;
      const participantes = tokenIds.filter(id =>
        combate.ordem.some(item => item.tokenId === id),
      );
      if (participantes.length === 0) return true;
      if (participantes.length >= combate.ordem.length) {
        return encerrar({ confirmar: false });
      }
      const ok = await alterar(servidor => {
        const resultado = removerVariosDoCombate(
          servidor,
          participantes,
          tokens,
        );
        return resultado?.encerrar ? null : resultado;
      }, 'Não foi possível tirar do combate.');
      return Boolean(ok);
    },
    [alterar, combate, encerrar, tokens],
  );

  return {
    iniciar,
    encerrar,
    adicionar,
    remover,
    mover,
    adicionarVarios,
    removerVarios,
  };
};

export default useCombateMestre;
