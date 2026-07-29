import { describe, it, expect } from 'vitest';
import { getTipoPersonagem, TIPO_PERSONAGEM_PADRAO } from './personagemTipo';

describe('getTipoPersonagem', () => {
  it('retorna o campo tipo quando presente', () => {
    expect(getTipoPersonagem({ tipo: 'NPC' })).toBe('NPC');
    expect(getTipoPersonagem({ tipo: 'Criatura' })).toBe('Criatura');
  });

  it('assume Personagem Jogável quando o campo tipo não existe', () => {
    expect(getTipoPersonagem({ nome: 'Sem tipo' })).toBe(TIPO_PERSONAGEM_PADRAO);
  });

  it('assume Personagem Jogável quando o personagem é nulo/indefinido', () => {
    expect(getTipoPersonagem(null)).toBe(TIPO_PERSONAGEM_PADRAO);
    expect(getTipoPersonagem(undefined)).toBe(TIPO_PERSONAGEM_PADRAO);
  });
});
