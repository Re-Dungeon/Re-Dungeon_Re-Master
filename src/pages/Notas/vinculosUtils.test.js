import { describe, expect, it } from 'vitest';
import { montarOpcoesVinculo, validarReferenciaVinculo } from './vinculosUtils';

describe('vínculos', () => {
  it('impede autorrelacionamento e universos incompatíveis', () => {
    expect(
      validarReferenciaVinculo({
        origem: 'n1',
        destino: 'n1',
        universoOrigem: 'u1',
        universoDestino: 'u1',
      }),
    ).toEqual({ ok: false, erro: 'AUTORRELACIONAMENTO' });
    expect(
      validarReferenciaVinculo({
        origem: 'n1',
        destino: 'p1',
        universoOrigem: 'u1',
        universoDestino: 'u2',
      }),
    ).toEqual({ ok: false, erro: 'UNIVERSO_INCOMPATIVEL' });
  });

  it('apresenta somente clones das subcoleções da campanha ativa em três grupos', () => {
    const opcoes = montarOpcoesVinculo({
      campanhaId: 'c1',
      universoId: 'u1',
      mestreId: 'm1',
      npcs: [
        {
          id: 'npc1',
          origemPersonagemId: 'origem-npc',
          nome: 'Rei da Noite',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'm1',
        },
      ],
      jogadores: [
        {
          id: 'jog1',
          origemPersonagemId: 'origem-jog',
          nome: 'Rohan Ishaan',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'm1',
        },
      ],
      criaturas: [
        {
          id: 'cri1',
          origemPersonagemId: 'origem-cri',
          nome: 'Raízes Rastejantes',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'm1',
        },
      ],
      origemId: 'entidade-n1',
    });

    expect(opcoes.map(opcao => opcao.grupo)).toEqual([
      'PERSONAGENS JOGÁVEIS',
      'NPCs',
      'CRIATURAS',
    ]);
  });

  it('remove clones de outra campanha, universo ou mestre e deduplica por origem', () => {
    const opcoes = montarOpcoesVinculo({
      campanhaId: 'c1',
      universoId: 'u1',
      mestreId: 'm1',
      npcs: [
        {
          id: 'npc-a',
          origemPersonagemId: 'origem-npc',
          nome: 'Savitar',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'm1',
        },
        {
          id: 'npc-b',
          origemPersonagemId: 'origem-npc',
          nome: 'Duplicado',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'm1',
        },
        {
          id: 'npc-outra-campanha',
          nome: 'Outra campanha',
          campanhaId: 'c2',
          universoId: 'u1',
          mestreId: 'm1',
        },
        {
          id: 'npc-outro-universo',
          nome: 'Outro universo',
          campanhaId: 'c1',
          universoId: 'u2',
          mestreId: 'm1',
        },
        {
          id: 'npc-outro-mestre',
          nome: 'Outro mestre',
          campanhaId: 'c1',
          universoId: 'u1',
          mestreId: 'm2',
        },
      ],
      jogadores: [],
      criaturas: [],
    });

    expect(opcoes).toHaveLength(1);
    expect(opcoes[0].nome).toBe('Savitar');
  });
});
