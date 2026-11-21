import { describe, expect, it } from 'vitest';
import {
  getEntityTypeOptions,
  getNotaCapa,
  getNotaRetrato,
  normalizarNotaEntidade,
  normalizeNotaTags,
  normalizeEntityAttributes,
  normalizeEntityTypeName,
  matchEntityType,
  buildEntityTypeRecord,
  LEGACY_ENTITY_TYPES,
  renderNotaContentHtml,
  sanitizeRichHtml,
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
    expect(normalizeNotaTags([' magia ', 'luta ', ''])).toEqual([
      'magia',
      'luta',
    ]);
    expect(normalizeNotaTags(' magia, luta ,  mistério ')).toEqual([
      'magia',
      'luta',
      'mistério',
    ]);
    expect(normalizeNotaTags(undefined)).toEqual([]);
  });
});

describe('normalizeEntityAttributes', () => {
  it('normaliza atributos em objeto e evita duplicidade entre formatos legados', () => {
    expect(
      normalizeEntityAttributes([
        { Força: 18, Tipo: 'Humano' },
        [
          { nome: 'Força', valor: 20 },
          { name: 'Destino', value: 'Rei' },
          { nome: '', valor: 'ignorado' },
        ],
      ]),
    ).toEqual([
      { nome: 'Força', valor: '18' },
      { nome: 'Tipo', valor: 'Humano' },
      { nome: 'Destino', valor: 'Rei' },
    ]);
  });

  it('retorna lista vazia para fontes vazias ou inválidas', () => {
    expect(normalizeEntityAttributes([null, undefined, 'inválido'])).toEqual(
      [],
    );
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
    expect(
      getEntityTypeOptions([{ name: 'Deus Antigo' }, { name: 'Reino' }]),
    ).toEqual(['Deus Antigo', 'Reino']);
    expect(
      getEntityTypeOptions([], [{ tipo: 'Divindade' }, { tipo: 'Reino' }]),
    ).toEqual(['Divindade', 'Reino']);
    expect(getEntityTypeOptions([], [])).toEqual([]);
    expect(
      getEntityTypeOptions(
        [],
        [{ tipo: 'Divindade' }, { tipo: 'Criatura' }, { tipo: 'Criatura' }],
      ),
    ).toEqual(['Criatura', 'Divindade']);
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

    const comEscopo = buildEntityTypeRecord('Item', {
      universoId: 'u1',
      mestreId: 'm1',
    });
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

describe('conteúdo rico legado', () => {
  it('interpreta Markdown antigo em HTML sem perder títulos, listas e links', () => {
    const html = renderNotaContentHtml(
      '# Reino\n\n**Texto forte**\n\n- Leste\n- Oeste\n\n[Mapa](https://example.com/mapa)',
    );

    expect(html).toContain('<h1>Reino</h1>');
    expect(html).toContain('<strong>Texto forte</strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Leste</li>');
    expect(html).toContain('href="https://example.com/mapa"');
  });

  it('converte divisores Markdown em hr válido', () => {
    expect(
      renderNotaContentHtml('Texto antes\n\n---\n\nTexto depois'),
    ).toContain('<hr />');
  });

  it('preserva HTML permitido e remove scripts e atributos perigosos', () => {
    const html = sanitizeRichHtml(
      '<h2>Capítulo</h2><p onclick="x">Texto</p><hr /><script>bad()</script><a href="javascript:bad">Link</a>',
    );

    expect(html).toContain('<h2>Capítulo</h2>');
    expect(html).toContain('<hr>');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('javascript:');
  });

  it('preserva links http/https com abertura segura em nova aba', () => {
    const html = sanitizeRichHtml(
      '<p><a href="https://example.com/mapa">Mapa seguro</a> <a href="http://example.com">HTTP</a></p>',
    );

    expect(html).toContain('href="https://example.com/mapa"');
    expect(html).toContain('href="http://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('preserva cores HEX de 3 ou 6 dígitos e RGB/RGBA seguros', () => {
    const html = sanitizeRichHtml(
      '<p><span style="color:#abc; background-color:#FFF3B0">A</span><span style="color:rgb(230, 57, 70); background-color:rgba(255, 243, 176, 0.8)">B</span></p>',
    );

    expect(html).toContain('color:#abc');
    expect(html).toContain('background-color:#FFF3B0');
    expect(html).toContain('color:rgb(230, 57, 70)');
    expect(html).toContain('background-color:rgba(255, 243, 176, 0.8)');
  });

  it('preserva cor e realce após serialização e leitura', () => {
    const salvo = sanitizeRichHtml(
      '<p><span style="color:#E63946; background-color:#FFF3B0"><u>Persistente</u></span></p>',
    );
    const renderizado = renderNotaContentHtml(salvo);

    expect(renderizado).toContain('color:#E63946');
    expect(renderizado).toContain('background-color:#FFF3B0');
    expect(renderizado).toContain('<u>Persistente</u>');
  });

  it('remove realce transparente sem aceitar CSS arbitrário', () => {
    const html = sanitizeRichHtml(
      '<p><span style="background-color:transparent; color:red; position:fixed">Texto</span></p>',
    );

    expect(html).not.toContain('background-color');
    expect(html).not.toContain('position');
    expect(html).not.toContain('color:red');
  });

  it('converte tags de cor antigas em span seguro sem perder o texto', () => {
    const html = sanitizeRichHtml(
      '<p><font color="#E63946">Texto antigo</font></p>',
    );

    expect(html).toContain('<span style="color:#E63946">Texto antigo</span>');
  });

  it('preserva cor de texto e realce em spans ricos', () => {
    const html = sanitizeRichHtml(
      '<p><span style="color:#E63946; background-color:#FFF3B0"><strong><em>Destaque</em></strong></span></p>',
    );

    expect(html).toContain('color:#E63946');
    expect(html).toContain('background-color:#FFF3B0');
    expect(html).toContain('<strong><em>Destaque</em></strong>');
  });

  it('preserva tamanho proporcional e alinhamento de imagens ricas', () => {
    const html = sanitizeRichHtml(
      '<p>Antes</p><img src="https://example.com/mapa.jpg" alt="Mapa" style="width:50%; height:auto; aspect-ratio:16 / 9; float:left; clear:none; margin-right:16px; max-width:100%;" /><p>Texto ao lado</p>',
    );

    expect(html).toContain('width:50%');
    expect(html).toContain('height:auto');
    expect(html).toContain('aspect-ratio:16 / 9');
    expect(html).toContain('float:left');
    expect(html).toContain('margin-right:16px');
    expect(html).toContain('Texto ao lado');
  });

  it('remove estilos arbitrários de imagens sem remover a URL', () => {
    const html = sanitizeRichHtml(
      '<img src="https://example.com/mapa.jpg" style="width:320px; position:absolute; clear:left" />',
    );

    expect(html).toContain('width:320px');
    expect(html).toContain('clear:left');
    expect(html).not.toContain('position');
  });

  it('preserva tamanho, proporção e alinhamento seguros de imagens ricas', () => {
    const html = sanitizeRichHtml(
      '<p>Antes <img src="https://cdn.example.com/mapa.jpg" alt="Mapa" style="display:block;float:left;width:45%;height:auto;aspect-ratio:16 / 9;max-width:100%;margin:12px 16px 12px 0;border-radius:10px;object-fit:cover;position:fixed"> Depois</p>',
    );

    expect(html).toContain('src="https://cdn.example.com/mapa.jpg"');
    expect(html).toContain('width:45%');
    expect(html).toContain('height:auto');
    expect(html).toContain('aspect-ratio:16 / 9');
    expect(html).toContain('float:left');
  });

  it('preserva espaçamento lateral seguro para imagens alinhadas', () => {
    const html = sanitizeRichHtml(
      '<p>Antes</p><img src="https://example.com/mapa.jpg" alt="Mapa" style="width:50%; height:auto; float:left; clear:none; margin-top:16px; margin-bottom:16px; margin-right:32px; max-width:100%;" /><p>Texto ao lado</p>',
    );

    expect(html).toContain('float:left');
    expect(html).toContain('margin-right:32px');
    expect(html).toContain('margin-top:16px');
    expect(html).toContain('margin-bottom:16px');
  });
});

describe('compatibilidade de entidades legadas', () => {
  it('normaliza aliases antigos preservando campos originais', () => {
    const legado = {
      id: 'nota-antiga',
      title: 'Nome antigo',
      html: '<h1>Conteúdo antigo</h1>',
      summary: 'Resumo antigo',
      type: 'Divindade',
      linkImagem: 'https://example.com/legado.jpg',
      camposDesconhecidos: { preservado: true },
    };

    const normalizada = normalizarNotaEntidade(legado);
    expect(normalizada).toMatchObject({
      id: 'nota-antiga',
      nome: 'Nome antigo',
      conteudo: '<h1>Conteúdo antigo</h1>',
      resumo: 'Resumo antigo',
      tipo: 'Divindade',
      imagem: null,
    });
    expect(normalizada.camposDesconhecidos).toEqual({ preservado: true });
  });
});

describe('getNotaRetrato', () => {
  it('prioriza o retrato da entidade e não confunde a capa com retrato', () => {
    const nota = {
      id: 'n1',
      titulo: 'CardFlux',
      imagemPerfil: 'https://cdn.example.com/nota-retrato.jpg',
      imagemUrl: 'https://cdn.example.com/nota-capa.jpg',
      linkImagem: 'https://cdn.example.com/nota-link.jpg',
      foto: 'https://cdn.example.com/nota-foto.jpg',
      image: 'https://cdn.example.com/nota-image.jpg',
      capa: 'https://cdn.example.com/nota-capa-fallback.jpg',
    };

    expect(getNotaRetrato(nota)).toBe(
      'https://cdn.example.com/nota-retrato.jpg',
    );
  });

  it('não faz fallback para a imagem da cena, mantendo comportamento consistente', () => {
    const cena = {
      id: 'c1',
      titulo: 'Castelo',
      imagemUrl: 'https://cdn.example.com/cena.jpg',
    };

    expect(getNotaRetrato(cena)).toBe(null);
  });

  it('prioriza o campo novo e reconhece aliases legados', () => {
    expect(
      getNotaRetrato({
        imagemPerfil: 'https://cdn.example.com/nota-retrato.jpg',
        imagemUrl: 'https://cdn.example.com/nota-capa.jpg',
      }),
    ).toBe('https://cdn.example.com/nota-retrato.jpg');

    expect(
      getNotaRetrato({ retrato: 'https://cdn.example.com/legacy.jpg' }),
    ).toBe('https://cdn.example.com/legacy.jpg');
  });

  it('não usa imagem de capa como retrato nem como placeholder', () => {
    expect(
      getNotaRetrato({ imagemUrl: 'https://cdn.example.com/capa.jpg' }),
    ).toBe(null);
  });
});
