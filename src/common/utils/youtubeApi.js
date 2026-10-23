// Carrega a IFrame Player API do YouTube uma vez só, sob demanda (só quando a
// mesa tem música). O player oficial da API JavaScript deve usar o host padrão
// do YouTube; o host sem cookies é apenas para embeds em notas, para não expor
// player de vídeo em páginas de leitura.
const URL_API = 'https://www.youtube.com/iframe_api';
const TIMEOUT_MS = 15000;

let carregando = null;

export const carregarApiYoutube = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!carregando) {
    carregando = new Promise((resolve, reject) => {
      const anterior = window.onYouTubeIframeAPIReady;
      const timeoutId = setTimeout(() => {
        if (!window.YT?.Player) {
          window.onYouTubeIframeAPIReady = anterior;
          carregando = null;
          reject(new Error('A API do YouTube não respondeu a tempo.'));
        }
      }, TIMEOUT_MS);

      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timeoutId);
        anterior?.();
        resolve(window.YT);
      };

      const script = document.createElement('script');
      script.src = URL_API;
      script.async = true;
      script.onerror = () => {
        clearTimeout(timeoutId);
        window.onYouTubeIframeAPIReady = anterior;
        carregando = null;
        reject(new Error('Não foi possível carregar o player do YouTube.'));
      };
      document.head.appendChild(script);
    });
  }
  return carregando;
};
