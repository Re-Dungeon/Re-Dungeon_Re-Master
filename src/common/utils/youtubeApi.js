// Carrega a IFrame Player API do YouTube uma vez só, sob demanda (só quando a
// mesa tem música). Resolve com `window.YT`. Mantido em sincronia com a cópia
// do site dos jogadores.
const URL_API = 'https://www.youtube.com/iframe_api';

let carregando = null;

export const carregarApiYoutube = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!carregando) {
    carregando = new Promise((resolve, reject) => {
      const anterior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        anterior?.();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = URL_API;
      script.async = true;
      script.onerror = () => {
        carregando = null;
        reject(new Error('Não foi possível carregar o player do YouTube.'));
      };
      document.head.appendChild(script);
    });
  }
  return carregando;
};
