import { isUrlImagemValida } from 'common/utils/chat';

// Grid (mapa tático) da campanha — rmCampanhas/{id}/grid/atual (configuração)
// e rmCampanhas/{id}/gridTokens/{tokenId}. Posições e tamanhos dos tokens são
// guardados em CÉLULAS (não em px de tela), então não dependem do zoom nem da
// resolução de quem está vendo. Os limites espelham o bloco "Grid da campanha"
// do firestore.rules. Mantido em sincronia com a cópia do site dos jogadores.

export const TIPOS_TOKEN = {
  JOGADOR: 'jogador',
  NPC: 'npc',
  CRIATURA: 'criatura',
  AVULSO: 'avulso',
};

export const ROTULOS_TIPO_TOKEN = {
  [TIPOS_TOKEN.JOGADOR]: 'Jogador',
  [TIPOS_TOKEN.NPC]: 'NPC',
  [TIPOS_TOKEN.CRIATURA]: 'Criatura',
  [TIPOS_TOKEN.AVULSO]: 'Avulso',
};

export const GRID_CELULA_MIN = 10;
export const GRID_CELULA_MAX = 400;
export const GRID_DESLOCAMENTO_MAX = 400;
// Maior coluna/linha aceita (a regra recusa além disso).
export const GRID_POSICAO_MAX = 500;
export const TOKEN_TAMANHO_MIN = 1;
export const TOKEN_TAMANHO_MAX = 10;
export const TOKEN_NOME_MAX = 100;
export const TOKEN_DONOS_MAX = 20;
// Área do grid quando não há imagem (ou ela não carregou).
export const GRID_SEM_IMAGEM = { colunas: 30, linhas: 20 };

export const GRID_CONFIG_PADRAO = {
  imagemUrl: null,
  celula: 50,
  deslocamentoX: 0,
  deslocamentoY: 0,
  mostrarGrade: true,
  corGrade: '#ffffff',
  opacidadeGrade: 0.25,
};

const COR_HEX = /^#[0-9a-fA-F]{6}$/;

const inteiroEntre = (valor, min, max) =>
  Number.isInteger(valor) && valor >= min && valor <= max;

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

// Doc do Firestore (ou null, grid ainda não configurado) → config completa,
// só com os campos conhecidos.
export const configDoGrid = doc =>
  Object.fromEntries(
    Object.entries(GRID_CONFIG_PADRAO).map(([campo, padrao]) => [
      campo,
      doc?.[campo] ?? padrao,
    ]),
  );

// Valores do formulário do mestre → payload gravável (números inteiros, URL
// sem espaços ou null).
export const normalizarConfigGrid = valores => {
  const url =
    typeof valores.imagemUrl === 'string' ? valores.imagemUrl.trim() : '';
  return {
    imagemUrl: url || null,
    celula: Math.round(Number(valores.celula)),
    deslocamentoX: Math.round(Number(valores.deslocamentoX) || 0),
    deslocamentoY: Math.round(Number(valores.deslocamentoY) || 0),
    mostrarGrade: Boolean(valores.mostrarGrade),
    corGrade: valores.corGrade,
    opacidadeGrade: Number(valores.opacidadeGrade),
  };
};

// Mensagem de erro (para o usuário) ou null se a config normalizada é válida.
export const validarConfigGrid = config => {
  if (config.imagemUrl !== null && !isUrlImagemValida(config.imagemUrl)) {
    return 'Informe um link https:// de imagem válido (ou deixe em branco).';
  }
  if (!inteiroEntre(config.celula, GRID_CELULA_MIN, GRID_CELULA_MAX)) {
    return `O tamanho da célula deve ser entre ${GRID_CELULA_MIN} e ${GRID_CELULA_MAX} px.`;
  }
  if (
    !inteiroEntre(config.deslocamentoX, 0, GRID_DESLOCAMENTO_MAX) ||
    !inteiroEntre(config.deslocamentoY, 0, GRID_DESLOCAMENTO_MAX)
  ) {
    return `O deslocamento deve ser entre 0 e ${GRID_DESLOCAMENTO_MAX} px.`;
  }
  if (!COR_HEX.test(config.corGrade ?? '')) return 'Cor da grade inválida.';
  if (!(config.opacidadeGrade >= 0 && config.opacidadeGrade <= 1))
    return 'Opacidade inválida.';
  return null;
};

// Área do "mundo" (em px da imagem) e quantas células cabem nela.
// `imagem` = { largura, altura } natural da imagem carregada, ou null.
export const dimensoesDoMundo = (config, imagem) => {
  const { celula, deslocamentoX, deslocamentoY } = config;
  if (imagem?.largura > 0 && imagem?.altura > 0) {
    return {
      largura: imagem.largura,
      altura: imagem.altura,
      colunas: Math.max(
        1,
        Math.ceil((imagem.largura - deslocamentoX) / celula),
      ),
      linhas: Math.max(1, Math.ceil((imagem.altura - deslocamentoY) / celula)),
    };
  }
  const { colunas, linhas } = GRID_SEM_IMAGEM;
  return {
    largura: deslocamentoX + colunas * celula,
    altura: deslocamentoY + linhas * celula,
    colunas,
    linhas,
  };
};

export const posicaoEmPx = (config, col, lin) => ({
  x: config.deslocamentoX + col * config.celula,
  y: config.deslocamentoY + lin * config.celula,
});

// Mantém o token inteiro dentro do grid (e dentro do limite da regra).
export const limitarPosicao = (col, lin, limites, tamanho = 1) => ({
  col: limitar(
    Math.round(col),
    0,
    Math.min(Math.max(limites.colunas - tamanho, 0), GRID_POSICAO_MAX),
  ),
  lin: limitar(
    Math.round(lin),
    0,
    Math.min(Math.max(limites.linhas - tamanho, 0), GRID_POSICAO_MAX),
  ),
});

// Canto superior esquerdo do token em px (mundo) → célula mais próxima.
export const celulaMaisProxima = (config, x, y, limites, tamanho = 1) =>
  limitarPosicao(
    (x - config.deslocamentoX) / config.celula,
    (y - config.deslocamentoY) / config.celula,
    limites,
    tamanho,
  );

// Mestre move qualquer token; jogador só os atribuídos a ele (`donos`).
// A regra do Firestore impõe o mesmo.
export const podeMoverToken = (token, uid, ehMestre) =>
  Boolean(ehMestre) || (Boolean(uid) && (token.donos ?? []).includes(uid));

const sobrepoe = (a, b) =>
  a.col < b.col + b.tamanho &&
  b.col < a.col + a.tamanho &&
  a.lin < b.lin + b.tamanho &&
  b.lin < a.lin + a.tamanho;

// Primeira posição (linha a linha) onde um token novo não cobre nenhum outro;
// grid lotado → canto superior esquerdo.
export const primeiraCelulaLivre = (tokens, tamanho, limites) => {
  const ultimaLin = Math.max(limites.linhas - tamanho, 0);
  const ultimaCol = Math.max(limites.colunas - tamanho, 0);
  for (let lin = 0; lin <= ultimaLin; lin += 1) {
    for (let col = 0; col <= ultimaCol; col += 1) {
      const candidato = { col, lin, tamanho };
      if (!tokens.some(token => sobrepoe(candidato, { tamanho: 1, ...token })))
        return { col, lin };
    }
  }
  return { col: 0, lin: 0 };
};

// Campos de um token novo (o mestre escolhe a origem: personagem jogável,
// NPC, Criatura ou avulso). Nome/imagem são uma CÓPIA do momento da criação.
export const montarToken = ({
  nome,
  imagemUrl = null,
  tipo,
  refId = null,
  donos = [],
  tamanho = 1,
  oculto = false,
  col = 0,
  lin = 0,
}) => {
  const url = typeof imagemUrl === 'string' ? imagemUrl.trim() : '';
  return {
    nome: String(nome ?? '')
      .trim()
      .slice(0, TOKEN_NOME_MAX),
    imagemUrl: url && isUrlImagemValida(url) ? url : null,
    tipo,
    refId,
    donos: [...new Set(donos.filter(Boolean))].slice(0, TOKEN_DONOS_MAX),
    tamanho,
    oculto: Boolean(oculto),
    col,
    lin,
  };
};

export const validarToken = token => {
  if (!token.nome) return 'Dê um nome ao token.';
  if (token.nome.length > TOKEN_NOME_MAX)
    return `O nome pode ter até ${TOKEN_NOME_MAX} caracteres.`;
  if (token.imagemUrl !== null && !isUrlImagemValida(token.imagemUrl)) {
    return 'Informe um link https:// de imagem válido (ou deixe em branco).';
  }
  if (!Object.values(TIPOS_TOKEN).includes(token.tipo))
    return 'Tipo de token inválido.';
  if (!inteiroEntre(token.tamanho, TOKEN_TAMANHO_MIN, TOKEN_TAMANHO_MAX)) {
    return `O tamanho deve ser entre ${TOKEN_TAMANHO_MIN} e ${TOKEN_TAMANHO_MAX} células.`;
  }
  if (
    !inteiroEntre(token.col, 0, GRID_POSICAO_MAX) ||
    !inteiroEntre(token.lin, 0, GRID_POSICAO_MAX)
  ) {
    return 'Posição fora do grid.';
  }
  if (token.donos.length > TOKEN_DONOS_MAX)
    return `No máximo ${TOKEN_DONOS_MAX} jogadores por token.`;
  return null;
};

// Ordem de desenho: maiores embaixo (um dragão não esconde o goblin ao lado),
// depois por nome para a ordem não "pular" entre atualizações.
export const ordenarTokens = tokens =>
  [...tokens].sort(
    (a, b) =>
      (b.tamanho ?? 1) - (a.tamanho ?? 1) ||
      (a.nome ?? '').localeCompare(b.nome ?? ''),
  );
