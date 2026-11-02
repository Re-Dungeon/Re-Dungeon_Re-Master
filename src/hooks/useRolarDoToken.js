import { useCallback } from 'react';

import { addChatMensagem } from 'service/storage';
import { montarMensagemRolagem } from 'common/utils/chat';
import { rolarEspecificacao } from 'common/utils/dados';
import { preparar } from 'common/utils/gridRolagem';

// "Rolar…" de um token do grid (cópia nos dois sites — mudou um, mude o
// outro). Interpreta a expressão, rola e posta a rolagem pública no chat da
// campanha (chatMensagens) como o AUTOR DO TOKEN (autorDoToken, em
// common/utils/gridRolagem.js), com o `rotulo` de onde veio ("Ataque: ...").
// Não levanta o estado do chat: o chat já escuta chatMensagens. Não existe
// rolagem secreta por aqui. Devolve true se postou, `{ erro }` se a expressão
// não vale (a tela mostra sob o campo, sem snackbar) ou false se a escrita
// falhou (`onErro` avisa).
const useRolarDoToken = (campanhaId, { onErro } = {}) =>
  useCallback(
    async ({ autor, expressao, rotulo = null }) => {
      if (!campanhaId || !autor) return false;
      const preparada = preparar(expressao);
      if (preparada.erro) return { erro: preparada.erro };
      const rolagem = rolarEspecificacao(preparada);
      try {
        await addChatMensagem(
          campanhaId,
          montarMensagemRolagem(autor, rolagem, false, rotulo),
        );
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
