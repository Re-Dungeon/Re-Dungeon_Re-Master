import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
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
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar itens de "${path.join('/')}":`, error);
    throw error;
  }
};

const addFirestoreItem = async (collectionName, item) => {
  const path = collectionPath(collectionName);
  try {
    const docRef = await addDoc(collection(db, ...path), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...item };
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

export const getRmCenas = () => getFirestoreItems(RM_CENAS_COLLECTION);
export const addRmCena = cena => addFirestoreItem(RM_CENAS_COLLECTION, cena);
export const removeRmCena = id => removeFirestoreItem(RM_CENAS_COLLECTION, id);
export const updateRmCena = (id, updates) =>
  updateFirestoreItem(RM_CENAS_COLLECTION, id, updates);

// ── rmCenaConexoes (Firestore) ────────────────────────────────────────────────
const RM_CENA_CONEXOES_COLLECTION = 'rmCenaConexoes';

export const getRmCenaConexoes = () =>
  getFirestoreItems(RM_CENA_CONEXOES_COLLECTION);
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

export const getRmCampanhaNpcs = campanhaId =>
  getFirestoreItems(npcsSubcollectionPath(campanhaId));
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

export const getRmCampanhaJogadores = campanhaId =>
  getFirestoreItems(jogadoresSubcollectionPath(campanhaId));
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

export const getRmCampanhaCriaturas = campanhaId =>
  getFirestoreItems(criaturasSubcollectionPath(campanhaId));
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

export const getRmCampanhaLutaParticipantes = campanhaId =>
  getFirestoreItems(lutaParticipantesSubcollectionPath(campanhaId));
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

export const getRmMapas = () => getFirestoreItems(RM_MAPAS_COLLECTION);
export const addRmMapa = mapa => addFirestoreItem(RM_MAPAS_COLLECTION, mapa);
export const removeRmMapa = id => removeFirestoreItem(RM_MAPAS_COLLECTION, id);
export const updateRmMapa = (id, updates) =>
  updateFirestoreItem(RM_MAPAS_COLLECTION, id, updates);

// ── rmMissoes (Firestore) ─────────────────────────────────────────────────────
const RM_MISSOES_COLLECTION = 'rmMissoes';

export const getRmMissoes = () => getFirestoreItems(RM_MISSOES_COLLECTION);
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

export const getRmCardfluxEstados = () =>
  getFirestoreItems(RM_CARDFLUX_ESTADOS_COLLECTION);
export const addRmCardfluxEstado = estado =>
  addFirestoreItem(RM_CARDFLUX_ESTADOS_COLLECTION, estado);
export const updateRmCardfluxEstado = (id, updates) =>
  updateFirestoreItem(RM_CARDFLUX_ESTADOS_COLLECTION, id, updates);

// ── rmNotas (Firestore) ───────────────────────────────────────────────────────
const RM_NOTAS_COLLECTION = 'rmNotas';

export const getRmNotas = () => getFirestoreItems(RM_NOTAS_COLLECTION);
export const addRmNota = nota => addFirestoreItem(RM_NOTAS_COLLECTION, nota);
export const removeRmNota = id => removeFirestoreItem(RM_NOTAS_COLLECTION, id);
export const updateRmNota = (id, updates) =>
  updateFirestoreItem(RM_NOTAS_COLLECTION, id, updates);
