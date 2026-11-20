import { readFileSync } from 'node:fs';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 're-dungeon-banco-de-dados',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'userPermissions', 'mestre-a'), { isAdmin: false, universos: ['u1'] });
    await setDoc(doc(db, 'userPermissions', 'mestre-b'), { isAdmin: false, universos: ['u2'] });
    await setDoc(doc(db, 'rmCampanhas', 'c1'), {
      id: 'c1',
      mestreId: 'mestre-a',
      universoId: 'u1',
      nome: 'Campanha A',
    });
    await setDoc(doc(db, 'rmCampanhas', 'c2'), {
      id: 'c2',
      mestreId: 'mestre-b',
      universoId: 'u2',
      nome: 'Campanha B',
    });
  });
});

const dbMestreA = () => testEnv.authenticatedContext('mestre-a').firestore();
const dbMestreB = () => testEnv.authenticatedContext('mestre-b').firestore();
const dbAnonimo = () => testEnv.unauthenticatedContext().firestore();

describe('rmTiposVinculo', () => {
  it('mestre consulta seus tipos', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmTiposVinculo', 'tipo-mae'), {
        name: 'Mãe', mestreId: 'mestre-a', universoId: 'u1', normalizedName: 'mae',
      });
    });
    await assertSucceeds(getDocs(query(collection(dbMestreA(), 'rmTiposVinculo'),
      where('universoId', '==', 'u1'), where('mestreId', '==', 'mestre-a'))));
  });

  it('mestre consulta tipos de outro universo negado', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmTiposVinculo', 'tipo-u2'), {
        name: 'Aliado', mestreId: 'mestre-b', universoId: 'u2', normalizedName: 'aliado',
      });
    });
    await assertFails(getDocs(query(collection(dbMestreA(), 'rmTiposVinculo'),
      where('universoId', '==', 'u2'), where('mestreId', '==', 'mestre-b'))));
  });

  it('usuário não autenticado consulta tipos negado', async () => {
    await assertFails(getDocs(collection(dbAnonimo(), 'rmTiposVinculo')));
  });

  it('mestre lê documento próprio por getDoc', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmTiposVinculo', 'tipo-doc'), {
        name: 'Mãe', mestreId: 'mestre-a', universoId: 'u1', normalizedName: 'mae',
      });
    });
    await assertSucceeds(getDoc(doc(dbMestreA(), 'rmTiposVinculo', 'tipo-doc')));
  });
});

describe('rmCampanhas/{campanhaId}/vinculos', () => {
  const vinculoValido = {
    campanhaId: 'c1', universoId: 'u1', destinoUniversoId: 'u1',
    mestreId: 'mestre-a', origemColecao: 'rmNotas', origemId: 'n1',
    destinoColecao: 'personagens', destinoId: 'p1',
  };

  it('mestre consulta vínculos da própria campanha', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmCampanhas/c1/vinculos/v1'), vinculoValido);
    });
    await assertSucceeds(getDocs(query(collection(dbMestreA(), 'rmCampanhas/c1/vinculos'),
      where('campanhaId', '==', 'c1'),
      where('universoId', '==', 'u1'),
      where('mestreId', '==', 'mestre-a'),
      where('origemId', '==', 'n1'))));
  });

  it('usuário de outra campanha consulta vínculos negado', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmCampanhas/c1/vinculos/v1'), vinculoValido);
    });
    await assertFails(getDocs(collection(dbMestreB(), 'rmCampanhas/c1/vinculos')));
  });

  it('usuário não autenticado consulta vínculos negado', async () => {
    await assertFails(getDocs(collection(dbAnonimo(), 'rmCampanhas/c1/vinculos')));
  });

  it('mestre cria vínculo válido permitido', async () => {
    await assertSucceeds(setDoc(doc(dbMestreA(), 'rmCampanhas/c1/vinculos/v2'), vinculoValido));
  });

  it('mestre cria vínculo com universo incompatível negado', async () => {
    await assertFails(setDoc(doc(dbMestreA(), 'rmCampanhas/c1/vinculos/v3'), {
      ...vinculoValido,
      destinoUniversoId: 'u2',
    }));
  });

  it('mestre cria autorrelacionamento negado', async () => {
    await assertFails(setDoc(doc(dbMestreA(), 'rmCampanhas/c1/vinculos/v4'), {
      ...vinculoValido,
      destinoId: 'n1',
    }));
  });

  it('mestre atualiza e exclui vínculo autorizado', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmCampanhas/c1/vinculos/v5'), vinculoValido);
    });
    await assertSucceeds(updateDoc(doc(dbMestreA(), 'rmCampanhas/c1/vinculos/v5'), { destinoTipo: 'NPC' }));
    await assertSucceeds(deleteDoc(doc(dbMestreA(), 'rmCampanhas/c1/vinculos/v5')));
  });

  it('usuário sem autorização altera vínculo negado', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmCampanhas/c1/vinculos/v6'), vinculoValido);
    });
    await assertFails(updateDoc(doc(dbMestreB(), 'rmCampanhas/c1/vinculos/v6'), { destinoTipo: 'NPC' }));
  });

  it('mestre lê vínculo próprio por getDoc', async () => {
    await testEnv.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), 'rmCampanhas/c1/vinculos/v-doc'), {
        campanhaId: 'c1', universoId: 'u1', destinoUniversoId: 'u1', mestreId: 'mestre-a',
        origemColecao: 'rmNotas', origemId: 'n1', destinoColecao: 'personagens', destinoId: 'p1',
      });
    });
    await assertSucceeds(getDoc(doc(dbMestreA(), 'rmCampanhas/c1/vinculos/v-doc')));
  });
});

describe('diagnóstico dos helpers', () => {
  it('mestre lê suas permissões', async () => {
    await assertSucceeds(getDoc(doc(dbMestreA(), 'userPermissions', 'mestre-a')));
  });

  it('mestre lê a própria campanha', async () => {
    await assertSucceeds(getDoc(doc(dbMestreA(), 'rmCampanhas', 'c1')));
  });
});
