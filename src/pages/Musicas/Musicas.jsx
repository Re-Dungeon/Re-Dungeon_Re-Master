import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import LibraryMusicOutlinedIcon from '@mui/icons-material/LibraryMusicOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useAuth } from 'context/AuthContext';
import useAsyncEffect from 'hooks/useAsyncEffect';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import {
  addRmMusicaBiblioteca,
  addRmMusicaPasta,
  addRmPlaylist,
  getRmMusicasBibliotecaPorMestre,
  getRmMusicasPastasPorMestre,
  getRmPlaylistsPorMestre,
  removeRmMusicaBiblioteca,
  removeRmMusicaPasta,
  removeRmPlaylist,
  updateRmMusicaBiblioteca,
  updateRmMusicaPasta,
  updateRmPlaylist,
} from 'service/storage';

const PAGE_SX = {
  p: { xs: 2, md: 3 },
  width: '100%',
  minHeight: '100%',
  overflowX: 'hidden',
  overflowY: 'auto',
  color: 'var(--text-primary)',
};

const PANEL_SX = {
  p: { xs: 2, md: 2.5 },
  mb: 3,
  background: 'linear-gradient(180deg, rgba(19,22,28,0.98), rgba(14,17,22,0.96))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 3,
  boxShadow: '0 18px 44px rgba(0,0,0,0.26)',
};

const SECTION_TITLE_SX = {
  color: 'var(--text-primary)',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontSize: '0.72rem',
  mb: 1.5,
};

const cardStyle = {
  background: 'rgba(12, 15, 20, 0.88)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 3,
  boxShadow: '0 16px 32px rgba(0,0,0,0.24)',
  transition: 'all 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(196,58,47,0.38)',
  },
};

const buildThumbnail = videoId =>
  videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : 'https://images.unsplash.com/photo-1493225457124-cd1c5f7f1b69?auto=format&fit=crop&w=900&q=80';

const formatarTags = tags => {
  if (!Array.isArray(tags)) return [];
  return tags.filter(Boolean).slice(0, 6);
};

const getUrlVideoId = url => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('/')[0];
    const params = new URLSearchParams(parsed.search);
    return params.get('v');
  } catch {
    return null;
  }
};

const getMusicFormState = initialValues => ({
  nome: initialValues?.nome || '',
  url: initialValues?.url || '',
  pastaId: initialValues?.pastaId || '',
  descricao: initialValues?.descricao || '',
  tags: Array.isArray(initialValues?.tags) ? initialValues.tags.join(', ') : '',
});

const MusicFormDialog = ({ open, onClose, onSubmit, initialValues, isEditing, pastas = [] }) => {
  const [form, setForm] = useState(() => getMusicFormState(initialValues));
  const [error, setError] = useState('');

  const selectedPasta = form.pastaId ? pastas.find(item => item.id === form.pastaId) || null : null;

  const handleSave = async () => {
    const nome = form.nome.trim();
    const url = form.url.trim();
    if (!url) {
      setError('Informe um link do YouTube para salvar a música.');
      return;
    }

    const payload = {
      nome,
      url,
      pastaId: form.pastaId || null,
      descricao: form.descricao.trim(),
      tags: form.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err?.message || 'Não foi possível salvar a música.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Editar música' : 'Adicionar música'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: 2 }}>
        <TextField
          label="Título"
          value={form.nome}
          onChange={event => setForm(current => ({ ...current, nome: event.target.value }))}
          fullWidth
        />
        <Autocomplete
          disablePortal
          options={pastas}
          value={selectedPasta}
          onChange={(_, newValue) => setForm(current => ({ ...current, pastaId: newValue?.id || '' }))}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          getOptionLabel={option => option?.nome || ''}
          clearOnEscape
          noOptionsText="Nenhuma pasta encontrada"
          slotProps={{
            listbox: {
              sx: {
                maxHeight: 280,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(184, 60, 53, 0.8) rgba(255,255,255,0.04)',
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.04)', borderRadius: 999 },
                '&::-webkit-scrollbar-thumb': { background: 'linear-gradient(180deg, rgba(184,60,53,0.82), rgba(120,35,35,0.9))', borderRadius: 999 },
              },
            },
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Pasta"
              placeholder="Buscar pasta"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.02)',
                },
              }}
            />
          )}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              background: 'rgba(255,255,255,0.02)',
            },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(184,60,53,0.3)' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(184,60,53,0.7)' },
          }}
        />
        <TextField
          label="Link do YouTube"
          value={form.url}
          onChange={event => setForm(current => ({ ...current, url: event.target.value }))}
          fullWidth
        />
        <TextField
          label="Descrição"
          value={form.descricao}
          onChange={event => setForm(current => ({ ...current, descricao: event.target.value }))}
          multiline
          minRows={3}
          fullWidth
        />
        <TextField
          label="Tags"
          value={form.tags}
          onChange={event => setForm(current => ({ ...current, tags: event.target.value }))}
          placeholder="ex.: combate, boss, lore"
          fullWidth
        />
        {error && (
          <Typography variant="body2" sx={{ color: '#f4a0a0' }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>
          {isEditing ? 'Salvar alterações' : 'Adicionar música'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PastaDialog = ({ open, onClose, onSubmit, initialValue = '', title }) => {
  const [nome, setNome] = useState(() => initialValue || '');

  return (
    <Dialog key={`pasta-${title}-${initialValue || 'new'}`} open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers sx={{ pt: 2 }}>
        <TextField
          label="Nome da pasta"
          value={nome}
          onChange={event => setNome(event.target.value)}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!nome.trim()}
          onClick={() => onSubmit(nome.trim())}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const PlaylistDialog = ({ open, onClose, onSubmit, initialValues = {} }) => {
  const [form, setForm] = useState(() => ({
    nome: initialValues.nome || '',
    descricao: initialValues.descricao || '',
    linkImagem: initialValues.linkImagem || initialValues.imagemUrl || '',
  }));

  return (
    <Dialog
      key={`playlist-${initialValues.id ?? 'new'}`}
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'rgba(12,15,20,0.96)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            boxShadow: '0 22px 50px rgba(0,0,0,0.35)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', fontWeight: 700 }}>
        {initialValues.id ? 'Editar playlist' : 'Nova playlist'}
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: 2, background: 'linear-gradient(180deg, rgba(15,18,24,0.98), rgba(10,13,18,0.98))' }}>
        <TextField
          label="Nome da playlist"
          value={form.nome}
          onChange={event => setForm(current => ({ ...current, nome: event.target.value }))}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          label="Link da imagem"
          value={form.linkImagem}
          onChange={event => setForm(current => ({ ...current, linkImagem: event.target.value }))}
          fullWidth
          placeholder="https://.../capa.jpg"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          label="Descrição"
          value={form.descricao}
          onChange={event => setForm(current => ({ ...current, descricao: event.target.value }))}
          multiline
          minRows={3}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, background: 'rgba(255,255,255,0.02)' }}>
        <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!form.nome.trim()}
          onClick={() => onSubmit({ ...form, nome: form.nome.trim(), linkImagem: form.linkImagem.trim() })}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const PlaylistMusicManager = ({ open, onClose, playlist, musicas, onSave }) => {
  const [items, setItems] = useState(() =>
    Array.isArray(playlist?.musicas) ? playlist.musicas.map(item => item.musicaId) : [],
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');

  const availableMusic = useMemo(
    () => musicas.filter(musica => !items.includes(musica.id)),
    [musicas, items],
  );

  const filteredMusic = useMemo(() => {
    const termo = search.trim().toLowerCase();
    if (!termo) return availableMusic;

    return availableMusic.filter(musica => {
      const textoPraBusca = [
        musica.nome,
        musica.descricao,
        ...(Array.isArray(musica.tags) ? musica.tags : []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return textoPraBusca.includes(termo);
    });
  }, [availableMusic, search]);

  const handleAdd = value => {
    if (!value || items.includes(value)) return;
    setItems(current => [...current, value]);
    setSearch('');
  };

  const handleMove = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const playlistCover = playlist?.linkImagem || (() => {
    const primeiraMusicaId = Array.isArray(playlist?.musicas) && playlist.musicas.length > 0 ? playlist.musicas[0]?.musicaId : null;
    if (!primeiraMusicaId) return null;
    const musica = musicas.find(item => item.id === primeiraMusicaId);
    return musica ? buildThumbnail(getUrlVideoId(musica.url) || musica.videoId) : null;
  })();

  const shouldScrollMusicList = items.length > 6;
  const musicListMaxHeight = shouldScrollMusicList ? 'min(58vh, 500px)' : 'none';

  return (
    <Dialog
      key={`playlist-manager-${playlist?.id ?? 'new'}-${open ? 'open' : 'closed'}`}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            width: 'min(900px, calc(100vw - 32px))',
            maxHeight: '90vh',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(180deg, rgba(12,15,20,0.98), rgba(10,13,18,0.96))',
            boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 2.5, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2, background: 'linear-gradient(135deg, rgba(184,60,53,0.28), rgba(114,33,33,0.28))', border: '1px solid rgba(184,60,53,0.3)' }}>
              <LibraryMusicOutlinedIcon sx={{ color: '#f6d5cc', fontSize: 21 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                {playlist?.nome || 'Playlist'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.25 }}>
                Organize as faixas desta playlist
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', px: 1, py: 0.5, borderRadius: 999 }}>
              {items.length} faixas
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Fechar modal"
              sx={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: 'var(--text-secondary)',
                '&:hover': { background: 'rgba(255,255,255,0.08)' },
              }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 2, background: 'linear-gradient(180deg, rgba(10,13,19,0.92), rgba(14,17,22,0.96))' }}>
        <Box sx={{ px: 2.5, pt: 2.5 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', minHeight: 112 }}>
            {playlistCover ? (
              <CardMedia
                component="img"
                image={playlistCover}
                alt={playlist?.nome || 'Capa da playlist'}
                sx={{ width: 110, height: 110, borderRadius: 2.5, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            ) : (
              <Box sx={{ width: 110, height: 110, display: 'grid', placeItems: 'center', borderRadius: 2.5, background: 'linear-gradient(135deg, rgba(184,60,53,0.18), rgba(17,19,23,0.9))', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                <LibraryMusicOutlinedIcon sx={{ fontSize: 32 }} />
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                {playlist?.nome || 'Playlist'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.75 }}>
                {items.length} faixa{items.length === 1 ? '' : 's'} · {playlist?.descricao || 'Playlist personalizada'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: 2.5 }}>
          <Button
            variant="contained"
            onClick={event => setAnchorEl(event.currentTarget)}
            sx={{
              minHeight: 46,
              borderRadius: 2,
              border: '1px solid rgba(184,60,53,0.36)',
              background: 'linear-gradient(135deg, rgba(184,60,53,0.18), rgba(184,60,53,0.08))',
              color: '#f9d9d1',
              fontWeight: 700,
              px: 2,
              '&:hover': { background: 'linear-gradient(135deg, rgba(184,60,53,0.26), rgba(184,60,53,0.12))' },
            }}
          >
            Adicionar músicas
          </Button>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => {
              setAnchorEl(null);
              setSearch('');
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  width: 420,
                  maxWidth: 'calc(100vw - 32px)',
                  maxHeight: 'min(68vh, 520px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'linear-gradient(180deg, rgba(13,16,21,0.98), rgba(10,12,18,0.96))',
                  boxShadow: '0 28px 60px rgba(0,0,0,0.42)',
                  overflow: 'hidden',
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: 'min(68vh, 520px)', maxHeight: 'min(68vh, 520px)' }}>
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>Adicionar músicas</Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', px: 1, py: 0.5, borderRadius: 999 }}>
                    {availableMusic.length} disponíveis
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <TextField
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Buscar música..."
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon sx={{ color: 'var(--text-secondary)', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: search ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearch('')} aria-label="Limpar pesquisa" sx={{ color: 'var(--text-secondary)' }}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.02)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:hover fieldset': { borderColor: 'rgba(184,60,53,0.26)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(184,60,53,0.6)' },
                    },
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0, p: 1.25, '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.18)', borderRadius: 999 }, '&::-webkit-scrollbar-track': { background: 'rgba(255,255,255,0.04)' } }}>
                {!musicas.length ? (
                  <Box sx={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 2.5, p: 3, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}>
                    Não existem músicas disponíveis para adicionar.
                  </Box>
                ) : availableMusic.length === 0 ? (
                  <Box sx={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 2.5, p: 3, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}>
                    Todas as músicas já estão nesta playlist.
                  </Box>
                ) : filteredMusic.length === 0 ? (
                  <Box sx={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 2.5, p: 3, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}>
                    <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 0.5 }}>Nenhuma música encontrada</Typography>
                    <Typography variant="body2">Tente outro termo na busca.</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {filteredMusic.map(musica => {
                      const musicaCover = buildThumbnail(getUrlVideoId(musica.url) || musica.videoId);
                      const infoSecundaria = [
                        musica.descricao,
                        ...(Array.isArray(musica.tags) ? musica.tags.slice(0, 2) : []),
                      ].filter(Boolean).join(' • ');

                      return (
                        <Box
                          key={musica.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleAdd(musica.id)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handleAdd(musica.id);
                            }
                          }}
                          aria-label={`Adicionar música ${musica.nome}`}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            p: 1,
                            borderRadius: 2,
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 160ms ease',
                            '&:hover': {
                              background: 'rgba(255,255,255,0.05)',
                              borderColor: 'rgba(184,60,53,0.2)',
                            },
                            '&:focus-visible': {
                              outline: '2px solid rgba(184,60,53,0.7)',
                              outlineOffset: '2px',
                            },
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={musicaCover}
                            alt={musica.nome}
                            sx={{ width: 54, height: 54, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }}
                          />

                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {musica.nome}
                            </Typography>
                            {infoSecundaria ? (
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {infoSecundaria}
                              </Typography>
                            ) : null}
                          </Box>

                          <Box sx={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%', background: 'rgba(184,60,53,0.12)', border: '1px solid rgba(184,60,53,0.18)', color: '#f7d2d1' }}>
                            <AddOutlinedIcon sx={{ fontSize: 18 }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Box>
          </Popover>
        </Box>

        <Box
          data-testid="playlist-music-list"
          data-scrollable={shouldScrollMusicList ? 'true' : 'false'}
          sx={{
            px: 2.5,
            pb: 2.5,
            overflowY: shouldScrollMusicList ? 'auto' : 'visible',
            overflowX: 'hidden',
            maxHeight: musicListMaxHeight,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(184, 60, 53, 0.8) rgba(255,255,255,0.04)',
            '&::-webkit-scrollbar': {
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 999,
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'linear-gradient(180deg, rgba(184,60,53,0.82), rgba(120,35,35,0.9))',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'background 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(180deg, rgba(184,60,53,0.96), rgba(140,36,36,1))',
              },
            },
          }}
        >
          <Stack spacing={1.25}>
            {items.length === 0 ? (
              <Box sx={{ border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 3, p: 3, textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}>
                Nenhuma música nesta playlist ainda.
              </Box>
            ) : (
              items.map((musicaId, index) => {
                const musica = musicas.find(item => item.id === musicaId);
                if (!musica) return null;

                const musicaCover = buildThumbnail(getUrlVideoId(musica.url) || musica.videoId);

                return (
                  <Box
                    key={`${musicaId}-${index}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1.5,
                      p: 1.15,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 2.5,
                      transition: 'all 160ms ease',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.05)',
                        borderColor: 'rgba(184,60,53,0.2)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
                      <Box sx={{ width: 28, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem' }}>
                        {index + 1}
                      </Box>

                      <CardMedia
                        component="img"
                        image={musicaCover}
                        alt={musica.nome}
                        sx={{ width: 58, height: 58, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }}
                      />

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {musica.nome}
                        </Typography>
                        {musica.descricao ? (
                          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {musica.descricao}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        aria-label={`Mover música ${musica.nome} para cima`}
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                        sx={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: index === 0 ? 'rgba(255,255,255,0.28)' : 'var(--text-secondary)',
                          '&:hover': { background: index === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        <ArrowUpwardOutlinedIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        aria-label={`Mover música ${musica.nome} para baixo`}
                        disabled={index === items.length - 1}
                        onClick={() => handleMove(index, 1)}
                        sx={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: index === items.length - 1 ? 'rgba(255,255,255,0.28)' : 'var(--text-secondary)',
                          '&:hover': { background: index === items.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        <ArrowDownwardOutlinedIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        aria-label={`Remover música ${musica.nome} da playlist`}
                        onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))}
                        sx={{
                          background: 'rgba(244,160,160,0.06)',
                          border: '1px solid rgba(244,160,160,0.14)',
                          color: '#f6b7b7',
                          '&:hover': { background: 'rgba(244,160,160,0.12)' },
                        }}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })
            )}
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <Button onClick={onClose} sx={{ color: 'var(--text-secondary)', borderRadius: 2, px: 2, py: 1 }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => onSave(items)}
          sx={{
            borderRadius: 2,
            px: 2.5,
            py: 1,
            background: 'linear-gradient(135deg, rgba(184,60,53,0.82), rgba(140,36,36,0.88))',
            color: '#fff',
            fontWeight: 800,
            boxShadow: '0 12px 24px rgba(184,60,53,0.25)',
            '&:hover': { background: 'linear-gradient(135deg, rgba(184,60,53,0.95), rgba(140,36,36,1))' },
          }}
        >
          Salvar ordem
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MusicFormDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    nome: PropTypes.string,
    url: PropTypes.string,
    pastaId: PropTypes.string,
    descricao: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }),
  isEditing: PropTypes.bool,
  pastas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nome: PropTypes.string,
    }),
  ),
};

MusicFormDialog.propTypes = MusicFormDialogPropTypes;

const PastaDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValue: PropTypes.string,
  title: PropTypes.string.isRequired,
};

PastaDialog.propTypes = PastaDialogPropTypes;

const PlaylistDialogPropTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    descricao: PropTypes.string,
    linkImagem: PropTypes.string,
    imagemUrl: PropTypes.string,
  }),
};

PlaylistDialog.propTypes = PlaylistDialogPropTypes;

const PlaylistMusicManagerPropTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  playlist: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    descricao: PropTypes.string,
    linkImagem: PropTypes.string,
    musicas: PropTypes.arrayOf(
      PropTypes.shape({
        musicaId: PropTypes.string,
      }),
    ),
  }),
  musicas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nome: PropTypes.string,
      url: PropTypes.string,
      videoId: PropTypes.string,
      descricao: PropTypes.string,
    }),
  ).isRequired,
  onSave: PropTypes.func.isRequired,
};

PlaylistMusicManager.propTypes = PlaylistMusicManagerPropTypes;

const Musicas = () => {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;
  const [musicas, setMusicas] = useState([]);
  const [pastas, setPastas] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroPasta, setFiltroPasta] = useState('todas');
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [playlistFilter, setPlaylistFilter] = useState('todas');
  const [activeTab, setActiveTab] = useState('biblioteca');
  const [musicDialog, setMusicDialog] = useState({ open: false, initialValues: null, editingId: null });
  const [pastaDialog, setPastaDialog] = useState({ open: false, mode: 'create', value: '', targetId: null });
  const [playlistDialog, setPlaylistDialog] = useState({ open: false, initialValues: null });
  const [playlistManager, setPlaylistManager] = useState({ open: false, playlist: null });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, type: null, item: null });
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, musicaId: null });
  const [copyFeedback, setCopyFeedback] = useState({ open: false, message: '' });

  const carregarDados = useCallback(async () => {
    if (!userId) {
      setMusicas([]);
      setPastas([]);
      setPlaylists([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [biblioteca, todasPastas, todasPlaylists] = await Promise.all([
        getRmMusicasBibliotecaPorMestre(userId),
        getRmMusicasPastasPorMestre(userId),
        getRmPlaylistsPorMestre(userId),
      ]);
      setMusicas(biblioteca);
      setPastas(todasPastas);
      setPlaylists(todasPlaylists);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useAsyncEffect(() => {
    if (!userId) {
      setMusicas([]);
      setPastas([]);
      setPlaylists([]);
      setLoading(false);
      setError(null);
      return;
    }

    carregarDados();
  }, [carregarDados, userId]);

  const musicasFiltradas = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();
    return musicas.filter(musica => {
      const bateNaBusca =
        termoBusca.length === 0 ||
        musica.nome?.toLowerCase().includes(termoBusca) ||
        musica.descricao?.toLowerCase().includes(termoBusca) ||
        musica.tags?.some(tag => tag.toLowerCase().includes(termoBusca));
      const bateNaPasta =
        filtroPasta === 'todas' ||
        musica.pastaId === filtroPasta;
      return bateNaBusca && bateNaPasta;
    });
  }, [musicas, busca, filtroPasta]);

  const playlistsFiltradas = useMemo(() => {
    const termoBusca = playlistSearch.trim().toLowerCase();
    return playlists.filter(playlist => {
      const buscaNoTexto =
        termoBusca.length === 0 ||
        playlist.nome?.toLowerCase().includes(termoBusca) ||
        playlist.descricao?.toLowerCase().includes(termoBusca);
      const filtroNoPlaylist =
        playlistFilter === 'todas' ||
        playlist.id === playlistFilter;
      return buscaNoTexto && filtroNoPlaylist;
    });
  }, [playlists, playlistSearch, playlistFilter]);

  const editingMusicId = musicDialog.editingId;
  const pastaTargetId = pastaDialog.targetId;
  const playlistTargetId = playlistDialog.initialValues?.id;
  const selectedPlaylist = playlistManager.playlist;

  const handleSaveMusica = useCallback(
    async dados => {
      const payload = {
        ...dados,
        mestreId: userId,
      };

      if (editingMusicId) {
        await updateRmMusicaBiblioteca(editingMusicId, payload);
      } else {
        await addRmMusicaBiblioteca(payload);
      }
      await carregarDados();
    },
    [carregarDados, editingMusicId, userId],
  );

  const handleDeleteMusica = useCallback(
    id => {
      const musica = musicas.find(item => item.id === id);
      if (!musica) return;
      setConfirmDelete({ open: true, type: 'musica', item: musica });
    },
    [musicas],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ open: false, x: 0, y: 0, musicaId: null });
  }, []);

  const handleCopyMusicLink = useCallback(
    async musica => {
      if (!musica?.url) {
        setCopyFeedback({ open: true, message: 'Link do YouTube não disponível.' });
        return;
      }

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(musica.url);
        } else {
          const input = document.createElement('textarea');
          input.value = musica.url;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
        }

        setCopyFeedback({ open: true, message: 'Link do YouTube copiado!' });
      } catch {
        setCopyFeedback({ open: true, message: 'Não foi possível copiar o link do YouTube.' });
      } finally {
        closeContextMenu();
      }
    },
    [closeContextMenu],
  );

  const handleMusicContextMenu = useCallback(
    (event, musica) => {
      event.preventDefault();
      if (!musica) return;

      const menuWidth = 240;
      const menuHeight = 120;
      const nextX = Math.min(window.innerWidth - menuWidth - 12, Math.max(12, event.clientX + 8));
      const nextY = Math.min(window.innerHeight - menuHeight - 12, Math.max(12, event.clientY + 8));

      setContextMenu({ open: true, x: nextX, y: nextY, musicaId: musica.id });
    },
    [],
  );

  useEffect(() => {
    if (!contextMenu.open) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    };

    const handleOutsideScroll = () => {
      closeContextMenu();
    };

    const handleResize = () => {
      closeContextMenu();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleOutsideScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleOutsideScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [closeContextMenu, contextMenu.open]);

  const contextMenuMusica = useMemo(
    () => musicas.find(item => item.id === contextMenu.musicaId) || null,
    [contextMenu.musicaId, musicas],
  );

  const handleCopyContextMenuAction = useCallback(() => {
    handleCopyMusicLink(contextMenuMusica);
  }, [contextMenuMusica, handleCopyMusicLink]);

  const handleSavePasta = useCallback(
    async nome => {
      const valor = nome.trim();
      if (!valor) return;
      if (pastaTargetId) {
        await updateRmMusicaPasta(pastaTargetId, {
          nome: valor,
          mestreId: userId,
        });
      } else {
        await addRmMusicaPasta({ nome: valor, mestreId: userId });
      }
      setPastaDialog({ open: false, mode: 'create', value: '', targetId: null });
      await carregarDados();
    },
    [carregarDados, pastaTargetId, userId],
  );

  const handleDeletePasta = useCallback(
    id => {
      const pasta = pastas.find(item => item.id === id);
      if (!pasta) return;
      setConfirmDelete({ open: true, type: 'pasta', item: pasta });
    },
    [pastas],
  );

  const handleSavePlaylist = useCallback(
    async dados => {
      const payload = {
        nome: dados.nome,
        descricao: dados.descricao || '',
        linkImagem: dados.linkImagem || null,
        mestreId: userId,
        musicas: [],
      };

      if (playlistTargetId) {
        await updateRmPlaylist(playlistTargetId, payload);
      } else {
        await addRmPlaylist(payload);
      }
      setPlaylistDialog({ open: false, initialValues: null });
      await carregarDados();
    },
    [carregarDados, playlistTargetId, userId],
  );

  const handleDeletePlaylist = useCallback(
    id => {
      const playlist = playlists.find(item => item.id === id);
      if (!playlist) return;
      setConfirmDelete({ open: true, type: 'playlist', item: playlist });
    },
    [playlists],
  );

  const closeConfirmDelete = useCallback(() => {
    setConfirmDelete({ open: false, type: null, item: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete.type || !confirmDelete.item) return;

    try {
      if (confirmDelete.type === 'musica') {
        await removeRmMusicaBiblioteca(confirmDelete.item.id, userId);
      }

      if (confirmDelete.type === 'pasta') {
        await Promise.all(
          musicas
            .filter(item => item.pastaId === confirmDelete.item.id)
            .map(item => updateRmMusicaBiblioteca(item.id, { pastaId: null })),
        );
        await removeRmMusicaPasta(confirmDelete.item.id);
      }

      if (confirmDelete.type === 'playlist') {
        await removeRmPlaylist(confirmDelete.item.id);
      }

      setConfirmDelete({ open: false, type: null, item: null });
      await carregarDados();
    } catch (err) {
      setError(err);
      setConfirmDelete({ open: false, type: null, item: null });
    }
  }, [carregarDados, confirmDelete, musicas, userId]);

  const handleSavePlaylistItems = useCallback(
    async musicasIds => {
      if (!selectedPlaylist?.id) return;
      const payload = musicasIds.map((musicaId, index) => ({
        musicaId,
        ordem: index,
      }));
      await updateRmPlaylist(selectedPlaylist.id, {
        musicas: payload,
        mestreId: userId,
      });
      setPlaylistManager({ open: false, playlist: null });
      await carregarDados();
    },
    [carregarDados, selectedPlaylist, userId],
  );

  if (!currentUser) {
    return (
      <Box sx={PAGE_SX}>
        <Box sx={{ ...PANEL_SX, textAlign: 'center', py: 6 }}>
          <Typography variant="h5">Biblioteca de músicas</Typography>
          <Typography sx={{ color: 'var(--text-secondary)', mt: 1 }}>
            Faça login para acessar sua biblioteca global.
          </Typography>
        </Box>
      </Box>
    );
  }

  const tabs = [
    { id: 'biblioteca', label: 'Biblioteca' },
    { id: 'playlists', label: 'Playlists' },
  ];

  return (
    <Box
      sx={{
        ...PAGE_SX,
        background: 'radial-gradient(circle at top, rgba(160, 30, 30, 0.18), transparent 28%), #070b12',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 3,
          p: { xs: 2, md: 2.5 },
          background: 'linear-gradient(180deg, rgba(17,21,28,0.94), rgba(10,13,18,0.92))',
          boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
        }}
      >
        <Box>
          <Typography sx={{ ...SECTION_TITLE_SX, color: 'var(--color-accent)', mb: 0.75 }}>
            Biblioteca musical
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', fontSize: { xs: '2rem', md: '2.7rem' } }}>
            Biblioteca Musical
          </Typography>
          <Typography sx={{ mt: 0.75, color: 'var(--text-secondary)', maxWidth: 700 }}>
            Organize suas faixas, pastas e playlists em um só espaço pessoal de sessão.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={() => setMusicDialog({ open: true, initialValues: null, editingId: null })}
          sx={{
            background: 'linear-gradient(135deg, #7d1d20, #b83c35)',
            borderRadius: 2,
            fontWeight: 700,
            px: 2.25,
            py: 1.2,
            minWidth: 190,
            boxShadow: '0 14px 30px rgba(184, 60, 53, 0.28)',
            '&:hover': { filter: 'brightness(1.08)' },
          }}
        >
          Adicionar Música
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          minHeight: 0,
          flex: 1,
          overflow: 'hidden',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Box
          sx={{
            width: { xs: '100%', lg: 280 },
            minWidth: { xs: '100%', lg: 280 },
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(16,18,25,0.96), rgba(11,14,20,0.94))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography sx={{ ...SECTION_TITLE_SX, mb: 0 }}>Pastas</Typography>
          </Box>

          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25, minHeight: 0, overflowY: 'auto', '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.14)', borderRadius: 999 } }}>
            <Button
              variant={filtroPasta === 'todas' ? 'contained' : 'outlined'}
              startIcon={<LibraryMusicOutlinedIcon />}
              onClick={() => {
                setFiltroPasta('todas');
              }}
              sx={{
                justifyContent: 'flex-start',
                borderRadius: 2,
                px: 1.5,
                background: filtroPasta === 'todas' ? 'linear-gradient(135deg, rgba(184,60,53,0.35), rgba(184,60,53,0.12))' : 'transparent',
                borderColor: filtroPasta === 'todas' ? 'rgba(184,60,53,0.4)' : 'rgba(255,255,255,0.12)',
                color: 'var(--text-primary)',
                fontWeight: 700,
              }}
            >
              Todas as Músicas
            </Button>

            <Button
              variant="outlined"
              startIcon={<FolderOutlinedIcon />}
              onClick={() => setPastaDialog({ open: true, mode: 'create', value: '', targetId: null })}
              sx={{ justifyContent: 'flex-start', borderRadius: 2, px: 1.5 }}
            >
              Nova Pasta
            </Button>

            {pastas.length === 0 ? (
              <Typography sx={{ color: 'var(--text-secondary)', px: 1, py: 2 }}>
                Nenhuma pasta criada.
              </Typography>
            ) : (
              pastas.map(pasta => {
                const isSelected = filtroPasta === pasta.id;
                return (
                  <Box
                    key={pasta.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      px: 1.25,
                      py: 1,
                      borderRadius: 2,
                      border: isSelected ? '1px solid rgba(184,60,53,0.45)' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(184,60,53,0.12)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <Button
                      variant="text"
                      onClick={() => setFiltroPasta(pasta.id)}
                      sx={{
                        justifyContent: 'flex-start',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        flex: 1,
                        minWidth: 0,
                        p: 0,
                        textTransform: 'none',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', minWidth: 0 }}>
                        <FolderOutlinedIcon sx={{ color: isSelected ? 'var(--color-accent)' : 'var(--text-secondary)', fontSize: '1.1rem' }} />
                        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pasta.nome}
                        </Box>
                      </Box>
                    </Button>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton aria-label={`Editar pasta ${pasta.nome}`} size="small" onClick={() => setPastaDialog({ open: true, mode: 'rename', value: pasta.nome, targetId: pasta.id })}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label={`Excluir pasta ${pasta.nome}`} size="small" onClick={() => handleDeletePasta(pasta.id)}>
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(15,18,24,0.96), rgba(10,13,19,0.94))',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, p: 2, borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 2, p: 0.5 }}>
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'contained' : 'text'}
                  onClick={() => setActiveTab(tab.id)}
                  sx={{
                    color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                    borderRadius: 1.5,
                    fontWeight: 700,
                    background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(184,60,53,0.44), rgba(184,60,53,0.18))' : 'transparent',
                    minWidth: 0,
                    px: 1.7,
                    py: 0.85,
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>

            {activeTab === 'biblioteca' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, maxWidth: { xs: '100%', md: 520 }, ml: 'auto' }}>
                <TextField
                  value={busca}
                  onChange={event => setBusca(event.target.value)}
                  placeholder="Buscar por nome, tag ou descrição"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon sx={{ color: 'var(--text-secondary)' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Select
                  value={filtroPasta}
                  onChange={event => setFiltroPasta(event.target.value)}
                  displayEmpty
                  sx={{ minWidth: 180, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' }, borderRadius: 2 }}
                >
                  <MenuItem value="todas">Todas as pastas</MenuItem>
                  {pastas.map(pasta => (
                    <MenuItem key={pasta.id} value={pasta.id}>
                      {pasta.nome}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            {activeTab === 'playlists' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, maxWidth: { xs: '100%', md: 760 }, ml: 'auto', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <TextField
                  value={playlistSearch}
                  onChange={event => setPlaylistSearch(event.target.value)}
                  placeholder="Buscar playlist..."
                  fullWidth
                  size="small"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchOutlinedIcon sx={{ color: 'var(--text-secondary)', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: playlistSearch ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setPlaylistSearch('')} aria-label="Limpar pesquisa de playlists" sx={{ color: 'var(--text-secondary)' }}>
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  sx={{
                    flex: 1,
                    minWidth: { xs: '100%', sm: 220 },
                    maxWidth: { xs: '100%', md: 320 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.02)',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:hover fieldset': { borderColor: 'rgba(184,60,53,0.26)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(184,60,53,0.6)' },
                    },
                  }}
                />

                <Select
                  value={playlistFilter}
                  onChange={event => setPlaylistFilter(event.target.value)}
                  displayEmpty
                  slotProps={{ input: { 'aria-label': 'Filtrar playlists' } }}
                  sx={{ minWidth: { xs: '100%', sm: 220 }, maxWidth: 260, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' }, borderRadius: 2, background: 'rgba(255,255,255,0.02)' }}
                >
                  <MenuItem value="todas">Todas as playlists</MenuItem>
                  {playlists.map(playlist => (
                    <MenuItem key={playlist.id} value={playlist.id}>
                      {playlist.nome}
                    </MenuItem>
                  ))}
                </Select>

                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  onClick={() => setPlaylistDialog({ open: true, initialValues: null })}
                  sx={{
                    borderRadius: 2,
                    minWidth: 160,
                    background: 'linear-gradient(135deg, rgba(184,60,53,0.78), rgba(130,30,30,0.9))',
                    color: '#fff',
                    fontWeight: 800,
                    boxShadow: '0 14px 28px rgba(184,60,53,0.22)',
                    '&:hover': { background: 'linear-gradient(135deg, rgba(184,60,53,0.9), rgba(130,30,30,1))' },
                  }}
                >
                  + Criar playlist
                </Button>
              </Box>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8, flex: 1 }}>
              <CircularProgress sx={{ color: 'var(--color-accent)' }} />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, flex: 1 }}>
              <ListLoadError mensagem="Não foi possível carregar a biblioteca." onRetry={carregarDados} />
            </Box>
          ) : (
            <Box sx={{ p: 2, overflow: 'auto', minHeight: 0, flex: 1, '&::-webkit-scrollbar': { width: 9, height: 9 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.14)', borderRadius: 999 } }}>
              {activeTab === 'biblioteca' ? (
                musicasFiltradas.length === 0 ? (
                  <Box sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 3, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Nenhuma música cadastrada para os filtros atuais.
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: 'repeat(1, minmax(0, 1fr))',
                        sm: 'repeat(2, minmax(0, 1fr))',
                        md: 'repeat(3, minmax(0, 1fr))',
                        xl: 'repeat(4, minmax(0, 1fr))',
                      },
                      alignItems: 'stretch',
                      maxWidth: '100%',
                    }}
                  >
                    {musicasFiltradas.map(musica => {
                      const pasta = pastas.find(item => item.id === musica.pastaId);
                      const videoId = getUrlVideoId(musica.url) || musica.videoId;
                      return (
                        <Card
                          key={musica.id}
                          onContextMenu={event => {
                            if (activeTab === 'biblioteca') {
                              handleMusicContextMenu(event, musica);
                            }
                          }}
                          sx={{
                            ...cardStyle,
                            width: '100%',
                            maxWidth: '100%',
                            height: '100%',
                            minHeight: 0,
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25, height: '100%', minHeight: 0 }}>
                            <Box sx={{ position: 'relative', width: '100%' }}>
                              <CardMedia
                                component="img"
                                image={buildThumbnail(videoId)}
                                alt={musica.nome}
                                sx={{ width: '100%', height: { xs: 170, sm: 150, md: 138 }, borderRadius: 2, objectFit: 'cover' }}
                              />
                              <Box sx={{ position: 'absolute', inset: 'auto 10px 10px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                                <Box sx={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 999, px: 1, py: 0.35, fontSize: '0.72rem' }}>
                                  YouTube
                                </Box>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>
                                {musica.nome}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                                <IconButton aria-label={`Editar música ${musica.nome}`} onClick={() => setMusicDialog({ open: true, initialValues: musica, editingId: musica.id })} sx={{ background: 'rgba(255,255,255,0.04)' }} size="small">
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                                <IconButton aria-label={`Excluir música ${musica.nome}`} onClick={() => handleDeleteMusica(musica.id)} sx={{ background: 'rgba(244,160,160,0.08)', color: '#f8b0b0' }} size="small">
                                  <DeleteOutlineOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>

                            {pasta && (
                              <Chip label={pasta.nome} size="small" sx={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }} />
                            )}

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 32 }}>
                              {formatarTags(musica.tags).length === 0 ? (
                                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                  Sem tags
                                </Typography>
                              ) : (
                                formatarTags(musica.tags).map(tag => (
                                  <Chip key={`${musica.id}-${tag}`} label={tag} size="small" sx={{ background: 'rgba(184,60,53,0.12)', color: 'var(--text-secondary)' }} />
                                ))
                              )}
                            </Box>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                )
              ) : playlists.length === 0 ? (
                <Box sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 3, textAlign: 'center', color: 'var(--text-secondary)', display: 'grid', gap: 1.5, justifyItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>Você ainda não criou nenhuma playlist.</Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddOutlinedIcon />}
                    onClick={() => setPlaylistDialog({ open: true, initialValues: null })}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg, rgba(184,60,53,0.78), rgba(130,30,30,0.9))', fontWeight: 800 }}
                  >
                    Criar playlist
                  </Button>
                </Box>
              ) : playlistsFiltradas.length === 0 ? (
                <Box sx={{ p: 3, border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 3, textAlign: 'center', color: 'var(--text-secondary)', display: 'grid', gap: 1.5, justifyItems: 'center' }}>
                  <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>Nenhuma playlist encontrada.</Typography>
                  <Typography variant="body2">Tente outro termo na busca ou volte para todas as playlists.</Typography>
                  <Button
                    variant="text"
                    onClick={() => {
                      setPlaylistSearch('');
                      setPlaylistFilter('todas');
                    }}
                    sx={{ color: 'var(--color-accent)', fontWeight: 700 }}
                  >
                    Ver todas as playlists
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: {
                      xs: 'repeat(1, minmax(0, 1fr))',
                      sm: 'repeat(2, minmax(0, 1fr))',
                      md: 'repeat(3, minmax(0, 1fr))',
                      xl: 'repeat(4, minmax(0, 1fr))',
                    },
                    alignItems: 'stretch',
                    maxWidth: '100%',
                  }}
                >
                  {playlistsFiltradas.map(playlist => {
                    const capaPlaylist = playlist.linkImagem || (() => {
                      const primeiraMusicaId = Array.isArray(playlist.musicas) && playlist.musicas.length > 0 ? playlist.musicas[0]?.musicaId : null;
                      if (!primeiraMusicaId) return null;
                      const musica = musicas.find(item => item.id === primeiraMusicaId);
                      return musica ? buildThumbnail(getUrlVideoId(musica.url) || musica.videoId) : null;
                    })();

                    return (
                      <Card
                        key={playlist.id}
                        sx={{
                          ...cardStyle,
                          width: '100%',
                          maxWidth: '100%',
                          height: '100%',
                          minHeight: 0,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2, height: '100%', minHeight: 0 }}>
                          <Box sx={{ position: 'relative', width: '100%' }}>
                            {capaPlaylist ? (
                              <Box
                                component="img"
                                src={capaPlaylist}
                                alt={playlist.nome}
                                sx={{ width: '100%', height: { xs: 170, sm: 150, md: 138 }, borderRadius: 2, objectFit: 'cover', display: 'block', border: '1px solid rgba(255,255,255,0.06)' }}
                              />
                            ) : (
                              <Box sx={{ width: '100%', height: { xs: 170, sm: 150, md: 138 }, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(184,60,53,0.22), rgba(17,19,23,0.9))', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.72rem' }}>
                                Sem capa
                              </Box>
                            )}
                            <Box sx={{ position: 'absolute', inset: 'auto 10px 10px 10px', display: 'flex', justifyContent: 'flex-end' }}>
                              <Box sx={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 999, px: 1, py: 0.35, fontSize: '0.72rem' }}>
                                YouTube
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)', flex: 1, minWidth: 0 }}>
                              {playlist.nome}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                              <IconButton aria-label={`Gerenciar playlist ${playlist.nome}`} size="small" onClick={() => setPlaylistManager({ open: true, playlist })} sx={{ background: 'rgba(255,255,255,0.04)' }}>
                                <LibraryMusicOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton aria-label={`Editar playlist ${playlist.nome}`} size="small" onClick={() => setPlaylistDialog({ open: true, initialValues: playlist })} sx={{ background: 'rgba(255,255,255,0.04)' }}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                              <IconButton aria-label={`Excluir playlist ${playlist.nome}`} size="small" onClick={() => handleDeletePlaylist(playlist.id)} sx={{ background: 'rgba(244,160,160,0.08)', color: '#f8b0b0' }}>
                                <DeleteOutlineOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          {playlist.descricao ? (
                            <Typography sx={{ color: 'var(--text-secondary)', minHeight: 42, lineHeight: 1.5, fontSize: '0.82rem' }}>
                              {playlist.descricao}
                            </Typography>
                          ) : null}

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', gap: 1 }}>
                            <Chip label={`${Array.isArray(playlist.musicas) ? playlist.musicas.length : 0} músicas`} size="small" sx={{ background: 'rgba(184,60,53,0.12)', color: 'var(--text-secondary)', border: '1px solid rgba(184,60,53,0.16)' }} />
                            <Button size="small" onClick={() => setPlaylistManager({ open: true, playlist })} sx={{ color: 'var(--color-accent)', fontWeight: 700, minWidth: 0 }}>
                              Gerenciar
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {contextMenu.open && contextMenuMusica ? (
        <Box
          role="menu"
          aria-label={`Menu de contexto da música ${contextMenuMusica.nome}`}
          onMouseDown={event => event.preventDefault()}
          sx={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1700,
            width: 240,
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(10, 15, 24, 0.96)',
            boxShadow: '0 18px 38px rgba(0,0,0,0.38)',
            overflow: 'hidden',
          }}
        >
          <Box
            component="button"
            type="button"
            role="menuitem"
            aria-label="Copiar link do YouTube"
            onClick={handleCopyContextMenuAction}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              border: 0,
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              px: 1.5,
              py: 1,
              textAlign: 'left',
              '&:hover': {
                background: 'rgba(184, 60, 53, 0.12)',
              },
            }}
          >
            <ContentCopyOutlinedIcon fontSize="small" sx={{ color: 'var(--text-secondary)' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Copiar link do YouTube</Typography>
          </Box>
        </Box>
      ) : null}

      <Snackbar
        open={copyFeedback.open}
        autoHideDuration={2200}
        onClose={() => setCopyFeedback({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={copyFeedback.message === 'Link do YouTube copiado!' ? 'success' : 'info'} variant="filled" sx={{ width: '100%' }}>
          {copyFeedback.message}
        </Alert>
      </Snackbar>

      <MusicFormDialog
        key={`music-dialog-${musicDialog.open ? 'open' : 'closed'}-${musicDialog.editingId ?? 'new'}`}
        open={musicDialog.open}
        isEditing={Boolean(musicDialog.editingId)}
        initialValues={musicDialog.initialValues}
        pastas={pastas}
        onClose={() => setMusicDialog({ open: false, initialValues: null, editingId: null })}
        onSubmit={handleSaveMusica}
      />

      <PastaDialog
        key={`pasta-dialog-${pastaDialog.open ? 'open' : 'closed'}-${pastaDialog.targetId ?? 'new'}`}
        open={pastaDialog.open}
        title={pastaDialog.mode === 'rename' ? 'Renomear pasta' : 'Nova pasta'}
        initialValue={pastaDialog.value}
        onClose={() => setPastaDialog({ open: false, mode: 'create', value: '', targetId: null })}
        onSubmit={handleSavePasta}
      />

      <PlaylistDialog
        key={`playlist-dialog-${playlistDialog.open ? 'open' : 'closed'}-${playlistDialog.initialValues?.id ?? 'new'}`}
        open={playlistDialog.open}
        initialValues={playlistDialog.initialValues || {}}
        onClose={() => setPlaylistDialog({ open: false, initialValues: null })}
        onSubmit={handleSavePlaylist}
      />

      <PlaylistMusicManager
        key={[
          'playlist-manager',
          playlistManager.playlist?.id ?? 'new',
          Array.isArray(playlistManager.playlist?.musicas)
            ? playlistManager.playlist.musicas.map(item => item?.musicaId ?? '').join(',')
            : 'empty',
          playlistManager.open ? 'open' : 'closed',
        ].join('-')}
        open={playlistManager.open}
        playlist={playlistManager.playlist}
        musicas={musicas}
        onClose={() => setPlaylistManager({ open: false, playlist: null })}
        onSave={handleSavePlaylistItems}
      />

      <Dialog
        open={confirmDelete.open}
        onClose={closeConfirmDelete}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'rgba(12,15,20,0.96)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              boxShadow: '0 22px 50px rgba(0,0,0,0.35)',
            },
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          {confirmDelete.type === 'musica' && 'Excluir música'}
          {confirmDelete.type === 'pasta' && 'Excluir pasta'}
          {confirmDelete.type === 'playlist' && 'Excluir playlist'}
        </DialogTitle>
        <DialogContent sx={{ color: 'var(--text-secondary)' }}>
          {confirmDelete.type === 'musica' && (
            <Typography sx={{ color: 'var(--text-secondary)' }}>
              Deseja remover <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.item?.nome}</strong> da biblioteca? Esta ação não pode ser desfeita.
            </Typography>
          )}
          {confirmDelete.type === 'pasta' && (
            <Typography sx={{ color: 'var(--text-secondary)' }}>
              Excluir <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.item?.nome}</strong> também removerá o vínculo das músicas desta pasta.
            </Typography>
          )}
          {confirmDelete.type === 'playlist' && (
            <Typography sx={{ color: 'var(--text-secondary)' }}>
              Deseja excluir a playlist <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete.item?.nome}</strong>? Esta ação não pode ser desfeita.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeConfirmDelete} sx={{ color: 'var(--text-secondary)' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Musicas;
