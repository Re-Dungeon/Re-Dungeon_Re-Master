import {
  GRID_POSICAO_MAX,
  METROS_POR_QUADRADO_PADRAO,
  TIPOS_TOKEN,
  chaveDoMovimento,
  normalizarMultiplicadorCorrida,
  normalizarRecurso,
} from 'common/utils/grid';
import { randomUint32, rolarFace } from 'common/utils/dados';

// Combate do grid (Fase 3A), funções puras — cópia idêntica nos dois sites
// (mudou um, mude o outro). Estado em
// rmCampanhas/{id}/gridCenas/{cenaId}/combate/atual:
//   { ordem: [{ tokenId, iniciativa, d20, reacao }], indice, rodada,
//     inicioTurno: {col, lin} | null, turnoEm, createdAt, updatedAt }
// Existir = combate em andamento. Sem nomes/donos guardados: o token da vez é
// `ordem[indice].tokenId` e o resto vem dos tokens da cena. Iniciativa = 1d20 +
// Reação (empate: maior Reação, depois sorteio). As marcadas "regra" espelham o
// firestore.rules.

export const COMBATE_PARTICIPANTES_MAX = 200; // regra
export const COMBATE_RODADA_MAX = 9999; // regra
// Raio máximo (quadrados) do alcance de movimento desenhado.
export const ALCANCE_QUADRADOS_MAX = 50;
// Verde = até Mover; amarelo = até Correr; vermelho = além.
export const CORES_ALCANCE = { mover: '#4caf50', correr: '#f5c542', alem: '#e05555' };

const PRIMARIOS_DA_REACAO = ['agilidade', 'percepcao', 'sorte'];

const limitar = (valor, min, max) => Math.min(Math.max(valor, min), max);

const inteiroEntre = (valor, min, max) =>
  Number.isInteger(valor) && valor >= min && valor <= max;

const vazio = valor => valor === undefined || valor === null || valor === '';

const numero = valor => {
  if (vazio(valor)) return 0;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
};

// cultivoBonus.<categoria>.<atributo> pode ser número ou { [rank]: número }.
const somaNumerica = valor => {
  if (typeof valor === 'number' || typeof valor === 'string') return numero(valor);
  if (Array.isArray(valor))
    return valor.reduce((total, item) => total + somaNumerica(item), 0);
  if (valor && typeof valor === 'object') {
    return Object.values(valor).reduce((total, item) => total + somaNumerica(item), 0);
  }
  return 0;
};

// Reação da ficha (personagens/{id}) → inteiro ou null (sem ficha). Usa o
// total salvo (`secundariosTotais.reacao`); senão a fórmula da ficha
// (calcularSecundarios do site dos jogadores — autocontida aqui porque o
// Re:Master não tem formulas.js):
// ceil(((AGI×0,5 + PER×0,3 + SOR×0,2) / 250) × 6) + 6 + ajustes.
export const reacaoDaFicha = ficha => {
  if (!ficha || typeof ficha !== 'object') return null;
  const salva = ficha.secundariosTotais?.reacao;
  if (!vazio(salva) && Number.isFinite(Number(salva))) return Math.round(Number(salva));
  const cultivo = ficha.cultivoBonus ?? {};
  const primario = chave => {
    const total = ficha.atributosTotais?.[chave];
    if (!vazio(total) && Number.isFinite(Number(total))) return Number(total);
    return (
      numero(ficha.atributosBase?.[chave]) +
      numero(ficha.atributosExtra?.[chave]) +
      numero(ficha.atributosBonus?.[chave]) +
      somaNumerica(cultivo.primarios?.[chave])
    );
  };
  const [agilidade, percepcao, sorte] = PRIMARIOS_DA_REACAO.map(primario);
  const ajuste =
    numero(ficha.secundariosBase?.reacao) +
    numero(ficha.secundariosExtra?.reacao) +
    numero(ficha.secundariosBonus?.reacao) +
    somaNumerica(cultivo.secundarios?.reacao);
  return Math.round(
    Math.ceil(((agilidade * 0.5 + percepcao * 0.3 + sorte * 0.2) / 250) * 6) + 6 + ajuste,
  );
};

// Ordem da iniciativa: maior total primeiro, depois maior Reação (< 0 = `a`
// vem antes).
export const compararIniciativa = (a, b) =>
  b.iniciativa - a.iniciativa || b.reacao - a.reacao;

// [{ tokenId, reacao }] → [{ tokenId, iniciativa, d20, reacao }] em ordem.
// Empate total (iniciativa e Reação) → sorteio (não gravado). `randomFn`
// (uint32) é injetável para o teste.
export const rolarIniciativa = (participantes, randomFn = randomUint32) =>
  participantes
    .map(({ tokenId, reacao }) => {
      const valorReacao = Math.round(numero(reacao));
      const d20 = rolarFace(20, randomFn);
      return {
        tokenId,
        iniciativa: d20 + valorReacao,
        d20,
        reacao: valorReacao,
        sorteio: randomFn(),
      };
    })
    .sort((a, b) => compararIniciativa(a, b) || b.sorteio - a.sorteio)
    .map(({ tokenId, iniciativa, d20, reacao }) => ({
      tokenId,
      iniciativa,
      d20,
      reacao,
    }));

const posicaoValida = posicao =>
  posicao &&
  inteiroEntre(posicao.col, 0, GRID_POSICAO_MAX) &&
  inteiroEntre(posicao.lin, 0, GRID_POSICAO_MAX)
    ? { col: posicao.col, lin: posicao.lin }
    : null;

const inteiro = valor => Math.round(numero(valor));

// Doc combate/atual → { ordem, indice, rodada, inicioTurno, chaveTurno,
// tokenDaVezId } ou null (sem combate). A regra só limita o tamanho da
// lista, então quem lê confere cada entrada. `chaveTurno` muda a cada troca
// de turno (null enquanto a minha troca está pendente).
export const normalizarCombate = doc => {
  if (!doc || !Array.isArray(doc.ordem)) return null;
  const vistos = new Set();
  const ordem = [];
  doc.ordem.forEach(entrada => {
    const tokenId = entrada?.tokenId;
    if (typeof tokenId !== 'string' || !tokenId || vistos.has(tokenId)) return;
    if (ordem.length >= COMBATE_PARTICIPANTES_MAX) return;
    vistos.add(tokenId);
    ordem.push({
      tokenId,
      iniciativa: inteiro(entrada.iniciativa),
      d20: inteiroEntre(entrada.d20, 1, 20) ? entrada.d20 : null,
      reacao: inteiro(entrada.reacao),
    });
  });
  if (!ordem.length) return null;
  const indice = limitar(
    Number.isInteger(doc.indice) ? doc.indice : 0,
    0,
    ordem.length - 1,
  );
  const rodada = limitar(
    Number.isInteger(doc.rodada) ? doc.rodada : 1,
    1,
    COMBATE_RODADA_MAX,
  );
  return {
    ordem,
    indice,
    rodada,
    inicioTurno: posicaoValida(doc.inicioTurno),
    chaveTurno: chaveDoMovimento(doc.turnoEm),
    tokenDaVezId: ordem[indice].tokenId,
  };
};

// NPC ou Criatura com PV atual 0 está derrotado e perde a vez na iniciativa
// (só o mestre revive: PV > 0). Jogador com PV 0 continua na vez dele (a ficha
// é quem manda) e token sem PV (ou avulso) nunca é derrotado.
export const tokenDerrotado = token => {
  if (!token) return false;
  if (token.tipo !== TIPOS_TOKEN.NPC && token.tipo !== TIPOS_TOKEN.CRIATURA) return false;
  const pv = normalizarRecurso(token.pv);
  return Boolean(pv) && pv.atual <= 0;
};

// tokens → Set dos ids derrotados (o "mapa de derrotados" de avancarTurno).
export const derrotadosDosTokens = tokens =>
  new Set((tokens ?? []).filter(tokenDerrotado).map(token => token.id));

// Um passo cru: próximo (+1) / anterior (−1) → { indice, rodada, novaRodada }
// ou null. +1 no último volta ao primeiro com rodada +1; −1 no primeiro vai
// ao último da rodada anterior (null na rodada 1).
const passoDoTurno = (indice, rodada, total, passo) => {
  if (passo > 0) {
    if (indice + 1 < total) return { indice: indice + 1, rodada, novaRodada: false };
    if (rodada >= COMBATE_RODADA_MAX) return null;
    return { indice: 0, rodada: rodada + 1, novaRodada: true };
  }
  if (indice > 0) return { indice: indice - 1, rodada, novaRodada: false };
  if (rodada <= 1) return null;
  return { indice: total - 1, rodada: rodada - 1, novaRodada: false };
};

// Próximo (+1) / anterior (−1) → { indice, rodada, novaRodada } ou null. +1
// no último volta ao primeiro com rodada +1; −1 no primeiro vai ao último da
// rodada anterior (null na rodada 1). `derrotados` (Set de tokenId, opcional)
// são pulados — andando até uma volta inteira, que pode cair de novo no token
// da vez (e passar a rodada) se ele é o único de pé. Se todos estão derrotados
// não há onde parar: vale o passo simples, sem laço.
export const avancarTurno = (combate, passo, { derrotados = null } = {}) => {
  if (!combate?.ordem?.length) return null;
  const total = combate.ordem.length;
  const primeiro = passoDoTurno(combate.indice, combate.rodada, total, passo);
  if (!primeiro || !derrotados?.size) return primeiro;
  let atual = primeiro;
  let novaRodada = false;
  for (let tentativa = 0; tentativa < total; tentativa += 1) {
    novaRodada = novaRodada || atual.novaRodada;
    if (!derrotados.has(combate.ordem[atual.indice].tokenId)) {
      return { indice: atual.indice, rodada: atual.rodada, novaRodada };
    }
    const seguinte = passoDoTurno(atual.indice, atual.rodada, total, passo);
    if (!seguinte) return null;
    atual = seguinte;
  }
  return primeiro;
};

const tokenVisivel = token => Boolean(token && !token.oculto);

// Troca de turno → { patch: { indice, rodada, inicioTurno }, mensagem: {
// evento, rodada, nome, oculto } } ou null. `tokens` = os que quem troca vê:
// o próximo fora deles (oculto para o jogador) ou oculto vira "oponente
// oculto" na mensagem, e sem ele não há origem do alcance. NPC/Criatura
// derrotados (PV 0, ver tokenDerrotado) entre `tokens` perdem a vez.
export const trocarTurno = (combate, passo, tokens) => {
  const proximo = avancarTurno(combate, passo, {
    derrotados: derrotadosDosTokens(tokens),
  });
  if (!proximo) return null;
  const tokenId = combate.ordem[proximo.indice].tokenId;
  const token = (tokens ?? []).find(item => item.id === tokenId) ?? null;
  const visivel = tokenVisivel(token);
  return {
    patch: {
      indice: proximo.indice,
      rodada: proximo.rodada,
      inicioTurno: posicaoValida(token),
    },
    mensagem: {
      evento: proximo.novaRodada ? 'rodada' : 'turno',
      rodada: proximo.rodada,
      nome: visivel ? token.nome : null,
      oculto: !visivel,
    },
  };
};

// Ordem já rolada → { estado: { ordem, indice: 0, rodada: 1, inicioTurno },
// mensagem: { evento: 'inicio', ..., iniciativa: [{ nome, total, d20, reacao }] } }.
// Ocultos (e tokens que sumiram) ficam fora da lista de iniciativa.
export const montarInicioDoCombate = (ordem, tokens) => {
  const porId = new Map((tokens ?? []).map(token => [token.id, token]));
  const primeiro = porId.get(ordem[0]?.tokenId) ?? null;
  const visivel = tokenVisivel(primeiro);
  return {
    estado: { ordem, indice: 0, rodada: 1, inicioTurno: posicaoValida(primeiro) },
    mensagem: {
      evento: 'inicio',
      rodada: 1,
      nome: visivel ? primeiro.nome : null,
      oculto: !visivel,
      iniciativa: ordem
        .filter(entrada => tokenVisivel(porId.get(entrada.tokenId)))
        .map(entrada => ({
          nome: porId.get(entrada.tokenId).nome,
          total: entrada.iniciativa,
          d20: entrada.d20,
          reacao: entrada.reacao,
        })),
    },
  };
};

// Quem entra no meio do combate (já rolado) → { patch: { ordem, indice },
// mudouTurno: false } ou null (já participa / lotado). Entra depois dos
// empates; o token da vez continua o mesmo.
export const inserirNoCombate = (combate, entrada) => {
  if (!combate || !entrada?.tokenId) return null;
  if (combate.ordem.some(item => item.tokenId === entrada.tokenId)) return null;
  if (combate.ordem.length >= COMBATE_PARTICIPANTES_MAX) return null;
  const nova = {
    tokenId: entrada.tokenId,
    iniciativa: inteiro(entrada.iniciativa),
    d20: inteiroEntre(entrada.d20, 1, 20) ? entrada.d20 : null,
    reacao: inteiro(entrada.reacao),
  };
  const achada = combate.ordem.findIndex(item => compararIniciativa(nova, item) < 0);
  const posicao = achada < 0 ? combate.ordem.length : achada;
  const ordem = [
    ...combate.ordem.slice(0, posicao),
    nova,
    ...combate.ordem.slice(posicao),
  ];
  return {
    patch: {
      ordem,
      indice: posicao <= combate.indice ? combate.indice + 1 : combate.indice,
    },
    mudouTurno: false,
  };
};

// Tirar do combate → null (não participa) | { encerrar: true } (era o último)
// | { patch: { ordem, indice, rodada, inicioTurno? }, mudouTurno }. Se sai o
// token da vez, o próximo assume (passando do fim, volta ao primeiro com
// rodada +1).
export const removerDoCombate = (combate, tokenId, tokens) => {
  if (!combate) return null;
  const posicao = combate.ordem.findIndex(item => item.tokenId === tokenId);
  if (posicao < 0) return null;
  if (combate.ordem.length === 1) return { encerrar: true };
  const ordem = combate.ordem.filter(item => item.tokenId !== tokenId);
  if (posicao !== combate.indice) {
    return {
      patch: {
        ordem,
        indice: posicao < combate.indice ? combate.indice - 1 : combate.indice,
        rodada: combate.rodada,
      },
      mudouTurno: false,
    };
  }
  const passou = posicao >= ordem.length;
  const indice = passou ? 0 : posicao;
  const rodada = passou
    ? Math.min(combate.rodada + 1, COMBATE_RODADA_MAX)
    : combate.rodada;
  const token = (tokens ?? []).find(item => item.id === ordem[indice].tokenId) ?? null;
  return {
    patch: { ordem, indice, rodada, inicioTurno: posicaoValida(token) },
    mudouTurno: true,
  };
};

// Sobe (−1) / desce (+1) o token na ordem, trocando com o vizinho; o índice
// acompanha o token da vez. null nas pontas.
export const moverNoCombate = (combate, tokenId, passo) => {
  if (!combate) return null;
  const de = combate.ordem.findIndex(item => item.tokenId === tokenId);
  const para = de + passo;
  if (de < 0 || para < 0 || para >= combate.ordem.length || para === de) return null;
  const ordem = [...combate.ordem];
  [ordem[de], ordem[para]] = [ordem[para], ordem[de]];
  let { indice } = combate;
  if (indice === de) indice = para;
  else if (indice === para) indice = de;
  return { patch: { ordem, indice }, mudouTurno: false };
};

// View model da faixa de iniciativa → { rodada, itens: [{ tokenId, nome,
// imagemUrl, tipo, oculto, derrotado, atual, iniciativa }], vezDoMestre } ou null. Quem
// não vê tudo não vê os ocultos (nem os que não estão em `tokens`); se a vez é
// de um deles, `vezDoMestre`.
export const faixaDoCombate = (combate, tokens, { veTudo = false } = {}) => {
  if (!combate) return null;
  const porId = new Map((tokens ?? []).map(token => [token.id, token]));
  const itens = [];
  combate.ordem.forEach((entrada, indice) => {
    const token = porId.get(entrada.tokenId);
    if (!token || (token.oculto && !veTudo)) return;
    itens.push({
      tokenId: entrada.tokenId,
      nome: token.nome ?? '',
      imagemUrl: token.imagemUrl ?? null,
      tipo: token.tipo,
      oculto: Boolean(token.oculto),
      derrotado: tokenDerrotado(token),
      atual: indice === combate.indice,
      iniciativa: entrada.iniciativa,
    });
  });
  const daVez = porId.get(combate.tokenDaVezId);
  return {
    rodada: combate.rodada,
    itens,
    vezDoMestre: !veTudo && !tokenVisivel(daVez),
  };
};

// ── Alcance de movimento ───────────────────────────────────────────────────
// Só indicação (não bloqueia): células até Mover (deslocamento do token) em
// verde, até Correr (× multiplicador da cena) em amarelo, contadas desde a
// posição de início do turno do token da vez (ou a atual). Passos em 8
// direções (diagonal = 1, Chebyshev); `bloqueadas` é o gancho das paredes.

// Origem do alcance: onde o token começou o turno (se é a vez dele), senão
// onde ele está.
export const origemDoAlcance = (token, combate) =>
  combate?.tokenDaVezId === token.id && combate.inicioTurno
    ? { col: combate.inicioTurno.col, lin: combate.inicioTurno.lin }
    : { col: token.col, lin: token.lin };

// Metros → quadrados inteiros (9 m / 1,5 m / 2× → 6 e 12), até
// ALCANCE_QUADRADOS_MAX.
export const quadradosDeMovimento = (deslocamento, metrosPorQuadrado, multiplicador) => {
  const metros = metrosPorQuadrado > 0 ? metrosPorQuadrado : METROS_POR_QUADRADO_PADRAO;
  const fator = normalizarMultiplicadorCorrida(multiplicador);
  const quadrados = valor =>
    limitar(Math.floor(valor / metros + 1e-9), 0, ALCANCE_QUADRADOS_MAX);
  return { mover: quadrados(deslocamento), correr: quadrados(deslocamento * fator) };
};

const VIZINHOS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const chaveDaCelula = (col, lin) => `${col},${lin}`;

// Âncoras (canto do token) alcançáveis em até `alcance` passos → Map<'col,lin',
// passos>. Âncoras dentro do mundo (token inteiro dentro); com `bloqueadas`
// (Set 'col,lin'), âncora cuja área toca uma célula bloqueada é recusada.
export const distanciasDeMovimento = ({
  origem,
  tamanho = 1,
  alcance,
  limites,
  bloqueadas = null,
}) => {
  const maxCol = Math.min(Math.max(limites.colunas - tamanho, 0), GRID_POSICAO_MAX);
  const maxLin = Math.min(Math.max(limites.linhas - tamanho, 0), GRID_POSICAO_MAX);
  const livre = (col, lin) => {
    if (!bloqueadas) return true;
    for (let dl = 0; dl < tamanho; dl += 1) {
      for (let dc = 0; dc < tamanho; dc += 1) {
        if (bloqueadas.has(chaveDaCelula(col + dc, lin + dl))) return false;
      }
    }
    return true;
  };
  const distancias = new Map([[chaveDaCelula(origem.col, origem.lin), 0]]);
  let fronteira = [origem];
  for (let passo = 1; passo <= alcance && fronteira.length; passo += 1) {
    const proxima = [];
    fronteira.forEach(({ col, lin }) => {
      VIZINHOS.forEach(([dc, dl]) => {
        const vizinho = { col: col + dc, lin: lin + dl };
        if (
          vizinho.col < 0 ||
          vizinho.lin < 0 ||
          vizinho.col > maxCol ||
          vizinho.lin > maxLin
        )
          return;
        const chave = chaveDaCelula(vizinho.col, vizinho.lin);
        if (distancias.has(chave) || !livre(vizinho.col, vizinho.lin)) return;
        // Quina fechada: diagonal com os dois lados ortogonais bloqueados.
        if (
          bloqueadas &&
          dc !== 0 &&
          dl !== 0 &&
          !livre(col + dc, lin) &&
          !livre(col, lin + dl)
        )
          return;
        distancias.set(chave, passo);
        proxima.push(vizinho);
      });
    });
    fronteira = proxima;
  }
  return distancias;
};

// 'mover' | 'correr' | 'alem' para uma distância em passos.
export const faixaDaDistancia = (passos, { mover, correr }) => {
  if (passos <= mover) return 'mover';
  if (passos <= correr) return 'correr';
  return 'alem';
};

// Âncoras → células cobertas pelo token em cada âncora (cada célula na menor
// distância) → trechos por linha { mover: [{ col, lin, colunas }], correr: [...] }.
export const faixasDoAlcance = (distancias, { mover, correr, tamanho = 1 }) => {
  const celulas = new Map();
  distancias.forEach((passos, chave) => {
    if (passos > correr) return;
    const [col, lin] = chave.split(',').map(Number);
    for (let dl = 0; dl < tamanho; dl += 1) {
      for (let dc = 0; dc < tamanho; dc += 1) {
        const chaveCelula = chaveDaCelula(col + dc, lin + dl);
        const anterior = celulas.get(chaveCelula);
        if (anterior === undefined || passos < anterior) celulas.set(chaveCelula, passos);
      }
    }
  });
  const porLinha = new Map();
  celulas.forEach((passos, chave) => {
    const [col, lin] = chave.split(',').map(Number);
    if (!porLinha.has(lin)) porLinha.set(lin, []);
    porLinha.get(lin).push({ col, faixa: faixaDaDistancia(passos, { mover, correr }) });
  });
  const faixas = { mover: [], correr: [] };
  [...porLinha.keys()]
    .sort((a, b) => a - b)
    .forEach(lin => {
      let trecho = null;
      porLinha
        .get(lin)
        .sort((a, b) => a.col - b.col)
        .forEach(({ col, faixa }) => {
          if (trecho && trecho.faixa === faixa && trecho.col + trecho.colunas === col) {
            trecho.colunas += 1;
            return;
          }
          if (trecho)
            faixas[trecho.faixa].push({ col: trecho.col, lin, colunas: trecho.colunas });
          trecho = { col, faixa, colunas: 1 };
        });
      if (trecho)
        faixas[trecho.faixa].push({ col: trecho.col, lin, colunas: trecho.colunas });
    });
  return faixas;
};
