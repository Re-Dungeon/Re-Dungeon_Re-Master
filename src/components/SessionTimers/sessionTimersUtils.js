// Formata segundos para "MM:SS" (ou "H:MM:SS" acima de uma hora) — usado
// tanto pelo cronômetro de sessão quanto pelos temporizadores nomeados.
export const formatDuracao = totalSegundos => {
  const segundos = Math.max(0, Math.round(totalSegundos));
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const resto = segundos % 60;
  const mm = String(minutos).padStart(2, '0');
  const ss = String(resto).padStart(2, '0');
  return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`;
};

// Converte os campos separados de minutos/segundos do formulário de "novo
// temporizador" para o total em segundos usado internamente. Entradas
// inválidas ou negativas caem para 0 em vez de gerar NaN.
export const parseDuracaoParaSegundos = (minutosStr, segundosStr) => {
  const minutos = Math.max(0, Number(minutosStr) || 0);
  const segundos = Math.max(0, Number(segundosStr) || 0);
  return minutos * 60 + segundos;
};

// Um "tick" de 1 segundo num temporizador nomeado: decrementa até 0 e marca
// `esgotado` (e para de rodar) em vez de ir negativo — mantém o mestre
// avisado sem exigir que ele fique olhando o relógio.
export const tickTimer = timer => {
  if (!timer.running) return timer;
  const restante = timer.restanteSegundos - 1;
  if (restante <= 0) {
    return { ...timer, restanteSegundos: 0, running: false, esgotado: true };
  }
  return { ...timer, restanteSegundos: restante };
};
