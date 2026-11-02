import {
  GRID_POSICAO_MAX,
  formatarMetros,
  linhaChebyshev,
} from 'common/utils/grid';

// Templates de área do grid (rmCampanhas/{id}/gridCenas/{cena}/templates):
// raio, linha, cone e quadrado desenhados sobre o mapa. O doc guarda os METROS
// (a verdade) e a origem/alvo em células; os quadrados afetados são derivados
// pela escala da cena (metrosPorQuadrado). Funções puras — cópia nos dois
// sites (mudou um, mude o outro); os limites espelham o bloco "templates" do
// firestore.rules.
//
// Geometria em distância de Chebyshev (como o resto do grid: diagonal custa 1):
// - Raio: quadrado (2n+1)² centrado na origem (inclui a origem).
// - Quadrado: lado n, com o canto na origem, estendendo-se para o lado do alvo.
// - Linha: n células da origem (exclusive) rumo ao alvo.
// - Cone 90°: células a 1..n de distância (Chebyshev) dentro de ±45° da
//   direção origem→alvo. Na diagonal isso vira um quadrante n×n (consciente).
// Paredes são ignoradas na v1.

export const AREA_FORMAS = {
  RAIO: 'raio',
  LINHA: 'linha',
  CONE: 'cone',
  QUADRADO: 'quadrado',
};

export const ROTULOS_AREA = {
  raio: 'Raio',
  linha: 'Linha',
  cone: 'Cone',
  quadrado: 'Quadrado',
};

export const AREA_QUADRADOS_MAX = 40;
export const AREA_METROS_MAX = 1000; // regra
export const AREAS_POR_CENA_MAX = 50; // só UI
export const AREAS_POR_PESSOA_MAX = 10; // só UI
export const AREA_NOME_MAX = 100; // regra

export const CORES_AREA = [
  '#e05555',
  '#f5a742',
  '#e8cb85',
  '#4caf50',
  '#5b7cfa',
  '#b06be0',
];

const ATINGIDOS_NOMES_MAX = 3;
const TOLERANCIA_ANGULO = 1e-9;

const FORMAS = Object.values(AREA_FORMAS);

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

const ehInteiro = valor => Number.isInteger(valor);

const celulaValida = celula =>
  Boolean(celula) &&
  ehInteiro(celula.col) &&
  ehInteiro(celula.lin) &&
  celula.col >= 0 &&
  celula.lin >= 0 &&
  celula.col <= GRID_POSICAO_MAX &&
  celula.lin <= GRID_POSICAO_MAX;

const copiarCelula = celula => ({ col: celula.col, lin: celula.lin });

// "4,5" → 4.5; vazio, não numérico, ≤ 0 ou > AREA_METROS_MAX → null.
export const normalizarMetrosDaArea = valor => {
  const numero =
    typeof valor === 'number'
      ? valor
      : Number(
          String(valor ?? '')
            .trim()
            .replace(',', '.'),
        );
  if (!Number.isFinite(numero) || String(valor ?? '').trim() === '')
    return null;
  const arredondado = Math.round(numero * 100) / 100;
  return arredondado > 0 && arredondado <= AREA_METROS_MAX ? arredondado : null;
};

// Metros → quadrados da escala (1..AREA_QUADRADOS_MAX).
export const quadradosDaArea = (metros, metrosPorQuadrado) => {
  const escala = Number(metrosPorQuadrado) > 0 ? Number(metrosPorQuadrado) : 1;
  const quadrados = Math.round(Number(metros) / escala);
  return limitar(
    Number.isFinite(quadrados) ? quadrados : 1,
    1,
    AREA_QUADRADOS_MAX,
  );
};

// Doc do Firestore ({id, ...data}) → área limpa, ou null se inválido.
export const normalizarArea = doc => {
  if (!doc || !FORMAS.includes(doc.forma) || !celulaValida(doc.origem))
    return null;
  const metros = normalizarMetrosDaArea(doc.metros);
  if (metros === null) return null;
  const comAlvo = doc.forma !== AREA_FORMAS.RAIO && celulaValida(doc.alvo);
  return {
    id: doc.id,
    uid: doc.uid,
    nome: typeof doc.nome === 'string' ? doc.nome : '',
    forma: doc.forma,
    origem: copiarCelula(doc.origem),
    alvo: comAlvo ? copiarCelula(doc.alvo) : null,
    metros,
    cor:
      typeof doc.cor === 'string' && /^#[0-9a-fA-F]{6}$/.test(doc.cor)
        ? doc.cor
        : CORES_AREA[0],
  };
};

// Payload de criação (sem timestamps — o storage põe serverTimestamp). O alvo
// não existe em raio; o nome é omitido quando vazio.
export const montarArea = ({
  forma,
  origem,
  alvo = null,
  metros,
  cor,
  uid,
  nome = '',
}) => {
  const nomeLimpo = String(nome ?? '')
    .trim()
    .slice(0, AREA_NOME_MAX);
  return {
    uid,
    ...(nomeLimpo ? { nome: nomeLimpo } : {}),
    forma,
    origem: copiarCelula(origem),
    ...(forma !== AREA_FORMAS.RAIO && alvo ? { alvo: copiarCelula(alvo) } : {}),
    metros,
    cor,
  };
};

// Vetor origem→alvo; sem alvo ou alvo na origem → leste.
export const direcaoDaArea = (origem, alvo) => {
  const dx = alvo ? alvo.col - origem.col : 0;
  const dy = alvo ? alvo.lin - origem.lin : 0;
  return dx === 0 && dy === 0 ? { dx: 1, dy: 0 } : { dx, dy };
};

const celulasDoRaio = (origem, n) => {
  const celulas = [];
  for (let dl = -n; dl <= n; dl += 1) {
    for (let dc = -n; dc <= n; dc += 1) {
      celulas.push({ col: origem.col + dc, lin: origem.lin + dl });
    }
  }
  return celulas;
};

const celulasDoQuadrado = (origem, alvo, n) => {
  const sx = alvo && alvo.col < origem.col ? -1 : 1;
  const sy = alvo && alvo.lin < origem.lin ? -1 : 1;
  const celulas = [];
  for (let j = 0; j < n; j += 1) {
    for (let i = 0; i < n; i += 1) {
      celulas.push({ col: origem.col + sx * i, lin: origem.lin + sy * j });
    }
  }
  return celulas;
};

const celulasDaLinha = (origem, alvo, n) => {
  const { dx, dy } = direcaoDaArea(origem, alvo);
  const maior = Math.max(Math.abs(dx), Math.abs(dy));
  const fim = {
    col: origem.col + Math.round((dx * n) / maior),
    lin: origem.lin + Math.round((dy * n) / maior),
  };
  return linhaChebyshev(origem, fim);
};

const celulasDoCone = (origem, alvo, n) => {
  const { dx, dy } = direcaoDaArea(origem, alvo);
  const celulas = [];
  for (let dl = -n; dl <= n; dl += 1) {
    for (let dc = -n; dc <= n; dc += 1) {
      if (dc !== 0 || dl !== 0) {
        const diferenca = Math.atan2(dl * dx - dc * dy, dc * dx + dl * dy);
        if (Math.abs(diferenca) <= Math.PI / 4 + TOLERANCIA_ANGULO) {
          celulas.push({ col: origem.col + dc, lin: origem.lin + dl });
        }
      }
    }
  }
  return celulas;
};

// Células cobertas pela área, ordenadas (lin, col), recortadas em
// 0..colunas-1 / 0..linhas-1 (`limites` = {colunas, linhas}, opcional).
export const celulasDaArea = (area, metrosPorQuadrado, limites = null) => {
  const n = quadradosDaArea(area.metros, metrosPorQuadrado);
  const { origem, alvo } = area;
  let celulas;
  switch (area.forma) {
    case AREA_FORMAS.RAIO:
      celulas = celulasDoRaio(origem, n);
      break;
    case AREA_FORMAS.QUADRADO:
      celulas = celulasDoQuadrado(origem, alvo, n);
      break;
    case AREA_FORMAS.LINHA:
      celulas = celulasDaLinha(origem, alvo, n);
      break;
    case AREA_FORMAS.CONE:
      celulas = celulasDoCone(origem, alvo, n);
      break;
    default:
      celulas = [];
  }
  const colMax = Math.min(
    limites ? limites.colunas - 1 : GRID_POSICAO_MAX,
    GRID_POSICAO_MAX,
  );
  const linMax = Math.min(
    limites ? limites.linhas - 1 : GRID_POSICAO_MAX,
    GRID_POSICAO_MAX,
  );
  return celulas
    .filter(c => c.col >= 0 && c.lin >= 0 && c.col <= colMax && c.lin <= linMax)
    .sort((a, b) => a.lin - b.lin || a.col - b.col);
};

// Funde células vizinhas da mesma linha em trechos {col, lin, colunas}.
export const trechosDasCelulas = celulas => {
  const ordenadas = [...celulas].sort((a, b) => a.lin - b.lin || a.col - b.col);
  const trechos = [];
  ordenadas.forEach(celula => {
    const ultimo = trechos[trechos.length - 1];
    if (
      ultimo &&
      ultimo.lin === celula.lin &&
      ultimo.col + ultimo.colunas === celula.col
    ) {
      ultimo.colunas += 1;
    } else if (
      !ultimo ||
      ultimo.lin !== celula.lin ||
      ultimo.col + ultimo.colunas <= celula.col
    ) {
      trechos.push({ col: celula.col, lin: celula.lin, colunas: 1 });
    }
  });
  return trechos;
};

// Tokens cuja pegada (tamanho × tamanho) toca alguma célula do conjunto.
export const tokensAtingidos = (celulas, tokens) => {
  const conjunto = new Set(celulas.map(c => `${c.col},${c.lin}`));
  return tokens.filter(token => {
    const tamanho = token.tamanho ?? 1;
    for (let dl = 0; dl < tamanho; dl += 1) {
      for (let dc = 0; dc < tamanho; dc += 1) {
        if (conjunto.has(`${token.col + dc},${token.lin + dl}`)) return true;
      }
    }
    return false;
  });
};

// "Atinge: A, B, C, +3" | "Atinge: ninguém". Ocultos só aparecem (como
// "Nome (oculto)") para quem vê tudo.
export const descreverAtingidos = (tokens, { veTudo = false } = {}) => {
  const visiveis = tokens.filter(token => veTudo || !token.oculto);
  if (visiveis.length === 0) return 'Atinge: ninguém';
  const nomes = visiveis.map(token =>
    token.oculto ? `${token.nome} (oculto)` : token.nome,
  );
  const mostrados = nomes.slice(0, ATINGIDOS_NOMES_MAX);
  const restantes = nomes.length - mostrados.length;
  return `Atinge: ${[...mostrados, ...(restantes > 0 ? [`+${restantes}`] : [])].join(', ')}`;
};

// "Cone · 9 m (6 q)"
export const rotuloDaArea = (area, metrosPorQuadrado) =>
  `${ROTULOS_AREA[area.forma] ?? 'Área'} · ${formatarMetros(area.metros)} m (${quadradosDaArea(
    area.metros,
    metrosPorQuadrado,
  )} q)`;

// Autor da área ou quem vê tudo (mestre).
export const podeEditarArea = (area, uid, veTudo) =>
  Boolean(veTudo) || (Boolean(uid) && area.uid === uid);
