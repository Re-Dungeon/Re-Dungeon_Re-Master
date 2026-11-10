import { useCallback } from 'react';

import { addChatMensagem, addChatRolagemSecreta } from 'service/storage';
import { montarMensagemRolagem } from 'common/utils/chat';
import { rolarEspecificacao } from 'common/utils/dados';
import { preparar } from 'common/utils/gridRolagem';

// "Rolar…" de um token do grid (cópia nos dois sites — mudou um, mude o
// outro). Interpreta a expressão, rola e posta a rolagem pública no chat da
// campanha (chatMensagens) como o AUTOR DO TOKEN (autorDoToken, em
// common/utils/gridRolagem.js), com o `rotulo` de onde veio ("Ataque: ...").
// Não levanta o estado do chat: o chat já escuta chatMensagens. Com `secreta`
// (só o Re:Master liga — RolarDoTokenDialog `permitirSecreta`) a rolagem vai
// para a pasta secreta do autor (chatSecretas/{uid}/rolagens, só o mestre vê),
// como o `rolar` do useChatCampanha. Devolve true se postou, `{ erro }` se a expressão
// não vale (a tela mostra sob o campo, sem snackbar) ou false se a escrita
// falhou (`onErro` avisa).
const useRolarDoToken = (campanhaId, { onErro } = {}) =>
  useCallback(
    async ({ autor, expressao, rotulo = null, secreta = false }) => {
      if (!campanhaId || !autor) return false;
      const preparada = preparar(expressao);
      if (preparada.erro) return { erro: preparada.erro };
      const rolagem = rolarEspecificacao(preparada);
      try {
        const mensagem = montarMensagemRolagem(autor, rolagem, Boolean(secreta), rotulo);
        await (secreta
          ? addChatRolagemSecreta(campanhaId, autor.uid, mensagem)
          : addChatMensagem(campanhaId, mensagem));
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao enviar a rolagem do token:', error);
        onErro?.('Não foi possível enviar a rolagem.');
        return false;
      }
    },
    [campanhaId, onErro],
  );

export default useRolarDoToken;
