import { describe, expect, it } from 'vitest';

import {
  IMAGEM_UPLOAD_MAX_BYTES,
  arrasteTemArquivos,
  dimensoesReduzidas,
  formatoDeSaida,
  primeiraImagem,
  validarArquivoImagem,
  validarTamanhoImagem,
} from './imagemUpload';

const arquivo = (nome, type, size = 10) => ({ name: nome, type, size });

describe('validarArquivoImagem', () => {
  it('aceita imagens e recusa o resto', () => {
    expect(validarArquivoImagem(arquivo('a.png', 'image/png')).ok).toBe(true);
    expect(validarArquivoImagem(arquivo('a.gif', 'image/gif')).ok).toBe(true);
    const pdf = validarArquivoImagem(arquivo('a.pdf', 'application/pdf'));
    expect(pdf.ok).toBe(false);
    expect(pdf.erro).toMatch(/arquivo de imagem/);
    expect(validarArquivoImagem(null).ok).toBe(false);
  });
});

describe('validarTamanhoImagem', () => {
  it('aceita até o limite e recusa acima, dizendo o tamanho', () => {
    expect(validarTamanhoImagem({ size: IMAGEM_UPLOAD_MAX_BYTES }).ok).toBe(true);
    const grande = validarTamanhoImagem({ size: 12 * 1024 * 1024 });
    expect(grande.ok).toBe(false);
    expect(grande.erro).toBe('A imagem tem 12 MB; o limite é 10 MB.');
  });
});

describe('dimensoesReduzidas', () => {
  it('não mexe no que já cabe', () => {
    expect(dimensoesReduzidas(1920, 1080)).toEqual({ largura: 1920, altura: 1080, reduziu: false });
    expect(dimensoesReduzidas(2048, 100)).toEqual({ largura: 2048, altura: 100, reduziu: false });
  });

  it('reduz pelo lado maior mantendo a proporção', () => {
    expect(dimensoesReduzidas(4096, 2048)).toEqual({ largura: 2048, altura: 1024, reduziu: true });
    expect(dimensoesReduzidas(3000, 6000)).toEqual({ largura: 1024, altura: 2048, reduziu: true });
    expect(dimensoesReduzidas(10000, 1, 2048).altura).toBe(1);
  });
});

describe('formatoDeSaida', () => {
  it('GIF fica intacto, PNG continua PNG e o resto vira JPEG', () => {
    expect(formatoDeSaida('image/gif')).toBeNull();
    expect(formatoDeSaida('image/png').mime).toBe('image/png');
    expect(formatoDeSaida('image/jpeg')).toEqual({ mime: 'image/jpeg', qualidade: 0.85 });
    expect(formatoDeSaida('image/webp').mime).toBe('image/jpeg');
  });
});

describe('primeiraImagem', () => {
  const item = arq => ({ kind: 'file', getAsFile: () => arq });

  it('pega a primeira imagem dos itens (colar) e avisa quando há várias', () => {
    const a = arquivo('a.png', 'image/png');
    const b = arquivo('b.jpg', 'image/jpeg');
    const texto = { kind: 'string', getAsFile: () => null };
    expect(primeiraImagem({ items: [texto, item(a), item(b)] })).toEqual({ arquivo: a, varias: true });
    expect(primeiraImagem({ items: [texto, item(a)] })).toEqual({ arquivo: a, varias: false });
  });

  it('usa `files` (soltar) quando os itens não têm arquivo, e ignora o que não é imagem', () => {
    const pdf = arquivo('a.pdf', 'application/pdf');
    const img = arquivo('b.webp', 'image/webp');
    expect(primeiraImagem({ items: [], files: [pdf, img] })).toEqual({ arquivo: img, varias: false });
    expect(primeiraImagem([img])).toEqual({ arquivo: img, varias: false });
  });

  it('sem imagem devolve null', () => {
    expect(primeiraImagem({ items: [{ kind: 'string', getAsFile: () => null }] })).toEqual({
      arquivo: null,
      varias: false,
    });
    expect(primeiraImagem(null).arquivo).toBeNull();
  });
});

describe('arrasteTemArquivos', () => {
  it('só considera arrastes com arquivos', () => {
    expect(arrasteTemArquivos({ types: ['Files'] })).toBe(true);
    expect(arrasteTemArquivos({ types: ['text/plain'] })).toBe(false);
    expect(arrasteTemArquivos(null)).toBe(false);
  });
});
