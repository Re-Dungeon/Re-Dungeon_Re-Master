// Carrega a IFrame Player API do YouTube uma vez só, sob demanda (só quando a
// mesa tem música). O player oficial da API JavaScript deve usar o host padrão
// do YouTube; o host sem cookies é apenas para embeds em notas, para não expor
// player de vídeo em páginas de leitura.
const URL_API = 'https://www.youtube.com/iframe_api';
const TIMEOUT_MS = 15000;

let carregando = null;

const mockPlayerYoutube = () => {
  if (typeof window === 'undefined') return null;
  if (window.YT?.Player) return window.YT;

  class MockYouTubePlayer {
    constructor(target, options = {}) {
      this.target = target;
      this.options = options;
      this._state = 0;
      this._volume = 100;
      this._muted = false;
      this._duration = 0;
      this._currentTime = 0;
      this._videoData = { video_id: null, title: '', isLive: false };
      options.events?.onReady?.();
    }

    playVideo() {
      this._state = 1;
    }

    pauseVideo() {
      this._state = 2;
    }

    stopVideo() {
      this._state = 0;
      this._currentTime = 0;
    }

    seekTo(segundos) {
      this._currentTime = Number.isFinite(segundos) ? segundos : 0;
    }

    getPlayerState() {
      return this._state;
    }

    getVideoData() {
      return this._videoData;
    }

    getDuration() {
      return this._duration;
    }

    getCurrentTime() {
      return this._currentTime;
    }

    setVolume(volume) {
      this._volume = volume;
    }

    mute() {
      this._muted = true;
    }

    unMute() {
      this._muted = false;
    }

    isMuted() {
      return this._muted;
    }

    loadVideoById({ videoId, startSeconds = 0 }) {
      this._videoData = { video_id: videoId, title: 'Mock YouTube', isLive: false };
      this._currentTime = startSeconds;
      this._state = 1;
    }

    cueVideoById({ videoId, startSeconds = 0 }) {
      this._videoData = { video_id: videoId, title: 'Mock YouTube', isLive: false };
      this._currentTime = startSeconds;
      this._state = 3;
    }

    destroy() {
      this._state = 0;
    }
  }

  window.YT = { Player: MockYouTubePlayer };
  return window.YT;
};

export const carregarApiYoutube = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (process.env.NODE_ENV === 'test') {
    return Promise.resolve(mockPlayerYoutube());
  }

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
