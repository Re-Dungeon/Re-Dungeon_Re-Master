import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addChatMacro,
  getChatMacros,
  removeChatMacro,
  updateChatMacro,
} from 'service/storage';
import {
  ordenarMacros,
  proximaOrdem,
  reordenarMacros,
} from 'common/utils/macros';

const SEM_MACROS = [];

// Lista e gerencia as macros Lua de uma campanha (rmCampanhas/{id}/macros).
// `ativo`: só busca quando o usuário já pode ler (jogador depois de gravar o
// ponteiro de membro). `ehMestre`: vê também as `somenteMestre` e pode
// salvar/apagar/reordenar (as regras garantem — a UI só esconde os botões).
// Usado por hooks/useChatCampanha.js.
const useMacrosCampanha = (campanhaId, { ativo, ehMestre }) => {
  const [carregadas, setCarregadas] = useState({
    chave: null,
    macros: SEM_MACROS,
  });
  const [versao, setVersao] = useState(0);
  const [erro, setErro] = useState(null);
  const chave =
    ativo && campanhaId ? `${campanhaId}:${ehMestre}:${versao}` : null;

  useEffect(() => {
    if (!chave) return undefined;
    let isMounted = true;
    getChatMacros(campanhaId, { incluirSomenteMestre: ehMestre })
      .then(macros => {
        if (isMounted) setCarregadas({ chave, macros });
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao carregar macros:', error);
        if (!isMounted) return;
        setErro('Não foi possível carregar as macros da campanha.');
        setCarregadas({ chave, macros: SEM_MACROS });
      });
    return () => {
      isMounted = false;
    };
  }, [chave, campanhaId, ehMestre]);

  const macros = useMemo(
    () =>
      carregadas.chave === chave
        ? ordenarMacros(carregadas.macros)
        : SEM_MACROS,
    [carregadas, chave],
  );
  const carregando = Boolean(chave) && carregadas.chave !== chave;
  const recarregar = useCallback(() => setVersao(atual => atual + 1), []);

  const comErro = useCallback(
    async (acao, mensagem) => {
      try {
        await acao();
        recarregar();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(mensagem, error);
        setErro(mensagem);
        throw error;
      }
    },
    [recarregar],
  );

  // `macro` sem id = nova (entra no fim da lista).
  const salvarMacro = useCallback(
    ({ id, nome, descricao = '', codigo, somenteMestre = false }) =>
      comErro(() => {
        const dados = {
          nome: nome.trim(),
          descricao: descricao.trim(),
          codigo,
          somenteMestre: Boolean(somenteMestre),
        };
        return id
          ? updateChatMacro(campanhaId, id, dados)
          : addChatMacro(campanhaId, { ...dados, ordem: proximaOrdem(macros) });
      }, 'Não foi possível salvar a macro.'),
    [campanhaId, comErro, macros],
  );

  const apagarMacro = useCallback(
    macro =>
      comErro(
        () => removeChatMacro(campanhaId, macro.id),
        'Não foi possível apagar a macro.',
      ),
    [campanhaId, comErro],
  );

  const moverMacro = useCallback(
    (indice, direcao) =>
      comErro(
        () =>
          Promise.all(
            reordenarMacros(macros, indice, direcao).map(({ id, ordem }) =>
              updateChatMacro(campanhaId, id, { ordem }),
            ),
          ),
        'Não foi possível reordenar as macros.',
      ),
    [campanhaId, comErro, macros],
  );

  return {
    macros,
    carregando,
    erro,
    limparErro: useCallback(() => setErro(null), []),
    salvarMacro,
    apagarMacro,
    moverMacro,
  };
};

export default useMacrosCampanha;
