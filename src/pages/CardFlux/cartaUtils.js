import { addRmCardfluxEstado, updateRmCardfluxEstado } from 'service/storage';

export const ESTADO_CARTA_OPCOES = [
  { value: 'no_baralho', label: 'No Baralho' },
  { value: 'comprada', label: 'Comprada' },
  { value: 'descartada', label: 'Descartada' },
];

// Presets de ritmo de viagem para a fórmula da Seção 8 — positivo = viagem
// mais cautelosa/lenta (mais cartas), negativo = mais rápida (menos cartas).
export const RITMO_OPCOES = [
  { value: 6, label: 'Muito Cauteloso (+6)' },
  { value: 3, label: 'Cauteloso (+3)' },
  { value: 0, label: 'Normal (0)' },
  { value: -3, label: 'Rápido (-3)' },
  { value: -6, label: 'Muito Rápido (-6)' },
];

export const INTENSIDADE_MIN = 1;
export const INTENSIDADE_MAX = 10;

// As cartas em si vêm do `cardflux` (projeto irmão) e não sabem o que é uma
// Campanha do Re:Master — o estado de sorteio de cada carta dentro de uma
// Campanha específica mora em `rmCardfluxEstados`, indexado por `cartaId`.
// Junta as duas fontes; carta sem doc de estado ainda está 'no_baralho' e
// sem cooldown.
export const mesclarEstadoCartas = (cartas, estadosDaCampanha) => {
  const estadoPorCartaId = new Map(estadosDaCampanha.map(e => [e.cartaId, e]));
  return cartas.map(carta => {
    const estado = estadoPorCartaId.get(carta.id);
    return {
      ...carta,
      estadoNoBaralho: estado?.estadoNoBaralho ?? 'no_baralho',
      estadoDocId: estado?.id ?? null,
      cooldownRestante: estado?.cooldownRestante ?? 0,
    };
  });
};

// Fórmula da Seção 8: total de cartas planejadas para a "viagem" atual.
export const calcularTotalCartas = ({
  distanciaBase,
  ritmo,
  modificadorSorte,
  atraso,
  acelerar,
}) =>
  Math.max(
    1,
    Number(distanciaBase || 0) +
      Number(ritmo || 0) +
      Number(modificadorSorte || 0) +
      Number(atraso || 0) -
      Number(acelerar || 0),
  );

// Filtro do pool válido (Seção 9). Cartas já 'comprada'/'descartada' saem do
// pool por já não estarem 'no_baralho' — isso já garante a anti-repetição
// dentro da sessão sem precisar de uma penalidade de peso separada (Seção
// 10 original): uma carta só volta a ser sorteável reembaralhando ou sendo
// manualmente devolvida ao baralho. Carta sem `intensidade` cadastrada não é
// filtrada por intensidade mínima (campo opcional no cadastro do projeto
// irmão).
export const filtrarPoolValido = (cartas, intensidadeMinima) =>
  cartas.filter(
    carta =>
      carta.estadoNoBaralho === 'no_baralho' &&
      carta.ativa !== false &&
      (carta.cooldownRestante ?? 0) <= 0 &&
      (!Number.isFinite(carta.intensidade) ||
        carta.intensidade >= intensidadeMinima),
  );

// Sorteio ponderado por roleta cumulativa (Seção 10), usando o campo `peso`
// já existente na carta como peso relativo (padrão 1 quando ausente/inválido).
export const sortearCartaPonderada = pool => {
  const cartasComPeso = pool.map(carta => ({
    carta,
    peso: Number.isFinite(carta.peso) && carta.peso > 0 ? carta.peso : 1,
  }));
  const pesoTotal = cartasComPeso.reduce((soma, c) => soma + c.peso, 0);
  let alvo = Math.random() * pesoTotal;
  for (const item of cartasComPeso) {
    alvo -= item.peso;
    if (alvo <= 0) return item.carta;
  }
  return cartasComPeso[cartasComPeso.length - 1].carta;
};

export const definirEstadoCarta = async (
  carta,
  novoEstado,
  campanhaAtiva,
  camposExtra = {},
) => {
  if (carta.estadoDocId) {
    await updateRmCardfluxEstado(carta.estadoDocId, {
      estadoNoBaralho: novoEstado,
      ...camposExtra,
    });
    return;
  }
  await addRmCardfluxEstado({
    campanhaId: campanhaAtiva.id,
    universoId: campanhaAtiva.universoId,
    mestreId: campanhaAtiva.mestreId,
    cartaId: carta.id,
    estadoNoBaralho: novoEstado,
    ...camposExtra,
  });
};

// Pós-sorteio (Seção 10/12): marca a carta como comprada e aplica o
// cooldown configurado nela (se houver) — só passa a valer se a carta
// voltar ao baralho antes de um reembaralhar (que zera cooldowns).
export const marcarCartaComprada = (carta, campanhaAtiva) =>
  definirEstadoCarta(carta, 'comprada', campanhaAtiva, {
    cooldownRestante:
      Number.isFinite(carta.cooldown) && carta.cooldown > 0
        ? carta.cooldown
        : 0,
  });

// "🗑️ Descartar": sai do pool até o próximo reembaralhar, sem desfazer a
// compra nem o cooldown já aplicado.
export const descartarCarta = (carta, campanhaAtiva) =>
  definirEstadoCarta(carta, 'descartada', campanhaAtiva);

// "↩️ Retornar ao Deck": desfaz a compra imediatamente ("não valeu"),
// devolvendo a carta ao pool sem cooldown.
export const retornarCartaAoDeck = (carta, campanhaAtiva) =>
  definirEstadoCarta(carta, 'no_baralho', campanhaAtiva, {
    cooldownRestante: 0,
  });

// Depois de cada sorteio, decrementa em 1 o cooldown de todas as outras
// cartas do baralho que ainda estejam bloqueadas (Seção 10).
export const decrementarCooldownsOutrasCartas = (cartas, cartaSorteadaId) => {
  const paraDecrementar = cartas.filter(
    carta =>
      carta.id !== cartaSorteadaId &&
      carta.estadoDocId &&
      (carta.cooldownRestante ?? 0) > 0,
  );
  return Promise.all(
    paraDecrementar.map(carta =>
      updateRmCardfluxEstado(carta.estadoDocId, {
        cooldownRestante: carta.cooldownRestante - 1,
      }),
    ),
  );
};

// "Limpar Cooldowns" (Seção 11): zera cooldowns sem afetar o estado/histórico.
export const limparCooldownsBaralho = cartas => {
  const paraLimpar = cartas.filter(
    carta => carta.estadoDocId && (carta.cooldownRestante ?? 0) > 0,
  );
  return Promise.all(
    paraLimpar.map(carta =>
      updateRmCardfluxEstado(carta.estadoDocId, { cooldownRestante: 0 }),
    ),
  );
};

// "Reembaralhar" (Seção 13): reset completo do progresso do baralho —
// devolve todas as cartas ao pool e zera cooldowns. Não mexe na
// configuração da sessão (distância, ritmo etc.), que é estado da UI.
export const reembaralharBaralho = (cartas, campanhaAtiva) =>
  Promise.all(
    cartas
      .filter(
        carta =>
          carta.estadoNoBaralho !== 'no_baralho' ||
          (carta.cooldownRestante ?? 0) > 0,
      )
      .map(carta =>
        definirEstadoCarta(carta, 'no_baralho', campanhaAtiva, {
          cooldownRestante: 0,
        }),
      ),
  );
