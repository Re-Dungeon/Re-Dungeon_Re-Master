import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
// star icon removed (not used) - keep imports minimal
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import LinearProgress from '@mui/material/LinearProgress';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { getRmMissoesPorCampanha, removeRmMissao } from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import { STATUS_MISSAO_OPCOES } from './missaoUtils';

const cardSx = {
  position: 'relative',
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  height: '100%',
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  background:
    'linear-gradient(180deg, rgba(12,14,18,0.98), rgba(8,10,13,0.98))',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 2.25,
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(2,6,12,0.6)',
  transition:
    'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease, filter 200ms ease',
  '&:hover': {
    transform: 'translateY(-6px)',
    borderColor: 'rgba(196, 58, 47, 0.6)',
    boxShadow: '0 22px 48px rgba(196, 58, 47, 0.08), 0 28px 80px rgba(0,0,0,0.6)',
    filter: 'brightness(1.03)',
    '& .accent': {
      boxShadow: '0 0 30px rgba(196,58,47,0.14), inset 0 0 12px rgba(255,255,255,0.02)'
    },
  },
};

// Animated numeric counter: animates from previous value to `value`
const AnimatedNumber = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current || 0;
    const to = Number(value || 0);
    const diff = to - from;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const cur = Math.round(from + diff * t);
      setDisplay(cur);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else prevRef.current = to;
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <>{display}</>;
};

AnimatedNumber.propTypes = {
  value: PropTypes.number.isRequired,
  duration: PropTypes.number,
};

const accentSx = {
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: 5,
  background: 'linear-gradient(180deg, rgba(196, 58, 47, 0.96), rgba(143, 35, 28, 0.7))',
  borderRadius: '6px 0 0 6px',
  transition: 'background 200ms ease, opacity 200ms ease, box-shadow 200ms ease',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)'
};

const contentSx = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: 0.5,
  p: 1,
  pl: { xs: 2, md: 3 },
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
};

const mainRowSx = {
  display: 'flex',
  gap: 1.5,
  alignItems: 'stretch',
  width: '100%',
  minWidth: 0,
};

const rightColumnSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  flex: 1,
  minWidth: 0,
  width: '100%',
};

// emblem removed; keep styles minimal if needed later

const infoSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
  flex: '1 1 45%',
  minWidth: 0,
  maxWidth: '100%',
  width: '100%',
};

const actionsAbsoluteSx = {
  position: 'absolute',
  right: 12,
  top: 12,
  display: 'flex',
  gap: 0.5,
  zIndex: 4,
};

const footerHudSx = {
  mt: 0.4,
  pt: 0.4,
  borderTop: '1px solid rgba(255,255,255,0.03)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: { xs: 0.75, md: 1.5 },
  flexWrap: 'wrap',
  width: '100%',
  minWidth: 0,
  px: { xs: 0, md: 0.5 },
};

const footerLabelSx = {
  color: 'var(--text-muted)',
  fontSize: '0.72rem',
  mb: 0.25,
  letterSpacing: '0.04em',
};

const footerValueSx = {
  color: 'var(--text-muted)',
  fontWeight: 700,
  mt: 0,
  lineHeight: 1.05,
};

const titleSx = {
  color: 'var(--text-primary)',
  fontWeight: 800,
  fontSize: '1.18rem',
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minHeight: '2.6em',
  mb: 0,
  transition: 'color 160ms ease, text-shadow 160ms ease',
};

const descriptionSx = {
  color: 'var(--text-secondary)',
  fontSize: '0.86rem',
  lineHeight: 1.45,
  maxHeight: 'calc(1.45em * 4)',
  overflowY: 'auto',
  overflowX: 'hidden',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
  m: 0,
  pr: 0.75,
  position: 'relative',
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 999,
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(180deg, rgba(196,58,47,0.85), rgba(220,90,70,0.85))',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.2)',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'linear-gradient(180deg, rgba(196,58,47,0.95), rgba(220,90,70,0.95))',
  },
};

const statusStyles = {
  nao_iniciada: {
    background: 'rgba(148, 163, 184, 0.12)',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    color: '#dfe7f2',
  },
  em_andamento: {
    background: 'rgba(234, 179, 8, 0.12)',
    border: '1px solid rgba(234, 179, 8, 0.28)',
    color: '#facc15',
  },
  concluida: {
    background: 'rgba(74, 222, 128, 0.12)',
    border: '1px solid rgba(74, 222, 128, 0.28)',
    color: '#86efac',
  },
  falhada: {
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.28)',
    color: '#fca5a5',
  },
  abandonada: {
    background: 'rgba(17, 24, 39, 0.78)',
    border: '1px solid rgba(148, 163, 184, 0.24)',
    color: '#e5e7eb',
  },
};

const actionButtonSx = {
  width: 36,
  height: 36,
  borderRadius: 1.5,
  border: '1px solid rgba(255,255,255,0.04)',
  background: 'rgba(9, 12, 16, 0.6)',
  color: 'var(--text-primary)',
  backdropFilter: 'blur(6px)',
  transition: 'all 160ms ease',
  '&:hover': {
    background: 'rgba(196, 58, 47, 0.12)',
    borderColor: 'rgba(196, 58, 47, 0.42)',
    color: 'var(--color-accent)',
  },
};

const hudIconSx = {
  fontSize: 16,
  color: 'var(--text-muted)',
  mr: 0.5,
};

const Missoes = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getMissoesDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmMissoesPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
  }, [campanhaAtiva]);

  const {
    items: missoes,
    loading: loadingMissoes,
    error: errorMissoes,
    reload: reloadMissoes,
    remove: handleRemoveMissao,
  } = useEntityCRUD({ getAll: getMissoesDaCampanha, remove: removeRmMissao });

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingMissoes;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  return (
    <Box className="page-container">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
          >
            Missões — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Acompanhamento de objetivos e recompensas desta campanha.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_MISSAO)}
            sx={{
              background: 'var(--color-primary)',
              '&:hover': { background: 'var(--color-primary-dark)' },
            }}
          >
            + Nova Missão
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorMissoes ? (
        <ListLoadError
          mensagem="Erro ao carregar as missões."
          onRetry={reloadMissoes}
        />
      ) : missoes.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">📜</span>
          <p>Nenhuma missão cadastrada</p>
          <small>Crie uma missão para começar</small>
          {canCreate() && podeEscrever && (
            <Button
              variant="contained"
              onClick={() => navigate(ROUTE_PATHS.NOVA_MISSAO)}
              sx={{
                mt: 2,
                background: 'var(--color-primary)',
                '&:hover': { background: 'var(--color-primary-dark)' },
              }}
            >
              + Nova Missão
            </Button>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 3,
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
          }}
        >
          {missoes.map(missao => {
            const status = STATUS_MISSAO_OPCOES.find(
              o => o.value === missao.status,
            );
            const objetivos = missao.objetivos ?? [];
            const concluidos = objetivos.filter(o => o.concluido).length;
            const statusStyle = status
              ? statusStyles[status.value] || statusStyles.nao_iniciada
              : statusStyles.nao_iniciada;
            const importanciaMap = {
              primaria: { label: 'PRINCIPAL', color: 'rgba(196,58,47,0.95)', icon: 'https://i.imgur.com/ZMxGTIW.png' },
              secundaria: { label: 'SECUNDÁRIA', color: 'rgba(196,140,37,0.9)', icon: 'https://i.imgur.com/vevNrg6.png' },
              secreta: { label: 'OCULTA', color: 'rgba(124,58,237,0.9)', icon: 'https://i.imgur.com/7lEybtt.png' },
              repetitiva: { label: 'REPETITIVA', color: 'rgba(34,197,94,0.9)', icon: 'https://i.imgur.com/CvKzUvZ.png' },
            };

            const importancia = importanciaMap[missao.importancia] || importanciaMap.primaria;
            const percent = objetivos.length > 0 ? Math.round((concluidos / objetivos.length) * 100) : 0;

            return (
              <Paper key={missao.id} elevation={0} sx={cardSx}>
                <Box className="accent" sx={{ ...accentSx, background: importancia.color }} />
                <Box sx={contentSx}>
                  <Box sx={actionsAbsoluteSx}>
                    {podeEscrever && (
                      <>
                        <IconButton
                          size="small"
                          title={`Editar missão ${missao.titulo}`}
                          onClick={() =>
                            navigate(ROUTE_PATHS.NOVA_MISSAO, {
                              state: { missao },
                            })
                          }
                          sx={actionButtonSx}
                          aria-label={`Editar missão ${missao.titulo}`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title={`Remover missão ${missao.titulo}`}
                          onClick={() => handleRemoveMissao(missao.id)}
                          sx={{
                            ...actionButtonSx,
                            color: '#fca5a5',
                            '&:hover': {
                              background: 'rgba(127, 29, 29, 0.35)',
                              borderColor: 'rgba(248, 113, 113, 0.5)',
                              color: '#fecaca',
                            },
                          }}
                          aria-label={`Remover missão ${missao.titulo}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>

                  <Box sx={mainRowSx}>
                    <Box sx={rightColumnSx}>
                        <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ ...infoSx, position: 'relative' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 800 }}>MISSÃO</Typography>
                              <Typography variant="h5" sx={{ ...titleSx, fontSize: { xs: '1rem', md: '1.25rem' }, lineHeight: { xs: 1.15, md: 1.05 }, pr: 2 }}>{missao.titulo}</Typography>
                            </Box>

                            {/* importance image and status moved to footer */}

                            <Box>
                              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: '0.06em', fontWeight: 800 }}>DESCRIÇÃO</Typography>
                              <Typography variant="body2" sx={descriptionSx}>{missao.descricao}</Typography>
                            </Box>
                          </Box>

                          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 700 }}>OBJETIVOS</Typography>
                              <Typography variant="body2" sx={{ color: 'var(--text-muted)', float: 'right' }}>
                                <AnimatedNumber value={concluidos} duration={800} />/{objetivos.length}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={percent}
                                sx={{
                                  height: 6,
                                  borderRadius: 999,
                                  mt: 0.5,
                                  background: 'rgba(255,255,255,0.03)',
                                  overflow: 'hidden',
                                  '& .MuiLinearProgress-bar': {
                                    background: `linear-gradient(270deg, ${importancia.color}, rgba(220,90,70,0.95), ${importancia.color})`,
                                    backgroundSize: '200% 100%',
                                    animation: 'moveGradient 3s linear infinite',
                                    boxShadow: `0 0 8px ${importancia.color}`,
                                  },
                                  '@keyframes moveGradient': {
                                    '0%': { backgroundPosition: '0% 0%' },
                                    '100%': { backgroundPosition: '200% 0%' },
                                  },
                                }}
                              />
                              <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.75, fontSize: '0.8rem' }}>
                                Objetivos: {concluidos}/{objetivos.length} concluídos
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={footerHudSx}>
                          <Box sx={{ textAlign: 'center', minWidth: 0, flex: '1 1 70px' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, mt: 0.5, minWidth: 0 }}>
                              {importancia.icon && (
                                <Box component="img" src={importancia.icon} alt={importancia.label} sx={{ width: { xs: 72, md: 110 }, height: { xs: 48, md: 72 }, objectFit: 'contain', display: 'block', flexShrink: 0, maxWidth: '100%' }} />
                              )}
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: 'center', minWidth: 0, flex: '1 1 80px' }}>
                            <Typography variant="caption" sx={footerLabelSx}>STATUS</Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: status ? statusStyle.color : 'var(--text-muted)',
                                fontWeight: 700,
                                fontSize: status && status.value === 'em_andamento' ? '0.78rem' : '0.95rem',
                                lineHeight: 1.05,
                                overflowWrap: 'anywhere',
                              }}
                            >
                              {status ? status.label : '—'}
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'center', minWidth: 0, flex: '1 1 80px' }}>
                            <Typography variant="caption" sx={footerLabelSx}>RECOMPENSA</Typography>
                            <Typography variant="body2" sx={{ ...footerValueSx, overflowWrap: 'anywhere' }}>{missao.exp ? `${missao.exp} XP` : '—'}</Typography>
                          </Box>

                          <Box sx={{ textAlign: 'center', minWidth: 0, flex: '1 1 80px' }}>
                            <Typography variant="caption" sx={footerLabelSx}>OBJETIVOS</Typography>
                            <Typography variant="body2" sx={{ ...footerValueSx, overflowWrap: 'anywhere' }}>{concluidos}/{objetivos.length}</Typography>
                          </Box>

                          <Box sx={{ textAlign: 'center', minWidth: 0, flex: '1 1 80px' }}>
                            <Typography variant="caption" sx={footerLabelSx}>NPCs</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', minWidth: 0 }}>
                              <GroupOutlinedIcon sx={hudIconSx} />
                              <Typography variant="body2" sx={{ ...footerValueSx, overflowWrap: 'anywhere' }}>{(missao.npcsRelacionados || []).length}</Typography>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: 'center', minWidth: 0, flex: '1 1 80px' }}>
                            <Typography variant="caption" sx={footerLabelSx}>CENAS</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'center', minWidth: 0 }}>
                              <MapOutlinedIcon sx={hudIconSx} />
                              <Typography variant="body2" sx={{ ...footerValueSx, overflowWrap: 'anywhere' }}>{(missao.cenasVinculadas || []).length}</Typography>
                            </Box>
                          </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Missoes;
