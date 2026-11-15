import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { enviarImagemUpload, uploadImagemDisponivel } from './uploadImagem';

const resposta = (status, json) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(json),
});

describe('service/uploadImagem (Cloudinary)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'mesa');
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', 'chat_unsigned');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('fica indisponível sem cloud name ou sem preset', async () => {
    expect(uploadImagemDisponivel()).toBe(true);
    vi.stubEnv('VITE_CLOUDINARY_UPLOAD_PRESET', '');
    expect(uploadImagemDisponivel()).toBe(false);
    await expect(enviarImagemUpload(new Blob(['x']))).rejects.toThrow(/não configurado/);
  });

  it('envia com o preset unsigned e devolve o secure_url', async () => {
    const fetchFn = vi.fn(() =>
      Promise.resolve(
        resposta(200, {
          secure_url: 'https://res.cloudinary.com/mesa/image/upload/v1/chat/abc.png',
          url: 'http://res.cloudinary.com/mesa/image/upload/v1/chat/abc.png',
        }),
      ),
    );
    const link = await enviarImagemUpload(new Blob(['x'], { type: 'image/png' }), { fetchFn });
    expect(link).toBe('https://res.cloudinary.com/mesa/image/upload/v1/chat/abc.png');
    const [endpoint, opcoes] = fetchFn.mock.calls[0];
    expect(endpoint).toBe('https://api.cloudinary.com/v1_1/mesa/image/upload');
    expect(opcoes.method).toBe('POST');
    expect(opcoes.body.get('upload_preset')).toBe('chat_unsigned');
    expect(opcoes.body.get('file')).toBeInstanceOf(Blob);
  });

  it('traduz limite de envios e mostra o motivo de uma recusa', async () => {
    const limite = vi.fn(() => Promise.resolve(resposta(420, {})));
    await expect(enviarImagemUpload(new Blob(['x']), { fetchFn: limite })).rejects.toThrow(
      /Limite de envios/,
    );
    const recusa = vi.fn(() =>
      Promise.resolve(resposta(400, { error: { message: 'File size too large.' } })),
    );
    await expect(enviarImagemUpload(new Blob(['x']), { fetchFn: recusa })).rejects.toThrow(
      'O envio foi recusado: File size too large.',
    );
    const preset = vi.fn(() => Promise.resolve(resposta(401, {})));
    await expect(enviarImagemUpload(new Blob(['x']), { fetchFn: preset })).rejects.toThrow(
      /não está configurado/,
    );
  });

  it('recusa resposta sem link de imagem', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(resposta(200, { secure_url: null })));
    await expect(enviarImagemUpload(new Blob(['x']), { fetchFn })).rejects.toThrow(
      /link de imagem válido/,
    );
  });

  it('falha de rede vira mensagem amigável; cancelamento passa adiante', async () => {
    const rede = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    await expect(enviarImagemUpload(new Blob(['x']), { fetchFn: rede })).rejects.toThrow(
      /Confira a conexão/,
    );
    const abort = vi.fn(() => Promise.reject(new DOMException('x', 'AbortError')));
    await expect(enviarImagemUpload(new Blob(['x']), { fetchFn: abort })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
