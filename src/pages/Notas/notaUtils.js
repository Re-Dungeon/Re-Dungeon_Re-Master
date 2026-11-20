import * as Yup from 'yup';
import { nomeSchema, textoLongoSchema } from 'common/utils/yupSchemas';

export const LEGACY_ENTITY_TYPES = [
  'Conceito',
  'Criatura',
  'Divindade',
  'Evento',
  'Item',
  'Local',
  'Organização',
  'Personagem',
  'Raça',
  'Rota',
  'Outro',
];

export const TIPOS_ENTIDADE = LEGACY_ENTITY_TYPES;

export const getEntityTypeOptions = (tiposDisponiveis = [], notas = []) => {
  const nomes = new Set();

  (Array.isArray(tiposDisponiveis) ? tiposDisponiveis : [])
    .map(tipo =>
      normalizeEntityTypeValue(
        tipo?.name ?? tipo?.nome ?? tipo?.Nome ?? tipo?.title ?? '',
      ),
    )
    .filter(Boolean)
    .forEach(nome => nomes.add(nome));

  (Array.isArray(notas) ? notas : [])
    .map(nota => normalizeEntityTypeValue(nota?.tipo ?? ''))
    .filter(Boolean)
    .forEach(nome => nomes.add(nome));

  return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
};

export const normalizeEntityTypeName = value => {
  if (typeof value !== 'string') return '';

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

export const normalizeEntityTypeValue = value => {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

export const matchEntityType = (leftValue, rightValue) => {
  const leftName = normalizeEntityTypeName(leftValue);
  const rightName = normalizeEntityTypeName(rightValue);

  if (!leftName || !rightName) return false;
  return leftName === rightName;
};

export const buildEntityTypeRecord = (
  name,
  { id, createdAt, updatedAt, universoId, mestreId } = {},
) => {
  const safeName = normalizeEntityTypeValue(name);
  if (!safeName) return null;

  const record = {
    name: safeName,
    normalizedName: normalizeEntityTypeName(safeName),
  };

  if (id !== undefined) record.id = id;
  if (createdAt !== undefined) record.createdAt = createdAt;
  if (updatedAt !== undefined) record.updatedAt = updatedAt;
  if (universoId !== undefined) record.universoId = universoId;
  if (mestreId !== undefined) record.mestreId = mestreId;

  return record;
};

export const NOTA_SCHEMA = Yup.object({
  titulo: nomeSchema,
  conteudo: textoLongoSchema,
  resumo: Yup.string().trim().max(3000, 'Resumo muito longo.').nullable(),
  imagemUrl: Yup.string().trim().nullable(),
  imagemPerfil: Yup.string().trim().nullable(),
  tipo: Yup.string().trim().max(100, 'Tipo muito longo.').nullable(),
  cenaId: Yup.string().nullable(),
  tags: Yup.array().of(Yup.string().trim()).default([]),
});

export const NOTA_INITIAL_VALUES = {
  titulo: '',
  conteudo: '',
  resumo: '',
  imagemUrl: '',
  imagemPerfil: '',
  tipo: 'Local',
  cenaId: null,
  tags: [],
};

export const getNotaCapa = nota => {
  if (!nota) return null;

  return (
    nota.imagemUrl ||
    nota.linkImagem ||
    nota.foto ||
    nota.image ||
    nota.capa ||
    nota.imagemCapa ||
    nota.banner ||
    null
  );
};

export const getNotaRetrato = nota => {
  if (!nota) return null;

  return (
    nota.imagemPerfil ||
    nota.perfil ||
    nota.avatar ||
    nota.imagemRetrato ||
    nota.retrato ||
    nota.fotoPerfil ||
    nota.profileImage ||
    nota.portrait ||
    nota.fotoRetrato ||
    nota.linkRetrato ||
    null
  );
};

const primeiroTextoNota = (nota, campos) => {
  for (const campo of campos) {
    if (typeof nota?.[campo] === 'string' && nota[campo].trim()) {
      return nota[campo].trim();
    }
  }
  return '';
};

export const normalizarNotaEntidade = nota => {
  if (!nota || typeof nota !== 'object') return null;

  const nome =
    primeiroTextoNota(nota, ['titulo', 'Titulo', 'nome', 'Nome', 'title']) ||
    'Sem título';
  const tipo = normalizeEntityTypeValue(
    primeiroTextoNota(nota, ['tipo', 'categoria', 'Tipo', 'type']) || 'Outro',
  );
  const resumo = primeiroTextoNota(nota, [
    'resumo',
    'Resumo',
    'summary',
    'descricao',
    'descrição',
  ]);
  const conteudo =
    primeiroTextoNota(nota, [
      'conteudo',
      'conteúdo',
      'content',
      'html',
      'texto',
      'Texto',
    ]) || resumo;
  const imagem = getNotaRetrato(nota);

  return {
    ...nota,
    id: nota.id,
    nome,
    titulo: nota.titulo ?? nome,
    tipo: tipo || 'Outro',
    resumo,
    conteudo,
    imagem,
    tags: normalizeNotaTags(nota.tags),
  };
};

export const notaPertenceAoEscopo = (nota, { campanhaId, universoId } = {}) => {
  if (!nota || typeof nota !== 'object') return false;
  if (
    nota.campanhaId &&
    campanhaId &&
    String(nota.campanhaId) !== String(campanhaId)
  )
    return false;
  if (
    nota.universoId &&
    universoId &&
    String(nota.universoId) !== String(universoId)
  )
    return false;

  const semVinculo = !nota.campanhaId && !nota.universoId;
  if (semVinculo) return true;

  const campanhaCompativel =
    campanhaId && String(nota.campanhaId) === String(campanhaId);
  const universoCompativel =
    universoId && String(nota.universoId) === String(universoId);
  return Boolean(campanhaCompativel || universoCompativel);
};

export const normalizeEntityAttributes = fontes => {
  const atributos = [];
  const listaDireta =
    Array.isArray(fontes) &&
    fontes.every(
      item =>
        item &&
        typeof item === 'object' &&
        ('nome' in item ||
          'name' in item ||
          'valor' in item ||
          'value' in item),
    );
  const fontesNormalizadas = listaDireta
    ? [fontes]
    : Array.isArray(fontes)
      ? fontes
      : [fontes];

  fontesNormalizadas.forEach(fonte => {
    if (!fonte) return;

    const entradas = Array.isArray(fonte)
      ? fonte
          .map(item => [
            String(item?.nome ?? item?.name ?? '').trim(),
            item?.valor ?? item?.value,
          ])
          .filter(([nome]) => Boolean(nome))
      : typeof fonte === 'object'
        ? Object.entries(fonte)
        : [];

    entradas.forEach(([nome, valor]) => {
      const nomeLimpo = String(nome ?? '').trim();
      if (!nomeLimpo || valor === null || valor === undefined || valor === '') {
        return;
      }
      if (atributos.some(item => item.nome === nomeLimpo)) return;

      atributos.push({
        nome: nomeLimpo,
        valor:
          typeof valor === 'object' ? JSON.stringify(valor) : String(valor),
      });
    });
  });

  return atributos;
};

export const normalizeNotaTags = tags => {
  if (Array.isArray(tags)) {
    return tags
      .map(tag =>
        typeof tag === 'string' ? tag.trim() : String(tag ?? '').trim(),
      )
      .filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }

  return [];
};

export const sanitizeLink = href => {
  if (typeof href !== 'string') return '#';

  const value = href.trim();
  if (
    /^https?:\/\//i.test(value) ||
    /^mailto:/i.test(value) ||
    /^\//.test(value) ||
    /^#/.test(value)
  ) {
    return value;
  }

  return '#';
};

export const sanitizeImage = href => {
  if (typeof href !== 'string') return '';

  const value = href.trim();
  if (/^https?:\/\//i.test(value) || /^\//.test(value)) {
    return value;
  }

  return '';
};

export const sanitizeYoutubeUrl = rawUrl => {
  if (typeof rawUrl !== 'string') return null;

  const value = rawUrl.trim();
  if (!value) return null;

  const match = value.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
  );

  if (!match) return null;

  return `https://www.youtube-nocookie.com/embed/${match[1]}`;
};

const escapeHtml = value =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isSafeRichColorValue = value => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(normalized)) return true;

  const rgbMatch = normalized.match(/^rgba?\((.*)\)$/i);
  if (!rgbMatch) return false;

  const parts = rgbMatch[1].split(',').map(part => part.trim());
  if (parts.length !== 3 && parts.length !== 4) return false;

  const rgbValid = parts.slice(0, 3).every(part => {
    if (/^\d{1,3}%$/.test(part)) {
      return Number.parseInt(part, 10) <= 100;
    }
    return /^\d{1,3}$/.test(part) && Number.parseInt(part, 10) <= 255;
  });
  if (!rgbValid) return false;

  if (parts.length === 3) return normalized.startsWith('rgb(');

  const alpha = parts[3];
  if (/^\d+(?:\.\d+)?%$/.test(alpha)) {
    return Number.parseFloat(alpha) >= 0 && Number.parseFloat(alpha) <= 100;
  }
  return /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(alpha);
};

const sanitizeAllowedInlineStyle = (value, tagName = '') => {
  if (typeof value !== 'string') return '';

  const safeDeclarations = [];
  const mediaTags = new Set(['img', 'iframe', 'video', 'figure']);
  const textStyleTags = new Set([
    'a',
    'b',
    'div',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'i',
    'li',
    'p',
    's',
    'span',
    'strong',
    'u',
  ]);
  const allowedAlignValues = new Set(['left', 'center', 'right', 'justify']);

  value.split(';').forEach(part => {
    const match = part.match(/^\s*([a-z-]+)\s*:\s*([^;]+?)\s*$/i);
    if (!match) return;

    const [, property, rawCssValue] = match;
    const normalizedProperty = property.trim().toLowerCase();
    const normalizedValue = rawCssValue.trim().toLowerCase();

    if (
      normalizedProperty === 'text-align' &&
      allowedAlignValues.has(normalizedValue)
    ) {
      safeDeclarations.push(`${normalizedProperty}:${normalizedValue}`);
      return;
    }

    if (
      textStyleTags.has(tagName.toLowerCase()) &&
      (normalizedProperty === 'color' ||
        normalizedProperty === 'background-color')
    ) {
      if (isSafeRichColorValue(normalizedValue)) {
        safeDeclarations.push(`${normalizedProperty}:${rawCssValue.trim()}`);
      }
      return;
    }

    if (!mediaTags.has(tagName.toLowerCase())) return;

    const permittedMediaStyles = new Set([
      'display',
      'max-width',
      'width',
      'height',
      'aspect-ratio',
      'margin',
      'margin-left',
      'margin-right',
      'margin-inline',
      'margin-top',
      'margin-bottom',
      'margin-block',
      'border-radius',
      'float',
      'clear',
      'object-fit',
      'vertical-align',
    ]);

    if (!permittedMediaStyles.has(normalizedProperty)) return;

    const isPercentSize = /^\d+(?:\.\d+)?%$/.test(normalizedValue);
    const isPxSize = /^\d+(?:\.\d+)?px$/.test(normalizedValue);
    const isZero = normalizedValue === '0';
    const isAuto = normalizedValue === 'auto';
    const isBlock = normalizedValue === 'block';
    const isInlineBlock = normalizedValue === 'inline-block';

    const isMarginSafe =
      normalizedValue === 'auto' ||
      normalizedValue === '0' ||
      /^\d+(?:\.\d+)?px$/.test(normalizedValue) ||
      /^\d+(?:\.\d+)?rem$/.test(normalizedValue) ||
      /^\d+(?:\.\d+)?em$/.test(normalizedValue);

    if (
      (normalizedProperty === 'display' && (isBlock || isInlineBlock)) ||
      (normalizedProperty === 'max-width' && isPercentSize) ||
      (normalizedProperty === 'width' &&
        (isPercentSize || isPxSize || isAuto)) ||
      (normalizedProperty === 'height' && (isAuto || isPxSize)) ||
      (normalizedProperty === 'aspect-ratio' &&
        /^\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?$/.test(normalizedValue)) ||
      (normalizedProperty === 'border-radius' &&
        (isZero || isPxSize || /^\d+(?:\.\d+)?rem$/.test(normalizedValue))) ||
      ((normalizedProperty === 'margin' ||
        normalizedProperty === 'margin-left' ||
        normalizedProperty === 'margin-right' ||
        normalizedProperty === 'margin-inline' ||
        normalizedProperty === 'margin-top' ||
        normalizedProperty === 'margin-bottom' ||
        normalizedProperty === 'margin-block') &&
        isMarginSafe) ||
      (normalizedProperty === 'float' &&
        ['left', 'right', 'none'].includes(normalizedValue)) ||
      (normalizedProperty === 'clear' &&
        ['left', 'right', 'both', 'none'].includes(normalizedValue)) ||
      (normalizedProperty === 'object-fit' &&
        ['contain', 'cover', 'fill', 'none', 'scale-down'].includes(
          normalizedValue,
        )) ||
      (normalizedProperty === 'vertical-align' &&
        ['baseline', 'top', 'middle', 'bottom'].includes(normalizedValue))
    ) {
      safeDeclarations.push(`${normalizedProperty}:${rawCssValue.trim()}`);
    }
  });

  return safeDeclarations.join('; ');
};

export const sanitizeRichHtml = rawHtml => {
  if (typeof rawHtml !== 'string') return '';

  const bodyHtml = rawHtml.trim();
  if (!bodyHtml) return '';

  if (typeof DOMParser === 'undefined') {
    return bodyHtml;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${bodyHtml}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  if (!root) return '';

  const allowedTagNames = new Set([
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'figure',
    'figcaption',
    'h1',
    'h2',
    'h3',
    'h4',
    'hr',
    'i',
    'iframe',
    'img',
    'label',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strong',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
    'video',
  ]);

  const visitNode = node => {
    if (!node || node.nodeType !== 1) return;

    const tagName = node.tagName.toLowerCase();
    if (tagName === 'font') {
      const span = doc.createElement('span');
      const color = node.getAttribute('color');
      if (isSafeRichColorValue(color)) {
        span.setAttribute('style', `color:${color}`);
      }
      while (node.firstChild) span.appendChild(node.firstChild);
      node.replaceWith(span);
      visitNode(span);
      return;
    }
    if (!allowedTagNames.has(tagName)) {
      const fragment = doc.createDocumentFragment();
      while (node.firstChild) {
        fragment.appendChild(node.firstChild);
      }
      node.replaceWith(fragment);
      return;
    }

    Array.from(node.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();

      if (attrName.startsWith('on')) {
        node.removeAttribute(attrName);
        return;
      }

      if (attrName === 'class' || attrName === 'id') {
        node.removeAttribute(attrName);
        return;
      }

      if (attrName === 'style') {
        const safeStyle = sanitizeAllowedInlineStyle(attr.value, tagName);
        if (!safeStyle) {
          node.removeAttribute('style');
          return;
        }
        node.setAttribute('style', safeStyle);
        return;
      }

      if (attrName === 'href') {
        const href = sanitizeLink(attr.value);
        if (href === '#') {
          node.removeAttribute('href');
          return;
        }
        node.setAttribute('href', href);
        if (tagName === 'a') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
        return;
      }

      if (attrName === 'src') {
        const src =
          tagName === 'iframe'
            ? sanitizeYoutubeUrl(attr.value)
            : sanitizeImage(attr.value);
        if (!src) {
          node.removeAttribute(attrName);
          return;
        }
        node.setAttribute('src', src);
        if (tagName === 'img') {
          node.setAttribute('loading', 'lazy');
        }
        return;
      }

      if (
        attrName === 'target' ||
        attrName === 'rel' ||
        attrName === 'alt' ||
        attrName === 'title' ||
        attrName === 'allow' ||
        attrName === 'allowfullscreen' ||
        attrName === 'loading'
      ) {
        if (tagName === 'iframe' && attrName === 'allowfullscreen') {
          node.setAttribute('allowfullscreen', 'true');
        }
        return;
      }

      node.removeAttribute(attrName);
    });

    if (tagName === 'a' && !node.getAttribute('href')) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    if (tagName === 'iframe') {
      const iframeSrc = sanitizeYoutubeUrl(node.getAttribute('src') || '');
      if (!iframeSrc) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }
      node.setAttribute('src', iframeSrc);
      node.setAttribute('allowfullscreen', 'true');
      node.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      );
      node.setAttribute(
        'title',
        node.getAttribute('title') || 'Vídeo do YouTube',
      );
      node.setAttribute('loading', 'lazy');
    }

    if (tagName === 'img') {
      if (!node.getAttribute('src')) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }
      node.setAttribute('alt', node.getAttribute('alt') || 'Imagem');
      node.setAttribute('loading', 'lazy');
    }

    Array.from(node.childNodes).forEach(visitNode);
  };

  Array.from(root.childNodes).forEach(visitNode);
  return root.innerHTML;
};

const renderInlineMarkdown = value => {
  if (typeof value !== 'string') return '';

  return value
    .split(/(<(?:a|img|hr)\b[^>]*>.*?(?:<\/a>|\/?>))/gi)
    .map(segment => {
      if (!segment) return '';
      if (/^<(?:a|img|hr)\b/i.test(segment)) {
        return segment;
      }

      let html = escapeHtml(segment);
      html = html.replace(
        /\[\[highlight:([^|\]]+)\|([^\]]+)\]\]/g,
        '<span style="background-color:$1; color:#111827; padding:0.12em 0.32em; border-radius:0.28em;">$2</span>',
      );
      html = html.replace(
        /\[\[color:([^|\]]+)\|([^\]]+)\]\]/g,
        '<span style="color:$1;">$2</span>',
      );
      html = html.replace(
        /\[\[size:([^|\]]+)\|([^\]]+)\]\]/g,
        '<span style="font-size:$1;">$2</span>',
      );
      html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, href) => {
        const safeHref = sanitizeImage(href);
        if (!safeHref) {
          return escapeHtml(`${alt || 'imagem'}`);
        }
        return `<img src="${safeHref}" alt="${escapeHtml(alt || 'imagem')}" loading="lazy" />`;
      });
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
        const safeHref = sanitizeLink(href);
        return `<a href="${safeHref}" target="_blank" rel="noreferrer noopener">${escapeHtml(label)}</a>`;
      });
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.+?)__/g, '<u>$1</u>');
      html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/`(.+?)`/g, '<code>$1</code>');
      html = html.replace(/\n/g, '<br />');
      return html;
    })
    .join('');
};

export const renderNotaContentHtml = rawValue => {
  const content = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!content) {
    return '<p style="margin:0;color:var(--text-secondary);">Sem conteúdo para exibir.</p>';
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (looksLikeHtml) {
    const sanitizedHtml = sanitizeRichHtml(content);
    return sanitizedHtml
      ? `<div class="nota-detalhes-content__html">${sanitizedHtml}</div>`
      : '<p style="margin:0;color:var(--text-secondary);">Sem conteúdo para exibir.</p>';
  }

  const linhas = content.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let buffer = [];

  const flushBuffer = () => {
    if (!buffer.length) return;
    const block = buffer.join('\n').trim();
    if (!block) {
      buffer = [];
      return;
    }

    const codeBlockMatch = block.match(/^```\s*([\s\S]*?)\s*```$/);
    if (codeBlockMatch) {
      blocks.push(
        `<pre><code>${escapeHtml(codeBlockMatch[1].trim())}</code></pre>`,
      );
      buffer = [];
      return;
    }

    if (
      /<hr\b[^>]*\/?>/i.test(block) ||
      /^---+$/.test(block.replace(/\s+/g, ''))
    ) {
      blocks.push('<hr />');
      buffer = [];
      return;
    }

    const quoteLines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const isQuote =
      quoteLines.length > 0 && quoteLines.every(line => line.startsWith('>'));
    if (isQuote) {
      const quoted = quoteLines
        .map(line => renderInlineMarkdown(line.replace(/^>\s?/, '').trim()))
        .join('<br />');
      blocks.push(`<blockquote>${quoted}</blockquote>`);
      buffer = [];
      return;
    }

    const hasTable =
      block.includes('|') && block.split('\n').some(line => line.includes('|'));
    if (hasTable) {
      const rows = block
        .split('\n')
        .map(row => row.trim())
        .filter(Boolean);
      const cells = rows.map(row =>
        row
          .split('|')
          .map(part => part.trim())
          .filter(Boolean),
      );
      if (cells.length > 1 && cells.every(r => r.length >= 2)) {
        const [header, ...bodyRows] = cells;
        const thead = `<thead><tr>${header.map(cell => `<th>${renderInlineMarkdown(cell)}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${bodyRows.map(row => `<tr>${row.map(cell => `<td>${renderInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
        blocks.push(
          `<table><table style="width:100%;border-collapse:collapse;">${thead}${tbody}</table></table>`,
        );
        buffer = [];
        return;
      }
    }

    const isHeading = /^#{1,6}\s+/.test(block);
    if (isHeading) {
      const level = block.match(/^#+/)?.[0].length ?? 1;
      const text = block.replace(/^#{1,6}\s+/, '').trim();
      blocks.push(
        `<h${Math.min(level, 4)}>${renderInlineMarkdown(text)}</h${Math.min(level, 4)}>`,
      );
      buffer = [];
      return;
    }

    const lines = block.split('\n');
    const isChecklist = lines.every(line =>
      /^[-*]\s+\[[ xX]\]\s+/.test(line.trim()),
    );
    if (isChecklist) {
      const items = lines
        .map(line => line.trim())
        .map(line => {
          const checked = /^[-*]\s+\[x\]\s+/i.test(line);
          const text = line.replace(/^[-*]\s+\[[ xX]\]\s+/, '');
          return `<li><label><input type="checkbox" disabled ${checked ? 'checked' : ''} /> <span>${renderInlineMarkdown(text)}</span></label></li>`;
        })
        .join('');
      blocks.push(`<ul class="nota-checklist">${items}</ul>`);
      buffer = [];
      return;
    }

    const isBulleted = lines.every(line => /^[-*]\s+/.test(line.trim()));
    if (isBulleted) {
      const items = lines
        .map(line => line.trim().replace(/^[-*]\s+/, ''))
        .filter(Boolean)
        .map(item => `<li>${renderInlineMarkdown(item)}</li>`)
        .join('');
      blocks.push(`<ul>${items}</ul>`);
      buffer = [];
      return;
    }

    const isNumbered = lines.every(line => /^\d+\.\s+/.test(line.trim()));
    if (isNumbered) {
      const items = lines
        .map(line => line.trim().replace(/^\d+\.\s+/, ''))
        .filter(Boolean)
        .map(item => `<li>${renderInlineMarkdown(item)}</li>`)
        .join('');
      blocks.push(`<ol>${items}</ol>`);
      buffer = [];
      return;
    }

    blocks.push(`<p>${renderInlineMarkdown(block)}</p>`);
    buffer = [];
  };

  linhas.forEach(linha => {
    if (!linha.trim()) {
      flushBuffer();
      return;
    }
    buffer.push(linha.trim());
  });
  flushBuffer();

  return blocks.join('');
};
