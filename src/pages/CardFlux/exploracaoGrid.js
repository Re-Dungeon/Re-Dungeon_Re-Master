const MODOS_EXPLORACAO = new Set(['predefinida', 'dinamica', 'hibrida']);

export const VALIDACAO_EXPLORACAO = {
  NOME: 'nome',
  BARALHOS: 'baralhos',
  DIMENSOES: 'dimensoes',
  DENSIDADE: 'densidade',
  MODO: 'modo',
};

const normalizarNumero = valor => Number.parseInt(valor, 10);

const normalizarImagemFundo = imagemFundo => {
  const fonte = imagemFundo && typeof imagemFundo === 'object' ? imagemFundo : {};
  const origemInformada = typeof fonte.origem === 'string' ? fonte.origem : '';
  const origem = ['mapa', 'url'].includes(origemInformada)
    ? origemInformada
    : (typeof fonte.mapaId === 'string' && fonte.mapaId.trim()) || fonte.mapaId
      ? 'mapa'
      : 'url';
  const mapaId = typeof fonte.mapaId === 'string' && fonte.mapaId.trim()
    ? fonte.mapaId.trim()
    : null;
  const url = typeof fonte.url === 'string' ? fonte.url.trim() : '';
  const ajuste = ['cover', 'contain', 'fill'].includes(fonte.ajuste) ? fonte.ajuste : 'cover';
  const opacidade = Number(fonte.opacidadeQuadrantes ?? 20);

  return {
    origem,
    mapaId: origem === 'mapa' ? mapaId : null,
    url,
    ajuste,
    opacidadeQuadrantes: Number.isFinite(opacidade)
      ? Math.min(100, Math.max(0, opacidade))
      : 20,
  };
};

const normalizarCoordenada = ({ x, y }) => ({
  x: normalizarNumero(x),
  y: normalizarNumero(y),
});

export const localizarArrayAninhado = (valor, caminho = 'payload') => {
  if (valor === null || valor === undefined) return null;

  if (Array.isArray(valor)) {
    for (let indice = 0; indice < valor.length; indice += 1) {
      const item = valor[indice];
      if (Array.isArray(item)) {
        return `${caminho}[${indice}]`;
      }
      const aninhado = typeof item === 'object' && item !== null
        ? localizarArrayAninhado(item, `${caminho}[${indice}]`)
        : null;
      if (aninhado) return aninhado;
    }
    return null;
  }

  if (typeof valor === 'object') {
    for (const [chave, item] of Object.entries(valor)) {
      const proximoCaminho = `${caminho}.${chave}`;
      if (Array.isArray(item)) {
        const temArrayDireto = item.some(itemInterno => Array.isArray(itemInterno));
        if (temArrayDireto) {
          return proximoCaminho;
        }
      }
      const aninhado = localizarArrayAninhado(item, proximoCaminho);
      if (aninhado) return aninhado;
    }
  }

  return null;
};

const criarQuadrantePersistencia = (quadrante = {}, linha = 0, coluna = 0) => {
  const base = quadrante && typeof quadrante === 'object' ? quadrante : {};
  return {
    ...base,
    id: base.id || `${linha}-${coluna}`,
    linha: Number(base.linha ?? linha),
    coluna: Number(base.coluna ?? coluna),
    x: Number(base.x ?? coluna),
    y: Number(base.y ?? linha),
    estado: base.estado || 'oculto',
    cartaId: base.cartaId ?? null,
    resultado: base.resultado ?? null,
    observacao: base.observacao ?? '',
    anotacao: base.anotacao ?? '',
    historico: Array.isArray(base.historico) ? base.historico : [],
    revelaEm: base.revelaEm ?? null,
    fixo: Boolean(base.fixo),
    bloqueado: Boolean(base.bloqueado),
    comum: Boolean(base.comum),
  };
};

export const normalizarQuadrantesParaPersistencia = quadrantes => {
  if (!Array.isArray(quadrantes)) return [];

  if (quadrantes.length > 0 && Array.isArray(quadrantes[0])) {
    return quadrantes.flatMap((linha, linhaIndex) =>
      (Array.isArray(linha) ? linha : []).map((quadrante, colunaIndex) =>
        criarQuadrantePersistencia(quadrante, linhaIndex, colunaIndex),
      ),
    );
  }

  return quadrantes.map((quadrante, index) => {
    const linha = Number(quadrante?.linha ?? quadrante?.y ?? 0);
    const coluna = Number(quadrante?.coluna ?? quadrante?.x ?? index);
    return criarQuadrantePersistencia(quadrante, linha, coluna);
  });
};

const reconstroiMatrizQuadrantes = (quadrantes, linhas, colunas) => {
  const totalLinhas = Math.max(1, Number(linhas) || 1);
  const totalColunas = Math.max(1, Number(colunas) || 1);
  const matriz = Array.from({ length: totalLinhas }, (_, linhaIndex) =>
    Array.from({ length: totalColunas }, (_, colunaIndex) => ({
      x: colunaIndex,
      y: linhaIndex,
      linha: linhaIndex,
      coluna: colunaIndex,
      cartaId: null,
      estado: 'oculto',
      resultado: null,
      observacao: '',
      anotacao: '',
      historico: [],
      revelaEm: null,
      fixo: false,
      bloqueado: false,
      comum: false,
    })),
  );

  if (!Array.isArray(quadrantes)) {
    return matriz;
  }

  quadrantes.forEach(quadrante => {
    if (!quadrante || typeof quadrante !== 'object') return;

    const linha = Number(quadrante.linha ?? quadrante.y ?? 0);
    const coluna = Number(quadrante.coluna ?? quadrante.x ?? 0);
    if (!matriz[linha]) return;
    if (!matriz[linha][coluna]) return;

    matriz[linha][coluna] = {
      ...matriz[linha][coluna],
      ...quadrante,
      x: coluna,
      y: linha,
      linha,
      coluna,
      cartaId: quadrante.cartaId ?? matriz[linha][coluna].cartaId ?? null,
      estado: quadrante.estado ?? matriz[linha][coluna].estado ?? 'oculto',
      resultado: quadrante.resultado ?? null,
      observacao: quadrante.observacao ?? '',
      anotacao: quadrante.anotacao ?? '',
      historico: Array.isArray(quadrante.historico) ? quadrante.historico : [],
      revelaEm: quadrante.revelaEm ?? null,
      fixo: Boolean(quadrante.fixo),
      bloqueado: Boolean(quadrante.bloqueado),
      comum: Boolean(quadrante.comum),
    };
  });

  return matriz;
};

const normalizarValoresIndefinidos = valor => {
  if (valor === undefined) return undefined;
  if (Array.isArray(valor)) {
    return valor
      .map(item => normalizarValoresIndefinidos(item))
      .filter(item => item !== undefined);
  }
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).reduce((acumulador, [chave, item]) => {
      const limpo = normalizarValoresIndefinidos(item);
      const padrao = {
        resultado: null,
        observacao: '',
        anotacao: '',
        revelaEm: null,
        historico: [],
        aviso: '',
      }[chave];

      if (limpo === undefined) {
        if (padrao !== undefined) {
          acumulador[chave] = padrao;
        }
        return acumulador;
      }

      acumulador[chave] = limpo;
      return acumulador;
    }, {});
  }
  return valor;
};

export const sanitizarExploracaoParaPersistencia = (
  exploracao,
  { exigirCamposObrigatorios = true } = {},
) => {
  if (!exploracao || typeof exploracao !== 'object') {
    throw new Error('Exploração inválida para persistência.');
  }

  const payloadBase = normalizarValoresIndefinidos(exploracao);
  const payload = { ...payloadBase };
  const imagemFundoInformada =
    Object.prototype.hasOwnProperty.call(payloadBase, 'imagemFundo')
      ? payloadBase.imagemFundo
      : payloadBase.configuracao?.imagemFundo;

  if (imagemFundoInformada !== undefined) {
    const imagemFundo = normalizarImagemFundo(imagemFundoInformada);
    payload.imagemFundo = imagemFundo;
    if (payload.configuracao && typeof payload.configuracao === 'object') {
      payload.configuracao = {
        ...payload.configuracao,
        imagemFundo,
      };
    }
  }

  if (Object.prototype.hasOwnProperty.call(payloadBase, 'quadrantes')) {
    payload.quadrantes = normalizarQuadrantesParaPersistencia(payloadBase.quadrantes);
  }

  const problemaAninhado = localizarArrayAninhado(payload, 'payload');
  if (problemaAninhado) {
    throw new Error(
      `Payload inválido para Firestore: array diretamente aninhado em "${problemaAninhado}".`,
    );
  }

  if (!exigirCamposObrigatorios) {
    return payload;
  }

  const erros = [];

  const baralhos = Array.isArray(payload.baralhos)
    ? payload.baralhos
    : Array.isArray(payload.configuracao?.baralhos)
      ? payload.configuracao.baralhos
      : [];
  const linhas = Number(
    payload.linhas ?? payload.dimensoes?.linhas ?? payload.configuracao?.linhas ?? 0,
  );
  const colunas = Number(
    payload.colunas ?? payload.dimensoes?.colunas ?? payload.configuracao?.colunas ?? 0,
  );
  const densidade = Number(
    payload.densidade ?? payload.configuracao?.densidade ?? 0,
  );
  const modo = typeof payload.modo === 'string'
    ? payload.modo
    : typeof payload.configuracao?.modo === 'string'
      ? payload.configuracao.modo
      : '';
  const quadrantes = Array.isArray(payload.quadrantes)
    ? payload.quadrantes
    : Array.isArray(payload.configuracao?.quadrantes)
      ? payload.configuracao.quadrantes
      : [];

  if (typeof payload.nome !== 'string' || !payload.nome.trim()) {
    erros.push('nome');
  }
  if (typeof payload.mestreId !== 'string' || !payload.mestreId.trim()) {
    erros.push('mestreId');
  }
  if (typeof payload.universoId !== 'string' || !payload.universoId.trim()) {
    erros.push('universoId');
  }
  if (typeof payload.campanhaId !== 'string' || !payload.campanhaId.trim()) {
    erros.push('campanhaId');
  }
  if (baralhos.length === 0) {
    erros.push('baralhos');
  }
  if (quadrantes.length === 0) {
    erros.push('quadrantes');
  }
  if (!Number.isFinite(linhas) || linhas < 1) {
    erros.push('linhas');
  }
  if (!Number.isFinite(colunas) || colunas < 1) {
    erros.push('colunas');
  }
  if (!Number.isFinite(densidade) || densidade < 0) {
    erros.push('densidade');
  }
  if (typeof modo !== 'string' || !modo.trim()) {
    erros.push('modo');
  }

  if (erros.length > 0) {
    throw new Error(
      `Exploração inválida para salvar: campos obrigatórios ausentes (${erros.join(', ')}).`,
    );
  }

  return payload;
};

export const criarMatrizQuadrantes = ({ linhas, colunas }) => {
  const totalLinhas = Math.max(1, normalizarNumero(linhas) || 1);
  const totalColunas = Math.max(1, normalizarNumero(colunas) || 1);

  return Array.from({ length: totalLinhas }, (_, y) =>
    Array.from({ length: totalColunas }, (_, x) => ({
      x,
      y,
      cartaId: null,
      estado: 'oculto',
      resultado: null,
      observacao: '',
      fixo: false,
      bloqueado: false,
      anotacao: '',
      historico: [],
      revelaEm: null,
      comum: false,
    })),
  );
};

export const calcularDensidadeAcontecimento = ({ total, densidade }) => {
  const limiteTotal = Math.max(0, Number.isFinite(total) ? Number(total) : 0);
  const percentual = Math.max(0, Math.min(100, Number(densidade) || 0));
  return Math.round((limiteTotal * percentual) / 100);
};

export const filtrarCartasElegiveisExploracao = ({
  cartas,
  baralhos,
  repetir,
  respeitarCooldown,
  listaCartasUsadas = [],
}) => {
  const baralhosValidos = new Set(
    Array.isArray(baralhos) ? baralhos.filter(Boolean) : [],
  );
  const usadas = new Set((listaCartasUsadas || []).filter(Boolean));

  return (cartas || []).filter(carta => {
    if (!carta) return false;
    if (baralhosValidos.size > 0 && !baralhosValidos.has(carta.deck)) return false;
    if (carta.ativo === false || carta.ativa === false) return false;
    if (carta.peso === 0 || Number(carta.peso) === 0) return false;
    if (!repetir && usadas.has(carta.id)) return false;
    if (respeitarCooldown && (Number(carta.cooldownRestante) || 0) > 0) {
      return false;
    }
    return true;
  });
};

export const sortearCartaExploracao = ({ cartas, cartasUsadas = [] }) => {
  const pool = Array.isArray(cartas) ? cartas : [];
  if (pool.length === 0) return null;

  const usadas = new Set((cartasUsadas || []).filter(Boolean));
  const poolElegivel = pool.filter(carta => !usadas.has(carta.id));
  const cartasDisponiveis = poolElegivel.length > 0 ? poolElegivel : pool;

  const pesos = cartasDisponiveis.map(carta => {
    const peso = Number(carta.peso);
    return Number.isFinite(peso) && peso > 0 ? peso : 1;
  });
  const pesoTotal = pesos.reduce((soma, item) => soma + item, 0);

  if (pesoTotal <= 0) return cartasDisponiveis[cartasDisponiveis.length - 1] || null;

  let alvo = Math.random() * pesoTotal;
  for (let index = 0; index < cartasDisponiveis.length; index += 1) {
    alvo -= pesos[index];
    if (alvo <= 0) return cartasDisponiveis[index];
  }

  return cartasDisponiveis[cartasDisponiveis.length - 1] || null;
};

export const validarConfiguracaoExploracao = config => {
  const resultado = {
    valida: true,
    errors: [],
    aviso: '',
    campos: [],
  };

  const nome = (config?.nome || '').trim();
  const baralhos = Array.isArray(config?.baralhos) ? config.baralhos : [];
  const linhas = normalizarNumero(config?.linhas);
  const colunas = normalizarNumero(config?.colunas);
  const densidade = Number(config?.densidade ?? 0);
  const modo = String(config?.modo || 'predefinida').trim().toLowerCase();

  if (!nome) {
    resultado.valida = false;
    resultado.errors.push({ campo: VALIDACAO_EXPLORACAO.NOME });
    resultado.campos.push(VALIDACAO_EXPLORACAO.NOME);
  }

  if (!baralhos.length) {
    resultado.valida = false;
    resultado.errors.push({ campo: VALIDACAO_EXPLORACAO.BARALHOS });
    resultado.campos.push(VALIDACAO_EXPLORACAO.BARALHOS);
  }

  if (!Number.isInteger(linhas) || linhas < 1 || linhas > 12) {
    resultado.valida = false;
    resultado.errors.push({ campo: VALIDACAO_EXPLORACAO.DIMENSOES });
    resultado.campos.push(VALIDACAO_EXPLORACAO.DIMENSOES);
  }

  if (!Number.isInteger(colunas) || colunas < 1 || colunas > 12) {
    resultado.valida = false;
    resultado.errors.push({ campo: VALIDACAO_EXPLORACAO.DIMENSOES });
    resultado.campos.push(VALIDACAO_EXPLORACAO.DIMENSOES);
  }

  if (!Number.isFinite(densidade) || densidade < 0 || densidade > 100) {
    resultado.valida = false;
    resultado.errors.push({ campo: VALIDACAO_EXPLORACAO.DENSIDADE });
    resultado.campos.push(VALIDACAO_EXPLORACAO.DENSIDADE);
  }

  if (!MODOS_EXPLORACAO.has(modo)) {
    resultado.valida = false;
    resultado.errors.push({ campo: VALIDACAO_EXPLORACAO.MODO });
    resultado.campos.push(VALIDACAO_EXPLORACAO.MODO);
  }

  if (!resultado.valida) {
    resultado.aviso = 'Configuração inválida para geração do grid.';
    return resultado;
  }

  if (baralhos.length > 0) {
    resultado.aviso = 'Nenhuma carta elegível encontrada para os baralhos selecionados.';
  }

  return resultado;
};

const selecionarQuadrantesParaDensidade = ({
  matriz,
  quantidade,
  fixos = [],
}) => {
  const bloqueados = new Set(
    fixos.map(quadrante => `${quadrante.x}:${quadrante.y}`),
  );
  const disponiveis = [];

  matriz.forEach(linha => {
    linha.forEach(quadrante => {
      if (!bloqueados.has(`${quadrante.x}:${quadrante.y}`)) {
        disponiveis.push(quadrante);
      }
    });
  });

  if (quantidade <= 0 || disponiveis.length === 0) return [];

  const selecionados = [];
  const ordem = [...disponiveis].sort(() => Math.random() - 0.5);
  const limite = Math.min(quantidade, ordem.length);

  for (let index = 0; index < limite; index += 1) {
    const quadrante = ordem[index];
    if (!quadrante) continue;
    selecionados.push(quadrante);
  }

  return selecionados;
};

export const gerarExploracaoGrid = ({
  nome,
  mestreId,
  universoId,
  campanhaId,
  baralhos,
  linhas,
  colunas,
  densidade,
  modo,
  repetir,
  respeitarCooldown,
  cartas,
  quadrantesFixos = [],
  id,
  status = 'ativa',
  imagemFundo,
}) => {
  const config = {
    nome: nome || 'Nova Exploração',
    mestreId,
    universoId,
    campanhaId,
    baralhos: Array.isArray(baralhos) ? baralhos : [],
    linhas: normalizarNumero(linhas) || 4,
    colunas: normalizarNumero(colunas) || 4,
    densidade: Number(densidade) || 0,
    modo: String(modo || 'predefinida').trim().toLowerCase(),
    repetir: Boolean(repetir),
    respeitarCooldown: Boolean(respeitarCooldown),
    imagemFundo: normalizarImagemFundo(imagemFundo),
  };

  const validacao = validarConfiguracaoExploracao(config);
  const matriz = criarMatrizQuadrantes({
    linhas: config.linhas,
    colunas: config.colunas,
  });

  const fichasFixas = Array.isArray(quadrantesFixos) ? quadrantesFixos : [];
  const mapaFixos = new Map(
    fichasFixas.map(quadrante => [`${quadrante.x}:${quadrante.y}`, quadrante]),
  );

  matriz.forEach(linha => {
    linha.forEach(quadrante => {
      const fixo = mapaFixos.get(`${quadrante.x}:${quadrante.y}`);
      if (fixo) {
        quadrante.cartaId = fixo.cartaId || null;
        quadrante.estado = fixo.estado || (fixo.cartaId ? 'revelado' : 'vazio');
        quadrante.fixo = true;
        quadrante.bloqueado = Boolean(fixo.bloqueado);
        quadrante.anotacao = fixo.anotacao || '';
      }
    });
  });

  const pool = filtrarCartasElegiveisExploracao({
    cartas: Array.isArray(cartas) ? cartas : [],
    baralhos: config.baralhos,
    repetir: config.repetir,
    respeitarCooldown: config.respeitarCooldown,
    listaCartasUsadas: [],
  });

  const totalQuadrantes = config.linhas * config.colunas;
  const quantidadeDesejada = calcularDensidadeAcontecimento({
    total: totalQuadrantes,
    densidade: config.densidade,
  });

  const usados = new Set();
  const alvos = selecionarQuadrantesParaDensidade({
    matriz,
    quantidade: quantidadeDesejada,
    fixos: fichasFixas,
    permitirRepeticao: config.repetir,
  });

  alvos.forEach(quadrante => {
    const carta = pool.length
      ? sortearCartaExploracao({
          cartas: pool.filter(item => !usados.has(item.id)),
          cartasUsadas: [...usados],
        })
      : null;

    if (!carta) {
      quadrante.cartaId = null;
      quadrante.estado = 'vazio';
      quadrante.resultado = null;
      return;
    }

    usados.add(carta.id);
    quadrante.cartaId = carta.id;
    quadrante.estado =
      modo === 'predefinida' ? 'revelado' : modeForDynamic(modo, 'não-revelado');
    quadrante.resultado = null;
    quadrante.observacao = modo === 'predefinida' ? 'Acontecimento gerado.' : '';
    quadrante.revelaEm = null;
  });

  if (modo === 'dinamica' || modo === 'hibrida') {
    matriz.forEach(linha => {
      linha.forEach(quadrante => {
        if (!quadrante.fixo && quadrante.cartaId && quadrante.estado !== 'revelado') {
          quadrante.estado = 'oculto';
          quadrante.revelaEm = null;
        }
      });
    });
  }

  return {
    id: id || `exp-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    nome: config.nome,
    mestreId,
    universoId,
    campanhaId,
    baralhos: config.baralhos,
    imagemFundo: normalizarImagemFundo(imagemFundo || config.imagemFundo),
    configuracao: {
      ...config,
      origem: 'exploracao-grid',
      validacao,
    },
    dimensoes: {
      linhas: config.linhas,
      colunas: config.colunas,
    },
    quadrantes: matriz,
    totalQuadrantes,
    status,
    historico: [],
    anotações: {},
    resultados: {},
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    cartasUsadas: [...usados],
    aviso: validacao.aviso,
  };
};

function modeForDynamic(modo, fallback = 'revelado') {
  if (modo === 'predefinida') return 'revelado';
  if (modo === 'dinamica' || modo === 'hibrida') return fallback;
  return fallback;
}

export const getEstadoQuadrante = quadrante => ({
  estado: quadrante?.estado || 'oculto',
  bloqueado: Boolean(quadrante?.bloqueado),
  fixo: Boolean(quadrante?.fixo),
  cartaId: quadrante?.cartaId ?? null,
  resultado: quadrante?.resultado ?? null,
});

export const revelarQuadranteExploracao = (exploracao, coordenada) => {
  if (!exploracao || !exploracao.quadrantes) return exploracao;
  const { x, y } = normalizarCoordenada(coordenada || {});
  const quadrante = exploracao.quadrantes?.[y]?.[x];
  if (!quadrante) return exploracao;
  if (quadrante.estado === 'revelado' || quadrante.estado === 'em_andamento') {
    return exploracao;
  }

  const clone = JSON.parse(JSON.stringify(exploracao));
  const alvo = clone.quadrantes[y][x];
  if (!alvo.cartaId && !alvo.fixo) {
    const cartasDisponiveis = Array.isArray(clone.configuracao?.cartas)
      ? clone.configuracao.cartas
      : [];
    const carta = sortearCartaExploracao({
      cartas: cartasDisponiveis.filter(item => !clone.cartasUsadas.includes(item.id)),
      cartasUsadas: clone.cartasUsadas || [],
    });
    if (carta) {
      alvo.cartaId = carta.id;
      clone.cartasUsadas = Array.from(new Set([...(clone.cartasUsadas || []), carta.id]));
    }
  }

  if (!alvo.cartaId) {
    alvo.estado = 'vazio';
    return clone;
  }

  alvo.estado = 'revelado';
  alvo.revelaEm = alvo.revelaEm || new Date().toISOString();
  return clone;
};

export const registrarResultadoQuadrante = (
  exploracao,
  x,
  y,
  { resultado, observacao = '' },
) => {
  if (!exploracao || !exploracao.quadrantes) return exploracao;
  const clone = JSON.parse(JSON.stringify(exploracao));
  const alvo = clone.quadrantes?.[y]?.[x];
  if (!alvo) return clone;

  const resultadoNormalizado = ['sucesso', 'falha', 'pendente'].includes(resultado)
    ? resultado
    : null;

  alvo.resultado = resultadoNormalizado;
  alvo.observacao = observacao;
  if (!['oculto', 'vazio'].includes(alvo.estado)) {
    alvo.estado = alvo.estado || 'revelado';
  } else {
    alvo.estado = 'revelado';
  }
  clone.resultados = {
    ...(clone.resultados || {}),
    [`${x}:${y}`]: { resultado: resultadoNormalizado, observacao },
  };
  clone.atualizadoEm = new Date().toISOString();
  return clone;
};

export const substituirCartaQuadrante = (exploracao, coordenada, cartaId) => {
  if (!exploracao || !exploracao.quadrantes) return exploracao;
  const { x, y } = normalizarCoordenada(coordenada || {});
  const clone = JSON.parse(JSON.stringify(exploracao));
  const alvo = clone.quadrantes?.[y]?.[x];
  if (!alvo) return clone;

  alvo.cartaId = cartaId || null;
  alvo.estado = cartaId ? 'revelado' : 'vazio';
  alvo.fixo = false;
  clone.atualizadoEm = new Date().toISOString();
  return clone;
};

export const removerCartaQuadrante = (exploracao, coordenada) => {
  if (!exploracao || !exploracao.quadrantes) return exploracao;
  const { x, y } = normalizarCoordenada(coordenada || {});
  const clone = JSON.parse(JSON.stringify(exploracao));
  const alvo = clone.quadrantes?.[y]?.[x];
  if (!alvo) return clone;

  alvo.cartaId = null;
  alvo.resultado = null;
  alvo.observacao = '';
  alvo.estado = 'vazio';
  clone.atualizadoEm = new Date().toISOString();
  return clone;
};

export const serializarExploracaoGrid = exploracao => {
  if (!exploracao) return null;
  const payload = sanitizarExploracaoParaPersistencia(exploracao, {
    exigirCamposObrigatorios: false,
  });
  return JSON.stringify({
    ...payload,
    serializadoEm: new Date().toISOString(),
  });
};

export const recuperarExploracaoGrid = payload => {
  if (!payload) return null;
  const parseado = typeof payload === 'string' ? JSON.parse(payload) : payload;

  const linhas = Number(parseado?.dimensoes?.linhas ?? parseado?.linhas ?? 0);
  const colunas = Number(parseado?.dimensoes?.colunas ?? parseado?.colunas ?? 0);
  const quadrantes = Array.isArray(parseado?.quadrantes)
    ? parseado.quadrantes
    : [];

  const matriz = Array.isArray(quadrantes) && quadrantes.length > 0 && typeof quadrantes[0] === 'object' && !Array.isArray(quadrantes[0])
    ? reconstroiMatrizQuadrantes(quadrantes, linhas || 1, colunas || 1)
    : Array.isArray(quadrantes)
      ? quadrantes
      : [];

  return {
    ...parseado,
    imagemFundo: normalizarImagemFundo(parseado?.imagemFundo ?? parseado?.configuracao?.imagemFundo),
    quadrantes: matriz,
    status: parseado?.status || 'ativa',
  };
};
