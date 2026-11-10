import {
  GRID_POSICAO_MAX,
  linhaChebyshev,
  posicaoEmPx,
} from 'common/utils/grid';

// Camadas do mapa (Fase 3B), funções puras — cópia nos dois sites (mudou um,
// mude o outro). Paredes e névoa vivem em
// rmCampanhas/{id}/gridCenas/{cenaId}/camadas/{paredes|nevoa}:
//   paredes = { trechos }, nevoa = { ativa, trechos (células REVELADAS) }
// `trechos` = células agrupadas em trechos por linha: 'lin:ini-fim,ini-fim;lin:...'
// (trecho de uma célula = só `ini`), ex. "3:5,8-12;4:0-99". Em memória, um
// Set<'col,lin'> (o formato que distanciasDeMovimento já usa). As marcadas
// "regra" espelham o firestore.rules.

export const CAMADAS = { PAREDES: 'paredes', NEVOA: 'nevoa' };
export const ACOES_CAMADA = { ADICIONAR: 'adicionar', REMOVER: 'remover' };
export const TRECHOS_TEXTO_MAX = 200000; // regra
export const PINCEL_TAMANHOS = [1, 2, 3];

const LIMITES_PADRAO = { colunas: GRID_POSICAO_MAX, linhas: GRID_POSICAO_MAX };

export const chaveDaCelula = (col, lin) => `${col},${lin}`;

const VIZINHOS_ORTOGONAIS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const celulaDaChave = chave => {
  const [col, lin] = chave.split(',').map(Number);
  return { col, lin };
};

// Set<'col,lin'> → { lin → colunas ordenadas }.
const colunasPorLinha = celulas => {
  const porLinha = new Map();
  celulas.forEach(chave => {
    const { col, lin } = celulaDaChave(chave);
    if (!porLinha.has(lin)) porLinha.set(lin, []);
    porLinha.get(lin).push(col);
  });
  porLinha.forEach(colunas => colunas.sort((a, b) => a - b));
  return porLinha;
};

// Set<'col,lin'> → [{ lin, col, colunas }] por linha, da esquerda para a
// direita. Com `limites`, ignora o que cai fora do mundo.
export const trechosDasCelulas = (celulas, limites = null) => {
  const trechos = [];
  const dentro = chave => {
    if (!limites) return true;
    const { col, lin } = celulaDaChave(chave);
    return (
      col >= 0 && lin >= 0 && col < limites.colunas && lin < limites.linhas
    );
  };
  const filtradas = [...(celulas ?? [])].filter(dentro);
  const porLinha = colunasPorLinha(filtradas);
  [...porLinha.keys()]
    .sort((a, b) => a - b)
    .forEach(lin => {
      let atual = null;
      porLinha.get(lin).forEach(col => {
        if (atual && col === atual.col + atual.colunas) {
          atual.colunas += 1;
          return;
        }
        if (atual) trechos.push(atual);
        atual = { lin, col, colunas: 1 };
      });
      if (atual) trechos.push(atual);
    });
  return trechos;
};

// Set<'col,lin'> → texto 'lin:ini-fim,ini;lin:...' (vazio → '').
export const codificarTrechos = celulas =>
  trechosDasCelulas(celulas)
    .reduce((linhas, { lin, col, colunas }) => {
      const texto = colunas === 1 ? `${col}` : `${col}-${col + colunas - 1}`;
      const ultima = linhas[linhas.length - 1];
      if (ultima && ultima.lin === lin) ultima.partes.push(texto);
      else linhas.push({ lin, partes: [texto] });
      return linhas;
    }, [])
    .map(({ lin, partes }) => `${lin}:${partes.join(',')}`)
    .join(';');

const INTEIRO = /^\d{1,6}$/;

// Texto → Set<'col,lin'>. Tolerante: descarta o que não é trecho válido e o que
// cai fora de `limites` (recorta trechos que passam do fim); mescla repetidos.
export const decodificarTrechos = (texto, limites = LIMITES_PADRAO) => {
  const celulas = new Set();
  if (typeof texto !== 'string' || !texto) return celulas;
  const maxCol = Math.min(
    limites?.colunas ?? GRID_POSICAO_MAX,
    GRID_POSICAO_MAX,
  );
  const maxLin = Math.min(
    limites?.linhas ?? GRID_POSICAO_MAX,
    GRID_POSICAO_MAX,
  );
  texto.split(';').forEach(bloco => {
    const separador = bloco.indexOf(':');
    if (separador < 0) return;
    const linTexto = bloco.slice(0, separador).trim();
    if (!INTEIRO.test(linTexto)) return;
    const lin = Number(linTexto);
    if (lin >= maxLin) return;
    bloco
      .slice(separador + 1)
      .split(',')
      .forEach(parte => {
        const [iniTexto, fimTexto, ...resto] = parte.trim().split('-');
        if (resto.length || !INTEIRO.test(iniTexto ?? '')) return;
        if (fimTexto !== undefined && !INTEIRO.test(fimTexto)) return;
        const ini = Number(iniTexto);
        const fim = fimTexto === undefined ? ini : Number(fimTexto);
        if (fim < ini || ini >= maxCol) return;
        for (let col = ini; col <= Math.min(fim, maxCol - 1); col += 1) {
          celulas.add(chaveDaCelula(col, lin));
        }
      });
  });
  return celulas;
};

// Documentos lidos → modelo de memória (sem doc = vazio).
export const normalizarParedes = doc => decodificarTrechos(doc?.trechos);

export const normalizarNevoa = doc => ({
  ativa: doc?.ativa === true,
  reveladas: decodificarTrechos(doc?.trechos),
});

const dentroDoMundo = (col, lin, limites) =>
  col >= 0 && lin >= 0 && col < limites.colunas && lin < limites.linhas;

// Quadrado tamanho × tamanho do pincel em volta de `celula` (âncora =
// celula − floor((tamanho − 1) / 2)), recortado ao mundo.
export const celulasDoPincel = (celula, tamanho, limites = LIMITES_PADRAO) => {
  const lado = Math.max(1, Math.floor(tamanho) || 1);
  const col0 = celula.col - Math.floor((lado - 1) / 2);
  const lin0 = celula.lin - Math.floor((lado - 1) / 2);
  const celulas = [];
  for (let lin = lin0; lin < lin0 + lado; lin += 1) {
    for (let col = col0; col < col0 + lado; col += 1) {
      if (dentroDoMundo(col, lin, limites)) celulas.push({ col, lin });
    }
  }
  return celulas;
};

// Retângulo inclusivo entre dois cantos (em qualquer ordem), recortado ao mundo.
export const celulasDoRetangulo = (a, b, limites = LIMITES_PADRAO) => {
  const col0 = Math.max(Math.min(a.col, b.col), 0);
  const col1 = Math.min(Math.max(a.col, b.col), limites.colunas - 1);
  const lin0 = Math.max(Math.min(a.lin, b.lin), 0);
  const lin1 = Math.min(Math.max(a.lin, b.lin), limites.linhas - 1);
  const celulas = [];
  for (let lin = lin0; lin <= lin1; lin += 1) {
    for (let col = col0; col <= col1; col += 1) celulas.push({ col, lin });
  }
  return celulas;
};

// Novo Set com as células adicionadas ou removidas.
export const aplicarCelulas = (conjunto, celulas, acao) => {
  const novo = new Set(conjunto);
  celulas.forEach(({ col, lin }) => {
    const chave = chaveDaCelula(col, lin);
    if (acao === ACOES_CAMADA.REMOVER) novo.delete(chave);
    else novo.add(chave);
  });
  return novo;
};

// ── Efeitos das paredes ────────────────────────────────────────────────────

// Alguma célula da área tamanho × tamanho (canto col,lin) é parede?
export const areaBloqueada = (bloqueadas, col, lin, tamanho = 1) => {
  if (!bloqueadas?.size) return false;
  for (let dl = 0; dl < tamanho; dl += 1) {
    for (let dc = 0; dc < tamanho; dc += 1) {
      if (bloqueadas.has(chaveDaCelula(col + dc, lin + dl))) return true;
    }
  }
  return false;
};

export const destinoBloqueado = (col, lin, tamanho, bloqueadas) =>
  areaBloqueada(bloqueadas, col, lin, tamanho);

// Um passo entre células adjacentes: bloqueado se a área do destino toca uma
// parede, ou se é diagonal e as duas áreas ortogonais (a quina) estão
// bloqueadas. Cortar a quina com um lado livre é permitido.
export const passoBloqueado = (de, para, tamanho, bloqueadas) => {
  if (!bloqueadas?.size) return false;
  if (areaBloqueada(bloqueadas, para.col, para.lin, tamanho)) return true;
  if (de.col === para.col || de.lin === para.lin) return false;
  return (
    areaBloqueada(bloqueadas, para.col, de.lin, tamanho) &&
    areaBloqueada(bloqueadas, de.col, para.lin, tamanho)
  );
};

// Caminho (células de origem a destino) com algum passo bloqueado? A origem
// não é testada (token preso numa parede pode sair); saltos de mais de uma
// célula são interpolados.
export const caminhoBloqueado = (caminho, tamanho, bloqueadas) => {
  if (!bloqueadas?.size || !caminho || caminho.length < 2) return false;
  for (let i = 1; i < caminho.length; i += 1) {
    let anterior = caminho[i - 1];
    const passos = linhaChebyshev(anterior, caminho[i]);
    for (let j = 0; j < passos.length; j += 1) {
      if (passoBloqueado(anterior, passos[j], tamanho, bloqueadas)) return true;
      anterior = passos[j];
    }
  }
  return false;
};

// Quantas células uma "sala" pode ter antes de ser considerada aberta demais.
export const SALA_LIMITE_PADRAO = 2000;

// Sala a partir de uma célula: preenchimento por largura (4 direções) que não
// atravessa parede — `paredes` é o Set<'col,lin'> das camadas (a mesma
// representação de passoBloqueado, aqui para um token de 1 célula). Respeita
// as bordas do mapa (`cols` × `lins`). Passou de `limite` células (porta
// aberta, sala sem fechamento) → { celulas: [], estourou: true }, para não
// cobrir/revelar o mapa inteiro. Célula inicial fora do mapa ou sobre parede →
// sem células. Devolve { celulas: [{ col, lin }], estourou }.
export const celulasDaSala = (
  celulaInicial,
  paredes,
  {
    cols = LIMITES_PADRAO.colunas,
    lins = LIMITES_PADRAO.linhas,
    limite = SALA_LIMITE_PADRAO,
  } = {},
) => {
  const dentro = ({ col, lin }) => col >= 0 && lin >= 0 && col < cols && lin < lins;
  if (!celulaInicial || !dentro(celulaInicial)) return { celulas: [], estourou: false };
  if (areaBloqueada(paredes, celulaInicial.col, celulaInicial.lin, 1)) {
    return { celulas: [], estourou: false };
  }
  const inicio = { col: celulaInicial.col, lin: celulaInicial.lin };
  const vistas = new Set([chaveDaCelula(inicio.col, inicio.lin)]);
  const fila = [inicio];
  for (let i = 0; i < fila.length; i += 1) {
    const de = fila[i];
    for (const [dc, dl] of VIZINHOS_ORTOGONAIS) {
      const para = { col: de.col + dc, lin: de.lin + dl };
      const chave = chaveDaCelula(para.col, para.lin);
      if (!dentro(para) || vistas.has(chave)) continue;
      if (passoBloqueado(de, para, 1, paredes)) continue;
      vistas.add(chave);
      if (vistas.size > limite) return { celulas: [], estourou: true };
      fila.push(para);
    }
  }
  return { celulas: fila, estourou: false };
};

// ── Névoa ──────────────────────────────────────────────────────────────────

// Coberto = névoa ativa e NENHUMA célula da área do token está revelada.
export const tokenCobertoPelaNevoa = (token, nevoa) => {
  if (!nevoa?.ativa) return false;
  const tamanho = token.tamanho ?? 1;
  for (let dl = 0; dl < tamanho; dl += 1) {
    for (let dc = 0; dc < tamanho; dc += 1) {
      if (nevoa.reveladas?.has(chaveDaCelula(token.col + dc, token.lin + dl)))
        return false;
    }
  }
  return true;
};

// Quem não é mestre não vê o que está coberto, salvo os próprios tokens
// (`ehMeu(token)`).
export const filtrarTokensPelaNevoa = (tokens, nevoa, ehMeu) => {
  if (!nevoa?.ativa) return tokens;
  return tokens.filter(
    token => ehMeu?.(token) || !tokenCobertoPelaNevoa(token, nevoa),
  );
};

// ── Desenho ────────────────────────────────────────────────────────────────

// Arestas externas do conjunto, em coordenadas de LINHA de grade (células, não
// px): [{ c1, l1, c2, l2 }] com c1 ≤ c2 e l1 ≤ l2; colineares que se tocam
// são fundidas.
export const segmentosDeContorno = celulas => {
  const conjunto = new Set(celulas ?? []);
  const tem = (col, lin) => conjunto.has(chaveDaCelula(col, lin));
  const horizontais = new Map();
  const verticais = new Map();
  const guardar = (mapa, linha, ini) => {
    if (!mapa.has(linha)) mapa.set(linha, []);
    mapa.get(linha).push(ini);
  };
  conjunto.forEach(chave => {
    const { col, lin } = celulaDaChave(chave);
    if (!tem(col, lin - 1)) guardar(horizontais, lin, col);
    if (!tem(col, lin + 1)) guardar(horizontais, lin + 1, col);
    if (!tem(col - 1, lin)) guardar(verticais, col, lin);
    if (!tem(col + 1, lin)) guardar(verticais, col + 1, lin);
  });
  const fundir = mapa => {
    const faixas = [];
    [...mapa.keys()]
      .sort((a, b) => a - b)
      .forEach(linha => {
        let atual = null;
        mapa
          .get(linha)
          .sort((a, b) => a - b)
          .forEach(ini => {
            if (atual && ini === atual.fim) {
              atual.fim = ini + 1;
              return;
            }
            if (atual) faixas.push(atual);
            atual = { linha, ini, fim: ini + 1 };
          });
        if (atual) faixas.push(atual);
      });
    return faixas;
  };
  return [
    ...fundir(horizontais).map(({ linha, ini, fim }) => ({
      c1: ini,
      l1: linha,
      c2: fim,
      l2: linha,
    })),
    ...fundir(verticais).map(({ linha, ini, fim }) => ({
      c1: linha,
      l1: ini,
      c2: linha,
      l2: fim,
    })),
  ];
};

// Trechos → atributo `d` de um <path> com um retângulo por trecho, em px do
// mundo: 'M x y h w v h h -w z' (um subpath por trecho, separados por espaço).
export const caminhoSvgDeTrechos = (config, trechos) =>
  trechos
    .map(({ col, lin, colunas }) => {
      const { x, y } = posicaoEmPx(config, col, lin);
      const largura = colunas * config.celula;
      return `M ${x} ${y} h ${largura} v ${config.celula} h ${-largura} z`;
    })
    .join(' ');
