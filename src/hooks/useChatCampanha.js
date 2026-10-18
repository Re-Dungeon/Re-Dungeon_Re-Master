import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addChatMensagem,
  addChatRolagemSecreta,
  removeChatMensagem,
  removeChatRolagemSecreta,
  subscribeChatMensagens,
  subscribeChatSecretasDoMestre,
  subscribeChatSecretasDoUsuario,
} from 'service/storage';
import {
  mesclarMensagens,
  montarMensagemImagem,
  montarMensagemMacro,
  montarMensagemRolagem,
  montarMensagemTexto,
} from 'common/utils/chat';
import { rolarEspecificacao } from 'common/utils/dados';
import useMacrosCampanha from 'hooks/useMacrosCampanha';
import useMembroDoChat from 'hooks/useMembroDoChat';

// Liga um componente ao chat de uma campanha (rmCampanhas/{id}/chatMensagens):
// registra o ponteiro chatMembros/{uid} do jogador, ouve as mensagens em tempo
// real (públicas + rolagens secretas visíveis a ele) e expõe
// enviar/rolar/apagar. Cópia do hook do site dos jogadores
// (Ficha-RPG---Re-Dungeon-) — aqui usado pela página Chat e pelo painel de
// chat do Grid, sempre como mestre (sem ponteiro de membro; vê as rolagens
// secretas de todos os membros). `autor` = campos de montarMensagem* (uid,
// personagemId, autorNome, autorAvatar, isMestre); `null` deixa o hook inativo
// (ex.: enquanto a campanha ainda carrega). `ehMestreDaCampanha`: quem está
// usando é o mestre (mesmo falando como personagem) — vê/gerencia todas as
// macros. Também executa macros Lua (common/lua/) e publica o que geraram.
const SEM_MENSAGENS = [];

// Id de cada pergunta de macro (key do diálogo — duas perguntas iguais
// seguidas ainda recomeçam do padrão).
let proximoIdPergunta = 0;

const useChatCampanha = (
  campanhaId,
  autor,
  { ehMestreDaCampanha = false } = {},
) => {
  const uid = autor?.uid ?? null;
  const personagemId = autor?.personagemId ?? null;
  const isMestre = Boolean(autor?.isMestre);

  // Mensagens guardadas junto da campanha a que pertencem: ao trocar de
  // campanha, `carregando` volta a true sem setState síncrono no efeito.
  const [recebido, setRecebido] = useState({ campanhaId: null, mensagens: [] });
  const [secretasRecebidas, setSecretasRecebidas] = useState({
    campanhaId: null,
    mensagens: [],
  });
  const [erro, setErro] = useState(null);
  // Pergunta pendente da macro em execução (inputQuery/choose):
  // { macroNome, pedido, responder(resposta), cancelar() }.
  const [perguntaMacro, setPerguntaMacro] = useState(null);
  const [macroRodando, setMacroRodando] = useState(null);

  const aoFalharMembro = useCallback(campanhaQueFalhou => {
    setErro('Não foi possível entrar no chat desta campanha.');
    setRecebido({ campanhaId: campanhaQueFalhou, mensagens: [] });
  }, []);
  const podeOuvir = useMembroDoChat(campanhaId, {
    uid,
    personagemId,
    isMestre,
    onFalha: aoFalharMembro,
  });

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

  const macrosApi = useMacrosCampanha(campanhaId, {
    ativo: podeOuvir,
    ehMestre: ehMestreDaCampanha || isMestre,
  });

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

  // Roda a macro num Web Worker (bundle do fengari carregado só agora) e,
  // fora do modo teste, publica as saídas na ordem — só depois que a macro
  // termina sem erro (erro/cancelamento = nada publicado). Em teste devolve as
  // saídas (e propaga o erro) para a prévia do editor.
  const executarMacro = useCallback(
    async (macro, { teste = false } = {}) => {
      const { executarMacro: rodarNoWorker, MacroCancelada } =
        await import('common/lua/executarMacro');
      setMacroRodando(macro.nome);
      try {
        const saidas = await rodarNoWorker(macro.codigo, {
          perguntar: pedido =>
            new Promise((resolve, reject) => {
              proximoIdPergunta += 1;
              setPerguntaMacro({
                id: proximoIdPergunta,
                macroNome: macro.nome,
                pedido,
                responder: resposta => {
                  setPerguntaMacro(null);
                  resolve(resposta);
                },
                cancelar: () => {
                  setPerguntaMacro(null);
                  reject(new MacroCancelada());
                },
              });
            }),
        });
        if (teste) return saidas;
        const mensagens = saidas.map(saida =>
          saida.tipo === 'rolagem'
            ? montarMensagemRolagem(autor, saida.rolagem)
            : montarMensagemMacro(autor, macro.nome, saida.texto),
        );
        await mensagens.reduce(
          (anterior, mensagem) =>
            anterior.then(() => addChatMensagem(campanhaId, mensagem)),
          Promise.resolve(),
        );
        return saidas;
      } catch (error) {
        if (error instanceof MacroCancelada) return null;
        if (teste) throw error;
        // eslint-disable-next-line no-console
        console.error('Falha na macro:', error);
        setErro(`A macro "${macro.nome}" falhou: ${error.message}`);
        return null;
      } finally {
        setMacroRodando(null);
        setPerguntaMacro(null);
      }
    },
    [autor, campanhaId],
  );

  // Formato da prop `macros` do ChatSala (pronto para as páginas repassarem).
  const podeGerenciarMacros = ehMestreDaCampanha || isMestre;
  const {
    macros: listaMacros,
    carregando: carregandoMacros,
    salvarMacro,
    apagarMacro,
    moverMacro,
  } = macrosApi;
  const macros = useMemo(
    () => ({
      lista: listaMacros,
      carregando: carregandoMacros,
      podeGerenciar: podeGerenciarMacros,
      rodando: macroRodando,
      pergunta: perguntaMacro,
      executar: macro => executarMacro(macro),
      testar: macro => executarMacro(macro, { teste: true }),
      salvar: salvarMacro,
      apagar: apagarMacro,
      mover: moverMacro,
    }),
    [
      listaMacros,
      carregandoMacros,
      podeGerenciarMacros,
      macroRodando,
      perguntaMacro,
      executarMacro,
      salvarMacro,
      apagarMacro,
      moverMacro,
    ],
  );

  const { erro: erroMacros, limparErro: limparErroMacros } = macrosApi;
  const limparErro = useCallback(() => {
    setErro(null);
    limparErroMacros();
  }, [limparErroMacros]);

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
    erro: erro ?? erroMacros,
    limparErro,
    macros,
    enviarTexto,
    enviarImagem,
    rolar,
    apagar,
  };
};

export default useChatCampanha;
