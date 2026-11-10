import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  deleteField,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import {
  recuperarExploracaoGrid,
  sanitizarExploracaoParaPersistencia,
} from '../pages/CardFlux/exploracaoGrid';
import { normalizeEntityTypeName } from '../pages/Notas/notaUtils';
import { extrairVideoYoutube } from 'common/utils/audioMesa';
import {
  CHAT_JANELA_MENSAGENS,
  CHAT_PAGINA_ANTERIORES,
} from 'common/utils/chat';
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

    const payloadParaPersistir = {
      ...dadosPersistidos,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, ...path), payloadParaPersistir);
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

// Cache curto em memória das listas de personagens (chave `tipos|universo`,
// validade de 3 min): NPCs, Criaturas, Jogadores e a mesa (Chat/Grid) leem as
// mesmas listas ao navegar entre telas. Guarda a promise (aberturas
// simultâneas dividem a leitura), descarta a entrada se falhar e devolve uma
// cópia. As escritas de clones (NPC/Criatura/Jogador da campanha) e o
// "Recarregar fontes" da mesa limpam o cache (`limparCachePersonagens`).
const PERSONAGENS_CACHE_TTL_MS = 3 * 60 * 1000;
const personagensCache = new Map();

export const limparCachePersonagens = () => personagensCache.clear();

// Escritas de clones da campanha: limpa o cache ao terminar (mesmo se falhar).
const invalidandoPersonagens = async escrita => {
  try {
    return await escrita();
  } finally {
    limparCachePersonagens();
  }
};

const buscarPersonagensPorTipo = async (tipos, universoId) => {
  try {
    const filtros = [where('tipo', 'in', tipos)];
    // `universo` é o id do Universo gravado na ficha (mesmo valor de
    // `campanha.universoId`). Igualdade + `in` em campos diferentes usa o
    // merge de índices simples do Firestore — não pede índice composto.
    if (universoId) filtros.push(where('universo', '==', universoId));
    const snapshot = await getDocs(
      query(collection(db, PERSONAGENS_COLLECTION), ...filtros),
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

const getPersonagensPorTipo = async (
  tipos,
  universoId,
  { forcar = false } = {},
) => {
  const chave = `${tipos.join(',')}|${universoId ?? ''}`;
  const agora = Date.now();
  if (forcar) personagensCache.delete(chave);
  const emCache = personagensCache.get(chave);
  if (emCache && emCache.expiraEm > agora) {
    return (await emCache.promise).map(personagem => ({ ...personagem }));
  }
  const promise = buscarPersonagensPorTipo(tipos, universoId);
  const entrada = { promise, expiraEm: agora + PERSONAGENS_CACHE_TTL_MS };
  personagensCache.set(chave, entrada);
  try {
    return (await promise).map(personagem => ({ ...personagem }));
  } catch (error) {
    if (personagensCache.get(chave) === entrada) personagensCache.delete(chave);
    throw error;
  }
};

// Sem `universoId` lê todos os universos (legado/testes); as telas passam o
// `universoId` da campanha ativa para não baixar personagens de outros mundos.
// `{ forcar: true }` ignora o cache ("Recarregar fontes").
export const getPersonagens = (universoId, opcoes) =>
  getPersonagensPorTipo(['NPC', 'Criatura'], universoId, opcoes);

// Documentos antigos sem o campo `tipo` não entram aqui (o filtro `where`
// só casa com o valor literal) — mesma limitação já aceita para NPC/Criatura.
export const getPersonagensJogaveis = (universoId, opcoes) =>
  getPersonagensPorTipo(['Personagem Jogável'], universoId, opcoes);

export const getPersonagemPorId = async personagemId => {
  try {
    const snap = await getDoc(doc(db, PERSONAGENS_COLLECTION, personagemId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Erro ao buscar personagem "${personagemId}":`, error);
    throw error;
  }
};

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
// Usada para marcar status effects (atordoado, envenenado, etc.) em tokens e
// personagens. Assim como aptidoes/regras, uma condição pode pertencer
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
  invalidandoPersonagens(() =>
    addFirestoreItem(npcsSubcollectionPath(campanhaId), npc),
  );
export const removeRmCampanhaNpc = (campanhaId, id) =>
  invalidandoPersonagens(() =>
    removeFirestoreItem(npcsSubcollectionPath(campanhaId), id),
  );
export const updateRmCampanhaNpc = (campanhaId, id, updates) =>
  invalidandoPersonagens(() =>
    updateFirestoreItem(npcsSubcollectionPath(campanhaId), id, updates),
  );

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
  invalidandoPersonagens(() =>
    addFirestoreItem(jogadoresSubcollectionPath(campanhaId), jogador),
  );
export const removeRmCampanhaJogador = (campanhaId, id) =>
  invalidandoPersonagens(() =>
    removeFirestoreItem(jogadoresSubcollectionPath(campanhaId), id),
  );
export const updateRmCampanhaJogador = (campanhaId, id, updates) =>
  invalidandoPersonagens(() =>
    updateFirestoreItem(jogadoresSubcollectionPath(campanhaId), id, updates),
  );

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
  invalidandoPersonagens(() =>
    addFirestoreItem(criaturasSubcollectionPath(campanhaId), criatura),
  );
export const removeRmCampanhaCriatura = (campanhaId, id) =>
  invalidandoPersonagens(() =>
    removeFirestoreItem(criaturasSubcollectionPath(campanhaId), id),
  );
export const updateRmCampanhaCriatura = (campanhaId, id, updates) =>
  invalidandoPersonagens(() =>
    updateFirestoreItem(criaturasSubcollectionPath(campanhaId), id, updates),
  );

// ── rmCampanhas/{campanhaId}/lutaParticipantes ─────────────────────────────
// Subcoleção da tela de Luta, já aposentada (o combate agora vive no Grid):
// não há mais leitura nem escrita aqui. Só o caminho fica, para a exclusão da
// campanha (`removeRmCampanhaCompleta`) ainda apagar os participantes que
// campanhas antigas deixaram. A regra em firestore.rules continua valendo.
const lutaParticipantesSubcollectionPath = campanhaId => [
  RM_CAMPANHAS_COLLECTION,
  campanhaId,
  'lutaParticipantes',
];

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

// ── rmTiposEntidade (Firestore) ───────────────────────────────────────────────
const RM_TIPOS_ENTIDADE_COLLECTION = 'rmTiposEntidade';

export const getRmTiposEntidadePorUniverso = async (universoId, mestreId) => {
  if (!universoId || !mestreId) return [];

  return getFirestoreItemsWhereAll(RM_TIPOS_ENTIDADE_COLLECTION, [
    ['universoId', universoId],
    ['mestreId', mestreId],
  ]);
};

export const getRmTiposEntidadePorMestre = async mestreId => {
  if (!mestreId) return [];

  return getFirestoreItemsWhereAll(RM_TIPOS_ENTIDADE_COLLECTION, [
    ['mestreId', mestreId],
  ]);
};

export const addRmTipoEntidade = async item => {
  const nome = typeof item?.name === 'string' ? item.name.trim() : '';
  if (!nome || !item?.universoId || !item?.mestreId) return null;

  const payload = {
    ...item,
    name: nome,
    normalizedName: normalizeEntityTypeName(nome),
  };

  return addFirestoreItem(RM_TIPOS_ENTIDADE_COLLECTION, payload);
};

export const removeRmTipoEntidade = id =>
  removeFirestoreItem(RM_TIPOS_ENTIDADE_COLLECTION, id);

export const updateRmTipoEntidade = (id, updates) => {
  const payload = { ...updates };

  if (typeof payload.name === 'string') {
    payload.name = payload.name.trim();
    payload.normalizedName = normalizeEntityTypeName(payload.name);
  }

  return updateFirestoreItem(RM_TIPOS_ENTIDADE_COLLECTION, id, payload);
};

// ── Biblioteca Global de Músicas (Firestore) ───────────────────────────────
// `rmMusicasBiblioteca` guarda músicas reutilizáveis por Mestre; as playlists
// apontam para estes docs por `musicaId` sem duplicar conteúdo. `mestreId`
// garante que apenas o dono da biblioteca possa alterar registros.
const RM_MUSICAS_BIBLIOTECA_COLLECTION = 'rmMusicasBiblioteca';
const RM_MUSICAS_PASTAS_COLLECTION = 'rmMusicasPastas';
const RM_PLAYLISTS_PASTAS_COLLECTION = 'rmPlaylistsPastas';
const RM_PLAYLISTS_COLLECTION = 'rmPlaylists';

const normalizarTexto = valor =>
  typeof valor === 'string' ? valor.trim() : '';

const normalizarTags = tags => {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map(tag => normalizarTexto(tag))
        .filter(Boolean)
        .map(tag => tag.replace(/\s+/g, ' ')),
    ),
  ];
};

const normalizarDadosMusica = musica => {
  const dados = { ...(musica ?? {}) };
  const url = normalizarTexto(dados.url);
  const videoIdInformado = normalizarTexto(dados.videoId);
  const video = url ? extrairVideoYoutube(url) : null;
  const videoId = video?.videoId ?? videoIdInformado;
  if (!videoId) {
    throw new Error('Link do YouTube inválido.');
  }

  const nome = normalizarTexto(dados.nome) || `Música ${videoId}`;
  const pastaId = normalizarTexto(dados.pastaId);
  const tags = normalizarTags(dados.tags);

  return {
    ...dados,
    nome,
    url,
    videoId,
    pastaId: pastaId || null,
    tags,
    mestreId: dados.mestreId ?? null,
    descricao: normalizarTexto(dados.descricao),
    duracaoSegundos:
      Number.isFinite(Number(dados.duracaoSegundos)) &&
      Number(dados.duracaoSegundos) >= 0
        ? Number(dados.duracaoSegundos)
        : null,
    thumbnailUrl: normalizarTexto(dados.thumbnailUrl),
  };
};

const normalizarDadosPasta = pasta => {
  const dados = { ...(pasta ?? {}) };
  return {
    ...dados,
    nome: normalizarTexto(dados.nome) || 'Nova Pasta',
    mestreId: dados.mestreId ?? null,
    descricao: normalizarTexto(dados.descricao),
    cor: normalizarTexto(dados.cor) || '#6f2da8',
    ordenacao: Number.isInteger(Number(dados.ordenacao))
      ? Number(dados.ordenacao)
      : 0,
  };
};

const normalizarDadosPlaylist = (playlist, options = {}) => {
  const dados = { ...(playlist ?? {}) };
  const payload = {};
  const garantirPastaId = Boolean(options.garantirPastaId);

  if (Object.hasOwn(dados, 'nome')) {
    payload.nome = normalizarTexto(dados.nome) || 'Nova Playlist';
  }
  if (Object.hasOwn(dados, 'descricao')) {
    payload.descricao = normalizarTexto(dados.descricao);
  }
  if (Object.hasOwn(dados, 'pastaId') || garantirPastaId) {
    payload.pastaId = normalizarTexto(dados.pastaId ?? '') || null;
  }
  if (Object.hasOwn(dados, 'linkImagem') || Object.hasOwn(dados, 'imagemUrl')) {
    const imagem = normalizarTexto(dados.linkImagem ?? dados.imagemUrl ?? '');
    payload.linkImagem = imagem || null;
  }
  if (Object.hasOwn(dados, 'mestreId')) {
    payload.mestreId = dados.mestreId ?? null;
  }
  if (Object.hasOwn(dados, 'musicas')) {
    const musicaRefs = Array.isArray(dados.musicas) ? dados.musicas : [];
    const musicas = [];
    const vistos = new Set();
    musicaRefs.forEach(item => {
      if (!item || !item.musicaId) return;
      const musicaId = normalizarTexto(item.musicaId);
      if (!musicaId || vistos.has(musicaId)) return;
      vistos.add(musicaId);
      const musicaRef = { musicaId };
      const ordem = Number(item.ordem);
      if (Number.isInteger(ordem)) {
        musicaRef.ordem = ordem;
      }
      musicas.push(musicaRef);
    });
    payload.musicas = musicas;
  }

  return payload;
};

export const getRmMusicasBibliotecaPorMestre = mestreId =>
  getFirestoreItemsWhereAll(RM_MUSICAS_BIBLIOTECA_COLLECTION, [
    ['mestreId', mestreId],
  ]);
export const addRmMusicaBiblioteca = musica =>
  addFirestoreItem(
    RM_MUSICAS_BIBLIOTECA_COLLECTION,
    normalizarDadosMusica(musica),
  );
export const removeRmMusicaBiblioteca = async (id, mestreId) => {
  if (mestreId) {
    const playlists = await getRmPlaylistsPorMestre(mestreId);
    await Promise.all(
      playlists.map(async playlist => {
        const musicas = Array.isArray(playlist.musicas)
          ? playlist.musicas.filter(item => item?.musicaId !== id)
          : [];
        if (musicas.length === (playlist.musicas?.length ?? 0)) return;
        await updateRmPlaylist(playlist.id, { musicas });
      }),
    );
  }
  await removeFirestoreItem(RM_MUSICAS_BIBLIOTECA_COLLECTION, id);
};
export const updateRmMusicaBiblioteca = (id, updates) => {
  const payload = { ...updates };
  if (Object.hasOwn(payload, 'url')) {
    const dados = normalizarDadosMusica({
      ...payload,
      mestreId: payload.mestreId ?? updates.mestreId,
    });
    Object.assign(payload, dados);
  }
  if (Object.hasOwn(payload, 'nome')) {
    payload.nome = normalizarTexto(payload.nome) || 'Nova Música';
  }
  if (Object.hasOwn(payload, 'pastaId')) {
    payload.pastaId = normalizarTexto(payload.pastaId) || null;
  }
  if (Object.hasOwn(payload, 'tags')) {
    payload.tags = normalizarTags(payload.tags);
  }
  if (Object.hasOwn(payload, 'descricao')) {
    payload.descricao = normalizarTexto(payload.descricao);
  }
  if (Object.hasOwn(payload, 'thumbnailUrl')) {
    payload.thumbnailUrl = normalizarTexto(payload.thumbnailUrl);
  }
  return updateFirestoreItem(RM_MUSICAS_BIBLIOTECA_COLLECTION, id, payload);
};

export const getRmMusicasPastasPorMestre = mestreId =>
  getFirestoreItemsWhereAll(RM_MUSICAS_PASTAS_COLLECTION, [
    ['mestreId', mestreId],
  ]);
export const addRmMusicaPasta = pasta =>
  addFirestoreItem(RM_MUSICAS_PASTAS_COLLECTION, normalizarDadosPasta(pasta));
export const removeRmMusicaPasta = id =>
  removeFirestoreItem(RM_MUSICAS_PASTAS_COLLECTION, id);
export const updateRmMusicaPasta = (id, updates) =>
  updateFirestoreItem(
    RM_MUSICAS_PASTAS_COLLECTION,
    id,
    normalizarDadosPasta(updates),
  );

export const getRmPlaylistsPastasPorMestre = mestreId =>
  getFirestoreItemsWhereAll(RM_PLAYLISTS_PASTAS_COLLECTION, [
    ['mestreId', mestreId],
  ]);
export const addRmPlaylistPasta = pasta =>
  addFirestoreItem(RM_PLAYLISTS_PASTAS_COLLECTION, normalizarDadosPasta(pasta));
export const removeRmPlaylistPasta = id =>
  removeFirestoreItem(RM_PLAYLISTS_PASTAS_COLLECTION, id);
export const updateRmPlaylistPasta = (id, updates) =>
  updateFirestoreItem(
    RM_PLAYLISTS_PASTAS_COLLECTION,
    id,
    normalizarDadosPasta(updates),
  );

export const getRmPlaylistsPorMestre = mestreId =>
  getFirestoreItemsWhereAll(RM_PLAYLISTS_COLLECTION, [['mestreId', mestreId]]);
export const addRmPlaylist = playlist =>
  addFirestoreItem(
    RM_PLAYLISTS_COLLECTION,
    normalizarDadosPlaylist(playlist, { garantirPastaId: true }),
  );
export const removeRmPlaylist = id =>
  removeFirestoreItem(RM_PLAYLISTS_COLLECTION, id);
export const updateRmPlaylist = (id, updates) =>
  updateFirestoreItem(
    RM_PLAYLISTS_COLLECTION,
    id,
    normalizarDadosPlaylist(updates),
  );

// ── rmSessaoLogs (Firestore) ──────────────────────────────────────────────
// Registro cronológico automático de eventos da sessão (cena marcada como
// atual, carta sorteada no CardFlux, combate iniciado no Grid) —
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

// Só os eventos mais recentes (o Dashboard mostra poucos): `orderBy` + `limit`
// evitam baixar o histórico inteiro da campanha. Pede o índice composto
// (campanhaId, universoId, mestreId, createdAt desc) em firestore.indexes.json;
// enquanto ele não está publicado o Firestore responde `failed-precondition` e
// caímos na leitura completa (a tela ordena e corta no cliente).
export const SESSAO_LOGS_LIMITE = 30;

export const getRmSessaoLogsRecentes = async (
  campanhaId,
  universoId,
  mestreId,
  limite = SESSAO_LOGS_LIMITE,
) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, RM_SESSAO_LOGS_COLLECTION),
        where('campanhaId', '==', campanhaId),
        where('universoId', '==', universoId),
        where('mestreId', '==', mestreId),
        orderBy('createdAt', 'desc'),
        limit(limite),
      ),
    );
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (error) {
    if (error?.code === 'failed-precondition') {
      return getRmSessaoLogsPorCampanha(campanhaId, universoId, mestreId);
    }
    // eslint-disable-next-line no-console
    console.error('Erro ao buscar os eventos recentes da sessão:', error);
    throw error;
  }
};

export const addRmSessaoLog = log =>
  addFirestoreItem(RM_SESSAO_LOGS_COLLECTION, log);

// ── Chat da campanha — rmCampanhas/{id}/chatMensagens ─────────────────────
// Sala compartilhada com o site dos jogadores (Ficha-RPG---Re-Dungeon-, que
// tem as mesmas funções). Diferente das outras subcoleções de rmCampanhas, os
// docs NÃO denormalizam universoId/mestreId: a regra lê `mestreId` do doc pai
// (e o personagem do jogador) via get() — ver o bloco do chat em
// firestore.rules. O mestre não precisa de doc em `chatMembros` (só jogadores).
export const CHAT_LIMITE_MENSAGENS = CHAT_JANELA_MENSAGENS;

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

// Página de mensagens ANTERIORES à janela ao vivo ("Carregar anteriores"):
// leitura única (getDocs) das até `limite` mensagens com `createdAt` anterior a
// `antesDe` (o `createdAt` da mensagem mais antiga que a tela já tem), devolvidas
// em ordem cronológica (mais antiga primeiro). A regra de leitura é por
// documento, então a consulta não precisa de regra nova. Mensagens com o mesmo
// `createdAt` exato da referência ficam de fora (empate raro; a tela deduplica
// por id).
export const getChatMensagensAntes = async (
  campanhaId,
  antesDe,
  limite = CHAT_PAGINA_ANTERIORES,
) => {
  const anterioresQuery = query(
    collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens'),
    where('createdAt', '<', antesDe),
    orderBy('createdAt', 'desc'),
    limit(limite),
  );
  const snapshot = await getDocs(anterioresQuery);
  return snapshot.docs
    .map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data({ serverTimestamps: 'estimate' }),
    }))
    .reverse();
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

// ── Grid da campanha — rmCampanhas/{id}/grid/atual e gridCenas ────────────
// Em CENAS: `gridCenas/{cenaId}` (nome, imagem, grade) com os próprios tokens
// em `gridCenas/{cenaId}/tokens`; `grid/atual` = {cenaAtivaId}, a única cena
// que os jogadores veem (as outras o mestre prepara em segredo). Mesmo bloco
// de leitura do site dos jogadores (subscribeGridCenaAtiva/subscribeGridCena/
// subscribeGridTokens/moverGridToken) + as escritas do mestre. As regras só
// deixam o jogador mudar `col`/`lin` e o rastro do movimento
// (`rastro`/`movidoEm`) dos tokens em que está em `donos`;
// tokens `oculto` só o mestre lê. Limites em common/utils/grid.js.
// Sinais no mapa (`gridCenas/{cenaId}/pings/{uid}`, setGridPing) são gravados
// por todos (cada um o próprio); PV/Energia/Fadiga, condições e aura dos
// tokens (updateGridToken) só o mestre.
// Combate (Fase 3A): `gridCenas/{cenaId}/combate/atual` existe enquanto há
// combate — o mestre inicia (iniciarGridCombate), encerra (encerrarGridCombate)
// e altera tudo por alterarGridCombate; o jogador só passa o próprio turno. O
// `travamento` da cena limita quando o jogador move.
const gridRef = campanhaId =>
  doc(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'grid', 'atual');
const gridCenasRef = campanhaId =>
  collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'gridCenas');
const gridCenaRef = (campanhaId, cenaId) =>
  doc(gridCenasRef(campanhaId), cenaId);
const gridTokensRef = (campanhaId, cenaId) =>
  collection(gridCenaRef(campanhaId, cenaId), 'tokens');

// Opção do mestre em `grid/atual`: as ações da Central de Ações dos jogadores
// (aberta pelo Grid em combate) aparecem no chat. Chama `onChange(boolean)` —
// campo ausente = false.
export const subscribeGridAvisarAcoesChat = (campanhaId, onChange, onError) =>
  onSnapshot(
    gridRef(campanhaId),
    snapshot =>
      onChange(snapshot.exists() && snapshot.data().avisarAcoesChat === true),
    onError,
  );

// Chama `onChange(cenaAtivaId | null)`.
export const subscribeGridCenaAtiva = (campanhaId, onChange, onError) =>
  onSnapshot(
    gridRef(campanhaId),
    snapshot =>
      onChange(
        snapshot.exists() ? (snapshot.data().cenaAtivaId ?? null) : null,
      ),
    onError,
  );

// Chama `onChange({ id, ...dados } | null)` — null se a cena não existe mais.
export const subscribeGridCena = (campanhaId, cenaId, onChange, onError) =>
  onSnapshot(
    gridCenaRef(campanhaId, cenaId),
    snapshot =>
      onChange(
        snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
      ),
    onError,
  );

const gridAreasRef = (campanhaId, cenaId) =>
  collection(gridCenaRef(campanhaId, cenaId), 'templates');

// Templates de área da cena (common/utils/gridAreas.js). Chama
// `onChange([{ id, ...dados }])`; quem lê normaliza (normalizarArea).
export const subscribeGridAreas = (campanhaId, cenaId, onChange, onError) =>
  onSnapshot(
    gridAreasRef(campanhaId, cenaId),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      ),
    onError,
  );

// `area` = montarArea(...) (sem timestamps). Devolve o id do novo template.
export const addGridArea = async (campanhaId, cenaId, area) => {
  const ref = await addDoc(gridAreasRef(campanhaId, cenaId), {
    ...area,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

// Só origem/alvo mudam (a regra garante); `alvo` null apaga o campo.
export const updateGridArea = (campanhaId, cenaId, areaId, { origem, alvo }) =>
  updateDoc(doc(gridAreasRef(campanhaId, cenaId), areaId), {
    origem,
    alvo: alvo ?? deleteField(),
    updatedAt: serverTimestamp(),
  });

export const removeGridArea = (campanhaId, cenaId, areaId) =>
  deleteDoc(doc(gridAreasRef(campanhaId, cenaId), areaId));

// "Remover todos": lotes de 400 (limite do Firestore é 500 por lote).
export const removeGridAreas = async (campanhaId, cenaId, ids) => {
  for (let i = 0; i < ids.length; i += 400) {
    const lote = writeBatch(db);
    ids
      .slice(i, i + 400)
      .forEach(id => lote.delete(doc(gridAreasRef(campanhaId, cenaId), id)));
    await lote.commit();
  }
};

// Todas as cenas (só o mestre pode listar). Ordene com `ordenarCenas`.
export const subscribeGridCenas = (campanhaId, onChange, onError) =>
  onSnapshot(
    gridCenasRef(campanhaId),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data({ serverTimestamps: 'estimate' }),
        })),
      ),
    onError,
  );

// `docSnapshot.data()` com o padrão serverTimestamps 'none': numa escrita
// local ainda pendente, `movidoEm` (serverTimestamp) chega null — é assim que
// useGridCampanha distingue o próprio movimento pendente da confirmação. Não
// troque por 'estimate': o valor muda na confirmação e o rastro piscaria 2x.
export const subscribeGridTokens = (
  campanhaId,
  cenaId,
  { incluirOcultos = false } = {},
  onChange,
  onError,
) => {
  const filtros = incluirOcultos ? [] : [where('oculto', '==', false)];
  return onSnapshot(
    query(gridTokensRef(campanhaId, cenaId), ...filtros),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      ),
    onError,
  );
};

// Combate da cena (common/utils/gridCombate.js): existe enquanto há combate.
const gridCombateRef = (campanhaId, cenaId) =>
  doc(gridCenaRef(campanhaId, cenaId), 'combate', 'atual');

// Chama `onChange(dados | null)`. serverTimestamps 'none' (padrão): a minha
// troca de turno pendente chega com `turnoEm` null.
export const subscribeGridCombate = (campanhaId, cenaId, onChange, onError) =>
  onSnapshot(
    gridCombateRef(campanhaId, cenaId),
    snapshot => onChange(snapshot.exists() ? snapshot.data() : null),
    onError,
  );

// Transação sobre o combate: `calcular(docAtual)` → null (nada a fazer) |
// { patch, mensagem = null, mudouTurno = false }. `mudouTurno` grava
// `turnoEm` (horário do servidor); `mensagem` (montarMensagemCombate) entra
// no chat na mesma escrita — a regra confere isso para o jogador. Resolve
// true se gravou.
export const alterarGridCombate = (campanhaId, cenaId, calcular) =>
  runTransaction(db, async transacao => {
    const ref = gridCombateRef(campanhaId, cenaId);
    const snapshot = await transacao.get(ref);
    const resultado = snapshot.exists() ? calcular(snapshot.data()) : null;
    if (!resultado) return false;
    transacao.update(ref, {
      ...resultado.patch,
      ...(resultado.mudouTurno ? { turnoEm: serverTimestamp() } : {}),
      updatedAt: serverTimestamp(),
    });
    if (resultado.mensagem) {
      transacao.set(
        doc(
          collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens'),
        ),
        { ...resultado.mensagem, createdAt: serverTimestamp() },
      );
    }
    return true;
  });

// Só o mestre: começa o combate (estado de montarInicioDoCombate) e anuncia
// na mesma escrita atômica.
export const iniciarGridCombate = async (
  campanhaId,
  cenaId,
  estado,
  mensagem,
) => {
  const batch = writeBatch(db);
  batch.set(gridCombateRef(campanhaId, cenaId), {
    ...estado,
    turnoEm: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    doc(collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens')),
    { ...mensagem, createdAt: serverTimestamp() },
  );
  await batch.commit();
};

// Só o mestre: apaga o combate e anuncia o fim na mesma escrita atômica.
export const encerrarGridCombate = async (campanhaId, cenaId, mensagem) => {
  const batch = writeBatch(db);
  batch.delete(gridCombateRef(campanhaId, cenaId));
  batch.set(
    doc(collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMensagens')),
    { ...mensagem, createdAt: serverTimestamp() },
  );
  await batch.commit();
};

// Com `rastro` ([{col, lin}], common/utils/grid.js — montarRastro), grava
// também o rastro do movimento e `movidoEm` (horário do servidor), que todos
// os clientes usam para mostrar o caminho por alguns segundos.
export const moverGridToken = (
  campanhaId,
  cenaId,
  tokenId,
  col,
  lin,
  rastro = null,
) =>
  updateDoc(doc(gridTokensRef(campanhaId, cenaId), tokenId), {
    col,
    lin,
    ...(rastro ? { rastro, movidoEm: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  });

const gridCamadasRef = (campanhaId, cenaId) =>
  collection(gridCenaRef(campanhaId, cenaId), 'camadas');
const gridMarcadoresRef = (campanhaId, cenaId) =>
  collection(gridCenaRef(campanhaId, cenaId), 'marcadores');
const gridDesenhosRef = (campanhaId, cenaId) =>
  collection(gridCenaRef(campanhaId, cenaId), 'desenhos');

// Um listener na coleção: `onChange({ paredes, nevoa })` — dados crus do doc
// ou null para cada um.
export const subscribeGridCamadas = (campanhaId, cenaId, onChange, onError) =>
  onSnapshot(
    gridCamadasRef(campanhaId, cenaId),
    snapshot => {
      const camadas = { paredes: null, nevoa: null };
      snapshot.docs.forEach(docSnapshot => {
        if (docSnapshot.id in camadas)
          camadas[docSnapshot.id] = docSnapshot.data();
      });
      onChange(camadas);
    },
    onError,
  );

// Substitui o doc inteiro (`dados` = campos da camada, sem datas).
export const setGridCamada = (campanhaId, cenaId, camadaId, dados) =>
  setDoc(doc(gridCamadasRef(campanhaId, cenaId), camadaId), {
    ...dados,
    updatedAt: serverTimestamp(),
  });

// Chama `onChange([{ id, ...dados }])`. Sem `incluirSecretos` filtra
// `secreto == false` (senão a regra recusa a consulta).
export const subscribeGridMarcadores = (
  campanhaId,
  cenaId,
  { incluirSecretos = false } = {},
  onChange,
  onError,
) =>
  onSnapshot(
    incluirSecretos
      ? gridMarcadoresRef(campanhaId, cenaId)
      : query(
          gridMarcadoresRef(campanhaId, cenaId),
          where('secreto', '==', false),
        ),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      ),
    onError,
  );

export const addGridMarcador = async (campanhaId, cenaId, marcador) => {
  const ref = await addDoc(gridMarcadoresRef(campanhaId, cenaId), {
    ...marcador,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateGridMarcador = (campanhaId, cenaId, marcadorId, patch) =>
  updateDoc(doc(gridMarcadoresRef(campanhaId, cenaId), marcadorId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });

export const removeGridMarcador = (campanhaId, cenaId, marcadorId) =>
  deleteDoc(doc(gridMarcadoresRef(campanhaId, cenaId), marcadorId));

// Um doc por traço. Chama `onChange([{ id, ...dados }])`, sem ordenação.
export const subscribeGridDesenhos = (campanhaId, cenaId, onChange, onError) =>
  onSnapshot(
    gridDesenhosRef(campanhaId, cenaId),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      ),
    onError,
  );

// Cria o traço `{ uid, cor, pontos }` e, no mesmo lote, apaga `idsParaApagar`
// (o excedente do limite por pessoa). Devolve o id do novo.
export const addGridDesenho = async (
  campanhaId,
  cenaId,
  { uid, cor, pontos },
  idsParaApagar = [],
) => {
  const lote = writeBatch(db);
  const novoRef = doc(gridDesenhosRef(campanhaId, cenaId));
  lote.set(novoRef, { uid, cor, pontos, createdAt: serverTimestamp() });
  idsParaApagar.forEach(id =>
    lote.delete(doc(gridDesenhosRef(campanhaId, cenaId), id)),
  );
  await lote.commit();
  return novoRef.id;
};

// "Apagar meus/todos": lotes de 450 (limite do Firestore é 500 por lote).
export const removeGridDesenhos = async (campanhaId, cenaId, ids) => {
  for (let i = 0; i < ids.length; i += 450) {
    const lote = writeBatch(db);
    ids
      .slice(i, i + 450)
      .forEach(id => lote.delete(doc(gridDesenhosRef(campanhaId, cenaId), id)));
    await lote.commit();
  }
};

const gridPingsRef = (campanhaId, cenaId) =>
  collection(gridCenaRef(campanhaId, cenaId), 'pings');

// Chama `onChange([{ uid, x, y, puxar, nome, criadoEm }])`. serverTimestamps
// 'none' (padrão): o meu sinal pendente chega com `criadoEm` null
// (detectarPings ignora).
export const subscribeGridPings = (campanhaId, cenaId, onChange, onError) =>
  onSnapshot(
    gridPingsRef(campanhaId, cenaId),
    snapshot =>
      onChange(
        snapshot.docs.map(docSnapshot => ({
          uid: docSnapshot.id,
          ...docSnapshot.data(),
        })),
      ),
    onError,
  );

// Um doc por pessoa (id = uid), sobrescrito a cada sinal (sem acúmulo/TTL).
// `puxar` (centralizar a vista de todos) só o mestre — a regra garante.
export const setGridPing = (
  campanhaId,
  cenaId,
  uid,
  { x, y, puxar = false, nome = null },
) =>
  setDoc(doc(gridPingsRef(campanhaId, cenaId), uid), {
    x,
    y,
    puxar: Boolean(puxar),
    ...(nome ? { nome } : {}),
    criadoEm: serverTimestamp(),
  });

// Ficha ao vivo (somente leitura — `personagens` é do Re-Dungeon), para as
// barras de PV/Energia/Fadiga dos tokens de jogador. Chama
// `onChange({ id, ...dados } | null)`.
export const subscribePersonagem = (personagemId, onChange, onError) =>
  onSnapshot(
    doc(db, PERSONAGENS_COLLECTION, personagemId),
    snapshot =>
      onChange(
        snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
      ),
    onError,
  );

// null = nenhuma cena visível aos jogadores. `merge` para não apagar as
// outras opções do doc (`avisarAcoesChat`).
export const setGridCenaAtiva = (campanhaId, cenaId) =>
  setDoc(
    gridRef(campanhaId),
    { cenaAtivaId: cenaId, updatedAt: serverTimestamp() },
    { merge: true },
  );

// Liga/desliga o aviso no chat das ações da Central de Ações dos jogadores.
export const setGridAvisarAcoesChat = (campanhaId, avisar) =>
  setDoc(
    gridRef(campanhaId),
    { avisarAcoesChat: Boolean(avisar), updatedAt: serverTimestamp() },
    { merge: true },
  );

const comDatas = dados => ({
  ...dados,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

// Cria a cena (montarCena de common/utils/grid.js) e, numa mesma escrita
// atômica, os tokens iniciais (ex.: "Adicionar todos os jogadores").
export const addGridCena = async (
  campanhaId,
  cena,
  tokens = [],
  extras = [],
) => {
  const batch = writeBatch(db);
  const cenaRef = doc(gridCenasRef(campanhaId));
  batch.set(cenaRef, comDatas(cena));
  tokens.forEach(token =>
    batch.set(doc(gridTokensRef(campanhaId, cenaRef.id)), comDatas(token)),
  );
  // Docs extras da cena nova: [{ ref: 'camadas/paredes', dados }, ...].
  extras.forEach(({ ref, dados }) =>
    batch.set(doc(cenaRef, ...ref.split('/')), comDatas(dados)),
  );
  await batch.commit();
  return cenaRef.id;
};

export const updateGridCena = (campanhaId, cenaId, patch) =>
  updateDoc(gridCenaRef(campanhaId, cenaId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });

// Dados de um doc sem createdAt/updatedAt (a cópia ganha datas novas).
const semDatas = dados => {
  const resto = { ...dados };
  delete resto.createdAt;
  delete resto.updatedAt;
  return resto;
};

// Token copiado sem datas e sem o rastro do último movimento (a cena nova
// começa sem rastro nenhum).
const tokenParaCopia = dados => {
  const resto = semDatas(dados);
  delete resto.rastro;
  delete resto.movidoEm;
  return resto;
};

// Copia a configuração, os tokens, as camadas (paredes e névoa) e os
// marcadores para uma cena nova. Os desenhos e os templates de área
// (`templates`) não vão — são efêmeros, presos à posição da cena de origem.
export const duplicarGridCena = async (campanhaId, cenaId, nome) => {
  const [cenaSnapshot, tokensSnapshot, camadasSnapshot, marcadoresSnapshot] =
    await Promise.all([
      getDoc(gridCenaRef(campanhaId, cenaId)),
      getDocs(gridTokensRef(campanhaId, cenaId)),
      getDocs(gridCamadasRef(campanhaId, cenaId)),
      getDocs(gridMarcadoresRef(campanhaId, cenaId)),
    ]);
  const extras = [
    ...camadasSnapshot.docs
      .filter(docSnapshot => ['paredes', 'nevoa'].includes(docSnapshot.id))
      .map(docSnapshot => ({
        ref: `camadas/${docSnapshot.id}`,
        dados: semDatas(docSnapshot.data()),
      })),
    ...marcadoresSnapshot.docs.map(docSnapshot => ({
      ref: `marcadores/${docSnapshot.id}`,
      dados: semDatas(docSnapshot.data()),
    })),
  ];
  return addGridCena(
    campanhaId,
    { ...semDatas(cenaSnapshot.data()), nome },
    tokensSnapshot.docs.map(docSnapshot => tokenParaCopia(docSnapshot.data())),
    extras,
  );
};

// Apaga os tokens, os sinais (pings), as camadas, os marcadores, os desenhos,
// os templates de área, o combate e a cena, em lotes de 450 (a cena por último).
export const removeGridCena = async (campanhaId, cenaId) => {
  const snapshots = await Promise.all([
    getDocs(gridTokensRef(campanhaId, cenaId)),
    getDocs(gridPingsRef(campanhaId, cenaId)),
    getDocs(gridCamadasRef(campanhaId, cenaId)),
    getDocs(gridMarcadoresRef(campanhaId, cenaId)),
    getDocs(gridDesenhosRef(campanhaId, cenaId)),
    getDocs(gridAreasRef(campanhaId, cenaId)),
  ]);
  const refs = [
    ...snapshots.flatMap(snapshot => snapshot.docs.map(item => item.ref)),
    gridCombateRef(campanhaId, cenaId),
  ];
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
  await deleteDoc(gridCenaRef(campanhaId, cenaId));
};

// Apaga em lotes (o limite do writeBatch é 500 operações).
const apagarEmLotes = async refs => {
  for (let i = 0; i < refs.length; i += 450) {
    const batch = writeBatch(db);
    refs.slice(i, i + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
};

const refsDaColecao = async caminho =>
  (await getDocs(collection(db, ...caminho))).docs.map(item => item.ref);

// Exclui a campanha com o que mora dentro dela: cenas do grid (e tudo de cada
// uma), chat (mensagens, rolagens secretas de cada membro, macros), música,
// clones de NPC/criatura, jogadores e participantes da antiga Luta. As subcoleções
// vão antes do documento: as regras delas consultam o `mestreId` da campanha.
// `chatMembros` é o último passo e só funciona com a regra que deixa o mestre
// apagar o ponteiro (firestore.rules); se ela ainda não foi publicada, esses
// ponteiros (sem conteúdo) ficam para trás sem impedir a exclusão.
// Coleções `rm*` top-level ligadas por `campanhaId` (cenas narrativas,
// missões, notas…) não são tocadas.
export const removeRmCampanhaCompleta = async (campanhaId, mestreId) => {
  // 1) Lê tudo antes de apagar qualquer coisa: se uma leitura for recusada,
  //    a campanha fica intacta (antes, as cenas já tinham sumido).
  const cenas = await getDocs(gridCenasRef(campanhaId));
  const membros = await getDocs(
    collection(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'chatMembros'),
  );
  const donosDeSecretas = new Set([
    ...membros.docs.map(item => item.id),
    ...(mestreId ? [mestreId] : []),
  ]);
  const secretas = await Promise.all(
    [...donosDeSecretas].map(async uid =>
      (await getDocs(rolagensSecretasRef(campanhaId, uid))).docs.map(
        item => item.ref,
      ),
    ),
  );
  const subcolecoes = await Promise.all(
    ['chatMensagens', 'macros', 'grid', 'audio'].map(nome =>
      refsDaColecao([RM_CAMPANHAS_COLLECTION, campanhaId, nome]),
    ),
  );
  // Clones/jogadores/participantes: as regras só deixam o mestre LISTAR com
  // o filtro `mestreId` (resource.data.mestreId == uid) — sem ele a consulta
  // inteira é recusada, mesmo vazia.
  const clones = await Promise.all(
    [
      npcsSubcollectionPath,
      jogadoresSubcollectionPath,
      criaturasSubcollectionPath,
      lutaParticipantesSubcollectionPath,
    ].map(async caminho =>
      (
        await getDocs(
          query(
            collection(db, ...caminho(campanhaId)),
            where('mestreId', '==', mestreId),
          ),
        )
      ).docs.map(item => item.ref),
    ),
  );

  // 2) Apaga: cenas do grid (com tudo dentro), o resto em lotes, ponteiros
  //    do chat (best-effort) e por fim o documento da campanha.
  for (const cena of cenas.docs) {
    await removeGridCena(campanhaId, cena.id);
  }
  await apagarEmLotes([
    ...secretas.flat(),
    ...subcolecoes.flat(),
    ...clones.flat(),
  ]);

  try {
    await apagarEmLotes(membros.docs.map(item => item.ref));
  } catch {
    // Regra do mestre apagar chatMembros ainda não publicada: segue.
  }

  await removeFirestoreItem(RM_CAMPANHAS_COLLECTION, campanhaId);
};

export const addGridTokens = async (campanhaId, cenaId, tokens) => {
  const batch = writeBatch(db);
  tokens.forEach(token =>
    batch.set(doc(gridTokensRef(campanhaId, cenaId)), comDatas(token)),
  );
  await batch.commit();
};

export const updateGridToken = (campanhaId, cenaId, tokenId, patch) =>
  updateDoc(doc(gridTokensRef(campanhaId, cenaId), tokenId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });

export const removeGridToken = (campanhaId, cenaId, tokenId) =>
  deleteDoc(doc(gridTokensRef(campanhaId, cenaId), tokenId));

// Ações em lote do mestre (seleção múltipla do Grid): um único writeBatch
// (a cena comporta até 200 tokens, bem abaixo do limite de 500 do Firestore).
// `alteracoes` = [{ id, patch }]; cada update ganha `updatedAt`, como em
// `updateGridToken`.
export const updateGridTokensEmLote = async (
  campanhaId,
  cenaId,
  alteracoes,
) => {
  if (!alteracoes?.length) return;
  const batch = writeBatch(db);
  alteracoes.forEach(({ id, patch }) =>
    batch.update(doc(gridTokensRef(campanhaId, cenaId), id), {
      ...patch,
      updatedAt: serverTimestamp(),
    }),
  );
  await batch.commit();
};

export const removeGridTokensEmLote = async (campanhaId, cenaId, tokenIds) => {
  if (!tokenIds?.length) return;
  const batch = writeBatch(db);
  tokenIds.forEach(id =>
    batch.delete(doc(gridTokensRef(campanhaId, cenaId), id)),
  );
  await batch.commit();
};

// ── Música da mesa — rmCampanhas/{id}/audio/atual ──────────────────────────
// Estado da faixa do YouTube que toca para todos com a mesa aberta (modelo em
// common/utils/audioMesa.js). Mesmo bloco do site dos jogadores: membros
// leem, só o mestre grava (as regras garantem). `referenciaEm` (horário do
// servidor na gravação) chega como milissegundos para o cálculo da posição.
const audioMesaRef = campanhaId =>
  doc(db, RM_CAMPANHAS_COLLECTION, campanhaId, 'audio', 'atual');

// Chama `onChange(estado | null)` — null enquanto nunca tocou nada.
export const subscribeAudioMesa = (campanhaId, onChange, onError) =>
  onSnapshot(
    audioMesaRef(campanhaId),
    snapshot => {
      if (!snapshot.exists()) {
        onChange(null);
        return;
      }
      const dados = snapshot.data({ serverTimestamps: 'estimate' });
      onChange({
        ...dados,
        referenciaEm: dados.referenciaEm?.toMillis?.() ?? null,
      });
    },
    onError,
  );

// `estado` = um dos montarAudio* (ou AUDIO_PARADO) de common/utils/audioMesa.js.
export const setAudioMesa = (campanhaId, estado) =>
  setDoc(audioMesaRef(campanhaId), {
    ...estado,
    referenciaEm: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
