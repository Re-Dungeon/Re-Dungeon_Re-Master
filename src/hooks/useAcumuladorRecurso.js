import { useCallback, useEffect, useRef, useState } from 'react';

// Acumula cliques de −/+ (ou um valor digitado) de um recurso numérico
// (PV/Energia/Fadiga) e grava UMA vez: mostra o valor pendente na hora e
// dispara `gravar(valorFinal)` `atrasoMs` depois do último clique. Também
// grava ao `descarregar()` (Enter, sair do campo/cartão) e ao desmontar —
// nunca descarta o que o usuário fez. Cópia nos dois sites (mudou um, mude o
// outro).
//
// - `valorExterno`: o valor que vem do servidor (ficha/token ao vivo).
// - `gravar(valor)`: devolve promise (ou nada). Se rejeitar, o valor pendente
//   é descartado (volta ao do servidor) e `onFalha(error)` é chamado.
// - O valor pendente vale até o servidor mudar de volta do valor de partida;
//   com a escrita em andamento ele continua na tela (sem piscar o antigo).
// - Se o valor final for igual ao que o servidor já tem/vai ter, não grava.
export const ATRASO_ACUMULADOR_MS = 800;

const useAcumuladorRecurso = (
  valorExterno,
  gravar,
  { atrasoMs = ATRASO_ACUMULADOR_MS, onFalha } = {},
) => {
  // { id, valor, base, referencia, enviado }
  //  base: valor do servidor quando o pendente começou;
  //  referencia: o que o servidor terá depois das escritas já enviadas.
  const [local, setLocal] = useState(null);
  const localRef = useRef(null);
  const externoRef = useRef(valorExterno);
  const gravarRef = useRef(gravar);
  const onFalhaRef = useRef(onFalha);
  const temporizadorRef = useRef(null);
  const contadorRef = useRef(0);

  useEffect(() => {
    externoRef.current = valorExterno;
    gravarRef.current = gravar;
    onFalhaRef.current = onFalha;
  });

  const atualizar = useCallback(proximo => {
    localRef.current = proximo;
    setLocal(proximo);
  }, []);

  // O servidor mudou do valor de partida (a escrita voltou, ou outra fonte
  // mexeu): o que já foi enviado deixa de valer.
  useEffect(() => {
    const atual = localRef.current;
    if (atual?.enviado && atual.base !== valorExterno) atualizar(null);
  }, [valorExterno, atualizar]);

  const descarregar = useCallback(() => {
    clearTimeout(temporizadorRef.current);
    temporizadorRef.current = null;
    const atual = localRef.current;
    if (!atual || atual.enviado) return;
    if (atual.valor === atual.referencia) {
      atualizar(null);
      return;
    }
    atualizar({ ...atual, enviado: true });
    new Promise(resolver => resolver(gravarRef.current(atual.valor))).catch(error => {
      if (localRef.current?.id === atual.id) atualizar(null);
      onFalhaRef.current?.(error);
    });
  }, [atualizar]);

  const definir = useCallback(
    novo => {
      const anterior = localRef.current;
      contadorRef.current += 1;
      atualizar({
        id: contadorRef.current,
        valor: novo,
        base: anterior ? anterior.base : externoRef.current,
        referencia: anterior
          ? anterior.enviado
            ? anterior.valor
            : anterior.referencia
          : externoRef.current,
        enviado: false,
      });
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = setTimeout(descarregar, atrasoMs);
    },
    [atrasoMs, atualizar, descarregar],
  );

  // Desmontar (fechar o cartão, trocar de token/ficha) grava o que sobrou.
  useEffect(() => descarregar, [descarregar]);

  const valor = local && (!local.enviado || local.base === valorExterno) ? local.valor : valorExterno;
  return { valor, pendente: Boolean(local && !local.enviado), definir, descarregar };
};

export default useAcumuladorRecurso;
