import { addRmCardfluxEstado, updateRmCardfluxEstado } from 'service/storage';

export const ESTADO_CARTA_OPCOES = [
  { value: 'no_baralho', label: 'No Baralho' },
  { value: 'comprada', label: 'Comprada' },
  { value: 'descartada', label: 'Descartada' },
];

// As cartas em si vêm do `cardflux` (projeto irmão) e não sabem o que é uma
// Campanha do Re:Master — o estado de sorteio de cada carta dentro de uma
// Campanha específica mora em `rmCardfluxEstados`, indexado por `cartaId`.
// Junta as duas fontes; carta sem doc de estado ainda está 'no_baralho'.
export const mesclarEstadoCartas = (cartas, estadosDaCampanha) => {
  const estadoPorCartaId = new Map(estadosDaCampanha.map(e => [e.cartaId, e]));
  return cartas.map(carta => {
    const estado = estadoPorCartaId.get(carta.id);
    return {
      ...carta,
      estadoNoBaralho: estado?.estadoNoBaralho ?? 'no_baralho',
      estadoDocId: estado?.id ?? null,
    };
  });
};

export const sortearCarta = cartasDisponiveis =>
  cartasDisponiveis[Math.floor(Math.random() * cartasDisponiveis.length)];

export const definirEstadoCarta = async (carta, novoEstado, campanhaAtiva) => {
  if (carta.estadoDocId) {
    await updateRmCardfluxEstado(carta.estadoDocId, {
      estadoNoBaralho: novoEstado,
    });
    return;
  }
  await addRmCardfluxEstado({
    campanhaId: campanhaAtiva.id,
    universoId: campanhaAtiva.universoId,
    mestreId: campanhaAtiva.mestreId,
    cartaId: carta.id,
    estadoNoBaralho: novoEstado,
  });
};
