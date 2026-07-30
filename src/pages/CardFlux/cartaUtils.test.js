import { describe, it, expect, vi, beforeEach } from 'vitest';

const addRmCardfluxEstado = vi.fn();
const updateRmCardfluxEstado = vi.fn();
vi.mock('service/storage', () => ({
  addRmCardfluxEstado: (...args) => addRmCardfluxEstado(...args),
  updateRmCardfluxEstado: (...args) => updateRmCardfluxEstado(...args),
}));

import {
  mesclarEstadoCartas,
  calcularTotalCartas,
  filtrarPoolValido,
  sortearCartaPonderada,
  definirEstadoCarta,
  marcarCartaComprada,
  descartarCarta,
  retornarCartaAoDeck,
  decrementarCooldownsOutrasCartas,
  limparCooldownsBaralho,
  reembaralharBaralho,
} from './cartaUtils';

const CAMPANHA = { id: 'c1', universoId: 'u1', mestreId: 'm1' };

describe('mesclarEstadoCartas', () => {
  it('preenche estadoNoBaralho/cooldownRestante default quando não há doc de estado', () => {
    const resultado = mesclarEstadoCartas(
      [{ id: 'carta1', nome: 'Emboscada' }],
      [],
    );
    expect(resultado[0]).toMatchObject({
      estadoNoBaralho: 'no_baralho',
      estadoDocId: null,
      cooldownRestante: 0,
    });
  });

  it('usa os valores do doc de estado quando existe', () => {
    const resultado = mesclarEstadoCartas(
      [{ id: 'carta1', nome: 'Emboscada' }],
      [
        {
          id: 'estado1',
          cartaId: 'carta1',
          estadoNoBaralho: 'comprada',
          cooldownRestante: 2,
        },
      ],
    );
    expect(resultado[0]).toMatchObject({
      estadoNoBaralho: 'comprada',
      estadoDocId: 'estado1',
      cooldownRestante: 2,
    });
  });
});

describe('calcularTotalCartas', () => {
  it('soma distância, ritmo, sorte e atraso, subtrai acelerar', () => {
    expect(
      calcularTotalCartas({
        distanciaBase: 4,
        ritmo: 3,
        modificadorSorte: 1,
        atraso: 2,
        acelerar: 1,
      }),
    ).toBe(9);
  });

  it('nunca retorna menos que 1', () => {
    expect(
      calcularTotalCartas({
        distanciaBase: 1,
        ritmo: -6,
        modificadorSorte: -5,
        atraso: 0,
        acelerar: 10,
      }),
    ).toBe(1);
  });
});

describe('filtrarPoolValido', () => {
  const CARTAS = [
    { id: 'c1', estadoNoBaralho: 'no_baralho', intensidade: 5 },
    { id: 'c2', estadoNoBaralho: 'comprada', intensidade: 8 },
    { id: 'c3', estadoNoBaralho: 'no_baralho', ativa: false, intensidade: 9 },
    {
      id: 'c4',
      estadoNoBaralho: 'no_baralho',
      cooldownRestante: 2,
      intensidade: 9,
    },
    { id: 'c5', estadoNoBaralho: 'no_baralho', intensidade: 1 },
    { id: 'c6', estadoNoBaralho: 'no_baralho' },
  ];

  it('mantém só cartas no_baralho, ativas, sem cooldown e acima da intensidade mínima', () => {
    const pool = filtrarPoolValido(CARTAS, 3);
    expect(pool.map(c => c.id)).toEqual(['c1', 'c6']);
  });

  it('não filtra por intensidade quando o campo não está cadastrado na carta', () => {
    const pool = filtrarPoolValido(
      [{ id: 'sem-intensidade', estadoNoBaralho: 'no_baralho' }],
      10,
    );
    expect(pool.map(c => c.id)).toEqual(['sem-intensidade']);
  });
});

describe('sortearCartaPonderada', () => {
  it('sempre retorna a única carta do pool', () => {
    const carta = { id: 'unica', peso: 5 };
    expect(sortearCartaPonderada([carta])).toBe(carta);
  });

  it('favorece a carta com peso maior ao longo de várias amostras', () => {
    const leve = { id: 'leve', peso: 1 };
    const pesada = { id: 'pesada', peso: 99 };
    const resultados = Array.from({ length: 200 }, () =>
      sortearCartaPonderada([leve, pesada]),
    );
    const vezesPesada = resultados.filter(c => c.id === 'pesada').length;
    expect(vezesPesada).toBeGreaterThan(150);
  });

  it('trata peso ausente/inválido como 1', () => {
    const carta = { id: 'sem-peso' };
    expect(sortearCartaPonderada([carta])).toBe(carta);
  });
});

describe('definirEstadoCarta e derivados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria o doc de estado quando a carta ainda não tem um', async () => {
    addRmCardfluxEstado.mockResolvedValue({ id: 'novo' });
    await definirEstadoCarta(
      { id: 'carta1', estadoDocId: null },
      'comprada',
      CAMPANHA,
    );
    expect(addRmCardfluxEstado).toHaveBeenCalledWith({
      campanhaId: 'c1',
      universoId: 'u1',
      mestreId: 'm1',
      cartaId: 'carta1',
      estadoNoBaralho: 'comprada',
    });
  });

  it('atualiza o doc existente quando a carta já tem estadoDocId', async () => {
    await definirEstadoCarta(
      { id: 'carta1', estadoDocId: 'estado1' },
      'descartada',
      CAMPANHA,
    );
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
      estadoNoBaralho: 'descartada',
    });
    expect(addRmCardfluxEstado).not.toHaveBeenCalled();
  });

  it('marcarCartaComprada aplica o cooldown configurado na carta', async () => {
    await marcarCartaComprada(
      { id: 'carta1', estadoDocId: 'estado1', cooldown: 3 },
      CAMPANHA,
    );
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
      estadoNoBaralho: 'comprada',
      cooldownRestante: 3,
    });
  });

  it('marcarCartaComprada usa cooldown 0 quando a carta não define cooldown', async () => {
    await marcarCartaComprada(
      { id: 'carta1', estadoDocId: 'estado1' },
      CAMPANHA,
    );
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
      estadoNoBaralho: 'comprada',
      cooldownRestante: 0,
    });
  });

  it('descartarCarta grava estadoNoBaralho descartada', async () => {
    await descartarCarta({ id: 'carta1', estadoDocId: 'estado1' }, CAMPANHA);
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
      estadoNoBaralho: 'descartada',
    });
  });

  it('retornarCartaAoDeck volta pro pool e zera o cooldown', async () => {
    await retornarCartaAoDeck(
      { id: 'carta1', estadoDocId: 'estado1' },
      CAMPANHA,
    );
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('estado1', {
      estadoNoBaralho: 'no_baralho',
      cooldownRestante: 0,
    });
  });
});

describe('decrementarCooldownsOutrasCartas', () => {
  beforeEach(() => vi.clearAllMocks());

  it('decrementa só cartas com cooldown ativo, ignorando a sorteada e as sem doc', async () => {
    const cartas = [
      { id: 'sorteada', estadoDocId: 'e1', cooldownRestante: 2 },
      { id: 'com-cooldown', estadoDocId: 'e2', cooldownRestante: 3 },
      { id: 'sem-cooldown', estadoDocId: 'e3', cooldownRestante: 0 },
      { id: 'sem-doc', estadoDocId: null, cooldownRestante: 2 },
    ];
    await decrementarCooldownsOutrasCartas(cartas, 'sorteada');
    expect(updateRmCardfluxEstado).toHaveBeenCalledTimes(1);
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('e2', {
      cooldownRestante: 2,
    });
  });
});

describe('limparCooldownsBaralho', () => {
  beforeEach(() => vi.clearAllMocks());

  it('zera cooldownRestante só das cartas que têm cooldown pendente', async () => {
    const cartas = [
      { id: 'c1', estadoDocId: 'e1', cooldownRestante: 1 },
      { id: 'c2', estadoDocId: 'e2', cooldownRestante: 0 },
    ];
    await limparCooldownsBaralho(cartas);
    expect(updateRmCardfluxEstado).toHaveBeenCalledTimes(1);
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('e1', {
      cooldownRestante: 0,
    });
  });
});

describe('reembaralharBaralho', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devolve ao pool só as cartas que não estão no_baralho ou têm cooldown', async () => {
    const cartas = [
      { id: 'c1', estadoDocId: 'e1', estadoNoBaralho: 'comprada' },
      { id: 'c2', estadoDocId: 'e2', estadoNoBaralho: 'descartada' },
      {
        id: 'c3',
        estadoDocId: 'e3',
        estadoNoBaralho: 'no_baralho',
        cooldownRestante: 1,
      },
      { id: 'c4', estadoDocId: 'e4', estadoNoBaralho: 'no_baralho' },
    ];
    await reembaralharBaralho(cartas, CAMPANHA);
    expect(updateRmCardfluxEstado).toHaveBeenCalledTimes(3);
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('e1', {
      estadoNoBaralho: 'no_baralho',
      cooldownRestante: 0,
    });
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('e2', {
      estadoNoBaralho: 'no_baralho',
      cooldownRestante: 0,
    });
    expect(updateRmCardfluxEstado).toHaveBeenCalledWith('e3', {
      estadoNoBaralho: 'no_baralho',
      cooldownRestante: 0,
    });
  });
});
