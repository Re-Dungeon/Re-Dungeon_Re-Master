// Lado da página da execução de macros: sobe um Web Worker novo por execução
// (o bundle do fengari só é baixado aqui, sob demanda), repassa os pedidos
// `inputQuery`/`choose` para a UI e encerra o Worker no fim, no erro, no
// cancelamento ou se a macro passar do tempo de CPU.

// Tempo máximo processando sem pausa (o relógio para enquanto o usuário
// responde uma pergunta). Complementa o limite de instruções do runtime.
export const TEMPO_LIMITE_MS = 5000;

export class ErroMacro extends Error {}

// Lançado por `perguntar` quando o usuário cancela a macro inteira.
export class MacroCancelada extends Error {
  constructor() {
    super('Macro cancelada.');
  }
}

// `perguntar(pedido)` → Promise com a resposta (string / índice / null) ou
// rejeita com MacroCancelada. Resolve com as saídas: [{tipo:'texto', texto} |
// {tipo:'rolagem', rolagem}] — nada é publicado aqui.
export const executarMacro = (codigo, { perguntar }) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./macroWorker.js', import.meta.url), {
      type: 'module',
    });
    let terminado = false;
    let watchdog = null;

    const encerrar = () => {
      terminado = true;
      clearTimeout(watchdog);
      worker.terminate();
    };

    const armarWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => {
        if (terminado) return;
        encerrar();
        reject(
          new ErroMacro(
            `A macro passou de ${TEMPO_LIMITE_MS / 1000} s processando e foi interrompida.`,
          ),
        );
      }, TEMPO_LIMITE_MS);
    };

    worker.onmessage = async ({ data }) => {
      if (terminado) return;
      if (data.tipo === 'pedido') {
        clearTimeout(watchdog);
        let resposta;
        try {
          resposta = await perguntar(data.pedido);
        } catch (error) {
          encerrar();
          reject(error);
          return;
        }
        if (terminado) return;
        armarWatchdog();
        worker.postMessage({ tipo: 'responder', resposta: resposta ?? null });
      } else if (data.tipo === 'fim') {
        encerrar();
        resolve(data.saidas);
      } else {
        encerrar();
        reject(new ErroMacro(data.mensagem));
      }
    };

    worker.onerror = event => {
      event.preventDefault?.();
      if (terminado) return;
      encerrar();
      reject(new ErroMacro(event.message || 'Falha ao executar a macro.'));
    };

    armarWatchdog();
    worker.postMessage({ tipo: 'executar', codigo: String(codigo ?? '') });
  });
