import '@testing-library/jest-dom';

// @xyflow/react (React Flow) reads element sizes via ResizeObserver, que o
// jsdom não implementa — sem este polyfill, qualquer teste que renderize o
// canvas do fluxograma da Campanha falha com "ResizeObserver is not defined".
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}

// O player do YouTube só existe no navegador real. Em jsdom, carregar a API
// oficial via `https://www.youtube.com/iframe_api` cria um script externo que
// nunca resolve no ambiente de teste e mantém a execução do Vitest viva. Um
// mock mínimo preserva o comportamento do código sem tentar acessar o Internet.
if (typeof window !== 'undefined' && !window.YT?.Player) {
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
  window.onYouTubeIframeAPIReady = undefined;
}
