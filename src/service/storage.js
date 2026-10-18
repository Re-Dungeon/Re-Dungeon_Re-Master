import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  recuperarExploracaoGrid,
  sanitizarExploracaoParaPersistencia,
} from '../pages/CardFlux/exploracaoGrid';
import { db } from './firebase';

// ── Helpers genéricos de CRUD Firestore ─────────────────────────────────────
// Toda entidade abaixo segue este mesmo padrão de 4 operações; os blocos por
// entidade são apenas wrappers finos com o nome da coleção certa, para manter
// a API pública (`getRmCampanhas()`, `addRmCampanha()`, etc.). `collectionName`
// aceita uma string (coleção top-level) ou um array de segmentos de caminho
// (ex.: `[RM_CAMPANHAS_COLLECTION, campanhaId, 'npcs']` para uma subcoleção).

const collectionPath = collectionName =>
  Array.isArray(collectionName) ? collectionName : [collectionName];

const getFirestoreItems = async collectionName => {
  const path = collectionPath(collectionName);
  try {
    const snapshot = await getDocs(collection(db, ...path));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar itens de "${path.join('/')}":`, error);
    throw error;
  }
};

const addFirestoreItem = async (collectionName, item) => {
  const path = collectionPath(collectionName);
  try {
    const dadosPersistidos = item ? { ...item } : {};
    delete dadosPersistidos.id;

    const docRef = await addDoc(collection(db, ...path), {
      ...dadosPersistidos,
      createdAt: serverTimestamp(),
    });
    return { ...dadosPersistidos, id: docRef.id };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao adicionar item em "${path.join('/')}":`, error);
    throw error;
  }
};

const updateFirestoreItem = async (collectionName, id, updates) => {
  const path = collectionPath(collectionName);
  try {
    await updateDoc(doc(db, ...path, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao atualizar item "${id}" em "${path.join('/')}":`,
      error,
    );
    throw error;
  }
};

// Variante de `getFirestoreItems` filtrada por múltiplos campos (equality-only
// `where`), usada por toda coleção `rm*` cuja regra de segurança (ver
// `firestore.rules`) checa `resource.data.universoId`/`resource.data.mestreId`
// do documento: uma query de "list" só passa nas Firestore Rules se os
// próprios `where()` da query já garantirem, para qualquer documento que
// pudesse ser retornado, que a regra vale — o Firestore nunca filtra
// resultado por regra, ele nega o pedido inteiro se não conseguir provar isso
// só a partir da query. Por isso não basta filtrar por `campanhaId`: é
// preciso filtrar também por `universoId`/`mestreId`, os campos que a regra
// realmente lê. Equality-only em múltiplos campos só requer índice automático
// de campo único do Firestore (não composto), então não exige nenhuma entrada
// nova em `firestore.indexes.json`.
const getFirestoreItemsWhereAll = async (collectionName, filters) => {
  const path = collectionPath(collectionName);
  try {
    const snapshot = await getDocs(
      query(
        collection(db, ...path),
        ...filters.map(([field, value]) => where(field, '==', value)),
      ),
    );
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao buscar itens de "${path.join('/')}" (${filters
        .map(([field, value]) => `${field}="${value}"`)
        .join(', ')}):`,
      error,
    );
    throw error;
  }
};

const removeFirestoreItem = async (collectionName, id) => {
  const path = collectionPath(collectionName);
  try {
    await deleteDoc(doc(db, ...path, id));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao remover item "${id}" em "${path.join('/')}":`,
      error,
    );
    throw error;
  }
};

// ── Universo (Firestore) — gerida pelo Re-Dungeon, somente leitura aqui ────

const UNIVERSO_COLLECTION = 'Universo';

export const getUniversos = () => getFirestoreItems(UNIVERSO_COLLECTION);

// ── personagens (Firestore) — gerida pelo Re-Dungeon (ficha de personagem),
// somente leitura aqui: fonte de importação para os módulos de NPCs/
// Criaturas/Jogadores. Leitura liberada para qualquer autenticado
// independente do `tipo` (ver firestore.rules), mas cada tela só quer os
// personagens do tipo relevante — o filtro `where('tipo', ...)` também evita
// baixar documentos irrelevantes para a tela.
const PERSONAGENS_COLLECTION = 'personagens';

const getPersonagensPorTipo = async tipos => {
  try {
    const snapshot = await getDocs(
      query(collection(db, PERSONAGENS_COLLECTION), where('tipo', 'in', tipos)),
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao buscar itens de "${PERSONAGENS_COLLECTION}":`,
      error,
    );
    throw error;
  }
};

export const getPersonagens = () => getPersonagensPorTipo(['NPC', 'Criatura']);

// Documentos antigos sem o campo `tipo` não entram aqui (o filtro `where`
// só casa com o valor literal) — mesma limitação já aceita para NPC/Criatura.
export const getPersonagensJogaveis = () =>
  getPersonagensPorTipo(['Personagem Jogável']);

// Subcoleções da ficha de personagem (aptidoesAdquiridas, arts,
// historicoSorte — ver firestore.rules). Diferente do doc principal, a
// regra dessas subcoleções restringe leitura ao dono do personagem
// (uid == request.auth.uid), mesmo para NPC/Criatura — então isso falha com
// permission-denied para a ficha de um NPC criado por outro usuário no
// Re-Dungeon; quem chama deve tratar esse erro (não é um bug, é o dono do
// personagem que não é o mestre logado).
export const getPersonagemSubcolecao = (personagemId, subcolecao) =>
  getFirestoreItems([PERSONAGENS_COLLECTION, personagemId, subcolecao]);

// ── Coleções de referência do Re-Dungeon (aptidoes, racas, classes,
// veiasAstrais) — leitura liberada para qualquer autenticado
// (allow read: if isAuth()). A ficha de personagem guarda só o id dessas
// entidades (aptidão adquirida, raça, classe, nó de veia astral); usado para
// resolver o nome a partir do id em vez de mostrar o id cru na tela de NPCs.
const getReferenciaPorId = async (collectionName, id) => {
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar "${collectionName}/${id}":`, error);
    throw error;
  }
};

export const getAptidao = id => getReferenciaPorId('aptidoes', id);
export const getRaca = id => getReferenciaPorId('racas', id);
export const getClasse = id => getReferenciaPorId('classes', id);
export const getVeiaAstral = id => getReferenciaPorId('veiasAstrais', id);
export const getOrigem = id => getReferenciaPorId('origens', id);
export const getCorpoEspecial = id => getReferenciaPorId('corposEspeciais', id);
export const getReinoCultivo = id => getReferenciaPorId('reinosCultivo', id);

// ── condicoes (Firestore) — gerida pelo Re-Dungeon, somente leitura aqui.
// Usada pela Luta para marcar status effects (atordoado, envenenado, etc.)
// nos participantes. Assim como aptidoes/regras, uma condição pode pertencer
// a mais de um Universo (campo `universos`, lista de ids) — docs antigos
// ainda podem ter só o campo singular `universo`, então busca os dois e
// mescla por id (ver `canWriteMultiUniversoData` em firestore.rules, que já
// documenta essa mesma dualidade do lado da escrita).
const CONDICOES_COLLECTION = 'condicoes';

export const getCondicoes = async universoId => {
  try {
    const [porLista, porCampoSingular] = await Promise.all([
      getDocs(
        query(
          collection(db, CONDICOES_COLLECTION),
          where('universos', 'array-contains', universoId),
        ),
      ),
      getDocs(
        query(
          collection(db, CONDICOES_COLLECTION),
          where('universo', '==', universoId),
        ),
      ),
    ]);
    const porId = new Map();
    [...porLista.docs, ...porCampoSingular.docs].forEach(d =>
      porId.set(d.id, { id: d.id, ...d.data() }),
    );
    return [...porId.values()];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar itens de "${CONDICOES_COLLECTION}":`, error);
    throw error;
  }
};

// ── User Permissions (Firestore) — compartilhado com o Re-Dungeon ──────────

const USER_PERMISSIONS_COLLECTION = 'userPermissions';

export const getUserPermissions = async uid => {
  const snap = await getDoc(doc(db, USER_PERMISSIONS_COLLECTION, uid));
  if (!snap.exists()) return { isAdmin: false, universos: [] };
  const data = snap.data();
  return {
    isAdmin: data.isAdmin ?? false,
    universos: Array.isArray(data.universos) ? data.universos : [],
  };
};

// Nome de exibição de um usuário (campo `nome` do doc `userPermissions/{uid}`,
// preenchido pelo Re-Dungeon) — usado para mostrar quem criou uma ficha de
// NPC/Criatura/Jogador na modal de visualização. `null` quando o doc não
// existe ou não tem `nome` cadastrado; quem chama trata o fallback (exibir o
// uid cru).
export const getUsuarioNome = async uid => {
  const snap = await getDoc(doc(db, USER_PERMISSIONS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const nome = snap.data().Nome;
  return typeof nome === 'string' && nome.trim() ? nome.trim() : null;
};

// ── cardflux (Firestore) — gerida por um projeto irmão (banco de cartas de
// evento do CardFlux), leitura liberada para qualquer autenticado. O
// Re:Master nunca cria/edita/remove baralhos ou cartas aqui — só lê e
// sorteia. Baralho não é uma entidade própria: é o valor do campo `deck` das
// cartas, então "listar baralhos" é agrupar as cartas por `deck` no cliente.
// Cartas cadastradas no projeto irmão para o mesmo `universo` aparecem aqui
// automaticamente, sem nenhuma sincronização adicional.
const CARDFLUX_COLLECTION = 'cardflux';

export const getCardfluxCartas = async universoId => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, CARDFLUX_COLLECTION),
        where('universo', '==', universoId),
      ),
    );
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar itens de "${CARDFLUX_COLLECTION}":`, error);
    throw error;
  }
};

// ═════════════════════════════════════════════════════════════════════════
// Re:Master — coleções próprias, prefixadas com `rm` para nunca colidir com
// as coleções do Re-Dungeon acima (mesmo projeto Firebase, mesmo Firestore).
// ═════════════════════════════════════════════════════════════════════════

// ── rmCampanhas (Firestore) ──────────────────────────────────────────────────
const RM_CAMPANHAS_COLLECTION = 'rmCampanhas';

export const getRmCampanhas = () => getFirestoreItems(RM_CAMPANHAS_COLLECTION);
export const addRmCampanha = campanha =>
  addFirestoreItem(RM_CAMPANHAS_COLLECTION, campanha);
export const removeRmCampanha = id =>
  removeFirestoreItem(RM_CAMPANHAS_COLLECTION, id);
export const updateRmCampanha = (id, updates) =>
  updateFirestoreItem(RM_CAMPANHAS_COLLECTION, id, updates);

// ── rmCenas (Firestore) ───────────────────────────────────────────────────────
const RM_CENAS_COLLECTION = 'rmCenas';

export const getRmCenas = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_CENAS_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCena = cena => addFirestoreItem(RM_CENAS_COLLECTION, cena);
export const removeRmCena = id => removeFirestoreItem(RM_CENAS_COLLECTION, id);
export const updateRmCena = (id, updates) =>
  updateFirestoreItem(RM_CENAS_COLLECTION, id, updates);

// ── rmCenaConexoes (Firestore) ────────────────────────────────────────────────
const RM_CENA_CONEXOES_COLLECTION = 'rmCenaConexoes';

export const getRmCenaConexoes = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_CENA_CONEXOES_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCenaConexao = conexao =>
  addFirestoreItem(RM_CENA_CONEXOES_COLLECTION, conexao);
export const removeRmCenaConexao = id =>
  removeFirestoreItem(RM_CENA_CONEXOES_COLLECTION, id);

// ── rmCampanhas/{campanhaId}/npcs (Firestore) ───────────────────────────────
// Clones de NPC específicos de uma Campanha, criados a partir de um
// personagem tipo NPC do Universo (ver `getPersonagens`). Subcoleção do
// documento da Campanha — não uma coleção `rm` top-level como as demais —
// porque o clone só faz sentido dentro do escopo de uma Campanha específica.
const npcsSubcollectionPath = campanhaId => [
  RM_CAMPANHAS_COLLECTION,
  campanhaId,
  'npcs',
];

export const getRmCampanhaNpcs = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(npcsSubcollectionPath(campanhaId), [
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCampanhaNpc = (campanhaId, npc) =>
  addFirestoreItem(npcsSubcollectionPath(campanhaId), npc);
export const removeRmCampanhaNpc = (campanhaId, id) =>
  removeFirestoreItem(npcsSubcollectionPath(campanhaId), id);
export const updateRmCampanhaNpc = (campanhaId, id, updates) =>
  updateFirestoreItem(npcsSubcollectionPath(campanhaId), id, updates);

// ── rmCampanhas/{campanhaId}/jogadores (Firestore) ──────────────────────────
// Clones de Personagem Jogável específicos de uma Campanha, criados a partir
// de um personagem tipo Personagem Jogável do Universo (ver
// `getPersonagensJogaveis`). Mesmo padrão de `npcs` acima.
const jogadoresSubcollectionPath = campanhaId => [
  RM_CAMPANHAS_COLLECTION,
  campanhaId,
  'jogadores',
];

export const getRmCampanhaJogadores = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(jogadoresSubcollectionPath(campanhaId), [
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCampanhaJogador = (campanhaId, jogador) =>
  addFirestoreItem(jogadoresSubcollectionPath(campanhaId), jogador);
export const removeRmCampanhaJogador = (campanhaId, id) =>
  removeFirestoreItem(jogadoresSubcollectionPath(campanhaId), id);
export const updateRmCampanhaJogador = (campanhaId, id, updates) =>
  updateFirestoreItem(jogadoresSubcollectionPath(campanhaId), id, updates);

// ── rmCampanhas/{campanhaId}/criaturas (Firestore) ──────────────────────────
// Clones de Criatura específicos de uma Campanha, criados a partir de um
// personagem tipo Criatura do Universo (ver `getPersonagens`). Mesmo padrão
// de `npcs`/`jogadores` acima.
const criaturasSubcollectionPath = campanhaId => [
  RM_CAMPANHAS_COLLECTION,
  campanhaId,
  'criaturas',
];

export const getRmCampanhaCriaturas = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(criaturasSubcollectionPath(campanhaId), [
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCampanhaCriatura = (campanhaId, criatura) =>
  addFirestoreItem(criaturasSubcollectionPath(campanhaId), criatura);
export const removeRmCampanhaCriatura = (campanhaId, id) =>
  removeFirestoreItem(criaturasSubcollectionPath(campanhaId), id);
export const updateRmCampanhaCriatura = (campanhaId, id, updates) =>
  updateFirestoreItem(criaturasSubcollectionPath(campanhaId), id, updates);

// ── rmCampanhas/{campanhaId}/lutaParticipantes (Firestore) ─────────────────
// Participantes (NPCs/Criaturas) adicionados à tela de Luta de uma Campanha.
// Cada doc é uma cópia independente do estado de combate (vida/fadiga/mana
// atual e máxima) — permite ter várias cópias do mesmo personagem de origem
// na mesma luta (ex.: 5 "Rato Gigante"). Mesmo padrão de subcoleção de
// `npcs`/`jogadores`/`criaturas` acima.
const lutaParticipantesSubcollectionPath = campanhaId => [
  RM_CAMPANHAS_COLLECTION,
  campanhaId,
  'lutaParticipantes',
];

export const getRmCampanhaLutaParticipantes = (
  campanhaId,
  universoId,
  mestreId,
) =>
  getFirestoreItemsWhereAll(lutaParticipantesSubcollectionPath(campanhaId), [
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCampanhaLutaParticipante = (campanhaId, participante) =>
  addFirestoreItem(
    lutaParticipantesSubcollectionPath(campanhaId),
    participante,
  );
export const removeRmCampanhaLutaParticipante = (campanhaId, id) =>
  removeFirestoreItem(lutaParticipantesSubcollectionPath(campanhaId), id);
export const updateRmCampanhaLutaParticipante = (campanhaId, id, updates) =>
  updateFirestoreItem(
    lutaParticipantesSubcollectionPath(campanhaId),
    id,
    updates,
  );

// ── rmMapas (Firestore) ───────────────────────────────────────────────────────
const RM_MAPAS_COLLECTION = 'rmMapas';

export const getRmMapasPorCampanha = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_MAPAS_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmMapa = mapa => addFirestoreItem(RM_MAPAS_COLLECTION, mapa);
export const removeRmMapa = id => removeFirestoreItem(RM_MAPAS_COLLECTION, id);
export const updateRmMapa = (id, updates) =>
  updateFirestoreItem(RM_MAPAS_COLLECTION, id, updates);

// ── rmMapasPastas (Firestore) ─────────────────────────────────────────────────
const RM_MAPAS_PASTAS_COLLECTION = 'rmMapasPastas';

export const getRmMapasPastasPorCampanha = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_MAPAS_PASTAS_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmMapaPasta = pasta =>
  addFirestoreItem(RM_MAPAS_PASTAS_COLLECTION, pasta);
export const removeRmMapaPasta = id =>
  removeFirestoreItem(RM_MAPAS_PASTAS_COLLECTION, id);
export const updateRmMapaPasta = (id, updates) =>
  updateFirestoreItem(RM_MAPAS_PASTAS_COLLECTION, id, updates);

// ── rmMissoes (Firestore) ─────────────────────────────────────────────────────
const RM_MISSOES_COLLECTION = 'rmMissoes';

export const getRmMissoesPorCampanha = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_MISSOES_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmMissao = missao =>
  addFirestoreItem(RM_MISSOES_COLLECTION, missao);
export const removeRmMissao = id =>
  removeFirestoreItem(RM_MISSOES_COLLECTION, id);
export const updateRmMissao = (id, updates) =>
  updateFirestoreItem(RM_MISSOES_COLLECTION, id, updates);

// ── rmCardfluxEstados (Firestore) ──────────────────────────────────────────────
// Estado de sorteio (no baralho / comprada / descartada) de uma carta do
// `cardflux` dentro de uma Campanha específica — a única coisa que o
// Re:Master grava sobre CardFlux, já que a carta em si pertence ao projeto
// irmão. Um doc por par (campanhaId, cartaId); a ausência de doc para uma
// carta equivale a 'no_baralho'.
const RM_CARDFLUX_ESTADOS_COLLECTION = 'rmCardfluxEstados';

export const getRmCardfluxEstadosPorCampanha = (
  campanhaId,
  universoId,
  mestreId,
) =>
  getFirestoreItemsWhereAll(RM_CARDFLUX_ESTADOS_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmCardfluxEstado = estado =>
  addFirestoreItem(RM_CARDFLUX_ESTADOS_COLLECTION, estado);
export const updateRmCardfluxEstado = (id, updates) =>
  updateFirestoreItem(RM_CARDFLUX_ESTADOS_COLLECTION, id, updates);

// ── rmCardfluxExploracoes (Firestore) ───────────────────────────────────────
// Instâncias independentes de exploração por grid, com dados do mestre,
// campanha, universo, configuração e quadrantes. Esta coleção é isolada do
// sorteio tradicional de `cardflux`/`rmCardfluxEstados` e nunca atualiza as
// cartas-base do projeto irmão.
const RM_CARDFLUX_EXPLORACOES_COLLECTION = 'rmCardfluxExploracoes';

export const getRmCardfluxExploracoes = async (universoId, mestreId) => {
  const itens = await getFirestoreItemsWhereAll(
    RM_CARDFLUX_EXPLORACOES_COLLECTION,
    [
      ['universoId', universoId],
      ['mestreId', mestreId],
    ],
  );
  return itens.map(item => recuperarExploracaoGrid(item));
};

export const getRmCardfluxExploracoesPorCampanha = async (
  campanhaId,
  universoId,
  mestreId,
) => {
  const itens = await getFirestoreItemsWhereAll(
    RM_CARDFLUX_EXPLORACOES_COLLECTION,
    [
      ['campanhaId', campanhaId],
      ['universoId', universoId],
      ['mestreId', mestreId],
    ],
  );
  return itens.map(item => recuperarExploracaoGrid(item));
};

export const addRmCardfluxExploracao = exploracao => {
  const payload = sanitizarExploracaoParaPersistencia(exploracao, {
    exigirCamposObrigatorios: true,
  });
  return addFirestoreItem(RM_CARDFLUX_EXPLORACOES_COLLECTION, payload);
};
export const removeRmCardfluxExploracao = id =>
  removeFirestoreItem(RM_CARDFLUX_EXPLORACOES_COLLECTION, id);
export const updateRmCardfluxExploracao = (id, updates) => {
  const payload = sanitizarExploracaoParaPersistencia(updates, {
    exigirCamposObrigatorios: false,
  });
  return updateFirestoreItem(RM_CARDFLUX_EXPLORACOES_COLLECTION, id, payload);
};

// ── rmNotas (Firestore) ───────────────────────────────────────────────────────
const RM_NOTAS_COLLECTION = 'rmNotas';

export const getRmNotasPorCampanha = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_NOTAS_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmNota = nota => addFirestoreItem(RM_NOTAS_COLLECTION, nota);
export const removeRmNota = id => removeFirestoreItem(RM_NOTAS_COLLECTION, id);
export const updateRmNota = (id, updates) =>
  updateFirestoreItem(RM_NOTAS_COLLECTION, id, updates);

// ── rmSessaoLogs (Firestore) ──────────────────────────────────────────────
// Registro cronológico automático de eventos da sessão (cena marcada como
// atual, carta sorteada no CardFlux, participante adicionado à Luta) —
// complementar às `rmNotas` manuais, escrito pela própria tela que dispara o
// evento em vez de o mestre precisar anotar durante o jogo. Append-only por
// design (sem update/remove expostos aqui nem liberados em
// firestore.rules): é um histórico do que aconteceu, não um dado editável.
const RM_SESSAO_LOGS_COLLECTION = 'rmSessaoLogs';

export const getRmSessaoLogsPorCampanha = (campanhaId, universoId, mestreId) =>
  getFirestoreItemsWhereAll(RM_SESSAO_LOGS_COLLECTION, [
    ['campanhaId', campanhaId],
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
export const addRmSessaoLog = log =>
  addFirestoreItem(RM_SESSAO_LOGS_COLLECTION, log);

// ── Chat da campanha — rmCampanhas/{id}/chatMensagens ─────────────────────
// Sala compartilhada com o site dos jogadores (Ficha-RPG---Re-Dungeon-, que
// tem as mesmas funções). Diferente das outras subcoleções de rmCampanhas, os
// docs NÃO denormalizam universoId/mestreId: a regra lê `mestreId` do doc pai
// (e o personagem do jogador) via get() — ver o bloco do chat em
// firestore.rules. O mestre não precisa de doc em `chatMembros` (só jogadores).
export const CHAT_LIMITE_MENSAGENS = 100;

// Primeiro listener em tempo real do projeto: devolve o `unsubscribe` do
// `onSnapshot` — chame-o no cleanup do `useEffect`. Mensagens em ordem
// cronológica (mais antiga primeiro), limitadas às últimas 100.
export const subscribeChatMensagens = (campanhaId, onChange, onError) => {
  const mensagensQuery = query(
    collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens'),
    orderBy('createdAt', 'desc'),
    limit(CHAT_LIMITE_MENSAGENS),
  );
  return onSnapshot(
    mensagensQuery,
    snapshot => {
      const mensagens = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data({ serverTimestamps: 'estimate' }),
      }));
      onChange(mensagens.reverse());
    },
    onError,
  );
};

export const addChatMensagem = (campanhaId, mensagem) =>
  addDoc(collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens'), {
    ...mensagem,
    createdAt: serverTimestamp(),
  });

export const removeChatMensagem = (campanhaId, mensagemId) =>
  deleteDoc(
    doc(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens', mensagemId),
  );

// Ponteiro chatMembros/{uid} = {uid, personagemId} — só jogadores gravam (o
// site dos jogadores, ao abrir o chat). Exportado aqui porque o hook
// `useChatCampanha` é compartilhado; o mestre nunca chama (acesso via mestreId).
export const setChatMembro = (campanhaId, uid, personagemId) =>
  setDoc(doc(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMembros', uid), {
    uid,
    personagemId,
    updatedAt: serverTimestamp(),
  });

// ── Rolagens secretas — rmCampanhas/{id}/chatSecretas/{uid}/rolagens ──────
// Uma pasta por usuário (só ele e o mestre leem): consultas de lista numa
// coleção única seriam recusadas inteiras pelas regras para quem não pode ver
// todas as secretas, e uma coleção por usuário dispensa índice composto.
export const CHAT_LIMITE_SECRETAS = 50;

const rolagensSecretasRef = (campanhaId, donoUid) =>
  collection(
    db,
    RM_CAMPANHAS_COLLECTION,
    campanhaId,
    'chatSecretas',
    donoUid,
    'rolagens',
  );

// Mensagens chegam marcadas com `secreta: true` e `donoUid` (necessário para
// apagar). Ordem: mais recente primeiro (quem consome mescla com
// `mesclarMensagens` de common/utils/chat.js).
export const subscribeChatSecretasDoUsuario = (
  campanhaId,
  donoUid,
  onChange,
  onError,
) =>
  onSnapshot(
    query(
      rolagensSecretasRef(campanhaId, donoUid),
      orderBy('createdAt', 'desc'),
      limit(CHAT_LIMITE_SECRETAS),
    ),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data({ serverTimestamps: 'estimate' }),
          secreta: true,
          donoUid,
        })),
      ),
    onError,
  );

// Mestre: ouve as próprias secretas e as de cada jogador em `chatMembros`
// (acompanha membros novos em tempo real). Devolve um único `unsubscribe`.
export const subscribeChatSecretasDoMestre = (
  campanhaId,
  mestreUid,
  onChange,
  onError,
) => {
  const porDono = new Map();
  const emitir = () =>
    onChange([...porDono.values()].flatMap(entrada => entrada.mensagens));
  const ouvir = donoUid => {
    if (porDono.has(donoUid)) return;
    const entrada = { mensagens: [], unsubscribe: () => {} };
    porDono.set(donoUid, entrada);
    entrada.unsubscribe = subscribeChatSecretasDoUsuario(
      campanhaId,
      donoUid,
      mensagens => {
        entrada.mensagens = mensagens;
        emitir();
      },
      onError,
    );
  };

  ouvir(mestreUid);
  const pararMembros = onSnapshot(
    collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMembros'),
    snapshot => snapshot.docs.forEach(docSnapshot => ouvir(docSnapshot.id)),
    onError,
  );

  return () => {
    pararMembros();
    porDono.forEach(entrada => entrada.unsubscribe());
    porDono.clear();
  };
};

export const addChatRolagemSecreta = (campanhaId, donoUid, mensagem) =>
  addDoc(rolagensSecretasRef(campanhaId, donoUid), {
    ...mensagem,
    createdAt: serverTimestamp(),
  });

export const removeChatRolagemSecreta = (campanhaId, donoUid, rolagemId) =>
  deleteDoc(
    doc(
      db,
      RM_CAMPANHAS_COLLECTION,
      campanhaId,
      'chatSecretas',
      donoUid,
      'rolagens',
      rolagemId,
    ),
  );

// ── Macros Lua — rmCampanhas/{id}/macros ───────────────────────────────────
// Só o mestre da campanha cria/edita/apaga (as regras garantem); membros leem
// as que não são `somenteMestre`. O jogador PRECISA filtrar por
// `somenteMestre == false` na consulta — sem o filtro a regra recusa a lista
// inteira. Sem `orderBy` (evita índice composto): ordene com `ordenarMacros`
// (common/utils/macros.js). Executar uma macro nunca grava aqui.
const macrosRef = campanhaId =>
  collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'macros');

export const getChatMacros = async (
  campanhaId,
  { incluirSomenteMestre = false } = {},
) => {
  const filtros = incluirSomenteMestre
    ? []
    : [where('somenteMestre', '==', false)];
  const snapshot = await getDocs(query(macrosRef(campanhaId), ...filtros));
  return snapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
};

export const addChatMacro = async (campanhaId, macro) => {
  const docRef = await addDoc(macrosRef(campanhaId), {
    ...macro,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateChatMacro = (campanhaId, macroId, patch) =>
  updateDoc(doc(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'macros', macroId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });

export const removeChatMacro = (campanhaId, macroId) =>
  deleteDoc(doc(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'macros', macroId));
