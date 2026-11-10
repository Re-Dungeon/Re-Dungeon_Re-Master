import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAudioDoChat } from 'context/AudioMesaContext';
import {
  addChatMensagem,
  addChatRolagemSecreta,
  getChatMensagensAntes,
  removeChatMensagem,
  removeChatRolagemSecreta,
  subscribeChatMensagens,
  subscribeChatSecretasDoMestre,
  subscribeChatSecretasDoUsuario,
} from 'service/storage';
import {
  CHAT_JANELA_MENSAGENS,
  CHAT_PAGINA_ANTERIORES,
  mesclarComAntigas,
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
// enviar/rolar/apagar. Cópia compartilhada (site dos jogadores ↔ Re:Master;
// scripts/check-shared.mjs): no site dos jogadores é usado pela página
// /campanhas/:id/chat e pelo modal "Chat" da ficha; no Re:Master, pela página
// Chat e pelo painel de chat do Grid, sempre como mestre (sem ponteiro de
// membro; vê as rolagens secretas de todos). `autor` = campos de montarMensagem* (uid,
// personagemId, autorNome, autorAvatar, isMestre); `null` deixa o hook inativo
// (ex.: enquanto a campanha ainda carrega). `ehMestreDaCampanha`: quem está
// usando é o mestre (mesmo falando como personagem) — vê/gerencia todas as
// macros. Também executa macros Lua (common/lua/) e publica o que geraram,
// e liga a música da mesa (`audio`, hooks/useAudioMesa.js — quem usa monta
// <PlayerAudioMesa {...audio.player} />). A janela ao vivo guarda só as últimas
// CHAT_JANELA_MENSAGENS; `carregarAnteriores()` busca páginas mais antigas
// (getChatMensagensAntes), que ficam guardadas por campanha e são mescladas à
// janela por id — uma mensagem que sai da janela ao vivo continua na tela se já
// tinha sido carregada. `temMaisAntigas`/`carregandoAntigas` guiam o botão.
// `carregarAnteriores()` resolve `true` se buscou (com ou sem erro) e `false`
// se não havia o que buscar.
const SEM_MENSAGENS = [];
const SEM_ANTIGAS = { mensagens: SEM_MENSAGENS, acabou: false, carregando: false };

// Id de cada pergunta de macro (key do diálogo — duas perguntas iguais
// seguidas ainda recomeçam do padrão).
let proximoIdPergunta = 0;

const useChatCampanha = (campanhaId, autor, { ehMestreDaCampanha = false } = {}) => {
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
  const [antigasEstado, setAntigasEstado] = useState({
    campanhaId: null,
    ...SEM_ANTIGAS,
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

  // Cada app liga a música do seu jeito (context/AudioMesaContext.jsx).
  const audio = useAudioDoChat(campanhaId, {
    podeOuvir,
    podeControlar: ehMestreDaCampanha || isMestre,
  });

  const macrosApi = useMacrosCampanha(campanhaId, {
    ativo: podeOuvir,
    ehMestre: ehMestreDaCampanha || isMestre,
  });

  // Rolagens secretas: o jogador vê só as dele; quem fala como mestre vê as
  // de todos os membros (chatSecretas/{uid}/rolagens de cada um).
  useEffect(() => {
    if (!podeOuvir) return undefined;
    const aoMudar = mensagens => setSecretasRecebidas({ campanhaId, mensagens });
    const aoErrar = error => {
      // eslint-disable-next-line no-console
      console.error('Falha ao ouvir rolagens secretas:', error);
      setErro('Não foi possível carregar as rolagens secretas.');
    };
    return isMestre
      ? subscribeChatSecretasDoMestre(campanhaId, uid, aoMudar, aoErrar)
      : subscribeChatSecretasDoUsuario(campanhaId, uid, aoMudar, aoErrar);
  }, [campanhaId, podeOuvir, isMestre, uid]);

  const antigas = antigasEstado.campanhaId === campanhaId ? antigasEstado : SEM_ANTIGAS;
  const publicasAoVivo =
    recebido.campanhaId === campanhaId ? recebido.mensagens : SEM_MENSAGENS;

  const carregarAnteriores = useCallback(async () => {
    if (!podeOuvir || antigas.carregando || antigas.acabou) return false;
    // Referência = a mensagem pública mais antiga que a tela já tem (as sem
    // horário ainda são pendentes de envio).
    const referencia = mesclarComAntigas(publicasAoVivo, antigas.mensagens).find(
      mensagem => mensagem.createdAt,
    )?.createdAt;
    if (!referencia) return false;
    setAntigasEstado({ campanhaId, ...antigas, carregando: true });
    try {
      const lote = await getChatMensagensAntes(
        campanhaId,
        referencia,
        CHAT_PAGINA_ANTERIORES,
      );
      setAntigasEstado(atual => {
        // Trocou de campanha no meio da busca: descarta.
        if (atual.campanhaId !== campanhaId) return atual;
        const ids = new Set(atual.mensagens.map(mensagem => mensagem.id));
        return {
          campanhaId,
          mensagens: [...lote.filter(mensagem => !ids.has(mensagem.id)), ...atual.mensagens],
          acabou: lote.length < CHAT_PAGINA_ANTERIORES,
          carregando: false,
        };
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Falha ao carregar mensagens anteriores:', error);
      setErro('Não foi possível carregar as mensagens anteriores.');
      setAntigasEstado(atual =>
        atual.campanhaId === campanhaId ? { ...atual, carregando: false } : atual,
      );
    }
    return true;
  }, [campanhaId, podeOuvir, antigas, publicasAoVivo]);

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
        Boolean(especificacao?.secreta),
        especificacao?.rotulo ?? null,
      );
      try {
        await (especificacao?.secreta
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
  const { erro: erroAudio, limparErro: limparErroAudio } = audio;
  const limparErro = useCallback(() => {
    setErro(null);
    limparErroMacros();
    limparErroAudio();
  }, [limparErroMacros, limparErroAudio]);

  const carregando = recebido.campanhaId !== campanhaId;
  const secretas =
    secretasRecebidas.campanhaId === campanhaId
      ? secretasRecebidas.mensagens
      : SEM_MENSAGENS;
  const mensagens = useMemo(
    () =>
      carregando
        ? []
        : mesclarMensagens(mesclarComAntigas(recebido.mensagens, antigas.mensagens), secretas),
    [carregando, recebido.mensagens, antigas.mensagens, secretas],
  );
  // Só há o que carregar se a janela ao vivo está cheia (ou se já veio uma
  // página antiga) e a última busca não voltou incompleta.
  const temMaisAntigas =
    !carregando &&
    !antigas.acabou &&
    (publicasAoVivo.length >= CHAT_JANELA_MENSAGENS || antigas.mensagens.length > 0);

  return {
    mensagens,
    carregando,
    erro: erro ?? erroMacros ?? erroAudio,
    limparErro,
    macros,
    audio,
    enviarTexto,
    enviarImagem,
    rolar,
    apagar,
    carregarAnteriores,
    temMaisAntigas,
    carregandoAntigas: antigas.carregando,
  };
};

export default useChatCampanha;
