import { criarExecucao } from './luaRuntime';

// Web Worker que roda uma macro Lua isolada da página: sem acesso ao DOM, ao
// Firebase nem aos dados do app — só recebe o código e as respostas do
// usuário, e devolve pedidos (inputQuery/choose), o resultado ou o erro.
// Protocolo:
//   página → worker: { tipo: 'executar', codigo } | { tipo: 'responder', resposta }
//   worker → página: { tipo: 'pedido', pedido } | { tipo: 'fim', saidas } | { tipo: 'erro', mensagem }
let execucao = null;

const postarPasso = passo => {
  if (passo.pedido) self.postMessage({ tipo: 'pedido', pedido: passo.pedido });
  else if (passo.fim) self.postMessage({ tipo: 'fim', saidas: passo.fim.saidas });
  else self.postMessage({ tipo: 'erro', mensagem: passo.erro });
};

self.onmessage = ({ data }) => {
  try {
    if (data.tipo === 'executar') {
      execucao = criarExecucao(data.codigo);
      postarPasso(execucao.iniciar());
    } else if (data.tipo === 'responder' && execucao) {
      postarPasso(execucao.responder(data.resposta));
    }
  } catch (error) {
    self.postMessage({ tipo: 'erro', mensagem: error?.message ?? String(error) });
  }
};
