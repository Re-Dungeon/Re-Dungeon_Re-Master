import { useEffect, useState } from 'react';

import { setChatMembro } from 'service/storage';

// Garante o ponteiro rmCampanhas/{id}/chatMembros/{uid} = {uid, personagemId}
// que as regras usam para liberar o chat e o grid da campanha ao jogador. O
// mestre não precisa dele (acesso via `mestreId` da campanha). Devolve true
// quando já dá para abrir as escutas; `onFalha(campanhaId)` (estável — use
// useCallback) é chamado se o ponteiro não puder ser gravado.
//
// Economia de escritas: o ponteiro leva `updatedAt` (janela de 14 dias do
// `membroChatAtivo`, common/utils/chat.js), então basta regravar a cada 12 h.
// Este hook monta mais de uma vez por página (chat + grid) e a cada ida e volta
// entre páginas; por isso a última gravação bem-sucedida de cada
// {campanha, uid} fica em memória (só nesta aba — recarregar grava de novo uma
// vez) e uma montagem com o mesmo personagem dentro da janela não grava de
// novo. Não vai para o localStorage de propósito: o ponteiro pode ser apagado
// em outro aparelho (desmarcar a campanha na ficha), e um registro persistido
// faria esta aba pular a regravação e ficar sem acesso. Trocar de personagem
// grava na hora. Cópia nos dois sites.
export const JANELA_REGISTRO_MEMBRO_MS = 12 * 60 * 60 * 1000;

const registrosEmMemoria = new Map();
const gravacoesEmCurso = new Map();

const chaveDoMembro = (campanhaId, uid) => `${campanhaId}|${uid}`;

const lerRegistro = (campanhaId, uid) => registrosEmMemoria.get(chaveDoMembro(campanhaId, uid)) ?? null;

const guardarRegistro = (campanhaId, uid, registro) => {
  registrosEmMemoria.set(chaveDoMembro(campanhaId, uid), registro);
};

// Esquece o registro de uma campanha (o ponteiro foi apagado ou a campanha foi
// marcada de novo na ficha): a próxima montagem grava na hora.
export const esquecerRegistroMembroDoChat = (campanhaId, uid) => {
  registrosEmMemoria.delete(chaveDoMembro(campanhaId, uid));
  gravacoesEmCurso.delete(chaveDoMembro(campanhaId, uid));
};

// Esquece tudo o que foi gravado (testes).
export const limparRegistroMembroDoChat = () => {
  registrosEmMemoria.clear();
  gravacoesEmCurso.clear();
};

// Resolve quando o ponteiro está gravado — sem escrever de novo se o mesmo
// personagem já foi registrado nas últimas 12 h (ou se há uma gravação igual em
// andamento, que passa a ser compartilhada).
export const registrarMembroDoChat = (campanhaId, uid, personagemId, agora = Date.now()) => {
  const registro = lerRegistro(campanhaId, uid);
  if (
    registro &&
    registro.personagemId === personagemId &&
    agora - registro.em >= 0 &&
    agora - registro.em < JANELA_REGISTRO_MEMBRO_MS
  ) {
    return Promise.resolve();
  }
  const chave = chaveDoMembro(campanhaId, uid);
  const emCurso = gravacoesEmCurso.get(chave);
  if (emCurso && emCurso.personagemId === personagemId) return emCurso.promessa;

  const promessa = setChatMembro(campanhaId, uid, personagemId).then(
    () => {
      if (gravacoesEmCurso.get(chave)?.promessa === promessa) gravacoesEmCurso.delete(chave);
      guardarRegistro(campanhaId, uid, { personagemId, em: agora });
    },
    error => {
      if (gravacoesEmCurso.get(chave)?.promessa === promessa) gravacoesEmCurso.delete(chave);
      throw error;
    },
  );
  gravacoesEmCurso.set(chave, { personagemId, promessa });
  return promessa;
};

const useMembroDoChat = (campanhaId, { uid, personagemId, isMestre, onFalha }) => {
  // Campanha para a qual o ponteiro já foi gravado ao menos uma vez. Trocar de
  // personagem dentro da mesma campanha regrava o ponteiro, mas não derruba as
  // escutas (a regra de leitura é revalidada a cada request).
  const [membroDaCampanha, setMembroDaCampanha] = useState(null);

  useEffect(() => {
    if (!campanhaId || !uid || isMestre || !personagemId) return undefined;
    let isMounted = true;
    registrarMembroDoChat(campanhaId, uid, personagemId)
      .then(() => {
        if (isMounted) setMembroDaCampanha(campanhaId);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao registrar na campanha:', error);
        if (isMounted) onFalha?.(campanhaId);
      });
    return () => {
      isMounted = false;
    };
  }, [campanhaId, uid, personagemId, isMestre, onFalha]);

  return Boolean(campanhaId && uid && (isMestre || membroDaCampanha === campanhaId));
};

export default useMembroDoChat;
