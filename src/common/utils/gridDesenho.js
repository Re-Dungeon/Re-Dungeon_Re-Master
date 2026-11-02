// Desenhos livres do mapa do grid (Fase 3B), funções puras — cópia nos dois
// sites (mudou um, mude o outro). Estado em
// rmCampanhas/{id}/gridCenas/{cenaId}/desenhos/{id}:
//   { uid, cor, pontos: [x0, y0, x1, y1, ...], createdAt }
// `pontos` é um array plano de inteiros em px do mundo. As constantes marcadas
// "regra" espelham o firestore.rules.
import { PING_COORDENADA_MAX } from 'common/utils/grid';

export const CORES_DESENHO = [
  '#ffffff',
  '#e05555',
  '#f5c542',
  '#4caf50',
  '#5b9bff',
  '#b57bff',
];
export const COR_DESENHO_PADRAO = CORES_DESENHO[0];
export const DESENHO_PONTOS_MAX = 200; // pontos por traço (regra: 400 números)
export const DESENHO_BRUTOS_MAX = 2000; // coletados durante o gesto
export const DESENHOS_POR_USUARIO_MAX = 50; // só cliente: rolante, apaga o mais antigo
export const DESENHO_DISTANCIA_MIN_PX = 3; // em px de tela, entre amostras
const AJUSTE_ITERACOES_MAX = 10;

const COR_HEX = /^#[0-9a-fA-F]{6}$/;

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

const milissegundos = data => {
  if (!data) return Number.MAX_SAFE_INTEGER;
  if (typeof data.toMillis === 'function') return data.toMillis();
  if (data instanceof Date) return data.getTime();
  return Number(data) || 0;
};

// Distância do ponto `p` ao segmento a-b.
const distanciaAoSegmento = (p, a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const quadrado = dx * dx + dy * dy;
  if (quadrado === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = limitar(((p.x - a.x) * dx + (p.y - a.y) * dy) / quadrado, 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

// Ramer-Douglas-Peucker ITERATIVO (pilha explícita — traços grandes não podem
// estourar a pilha de chamadas). Mantém sempre o primeiro e o último ponto.
export const simplificarTraco = (pontos, tolerancia) => {
  const lista = pontos ?? [];
  if (lista.length <= 2) return lista.map(({ x, y }) => ({ x, y }));
  const manter = new Array(lista.length).fill(false);
  manter[0] = true;
  manter[lista.length - 1] = true;
  const pilha = [[0, lista.length - 1]];
  while (pilha.length) {
    const [inicio, fim] = pilha.pop();
    let maior = -1;
    let indice = -1;
    for (let i = inicio + 1; i < fim; i += 1) {
      const distancia = distanciaAoSegmento(
        lista[i],
        lista[inicio],
        lista[fim],
      );
      if (distancia > maior) {
        maior = distancia;
        indice = i;
      }
    }
    if (indice !== -1 && maior > tolerancia) {
      manter[indice] = true;
      pilha.push([inicio, indice], [indice, fim]);
    }
  }
  return lista.filter((_, i) => manter[i]).map(({ x, y }) => ({ x, y }));
};

const decimar = (pontos, max) => {
  if (pontos.length <= max) return pontos;
  return Array.from(
    { length: max },
    (_, i) => pontos[Math.round((i * (pontos.length - 1)) / (max - 1))],
  );
};

// Pontos brutos do gesto ([{x, y}] em px do mundo) → array plano para gravar.
// Tolerância inicial max(1, 1,5/zoom) px, dobrada até caber em `max`; se ainda
// não couber, decimação uniforme. Arredonda e limita ao máximo da regra; um
// ponto único vira dois pontos iguais (um "pingo").
export const ajustarTraco = (
  pontosBrutos,
  { zoom = 1, max = DESENHO_PONTOS_MAX } = {},
) => {
  const brutos = (pontosBrutos ?? [])
    .filter(ponto => Number.isFinite(ponto?.x) && Number.isFinite(ponto?.y))
    .slice(0, DESENHO_BRUTOS_MAX);
  if (brutos.length === 0) return [];
  const escala = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  let tolerancia = Math.max(1, 1.5 / escala);
  let pontos = simplificarTraco(brutos, tolerancia);
  for (let i = 0; i < AJUSTE_ITERACOES_MAX && pontos.length > max; i += 1) {
    tolerancia *= 2;
    pontos = simplificarTraco(brutos, tolerancia);
  }
  pontos = decimar(pontos, max);
  if (pontos.length === 1) pontos = [pontos[0], { ...pontos[0] }];
  return pontos.flatMap(({ x, y }) => [
    limitar(Math.round(x), 0, PING_COORDENADA_MAX),
    limitar(Math.round(y), 0, PING_COORDENADA_MAX),
  ]);
};

// Doc do Firestore → desenho pronto para o mapa, ou null se inutilizável.
export const normalizarDesenho = (doc, uid) => {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.pontos))
    return null;
  const { pontos } = doc;
  if (pontos.length < 4 || pontos.length % 2 !== 0) return null;
  if (
    !pontos.every(valor => typeof valor === 'number' && Number.isFinite(valor))
  )
    return null;
  return {
    id: doc.id,
    uid: doc.uid ?? null,
    cor: COR_HEX.test(doc.cor ?? '') ? doc.cor : COR_DESENHO_PADRAO,
    pontos,
    proprio: Boolean(uid) && doc.uid === uid,
    createdAt: doc.createdAt ?? null,
  };
};

// Do mais antigo para o mais novo (recém-criado, com timestamp pendente, por último).
export const ordenarDesenhos = desenhos =>
  [...desenhos].sort(
    (a, b) => milissegundos(a.createdAt) - milissegundos(b.createdAt),
  );

// Atributo `points` de um <polyline>: '0,0 10,10 ...'.
export const pontosDoDesenho = desenho => {
  const pontos = desenho?.pontos ?? [];
  const pares = [];
  for (let i = 0; i + 1 < pontos.length; i += 2)
    pares.push(`${pontos[i]},${pontos[i + 1]}`);
  return pares.join(' ');
};
