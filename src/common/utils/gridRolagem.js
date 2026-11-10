import { interpretarExpressaoRolagem } from 'common/utils/dados';
import { PERSONAS } from 'common/utils/chat';
import { TIPOS_TOKEN } from 'common/utils/grid';

// "Rolar…" de um token do grid: helpers puros para achar a fórmula de dados
// num texto, interpretá-la, rotular a rolagem e decidir QUEM fala no chat
// (o próprio token, não o "Falando como" do chat). Cópia nos dois sites —
// mudou um, mude o outro.

// 1ª expressão de dados do texto ("2d6+3 de fogo" → "2d6+3"), sem espaços;
// null se não houver. "mão2d6" não casa (letra/dígito colado antes do dado).
const EXPRESSAO_DADOS = /(?<![A-Za-z0-9])\d*d\d+(?:\s*[+-]\s*(?:\d*d\d+|\d+))*/i;

export const extrairExpressaoDeDados = texto => {
  const match = EXPRESSAO_DADOS.exec(String(texto ?? ''));
  return match ? match[0].replace(/\s+/g, '') : null;
};

// Aceita "/r 2d6+3" ou "2d6+3" → { grupos, termos } | { erro }.
export const preparar = expressao => {
  const texto = String(expressao ?? '')
    .trim()
    .replace(/^\/r(?:\s+|$)/i, '');
  return interpretarExpressaoRolagem(texto);
};

const PREFIXOS_ROTULO = { ataque: 'Ataque', defesa: 'Defesa', arte: 'Arte', item: 'Item' };

// 'Ataque: X' | 'Defesa: X' | 'Arte: X' | 'Item: X'
export const rotuloDeRolagem = (tipo, nome) => {
  const prefixo = PREFIXOS_ROTULO[tipo];
  const nomeLimpo = String(nome ?? '').trim();
  if (!prefixo) return nomeLimpo;
  return nomeLimpo ? `${prefixo}: ${nomeLimpo}` : prefixo;
};

const PERSONA_POR_TIPO = {
  [TIPOS_TOKEN.CRIATURA]: PERSONAS.CRIATURA,
  [TIPOS_TOKEN.NPC]: PERSONAS.NPC,
  [TIPOS_TOKEN.AVULSO]: PERSONAS.MESTRE,
};

// Autor da mensagem de rolagem de um token (campos de `camposAutor` do chat),
// ou null se o usuário não pode rolar por ele.
// - Jogador: token cuja ficha (refId) está em `personagensDoUsuario` fala como
//   a ficha, com nome/imagem do token; token seu sem ficha sua usa o
//   `personagemPadraoId` ("Falando como"); sem nenhum → null.
// - Mestre: só tokens npc/criatura/avulso, com a persona do tipo; token de
//   jogador → null. O avatar vem do token ou da persona `${tipo}:${refId}`.
export const autorDoToken = (
  token,
  {
    uid,
    personagensDoUsuario = [],
    personagemPadraoId = null,
    mestre = false,
    personas = [],
  } = {},
) => {
  if (!token || !uid) return null;

  if (mestre) {
    const persona = PERSONA_POR_TIPO[token.tipo];
    if (!persona) return null;
    const daPersona = token.refId
      ? personas.find(item => item.id === `${token.tipo}:${token.refId}`)
      : null;
    return {
      uid,
      personagemId: null,
      autorNome: token.nome,
      autorAvatar: token.imagemUrl ?? daPersona?.avatar ?? null,
      isMestre: true,
      persona,
    };
  }

  const ficha = token.refId ? personagensDoUsuario.find(p => p.id === token.refId) : null;
  if (ficha) {
    return {
      uid,
      personagemId: ficha.id,
      autorNome: token.nome,
      autorAvatar: token.imagemUrl ?? ficha.linkImagem ?? null,
      isMestre: false,
    };
  }

  if (personagemPadraoId) {
    const padrao = personagensDoUsuario.find(p => p.id === personagemPadraoId);
    return {
      uid,
      personagemId: personagemPadraoId,
      autorNome: token.nome,
      autorAvatar: token.imagemUrl ?? padrao?.linkImagem ?? null,
      isMestre: false,
    };
  }

  return null;
};
