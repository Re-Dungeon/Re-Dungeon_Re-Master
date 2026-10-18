import fengari from 'fengari';

import {
  interpretarExpressaoRolagem,
  randomUint32,
  rolarEspecificacao,
  rolarFace,
} from 'common/utils/dados';

// Execução de macros Lua do chat (estilo Firecast) — Lua 5.3 via fengari.
// Puro e síncrono: roda passo a passo e para nos pedidos ao usuário
// (`inputQuery`/`choose`), devolvendo o pedido para quem chamou responder.
// Em produção roda dentro de um Web Worker (macroWorker.js); nos testes roda
// direto. Mantido em sincronia com a cópia do site dos jogadores.
//
// Isolamento: só as bibliotecas `base` (sem load/dofile/loadfile/print/
// collectgarbage), `math`, `string` e `table` são abertas — sem `os`, `io`,
// `package`/`require`, `debug`, `coroutine`, `utf8` nem ponte com o JS. A
// macro não alcança o Firebase: as únicas saídas são `enviar`/`rolar`, que só
// acumulam o que será publicado no chat por quem chamou.

const { lua, lauxlib, lualib, to_luastring: luaStr } = fengari;

export const LIMITE_INSTRUCOES = 10_000_000;
export const LIMITE_ENVIAR = 5;
export const LIMITE_ROLAR = 10;
export const MACRO_TEXTO_MAX = 4000;

const INTERVALO_HOOK = 1000;
const NOME_CHUNK = '=macro'; // erros saem como "macro:12: mensagem"
const GLOBAIS_REMOVIDAS = [
  'dofile',
  'loadfile',
  'load',
  'loadstring',
  'collectgarbage',
  'print',
  'require',
];

const abrirBiblioteca = (L, nome, abridor) => {
  lauxlib.luaL_requiref(L, luaStr(nome), abridor, 1);
  lua.lua_pop(L, 1);
};

// Levanta um erro Lua com texto JS (sem passar por formatação de luaL_error,
// que interpretaria "%" na mensagem).
const erroLua = (L, mensagem) => {
  lua.lua_pushstring(L, luaStr(mensagem));
  return lua.lua_error(L);
};

const textoDoArgumento = (L, indice) => {
  if (lua.lua_isnoneornil(L, indice)) return '';
  lauxlib.luaL_tolstring(L, indice);
  const texto = lua.lua_tojsstring(L, -1);
  lua.lua_pop(L, 1);
  return texto;
};

const definirFuncao = (L, nome, funcao) => {
  lua.lua_pushjsfunction(L, funcao);
  lua.lua_setglobal(L, luaStr(nome));
};

const removerGlobais = L => {
  GLOBAIS_REMOVIDAS.forEach(nome => {
    lua.lua_pushnil(L);
    lua.lua_setglobal(L, luaStr(nome));
  });
};

// math.random/randomseed com o gerador criptográfico (mesma semântica do Lua:
// sem args → [0,1); (m) → [1,m]; (m,n) → [m,n]).
const instalarRandom = (L, randomFn) => {
  lua.lua_getglobal(L, luaStr('math'));
  lua.lua_pushjsfunction(L, Lr => {
    const nargs = lua.lua_gettop(Lr);
    if (nargs === 0) {
      lua.lua_pushnumber(Lr, randomFn() / 2 ** 32);
      return 1;
    }
    const minimo = nargs >= 2 ? lauxlib.luaL_checkinteger(Lr, 1) : 1;
    const maximo = lauxlib.luaL_checkinteger(Lr, nargs >= 2 ? 2 : 1);
    if (minimo > maximo)
      return erroLua(Lr, "bad argument to 'random' (interval is empty)");
    const tamanho = maximo - minimo + 1;
    if (tamanho > 2 ** 32)
      return erroLua(Lr, "bad argument to 'random' (interval too large)");
    lua.lua_pushinteger(Lr, minimo - 1 + rolarFace(tamanho, randomFn));
    return 1;
  });
  lua.lua_setfield(L, -2, luaStr('random'));
  lua.lua_pushjsfunction(L, () => 0); // randomseed: no-op (o gerador não tem semente)
  lua.lua_setfield(L, -2, luaStr('randomseed'));
  lua.lua_pop(L, 1);
};

const opcoesDaTabela = (L, indice) => {
  lauxlib.luaL_checktype(L, indice, lua.LUA_TTABLE);
  const tamanho = lua.lua_rawlen(L, indice);
  const opcoes = [];
  for (let i = 1; i <= tamanho; i += 1) {
    lua.lua_rawgeti(L, indice, i);
    opcoes.push(textoDoArgumento(L, -1));
    lua.lua_pop(L, 1);
  }
  return opcoes;
};

// Cria uma execução da macro. Uso:
//   const execucao = criarExecucao(codigo);
//   let passo = execucao.iniciar();
//   while (passo.pedido) passo = execucao.responder(respostaDoUsuario);
//   // passo.fim.saidas  |  passo.erro
// Respostas: `input` → string (ou null = cancelou a pergunta); `choose` →
// índice 1-based (ou null). Cancelar a macro inteira é responsabilidade de
// quem chama (simplesmente não chamar mais `responder`).
export const criarExecucao = (
  codigo,
  { randomFn = randomUint32, limiteInstrucoes = LIMITE_INSTRUCOES } = {},
) => {
  const L = lauxlib.luaL_newstate();
  abrirBiblioteca(L, '_G', lualib.luaopen_base);
  abrirBiblioteca(L, 'math', lualib.luaopen_math);
  abrirBiblioteca(L, 'string', lualib.luaopen_string);
  abrirBiblioteca(L, 'table', lualib.luaopen_table);
  removerGlobais(L);
  instalarRandom(L, randomFn);

  const saidas = [];
  let quantidadeEnviar = 0;
  let quantidadeRolar = 0;
  let pedidoAtual = null;
  let instrucoes = 0;
  let encerrada = false;

  definirFuncao(L, 'enviar', Lf => {
    const texto = textoDoArgumento(Lf, 1);
    quantidadeEnviar += 1;
    if (quantidadeEnviar > LIMITE_ENVIAR)
      return erroLua(
        Lf,
        `enviar: no máximo ${LIMITE_ENVIAR} mensagens por macro`,
      );
    if (texto.length > MACRO_TEXTO_MAX) {
      return erroLua(
        Lf,
        `enviar: mensagem com mais de ${MACRO_TEXTO_MAX} caracteres`,
      );
    }
    if (texto.trim()) saidas.push({ tipo: 'texto', texto });
    return 0;
  });

  const rolarExpressao = (Lf, nomeFuncao, publicar) => {
    const expressao = textoDoArgumento(Lf, 1).trim();
    if (!publicar && (expressao === '' || expressao === '0')) {
      lua.lua_pushinteger(Lf, 0);
      return 1;
    }
    const especificacao = interpretarExpressaoRolagem(expressao, {
      exigirDado: publicar,
    });
    if (especificacao.erro)
      return erroLua(
        Lf,
        `${nomeFuncao}("${expressao}"): ${especificacao.erro}`,
      );
    if (publicar) {
      quantidadeRolar += 1;
      if (quantidadeRolar > LIMITE_ROLAR)
        return erroLua(
          Lf,
          `rolar: no máximo ${LIMITE_ROLAR} rolagens por macro`,
        );
    }
    const rolagem = rolarEspecificacao(especificacao, randomFn);
    if (publicar) saidas.push({ tipo: 'rolagem', rolagem });
    lua.lua_pushinteger(Lf, rolagem.total);
    return 1;
  };

  definirFuncao(L, 'rolar', Lf => rolarExpressao(Lf, 'rolar', true));
  definirFuncao(L, 'rolarLocal', Lf => rolarExpressao(Lf, 'rolarLocal', false));

  definirFuncao(L, 'inputQuery', Lf => {
    pedidoAtual = {
      tipo: 'input',
      pergunta: textoDoArgumento(Lf, 1),
      padrao: lua.lua_isnoneornil(Lf, 2) ? '' : textoDoArgumento(Lf, 2),
    };
    return lua.lua_yield(Lf, 0);
  });

  definirFuncao(L, 'choose', Lf => {
    const titulo = textoDoArgumento(Lf, 1);
    const opcoes = opcoesDaTabela(Lf, 2);
    const padrao = lua.lua_isnoneornil(Lf, 3)
      ? 1
      : lauxlib.luaL_checkinteger(Lf, 3);
    if (opcoes.length === 0)
      return erroLua(Lf, 'choose: a lista de opções está vazia');
    pedidoAtual = {
      tipo: 'choose',
      titulo,
      opcoes,
      padrao: Math.min(Math.max(padrao, 1), opcoes.length),
    };
    return lua.lua_yield(Lf, 0);
  });

  const co = lua.lua_newthread(L);
  lua.lua_sethook(
    co,
    Lh => {
      instrucoes += INTERVALO_HOOK;
      if (instrucoes > limiteInstrucoes) {
        erroLua(
          Lh,
          'a macro excedeu o limite de processamento (laço infinito?)',
        );
      }
    },
    lua.LUA_MASKCOUNT,
    INTERVALO_HOOK,
  );

  const carregou = lauxlib.luaL_loadbuffer(
    co,
    luaStr(String(codigo ?? '')),
    null,
    luaStr(NOME_CHUNK),
  );

  const continuar = nargs => {
    if (encerrada) return { erro: 'A macro já terminou.' };
    pedidoAtual = null;
    const status = lua.lua_resume(co, L, nargs);
    if (status === lua.LUA_YIELD && pedidoAtual) return { pedido: pedidoAtual };
    encerrada = true;
    if (status === lua.LUA_OK) return { fim: { saidas } };
    if (status === lua.LUA_YIELD)
      return { erro: 'A macro tentou pausar fora de uma pergunta.' };
    return { erro: lua.lua_tojsstring(co, -1) ?? 'erro desconhecido' };
  };

  return {
    iniciar: () => {
      if (carregou !== lua.LUA_OK) {
        encerrada = true;
        return { erro: lua.lua_tojsstring(co, -1) };
      }
      return continuar(0);
    },
    responder: resposta => {
      if (encerrada) return { erro: 'A macro já terminou.' };
      const pedido = pedidoAtual;
      if (resposta === null || resposta === undefined) {
        lua.lua_pushnil(co);
        if (pedido?.tipo === 'choose') {
          lua.lua_pushnil(co);
          return continuar(2);
        }
        return continuar(1);
      }
      if (pedido?.tipo === 'choose') {
        const indice = Number(resposta);
        lua.lua_pushinteger(co, indice);
        lua.lua_pushstring(co, luaStr(pedido.opcoes[indice - 1] ?? ''));
        return continuar(2);
      }
      lua.lua_pushstring(co, luaStr(String(resposta)));
      return continuar(1);
    },
  };
};
