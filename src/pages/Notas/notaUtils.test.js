import { describe, expect, it } from 'vitest';
import {
  getEntityTypeOptions,
  getNotaCapa,
  normalizeNotaTags,
  normalizeEntityTypeName,
  matchEntityType,
  buildEntityTypeRecord,
  LEGACY_ENTITY_TYPES,
} from './notaUtils';

describe('getNotaCapa', () => {
  it('prioriza a imagem da entidade e usa o mesmo valor do card', () => {
    const nota = {
      id: 'n1',
      titulo: 'CardFlux',
      imagemUrl: 'https://cdn.example.com/nota-capa.jpg',
      linkImagem: 'https://cdn.example.com/nota-link.jpg',
      foto: 'https://cdn.example.com/nota-foto.jpg',
      image: 'https://cdn.example.com/nota-image.jpg',
      capa: 'https://cdn.example.com/nota-capa-fallback.jpg',
    };

    expect(getNotaCapa(nota)).toBe('https://cdn.example.com/nota-capa.jpg');
  });

  it('faz fallback para a imagem da cena vinculada quando a entidade não tem capa', () => {
    const cena = {
      id: 'c1',
      titulo: 'Castelo',
      imagemUrl: 'https://cdn.example.com/cena.jpg',
    };

    expect(getNotaCapa(cena)).toBe('https://cdn.example.com/cena.jpg');
  });
});

describe('normalizeNotaTags', () => {
  it('aceita tags em array e em string, preservando compatibilidade com registros antigos', () => {
    expect(normalizeNotaTags([' magia ', 'luta ', ''])).toEqual(['magia', 'luta']);
    expect(normalizeNotaTags(' magia, luta ,  mistério ')).toEqual(['magia', 'luta', 'mistério']);
    expect(normalizeNotaTags(undefined)).toEqual([]);
  });
});

describe('tipos personalizados', () => {
  it('normaliza nomes de tipos para impedir duplicação por capitalização e espaços', () => {
    expect(normalizeEntityTypeName(' Reino  ')).toBe('reino');
    expect(normalizeEntityTypeName('reino')).toBe('reino');
    expect(matchEntityType('Reino', ' reino ')).toBe(true);
    expect(matchEntityType('Raça Antiga', 'raca antiga')).toBe(true);
  });

  it('deriva os tipos do universo a partir de dados reais, sem depender de lista fixa', () => {
    expect(getEntityTypeOptions([{ name: 'Deus Antigo' }, { name: 'Reino' }]))
      .toEqual(['Deus Antigo', 'Reino']);
    expect(getEntityTypeOptions([], [{ tipo: 'Divindade' }, { tipo: 'Reino' }]))
      .toEqual(['Divindade', 'Reino']);
    expect(getEntityTypeOptions([], [])).toEqual([]);
    expect(LEGACY_ENTITY_TYPES).toContain('Divindade');
  });

  it('constrói o registro de tipo sem campos undefined para não quebrar o Firestore', () => {
    const semCamposOpcionais = buildEntityTypeRecord(' Facção ');
    expect(semCamposOpcionais).toMatchObject({
      name: 'Facção',
      normalizedName: 'faccao',
    });
    expect(Object.keys(semCamposOpcionais)).not.toContain('id');
    expect(Object.keys(semCamposOpcionais)).not.toContain('createdAt');
    expect(Object.keys(semCamposOpcionais)).not.toContain('updatedAt');

    const comEscopo = buildEntityTypeRecord('Item', { universoId: 'u1', mestreId: 'm1' });
    expect(comEscopo).toMatchObject({
      name: 'Item',
      normalizedName: 'item',
      universoId: 'u1',
      mestreId: 'm1',
    });
    expect(Object.keys(comEscopo)).not.toContain('createdAt');
    expect(Object.keys(comEscopo)).not.toContain('updatedAt');
  });
});
