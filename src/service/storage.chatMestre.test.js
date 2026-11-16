import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onSnapshot } from 'firebase/firestore';

vi.mock('./firebase', () => ({ auth: { currentUser: null }, db: {} }));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn((_db, ...segmentos) => ({ path: segmentos.join('/') })),
    query: vi.fn((ref, ...restricoes) => ({ ref, restricoes })),
    orderBy: vi.fn(campo => ({ orderBy: campo })),
    limit: vi.fn(n => ({ limit: n })),
    onSnapshot: vi.fn(),
  };
});

import {
  CHAT_LIMITE_SECRETAS,
  CHAT_LIMITE_SUSSURROS,
  subscribeChatSecretasDoMestre,
  subscribeChatSussurrosDoMestre,
} from './storage';
import { CHAT_LIMITE_SECRETAS_MEMBRO } from 'common/utils/chat';

const DIA = 24 * 60 * 60 * 1000;
const membro = (id, updatedAt) => ({ id, data: () => ({ uid: id, updatedAt }) });
const timestampHa = dias => ({ toDate: () => new Date(Date.now() - dias * DIA) });
const snapshotDe = docs => ({ docs });

let ouvintes;

beforeEach(() => {
  ouvintes = [];
  vi.mocked(onSnapshot).mockReset();
  vi.mocked(onSnapshot).mockImplementation((alvo, onNext) => {
    const unsubscribe = vi.fn();
    ouvintes.push({ alvo, onNext, unsubscribe });
    return unsubscribe;
  });
});

const pastas = () =>
  ouvintes
    .filter(o => o.alvo.ref)
    .map(o => ({
      path: o.alvo.ref.path,
      limite: o.alvo.restricoes.find(r => r.limit !== undefined).limit,
    }));
const ouvinteDeMembros = () => ouvintes.find(o => o.alvo.path?.endsWith('/chatMembros'));

describe.each([
  {
    nome: 'secretas',
    abrir: () => subscribeChatSecretasDoMestre('c1', 'mestre', vi.fn(), vi.fn()),
    pasta: uid => `rmCampanhas/c1/chatSecretas/${uid}/rolagens`,
    limiteDoMestre: CHAT_LIMITE_SECRETAS,
    temPastaDoMestre: true,
  },
  {
    nome: 'sussurros',
    abrir: () => subscribeChatSussurrosDoMestre('c1', vi.fn(), vi.fn()),
    pasta: uid => `rmCampanhas/c1/chatSecretas/${uid}/sussurros`,
    limiteDoMestre: CHAT_LIMITE_SUSSURROS,
    temPastaDoMestre: false,
  },
])('mestre ouve $nome só de membros recentes', ({ abrir, pasta, limiteDoMestre, temPastaDoMestre }) => {
  it('abre a pasta de quem tem atividade recente (ou pendente) e ignora os antigos', () => {
    abrir();
    if (temPastaDoMestre) {
      expect(pastas()).toEqual([{ path: pasta('mestre'), limite: limiteDoMestre }]);
    } else {
      expect(pastas()).toEqual([]);
    }

    ouvinteDeMembros().onNext(
      snapshotDe([
        membro('ativo', timestampHa(1)),
        membro('pendente', null),
        membro('antigo', timestampHa(60)),
      ]),
    );

    const caminhos = pastas().map(p => p.path);
    expect(caminhos).toContain(pasta('ativo'));
    expect(caminhos).toContain(pasta('pendente'));
    expect(caminhos).not.toContain(pasta('antigo'));
    pastas()
      .filter(p => p.path !== pasta('mestre'))
      .forEach(p => expect(p.limite).toBe(CHAT_LIMITE_SECRETAS_MEMBRO));
  });

  it('abre a pasta quando o membro volta para a janela e não duplica listeners', () => {
    abrir();
    const membros = ouvinteDeMembros();
    membros.onNext(snapshotDe([membro('volta', timestampHa(60))]));
    expect(pastas().map(p => p.path)).not.toContain(pasta('volta'));

    membros.onNext(snapshotDe([membro('volta', timestampHa(0))]));
    membros.onNext(snapshotDe([membro('volta', timestampHa(0))]));
    expect(pastas().filter(p => p.path === pasta('volta'))).toHaveLength(1);
  });

  it('o cleanup encerra todos os listeners', () => {
    const parar = abrir();
    ouvinteDeMembros().onNext(snapshotDe([membro('ativo', timestampHa(1))]));
    parar();
    ouvintes.forEach(o => expect(o.unsubscribe).toHaveBeenCalledTimes(1));
  });
});
