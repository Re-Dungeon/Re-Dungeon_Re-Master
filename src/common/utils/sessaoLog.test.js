import { describe, it, expect, vi, beforeEach } from 'vitest';

const addRmSessaoLog = vi.fn();
vi.mock('service/storage', () => ({
  addRmSessaoLog: (...args) => addRmSessaoLog(...args),
}));

import {
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
  formatarHoraEvento,
  ordenarLogsPorDataDesc,
} from './sessaoLog';

describe('registrarEventoSessao', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const CAMPANHA = { id: 'c1', universoId: 'u1', mestreId: 'm1' };

  it('grava o log com campanhaId/universoId/mestreId denormalizados', async () => {
    addRmSessaoLog.mockResolvedValue({ id: 'log1' });

    await registrarEventoSessao(
      CAMPANHA,
      TIPO_EVENTO_SESSAO.CENA_ATUAL,
      'Cena atual: "Chegada"',
    );

    expect(addRmSessaoLog).toHaveBeenCalledWith({
      campanhaId: 'c1',
      universoId: 'u1',
      mestreId: 'm1',
      tipo: TIPO_EVENTO_SESSAO.CENA_ATUAL,
      mensagem: 'Cena atual: "Chegada"',
    });
  });

  it('mescla campos extras estruturados no log quando informados', async () => {
    addRmSessaoLog.mockResolvedValue({ id: 'log1' });

    await registrarEventoSessao(
      CAMPANHA,
      TIPO_EVENTO_SESSAO.CARTA_SORTEADA,
      'Carta sorteada: "Emboscada" (Eventos de Estrada)',
      { cartaId: 'carta1', deck: 'Eventos de Estrada', numero: 1 },
    );

    expect(addRmSessaoLog).toHaveBeenCalledWith({
      campanhaId: 'c1',
      universoId: 'u1',
      mestreId: 'm1',
      tipo: TIPO_EVENTO_SESSAO.CARTA_SORTEADA,
      mensagem: 'Carta sorteada: "Emboscada" (Eventos de Estrada)',
      cartaId: 'carta1',
      deck: 'Eventos de Estrada',
      numero: 1,
    });
  });

  it('não propaga erro quando a escrita falha (best-effort)', async () => {
    addRmSessaoLog.mockRejectedValue(new Error('permission-denied'));

    await expect(
      registrarEventoSessao(CAMPANHA, TIPO_EVENTO_SESSAO.CARTA_SORTEADA, 'x'),
    ).resolves.toBeUndefined();
  });
});

describe('formatarHoraEvento', () => {
  it('formata um Timestamp real (com toDate) como HH:MM', () => {
    const timestamp = { toDate: () => new Date(2026, 6, 30, 9, 5) };
    expect(formatarHoraEvento(timestamp)).toBe('09:05');
  });

  it('formata um Timestamp desserializado ({seconds, nanoseconds}) como HH:MM', () => {
    const data = new Date(2026, 6, 30, 21, 30, 0);
    const timestamp = {
      seconds: Math.floor(data.getTime() / 1000),
      nanoseconds: 0,
    };
    expect(formatarHoraEvento(timestamp)).toBe('21:30');
  });

  it('retorna null para valores que não são Timestamp', () => {
    expect(formatarHoraEvento(null)).toBeNull();
    expect(formatarHoraEvento(undefined)).toBeNull();
    expect(formatarHoraEvento('2026-07-30')).toBeNull();
    expect(formatarHoraEvento({})).toBeNull();
  });
});

describe('ordenarLogsPorDataDesc', () => {
  const timestamp = data => ({ toDate: () => data });

  it('ordena do mais recente para o mais antigo', () => {
    const logs = [
      { id: 'a', createdAt: timestamp(new Date(2026, 6, 30, 10, 0)) },
      { id: 'b', createdAt: timestamp(new Date(2026, 6, 30, 12, 0)) },
      { id: 'c', createdAt: timestamp(new Date(2026, 6, 30, 8, 0)) },
    ];

    expect(ordenarLogsPorDataDesc(logs).map(l => l.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('não muda o array original (imutável) e manda createdAt ausente para o fim', () => {
    const logs = [
      { id: 'sem-data' },
      { id: 'com-data', createdAt: timestamp(new Date(2026, 6, 30, 10, 0)) },
    ];

    const resultado = ordenarLogsPorDataDesc(logs);

    expect(resultado.map(l => l.id)).toEqual(['com-data', 'sem-data']);
    expect(logs.map(l => l.id)).toEqual(['sem-data', 'com-data']);
  });
});
