// Preparo de imagem escolhida no PC (arquivo, Ctrl+V ou arrastar) antes de
// subir para o Cloudinary (service/uploadImagem.js). Cópia compartilhada com o Re:Master.
//
// As decisões (validar, reduzir, formato) são funções puras testáveis; só
// `comprimirImagem` usa canvas e não roda no jsdom.

export const IMAGEM_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const IMAGEM_UPLOAD_LADO_MAX = 2048;
export const IMAGEM_UPLOAD_QUALIDADE_JPEG = 0.85;

const ehImagem = arquivo =>
  Boolean(arquivo) && typeof arquivo.type === 'string' && arquivo.type.startsWith('image/');

const megas = bytes => `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;

// Antes de comprimir só confere o tipo; o tamanho é conferido de novo depois
// (`validarTamanhoImagem`), porque uma foto grande costuma caber após reduzir.
export const validarArquivoImagem = arquivo => {
  if (!ehImagem(arquivo)) {
    return { ok: false, erro: 'Escolha um arquivo de imagem (PNG, JPG, WebP ou GIF).' };
  }
  return { ok: true, erro: null };
};

export const validarTamanhoImagem = blob => {
  if (!blob || blob.size > IMAGEM_UPLOAD_MAX_BYTES) {
    return {
      ok: false,
      erro: `A imagem tem ${megas(blob?.size ?? 0)}; o limite é ${megas(IMAGEM_UPLOAD_MAX_BYTES)}.`,
    };
  }
  return { ok: true, erro: null };
};

// Mantém a proporção; só reduz (nunca amplia).
export const dimensoesReduzidas = (largura, altura, max = IMAGEM_UPLOAD_LADO_MAX) => {
  const maior = Math.max(largura, altura);
  if (!maior || maior <= max) return { largura, altura, reduziu: false };
  const escala = max / maior;
  return {
    largura: Math.max(1, Math.round(largura * escala)),
    altura: Math.max(1, Math.round(altura * escala)),
    reduziu: true,
  };
};

// `null` = não recodificar (GIF perderia a animação). PNG continua PNG para
// manter a transparência; o resto vira JPEG.
export const formatoDeSaida = mime => {
  if (mime === 'image/gif') return null;
  if (mime === 'image/png') return { mime: 'image/png', qualidade: undefined };
  return { mime: 'image/jpeg', qualidade: IMAGEM_UPLOAD_QUALIDADE_JPEG };
};

// Primeira imagem de um `DataTransfer` (colar/soltar) ou de uma lista de
// arquivos. `varias` = havia mais de uma imagem (só a primeira é usada).
export const primeiraImagem = fonte => {
  if (!fonte) return { arquivo: null, varias: false };
  let arquivos = [];
  if (fonte.items && typeof fonte.items.length === 'number') {
    arquivos = Array.from(fonte.items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter(Boolean);
  }
  if (arquivos.length === 0) {
    arquivos = Array.from(fonte.files ?? (typeof fonte.length === 'number' ? fonte : []));
  }
  const imagens = arquivos.filter(ehImagem);
  return { arquivo: imagens[0] ?? null, varias: imagens.length > 1 };
};

// O arraste traz arquivos? (durante o dragover o conteúdo não é legível,
// só os tipos.)
export const arrasteTemArquivos = dataTransfer =>
  Boolean(dataTransfer?.types) && Array.from(dataTransfer.types).includes('Files');

const carregarBitmap = async arquivo => {
  if (typeof createImageBitmap === 'function') return createImageBitmap(arquivo);
  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = new Image();
    imagem.src = url;
    await imagem.decode();
    return imagem;
  } finally {
    URL.revokeObjectURL(url);
  }
};

// Reduz para no máximo IMAGEM_UPLOAD_LADO_MAX e recodifica. Devolve o próprio
// arquivo quando não há o que ganhar (GIF, ou já pequeno e no tamanho certo).
export const comprimirImagem = async arquivo => {
  const formato = formatoDeSaida(arquivo.type);
  if (!formato) return arquivo;
  const bitmap = await carregarBitmap(arquivo);
  const { largura, altura, reduziu } = dimensoesReduzidas(bitmap.width, bitmap.height);
  if (!reduziu && arquivo.type === formato.mime && arquivo.size <= IMAGEM_UPLOAD_MAX_BYTES) {
    bitmap.close?.();
    return arquivo;
  }
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close?.();
  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, formato.mime, formato.qualidade),
  );
  if (!blob) return arquivo;
  // Recodificar pode sair maior (PNG pequeno de cores chapadas): fica o menor.
  return (reduziu || blob.size < arquivo.size) ? blob : arquivo;
};
