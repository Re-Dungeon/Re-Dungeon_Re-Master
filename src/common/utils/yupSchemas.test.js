import { describe, it, expect } from 'vitest';
import {
  nomeSchema,
  campoCurtoSchema,
  descricaoSchema,
  urlImagemSchema,
  textoLongoSchema,
  NOME_MAX,
  CAMPO_CURTO_MAX,
  DESCRICAO_MAX,
  TEXTO_LONGO_MAX,
} from './yupSchemas';

describe('nomeSchema', () => {
  it('rejeita string vazia', async () => {
    await expect(nomeSchema.validate('')).rejects.toThrow('Nome é obrigatório');
  });

  it('rejeita string só com espaços (trim + required)', async () => {
    await expect(nomeSchema.validate('   ')).rejects.toThrow(
      'Nome é obrigatório',
    );
  });

  it(`rejeita string com mais de ${NOME_MAX} caracteres`, async () => {
    await expect(nomeSchema.validate('a'.repeat(NOME_MAX + 1))).rejects.toThrow(
      `no máximo ${NOME_MAX}`,
    );
  });

  it('aceita um nome válido', async () => {
    await expect(nomeSchema.validate('Elfo')).resolves.toBe('Elfo');
  });
});

describe('campoCurtoSchema', () => {
  it('é opcional (aceita string vazia)', async () => {
    await expect(campoCurtoSchema.validate('')).resolves.toBe('');
  });

  it(`rejeita string com mais de ${CAMPO_CURTO_MAX} caracteres`, async () => {
    await expect(
      campoCurtoSchema.validate('a'.repeat(CAMPO_CURTO_MAX + 1)),
    ).rejects.toThrow(`no máximo ${CAMPO_CURTO_MAX}`);
  });
});

describe('descricaoSchema', () => {
  it('é opcional (aceita string vazia)', async () => {
    await expect(descricaoSchema.validate('')).resolves.toBe('');
  });

  it(`rejeita string com mais de ${DESCRICAO_MAX} caracteres`, async () => {
    await expect(
      descricaoSchema.validate('a'.repeat(DESCRICAO_MAX + 1)),
    ).rejects.toThrow(`no máximo ${DESCRICAO_MAX}`);
  });
});

describe('urlImagemSchema', () => {
  it('aceita string vazia (campo opcional)', async () => {
    await expect(urlImagemSchema.validate('')).resolves.toBe('');
  });

  it('rejeita uma string que não é URL', async () => {
    await expect(urlImagemSchema.validate('não-é-url')).rejects.toThrow(
      'Deve ser uma URL válida',
    );
  });

  it('aceita uma URL válida', async () => {
    await expect(
      urlImagemSchema.validate('https://example.com/imagem.png'),
    ).resolves.toBe('https://example.com/imagem.png');
  });
});

describe('textoLongoSchema', () => {
  it('é opcional (aceita string vazia)', async () => {
    await expect(textoLongoSchema.validate('')).resolves.toBe('');
  });

  it(`rejeita string com mais de ${TEXTO_LONGO_MAX} caracteres`, async () => {
    await expect(
      textoLongoSchema.validate('a'.repeat(TEXTO_LONGO_MAX + 1)),
    ).rejects.toThrow(`no máximo ${TEXTO_LONGO_MAX}`);
  });

  it('aceita um texto longo dentro do limite', async () => {
    const texto = 'a'.repeat(TEXTO_LONGO_MAX);
    await expect(textoLongoSchema.validate(texto)).resolves.toBe(texto);
  });
});
