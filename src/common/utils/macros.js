// Macros Lua da campanha (rmCampanhas/{id}/macros) — funções puras do lado da
// UI. Mantidas em sincronia com a cópia do site dos jogadores e com o bloco das macros
// no `firestore.rules` (limites de nome/código). A execução fica em
// common/lua/ (luaRuntime + Worker).

import { MACRO_NOME_MAX } from 'common/utils/chat';

export const MACRO_CODIGO_MAX = 50 * 1024;
export const MACRO_DESCRICAO_MAX = 300;

export const MACRO_VAZIA = {
  nome: '',
  descricao: '',
  codigo:
    '-- Exemplo:\n-- local nome = inputQuery("Nome do personagem:", "Fulano")\n-- local total = rolar("1d20+3")\n-- enviar(nome .. " tirou " .. total)\n',
  somenteMestre: false,
};

const normalizarNome = nome =>
  String(nome ?? '')
    .trim()
    .toLowerCase();

export const ordenarMacros = macros =>
  [...macros].sort(
    (a, b) =>
      (a.ordem ?? 0) - (b.ordem ?? 0) ||
      String(a.nome).localeCompare(String(b.nome)),
  );

export const encontrarMacroPorNome = (macros, nome) => {
  const alvo = normalizarNome(nome);
  return macros.find(macro => normalizarNome(macro.nome) === alvo) ?? null;
};

const PREFIXO_MACRO = /^\/m(?=\s|$)/i;

export const ehComandoMacro = texto =>
  typeof texto === 'string' && PREFIXO_MACRO.test(texto.trim());

// "/m dano_impacto" → { nome } | { erro } | null (não é comando de macro).
export const interpretarComandoMacro = texto => {
  if (!ehComandoMacro(texto)) return null;
  const nome = texto.trim().replace(PREFIXO_MACRO, '').trim();
  if (!nome) return { erro: 'Informe o nome da macro. Ex.: /m dano_impacto' };
  return { nome };
};

export const validarMacro = ({ nome, descricao = '', codigo }) => {
  const nomeLimpo = String(nome ?? '').trim();
  if (!nomeLimpo) return 'Dê um nome à macro.';
  if (nomeLimpo.length > MACRO_NOME_MAX)
    return `O nome tem no máximo ${MACRO_NOME_MAX} caracteres.`;
  if (String(descricao).length > MACRO_DESCRICAO_MAX) {
    return `A descrição tem no máximo ${MACRO_DESCRICAO_MAX} caracteres.`;
  }
  if (!String(codigo ?? '').trim()) return 'Escreva o código Lua da macro.';
  if (String(codigo).length > MACRO_CODIGO_MAX)
    return 'O código passa do limite de 50 KB.';
  return null;
};

export const proximaOrdem = macros =>
  macros.reduce((maior, macro) => Math.max(maior, macro.ordem ?? 0), 0) + 1;

// Move a macro `indice` (na lista já ordenada) uma posição para cima (-1) ou
// para baixo (+1). Devolve as atualizações de `ordem` a gravar — renumera a
// lista inteira (1..n) para corrigir ordens repetidas/antigas.
export const reordenarMacros = (macrosOrdenadas, indice, direcao) => {
  const destino = indice + direcao;
  if (destino < 0 || destino >= macrosOrdenadas.length) return [];
  const lista = [...macrosOrdenadas];
  [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
  return lista
    .map((macro, posicao) => ({
      id: macro.id,
      ordem: posicao + 1,
      ordemAtual: macro.ordem,
    }))
    .filter(({ ordem, ordemAtual }) => ordem !== ordemAtual)
    .map(({ id, ordem }) => ({ id, ordem }));
};
