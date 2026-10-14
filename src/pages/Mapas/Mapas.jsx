import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Popover from '@mui/material/Popover';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addRmMapa,
  addRmMapaPasta,
  getRmMapasPastasPorCampanha,
  getRmMapasPorCampanha,
  removeRmMapa,
  removeRmMapaPasta,
  updateRmMapa,
  updateRmMapaPasta,
} from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import MapaFormDialog from './MapaFormDialog';
import MapaPastaFormDialog from './MapaPastaFormDialog';
import MapaViewerDialog from './MapaViewerDialog';
import {
  MAPA_CATEGORIA_OPCOES,
  MAPA_INITIAL_VALUES,
  normalizeMapaCategoria,
  normalizeMapaTags,
} from './mapaUtils';

const cardSx = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'linear-gradient(180deg, rgba(23, 27, 34, 0.96), rgba(17, 20, 26, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  overflow: 'hidden',
  boxShadow: '0 18px 38px rgba(0, 0, 0, 0.22)',
  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    boxShadow: '0 22px 44px rgba(0, 0, 0, 0.3)',
  },
};

const mediaSx = {
  position: 'relative',
  height: 180,
  background: 'var(--bg-secondary)',
  borderBottom: '1px solid var(--border-primary)',
  overflow: 'hidden',
  '&:hover .mapa-image': {
    transform: 'scale(1.02)',
  },
};

const contentSx = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  p: 2,
};

const titleSx = {
  color: 'var(--text-primary)',
  fontWeight: 700,
  fontSize: '1.05rem',
  lineHeight: 1.3,
  letterSpacing: '-0.01em',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: '2.8em',
};

const descriptionSx = {
  color: 'var(--text-secondary)',
  fontSize: '0.85rem',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: '3em',
  mb: 1,
};

const badgeSx = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: 1,
  py: 0.45,
  borderRadius: 1.5,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(10, 12, 16, 0.66)',
  color: 'var(--text-primary)',
  fontSize: '0.6rem',
  letterSpacing: '0.12em',
  fontWeight: 700,
  textTransform: 'uppercase',
  backdropFilter: 'blur(6px)',
};

const pastaCardSx = {
  ...cardSx,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    boxShadow: '0 20px 42px rgba(0, 0, 0, 0.28)',
  },
};

const pastaDescriptionSx = {
  color: 'var(--text-secondary)',
  fontSize: '0.82rem',
  lineHeight: 1.6,
  height: '88px',
  minHeight: '0',
  maxHeight: '88px',
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  hyphens: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: '#71343b #111722',
  '&::-webkit-scrollbar': {
    width: '7px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#111722',
    borderRadius: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#71343b',
    borderRadius: '8px',
    '&:hover': {
      background: '#a74a54',
    },
  },
};

const actionButtonSx = {
  width: 30,
  height: 30,
  borderRadius: 1.5,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(9, 12, 16, 0.72)',
  color: 'var(--text-primary)',
  backdropFilter: 'blur(6px)',
  transition: 'all 180ms ease',
  '&:hover': {
    background: 'rgba(196, 58, 47, 0.12)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    color: 'var(--color-accent)',
  },
};

const Mapas = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [mostrarFavoritos, setMostrarFavoritos] = useState(false);
  const [ordem, setOrdem] = useState('recentes');
  const [formDialogAberto, setFormDialogAberto] = useState(false);
  const [mapaEmEdicao, setMapaEmEdicao] = useState(null);
  const [mapaPastaId, setMapaPastaId] = useState(null);
  const [pastaDialogAberto, setPastaDialogAberto] = useState(false);
  const [pastaEmEdicao, setPastaEmEdicao] = useState(null);
  const [pastaAtivaId, setPastaAtivaId] = useState(null);
  const [viewerMapa, setViewerMapa] = useState(null);
  const [confirmDeleteMapa, setConfirmDeleteMapa] = useState(null);
  const [contextMenuMapaId, setContextMenuMapaId] = useState(null);
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [mapaParaMover, setMapaParaMover] = useState(null);
  const [mapaDestinoPastaId, setMapaDestinoPastaId] = useState(null);
  const [buscaPasta, setBuscaPasta] = useState('');
  const { notifyError, notifySuccess } = useSnackbar();

  const getMapasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmMapasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
  }, [campanhaAtiva]);

  const getPastasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmMapasPastasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
  }, [campanhaAtiva]);

  const {
    items: mapas,
    loading: loadingMapas,
    error: errorMapas,
    reload: reloadMapas,
    setItems: setMapas,
  } = useEntityCRUD({ getAll: getMapasDaCampanha, remove: removeRmMapa });

  const {
    items: pastas,
    loading: loadingPastas,
    error: errorPastas,
    reload: reloadPastas,
    setItems: setPastas,
  } = useEntityCRUD({
    getAll: getPastasDaCampanha,
    remove: removeRmMapaPasta,
  });

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  const loading = loadingCampanhas || loadingMapas || loadingPastas;
  const podeEscrever = campanhaAtiva
    ? isAdmin || campanhaAtiva.mestreId === currentUser.uid
    : false;

  const filtrarMapas = useCallback(
    lista => {
      const valorBusca = busca.trim().toLowerCase();
      return lista
        .map(mapa => ({
          ...mapa,
          categoria: normalizeMapaCategoria(mapa.categoria),
          tags: normalizeMapaTags(mapa.tags),
          favorito: Boolean(mapa.favorito),
        }))
        .filter(mapa => {
          const matchesBusca =
            !valorBusca ||
            [mapa.nome, mapa.descricao, mapa.categoria, ...(mapa.tags || [])]
              .join(' ')
              .toLowerCase()
              .includes(valorBusca);
          const matchesCategoria =
            categoriaFiltro === 'todas' || mapa.categoria === categoriaFiltro;
          const matchesFavoritos = !mostrarFavoritos || mapa.favorito;
          return matchesBusca && matchesCategoria && matchesFavoritos;
        })
        .sort((a, b) => {
          if (ordem === 'nome') {
            return String(a.nome || '').localeCompare(String(b.nome || ''));
          }
          if (ordem === 'antigos') {
            return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          }
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
    },
    [busca, categoriaFiltro, mostrarFavoritos, ordem],
  );

  const pastasOrdenadas = useMemo(
    () =>
      [...pastas].sort((a, b) => {
        const ordemA = Number.isFinite(Number(a.ordem)) ? Number(a.ordem) : 999;
        const ordemB = Number.isFinite(Number(b.ordem)) ? Number(b.ordem) : 999;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return String(a.nome || '').localeCompare(String(b.nome || ''));
      }),
    [pastas],
  );

  const contextMenuMapa = useMemo(
    () => mapas.find(mapa => mapa.id === contextMenuMapaId) || null,
    [contextMenuMapaId, mapas],
  );

  const pastasDisponiveisParaMover = useMemo(() => {
    const termo = buscaPasta.trim().toLowerCase();
    return pastasOrdenadas.filter(pasta => {
      if (!termo) return true;
      return String(pasta.nome || '').toLowerCase().includes(termo);
    });
  }, [buscaPasta, pastasOrdenadas]);

  const temPastaValida = mapa => {
    const pastaId = mapa?.pastaId;
    return pastaId !== null && pastaId !== undefined && String(pastaId).trim() !== '';
  };

  const mapasOrdenados = useMemo(() => filtrarMapas([...mapas]), [filtrarMapas, mapas]);
  const mapasSemPastaReal = useMemo(
    () => mapas.filter(mapa => !temPastaValida(mapa)),
    [mapas],
  );
  const mapasSemPasta = useMemo(
    () => mapasOrdenados.filter(mapa => !temPastaValida(mapa)),
    [mapasOrdenados],
  );
  const mapasDaPastaAtiva = useMemo(
    () => mapasOrdenados.filter(mapa => mapa.pastaId === pastaAtivaId),
    [mapasOrdenados, pastaAtivaId],
  );
  const bibliotecaVazia = mapas.length === 0 && pastas.length === 0;
  const buscaSemResultados = mapas.length > 0 && mapasOrdenados.length === 0;
  const mostrarSecaoMapasSemPasta = mapasSemPastaReal.length > 0;

  const voltarParaBiblioteca = () => setPastaAtivaId(null);

  const getPastaCapa = pasta => {
    if (pasta?.imagemCapa) return pasta.imagemCapa;
    const mapaComImagem = mapas.find(mapa => mapa.pastaId === pasta.id && mapa.linkImagem);
    return mapaComImagem?.linkImagem || '';
  };

  const limparFiltros = () => {
    setBusca('');
    setCategoriaFiltro('todas');
    setMostrarFavoritos(false);
    setOrdem('recentes');
  };

  const abrirDialogMapa = (mapa, pastaId = null) => {
    setMapaEmEdicao(mapa || null);
    setMapaPastaId(pastaId);
    setFormDialogAberto(true);
  };

  const fecharDialogMapa = () => {
    setMapaEmEdicao(null);
    setMapaPastaId(null);
    setFormDialogAberto(false);
  };

  const abrirDialogPasta = pasta => {
    setPastaEmEdicao(pasta || null);
    setPastaDialogAberto(true);
  };

  const fecharDialogPasta = () => {
    setPastaEmEdicao(null);
    setPastaDialogAberto(false);
  };

  const handleSalvarPasta = async (values, { setSubmitting }) => {
    const payload = {
      nome: String(values.nome || '').trim(),
      descricao: String(values.descricao || '').trim(),
      imagemCapa: String(values.imagemCapa || '').trim(),
    };

    if (pastaEmEdicao) {
      await updateRmMapaPasta(pastaEmEdicao.id, payload);
      setPastas(prev =>
        prev.map(item => (item.id === pastaEmEdicao.id ? { ...item, ...payload } : item)),
      );
    } else {
      const novaPasta = {
        ...payload,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
        ordem: (pastas.length || 0) + 1,
      };
      const criada = await addRmMapaPasta(novaPasta);
      setPastas(prev => [
        ...prev,
        { ...novaPasta, id: criada?.id || `pasta-${Date.now()}` },
      ]);
    }

    setSubmitting(false);
    fecharDialogPasta();
    reloadPastas();
  };

  const handleDeletePasta = async pasta => {
    if (!pasta) return;
    await removeRmMapaPasta(pasta.id);
    setPastas(prev => prev.filter(item => item.id !== pasta.id));
    setMapas(prev =>
      prev.map(mapa => (mapa.pastaId === pasta.id ? { ...mapa, pastaId: null } : mapa)),
    );
    if (pastaAtivaId === pasta.id) setPastaAtivaId(null);
  };

  const handleDeleteMapa = async mapa => {
    if (!mapa) return;
    await removeRmMapa(mapa.id);
    setMapas(prev => prev.filter(item => item.id !== mapa.id));
    setConfirmDeleteMapa(null);
  };

  const abrirMenuContextoMapa = (event, mapa) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenuMapaId(mapa?.id || null);
    setContextMenuPos({ top: event.clientY, left: event.clientX });
  };

  const fecharMenuContextoMapa = () => {
    setContextMenuMapaId(null);
    setContextMenuPos(null);
  };

  const abrirMoverMapaParaPasta = mapa => {
    if (!mapa) return;
    setMapaParaMover(mapa);
    setMapaDestinoPastaId(mapa.pastaId || null);
    setBuscaPasta('');
    fecharMenuContextoMapa();
  };

  const confirmarMovimentoMapa = async () => {
    if (!mapaParaMover) return;

    const proximaPastaId = mapaDestinoPastaId || null;
    const pastaAtualId = mapaParaMover.pastaId || null;

    if (proximaPastaId === pastaAtualId) {
      setMapaParaMover(null);
      setMapaDestinoPastaId(null);
      setBuscaPasta('');
      return;
    }

    const pastaDestino = proximaPastaId
      ? pastasOrdenadas.find(pasta => pasta.id === proximaPastaId)
      : null;
    if (proximaPastaId && !pastaDestino) {
      notifyError('A pasta selecionada não foi encontrada.');
      return;
    }

    await updateRmMapa(mapaParaMover.id, { pastaId: proximaPastaId });
    setMapas(prev =>
      prev.map(item =>
        item.id === mapaParaMover.id ? { ...item, pastaId: proximaPastaId } : item,
      ),
    );
    setMapaParaMover(null);
    setMapaDestinoPastaId(null);
    setBuscaPasta('');
    notifySuccess(
      proximaPastaId
        ? `Mapa movido para ${pastaDestino?.nome || 'a pasta selecionada'}.`
        : 'Mapa removido da pasta e movido para "Sem Pasta".',
    );
  };

  const handleSalvarMapa = async (values, { setSubmitting }) => {
    const payload = {
      ...values,
      categoria: normalizeMapaCategoria(values.categoria),
      tags: normalizeMapaTags(values.tags),
      favorito: Boolean(values.favorito),
    };

    if (mapaEmEdicao) {
      await updateRmMapa(mapaEmEdicao.id, payload);
      setMapas(prev =>
        prev.map(item => (item.id === mapaEmEdicao.id ? { ...item, ...payload } : item)),
      );
    } else {
      await addRmMapa({
        ...payload,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
        pastaId: mapaPastaId || null,
      });
      reloadMapas();
    }

    setSubmitting(false);
    fecharDialogMapa();
  };

  const handleToggleFavorito = async mapa => {
    const proximoValor = !mapa.favorito;
    await updateRmMapa(mapa.id, { favorito: proximoValor });
    setMapas(prev =>
      prev.map(item => (item.id === mapa.id ? { ...item, favorito: proximoValor } : item)),
    );
  };

  const handleDuplicarMapa = async mapa => {
    const payload = {
      ...mapa,
      nome: `${mapa.nome || 'Mapa'} (Cópia)`,
      id: undefined,
      favorito: false,
      tags: normalizeMapaTags(mapa.tags),
      categoria: normalizeMapaCategoria(mapa.categoria),
      campanhaId: campanhaAtiva.id,
      universoId: campanhaAtiva.universoId,
      mestreId: campanhaAtiva.mestreId,
      pastaId: mapa.pastaId || null,
    };
    await addRmMapa(payload);
    reloadMapas();
  };

  const handleUsarNoCardFlux = mapa => {
    navigate(ROUTE_PATHS.CARDFLUX_EXPLORACAO_CONFIG, {
      state: {
        origemMapaId: mapa?.id || null,
        imagemFundo: {
          origem: 'mapa',
          mapaId: mapa?.id || null,
          url: mapa?.linkImagem || '',
          ajuste: 'cover',
          opacidadeQuadrantes: 20,
        },
      },
    });
  };

  const dialogInitialValues = mapaEmEdicao
    ? {
        ...MAPA_INITIAL_VALUES,
        ...mapaEmEdicao,
        categoria: normalizeMapaCategoria(mapaEmEdicao.categoria),
        tags: normalizeMapaTags(mapaEmEdicao.tags),
        favorito: Boolean(mapaEmEdicao.favorito),
      }
    : {
        ...MAPA_INITIAL_VALUES,
        tags: [...MAPA_INITIAL_VALUES.tags],
        favorito: false,
      };

  const pastaDialogInitialValues = pastaEmEdicao
    ? {
        nome: pastaEmEdicao.nome || '',
        descricao: pastaEmEdicao.descricao || '',
        imagemCapa: pastaEmEdicao.imagemCapa || '',
      }
    : { nome: '', descricao: '', imagemCapa: '' };

  const renderMapaCard = mapa => {
    const categoria = MAPA_CATEGORIA_OPCOES.find(opcao => opcao.value === mapa.categoria);
    const categoriaLabel = categoria ? categoria.label : 'Outro';
    const tags = normalizeMapaTags(mapa.tags).slice(0, 3);

    return (
      <Paper
        key={mapa.id}
        elevation={0}
        sx={cardSx}
        onContextMenu={event => abrirMenuContextoMapa(event, mapa)}
      >
        <Box sx={mediaSx}>
          {mapa.linkImagem ? (
            <Box
              component="img"
              className="mapa-image"
              src={mapa.linkImagem}
              alt={mapa.nome}
              loading="lazy"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transition: 'transform 220ms ease',
              }}
              onClick={() => setViewerMapa(mapa)}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                background:
                  'linear-gradient(180deg, rgba(18,21,26,0.8), rgba(17,20,26,0.98))',
                color: 'var(--text-muted)',
              }}
            >
              <MapOutlinedIcon sx={{ fontSize: 32 }} />
              <Typography variant="caption">Sem imagem</Typography>
            </Box>
          )}

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10, 12, 16, 0.08), rgba(10, 12, 16, 0.68) 100%)',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={() => handleToggleFavorito(mapa)}
              aria-label={mapa.favorito ? 'Remover favorito' : 'Adicionar favorito'}
              sx={{
                ...actionButtonSx,
                background: mapa.favorito
                  ? 'rgba(251,191,36,0.12)'
                  : 'rgba(9,12,16,0.72)',
                color: mapa.favorito ? '#fbbf24' : 'var(--text-primary)',
              }}
            >
              {mapa.favorito ? (
                <StarOutlinedIcon fontSize="small" />
              ) : (
                <StarBorderOutlinedIcon fontSize="small" />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={event => abrirMenuContextoMapa(event, mapa)}
              aria-label={`Ações do mapa ${mapa.nome}`}
              sx={actionButtonSx}
            >
              <MoreHorizOutlinedIcon fontSize="small" />
            </IconButton>
            <Box sx={badgeSx}>{categoriaLabel.toUpperCase()}</Box>
          </Box>

          {podeEscrever && (
            <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'flex', gap: 0.75 }}>
              <IconButton
                size="small"
                title={`Editar mapa ${mapa.nome}`}
                onClick={() => abrirDialogMapa(mapa, mapa.pastaId || null)}
                sx={actionButtonSx}
                aria-label={`Editar mapa ${mapa.nome}`}
              >
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                title={`Remover mapa ${mapa.nome}`}
                onClick={() => handleDeleteMapa(mapa)}
                sx={{
                  ...actionButtonSx,
                  color: '#fca5a5',
                  '&:hover': {
                    background: 'rgba(127, 29, 29, 0.35)',
                    borderColor: 'rgba(248, 113, 113, 0.5)',
                    color: '#fecaca',
                  },
                }}
                aria-label={`Remover mapa ${mapa.nome}`}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        <Box sx={contentSx}>
          <Typography variant="h6" sx={titleSx}>{mapa.nome}</Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1 }}>
            {tags.length > 0 ? (
              tags.map(tag => (
                <Chip
                  key={`${mapa.id}-${tag}`}
                  label={tag}
                  size="small"
                  sx={{
                    background: 'rgba(15,23,42,0.9)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              ))
            ) : (
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                Sem tags
              </Typography>
            )}
          </Box>

          {mapa.descricao ? (
            <Typography variant="body2" sx={descriptionSx}>{mapa.descricao}</Typography>
          ) : (
            <Box sx={{ minHeight: '3em', mb: 1 }} />
          )}

          <Box sx={{ mt: 'auto', display: 'flex', gap: 1, mb: 1.25, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<VisibilityOutlinedIcon />}
              onClick={() => setViewerMapa(mapa)}
              sx={{
                background: 'rgba(25,118,210,0.16)',
                color: 'var(--text-primary)',
                border: '1px solid rgba(59,130,246,0.35)',
              }}
            >
              Visualizar
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MapOutlinedIcon />}
              onClick={() => handleUsarNoCardFlux(mapa)}
              sx={{ borderColor: 'rgba(196,58,47,0.42)', color: 'var(--text-primary)' }}
            >
              Usar no CardFlux
            </Button>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.25 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 0,
                color: 'var(--text-secondary)',
              }}
            >
              <MapOutlinedIcon sx={{ fontSize: 14 }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                }}
              >
                {categoriaLabel}
              </Typography>
            </Box>
            {podeEscrever && (
              <IconButton
                size="small"
                onClick={() => handleDuplicarMapa(mapa)}
                aria-label={`Duplicar mapa ${mapa.nome}`}
                sx={{ ...actionButtonSx, width: 28, height: 28 }}
              >
                <ContentCopyOutlinedIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  if (!campanhaAtiva && !loadingCampanhas) return null;

  return (
    <Box className="page-container">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 0.5 }}>
            Biblioteca de Mapas
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'var(--text-secondary)' }}>
            {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
            {mapas.length} {mapas.length === 1 ? 'mapa' : 'mapas'}
          </Typography>
        </Box>

        {podeEscrever && (
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => abrirDialogPasta(null)}
              sx={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', borderRadius: 2 }}
            >
              + Nova Pasta
            </Button>
            <Button
              variant="contained"
              onClick={() => abrirDialogMapa(null, pastaAtivaId)}
              sx={{
                background: 'linear-gradient(135deg, rgba(196,58,47,0.88), rgba(159,18,57,0.9))',
                color: 'white',
                fontWeight: 800,
                borderRadius: 2,
              }}
            >
              + Novo Mapa
            </Button>
          </Box>
        )}
      </Box>

      <Popover
        open={Boolean(contextMenuMapa)}
        anchorReference="anchorPosition"
        anchorPosition={contextMenuPos || undefined}
        onClose={fecharMenuContextoMapa}
        disableRestoreFocus
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              background: 'rgba(10, 12, 16, 0.98)',
              border: '1px solid var(--border-primary)',
              borderRadius: 2,
              boxShadow: '0 30px 80px rgba(2, 6, 23, 0.72)',
              overflow: 'visible',
              minWidth: 220,
            },
          },
        }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            py: 0.5,
            px: 0.5,
          }}
          role="menu"
        >
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ações do Mapa
            </Typography>
          </Box>

          <Button
            type="button"
            onClick={() => {
              setViewerMapa(contextMenuMapa);
              fecharMenuContextoMapa();
            }}
            startIcon={<VisibilityOutlinedIcon />}
            sx={{ justifyContent: 'flex-start', color: 'var(--text-primary)', px: 1.5, py: 1, borderRadius: 1.25 }}
          >
            Visualizar
          </Button>

          {podeEscrever && (
            <>
              <Button
                type="button"
                onClick={() => {
                  abrirDialogMapa(contextMenuMapa, contextMenuMapa?.pastaId || null);
                  fecharMenuContextoMapa();
                }}
                startIcon={<EditOutlinedIcon />}
                sx={{ justifyContent: 'flex-start', color: 'var(--text-primary)', px: 1.5, py: 1, borderRadius: 1.25 }}
              >
                Editar
              </Button>

              <Button
                type="button"
                onClick={() => abrirMoverMapaParaPasta(contextMenuMapa)}
                startIcon={<FolderOutlinedIcon />}
                sx={{
                  justifyContent: 'flex-start',
                  color: 'white',
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.25,
                  background: 'linear-gradient(135deg, rgba(196,58,47,0.2), rgba(148,163,184,0.08))',
                  border: '1px solid rgba(196,58,47,0.38)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(196,58,47,0.28), rgba(148,163,184,0.1))',
                  },
                }}
              >
                Mover para Pasta
              </Button>

              <Button
                type="button"
                onClick={() => {
                  handleDuplicarMapa(contextMenuMapa);
                  fecharMenuContextoMapa();
                }}
                startIcon={<ContentCopyOutlinedIcon />}
                sx={{ justifyContent: 'flex-start', color: 'var(--text-primary)', px: 1.5, py: 1, borderRadius: 1.25 }}
              >
                Duplicar
              </Button>

              <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', my: 0.5 }} />

              <Button
                type="button"
                onClick={() => {
                  setConfirmDeleteMapa(contextMenuMapa);
                  fecharMenuContextoMapa();
                }}
                startIcon={<DeleteOutlineIcon />}
                sx={{ justifyContent: 'flex-start', color: '#fca5a5', px: 1.5, py: 1, borderRadius: 1.25, '&:hover': { background: 'rgba(127,29,29,0.18)' } }}
              >
                Excluir
              </Button>
            </>
          )}
        </Box>
      </Popover>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid var(--border-primary)',
          borderRadius: 3,
          background: 'rgba(15,19,25,0.86)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0,1.2fr) repeat(2, minmax(160px, 0.8fr)) auto' },
            gap: 1.5,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              border: '1px solid var(--border-primary)',
              borderRadius: 1,
              px: 1.25,
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <SearchOutlinedIcon sx={{ color: 'var(--text-secondary)' }} />
            <TextField
              label="Buscar mapa"
              value={busca}
              onChange={event => setBusca(event.target.value)}
              size="small"
              variant="standard"
              slotProps={{
                input: {
                  disableUnderline: true,
                },
              }}
              sx={{
                flex: 1,
                '& .MuiInputBase-root': { color: 'var(--text-primary)' },
                '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
              }}
            />
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel id="mapa-categoria-label">Categoria</InputLabel>
            <Select
              labelId="mapa-categoria-label"
              value={categoriaFiltro}
              label="Categoria"
              onChange={event => setCategoriaFiltro(event.target.value)}
              sx={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-primary)' }}
            >
              <MenuItem value="todas">Todas</MenuItem>
              {MAPA_CATEGORIA_OPCOES.map(opcao => (
                <MenuItem key={opcao.value} value={opcao.value}>{opcao.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel id="mapa-ordem-label">Ordenar</InputLabel>
            <Select
              labelId="mapa-ordem-label"
              value={ordem}
              label="Ordenar"
              onChange={event => setOrdem(event.target.value)}
              sx={{ background: 'rgba(255,255,255,0.01)', color: 'var(--text-primary)' }}
            >
              <MenuItem value="recentes">Mais recentes</MenuItem>
              <MenuItem value="antigos">Mais antigos</MenuItem>
              <MenuItem value="nome">Nome</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={mostrarFavoritos}
                onChange={() => setMostrarFavoritos(valor => !valor)}
                slotProps={{ input: { 'aria-label': 'Mostrar apenas favoritos' } }}
              />
            }
            label="Mostrar apenas favoritos"
            sx={{ ml: 0, color: 'var(--text-primary)' }}
          />

          <Button
            variant="text"
            onClick={limparFiltros}
            sx={{ color: 'var(--text-secondary)', justifySelf: 'end' }}
          >
            Limpar
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorMapas ? (
        <ListLoadError
          mensagem="Erro ao carregar os mapas da campanha."
          onRetry={() => {
            reloadMapas();
          }}
        />
      ) : (
        <>
          {errorPastas && (
            <Box sx={{ mb: 2 }}>
              <ListLoadError
                mensagem="Erro ao carregar as pastas da campanha."
                onRetry={() => {
                  reloadPastas();
                }}
              />
            </Box>
          )}

          {pastaAtivaId ? (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography variant="button" sx={{ color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
                    Biblioteca de Mapas / {pastas.find(pasta => pasta.id === pastaAtivaId)?.nome || 'Pasta'}
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 800, mt: 0.5 }}>
                    {pastas.find(pasta => pasta.id === pastaAtivaId)?.nome || 'Pasta'}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={voltarParaBiblioteca}
                  sx={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                >
                  Voltar à biblioteca
                </Button>
              </Box>

              {mapasDaPastaAtiva.length > 0 ? (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                    gap: 2.5,
                  }}
                >
                  {mapasDaPastaAtiva.map(mapa => renderMapaCard(mapa))}
                </Box>
              ) : (
                <Box className="empty-state">
                  <span className="empty-state-icon">📁</span>
                  <p>Nenhum mapa nesta pasta</p>
                  <small>Adicione um novo mapa para começar a organização da região.</small>
                  {podeEscrever && (
                    <Button
                      variant="contained"
                      onClick={() => abrirDialogMapa(null, pastaAtivaId)}
                      sx={{
                        mt: 2,
                        background: 'var(--color-primary)',
                        '&:hover': { background: 'var(--color-primary-dark)' },
                      }}
                    >
                      + Adicionar Mapa
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <>
              {bibliotecaVazia ? (
                <Box className="empty-state">
                  <span className="empty-state-icon">🗺️</span>
                  <p>Sua biblioteca de mapas está vazia.</p>
                  <small>Crie uma pasta ou um mapa para começar a organização.</small>
                  {podeEscrever && (
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        onClick={() => abrirDialogPasta(null)}
                        sx={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                      >
                        + Criar Pasta
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => abrirDialogMapa(null, null)}
                        sx={{
                          background: 'linear-gradient(135deg, rgba(196,58,47,0.88), rgba(159,18,57,0.9))',
                          color: 'white',
                          fontWeight: 800,
                          borderRadius: 2,
                        }}
                      >
                        + Criar Mapa
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : null}

              {!bibliotecaVazia && buscaSemResultados && (
                <Box className="empty-state">
                  <span className="empty-state-icon">🔎</span>
                  <p>Nenhum mapa encontrado para essa busca.</p>
                  <small>Tente limpar os filtros ou usar outros termos para encontrar o mapa desejado.</small>
                  <Button
                    variant="outlined"
                    onClick={limparFiltros}
                    sx={{ mt: 2, borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                  >
                    Limpar filtros
                  </Button>
                </Box>
              )}

              {pastasOrdenadas.length > 0 && !buscaSemResultados && (
                <Box sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                      Pastas
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                      gap: 2,
                    }}
                  >
                    {pastasOrdenadas.map(pasta => {
                      const quantidade = mapas.filter(mapa => mapa.pastaId === pasta.id).length;
                      const capa = getPastaCapa(pasta);

                      return (
                        <Paper key={pasta.id} elevation={0} sx={pastaCardSx}>
                          <Box
                            sx={{
                              position: 'relative',
                              height: 190,
                              width: '100%',
                              borderBottom: '1px solid var(--border-primary)',
                              background: capa
                                ? 'transparent'
                                : 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(196,58,47,0.12))',
                              overflow: 'hidden',
                              flexShrink: 0,
                            }}
                          >
                            {capa ? (
                              <Box
                                component="img"
                                src={capa}
                                alt={pasta.nome}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                  display: 'block',
                                  transition: 'transform 180ms ease',
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                  },
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
                                }}
                              >
                                <FolderOutlinedIcon sx={{ fontSize: 42 }} />
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(180deg, rgba(10,12,16,0.08), rgba(10,12,16,0.74) 100%)',
                              }}
                            />
                            {podeEscrever && (
                              <Box sx={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 0.75 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => abrirDialogPasta(pasta)}
                                  aria-label={`Editar pasta ${pasta.nome}`}
                                  sx={actionButtonSx}
                                >
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeletePasta(pasta)}
                                  aria-label={`Excluir pasta ${pasta.nome}`}
                                  sx={{
                                    ...actionButtonSx,
                                    color: '#fca5a5',
                                    '&:hover': {
                                      background: 'rgba(127,29,29,0.35)',
                                      borderColor: 'rgba(248,113,113,0.5)',
                                      color: '#fecaca',
                                    },
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                color: 'var(--text-primary)',
                                fontWeight: 800,
                                mb: 0.75,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minHeight: '2.75em',
                                lineHeight: 1.35,
                              }}
                            >
                              {pasta.nome}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                ...pastaDescriptionSx,
                                mt: 0,
                                mb: 1.5,
                                flex: '0 0 auto',
                              }}
                            >
                              {pasta.descricao || 'Sem descrição.'}
                            </Typography>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 1,
                                mt: 'auto',
                                minHeight: 48,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>
                                {quantidade} {quantidade === 1 ? 'mapa' : 'mapas'}
                              </Typography>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => setPastaAtivaId(pasta.id)}
                                sx={{
                                  background: 'rgba(25,118,210,0.14)',
                                  border: '1px solid rgba(59,130,246,0.32)',
                                  color: 'var(--text-primary)',
                                  minWidth: 82,
                                }}
                              >
                                Abrir
                              </Button>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {!buscaSemResultados && mostrarSecaoMapasSemPasta && (
                <Box sx={{ mt: pastasOrdenadas.length > 0 ? 4 : 0 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                      Mapas sem pasta
                    </Typography>
                    {podeEscrever && (
                      <Button
                        variant="contained"
                        onClick={() => abrirDialogMapa(null, null)}
                        sx={{
                          background: 'linear-gradient(135deg, rgba(196,58,47,0.88), rgba(159,18,57,0.9))',
                          color: 'white',
                          fontWeight: 800,
                          borderRadius: 2,
                        }}
                      >
                        + Novo Mapa
                      </Button>
                    )}
                  </Box>

                  {mapasSemPasta.length === 0 ? (
                    <Box className="empty-state">
                      <span className="empty-state-icon">🔎</span>
                      <p>Nenhum mapa encontrado para essa busca.</p>
                      <small>Ajuste os filtros para ver os mapas que ficaram fora das pastas.</small>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0,1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                        gap: 2.5,
                      }}
                    >
                      {mapasSemPasta.map(mapa => renderMapaCard(mapa))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </>
      )}

      <MapaPastaFormDialog
        open={pastaDialogAberto}
        mode={pastaEmEdicao ? 'edit' : 'create'}
        initialValues={pastaDialogInitialValues}
        onClose={fecharDialogPasta}
        onSubmit={handleSalvarPasta}
        submitLabel={pastaEmEdicao ? 'Salvar Pasta' : 'Salvar Pasta'}
        title={pastaEmEdicao ? 'Editar Pasta' : 'Nova Pasta'}
      />

      <MapaFormDialog
        key={mapaEmEdicao?.id || 'novo-mapa'}
        open={formDialogAberto}
        mode={mapaEmEdicao ? 'edit' : 'create'}
        initialValues={dialogInitialValues}
        onClose={fecharDialogMapa}
        onSubmit={handleSalvarMapa}
        submitLabel={mapaEmEdicao ? 'Salvar Alterações' : 'Salvar Mapa'}
        title={mapaEmEdicao ? 'Editar Mapa' : 'Novo Mapa'}
      />

      <MapaViewerDialog
        key={viewerMapa?.id || 'mapa-viewer-closed'}
        open={Boolean(viewerMapa)}
        mapa={viewerMapa}
        onClose={() => setViewerMapa(null)}
        onUseInCardFlux={mapa => {
          setViewerMapa(null);
          handleUsarNoCardFlux(mapa);
        }}
      />

      <Dialog
        open={Boolean(mapaParaMover)}
        onClose={() => {
          setMapaParaMover(null);
          setMapaDestinoPastaId(null);
          setBuscaPasta('');
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          Mover mapa para pasta
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <DialogContentText sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            Escolha a pasta de destino para este mapa.
          </DialogContentText>

          <Box sx={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 2, alignItems: 'center', mb: 2.5 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid var(--border-primary)',
                background: 'linear-gradient(135deg, rgba(84,115,255,0.12), rgba(196,58,47,0.1))',
              }}
            >
              {mapaParaMover?.linkImagem ? (
                <Box component="img" src={mapaParaMover.linkImagem} alt={mapaParaMover.nome} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <MapOutlinedIcon />
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {mapaParaMover?.nome || 'Mapa'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
                Pasta atual: {pastas.find(pasta => pasta.id === mapaParaMover?.pastaId)?.nome || 'Sem Pasta'}
              </Typography>
            </Box>
          </Box>

          <TextField
            fullWidth
            value={buscaPasta}
            onChange={event => setBuscaPasta(event.target.value)}
            label="Buscar pasta"
            size="small"
            sx={{ mb: 2, '& .MuiInputBase-root': { color: 'var(--text-primary)' } }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 270, overflowY: 'auto', pr: 0.5 }}>
            <Button
              type="button"
              onClick={() => setMapaDestinoPastaId(null)}
              variant={mapaDestinoPastaId === null ? 'contained' : 'outlined'}
              sx={{
                justifyContent: 'space-between',
                color: mapaDestinoPastaId === null ? 'white' : 'var(--text-primary)',
                borderColor: 'rgba(255,255,255,0.12)',
                background: mapaDestinoPastaId === null ? 'linear-gradient(135deg, rgba(196,58,47,0.3), rgba(99,102,241,0.15))' : 'transparent',
                px: 1.5,
                py: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, background: 'rgba(255,255,255,0.08)' }}>
                  <FolderOutlinedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Sem Pasta</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                {mapas.filter(item => !item.pastaId).length} mapas
              </Typography>
            </Button>

            {pastasDisponiveisParaMover.map(pasta => {
              const quantidade = mapas.filter(mapa => mapa.pastaId === pasta.id).length;
              const selecionada = mapaDestinoPastaId === pasta.id;

              return (
                <Button
                  key={pasta.id}
                  type="button"
                  onClick={() => setMapaDestinoPastaId(pasta.id)}
                  variant={selecionada ? 'contained' : 'outlined'}
                  sx={{
                    justifyContent: 'space-between',
                    color: selecionada ? 'white' : 'var(--text-primary)',
                    borderColor: selecionada ? 'rgba(196,58,47,0.4)' : 'rgba(255,255,255,0.12)',
                    background: selecionada ? 'linear-gradient(135deg, rgba(196,58,47,0.26), rgba(59,130,246,0.12))' : 'transparent',
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Box sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1.5, background: 'rgba(255,255,255,0.08)' }}>
                      <FolderOutlinedIcon sx={{ fontSize: 16 }} />
                    </Box>
                    <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pasta.nome}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: selecionada ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}>
                    {quantidade} {quantidade === 1 ? 'mapa' : 'mapas'}
                  </Typography>
                </Button>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => { setMapaParaMover(null); setMapaDestinoPastaId(null); setBuscaPasta(''); }} sx={{ color: 'var(--text-secondary)' }}>
            Cancelar
          </Button>
          <Button
            onClick={confirmarMovimentoMapa}
            variant="contained"
            color="error"
            disabled={mapaParaMover ? (mapaParaMover.pastaId || null) === (mapaDestinoPastaId || null) : false}
          >
            Mover Mapa
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDeleteMapa)} onClose={() => setConfirmDeleteMapa(null)}>
        <DialogTitle sx={{ color: 'var(--text-primary)' }}>Excluir mapa</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
            Deseja excluir o mapa <strong>{confirmDeleteMapa?.nome}</strong>? Esta ação não remove explorações relacionadas.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteMapa(null)} sx={{ color: 'var(--text-secondary)' }}>
            Cancelar
          </Button>
          <Button onClick={() => handleDeleteMapa(confirmDeleteMapa)} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Mapas;
