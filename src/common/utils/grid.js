import { isUrlImagemValida } from 'common/utils/chat';

// Grid (mapa tático) da campanha, em CENAS: cada cena
// (rmCampanhas/{id}/gridCenas/{cenaId}) tem a própria imagem/grade e os
// próprios tokens (gridCenas/{cenaId}/tokens/{tokenId}); rmCampanhas/{id}/
// grid/atual só aponta a cena ativa (`cenaAtivaId`), a única que os jogadores
// veem. Posições e tamanhos dos tokens são guardados em CÉLULAS (não em px de
// tela), então não dependem do zoom nem da resolução de quem está vendo. Os
// limites espelham o bloco "Grid da campanha" do firestore.rules. Mantido em
// sincronia com a outra cópia (site dos jogadores ↔ Re:Master).

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
export const CENA_NOME_MAX = 100;
// Limites só da interface (as regras não contam documentos).
export const GRID_CENAS_MAX = 50;
export const GRID_TOKENS_POR_CENA_MAX = 200;
// Área do grid quando não há imagem (ou ela não carregou).
export const GRID_SEM_IMAGEM = { colunas: 30, linhas: 20 };
// Distância de um quadrado (rótulo "4 q · 6 m"), configurável por cena.
export const METROS_POR_QUADRADO_PADRAO = 1.5;
export const METROS_POR_QUADRADO_MIN = 0.1;
export const METROS_POR_QUADRADO_MAX = 100;
// Correr (Fase 3A): quantas vezes o deslocamento do token, por cena (regra).
export const MULTIPLICADORES_CORRIDA = [2, 1.5];
export const MULTIPLICADOR_CORRIDA_PADRAO = 2;
// Travar movimento (cena `travamento`, regra): livre; em combate, só o token
// da vez; ou só o mestre move. Fica FORA do GRID_CONFIG_PADRAO para o "Salvar
// grid" do mestre não sobrescrever o que ele escolheu na barra.
export const TRAVAMENTOS = { LIVRE: 'livre', TURNO: 'turno', CONGELADO: 'congelado' };
// Deslocamento do token em metros (só o mestre grava; ausente = padrão).
export const DESLOCAMENTO_PADRAO = 9;
export const DESLOCAMENTO_MAX = 999; // regra
// Rastro do último movimento: no máximo tantos vértices (espelha a regra).
export const RASTRO_VERTICES_MAX = 50;
// Quanto tempo o rastro fica na tela, e quanto desse tempo é o esmaecer.
export const RASTRO_DURACAO_MS = 10000;
export const RASTRO_FADE_MS = 2000;

export const GRID_CONFIG_PADRAO = {
  imagemUrl: null,
  celula: 50,
  deslocamentoX: 0,
  deslocamentoY: 0,
  mostrarGrade: true,
  corGrade: '#ffffff',
  opacidadeGrade: 0.25,
  metrosPorQuadrado: METROS_POR_QUADRADO_PADRAO,
  multiplicadorCorrida: MULTIPLICADOR_CORRIDA_PADRAO,
};

const COR_HEX = /^#[0-9a-fA-F]{6}$/;

const inteiroEntre = (valor, min, max) =>
  Number.isInteger(valor) && valor >= min && valor <= max;

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

const arredondar2 = valor => Math.round(valor * 100) / 100;

// Aceita vírgula decimal ("2,5"); vazio vira 0 (e falha na validação).
const normalizarMetros = valor => {
  if (valor === undefined || valor === null) return METROS_POR_QUADRADO_PADRAO;
  return arredondar2(Number(String(valor).replace(',', '.')));
};

// "1,5"/1.5 → 1.5; fora da lista → o padrão (2×).
export const normalizarMultiplicadorCorrida = valor => {
  const numero = Number(String(valor ?? '').replace(',', '.'));
  return MULTIPLICADORES_CORRIDA.includes(numero) ? numero : MULTIPLICADOR_CORRIDA_PADRAO;
};

export const normalizarTravamento = valor =>
  Object.values(TRAVAMENTOS).includes(valor) ? valor : TRAVAMENTOS.LIVRE;

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
  const url = typeof valores.imagemUrl === 'string' ? valores.imagemUrl.trim() : '';
  return {
    imagemUrl: url || null,
    celula: Math.round(Number(valores.celula)),
    deslocamentoX: Math.round(Number(valores.deslocamentoX) || 0),
    deslocamentoY: Math.round(Number(valores.deslocamentoY) || 0),
    mostrarGrade: Boolean(valores.mostrarGrade),
    corGrade: valores.corGrade,
    opacidadeGrade: Number(valores.opacidadeGrade),
    metrosPorQuadrado: normalizarMetros(valores.metrosPorQuadrado),
    multiplicadorCorrida: normalizarMultiplicadorCorrida(valores.multiplicadorCorrida),
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
  const metros = config.metrosPorQuadrado ?? METROS_POR_QUADRADO_PADRAO;
  if (!(metros >= METROS_POR_QUADRADO_MIN && metros <= METROS_POR_QUADRADO_MAX))
    return 'Metros por quadrado: entre 0,1 e 100.';
  const corrida = config.multiplicadorCorrida ?? MULTIPLICADOR_CORRIDA_PADRAO;
  if (!MULTIPLICADORES_CORRIDA.includes(corrida)) return 'Correr: 2× ou 1,5×.';
  return null;
};

// Doc de uma cena → { id, nome }. Config da cena: configDoGrid(doc).
export const nomeDaCena = doc =>
  (typeof doc?.nome === 'string' && doc.nome.trim()) || 'Cena sem nome';

// Payload de uma cena nova: nome + configuração padrão (imagem opcional).
export const montarCena = ({ nome, imagemUrl = null }) => {
  const url = typeof imagemUrl === 'string' ? imagemUrl.trim() : '';
  return {
    ...GRID_CONFIG_PADRAO,
    nome: String(nome ?? '')
      .trim()
      .slice(0, CENA_NOME_MAX),
    imagemUrl: url && isUrlImagemValida(url) ? url : null,
  };
};

export const validarNomeCena = nome => {
  const valor = String(nome ?? '').trim();
  if (!valor) return 'Dê um nome à cena.';
  if (valor.length > CENA_NOME_MAX)
    return `O nome pode ter até ${CENA_NOME_MAX} caracteres.`;
  return null;
};

// Nome da cópia ao duplicar ("Taverna" → "Taverna (cópia)").
export const nomeDaCopia = nome => {
  const sufixo = ' (cópia)';
  return `${nomeDaCena({ nome }).slice(0, CENA_NOME_MAX - sufixo.length)}${sufixo}`;
};

const milissegundos = data => {
  if (!data) return Number.MAX_SAFE_INTEGER; // recém-criada (serverTimestamp pendente)
  if (typeof data.toMillis === 'function') return data.toMillis();
  if (data instanceof Date) return data.getTime();
  return Number(data) || 0;
};

// Ordem das cenas: a de criação (a mais antiga primeiro).
export const ordenarCenas = cenas =>
  [...cenas].sort(
    (a, b) =>
      milissegundos(a.createdAt) - milissegundos(b.createdAt) ||
      nomeDaCena(a).localeCompare(nomeDaCena(b)),
  );

// Área do "mundo" (em px da imagem) e quantas células cabem nela.
// `imagem` = { largura, altura } natural da imagem carregada, ou null.
export const dimensoesDoMundo = (config, imagem) => {
  const { celula, deslocamentoX, deslocamentoY } = config;
  if (imagem?.largura > 0 && imagem?.altura > 0) {
    return {
      largura: imagem.largura,
      altura: imagem.altura,
      colunas: Math.max(1, Math.ceil((imagem.largura - deslocamentoX) / celula)),
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

// Vista (zoom + deslocamento em px de tela) centrada no token, com a célula
// ocupando pelo menos `celulaMinimaPx` na tela — usada no celular, onde o mapa
// inteiro encaixado deixa os tokens pequenos demais para tocar. Nunca afasta
// além de `zoomEncaixe` (a vista do mapa inteiro) nem passa de `zoomMax`.
export const vistaFocadaNoToken = ({
  config,
  token,
  viewport,
  zoomEncaixe,
  zoomMax,
  celulaMinimaPx = 44,
}) => {
  const zoom = Math.min(Math.max(zoomEncaixe, celulaMinimaPx / config.celula), zoomMax);
  const lado = (token.tamanho ?? 1) * config.celula;
  const { x, y } = posicaoEmPx(config, token.col, token.lin);
  return {
    zoom,
    x: viewport.largura / 2 - (x + lado / 2) * zoom,
    y: viewport.altura / 2 - (y + lado / 2) * zoom,
  };
};

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

// Mestre move qualquer token; jogador só os atribuídos a ele (`donos`), e
// conforme o `travamento` da cena: 'congelado' = nenhum; 'turno' = em combate
// (`tokenDaVezId`) só o token da vez, fora de combate livre. A regra do
// Firestore impõe o mesmo.
export const podeMoverToken = (
  token,
  uid,
  ehMestre,
  { travamento = TRAVAMENTOS.LIVRE, tokenDaVezId = null } = {},
) => {
  if (ehMestre) return true;
  if (!uid || !(token.donos ?? []).includes(uid)) return false;
  if (travamento === TRAVAMENTOS.CONGELADO) return false;
  if (travamento === TRAVAMENTOS.TURNO && tokenDaVezId) return token.id === tokenDaVezId;
  return true;
};

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
// `recursos` (opcional, recursosIniciais): PV/Energia/Fadiga do token — sem
// eles o payload não muda.
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
  recursos = null,
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
    ...(recursos?.pv ? { pv: recursos.pv } : {}),
    ...(recursos?.energia ? { energia: recursos.energia } : {}),
    ...(recursos?.fadiga ? { fadiga: recursos.fadiga } : {}),
  };
};

export const validarToken = token => {
  if (!token.nome) return 'Dê um nome ao token.';
  if (token.nome.length > TOKEN_NOME_MAX)
    return `O nome pode ter até ${TOKEN_NOME_MAX} caracteres.`;
  if (token.imagemUrl !== null && !isUrlImagemValida(token.imagemUrl)) {
    return 'Informe um link https:// de imagem válido (ou deixe em branco).';
  }
  if (!Object.values(TIPOS_TOKEN).includes(token.tipo)) return 'Tipo de token inválido.';
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
      (b.tamanho ?? 1) - (a.tamanho ?? 1) || (a.nome ?? '').localeCompare(b.nome ?? ''),
  );

// ── Rastro do movimento, distância e régua ─────────────────────────────────
// Distância em quadrados é Chebyshev (diagonal = 1). O caminho de um arraste é
// a sequência de células que o token atravessa, em passos adjacentes; o
// rastro gravado no token (`rastro`, com `movidoEm` = horário do servidor) é
// esse caminho simplificado — a distância dele é a soma dos segmentos.

export const mesmaCelula = (a, b) =>
  Boolean(a && b) && a.col === b.col && a.lin === b.lin;

export const distanciaChebyshev = (a, b) =>
  Math.max(Math.abs(b.col - a.col), Math.abs(b.lin - a.lin));

// Células de `de` (exclusive) até `ate` (inclusive), em passos adjacentes.
export const linhaChebyshev = (de, ate) => {
  const passos = distanciaChebyshev(de, ate);
  const dCol = ate.col - de.col;
  const dLin = ate.lin - de.lin;
  return Array.from({ length: passos }, (_, i) => ({
    col: de.col + Math.round((dCol * (i + 1)) / passos),
    lin: de.lin + Math.round((dLin * (i + 1)) / passos),
  }));
};

// Estende o caminho do arraste até `celula`: interpola os passos (o ponteiro
// pode pular células) e, se o token volta a uma célula por onde já passou,
// corta o laço. Se o passo já é vizinho do penúltimo ponto, o último era um
// desvio de quina (o ponteiro cruza um eixo antes do outro numa diagonal) e é
// trocado pelo passo. Mesma célula do fim → o mesmo array (sem re-render).
export const avancarCaminho = (caminho, celula) => {
  const ultimo = caminho[caminho.length - 1];
  if (!ultimo) return [{ col: celula.col, lin: celula.lin }];
  if (mesmaCelula(ultimo, celula)) return caminho;
  let novo = [...caminho];
  linhaChebyshev(ultimo, celula).forEach(passo => {
    const indice = novo.findIndex(anterior => mesmaCelula(anterior, passo));
    const penultimo = novo[novo.length - 2];
    if (indice >= 0) novo = novo.slice(0, indice + 1);
    else if (penultimo && distanciaChebyshev(penultimo, passo) === 1)
      novo[novo.length - 1] = passo;
    else novo.push(passo);
  });
  return novo;
};

// Segmento "puro": reto (horizontal/vertical) ou diagonal perfeita.
const segmentoPuro = (a, b) => {
  const dCol = Math.abs(b.col - a.col);
  const dLin = Math.abs(b.lin - a.lin);
  return dCol === 0 || dLin === 0 || dCol === dLin;
};

const mesmaDirecao = (a, b, c) =>
  segmentoPuro(a, b) &&
  segmentoPuro(b, c) &&
  Math.sign(b.col - a.col) === Math.sign(c.col - b.col) &&
  Math.sign(b.lin - a.lin) === Math.sign(c.lin - b.lin);

// Polilinha mínima do caminho: tira repetidos e vértices no meio de um trecho
// reto/diagonal — a soma Chebyshev dos segmentos continua exatamente a mesma.
export const simplificarCaminho = pontos => {
  const celulas = (pontos ?? [])
    .filter((ponto, i) => i === 0 || !mesmaCelula(ponto, pontos[i - 1]))
    .map(({ col, lin }) => ({ col, lin }));
  if (celulas.length <= 2) return celulas;
  const resultado = [celulas[0]];
  for (let i = 1; i < celulas.length - 1; i += 1) {
    if (!mesmaDirecao(resultado[resultado.length - 1], celulas[i], celulas[i + 1])) {
      resultado.push(celulas[i]);
    }
  }
  resultado.push(celulas[celulas.length - 1]);
  return resultado;
};

// Quadrados percorridos ao longo do rastro.
export const distanciaDoRastro = pontos =>
  (pontos ?? []).reduce(
    (total, ponto, i) => (i === 0 ? 0 : total + distanciaChebyshev(pontos[i - 1], ponto)),
    0,
  );

// Rastros longos demais perdem o começo (a regra aceita até o máximo).
export const limitarRastro = (pontos, max = RASTRO_VERTICES_MAX) => pontos.slice(-max);

// Movimento que começa onde o rastro ainda visível termina (setas, arrastos
// seguidos) continua o mesmo rastro; senão o novo substitui.
export const encadearRastro = (anterior, novo) => {
  if (
    anterior?.length &&
    novo.length &&
    mesmaCelula(anterior[anterior.length - 1], novo[0])
  ) {
    return [...anterior, ...novo.slice(1)];
  }
  return novo;
};

// Rastro a gravar: encadeado ao anterior (sem cortar laço entre movimentos —
// ida e volta conta as duas pernas), simplificado e limitado.
export const montarRastro = (anterior, caminho) =>
  limitarRastro(simplificarCaminho(encadearRastro(anterior, caminho)));

// Rastro lido do Firestore → pontos válidos ou null. A regra só limita o
// tamanho da lista, então quem lê confere cada ponto.
export const normalizarRastro = valor => {
  if (!Array.isArray(valor) || valor.length < 2) return null;
  const valido = valor.every(
    ponto =>
      ponto &&
      inteiroEntre(ponto.col, 0, GRID_POSICAO_MAX) &&
      inteiroEntre(ponto.lin, 0, GRID_POSICAO_MAX),
  );
  return valido ? limitarRastro(valor.map(({ col, lin }) => ({ col, lin }))) : null;
};

export const rastrosIguais = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((ponto, i) => mesmaCelula(ponto, b[i]));
};

// Centro (px do mundo) de um token de `tamanho` células com canto em col/lin.
export const centroDaCelula = (config, col, lin, tamanho = 1) => ({
  x: config.deslocamentoX + (col + tamanho / 2) * config.celula,
  y: config.deslocamentoY + (lin + tamanho / 2) * config.celula,
});

// Célula que contém o ponto (px do mundo), dentro do grid — usada pela régua.
export const celulaNoPonto = (config, x, y, limites) =>
  limitarPosicao(
    Math.floor((x - config.deslocamentoX) / config.celula),
    Math.floor((y - config.deslocamentoY) / config.celula),
    limites,
  );

// 4.5 → "4,5"; 6 → "6"; até 2 casas (sem Intl: o resultado não depende da
// localidade do navegador).
export const formatarMetros = valor => String(arredondar2(valor)).replace('.', ',');

export const formatarDistancia = (
  quadrados,
  metrosPorQuadrado = METROS_POR_QUADRADO_PADRAO,
) =>
  `${quadrados} q · ${formatarMetros(quadrados * (metrosPorQuadrado ?? METROS_POR_QUADRADO_PADRAO))} m`;

// `movidoEm` (Timestamp do Firestore; null enquanto a escrita está pendente)
// → chave comparável, ou null.
export const chaveDoMovimento = movidoEm => {
  if (movidoEm === undefined || movidoEm === null) return null;
  if (typeof movidoEm.seconds === 'number' && typeof movidoEm.nanoseconds === 'number') {
    return `${movidoEm.seconds}:${movidoEm.nanoseconds}`;
  }
  if (typeof movidoEm.toMillis === 'function') return String(movidoEm.toMillis());
  if (movidoEm instanceof Date) return String(movidoEm.getTime());
  return String(movidoEm);
};

// Compara os `movidoEm` de um snapshot de tokens com os do anterior e diz
// quais tokens acabaram de se mover (sem comparar relógios). `vistosAnteriores`
// null = primeiro snapshot: só registra (a carga inicial não mostra rastro).
// Token novo também só é registrado (ex.: o mestre acabou de revelá-lo), e
// `movidoEm` null (escrita ainda pendente) mantém o valor anterior.
export const detectarMovimentos = (vistosAnteriores, tokens) => {
  const vistos = new Map();
  const movidos = [];
  tokens.forEach(token => {
    const atual = chaveDoMovimento(token.movidoEm);
    if (!vistosAnteriores || !vistosAnteriores.has(token.id)) {
      vistos.set(token.id, atual);
      return;
    }
    const anterior = vistosAnteriores.get(token.id);
    if (atual === null) {
      vistos.set(token.id, anterior);
      return;
    }
    vistos.set(token.id, atual);
    if (atual !== anterior) movidos.push(token);
  });
  return { vistos, movidos };
};

// ── Recursos, condições, alvo, auras e sinais (Fase 2) ─────────────────────
// PV/Energia/Fadiga: token de jogador lê da ficha ao vivo; npc/criatura/avulso
// guardam `{atual, max}` no próprio token (só o mestre edita). As marcadas
// "regra" espelham o firestore.rules.

export const RECURSOS_TOKEN = ['pv', 'energia', 'fadiga'];
export const ROTULOS_RECURSO = { pv: 'PV', energia: 'Energia', fadiga: 'Fadiga' };
export const RECURSO_MAX = 99999; // regra
// O que os jogadores veem dos recursos de um token que não é de jogador.
export const MODOS_RECURSOS = { OCULTO: 'oculto', BARRA: 'barra', NUMEROS: 'numeros' }; // regra
export const TOKEN_CONDICOES_MAX = 20; // regra
export const TOKEN_CONDICOES_VISIVEIS = 3;
const CONDICAO_ID_MAX = 200;
export const AURA_RAIO_MIN = 1; // regra
export const AURA_RAIO_MAX = 999; // regra
export const CORES_AURA = [
  { valor: '#e05555', rotulo: 'Vermelho' },
  { valor: '#5b7cfa', rotulo: 'Azul' },
  { valor: '#4caf50', rotulo: 'Verde' },
  { valor: '#e8cb85', rotulo: 'Dourado' },
  { valor: '#a78bfa', rotulo: 'Roxo' },
  { valor: '#f1f1f4', rotulo: 'Branco' },
];
// Sinal no mapa: segurar para sinalizar, quanto o anel fica na tela e no
// máximo um sinal por segundo por pessoa.
export const PING_PRESSAO_MS = 3000;
export const PING_DURACAO_MS = 3000;
export const PING_INTERVALO_MS = 1000;
export const PING_COORDENADA_MAX = 250000; // regra (px do mundo)
export const PING_NOME_MAX = 100; // regra
// Toque num token (celular): quanto tempo o cartão de detalhes fica aberto.
export const TOQUE_DETALHE_MS = 3000;
// Literal (= --color-primary) para a cópia continuar autocontida.
export const COR_PING_MESTRE = '#e8cb85';
export const CORES_PING = [
  '#5b7cfa',
  '#4fd1c5',
  '#f472b6',
  '#a78bfa',
  '#f97316',
  '#34d399',
  '#60a5fa',
  '#f87171',
];

const vazio = valor => valor === undefined || valor === null || valor === '';

// `{atual, max}` (a ficha pode ter strings) → inteiros válidos ou null (sem
// barra). Sem `atual` = cheio.
export const normalizarRecurso = valor => {
  if (!valor || typeof valor !== 'object' || vazio(valor.max)) return null;
  const max = Math.round(Number(valor.max));
  if (!Number.isFinite(max) || max < 1) return null;
  const maxLimitado = Math.min(max, RECURSO_MAX);
  const atual = vazio(valor.atual) ? NaN : Math.round(Number(valor.atual));
  return {
    atual: Number.isFinite(atual) ? limitar(atual, 0, maxLimitado) : maxLimitado,
    max: maxLimitado,
  };
};

// statusMaximos.* pode ser número ou { maximo } (fichas antigas).
const maximoDe = valor => (valor && typeof valor === 'object' ? valor.maximo : valor);

// Ficha (personagens/{id}) → { pv, energia, fadiga }, cada um ou null.
// `hp` é o nome atual; `saude`, o legado.
export const recursosDaFicha = ficha => {
  const status = ficha?.status ?? {};
  const maximos = ficha?.statusMaximos ?? {};
  const recurso = (atual, maximo, maximoNoStatus) =>
    normalizarRecurso({ atual, max: maximoDe(maximo) ?? maximoNoStatus });
  return {
    pv: recurso(
      status.hp?.atual ?? status.saude?.atual,
      maximos.hp ?? maximos.saude,
      status.hp?.maximo ?? status.saude?.maximo,
    ),
    energia: recurso(status.energia?.atual, maximos.energia, status.energia?.maximo),
    fadiga: recurso(status.fadiga?.atual, maximos.fadiga, status.fadiga?.maximo),
  };
};

// Recursos de um token novo a partir da ficha do NPC/criatura: cheios
// (atual = max); null se a ficha não tem nenhum.
export const recursosIniciais = ficha => {
  const recursos = recursosDaFicha(ficha);
  const cheios = Object.fromEntries(
    RECURSOS_TOKEN.filter(id => recursos[id]).map(id => [
      id,
      { atual: recursos[id].max, max: recursos[id].max },
    ]),
  );
  return Object.keys(cheios).length ? cheios : null;
};

export const normalizarModoRecursos = valor =>
  Object.values(MODOS_RECURSOS).includes(valor) ? valor : MODOS_RECURSOS.OCULTO;

const algumRecurso = recursos => RECURSOS_TOKEN.some(id => recursos[id]);

// O que mostrar das barras do token para quem está vendo →
// { pv, energia, fadiga, numeros } ou null (nada a mostrar). Jogador: barras
// para todos, números só para os donos e o mestre. Demais: o mestre vê tudo;
// os jogadores, conforme `mostrarRecursos`. O sigilo é só da interface.
export const recursosDoToken = (token, ficha, { uid = null, veTudo = false } = {}) => {
  if (token.tipo === TIPOS_TOKEN.JOGADOR) {
    if (!ficha) return null;
    const recursos = recursosDaFicha(ficha);
    if (!algumRecurso(recursos)) return null;
    const dono = Boolean(uid) && (token.donos ?? []).includes(uid);
    return { ...recursos, numeros: Boolean(veTudo) || dono };
  }
  const recursos = Object.fromEntries(
    RECURSOS_TOKEN.map(id => [id, normalizarRecurso(token[id])]),
  );
  if (!algumRecurso(recursos)) return null;
  if (veTudo) return { ...recursos, numeros: true };
  const modo = normalizarModoRecursos(token.mostrarRecursos);
  if (modo === MODOS_RECURSOS.OCULTO) return null;
  return { ...recursos, numeros: modo === MODOS_RECURSOS.NUMEROS };
};

// Edição do valor ATUAL de um recurso pelo dono (cartão do token): passo de
// ±N ou valor digitado, sempre dentro de 0..max. Texto vazio/inválido → null
// (a interface volta ao valor anterior). A Fadiga é um estoque que se gasta
// (descansado = max): "−" gasta, como nos demais.
export const ajustarRecursoAtual = (recurso, delta) => {
  if (!recurso || !Number.isFinite(Number(delta))) return null;
  return limitar(recurso.atual + Math.round(Number(delta)), 0, recurso.max);
};

// Texto digitado num campo de recurso → novo valor (sem limite). "+5"/"-7"
// (com sinal) é relativo — soma ao `atual` (dano/cura rápidos); número sem
// sinal é o valor novo. Vírgula decimal vale; arredonda. Vazio/inválido →
// null. Usado pelo cartão do token, pelos campos do mestre e pela ficha.
export const valorDigitadoDoRecurso = (atual, texto) => {
  if (vazio(texto)) return null;
  const limpo = String(texto).trim().replace(',', '.').replace(/\s+/g, '');
  if (limpo === '' || limpo === '+' || limpo === '-') return null;
  const numero = Math.round(Number(limpo));
  if (!Number.isFinite(numero)) return null;
  if (/^[+-]/.test(limpo)) {
    const base = Number(atual);
    return Number.isFinite(base) ? base + numero : null;
  }
  return numero;
};

export const recursoDigitadoAtual = (recurso, texto) => {
  if (!recurso) return null;
  const numero = valorDigitadoDoRecurso(recurso.atual, texto);
  return numero === null ? null : limitar(numero, 0, recurso.max);
};

// Quanto da barra está cheio (0–1). A Fadiga enche com o cansaço: descansado
// (atual = max) = barra vazia.
export const fracaoDaBarra = (id, recurso) => {
  if (!recurso?.max) return 0;
  const fracao =
    id === 'fadiga'
      ? (recurso.max - recurso.atual) / recurso.max
      : recurso.atual / recurso.max;
  return limitar(fracao, 0, 1);
};

// PV: verde (cheio) → vermelho (vazio); Energia: azul; Fadiga: amarelo →
// laranja-avermelhado conforme enche.
export const corDaBarra = (id, fracao) => {
  if (id === 'pv') return `hsl(${Math.round(120 * fracao)}, 70%, 45%)`;
  if (id === 'fadiga') return `hsl(${Math.round(48 - 40 * fracao)}, 90%, 50%)`;
  return '#5b9cf5';
};

// `condicoes` do token (ids do catálogo) → ids válidos, sem repetidos. A
// regra só limita o tamanho da lista, então quem lê confere cada id.
export const normalizarCondicoesDoToken = valor => {
  if (!Array.isArray(valor)) return [];
  const ids = valor.filter(
    id => typeof id === 'string' && id.trim() && id.length <= CONDICAO_ID_MAX,
  );
  return [...new Set(ids)].slice(0, TOKEN_CONDICOES_MAX);
};

// `condicoesDuracao` do token (só npc/criatura/avulso): { [condicaoId]:
// rodadaFim } — a condição vale até o fim dessa rodada do combate (inclusive) e
// sai sozinha quando a rodada passa dela. Uma condição que dura N rodadas,
// posta na rodada R, grava rodadaFim = R + N − 1 (sem combate, R = 1). Devolve
// só os pares válidos (id curto, rodadaFim inteiro ≥ 1), no máximo
// TOKEN_CONDICOES_MAX.
export const normalizarCondicoesDuracao = valor => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return {};
  return Object.fromEntries(
    Object.entries(valor)
      .filter(
        ([id, fim]) =>
          id.trim() && id.length <= CONDICAO_ID_MAX && Number.isInteger(fim) && fim >= 1,
      )
      .slice(0, TOKEN_CONDICOES_MAX),
  );
};

// Rodadas que ainda restam (contando a atual) a uma condição com `rodadaFim`;
// null se não tem duração ou já passou. Sem combate (`rodada` null) a conta é
// a da rodada 1: a duração aparece inteira.
export const rodadasRestantes = (rodadaFim, rodada = null) => {
  if (!Number.isInteger(rodadaFim)) return null;
  const restam = rodadaFim - (Number.isInteger(rodada) ? rodada : 1) + 1;
  return restam >= 1 ? restam : null;
};

export const nomeDaCondicao = condicao => condicao?.nome || condicao?.Nome || 'Condição';

const condicoesAtivasDaFicha = ficha =>
  (Array.isArray(ficha?.condicoesAtivas) ? ficha.condicoesAtivas : [])
    .filter(item => item && typeof item.condicaoId === 'string')
    .map(item => ({
      id: item.condicaoId,
      stack: Number.isFinite(Number(item.stack)) ? Number(item.stack) : null,
    }));

// Condições do token → [{ id, nome, icone, stack, restam? }] (ids fora do
// catálogo são pulados). Jogador: `condicoesAtivas` da ficha (com stack);
// demais: as do token (o mestre escolhe), com `restam` (rodadas que faltam, de
// `condicoesDuracao` e da `rodada` do combate) quando têm duração.
export const condicoesDoToken = (token, ficha, catalogoPorId, { rodada = null } = {}) => {
  const catalogo = catalogoPorId ?? new Map();
  const duracao =
    token.tipo === TIPOS_TOKEN.JOGADOR
      ? {}
      : normalizarCondicoesDuracao(token.condicoesDuracao);
  const ativas =
    token.tipo === TIPOS_TOKEN.JOGADOR
      ? condicoesAtivasDaFicha(ficha)
      : normalizarCondicoesDoToken(token.condicoes).map(id => ({ id, stack: null }));
  return ativas
    .filter(({ id }) => catalogo.has(id))
    .map(({ id, stack }) => {
      const condicao = catalogo.get(id);
      const restam = rodadasRestantes(duracao[id], rodada);
      return {
        id,
        nome: nomeDaCondicao(condicao),
        icone: isUrlImagemValida(condicao?.linkImagem) ? condicao.linkImagem : null,
        stack,
        ...(restam ? { restam } : {}),
      };
    });
};

// PP (Prontidão) da ficha → { atual, max } ou null. Mesma prioridade de
// normalizarPersonagemCarregado (storage do site dos jogadores): as cópias
// top-level primeiro, depois `estadoCombate`/o total da Prontidão.
export const prontidaoDaFicha = ficha =>
  normalizarRecurso({
    atual: ficha?.prontidaoAtual ?? ficha?.estadoCombate?.ppAtual ?? 0,
    max:
      ficha?.prontidaoMaximaEfetiva ??
      ficha?.estadoCombate?.prontidaoMaximaEfetiva ??
      ficha?.secundariosTotais?.prontidao ??
      ficha?.prontidao,
  });

// View model do GridMapa: { [tokenId]: { recursos, condicoes, pp? } }, só para
// os tokens com algo a mostrar. `fichas` = { [refId]: ficha } (tokens
// jogador). `pp` (Prontidão da ficha) só para os donos do token e o mestre.
export const detalhesDosTokens = (
  tokens,
  { fichas = {}, catalogoPorId = null, uid = null, veTudo = false, rodada = null } = {},
) => {
  const detalhes = {};
  tokens.forEach(token => {
    const ficha =
      token.tipo === TIPOS_TOKEN.JOGADOR && token.refId
        ? (fichas?.[token.refId] ?? null)
        : null;
    const recursos = recursosDoToken(token, ficha, { uid, veTudo });
    const condicoes = condicoesDoToken(token, ficha, catalogoPorId, { rodada });
    const dono = Boolean(uid) && (token.donos ?? []).includes(uid);
    const pp = ficha && (veTudo || dono) ? prontidaoDaFicha(ficha) : null;
    if (recursos || condicoes.length || pp) {
      detalhes[token.id] = { recursos, condicoes, ...(pp ? { pp } : {}) };
    }
  });
  return detalhes;
};

// Distância BORDA A BORDA entre dois tokens (N×N células): quadrados entre
// as áreas, em Chebyshev — encostados = 1, sobrepostos = 0. Para 1×1 é a
// distanciaChebyshev.
export const distanciaEntreTokens = (a, b) => {
  const vao = (p, ta, q, tb) => Math.max(0, q - (p + ta - 1), p - (q + tb - 1));
  return Math.max(
    vao(a.col, a.tamanho ?? 1, b.col, b.tamanho ?? 1),
    vao(a.lin, a.tamanho ?? 1, b.lin, b.tamanho ?? 1),
  );
};

// Token de onde medir a distância até outro (e que "Seguir token" segue):
// o selecionado (mestre); senão o último que a pessoa moveu/tocou; senão (só
// o jogador) o primeiro token dele.
export const escolherReferencia = (
  tokens,
  { selecionadoId = null, ultimoId = null, mestre = false, podeMover },
) => {
  const selecionado = selecionadoId && tokens.find(token => token.id === selecionadoId);
  if (selecionado) return selecionado;
  const ultimo = ultimoId && tokens.find(token => token.id === ultimoId);
  if (ultimo && podeMover(ultimo)) return ultimo;
  if (mestre) return null;
  return tokens.find(token => podeMover(token)) ?? null;
};

// `aura` do token → { raio, cor } ou null.
export const normalizarAura = valor =>
  valor &&
  inteiroEntre(valor.raio, AURA_RAIO_MIN, AURA_RAIO_MAX) &&
  COR_HEX.test(valor.cor ?? '')
    ? { raio: valor.raio, cor: valor.cor }
    : null;

// Área da aura em células: quadrado (Chebyshev) de `raio` em volta do token,
// recortado ao mundo.
export const areaDaAura = (token, aura, limites) => {
  const tamanho = token.tamanho ?? 1;
  const col = Math.max(0, token.col - aura.raio);
  const lin = Math.max(0, token.lin - aura.raio);
  return {
    col,
    lin,
    colunas: Math.max(
      0,
      Math.min(limites.colunas, token.col + tamanho + aura.raio) - col,
    ),
    linhas: Math.max(0, Math.min(limites.linhas, token.lin + tamanho + aura.raio) - lin),
  };
};

// Cor do sinal: dourado para o mestre; para os jogadores, uma cor estável
// por uid (hash djb2).
export const corDoPing = (uid, mestreId = null) => {
  if (uid && uid === mestreId) return COR_PING_MESTRE;
  let hash = 5381;
  for (const letra of String(uid ?? '')) {
    hash = (Math.imul(hash, 33) + letra.charCodeAt(0)) >>> 0;
  }
  return CORES_PING[hash % CORES_PING.length];
};

// Doc de pings/{uid} → { uid, x, y, puxar, nome, criadoEm } ou null.
export const normalizarPing = doc => {
  if (!doc || typeof doc.uid !== 'string' || !doc.uid) return null;
  const x = Number(doc.x);
  const y = Number(doc.y);
  if (vazio(doc.x) || vazio(doc.y) || !Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  const nome =
    typeof doc.nome === 'string' && doc.nome.trim() && doc.nome.length <= PING_NOME_MAX
      ? doc.nome.trim()
      : null;
  return {
    uid: doc.uid,
    x: limitar(Math.round(x), 0, PING_COORDENADA_MAX),
    y: limitar(Math.round(y), 0, PING_COORDENADA_MAX),
    puxar: doc.puxar === true,
    nome,
    criadoEm: doc.criadoEm ?? null,
  };
};

// Como detectarMovimentos, para os sinais (um doc por pessoa, sobrescrito):
// `vistosAnteriores` null = carga inicial (só registra). Diferente dos
// tokens, uid visto pela primeira vez DEPOIS da carga é sinal novo (o
// primeiro sinal de alguém cria o doc). `criadoEm` null (escrita pendente)
// mantém o anterior.
export const detectarPings = (vistosAnteriores, pings) => {
  const vistos = new Map();
  const novos = [];
  pings.forEach(ping => {
    const atual = chaveDoMovimento(ping.criadoEm);
    if (!vistosAnteriores) {
      vistos.set(ping.uid, atual);
      return;
    }
    const anterior = vistosAnteriores.get(ping.uid) ?? null;
    if (atual === null) {
      vistos.set(ping.uid, anterior);
      return;
    }
    vistos.set(ping.uid, atual);
    if (atual !== anterior) novos.push(ping);
  });
  return { vistos, novos };
};

// ── Combate (Fase 3A) ──────────────────────────────────────────────────────
// Ordem, turnos e alcance de movimento ficam em common/utils/gridCombate.js
// (que importa daqui — nunca o contrário).

// Deslocamento em metros ("7,5" → 7.5, até 2 casas); vazio, inválido, < 0 ou
// > DESLOCAMENTO_MAX → null.
export const normalizarDeslocamento = valor => {
  if (vazio(valor)) return null;
  const numero = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0 || numero > DESLOCAMENTO_MAX) return null;
  return arredondar2(numero);
};

export const deslocamentoDoToken = token =>
  normalizarDeslocamento(token?.deslocamento) ?? DESLOCAMENTO_PADRAO;

// Vista com o ponto (px do mundo) no centro do viewport, mesmo zoom.
export const centralizarVista = (vista, ponto, viewport) => ({
  zoom: vista.zoom,
  x: viewport.largura / 2 - ponto.x * vista.zoom,
  y: viewport.altura / 2 - ponto.y * vista.zoom,
});
