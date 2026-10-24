import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import RepeatIcon from '@mui/icons-material/Repeat';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import MusicNoteOutlinedIcon from '@mui/icons-material/MusicNoteOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

import { useAuth } from 'context/AuthContext';
import {
  getRmMusicasBibliotecaPorMestre,
  getRmMusicasPastasPorMestre,
  getRmPlaylistsPorMestre,
} from 'service/storage';
import { audioPropType } from './audioPropType';

// Música da mesa: todos veem o que está tocando e ajustam o próprio volume
// (vale só para quem ajustou); o mestre também toca um link do YouTube,
// pausa/retoma, para e liga/desliga o "repetir".
const AudioDialog = ({ open, onClose, audio }) => {
  const auth = useAuth();
  const currentUser = auth?.currentUser ?? null;
  const [link, setLink] = useState('');
  const [repetirNovo, setRepetirNovo] = useState(true);
  const [erroLink, setErroLink] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [imagemFalhouPorVideo, setImagemFalhouPorVideo] = useState({});
  const [capasFalharam, setCapasFalharam] = useState({});
  const [tabAtiva, setTabAtiva] = useState('reprodutor');
  const [biblioteca, setBiblioteca] = useState([]);
  const [pastas, setPastas] = useState([]);
  const [pastaAtivaId, setPastaAtivaId] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [playlistAtivaId, setPlaylistAtivaId] = useState('');

  React.useEffect(() => {
    if (!open || !currentUser?.uid) {
      return undefined;
    }

    let ativo = true;

    const carregarBiblioteca = async () => {
      try {
        const [musicas, listaPastas, listaPlaylists] = await Promise.all([
          getRmMusicasBibliotecaPorMestre(currentUser.uid),
          getRmMusicasPastasPorMestre(currentUser.uid),
          getRmPlaylistsPorMestre(currentUser.uid),
        ]);
        if (!ativo) return;
        setBiblioteca(Array.isArray(musicas) ? musicas : []);
        setPastas(Array.isArray(listaPastas) ? listaPastas : []);
        setPlaylists(Array.isArray(listaPlaylists) ? listaPlaylists : []);
        setPlaylistAtivaId('');
      } catch {
        if (ativo) {
          setBiblioteca([]);
          setPastas([]);
          setPlaylists([]);
          setPlaylistAtivaId('');
        }
      }
    };

    carregarBiblioteca();
    return () => {
      ativo = false;
    };
  }, [currentUser, open]);

  const pastaAtiva =
    pastas.find(pasta => pasta.id === pastaAtivaId) || null;

  const musicasDaPasta = useMemo(
    () =>
      biblioteca.filter(musica =>
        pastaAtivaId ? musica.pastaId === pastaAtivaId : true,
      ),
    [biblioteca, pastaAtivaId],
  );

  const playlistAtiva =
    playlists.find(playlist => playlist.id === playlistAtivaId) || null;

  const playlistsDaPasta = useMemo(() => playlists, [playlists]);

  const repetir = audio.tocando ? audio.repetir : repetirNovo;
  const capaMusica = audio.videoId
    ? `https://img.youtube.com/vi/${audio.videoId}/hqdefault.jpg`
    : null;
  const imagemFalhou = Boolean(audio.videoId && imagemFalhouPorVideo[audio.videoId]);

  const handleTocar = async event => {
    event.preventDefault();
    setEnviando(true);
    try {
      const erro = await audio.tocar(link, repetir);
      setErroLink(erro);
      if (!erro) setLink('');
    } finally {
      setEnviando(false);
    }
  };

  const handleRepetir = event => {
    const valor = event.target.checked;
    setRepetirNovo(valor);
    if (audio.tocando) audio.setRepetir(valor);
  };

  const handleAlternarRepetir = () => {
    handleRepetir({ target: { checked: !repetir } });
  };

  const statusTexto = audio.tocando
    ? audio.pausado
      ? 'PAUSADA'
      : 'TOCANDO AGORA'
    : 'EM ESPERA';

  const tituloMusica = audio.tocando
    ? audio.titulo ?? 'Carregando o título…'
    : 'Nenhuma música tocando.';
  const tempoAtual = Number.isFinite(audio.tempoAtual) ? audio.tempoAtual : 0;
  const duracaoTotal = Number.isFinite(audio.duracao) ? audio.duracao : 0;
  const porcentagemProgresso =
    duracaoTotal > 0 ? Math.min((tempoAtual / duracaoTotal) * 100, 100) : 0;

  const formatarTempo = segundos => {
    if (!Number.isFinite(segundos) || segundos < 0) return '00:00';
    const totalSegundos = Math.floor(segundos);
    const mins = Math.floor(totalSegundos / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSegundos % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleTimeline = (_event, valor) => {
    if (!audio.seekTo || duracaoTotal <= 0) return;
    audio.seekTo((valor / 100) * duracaoTotal);
  };

  const getVideoIdDaUrl = url => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.split('/').filter(Boolean)[0] || null;
      }
      const params = new URLSearchParams(parsed.search);
      return params.get('v') || null;
    } catch {
      return null;
    }
  };

  const tocarMusicaNaBiblioteca = async musica => {
    if (!audio?.podeControlar || !audio?.tocar || !musica?.url) return;
    const resultado = await audio.tocar(musica.url, audio.repetir ?? true);
    if (!resultado) {
      setTabAtiva('reprodutor');
    }
  };

  const playlistComMusicas =
    playlistAtiva && Array.isArray(playlistAtiva.musicas)
      ? playlistAtiva.musicas
          .map(item => {
            const musica = biblioteca.find(musicaItem => musicaItem.id === item?.musicaId);
            return musica ? { ...musica, ordem: item.ordem ?? 0 } : null;
          })
          .filter(Boolean)
      : [];

  const formatarQuantidadeMusicas = quantidade => {
    const total = Number.isFinite(quantidade) ? quantidade : 0;
    return `${total} ${total === 1 ? 'música' : 'músicas'}`;
  };

  const getCapaMusica = musica => {
    if (!musica) return null;
    if (musica.thumbnailUrl) return musica.thumbnailUrl;
    const videoId = getVideoIdDaUrl(musica.url) || musica.videoId;
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  };

  const handleCapaFalhou = id => {
    setCapasFalharam(prev => ({ ...prev, [id]: true }));
  };

  const renderReprodutor = () => (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '220px minmax(0, 1fr)' },
          gap: 2.2,
          p: 2,
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            minHeight: 260,
            width: '100%',
            maxWidth: 220,
            margin: '0 auto',
            borderRadius: 3,
            border: '1px solid rgba(214,176,95,0.22)',
            background:
              'linear-gradient(135deg, rgba(15,23,32,0.92), rgba(27,22,18,0.92) 42%, rgba(6,15,28,0.98))',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 28px rgba(2,6,18,0.28)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top left, rgba(92,130,189,0.18), transparent 30%), linear-gradient(130deg, rgba(236,120,41,0.12), transparent 30%, rgba(0, 222, 255, 0.06) 100%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1.2,
            }}
          >
            <Box
              sx={{
                width: '76%',
                maxWidth: 170,
                aspectRatio: '1 / 1',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  'linear-gradient(135deg, rgba(84,30,17,0.96), rgba(17,25,38,0.94) 38%, rgba(61,9,12,0.96))',
                border: '1px solid rgba(214,176,95,0.28)',
                boxShadow:
                  '0 18px 30px rgba(2,6,18,0.52), inset 0 0 0 1px rgba(255,255,255,0.04)',
                color: '#f7d391',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!imagemFalhou && capaMusica ? (
                <Box
                  key={audio.videoId}
                  component="img"
                  src={capaMusica}
                  alt={tituloMusica}
                  onError={() =>
                    setImagemFalhouPorVideo(prev => ({
                      ...prev,
                      [audio.videoId]: true,
                    }))
                  }
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              ) : (
                <MusicNoteOutlinedIcon sx={{ fontSize: 84, position: 'relative', zIndex: 1 }} />
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', alignContent: 'center', gap: 2.2 }}>
          <Box
            role="status"
            aria-label="Música tocando"
            sx={{
              display: 'grid',
              gap: 0.7,
              px: 1.5,
              py: 1.2,
              borderRadius: 3,
              background:
                'linear-gradient(135deg, rgba(29,40,59,0.82), rgba(11,18,31,0.96))',
              border: '1px solid rgba(148,163,184,0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.9,
                py: 0.35,
                borderRadius: 999,
                background:
                  audio.pausado
                    ? 'rgba(220, 161, 78, 0.12)'
                    : 'rgba(39, 184, 124, 0.1)',
                border: audio.pausado
                  ? '1px solid rgba(220, 161, 78, 0.28)'
                  : '1px solid rgba(61, 217, 139, 0.28)',
                color: audio.pausado ? '#f6d18f' : '#9cecc1',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'inherit',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  lineHeight: 1,
                  fontSize: '0.64rem',
                }}
              >
                {statusTexto}
              </Typography>
            </Box>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 800,
                lineHeight: 1.08,
                fontSize: { xs: '1.3rem', sm: '1.8rem' },
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
              }}
            >
              {tituloMusica}
            </Typography>
            <Typography sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {audio.podeControlar ? 'Mestre da mesa' : 'Música compartilhada'}
            </Typography>
            {audio.erroPlayer && (
              <Typography variant="body2" sx={{ color: '#f7a6a6', mt: 0.2, fontWeight: 600 }}>
                {audio.erroPlayer}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.1,
              px: 0.1,
              minWidth: 0,
              width: '100%',
            }}
          >
            <Button
              type="button"
              variant="contained"
              onClick={audio.pausado ? audio.retomar : audio.pausar}
              disabled={!audio.tocando}
              sx={{
                minWidth: 0,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d8b76d, #9f6d25)',
                color: '#170f09',
                fontWeight: 900,
                boxShadow:
                  '0 0 0 1px rgba(255,255,255,0.08), 0 12px 22px rgba(183,136,56,0.28)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #e1c67d, #ad7729)',
                  boxShadow:
                    '0 0 0 1px rgba(255,255,255,0.12), 0 14px 24px rgba(183,136,56,0.32)',
                },
                '&:disabled': {
                  opacity: 0.42,
                  boxShadow: 'none',
                },
                '& .MuiButton-label': {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                },
              }}
            >
              {audio.pausado ? '▶' : '❚❚'}
            </Button>

            {audio.tocando && (
              <Button
                variant="contained"
                onClick={audio.parar}
                aria-label="Parar música"
                sx={{
                  minWidth: 0,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  padding: 0,
                  background: 'linear-gradient(135deg, rgba(111,40,40,0.96), rgba(70,31,31,0.96))',
                  border: '1px solid rgba(255,138,138,0.46)',
                  color: '#ffd9d9',
                  boxShadow:
                    '0 0 0 1px rgba(255,255,255,0.04), 0 10px 18px rgba(120,40,40,0.26)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(130,46,46,0.98), rgba(95,39,39,0.98))',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: 0.7,
                    background: '#f7b4b4',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)',
                  }}
                />
              </Button>
            )}

            <IconButton
              aria-label={repetir ? 'Desativar repetição' : 'Ativar repetição'}
              aria-pressed={repetir}
              onClick={handleAlternarRepetir}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: repetir
                  ? 'rgba(215,177,101,0.14)'
                  : 'rgba(148,163,184,0.06)',
                border: repetir
                  ? '1px solid rgba(215,177,101,0.52)'
                  : '1px solid rgba(148,163,184,0.2)',
                color: repetir ? '#f5c86a' : '#a7b4c8',
                boxShadow: repetir
                  ? '0 0 0 1px rgba(245,200,106,0.18), 0 0 16px rgba(245,200,106,0.12)'
                  : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: repetir
                    ? 'rgba(215,177,101,0.18)'
                    : 'rgba(148,163,184,0.1)',
                  borderColor: repetir
                    ? 'rgba(215,177,101,0.7)'
                    : 'rgba(148,163,184,0.34)',
                  boxShadow: repetir
                    ? '0 0 0 1px rgba(245,200,106,0.2), 0 0 18px rgba(245,200,106,0.16)'
                    : '0 0 0 1px rgba(255,255,255,0.02)',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.15rem',
                },
              }}
            >
              <RepeatIcon />
            </IconButton>

            <IconButton
              aria-label={audio.mudo ? 'Ativar som' : 'Silenciar'}
              onClick={() => audio.setMudo(!audio.mudo)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(214,176,95,0.08)',
                border: '1px solid rgba(214,176,95,0.25)',
                color: audio.mudo ? 'var(--text-muted)' : '#f7d391',
                '&:hover': {
                  background: 'rgba(214,176,95,0.14)',
                  borderColor: 'rgba(214,176,95,0.36)',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: '1.15rem',
                },
              }}
            >
              {audio.mudo ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>

            <Box sx={{ flex: 1, display: 'grid', gap: 0.65, minWidth: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                  {audio.tocando ? 'Você está ouvindo' : 'Sem reprodução'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                  {audio.tocando ? `${audio.volume}%` : '00:00'}
                </Typography>
              </Box>
              <Slider
                aria-label="Volume da música"
                value={audio.volume}
                min={0}
                max={100}
                onChange={(_event, valor) => audio.setVolume(valor)}
                disabled={audio.mudo}
                sx={{
                  color: '#d7b165',
                  '& .MuiSlider-rail': {
                    opacity: 1,
                    background: 'rgba(148,163,184,0.3)',
                  },
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #6f2da8 0%, #00d9ff 100%)',
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(9,13,21,0.9)',
                    boxShadow: '0 0 0 6px rgba(0,217,255,0.12)',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(0,217,255,0.16)',
                    },
                  },
                  '& .MuiSlider-root': {
                    opacity: 1,
                  },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 0.6, mt: 0.4 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                minWidth: 0,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  minWidth: 38,
                }}
              >
                {formatarTempo(tempoAtual)}
              </Typography>

              <Slider
                aria-label="Timeline da música"
                value={porcentagemProgresso}
                min={0}
                max={100}
                step={0.1}
                onChange={handleTimeline}
                disabled={!audio.tocando && duracaoTotal <= 0}
                sx={{
                  flex: 1,
                  color: '#d7b165',
                  '& .MuiSlider-rail': {
                    opacity: 1,
                    background: 'rgba(148,163,184,0.32)',
                  },
                  '& .MuiSlider-track': {
                    background: 'linear-gradient(90deg, #6f2da8 0%, #00d9ff 100%)',
                    border: 'none',
                  },
                  '& .MuiSlider-thumb': {
                    width: 12,
                    height: 12,
                    border: '2px solid rgba(9,13,21,0.9)',
                    background: '#f7d391',
                    boxShadow: '0 0 0 6px rgba(214,176,95,0.18)',
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(214,176,95,0.22)',
                    },
                  },
                  '& .MuiSlider-root': {
                    opacity: 1,
                  },
                }}
              />

              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  minWidth: 38,
                  textAlign: 'right',
                }}
              >
                {formatarTempo(duracaoTotal)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {audio.podeControlar && (
        <>
          <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)' }} />
          <Box
            component="form"
            onSubmit={handleTocar}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.7,
              p: 2,
              pt: 1.5,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
              }}
            >
              <TextField
                size="small"
                label="Link do YouTube"
                placeholder="https://www.youtube.com/watch?v=…"
                value={link}
                onChange={event => {
                  setLink(event.target.value);
                  setErroLink(null);
                }}
                error={Boolean(erroLink)}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(15,23,42,0.8)',
                    borderRadius: 2,
                    color: 'var(--text-primary)',
                    minHeight: 40,
                    '& fieldset': {
                      borderColor: 'rgba(214,176,95,0.32)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(214,176,95,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(0,217,255,0.9)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    lineHeight: 1.2,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                aria-label="Tocar"
                disabled={!link.trim() || enviando}
                sx={{
                  minWidth: 0,
                  width: 40,
                  height: 40,
                  padding: 0,
                  borderRadius: 2,
                  background:
                    !link.trim() || enviando
                      ? 'linear-gradient(135deg, rgba(116,128,152,0.18), rgba(96,110,128,0.16))'
                      : 'linear-gradient(135deg, rgba(22,18,12,0.98), rgba(39,26,14,0.96))',
                  color:
                    !link.trim() || enviando ? 'rgba(226,232,240,0.58)' : '#f7d391',
                  border:
                    !link.trim() || enviando
                      ? '1px solid rgba(148,163,184,0.2)'
                      : '1px solid rgba(214,176,95,0.4)',
                  boxShadow:
                    !link.trim() || enviando
                      ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
                      : '0 0 0 1px rgba(214,176,95,0.12), 0 10px 18px rgba(183,136,56,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': {
                    background:
                      !link.trim() || enviando
                        ? 'linear-gradient(135deg, rgba(116,128,152,0.18), rgba(96,110,128,0.16))'
                        : 'linear-gradient(135deg, rgba(31,24,14,0.98), rgba(51,38,18,0.96))',
                    boxShadow:
                      !link.trim() || enviando
                        ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
                        : '0 0 0 1px rgba(214,176,95,0.16), 0 12px 20px rgba(183,136,56,0.24)',
                  },
                  '&:disabled': {
                    opacity: 1,
                  },
                }}
              >
                <PlayArrowIcon sx={{ fontSize: '1.15rem', ml: 0.15 }} />
              </Button>
            </Box>
            {erroLink ? (
              <Typography
                variant="caption"
                sx={{
                  color: '#f7a6a6',
                  fontSize: '0.7rem',
                  lineHeight: 1.4,
                  mt: 0.1,
                  ml: 0.5,
                }}
              >
                {erroLink}
              </Typography>
            ) : (
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  lineHeight: 1.4,
                  mt: 0.1,
                  ml: 0.5,
                }}
              >
                Toca para todos com o chat da campanha aberto.
              </Typography>
            )}
          </Box>
        </>
      )}
    </>
  );

  const renderBiblioteca = () => (
    <Box sx={{ p: 2, display: 'grid', gap: 1.25 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          pb: 0.5,
          borderBottom: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
          {pastaAtiva && (
            <Button
              size="small"
              startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
              onClick={() => setPastaAtivaId('')}
              aria-label="Voltar para todas as músicas"
              sx={{
                color: 'var(--text-secondary)',
                borderRadius: 2,
                px: 1,
                py: 0.6,
                minWidth: 0,
                '&:hover': { background: 'rgba(148,163,184,0.08)' },
              }}
            >
              Voltar
            </Button>
          )}
          <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
            {pastaAtiva ? pastaAtiva.nome : 'Biblioteca'}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: 'var(--text-secondary)',
            background: 'rgba(13, 22, 35, 0.9)',
            border: '1px solid rgba(214,176,95,0.22)',
            px: 1,
            py: 0.5,
            borderRadius: 999,
          }}
        >
          {musicasDaPasta.length} músicas
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant={pastaAtivaId === '' ? 'contained' : 'outlined'}
          startIcon={<LibraryMusicOutlinedIcon fontSize="small" />}
          onClick={() => setPastaAtivaId('')}
          aria-label="Todas as músicas"
          sx={{
            minWidth: 0,
            borderRadius: 2,
            px: 1.2,
            py: 0.7,
            background:
              pastaAtivaId === ''
                ? 'linear-gradient(135deg, rgba(214,176,95,0.38), rgba(56,101,148,0.26))'
                : 'transparent',
            borderColor:
              pastaAtivaId === ''
                ? 'rgba(214,176,95,0.44)'
                : 'rgba(148,163,184,0.18)',
            color: 'var(--text-primary)',
            fontWeight: 700,
          }}
        >
          Todas
        </Button>

        {pastas.map(pasta => (
          <Button
            key={pasta.id}
            variant={pastaAtivaId === pasta.id ? 'contained' : 'outlined'}
            startIcon={<FolderOutlinedIcon fontSize="small" />}
            onClick={() => setPastaAtivaId(pasta.id)}
            aria-label={pasta.nome}
            sx={{
              minWidth: 0,
              borderRadius: 2,
              px: 1.2,
              py: 0.7,
              background:
                pastaAtivaId === pasta.id
                  ? 'linear-gradient(135deg, rgba(88,115,180,0.28), rgba(214,176,95,0.18))'
                  : 'transparent',
              borderColor:
                pastaAtivaId === pasta.id
                  ? 'rgba(214,176,95,0.42)'
                  : 'rgba(148,163,184,0.18)',
              color: 'var(--text-primary)',
              fontWeight: 700,
            }}
          >
            {pasta.nome}
          </Button>
        ))}
      </Box>

      {musicasDaPasta.length === 0 ? (
        <Box
          sx={{
            border: '1px dashed rgba(214,176,95,0.2)',
            borderRadius: 3,
            p: 3,
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.02)',
            textAlign: 'center',
          }}
        >
          {pastaAtiva
            ? 'Nenhuma música nesta pasta.'
            : 'Ainda não há músicas na sua biblioteca.'}
        </Box>
      ) : (
        <Stack spacing={0.8} sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
          {musicasDaPasta.map(musica => {
            const videoId = getVideoIdDaUrl(musica.url) || musica.videoId;
            const capa = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
            const tocandoAgora =
              audio?.tocando &&
              (audio.titulo === musica.nome || audio.videoId === videoId || audio?.titulo === musica.nome);

            return (
              <Box
                key={musica.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  minHeight: 74,
                  p: 1,
                  borderRadius: 2.5,
                  border: '1px solid rgba(148,163,184,0.12)',
                  background: tocandoAgora
                    ? 'linear-gradient(90deg, rgba(58,96,148,0.2), rgba(15,21,31,0.96))'
                    : 'linear-gradient(180deg, rgba(13,18,28,0.9), rgba(9,14,22,0.96))',
                  transition: 'all 180ms ease',
                  '&:hover': {
                    background: tocandoAgora
                      ? 'linear-gradient(90deg, rgba(58,96,148,0.24), rgba(14,19,27,0.98))'
                      : 'linear-gradient(180deg, rgba(17,23,35,0.96), rgba(11,15,22,0.98))',
                    borderColor: 'rgba(214,176,95,0.28)',
                  },
                }}
              >
                {capa ? (
                  <Box
                    component="img"
                    src={capa}
                    alt={musica.nome}
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2,
                      objectFit: 'cover',
                      border: '1px solid rgba(214,176,95,0.2)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      background:
                        'linear-gradient(135deg, rgba(214,176,95,0.18), rgba(18,22,32,0.96))',
                      border: '1px solid rgba(214,176,95,0.18)',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <MusicNoteOutlinedIcon sx={{ fontSize: 20 }} />
                  </Box>
                )}

                <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: 'var(--text-primary)',
                          fontWeight: 800,
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {musica.nome}
                      </Typography>
                      {tocandoAgora && (
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.4,
                            borderRadius: 999,
                            background: 'rgba(39,184,124,0.12)',
                            border: '1px solid rgba(39,184,124,0.28)',
                            color: '#9cecc1',
                            px: 0.7,
                            py: 0.15,
                            fontSize: '0.62rem',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontWeight: 800,
                          }}
                        >
                          Tocando
                        </Box>
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mt: 0.2,
                      }}
                    >
                      {musica.descricao || (Array.isArray(musica.tags) && musica.tags[0]) || 'Faixa da biblioteca'}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexShrink: 0,
                    ml: 'auto',
                  }}
                >
                  <Tooltip title="Reproduzir música">
                    <IconButton
                      size="small"
                      aria-label={`Reproduzir ${musica.nome}`}
                      onClick={() => tocarMusicaNaBiblioteca(musica)}
                      sx={{
                        color: '#f6d38d',
                        background: 'rgba(214,176,95,0.12)',
                        border: '1px solid rgba(214,176,95,0.26)',
                        '&:hover': { background: 'rgba(214,176,95,0.18)' },
                      }}
                    >
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Remover música">
                    <IconButton
                      size="small"
                      aria-label={`Remover ${musica.nome}`}
                      sx={{
                        color: '#f4bdbd',
                        border: '1px solid rgba(244, 117, 117, 0.18)',
                        background: 'rgba(244,117,117,0.05)',
                        '&:hover': { background: 'rgba(244,117,117,0.08)' },
                      }}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );

  const renderPlaylists = () => (
    <Box sx={{ p: 2, display: 'grid', gap: 1.25 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          flexWrap: 'wrap',
          pb: 0.5,
          borderBottom: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
          <Button
            size="small"
            startIcon={<ArrowBackOutlinedIcon fontSize="small" />}
            onClick={() => setPlaylistAtivaId('')}
            disabled={!playlistAtiva}
            aria-label="Todas as playlists"
            sx={{
              color: 'var(--text-secondary)',
              borderRadius: 2,
              px: 1,
              py: 0.6,
              minWidth: 0,
              '&:hover': { background: 'rgba(148,163,184,0.08)' },
              '&.Mui-disabled': {
                color: 'var(--text-muted)',
                opacity: 0.7,
              },
            }}
          >
            Todas as playlists
          </Button>
          <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
            {playlistAtiva ? playlistAtiva.nome : 'Playlists'}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: 'var(--text-secondary)',
            background: 'rgba(13, 22, 35, 0.9)',
            border: '1px solid rgba(214,176,95,0.22)',
            px: 1,
            py: 0.5,
            borderRadius: 999,
          }}
        >
          {playlistsDaPasta.length} playlists
        </Typography>
      </Box>

      {playlistsDaPasta.length === 0 ? (
        <Box
          sx={{
            border: '1px dashed rgba(214,176,95,0.2)',
            borderRadius: 3,
            p: 3,
            color: 'var(--text-secondary)',
            background: 'rgba(255,255,255,0.02)',
            textAlign: 'center',
          }}
        >
          Ainda não há playlists na sua biblioteca.
        </Box>
      ) : !playlistAtiva ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
              xl: 'repeat(5, minmax(0, 1fr))',
            },
            gap: 1.5,
            alignItems: 'stretch',
          }}
        >
          {playlistsDaPasta.map(playlist => {
            const quantidadeFaixas = Array.isArray(playlist.musicas) ? playlist.musicas.length : 0;
            const selecionada = playlist.id === playlistAtivaId;
            const primeiraMusica = playlist.musicas?.[0]?.musicaId
              ? biblioteca.find(musica => musica.id === playlist.musicas[0].musicaId)
              : null;
            const capa =
              playlist.linkImagem ||
              (primeiraMusica
                ? `https://img.youtube.com/vi/${getVideoIdDaUrl(primeiraMusica.url) || primeiraMusica.videoId}/hqdefault.jpg`
                : null);

            return (
              <Box
                key={playlist.id}
                role="button"
                tabIndex={0}
                onClick={() => setPlaylistAtivaId(playlist.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setPlaylistAtivaId(playlist.id);
                  }
                }}
                aria-label={playlist.nome}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  borderRadius: 3,
                  border: selecionada
                    ? '1px solid rgba(214,176,95,0.44)'
                    : '1px solid rgba(148,163,184,0.14)',
                  background: selecionada
                    ? 'linear-gradient(180deg, rgba(29,46,68,0.78), rgba(11,17,27,0.96))'
                    : 'linear-gradient(180deg, rgba(17,24,34,0.94), rgba(9,14,22,0.96))',
                  boxShadow: selecionada
                    ? '0 18px 36px rgba(13, 23, 39, 0.38)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                  '&:hover': {
                    borderColor: 'rgba(214,176,95,0.34)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 28px rgba(2, 6, 18, 0.38)',
                  },
                  '&:focus-visible': {
                    outline: '2px solid rgba(214,176,95,0.9)',
                    outlineOffset: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    width: '100%',
                    background:
                      'linear-gradient(135deg, rgba(214,176,95,0.2), rgba(20,33,53,0.96) 60%, rgba(10,14,20,0.98))',
                    borderBottom: '1px solid rgba(148,163,184,0.12)',
                  }}
                >
                  {capa ? (
                    <Box
                      component="img"
                      src={capa}
                      alt={playlist.nome}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        background: 'linear-gradient(135deg, rgba(214,176,95,0.18), rgba(15,23,34,0.96))',
                      }}
                    >
                      <MusicNoteOutlinedIcon sx={{ fontSize: 30 }} />
                    </Box>
                  )}
                </Box>

                <Box sx={{ p: 1.15, display: 'flex', flexDirection: 'column', gap: 0.45 }}>
                  <Tooltip title={playlist.nome || 'Playlist sem nome'}>
                    <Typography
                      sx={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.7em',
                      }}
                    >
                      {playlist.nome}
                    </Typography>
                  </Tooltip>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                    {formatarQuantidadeMusicas(quantidadeFaixas)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box
          sx={{
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(13,18,28,0.9), rgba(9,14,22,0.96))',
            p: 1.5,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              mb: 1.25,
            }}
          >
            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              Músicas da playlist
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              {playlistComMusicas.length} faixas
            </Typography>
          </Box>

          {playlistComMusicas.length === 0 ? (
            <Typography sx={{ color: 'var(--text-secondary)' }}>
              Esta playlist ainda não tem músicas adicionadas.
            </Typography>
          ) : (
            <Box
              sx={{
                maxHeight: playlistComMusicas.length > 6 ? 6 * 52 + 16 : 'none',
                overflowY: playlistComMusicas.length > 6 ? 'auto' : 'visible',
                pr: playlistComMusicas.length > 6 ? 0.5 : 0,
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(214,176,95,0.6) rgba(255,255,255,0.04)',
                '&::-webkit-scrollbar': {
                  width: 8,
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 999,
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(180deg, rgba(214,176,95,0.85), rgba(120,88,45,0.9))',
                  borderRadius: 999,
                },
                scrollbarGutter: 'stable',
              }}
            >
              <Stack spacing={0.8}>
                {playlistComMusicas.map((musica, index) => {
                  const capaKey = `${playlistAtiva.id}-${musica.id}`;
                  const capa = getCapaMusica(musica);
                  const capaQuebrada = Boolean(capasFalharam[capaKey]);

                  return (
                    <Box
                      key={capaKey}
                      role="button"
                      tabIndex={0}
                      onClick={() => tocarMusicaNaBiblioteca(musica)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          tocarMusicaNaBiblioteca(musica);
                        }
                      }}
                      aria-label={`Tocar música ${musica.nome}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        p: 1,
                        borderRadius: 2,
                        border: '1px solid rgba(148,163,184,0.12)',
                        background: 'rgba(255,255,255,0.02)',
                        cursor: audio?.podeControlar ? 'pointer' : 'default',
                        '&:hover': audio?.podeControlar
                          ? { borderColor: 'rgba(214,176,95,0.3)' }
                          : {},
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: 'var(--text-muted)', minWidth: 22, fontWeight: 700 }}
                        >
                          {String(index + 1).padStart(2, '0')}
                        </Typography>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            minWidth: 48,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(214,176,95,0.18)',
                            background: 'linear-gradient(135deg, rgba(214,176,95,0.15), rgba(15,23,34,0.96))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {(capa && !capaQuebrada) ? (
                            <Box
                              component="img"
                              src={capa}
                              alt={musica.nome}
                              onError={() => handleCapaFalhou(capaKey)}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                            />
                          ) : (
                            <MusicNoteOutlinedIcon sx={{ color: 'var(--text-secondary)', fontSize: 20 }} />
                          )}
                        </Box>
                        <Typography
                          sx={{
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {musica.nome}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', ml: 1 }}>
                        {audio?.podeControlar ? 'Tocar' : 'Visualizar'}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            width: 'min(100%, 1120px)',
            borderRadius: 3.5,
            overflow: 'hidden',
            overflowX: 'hidden',
            background:
              'linear-gradient(180deg, rgba(5,9,18,0.98) 0%, rgba(11,18,30,0.97) 100%)',
            border: '1px solid rgba(214,176,95,0.42)',
            boxShadow:
              '0 30px 90px rgba(2, 6, 18, 0.82), inset 0 1px 0 rgba(255,255,255,0.08)',
            color: 'var(--text-primary)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          background:
            'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(20,33,58,0.9) 100%)',
          color: 'var(--text-primary)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontSize: '0.72rem',
          fontWeight: 800,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              borderRadius: 1.75,
              background:
                'linear-gradient(135deg, rgba(214,176,95,0.96), rgba(98,62,20,0.9))',
              color: '#130d07',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            <MusicNoteOutlinedIcon sx={{ fontSize: 16 }} />
          </Box>
          Música da mesa
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          overflowX: 'hidden',
          background:
            'radial-gradient(circle at top, rgba(73,95,135,0.22), transparent 28%), linear-gradient(180deg, rgba(8,13,21,0.96) 0%, rgba(11,18,31,0.96) 100%)',
        }}
      >
        <Tabs
          value={tabAtiva}
          onChange={(_event, nextValue) => setTabAtiva(nextValue)}
          variant="fullWidth"
          sx={{
            px: 2.5,
            pt: 1.5,
            borderBottom: '1px solid rgba(148,163,184,0.12)',
            background: 'rgba(12,18,28,0.45)',
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #d7b165 0%, #8cc7ff 100%)',
              height: 3,
              borderRadius: 999,
            },
            '& .MuiTab-root': {
              color: 'var(--text-secondary)',
              fontWeight: 700,
              textTransform: 'none',
              minHeight: 46,
            },
            '& .Mui-selected': {
              color: 'var(--text-primary) !important',
            },
          }}
        >
          <Tab value="reprodutor" label="Reprodutor" />
          <Tab value="biblioteca" label="Biblioteca" />
          <Tab value="playlists" label="Playlists" />
        </Tabs>

        {tabAtiva === 'biblioteca' && renderBiblioteca()}
        {tabAtiva === 'playlists' && renderPlaylists()}
        {tabAtiva === 'reprodutor' && renderReprodutor()}
      </DialogContent>
      <DialogActions
        sx={{
          px: 2.5,
          py: 1.25,
          borderTop: '1px solid rgba(148,163,184,0.08)',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-secondary)',
            fontWeight: 700,
            minWidth: 110,
            '&:hover': { background: 'rgba(148,163,184,0.07)' },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AudioDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  audio: audioPropType.isRequired,
};

export default AudioDialog;
