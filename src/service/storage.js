import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Helpers genéricos de CRUD Firestore ─────────────────────────────────────
// Toda entidade abaixo segue este mesmo padrão de 4 operações; os blocos por
// entidade são apenas wrappers finos com o nome da coleção certa, para manter
// a API pública (`getRmCampanhas()`, `addRmCampanha()`, etc.).

const getFirestoreItems = async collectionName => {
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar itens de "${collectionName}":`, error);
    throw error;
  }
};

const addFirestoreItem = async (collectionName, item) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...item };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao adicionar item em "${collectionName}":`, error);
    throw error;
  }
};

const updateFirestoreItem = async (collectionName, id, updates) => {
  try {
    await updateDoc(doc(db, collectionName, id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao atualizar item "${id}" em "${collectionName}":`,
      error,
    );
    throw error;
  }
};

const removeFirestoreItem = async (collectionName, id) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `Erro ao remover item "${id}" em "${collectionName}":`,
      error,
    );
    throw error;
  }
};

// ── Universo (Firestore) — gerida pelo Re-Dungeon, somente leitura aqui ────

const UNIVERSO_COLLECTION = 'Universo';

export const getUniversos = () => getFirestoreItems(UNIVERSO_COLLECTION);

// ── personagens (Firestore) — gerida pelo Re-Dungeon (ficha de personagem),
// somente leitura aqui: fonte de importação para os módulos de NPCs/Criaturas.
const PERSONAGENS_COLLECTION = 'personagens';

export const getPersonagens = () => getFirestoreItems(PERSONAGENS_COLLECTION);

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

// ── rmNpcs (Firestore) ────────────────────────────────────────────────────────
const RM_NPCS_COLLECTION = 'rmNpcs';

export const getRmNpcs = () => getFirestoreItems(RM_NPCS_COLLECTION);
export const addRmNpc = npc => addFirestoreItem(RM_NPCS_COLLECTION, npc);
export const removeRmNpc = id => removeFirestoreItem(RM_NPCS_COLLECTION, id);
export const updateRmNpc = (id, updates) =>
  updateFirestoreItem(RM_NPCS_COLLECTION, id, updates);

// ── rmCriaturas (Firestore) ───────────────────────────────────────────────────
const RM_CRIATURAS_COLLECTION = 'rmCriaturas';

export const getRmCriaturas = () => getFirestoreItems(RM_CRIATURAS_COLLECTION);
export const addRmCriatura = criatura =>
  addFirestoreItem(RM_CRIATURAS_COLLECTION, criatura);
export const removeRmCriatura = id =>
  removeFirestoreItem(RM_CRIATURAS_COLLECTION, id);
export const updateRmCriatura = (id, updates) =>
  updateFirestoreItem(RM_CRIATURAS_COLLECTION, id, updates);

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
export const addRmMissao = missao => addFirestoreItem(RM_MISSOES_COLLECTION, missao);
export const removeRmMissao = id => removeFirestoreItem(RM_MISSOES_COLLECTION, id);
export const updateRmMissao = (id, updates) =>
  updateFirestoreItem(RM_MISSOES_COLLECTION, id, updates);

// ── rmCardfluxBaralhos (Firestore) ────────────────────────────────────────────
const RM_CARDFLUX_BARALHOS_COLLECTION = 'rmCardfluxBaralhos';

export const getRmCardfluxBaralhos = () =>
  getFirestoreItems(RM_CARDFLUX_BARALHOS_COLLECTION);
export const addRmCardfluxBaralho = baralho =>
  addFirestoreItem(RM_CARDFLUX_BARALHOS_COLLECTION, baralho);
export const removeRmCardfluxBaralho = id =>
  removeFirestoreItem(RM_CARDFLUX_BARALHOS_COLLECTION, id);
export const updateRmCardfluxBaralho = (id, updates) =>
  updateFirestoreItem(RM_CARDFLUX_BARALHOS_COLLECTION, id, updates);

// ── rmCardfluxCartas (Firestore) ──────────────────────────────────────────────
const RM_CARDFLUX_CARTAS_COLLECTION = 'rmCardfluxCartas';

export const getRmCardfluxCartas = () =>
  getFirestoreItems(RM_CARDFLUX_CARTAS_COLLECTION);
export const addRmCardfluxCarta = carta =>
  addFirestoreItem(RM_CARDFLUX_CARTAS_COLLECTION, carta);
export const removeRmCardfluxCarta = id =>
  removeFirestoreItem(RM_CARDFLUX_CARTAS_COLLECTION, id);
export const updateRmCardfluxCarta = (id, updates) =>
  updateFirestoreItem(RM_CARDFLUX_CARTAS_COLLECTION, id, updates);

// ── rmNotas (Firestore) ───────────────────────────────────────────────────────
const RM_NOTAS_COLLECTION = 'rmNotas';

export const getRmNotas = () => getFirestoreItems(RM_NOTAS_COLLECTION);
export const addRmNota = nota => addFirestoreItem(RM_NOTAS_COLLECTION, nota);
export const removeRmNota = id => removeFirestoreItem(RM_NOTAS_COLLECTION, id);
export const updateRmNota = (id, updates) =>
  updateFirestoreItem(RM_NOTAS_COLLECTION, id, updates);
