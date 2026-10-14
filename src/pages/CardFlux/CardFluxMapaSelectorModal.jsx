import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import SearchIcon from '@mui/icons-material/Search';

const primaryButtonSx = {
  minHeight: '46px',
  px: { xs: 2, md: 2.5 },
  py: 1.25,
  borderRadius: 2,
  background: 'linear-gradient(135deg, var(--color-accent), #ab2b27)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(8, 11, 17, 0.72)',
    borderRadius: 2,
    color: 'var(--text-primary)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 3px rgba(196,58,47,0.12)',
    },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputBase-input': { color: 'var(--text-primary)' },
};

const temPastaValida = mapa => {
  const pastaId = mapa?.pastaId;
  return pastaId !== null && pastaId !== undefined && String(pastaId).trim() !== '';
};

const CardFluxMapaSelectorModal = ({
  open,
  onClose,
  onSave,
  onRemoveImage,
  onSelectMap,
  draft,
  mapasDisponiveis,
  pastasDisponiveis,
  loadingMapas,
  loadingPastas,
}) => {
  const [busca, setBusca] = useState('');
  const [pastaAtivaId, setPastaAtivaId] = useState(null);

  const resetBrowseState = () => {
    setBusca('');
    setPastaAtivaId(null);
  };

  const pastasOrdenadas = useMemo(
    () =>
      [...(pastasDisponiveis || [])].sort((a, b) => {
        const ordemA = Number.isFinite(Number(a.ordem)) ? Number(a.ordem) : 999;
        const ordemB = Number.isFinite(Number(b.ordem)) ? Number(b.ordem) : 999;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return String(a.nome || '').localeCompare(String(b.nome || ''));
      }),
    [pastasDisponiveis],
  );

  const mapaSelecionado = (mapasDisponiveis || []).find(mapa => mapa.id === draft?.mapaId) || null;
  const mapasSemPasta = useMemo(
    () => (mapasDisponiveis || []).filter(mapa => !temPastaValida(mapa)),
    [mapasDisponiveis],
  );
  const mapasDaPastaAtiva = useMemo(
    () =>
      (mapasDisponiveis || []).filter(mapa => {
        if (!pastaAtivaId) return false;
        return mapa.pastaId === pastaAtivaId;
      }),
    [mapasDisponiveis, pastaAtivaId],
  );

  const mapaBusca = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return [];
    return (mapasDisponiveis || [])
      .filter(mapa =>
        [mapa.nome, mapa.categoria, mapa.descricao].some(valor =>
          String(valor || '').toLowerCase().includes(termo),
        ),
      )
      .map(mapa => ({
        ...mapa,
        pastaNome: pasteToName(mapa.pastaId, pastasDisponiveis),
      }));
  }, [busca, mapasDisponiveis, pastasDisponiveis]);

  const bibliotecaVazia = !loadingMapas && !loadingPastas && !mapasDisponiveis?.length && !pastasDisponiveis?.length;
  const mostrarSecaoSemPasta = mapasSemPasta.length > 0 && !pastaAtivaId && !busca.trim();

  const getPastaCapa = pasta => {
    if (pasta?.imagemCapa) return pasta.imagemCapa;
    const mapaComImagem = (mapasDisponiveis || []).find(
      mapa => mapa.pastaId === pasta?.id && Boolean(mapa.linkImagem && String(mapa.linkImagem).trim()),
    );
    return mapaComImagem?.linkImagem || '';
  };

  const renderMapaCard = (mapa, compact = false) => {
    const selecionado = draft?.mapaId === mapa.id;
    const imagemMapa = mapa.linkImagem || '';
    const pastaNome = pasteToName(mapa.pastaId, pastasDisponiveis);

    return (
      <Box
        key={mapa.id}
        component="button"
        type="button"
        onClick={() => onSelectMap(mapa)}
        sx={{
          display: 'grid',
          gridTemplateColumns: compact ? '56px minmax(0,1fr)' : '72px minmax(0,1fr)',
          gap: 1.1,
          alignItems: 'center',
          width: '100%',
          textAlign: 'left',
          p: 1,
          borderRadius: 2,
          border: selecionado ? '1px solid rgba(196,58,47,0.7)' : '1px solid rgba(148,163,184,0.12)',
          background: selecionado ? 'rgba(196,58,47,0.1)' : 'rgba(15,23,42,0.72)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'rgba(196,58,47,0.42)',
            background: 'rgba(196,58,47,0.08)',
          },
        }}
      >
        <Box
          sx={{
            width: compact ? 56 : 72,
            height: compact ? 56 : 72,
            borderRadius: 1.5,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {imagemMapa ? (
            <Box component="img" src={imagemMapa} alt={mapa.nome} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>🗺️</Box>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mapa.nome}
          </Typography>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block' }}>
            {mapa.categoria || 'Mapa'}
          </Typography>
          {!busca.trim() && pastaNome && (
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mt: 0.25 }}>
              {pastaNome}
            </Typography>
          )}
          {busca.trim() && pastaNome && (
            <Typography variant="caption" sx={{ color: 'var(--text-muted)', display: 'block', mt: 0.25 }}>
              Pasta: {pastaNome}
            </Typography>
          )}
          {!imagemMapa && (
            <Typography variant="caption" sx={{ color: '#fca5a5', display: 'block', mt: 0.25 }}>
              Sem imagem utilizável
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  const renderBiblioteca = () => {
    if (bibliotecaVazia) {
      return (
        <Box className="empty-state">
          <span className="empty-state-icon">🗺️</span>
          <p>Sua biblioteca de mapas está vazia.</p>
          <small>Cadastre um mapa ou uma pasta para usar como fundo da exploração.</small>
        </Box>
      );
    }

    if (busca.trim()) {
      if (mapaBusca.length === 0) {
        return (
          <Box className="empty-state">
            <span className="empty-state-icon">🔎</span>
            <p>Nenhum mapa ou pasta encontrado.</p>
            <small>Tente outro termo ou limpe os filtros para ver a biblioteca completa.</small>
          </Box>
        );
      }

      return (
        <Box sx={{ display: 'grid', gap: 1.25, maxHeight: { xs: 300, md: 340 }, overflowY: 'auto', overflowX: 'hidden', pr: 0.5, '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-track': { background: 'rgba(15,23,42,0.88)', borderRadius: 999 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.35)', borderRadius: 999, '&:hover': { background: 'rgba(196,58,47,0.58)' } } }}>
          {mapaBusca.map(mapa => renderMapaCard(mapa, true))}
        </Box>
      );
    }

    if (pastaAtivaId) {
      return (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button variant="text" onClick={() => setPastaAtivaId(null)} sx={{ color: 'var(--text-secondary)', minWidth: 0, px: 0 }}>
                Biblioteca
              </Button>
              <Typography sx={{ color: 'var(--text-secondary)' }}>/</Typography>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {pastasOrdenadas.find(pasta => pasta.id === pastaAtivaId)?.nome || 'Pasta'}
              </Typography>
            </Box>
          </Box>

          {mapasDaPastaAtiva.length === 0 ? (
            <Box className="empty-state">
              <span className="empty-state-icon">📁</span>
              <p>Esta pasta ainda está vazia.</p>
              <small>Os mapas organizados aqui aparecerão ao criar ou mover um mapa para esta pasta.</small>
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.25, maxHeight: { xs: 300, md: 340 }, overflowY: 'auto', overflowX: 'hidden', pr: 0.5, '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-track': { background: 'rgba(15,23,42,0.88)', borderRadius: 999 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.35)', borderRadius: 999, '&:hover': { background: 'rgba(196,58,47,0.58)' } } }}>
              {mapasDaPastaAtiva.map(mapa => renderMapaCard(mapa, true))}
            </Box>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'grid', gap: 2, maxHeight: { xs: 330, md: 360 }, overflow: 'hidden' }}>
        {pastasOrdenadas.length > 0 && (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              Pastas
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 1.25,
                width: '100%',
                maxHeight: { xs: 260, md: 300 },
                overflowY: 'auto',
                overflowX: 'hidden',
                pr: 0.5,
                '&::-webkit-scrollbar': { width: 8 },
                '&::-webkit-scrollbar-track': { background: 'rgba(15,23,42,0.88)', borderRadius: 999 },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.35)', borderRadius: 999, '&:hover': { background: 'rgba(196,58,47,0.58)' } },
              }}
            >
              {pastasOrdenadas.map(pasta => {
                const capa = getPastaCapa(pasta);
                const quantidade = (mapasDisponiveis || []).filter(mapa => mapa.pastaId === pasta.id).length;

                return (
                  <Paper
                    key={pasta.id}
                    elevation={0}
                    onClick={() => setPastaAtivaId(pasta.id)}
                    sx={{
                      p: 0,
                      overflow: 'hidden',
                      borderRadius: 2,
                      border: '1px solid rgba(148,163,184,0.15)',
                      background: 'rgba(15,23,42,0.7)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: 0,
                      width: '100%',
                      '&:hover': {
                        borderColor: 'rgba(196,58,47,0.42)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', height: 84, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(148,163,184,0.12)' }}>
                      {capa ? (
                        <>
                          <Box component="img" src={capa} alt={pasta.nome} onError={event => { event.currentTarget.style.display = 'none'; const fallback = event.currentTarget.parentElement?.querySelector('[data-fallback="true"]'); if (fallback) fallback.style.display = 'grid'; }} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          <Box data-fallback="true" sx={{ display: 'none', width: '100%', height: '100%', placeItems: 'center', color: 'var(--text-muted)', background: 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(15,23,42,0.94))' }}>
                            <FolderOutlinedIcon sx={{ fontSize: 28 }} />
                          </Box>
                        </>
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', background: 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(15,23,42,0.94))' }}>
                          <FolderOutlinedIcon sx={{ fontSize: 28 }} />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'grid', gap: 0.25, px: 1.25, py: 1.1, minHeight: 56 }}>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {pasta.nome}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                        {quantidade} {quantidade === 1 ? 'mapa' : 'mapas'}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {mostrarSecaoSemPasta && (
          <Box sx={{ display: 'grid', gap: 1.25 }}>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              Mapas sem pasta
            </Typography>
            <Box sx={{ display: 'grid', gap: 1, maxHeight: 210, overflowY: 'auto', overflowX: 'hidden', pr: 0.5, '&::-webkit-scrollbar': { width: 8 }, '&::-webkit-scrollbar-track': { background: 'rgba(15,23,42,0.88)', borderRadius: 999 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(148,163,184,0.35)', borderRadius: 999, '&:hover': { background: 'rgba(196,58,47,0.58)' } } }}>
              {mapasSemPasta.map(mapa => renderMapaCard(mapa, true))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetBrowseState();
        onClose();
      }}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            background: 'linear-gradient(180deg, rgba(20,24,30,0.98), rgba(12,15,20,0.98))',
            border: '1px solid rgba(196,58,47,0.28)',
            borderRadius: 3,
            color: 'var(--text-primary)',
            width: { xs: '100%', md: 860 },
            maxWidth: '95vw',
            maxHeight: '90vh',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, color: 'var(--text-primary)', fontWeight: 800, px: 2.5, py: 2 }}>
        <span>Fundo do Grid</span>
        <IconButton
          aria-label="Fechar seletor de mapa"
          onClick={() => {
            resetBrowseState();
            onClose();
          }}
          size="small"
          sx={{ color: 'var(--text-secondary)' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ background: 'rgba(8,11,17,0.4)', p: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gap: 2, maxHeight: '100%' }}>
          <Box sx={{ display: 'flex', gap: 1, p: 0.5, borderRadius: 2, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.16)' }}>
            {['mapa', 'url'].map(origem => (
              <Button
                key={origem}
                type="button"
                variant={draft?.origem === origem ? 'contained' : 'text'}
                onClick={() => onSelectMap({ source: 'mode', origem })}
                sx={{
                  flex: 1,
                  minHeight: 42,
                  borderRadius: 1.5,
                  background: draft?.origem === origem ? 'linear-gradient(135deg, rgba(196,58,47,0.32), rgba(59,130,246,0.18))' : 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                }}
              >
                {origem === 'mapa' ? 'Meus Mapas' : 'Link da Imagem'}
              </Button>
            ))}
          </Box>

          {draft?.origem === 'mapa' ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <TextField
                fullWidth
                placeholder="Buscar mapas ou pastas..."
                value={busca}
                onChange={event => setBusca(event.target.value)}
                sx={fieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'var(--text-secondary)', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: busca ? (
                      <InputAdornment position="end">
                        <IconButton aria-label="Limpar busca" size="small" onClick={() => setBusca('')} sx={{ color: 'var(--text-secondary)', p: 0.5 }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />

              {loadingMapas || loadingPastas ? (
                <Typography sx={{ color: 'var(--text-secondary)' }}>Carregando mapas e pastas…</Typography>
              ) : (
                renderBiblioteca()
              )}

              {(mapaSelecionado?.linkImagem || draft?.url) && (
                <Box sx={{ borderRadius: 2, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
                  <Box
                    component="img"
                    src={mapaSelecionado?.linkImagem || draft?.url}
                    alt="Prévia do mapa selecionado"
                    sx={{
                      width: '100%',
                      height: 180,
                      objectFit: draft?.ajuste === 'contain' ? 'contain' : 'cover',
                      display: 'block',
                    }}
                  />
                </Box>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                fullWidth
                label="URL da imagem de fundo"
                value={draft?.url || ''}
                onChange={event => onSelectMap({ source: 'url', value: event.target.value })}
                sx={fieldSx}
              />

              {draft?.url && (
                <Box
                  sx={{
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    minHeight: 180,
                    overflow: 'hidden',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Box
                    component="img"
                    src={draft.url}
                    alt="Prévia do fundo do grid"
                    sx={{
                      width: '100%',
                      height: 180,
                      objectFit: draft?.ajuste === 'contain' ? 'contain' : 'cover',
                      objectPosition: 'center',
                      display: 'block',
                      borderRadius: 2,
                    }}
                  />
                </Box>
              )}
            </Box>
          )}

          <FormControl fullWidth sx={fieldSx}>
            <InputLabel id="imagem-fundo-ajuste-label">Ajuste da imagem</InputLabel>
            <Select
              labelId="imagem-fundo-ajuste-label"
              label="Ajuste da imagem"
              value={draft?.ajuste || 'cover'}
              onChange={event => onSelectMap({ source: 'ajuste', value: event.target.value })}
            >
              <MenuItem value="cover">Preencher</MenuItem>
              <MenuItem value="contain">Ajustar</MenuItem>
              <MenuItem value="fill">Esticar</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'grid', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                Opacidade dos quadrantes
              </Typography>
              <Typography sx={{ color: 'var(--color-accent)', fontWeight: 800 }}>
                {Number(draft?.opacidadeQuadrantes ?? 20)}%
              </Typography>
            </Box>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Number(draft?.opacidadeQuadrantes ?? 20)}
              onChange={event => onSelectMap({ source: 'opacidade', value: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => {
            resetBrowseState();
            onClose();
          }}
          variant="text"
          sx={{ color: 'var(--text-secondary)' }}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => {
            resetBrowseState();
            onRemoveImage();
          }}
          variant="text"
          sx={{ color: '#fca5a5' }}
          disabled={!draft?.url && !draft?.mapaId}
        >
          Remover imagem
        </Button>
        <Button
          onClick={() => {
            resetBrowseState();
            onSave();
          }}
          variant="contained"
          sx={primaryButtonSx}
          disabled={
            draft?.origem === 'mapa'
              ? !draft?.mapaId || !mapaSelecionado?.linkImagem
              : Boolean(draft?.url && !/^https?:\/\//i.test(draft.url.trim()))
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CardFluxMapaSelectorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onRemoveImage: PropTypes.func.isRequired,
  onSelectMap: PropTypes.func.isRequired,
  draft: PropTypes.shape({
    origem: PropTypes.oneOf(['mapa', 'url']),
    mapaId: PropTypes.string,
    url: PropTypes.string,
    ajuste: PropTypes.oneOf(['cover', 'contain', 'fill']),
    opacidadeQuadrantes: PropTypes.number,
  }),
  mapasDisponiveis: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nome: PropTypes.string,
      categoria: PropTypes.string,
      descricao: PropTypes.string,
      linkImagem: PropTypes.string,
      pastaId: PropTypes.string,
    }),
  ),
  pastasDisponiveis: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      nome: PropTypes.string,
      ordem: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      imagemCapa: PropTypes.string,
    }),
  ),
  loadingMapas: PropTypes.bool,
  loadingPastas: PropTypes.bool,
};

CardFluxMapaSelectorModal.defaultProps = {
  draft: {
    origem: 'url',
    mapaId: null,
    url: '',
    ajuste: 'cover',
    opacidadeQuadrantes: 20,
  },
  mapasDisponiveis: [],
  pastasDisponiveis: [],
  loadingMapas: false,
  loadingPastas: false,
};

function pasteToName(pastaId, pastasDisponiveis) {
  if (!pastaId) return 'Sem pasta';
  const pasta = (pastasDisponiveis || []).find(item => item.id === pastaId);
  return pasta?.nome || 'Sem pasta';
}

export default CardFluxMapaSelectorModal;
