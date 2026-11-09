// Histórico do campo do chat (↑/↓ como num terminal): o texto bruto que o
// usuário enviou pelo campo, inclusive comandos (/r, /rs, /gr, /m), para
// reenviar rápido. Puro e autocontido — cópia idêntica no Re:Master.

export const HISTORICO_MAX = 50;

// Acrescenta `texto` ao fim (o mais recente fica por último). Ignora vazio e
// repetição imediata; mantém no máximo HISTORICO_MAX itens.
export const registrarNoHistorico = (historico, texto) => {
  const lista = Array.isArray(historico) ? historico : [];
  const limpo = String(texto ?? '').trim();
  if (!limpo || lista[lista.length - 1] === limpo) return lista;
  return [...lista, limpo].slice(-HISTORICO_MAX);
};

// `indice` null = fora do histórico (campo livre). 'cima' anda para o mais
// antigo (para no primeiro); 'baixo' anda para o mais recente e, depois dele,
// sai do histórico com o campo vazio. Fora do histórico, 'baixo' não faz nada.
export const navegarHistorico = ({ historico, indice, direcao }) => {
  const lista = Array.isArray(historico) ? historico : [];
  if (lista.length === 0) return { indice: null, texto: null };
  if (direcao === 'cima') {
    const novo = indice === null ? lista.length - 1 : Math.max(0, indice - 1);
    return { indice: novo, texto: lista[novo] };
  }
  if (indice === null) return { indice: null, texto: null };
  if (indice >= lista.length - 1) return { indice: null, texto: '' };
  return { indice: indice + 1, texto: lista[indice + 1] };
};

export const lerHistorico = chave => {
  if (!chave) return [];
  try {
    const bruto = window.sessionStorage.getItem(chave);
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista)
      ? lista.filter(item => typeof item === 'string' && item.trim()).slice(-HISTORICO_MAX)
      : [];
  } catch {
    return [];
  }
};

export const salvarHistorico = (chave, lista) => {
  if (!chave) return;
  try {
    window.sessionStorage.setItem(chave, JSON.stringify(lista));
  } catch {
    // Sem sessionStorage (modo privado/bloqueado): o histórico fica só na memória.
  }
};
