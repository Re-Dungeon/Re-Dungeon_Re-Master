import { addRmSessaoLog } from 'service/storage';

// Tipos de evento gravados automaticamente em rmSessaoLogs — cada tela que
// dispara um chama `registrarEventoSessao` com um destes.
export const TIPO_EVENTO_SESSAO = {
  CENA_ATUAL: 'cena_atual',
  CARTA_SORTEADA: 'carta_sorteada',
  PARTICIPANTE_LUTA: 'participante_luta',
};

export const ICONE_EVENTO_SESSAO = {
  [TIPO_EVENTO_SESSAO.CENA_ATUAL]: '🎬',
  [TIPO_EVENTO_SESSAO.CARTA_SORTEADA]: '🃏',
  [TIPO_EVENTO_SESSAO.PARTICIPANTE_LUTA]: '⚔️',
};

// Escreve um evento no histórico automático da sessão em modo best-effort —
// uma falha aqui (regra de segurança, rede) não deve interromper nem avisar
// sobre a ação principal que disparou o log (marcar cena atual, sortear
// carta, adicionar participante à Luta): o log é um registro complementar,
// não a ação em si. Por isso não recebe nem repassa erro ao chamador.
export const registrarEventoSessao = async (
  campanha,
  tipo,
  mensagem,
  extra = {},
) => {
  try {
    await addRmSessaoLog({
      campanhaId: campanha.id,
      universoId: campanha.universoId,
      mestreId: campanha.mestreId,
      tipo,
      mensagem,
      ...extra,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao registrar evento de sessão "${tipo}":`, error);
  }
};

// Detecta um Timestamp do Firestore (instância real, com `toDate()`, ou já
// desserializado como `{ seconds, nanoseconds }`).
const ehTimestamp = valor =>
  valor !== null &&
  typeof valor === 'object' &&
  (typeof valor.toDate === 'function' ||
    (typeof valor.seconds === 'number' &&
      typeof valor.nanoseconds === 'number'));

const paraDate = valor =>
  typeof valor.toDate === 'function'
    ? valor.toDate()
    : new Date(valor.seconds * 1000 + valor.nanoseconds / 1e6);

// Formata só a hora ("HH:MM") — o log é consultado durante ou logo após a
// própria sessão, então a data completa seria ruído; `null` quando o
// `createdAt` ainda não resolveu (raríssimo: só entre o `addDoc` e o
// primeiro `getDocs` que o releia) ou não é um Timestamp reconhecível.
export const formatarHoraEvento = valor => {
  if (!ehTimestamp(valor)) return null;
  const data = paraDate(valor);
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${hora}:${minuto}`;
};

// `getRmSessaoLogsPorCampanha` filtra só por `campanhaId` (sem `orderBy`,
// para não exigir um índice composto extra no Firestore) — a ordenação por
// mais recente primeiro é feita aqui, no cliente, sobre a lista já
// carregada. Logs sem `createdAt` resolvido ainda (ver `formatarHoraEvento`)
// vão para o fim.
export const ordenarLogsPorDataDesc = logs =>
  [...logs].sort((a, b) => {
    const dataA = ehTimestamp(a.createdAt)
      ? paraDate(a.createdAt).getTime()
      : 0;
    const dataB = ehTimestamp(b.createdAt)
      ? paraDate(b.createdAt).getTime()
      : 0;
    return dataB - dataA;
  });
