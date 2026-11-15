// Upload de imagem do PC para o Cloudinary (upload "unsigned": só o nome da
// conta e de um upload preset, ambos públicos por natureza — o preset é que
// limita formato, tamanho e pasta no painel do Cloudinary). Só gera a URL;
// quem posta a mensagem no chat é o `onEnviarImagem` de sempre.
// Cópia compartilhada com o Re:Master.
//
// Variáveis: VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.
// Sem elas, o envio do PC fica escondido e só o envio por link funciona.

import { isUrlImagemValida } from 'common/utils/chat';

export const NOME_HOSPEDAGEM = 'Cloudinary';

const config = () => ({
  cloudName: String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '').trim(),
  preset: String(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '').trim(),
});

export const uploadImagemDisponivel = () => {
  const { cloudName, preset } = config();
  return cloudName !== '' && preset !== '';
};

const mensagemDoStatus = (status, detalhe) => {
  if (status === 420 || status === 429) {
    return 'Limite de envios atingido. Tente de novo em alguns minutos.';
  }
  if (status === 400) {
    return detalhe
      ? `O envio foi recusado: ${detalhe}`
      : 'O envio foi recusado. Tente outra imagem.';
  }
  if (status === 401 || status === 403 || status === 404) {
    return 'O envio de imagens não está configurado corretamente neste site.';
  }
  if (status >= 500) return 'O serviço de imagens está fora do ar. Tente de novo mais tarde.';
  return 'Não foi possível enviar a imagem.';
};

const lerJson = async resposta => {
  try {
    return await resposta.json();
  } catch {
    return null;
  }
};

export const enviarImagemUpload = async (blob, { signal, fetchFn = fetch } = {}) => {
  if (!uploadImagemDisponivel()) throw new Error('Envio de imagens do PC não configurado.');
  const { cloudName, preset } = config();
  const corpo = new FormData();
  corpo.append('file', blob);
  corpo.append('upload_preset', preset);

  let resposta;
  try {
    resposta = await fetchFn(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      { method: 'POST', body: corpo, signal },
    );
  } catch (erro) {
    if (erro?.name === 'AbortError') throw erro;
    throw new Error('Não foi possível enviar a imagem. Confira a conexão e tente de novo.');
  }

  const json = await lerJson(resposta);
  if (!resposta.ok) {
    const detalhe = typeof json?.error?.message === 'string' ? json.error.message : null;
    throw new Error(mensagemDoStatus(resposta.status, detalhe));
  }
  const link = json?.secure_url;
  if (typeof link !== 'string' || !isUrlImagemValida(link)) {
    throw new Error('O serviço de imagens não devolveu um link de imagem válido.');
  }
  return link;
};
