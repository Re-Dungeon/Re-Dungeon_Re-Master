import { describe, it, expect, beforeEach } from 'vitest';
import {
  VALIDACAO_EXPLORACAO,
  validarConfiguracaoExploracao,
  criarMatrizQuadrantes,
  calcularDensidadeAcontecimento,
  filtrarCartasElegiveisExploracao,
  sortearCartaExploracao,
  gerarExploracaoGrid,
  revelarQuadranteExploracao,
  registrarResultadoQuadrante,
  substituirCartaQuadrante,
  removerCartaQuadrante,
  serializarExploracaoGrid,
  recuperarExploracaoGrid,
  getEstadoQuadrante,
  sanitizarExploracaoParaPersistencia,
  localizarArrayAninhado,
} from './exploracaoGrid';

const CARTAS_BASE = [
  {
    id: 'a',
    nome: 'A',
    deck: 'D1',
    peso: 8,
    ativo: true,
    cooldownRestante: 0,
    tags: ['floresta'],
  },
  {
    id: 'b',
    nome: 'B',
    deck: 'D1',
    peso: 2,
    ativo: true,
    cooldownRestante: 0,
    tags: ['floresta'],
  },
  {
    id: 'c',
    nome: 'C',
    deck: 'D2',
    peso: 0,
    ativo: true,
    cooldownRestante: 0,
    tags: ['deserto'],
  },
  {
    id: 'd',
    nome: 'D',
    deck: 'D1',
    peso: 5,
    ativo: true,
    cooldownRestante: 1,
    tags: ['floresta'],
  },
  {
    id: 'e',
    nome: 'E',
    deck: 'D1',
    peso: 4,
    ativo: true,
    cooldownRestante: 0,
    tags: ['ruina'],
  },
];

describe('exploracaoGrid', () => {
  beforeEach(() => {
    // sem side-effects globais
  });

  it('gera matrizes com dimensões diferentes', () => {
    const grid = criarMatrizQuadrantes({ linhas: 2, colunas: 3 });

    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(3);
    expect(grid[0][0]).toMatchObject({ x: 0, y: 0, estado: 'oculto' });
    expect(grid[1][2]).toMatchObject({ x: 2, y: 1, estado: 'oculto' });
  });

  it('calcula densidade 0% e 100%', () => {
    expect(calcularDensidadeAcontecimento({ total: 12, densidade: 0 })).toBe(0);
    expect(calcularDensidadeAcontecimento({ total: 12, densidade: 100 })).toBe(12);
    expect(calcularDensidadeAcontecimento({ total: 12, densidade: 50 })).toBe(6);
  });

  it('usa peso 0 como carta não elegível para sorteio automático', () => {
    const elegiveis = filtrarCartasElegiveisExploracao({
      cartas: CARTAS_BASE,
      baralhos: ['D1'],
      repetir: false,
      respeitarCooldown: true,
      listaCartasUsadas: [],
    });

    expect(elegiveis.map(c => c.id)).toEqual(['a', 'b', 'e']);
  });

  it('faz sorteio ponderado com pesos relativos', () => {
    const pool = [{ id: 'a', peso: 8 }, { id: 'b', peso: 2 }];
    const resultados = Array.from({ length: 300 }, () =>
      sortearCartaExploracao({ cartas: pool, cartasUsadas: [] }),
    );
    const vezesA = resultados.filter(c => c.id === 'a').length;

    // O sorteio é probabilístico; a média esperada é ~80% para 'a', mas uma
    // amostra pequena pode cair abaixo do limite de 150 em CI. Mantemos um
    // limiar suficientemente acima da frequência de um peso invertido sem tornar
    // o teste frágil.
    expect(vezesA).toBeGreaterThan(200);
  });

  it('não trava quando não há cartas disponíveis', () => {
    const validacao = validarConfiguracaoExploracao({
      nome: 'Exploração',
      baralhos: ['D3'],
      linhas: 4,
      colunas: 4,
      densidade: 50,
      modo: 'predefinida',
      repetir: false,
    });

    expect(validacao.valida).toBe(true);
    expect(validacao.aviso).toContain('Nenhuma carta');
  });

  it('respeita repetição permitida e proibida', () => {
    const withRepeat = filtrarCartasElegiveisExploracao({
      cartas: CARTAS_BASE,
      baralhos: ['D1'],
      repetir: true,
      respeitarCooldown: false,
      listaCartasUsadas: ['a'],
    });

    expect(withRepeat.map(c => c.id)).toContain('a');

    const withoutRepeat = filtrarCartasElegiveisExploracao({
      cartas: CARTAS_BASE,
      baralhos: ['D1'],
      repetir: false,
      respeitarCooldown: false,
      listaCartasUsadas: ['a'],
    });

    expect(withoutRepeat.map(c => c.id)).not.toContain('a');
  });

  it('gera exploração em modo predefinido', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 1',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 50,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: true,
      cartas: CARTAS_BASE,
    });

    expect(exploracao.nome).toBe('Exp 1');
    expect(exploracao.quadrantes).toHaveLength(2);
    expect(exploracao.quadrantes[0][0]).toHaveProperty('estado');
  });

  it('gera exploração em modo dinâmico e apenas revela ao revelar o quadrante', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 2',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 100,
      modo: 'dinamica',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    expect(exploracao.quadrantes[0][0].estado).toBe('oculto');
    const revisado = revelarQuadranteExploracao(exploracao, { x: 0, y: 0 });
    expect(revisado.quadrantes[0][0].estado).toBe('revelado');
    expect(revisado.quadrantes[0][0].cartaId).toBeTruthy();
  });

  it('preserva eventos fixos em modo híbrido', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 3',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 100,
      modo: 'hibrida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
      quadrantesFixos: [{ x: 0, y: 0, cartaId: 'e' }],
    });

    expect(exploracao.quadrantes[0][0].cartaId).toBe('e');
    expect(exploracao.quadrantes[0][0].fixo).toBe(true);
  });

  it('não sorteia de novo depois da primeira revelação', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 4',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 100,
      modo: 'dinamica',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    const primeiro = revelarQuadranteExploracao(exploracao, { x: 0, y: 0 });
    const segundo = revelarQuadranteExploracao(primeiro, { x: 0, y: 0 });

    expect(segundo.quadrantes[0][0].estado).toBe('revelado');
    expect(segundo.quadrantes[0][0].cartaId).toBe(primeiro.quadrantes[0][0].cartaId);
  });

  it('registra resultado sem substituir o estado visual do quadrante', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 5',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 1,
      colunas: 1,
      densidade: 100,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    const comResultado = registrarResultadoQuadrante(exploracao, 0, 0, {
      resultado: 'falha',
      observacao: 'concluído',
    });

    expect(comResultado.quadrantes[0][0].resultado).toBe('falha');
    expect(comResultado.quadrantes[0][0].observacao).toBe('concluído');
    expect(comResultado.quadrantes[0][0].estado).toBe('revelado');
  });

  it('substitui e remove manualmente cartas do quadrante', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 6',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 1,
      colunas: 1,
      densidade: 100,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    const comCarta = substituirCartaQuadrante(exploracao, { x: 0, y: 0 }, 'e');
    expect(comCarta.quadrantes[0][0].cartaId).toBe('e');

    const removido = removerCartaQuadrante(comCarta, { x: 0, y: 0 });
    expect(removido.quadrantes[0][0].cartaId).toBeNull();
    expect(removido.quadrantes[0][0].estado).toBe('vazio');
  });

  it('mantém o estado do quadrante consistente usando getEstadoQuadrante', () => {
    const quadrante = { estado: 'em_andamento', bloqueado: true };
    expect(getEstadoQuadrante(quadrante)).toMatchObject({ estado: 'em_andamento' });
  });

  it('serializa e recupera uma exploração', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 7',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 50,
      modo: 'predefinida',
      repetir: true,
      respeitarCooldown: true,
      cartas: CARTAS_BASE,
    });

    const payload = serializarExploracaoGrid(exploracao);
    const recuperada = recuperarExploracaoGrid(payload);

    expect(recuperada.nome).toBe('Exp 7');
    expect(recuperada.quadrantes).toHaveLength(2);
    expect(recuperada.status).toBe('ativa');
  });

  it('valida configurações inválidas', () => {
    const resultado = validarConfiguracaoExploracao({
      nome: '',
      baralhos: [],
      linhas: 1,
      colunas: 0,
      densidade: 50,
      modo: 'predefinida',
      repetir: false,
    });

    expect(resultado.valida).toBe(false);
    expect(VALIDACAO_EXPLORACAO.NOME).toBe('nome');
  });

  it('isola a exploração do sorteador tradicional', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 8',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 1,
      colunas: 1,
      densidade: 100,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    expect(exploracao.estadoSorteioTradicional).toBeUndefined();
    expect(exploracao.configuracao).toMatchObject({
      origem: 'exploracao-grid',
    });
  });

  it('remove valores undefined antes da persistência sem perder zero e false', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 9',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 2,
      colunas: 2,
      densidade: 50,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    const payload = sanitizarExploracaoParaPersistencia({
      ...exploracao,
      quadrantes: exploracao.quadrantes.map(linha =>
        linha.map(quadrante => ({
          ...quadrante,
          observacao: undefined,
          resultado: undefined,
          revelaEm: undefined,
          anotacao: undefined,
          bloqueado: false,
          fixo: false,
          comum: false,
          cartaId: quadrante.cartaId ?? null,
        })),
      ),
      configuracao: {
        ...exploracao.configuracao,
        densidade: 0,
        repetir: false,
      },
      extraOpcional: undefined,
    });

    expect(JSON.stringify(payload)).not.toContain('undefined');
    expect(payload.configuracao.repetir).toBe(false);
    expect(payload.configuracao.densidade).toBe(0);
    const primeiroQuadrante = payload.quadrantes.find(
      quadrante => quadrante.linha === 0 && quadrante.coluna === 0,
    );
    expect(primeiroQuadrante.observacao).toBe('');
    expect(primeiroQuadrante.resultado).toBeNull();
  });

  it('serializa quadrantes em lista plana para Firestore e reconstrói a matriz ao recuperar', () => {
    const exploracao = gerarExploracaoGrid({
      nome: 'Exp 10',
      mestreId: 'm1',
      universoId: 'u1',
      campanhaId: 'c1',
      baralhos: ['D1'],
      linhas: 3,
      colunas: 2,
      densidade: 50,
      modo: 'predefinida',
      repetir: false,
      respeitarCooldown: false,
      cartas: CARTAS_BASE,
    });

    const payload = sanitizarExploracaoParaPersistencia(exploracao, {
      exigirCamposObrigatorios: true,
    });

    expect(Array.isArray(payload.quadrantes)).toBe(true);
    expect(Array.isArray(payload.quadrantes[0])).toBe(false);
    expect(payload.quadrantes[0]).toMatchObject({
      id: '0-0',
      linha: 0,
      coluna: 0,
      estado: expect.any(String),
    });

    const restaurada = recuperarExploracaoGrid(payload);
    expect(restaurada.quadrantes).toHaveLength(3);
    expect(restaurada.quadrantes[0]).toHaveLength(2);
    expect(restaurada.quadrantes[0][0]).toMatchObject({
      linha: 0,
      coluna: 0,
      estado: expect.any(String),
    });
  });

  it('detecta arrays diretamente aninhados com caminho exato', () => {
    const payload = {
      nome: 'Exp',
      quadrantes: [[{ estado: 'oculto' }]],
      historico: [{ tipo: 'evento', passos: [['A']] }],
    };

    const problema = localizarArrayAninhado(payload, 'payload');

    expect(problema).toMatch(/quadrantes|historico/i);
  });

  it('rejeita exploração inválida com campos obrigatórios ausentes', () => {
    expect(() =>
      sanitizarExploracaoParaPersistencia({
        nome: 'Sem referência',
        campanhaId: 'c1',
        quadrantes: [[{ estado: 'oculto' }]],
      }),
    ).toThrow(/mestreId|universoId|baralhos|modo/i);
  });
});
