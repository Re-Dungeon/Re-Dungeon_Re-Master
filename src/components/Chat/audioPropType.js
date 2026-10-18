import PropTypes from 'prop-types';

// Formato de `audio` (hooks/useAudioMesa.js) aceito pelo ChatSala/AudioDialog.
export const audioPropType = PropTypes.shape({
  tocando: PropTypes.bool.isRequired,
  pausado: PropTypes.bool.isRequired,
  repetir: PropTypes.bool.isRequired,
  titulo: PropTypes.string,
  bloqueado: PropTypes.bool.isRequired,
  erroPlayer: PropTypes.string,
  podeControlar: PropTypes.bool.isRequired,
  volume: PropTypes.number.isRequired,
  mudo: PropTypes.bool.isRequired,
  setVolume: PropTypes.func.isRequired,
  setMudo: PropTypes.func.isRequired,
  liberarSom: PropTypes.func.isRequired,
  tocar: PropTypes.func.isRequired,
  pausar: PropTypes.func.isRequired,
  retomar: PropTypes.func.isRequired,
  parar: PropTypes.func.isRequired,
  setRepetir: PropTypes.func.isRequired,
});
