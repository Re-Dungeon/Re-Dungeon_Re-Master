import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addChatMensagem,
  addChatRolagemSecreta,
  removeChatMensagem,
  removeChatRolagemSecreta,
  setChatMembro,
  subscribeChatMensagens,
  subscribeChatSecretasDoMestre,
  subscribeChatSecretasDoUsuario,
} from 'service/storage';
import {
  mesclarMensagens,
  montarMensagemImagem,
  montarMensagemRolagem,
  montarMensagemTexto,
} from 'common/utils/chat';
import { rolarEspecificacao } from 'common/utils/dados';

// Liga um componente ao chat de uma campanha (rmCampanhas/{id}/chatMensagens):
// registra o ponteiro chatMembros/{uid} do jogador, ouve as mensagens em tempo
// real (públicas + rolagens secretas visíveis a ele) e expõe
// enviar/rolar/apagar. Cópia do hook do site dos jogadores
// (Ficha-RPG---Re-Dungeon-) — aqui usado pela página Chat, sempre como mestre
// (sem ponteiro de membro; vê as rolagens secretas de todos os membros). `autor` = campos de montarMensagem* (uid,
// personagemId, autorNome, autorAvatar, isMestre); `null` deixa o hook inativo
// (ex.: enquanto a campanha ainda carrega).
const SEM_MENSAGENS = [];

const useChatCampanha = (campanhaId, autor) => {
  const uid = autor?.uid ?? null;
  const personagemId = autor?.personagemId ?? null;
  const isMestre = Boolean(autor?.isMestre);

  // Campanha para a qual o ponteiro de membro já foi gravado ao menos uma vez.
  // Trocar de personagem dentro da mesma campanha regrava o ponteiro, mas não
  // derruba a escuta (a regra de leitura é revalidada a cada request).
  const [membroDaCampanha, setMembroDaCampanha] = useState(null);
  // Mensagens guardadas junto da campanha a que pertencem: ao trocar de
  // campanha, `carregando` volta a true sem setState síncrono no efeito.
  const [recebido, setRecebido] = useState({ campanhaId: null, mensagens: [] });
  const [secretasRecebidas, setSecretasRecebidas] = useState({
    campanhaId: null,
    mensagens: [],
  });
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!campanhaId || !uid || isMestre || !personagemId) return undefined;
    let isMounted = true;
    setChatMembro(campanhaId, uid, personagemId)
      .then(() => {
        if (isMounted) setMembroDaCampanha(campanhaId);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao registrar no chat:', error);
        if (!isMounted) return;
        setErro('Não foi possível entrar no chat desta campanha.');
        setRecebido({ campanhaId, mensagens: [] });
      });
    return () => {
      isMounted = false;
    };
  }, [campanhaId, uid, personagemId, isMestre]);

  // O mestre não precisa do ponteiro (acesso via `mestreId` da campanha).
  const podeOuvir = Boolean(
    campanhaId && uid && (isMestre || membroDaCampanha === campanhaId),
  );

  useEffect(() => {
    if (!podeOuvir) return undefined;
    return subscribeChatMensagens(
      campanhaId,
      mensagens => setRecebido({ campanhaId, mensagens }),
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir mensagens:', error);
        setErro('Sem permissão para ver as mensagens desta campanha.');
        setRecebido({ campanhaId, mensagens: [] });
      },
    );
  }, [campanhaId, podeOuvir]);

  // Rolagens secretas: o jogador vê só as dele; quem fala como mestre vê as
  // de todos os membros (chatSecretas/{uid}/rolagens de cada um).
  useEffect(() => {
    if (!podeOuvir) return undefined;
    const aoMudar = mensagens =>
      setSecretasRecebidas({ campanhaId, mensagens });
    const aoErrar = error => {
      // eslint-disable-next-line no-console
      console.error('Falha ao ouvir rolagens secretas:', error);
      setErro('Não foi possível carregar as rolagens secretas.');
    };
    return isMestre
      ? subscribeChatSecretasDoMestre(campanhaId, uid, aoMudar, aoErrar)
      : subscribeChatSecretasDoUsuario(campanhaId, uid, aoMudar, aoErrar);
  }, [campanhaId, podeOuvir, isMestre, uid]);

  const enviar = useCallback(
    async mensagem => {
      try {
        await addChatMensagem(campanhaId, mensagem);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao enviar mensagem:', error);
        setErro('Não foi possível enviar a mensagem.');
        throw error;
      }
    },
    [campanhaId],
  );

  const enviarTexto = useCallback(
    texto => enviar(montarMensagemTexto(autor, texto)),
    [enviar, autor],
  );
  const enviarImagem = useCallback(
    url => enviar(montarMensagemImagem(autor, url)),
    [enviar, autor],
  );

  // Rola no cliente (crypto) e grava: pública em chatMensagens, secreta na
  // pasta do próprio usuário.
  const rolar = useCallback(
    async especificacao => {
      const rolagem = rolarEspecificacao(especificacao);
      const mensagem = montarMensagemRolagem(
        autor,
        rolagem,
        especificacao.secreta,
      );
      try {
        await (especificacao.secreta
          ? addChatRolagemSecreta(campanhaId, uid, mensagem)
          : addChatMensagem(campanhaId, mensagem));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao enviar rolagem:', error);
        setErro('Não foi possível enviar a rolagem.');
        throw error;
      }
    },
    [campanhaId, uid, autor],
  );

  const apagar = useCallback(
    async mensagem => {
      if (!window.confirm('Apagar esta mensagem?')) return;
      try {
        await (mensagem.secreta
          ? removeChatRolagemSecreta(campanhaId, mensagem.donoUid, mensagem.id)
          : removeChatMensagem(campanhaId, mensagem.id));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao apagar mensagem:', error);
        setErro('Não foi possível apagar a mensagem.');
      }
    },
    [campanhaId],
  );

  const limparErro = useCallback(() => setErro(null), []);

  const carregando = recebido.campanhaId !== campanhaId;
  const secretas =
    secretasRecebidas.campanhaId === campanhaId
      ? secretasRecebidas.mensagens
      : SEM_MENSAGENS;
  const mensagens = useMemo(
    () => (carregando ? [] : mesclarMensagens(recebido.mensagens, secretas)),
    [carregando, recebido.mensagens, secretas],
  );

  return {
    mensagens,
    carregando,
    erro,
    limparErro,
    enviarTexto,
    enviarImagem,
    rolar,
    apagar,
  };
};

export default useChatCampanha;
