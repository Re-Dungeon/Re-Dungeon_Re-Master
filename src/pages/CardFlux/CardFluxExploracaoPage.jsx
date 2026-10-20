import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useCampanha } from 'context/CampanhaContext';
import {
  getCardfluxCartas,
  getRmCardfluxExploracoesPorCampanha,
  getRmMapasPastasPorCampanha,
  getRmMapasPorCampanha,
  updateRmCardfluxExploracao,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import useUniversos from 'hooks/useUniversos';
import CartaDetalheDialog from './CartaDetalheDialog';
import CardFluxGridContextMenu from './CardFluxGridContextMenu';
import CardFluxMapaSelectorModal from './CardFluxMapaSelectorModal';
import {
  getEstadoQuadrante,
  registrarResultadoQuadrante,
  removerCartaQuadrante,
  revelarQuadranteExploracao,
  substituirCartaQuadrante,
} from './exploracaoGrid';

const panelSx = {
  p: 2,
  background: 'linear-gradient(180deg, rgba(20,24,30,0.98), rgba(12,15,20,0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 18px 36px rgba(0,0,0,0.18)',
};

const primaryButtonSx = {
  minHeight: '42px',
  borderRadius: 2,
  background: 'linear-gradient(135deg, rgba(89,171,255,0.95), rgba(196,58,47,0.92))',
  color: '#f8fafc',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  boxShadow: '0 14px 32px rgba(89,171,255,0.18)',
  border: '1px solid rgba(89,171,255,0.4)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 18px 36px rgba(196,58,47,0.18)',
  },
  '&:active': { transform: 'translateY(0)' },
  '&:focus-visible': {
    outline: '2px solid rgba(89,171,255,0.8)',
    outlineOffset: '2px',
  },
  '&.Mui-disabled': {
    opacity: 0.55,
    color: 'rgba(248,250,252,0.8)',
    background: 'rgba(71,85,105,0.65)',
    boxShadow: 'none',
  },
};

const secondaryButtonSx = {
  minHeight: '42px',
  borderRadius: 2,
  color: 'var(--text-primary)',
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(15,23,42,0.82)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'rgba(30,41,59,0.92)',
    borderColor: 'rgba(89,171,255,0.42)',
    transform: 'translateY(-1px)',
  },
  '&:active': { transform: 'translateY(0)' },
  '&:focus-visible': {
    outline: '2px solid rgba(89,171,255,0.8)',
    outlineOffset: '2px',
  },
  '&.Mui-disabled': {
    borderColor: 'rgba(148,163,184,0.12)',
    color: 'rgba(148,163,184,0.55)',
    background: 'rgba(15,23,42,0.45)',
  },
};

const dangerButtonSx = {
  ...secondaryButtonSx,
  borderColor: 'rgba(248,113,113,0.35)',
  background: 'rgba(127,29,29,0.18)',
  color: '#fecaca',
  '&:hover': {
    background: 'rgba(127,29,29,0.28)',
    borderColor: 'rgba(248,113,113,0.65)',
    transform: 'translateY(-1px)',
  },
  '&.Mui-disabled': {
    borderColor: 'rgba(248,113,113,0.1)',
    color: 'rgba(254,202,202,0.5)',
    background: 'rgba(127,29,29,0.08)',
  },
};

const STATE_META = {
  oculto: {
    label: 'Oculto',
    icon: '◌',
    badgeBackground: 'rgba(96, 165, 250, 0.12)',
    badgeBorder: 'rgba(96, 165, 250, 0.38)',
    badgeColor: '#bfdbfe',
    cellBackground: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.76))',
    cellBorder: 'rgba(148,163,184,0.16)',
  },
  revelado: {
    label: 'Revelado',
    icon: '◉',
    badgeBackground: 'rgba(251,191,36,0.12)',
    badgeBorder: 'rgba(251,191,36,0.45)',
    badgeColor: '#fbbf24',
    cellBackground: 'linear-gradient(135deg, rgba(120,72,22,0.82), rgba(39,27,16,0.9))',
    cellBorder: 'rgba(251,191,36,0.58)',
  },
  resolvido: {
    label: 'Resolvido',
    icon: '✓',
    badgeBackground: 'rgba(34,197,94,0.12)',
    badgeBorder: 'rgba(34,197,94,0.42)',
    badgeColor: '#86efac',
    cellBackground: 'linear-gradient(135deg, rgba(15,64,39,0.9), rgba(12,26,18,0.9))',
    cellBorder: 'rgba(74,222,128,0.64)',
  },
  vazio: {
    label: 'Vazio',
    icon: '○',
    badgeBackground: 'rgba(148,163,184,0.12)',
    badgeBorder: 'rgba(148,163,184,0.28)',
    badgeColor: '#e2e8f0',
    cellBackground: 'linear-gradient(135deg, rgba(30,41,59,0.56), rgba(15,23,42,0.76))',
    cellBorder: 'rgba(148,163,184,0.14)',
  },
  bloqueado: {
    label: 'Bloqueado',
    icon: '🔒',
    badgeBackground: 'rgba(168,85,247,0.12)',
    badgeBorder: 'rgba(168,85,247,0.35)',
    badgeColor: '#d8b4fe',
    cellBackground: 'linear-gradient(135deg, rgba(120,72,22,0.82), rgba(39,27,16,0.9))',
    cellBorder: 'rgba(168,85,247,0.5)',
  },
};

const RESULT_META = {
  sucesso: {
    label: 'Sucesso',
    icon: '✓',
    badgeBackground: 'rgba(34,197,94,0.12)',
    badgeBorder: 'rgba(34,197,94,0.42)',
    badgeColor: '#86efac',
  },
  falha: {
    label: 'Falha',
    icon: '✕',
    badgeBackground: 'rgba(239,68,68,0.12)',
    badgeBorder: 'rgba(239,68,68,0.42)',
    badgeColor: '#fca5a5',
  },
  pendente: {
    label: 'Pendente',
    icon: '•',
    badgeBackground: 'rgba(245,158,11,0.12)',
    badgeBorder: 'rgba(245,158,11,0.42)',
    badgeColor: '#fcd34d',
  },
};

const STATE_ICONS = {
  oculto: 'https://i.imgur.com/YAqJIW5.png',
  revelado: 'https://i.imgur.com/Ge1n9BB.png',
  resolvido: 'https://i.imgur.com/VnRSJAp.png',
  combate: 'https://i.imgur.com/nyZJJWw.png',
};

const CARD_ICONS = {
  carta: 'https://i.imgur.com/IAi2mx5.png',
};

const TYPE_ICONS = {
  combate: 'https://i.imgur.com/iuhBnUO.png',
  descoberta: 'https://i.imgur.com/I2cZ9rc.png',
  interacao: 'https://i.imgur.com/lEo8jju.png',
  perigo: 'https://i.imgur.com/MokHiOQ.png',
  objetivo: 'https://i.imgur.com/CIgzrgD.png',
  ambiental: 'https://i.imgur.com/LfPTzCw.png',
  acampamento: 'https://i.imgur.com/HvDRGlc.png',
};

const ICONS = {
  estado: STATE_ICONS,
  categoria: TYPE_ICONS,
  carta: CARD_ICONS,
};

const normalizeIconKey = valor => String(valor ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z]/g, '');

const resolveCategoriaKey = valor => {
  const chave = normalizeIconKey(valor);
  const aliases = {
    combate: 'combate',
    combat: 'combate',
    descoberta: 'descoberta',
    descobertas: 'descoberta',
    interacao: 'interacao',
    interacaoe: 'interacao',
    interacaoes: 'interacao',
    perigo: 'perigo',
    objetivo: 'objetivo',
    objetivos: 'objetivo',
    ambiental: 'ambiental',
    ambiente: 'ambiental',
    acampamento: 'acampamento',
    camp: 'acampamento',
  };

  if (!chave) return null;
  return aliases[chave] || (
    Object.keys(TYPE_ICONS).includes(chave) ? chave : null
  );
};

const buildIconElement = ({
  src,
  fallback,
  alt,
  size = '100%',
  variant = 'cell-state',
  sx = {},
  boxSx = {},
}) => {
  const resolvedSize = typeof size === 'number' ? `${size}px` : size;
  const fallbackFontSize = typeof size === 'number' ? `${Math.max(0.8, size * 0.58)}rem` : '0.9rem';
  const resolvedClassName = variant === 'legend-state'
    ? 'exploration-legend__state-icon'
    : variant === 'legend-category'
      ? 'exploration-legend__category-icon'
      : variant === 'cell-category'
        ? 'exploration-cell__category-icon'
        : 'exploration-cell__state-icon';

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        width: resolvedSize,
        height: resolvedSize,
        minWidth: 0,
        minHeight: 0,
        flexShrink: 0,
        ...boxSx,
      }}
    >
      <Box
        component="img"
        className={resolvedClassName}
        src={src}
        alt={alt}
        onError={event => {
          event.currentTarget.style.display = 'none';
          const fallbackNode = event.currentTarget.nextElementSibling;
          if (fallbackNode) {
            fallbackNode.style.display = 'inline-flex';
          }
        }}
        sx={{
          display: 'block',
          width: variant === 'legend-state' || variant === 'legend-category' ? '100%' : '100%',
          height: variant === 'legend-state' || variant === 'legend-category' ? '100%' : '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 10px rgba(89,171,255,0.25))',
          ...sx,
        }}
      />
      <Box
        component="span"
        sx={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          fontSize: fallbackFontSize,
          lineHeight: 1,
          color: 'inherit',
        }}
      >
        {fallback}
      </Box>
    </Box>
  );
};

const resolveQuadranteMarcador = quadrante => {
  if (!quadrante) return null;
  const marcador = quadrante?.marcador ?? quadrante?.tipoMarcador ?? quadrante?.marcadorTipo;
  if (!marcador || typeof marcador !== 'string') return null;
  return resolveCategoriaKey(marcador);
};

const getQuadrantePrincipalIconMeta = quadrante => {
  if (!quadrante) return { src: null, fallback: '•', alt: 'Quadrante' };

  const estado = getEstadoQuadrante(quadrante).estado;
  const marcador = resolveQuadranteMarcador(quadrante);
  const marcadorLabel = {
    combate: 'Combate',
    descoberta: 'Descoberta',
    interacao: 'Interação',
    perigo: 'Perigo',
    objetivo: 'Objetivo',
    ambiental: 'Ambiental',
    acampamento: 'Acampamento',
  }[marcador] || marcador || 'Marcador';

  if (estado === 'oculto' || quadrante?.bloqueado) {
    return { src: ICONS.estado.oculto, fallback: '◌', alt: 'Não explorado' };
  }

  if (marcador && ['revelado', 'em_andamento', 'resolvido', 'vazio'].includes(estado)) {
    return { src: TYPE_ICONS[marcador], fallback: marcadorLabel.charAt(0).toUpperCase(), alt: marcadorLabel };
  }

  if (estado === 'resolvido') {
    return { src: ICONS.estado.resolvido, fallback: '✓', alt: 'Resolvido' };
  }

  if (quadrante?.cartaId && ['revelado', 'em_andamento', 'vazio'].includes(estado)) {
    return { src: ICONS.carta.carta, fallback: 'C', alt: 'Carta' };
  }

  if (estado === 'revelado' || estado === 'em_andamento' || estado === 'vazio') {
    return { src: ICONS.estado.revelado, fallback: '◉', alt: 'Explorado' };
  }

  return { src: ICONS.estado.oculto, fallback: '◌', alt: 'Não explorado' };
};

const QuadranteBadge = ({ icon, label, background, border, color, sx = {} }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.8,
      px: 1.5,
      py: 0.75,
      borderRadius: 1.25,
      border: `1px solid ${border}`,
      background,
      color,
      fontWeight: 800,
      fontSize: '0.76rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1.2,
      transition: 'all 0.22s ease',
      willChange: 'background, border-color, transform',
      ...sx,
    }}
  >
    <Box component="span" aria-hidden="true" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.92rem', lineHeight: 1 }}>
      {icon}
    </Box>
    <Box component="span">{label}</Box>
  </Box>
);

const GridLegendItem = ({ label, iconUrl, icon, fallback, description, tone = 'default', variant = 'state' }) => {
  const toneStyles = {
    default: { background: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.18)', color: 'var(--text-primary)' },
    success: { background: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.22)', color: 'var(--text-primary)' },
    warning: { background: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.22)', color: 'var(--text-primary)' },
    danger: { background: 'rgba(196, 58, 47, 0.10)', border: 'rgba(196, 58, 47, 0.22)', color: 'var(--text-primary)' },
    purple: { background: 'rgba(168, 85, 247, 0.10)', border: 'rgba(168, 85, 247, 0.22)', color: 'var(--text-primary)' },
  };

  const resolvedTone = toneStyles[tone] || toneStyles.default;
  const resolvedVariant = variant === 'state' ? 'legend-state' : 'legend-category';

  return (
    <Tooltip title={description || 'Indicador visual do grid.'} arrow>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '10px',
          width: 'fit-content',
          maxWidth: '100%',
          minHeight: '40px',
          height: '40px',
          px: 1.5,
          py: 1,
          borderRadius: '8px',
          border: `1px solid ${resolvedTone.border}`,
          background: resolvedTone.background,
          color: resolvedTone.color,
          fontWeight: 700,
          fontSize: '0.76rem',
          lineHeight: 1.2,
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          transition: 'border-color 0.2s ease, background 0.2s ease',
        }}
      >
        <Box
          sx={{
            width: '28px',
            height: '28px',
            minWidth: '28px',
            minHeight: '28px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {iconUrl ? (
            buildIconElement({
              src: iconUrl,
              fallback: fallback || label?.slice(0, 1) || '•',
              alt: label,
              size: 30,
              variant: resolvedVariant,
              boxSx: { width: 30, height: 30, flexShrink: 0 },
              sx: { maxWidth: '100%', maxHeight: '100%' },
            })
          ) : (
            <Box component="span" aria-hidden="true" sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', width: '100%', height: '100%' }}>
              {icon}
            </Box>
          )}
        </Box>
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 1 }}>
          {label}
        </Box>
      </Box>
    </Tooltip>
  );
};

const GridLegend = ({ groups }) => {
  const group = Array.isArray(groups) && groups.length ? groups[0] : null;
  return (
    <Box
      sx={{
        mt: 1.25,
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 2,
        background: 'rgba(15,23,42,0.6)',
        p: 1,
        display: 'grid',
        gap: 0.75,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {group && (
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="overline"
              sx={{
                color: 'var(--text-muted)',
                letterSpacing: '0.12em',
                fontWeight: 900,
                display: 'block',
              }}
            >
              {group.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', ml: 0.5 }}>
              Clique com o botão direito em um quadrante para adicionar um marcador.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
            {group.items.map(item => {
              const tooltipText = {
                Combate: 'Acontecimento envolvendo confronto.',
                Descoberta: 'Acontecimento envolvendo descoberta.',
                Interação: 'Acontecimento envolvendo diálogo, negociação ou troca.',
                Perigo: 'Acontecimento perigoso ou instável.',
                Objetivo: 'Acontecimento de meta ou missão.',
                Ambiental: 'Acontecimento de cenário e atmosfera.',
                Acampamento: 'Acontecimento ligado ao descanso ou montanhismo de campanha.',
              }[item.label] || 'Indicador visual do grid.';

              return (
                <GridLegendItem
                  key={`${group.title}-${item.label}`}
                  label={item.label}
                  iconUrl={item.iconUrl}
                  icon={item.icon}
                  fallback={item.fallback}
                  description={tooltipText}
                  tone={item.tone}
                  variant={'category'}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

GridLegendItem.propTypes = {
  label: PropTypes.string.isRequired,
  iconUrl: PropTypes.string,
  icon: PropTypes.node,
  fallback: PropTypes.string,
  description: PropTypes.string,
  tone: PropTypes.oneOf(['default', 'success', 'warning', 'danger', 'purple']),
  variant: PropTypes.oneOf(['state', 'category']),
};

GridLegendItem.defaultProps = {
  iconUrl: null,
  icon: null,
  fallback: null,
  description: 'Indicador visual do grid.',
  tone: 'default',
  variant: 'state',
};

const getQuadranteResultadoMeta = quadrante => {
  if (!quadrante?.resultado) return null;
  return RESULT_META[quadrante.resultado] || null;
};

const getQuadranteEstadoMeta = quadrante => {
  if (quadrante?.bloqueado) return STATE_META.bloqueado;
  if (quadrante?.estado === 'resolvido') return STATE_META.resolvido;
  if (quadrante?.estado === 'revelado' || quadrante?.estado === 'em_andamento') return STATE_META.revelado;
  if (quadrante?.estado === 'vazio') return STATE_META.vazio;
  return STATE_META.oculto;
};

const getQuadranteBadges = quadrante => {
  const badges = [];
  const estadoMeta = getQuadranteEstadoMeta(quadrante);
  const resultadoMeta = getQuadranteResultadoMeta(quadrante);

  if (estadoMeta) {
    badges.push(estadoMeta);
  }
  if (resultadoMeta && resultadoMeta.label !== estadoMeta?.label) {
    badges.push(resultadoMeta);
  }
  return badges.filter(Boolean);
};

const getQuadranteEstadoLabel = estado => (
  {
    oculto: 'Oculto',
    revelado: 'Revelado',
    resolvido: 'Resolvido',
    em_andamento: 'Em andamento',
    vazio: 'Vazio',
    bloqueado: 'Bloqueado',
  }[estado] || 'Oculto'
);

QuadranteBadge.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  background: PropTypes.string.isRequired,
  border: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  sx: PropTypes.shape({}),
};

GridLegend.propTypes = {
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          icon: PropTypes.node.isRequired,
          tone: PropTypes.string,
        }),
      ).isRequired,
    }),
  ).isRequired,
};

const CardFluxExploracaoPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { exploracaoId } = useParams();
  const { campanhaAtiva } = useCampanha();
  const { universos } = useUniversos();
  const exploracaoInicial = location.state?.exploracao || null;
  const quadranteInicial = exploracaoInicial?.quadrantes?.[0]?.[0] || null;
  const [exploracao, setExploracao] = useState(exploracaoInicial);
  const [cartas, setCartas] = useState([]);
  const [selected, setSelected] = useState({ x: 0, y: 0 });
  const [cartaVisualizada, setCartaVisualizada] = useState(null);
  const [resultadoSelecionado, setResultadoSelecionado] = useState(quadranteInicial?.resultado || 'sucesso');
  const [anotacao, setAnotacao] = useState(quadranteInicial?.anotacao || '');
  const [cartaManualBusca, setCartaManualBusca] = useState('');
  const [cartaManualId, setCartaManualId] = useState(quadranteInicial?.cartaId || '');
  const [confirmarRemocaoOpen, setConfirmarRemocaoOpen] = useState(false);
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const [savingAction, setSavingAction] = useState(null);
  const [feedback, setFeedback] = useState({ open: false, severity: 'success', message: '' });
  const [zoom, setZoom] = useState(1);
  const [imagemFundoModalAberta, setImagemFundoModalAberta] = useState(false);
  const [mapasDisponiveis, setMapasDisponiveis] = useState([]);
  const [pastasDisponiveis, setPastasDisponiveis] = useState([]);
  const [loadingMapas, setLoadingMapas] = useState(true);
  const [loadingPastas, setLoadingPastas] = useState(true);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, quadrante: null });
  const [imagemFundoDraft, setImagemFundoDraft] = useState({
    origem: 'url',
    mapaId: null,
    url: '',
    ajuste: 'cover',
    opacidadeQuadrantes: 20,
  });
  const mapViewportRef = useRef(null);
  const [mapViewport, setMapViewport] = useState({ width: 620, height: 440 });
  const gridColumns = exploracao?.dimensoes?.colunas || exploracaoInicial?.dimensoes?.colunas || 1;
  const gridRows = exploracao?.dimensoes?.linhas || exploracaoInicial?.dimensoes?.linhas || 1;
  const mapSurfaceSize = useMemo(
    () => ({
      width: Math.max(0, (mapViewport.width || 620) - 24),
      height: Math.max(0, (mapViewport.height || 440) - 24),
    }),
    [mapViewport.height, mapViewport.width],
  );

  useEffect(() => {
    if (!mapViewportRef.current) return undefined;

    const updateViewport = () => {
      const nextWidth = Math.max(420, Math.floor(mapViewportRef.current.clientWidth || 620));
      const nextHeight = Math.max(420, Math.floor(mapViewportRef.current.clientHeight || 440));

      setMapViewport(prev => (
        prev.width === nextWidth && prev.height === nextHeight ? prev : { width: nextWidth, height: nextHeight }
      ));
    };

    updateViewport();
    const observer = new ResizeObserver(updateViewport);
    observer.observe(mapViewportRef.current);

    return () => observer.disconnect();
  }, [gridColumns, gridRows]);

  const carregarDados = async () => {
    if (!campanhaAtiva) return;

    const [cartasDoUniverso, exploracoesDaCampanha] = await Promise.all([
      getCardfluxCartas(campanhaAtiva.universoId),
      getRmCardfluxExploracoesPorCampanha(
        campanhaAtiva.id,
        campanhaAtiva.universoId,
        campanhaAtiva.mestreId,
      ),
    ]);

    setCartas(cartasDoUniverso || []);

    const item =
      exploracoesDaCampanha.find(item => String(item.id) === String(exploracaoId)) ||
      location.state?.exploracao ||
      null;

    if (item) {
      setExploracao(item);
      setSelected({ x: 0, y: 0 });
      setAnotacao(item.quadrantes?.[0]?.[0]?.anotacao || '');
      setResultadoSelecionado(item.quadrantes?.[0]?.[0]?.resultado || 'sucesso');
      setCartaManualId(item.quadrantes?.[0]?.[0]?.cartaId || '');
    }
  };

  useAsyncEffect(carregarDados, [campanhaAtiva, exploracaoId]);

  useAsyncEffect(() => {
    if (!campanhaAtiva) {
      setMapasDisponiveis([]);
      setPastasDisponiveis([]);
      setLoadingMapas(false);
      setLoadingPastas(false);
      return;
    }

    let ativo = true;
    const carregarMapas = async () => {
      setLoadingMapas(true);
      setLoadingPastas(true);
      try {
        const [mapas, pastas] = await Promise.all([
          getRmMapasPorCampanha(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
          getRmMapasPastasPorCampanha(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
        ]);
        if (ativo) {
          setMapasDisponiveis(mapas || []);
          setPastasDisponiveis(pastas || []);
        }
      } catch {
        if (ativo) {
          setMapasDisponiveis([]);
          setPastasDisponiveis([]);
        }
      } finally {
        if (ativo) {
          setLoadingMapas(false);
          setLoadingPastas(false);
        }
      }
    };

    carregarMapas();
    return () => {
      ativo = false;
    };
  }, [campanhaAtiva]);

  const handleSelecionarMapaFundo = proximo => {
    if (!proximo) return;

    if (proximo.source === 'mode') {
      setImagemFundoDraft(prev => ({ ...prev, origem: proximo.origem }));
      return;
    }

    if (proximo.source === 'url') {
      setImagemFundoDraft(prev => ({ ...prev, url: proximo.value }));
      return;
    }

    if (proximo.source === 'ajuste') {
      setImagemFundoDraft(prev => ({ ...prev, ajuste: proximo.value }));
      return;
    }

    if (proximo.source === 'opacidade') {
      setImagemFundoDraft(prev => ({ ...prev, opacidadeQuadrantes: proximo.value }));
      return;
    }

    setImagemFundoDraft(prev => ({
      ...prev,
      origem: 'mapa',
      mapaId: proximo.id,
      url: proximo.linkImagem || prev.url,
    }));
  };

  const quadranteAtual = exploracao?.quadrantes?.[selected.y]?.[selected.x] || null;
  const quadranteStatusLabel = getQuadranteEstadoLabel(quadranteAtual?.estado);
  const imagemFundoAtiva = (() => {
    const url = exploracao?.imagemFundo?.url || exploracao?.configuracao?.imagemFundo?.url || '';
    if (!url.trim()) return null;
    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol) ? { ...exploracao.imagemFundo, url: parsed.href } : null;
    } catch {
      return null;
    }
  })();
  const universoAtualNome =
    universos.find(universo => universo.id === campanhaAtiva?.universoId)?.Nome ||
    campanhaAtiva?.universoId ||
    'Universo Desconhecido';

  const cartasRelacionadas = useMemo(() => {
    const decks = new Set((exploracao?.baralhos || []).filter(Boolean));
    return (cartas || []).filter(carta => decks.has(carta.deck));
  }, [cartas, exploracao]);

  const cartaAtual = cartasRelacionadas.find(carta => carta.id === quadranteAtual?.cartaId) || null;
  const totalQuadrantes = exploracao?.quadrantes ? exploracao.quadrantes.flat().length : 0;
  const totalDescobertos = exploracao?.quadrantes
    ? exploracao.quadrantes.flat().filter(quadrante => quadrante?.cartaId || quadrante?.resultado).length
    : 0;
  const percentual = totalQuadrantes > 0 ? (totalDescobertos / totalQuadrantes) * 100 : 0;

  const persistirExploracao = async proximaExploracao => {
    if (!proximaExploracao?.id) return;
    const { id, ...restante } = proximaExploracao;
    await updateRmCardfluxExploracao(id, restante);
    setExploracao(proximaExploracao);
  };

  const showFeedback = (severity, message) => {
    setFeedback({ open: true, severity, message });
  };

  const runAction = async (actionKey, action, successMessage) => {
    if (!exploracao || !quadranteAtual) return;
    setSavingAction(actionKey);

    try {
      await action();
      showFeedback('success', successMessage);
    } catch {
      showFeedback('error', 'Não foi possível atualizar o quadrante. Tente novamente.');
    } finally {
      setSavingAction(null);
    }
  };

  const handleSalvarAnotacao = async () => {
    if (!exploracao || !quadranteAtual) return;
    await runAction(
      'anotacao',
      async () => {
        const proxima = JSON.parse(JSON.stringify(exploracao));
        const alvo = proxima.quadrantes[selected.y][selected.x];
        alvo.anotacao = anotacao;
        setAnotacao(anotacao);
        await persistirExploracao(proxima);
      },
      'Anotação salva com sucesso.',
    );
  };

  const handleRevelar = async () => {
    if (!exploracao) return;
    await runAction(
      'revelar',
      async () => {
        const proxima = revelarQuadranteExploracao(exploracao, selected);
        await persistirExploracao(proxima);
      },
      'Quadrante revelado.',
    );
  };

  const handleOcultar = async () => {
    if (!exploracao) return;
    await runAction(
      'ocultar',
      async () => {
        const proxima = JSON.parse(JSON.stringify(exploracao));
        const alvo = proxima.quadrantes[selected.y][selected.x];
        if (!alvo) return;
        alvo.estado = 'oculto';
        alvo.resultado = null;
        alvo.anotacao = alvo.anotacao || '';
        await persistirExploracao(proxima);
      },
      'Quadrante ocultado.',
    );
  };

  const handleRemoverCarta = async () => {
    if (!exploracao) return;
    await runAction(
      'remover',
      async () => {
        const proxima = removerCartaQuadrante(exploracao, selected);
        await persistirExploracao(proxima);
        setConfirmarRemocaoOpen(false);
      },
      'Carta removida do quadrante.',
    );
  };

  const handleSubstituirCarta = async cartaId => {
    if (!exploracao || !cartaId) return;
    await runAction(
      'substituir',
      async () => {
        const proxima = substituirCartaQuadrante(exploracao, selected, cartaId);
        await persistirExploracao(proxima);
        setCartaManualId(cartaId);
      },
      'Carta atribuída ao quadrante.',
    );
  };

  const handleAdicionarCarta = async () => {
    if (!exploracao || !cartaManualId) return;
    await handleSubstituirCarta(cartaManualId);
  };

  const handleSelecionarQuadrante = proximo => {
    setSelected(proximo);
    const quadrante = exploracao?.quadrantes?.[proximo.y]?.[proximo.x];
    setAnotacao(quadrante?.anotacao || '');
    setResultadoSelecionado(quadrante?.resultado || 'sucesso');
    setCartaManualId(quadrante?.cartaId || '');
    setCartaManualBusca('');
  };

  const handleQuadranteMouseDown = event => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
  };

  const getQuadranteMarcador = quadrante => resolveQuadranteMarcador(quadrante);

  const closeContextMenu = () => {
    setContextMenu({ open: false, x: 0, y: 0, quadrante: null });
  };

  const handleQuadranteContextMenu = (event, quadrante) => {
    if (!quadrante || !event) return;
    event.preventDefault();
    event.stopPropagation();
    setSelected({ x: quadrante.x, y: quadrante.y });
    setContextMenu({
      open: true,
      x: event.clientX,
      y: event.clientY,
      quadrante,
    });
  };

  const handleMarcarQuadrante = async valor => {
    if (!exploracao || !contextMenu.quadrante) return;

    const proxima = JSON.parse(JSON.stringify(exploracao));
    const alvo = proxima.quadrantes?.[contextMenu.quadrante.y]?.[contextMenu.quadrante.x];
    if (!alvo) {
      closeContextMenu();
      return;
    }

    if (!valor) {
      delete alvo.marcador;
    } else {
      alvo.marcador = valor;
    }

    await persistirExploracao(proxima);
    closeContextMenu();
  };

  const handleResultado = async resultado => {
    if (!exploracao) return;
    await runAction(
      'resultado',
      async () => {
        const proxima = registrarResultadoQuadrante(exploracao, selected.x, selected.y, {
          resultado,
          observacao: anotacao || 'Acontecimento registrado.',
        });
        await persistirExploracao(proxima);
      },
      'Resultado registrado.',
    );
  };

  const handleBloquear = async () => {
    if (!exploracao || !quadranteAtual) return;
    await runAction(
      'bloquear',
      async () => {
        const proxima = JSON.parse(JSON.stringify(exploracao));
        const alvo = proxima.quadrantes[selected.y][selected.x];
        alvo.bloqueado = !alvo.bloqueado;
        await persistirExploracao(proxima);
      },
      quadranteAtual?.bloqueado ? 'Quadrante desbloqueado.' : 'Quadrante bloqueado.',
    );
  };

  const handleSalvarExploracao = async () => {
    if (!exploracao) return;
    await persistirExploracao(exploracao);
  };

  const imagemFundoValida = value => {
    if (!value || !String(value).trim()) return true;
    try {
      const url = new URL(String(value).trim());
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const abrirModalImagemFundo = () => {
    const base = exploracao?.imagemFundo || exploracao?.configuracao?.imagemFundo || {};
    setImagemFundoDraft({
      origem: base.origem === 'mapa' ? 'mapa' : 'url',
      mapaId: base.mapaId || null,
      url: typeof base.url === 'string' ? base.url : '',
      ajuste: ['cover', 'contain', 'fill'].includes(base.ajuste) ? base.ajuste : 'cover',
      opacidadeQuadrantes: Number.isFinite(Number(base.opacidadeQuadrantes))
        ? Number(base.opacidadeQuadrantes)
        : 20,
    });
    setImagemFundoModalAberta(true);
  };

  const salvarImagemFundo = async () => {
    if (!exploracao) return;

    const origem = imagemFundoDraft.origem === 'mapa' ? 'mapa' : 'url';
    const mapaSelecionadoAtual = origem === 'mapa'
      ? mapasDisponiveis.find(mapa => mapa.id === imagemFundoDraft.mapaId) || null
      : null;
    const url = origem === 'mapa'
      ? (mapaSelecionadoAtual?.linkImagem || '').trim()
      : (imagemFundoDraft.url || '').trim();

    if (origem === 'mapa' && (!mapaSelecionadoAtual || !mapaSelecionadoAtual.linkImagem)) return;
    if (origem === 'url' && url && !imagemFundoValida(url)) return;

    const proxima = JSON.parse(JSON.stringify(exploracao));
    proxima.imagemFundo = {
      origem,
      mapaId: origem === 'mapa' ? imagemFundoDraft.mapaId || null : null,
      url,
      ajuste: ['cover', 'contain', 'fill'].includes(imagemFundoDraft.ajuste) ? imagemFundoDraft.ajuste : 'cover',
      opacidadeQuadrantes: Number.isFinite(Number(imagemFundoDraft.opacidadeQuadrantes))
        ? Math.min(100, Math.max(0, Number(imagemFundoDraft.opacidadeQuadrantes)))
        : 20,
    };
    if (proxima.configuracao && typeof proxima.configuracao === 'object') {
      proxima.configuracao.imagemFundo = proxima.imagemFundo;
    }
    await persistirExploracao(proxima);
    setImagemFundoModalAberta(false);
  };

  const removerImagemFundo = async () => {
    if (!exploracao) return;
    const proxima = JSON.parse(JSON.stringify(exploracao));
    proxima.imagemFundo = {
      origem: 'url',
      mapaId: null,
      url: '',
      ajuste: 'cover',
      opacidadeQuadrantes: 20,
    };
    if (proxima.configuracao && typeof proxima.configuracao === 'object') {
      proxima.configuracao.imagemFundo = proxima.imagemFundo;
    }
    await persistirExploracao(proxima);
    setImagemFundoModalAberta(false);
  };

  const handleZoomIn = () => {
    setZoom(valorAtual => Number(Math.min(1.6, Number((valorAtual + 0.1).toFixed(2)))));
  };

  const handleZoomOut = () => {
    setZoom(valorAtual => Number(Math.max(0.7, Number((valorAtual - 0.1).toFixed(2)))));
  };

  const handleAjustarTela = () => {
    setZoom(1);
  };

  const cartasFiltradas = useMemo(() => {
    const termo = cartaManualBusca.trim().toLowerCase();
    if (!termo) return cartasRelacionadas;
    return cartasRelacionadas.filter(carta =>
      [carta.nome, carta.tipo, carta.deck].some(valor =>
        String(valor || '').toLowerCase().includes(termo),
      ),
    );
  }, [cartasRelacionadas, cartaManualBusca]);

  const gridLegendGroups = [
    {
      title: 'TIPO DE ACONTECIMENTO',
      items: [
        { label: 'Combate', icon: '⚔️', iconUrl: ICONS.categoria.combate, fallback: '⚔', value: 'combate', tone: 'neutral' },
        { label: 'Descoberta', icon: '✦', iconUrl: ICONS.categoria.descoberta, fallback: '✦', value: 'descoberta', tone: 'danger' },
        { label: 'Interação', icon: '◎', iconUrl: ICONS.categoria.interacao, fallback: '◎', value: 'interacao', tone: 'success' },
        { label: 'Perigo', icon: '⚠', iconUrl: ICONS.categoria.perigo, fallback: '⚠', value: 'perigo', tone: 'warning' },
        { label: 'Objetivo', icon: '★', iconUrl: ICONS.categoria.objetivo, fallback: '★', value: 'objetivo', tone: 'purple' },
        { label: 'Ambiental', icon: '❖', iconUrl: ICONS.categoria.ambiental, fallback: '❖', value: 'ambiental', tone: 'neutral' },
        { label: 'Acampamento', icon: '⛺', iconUrl: ICONS.categoria.acampamento, fallback: '⛺', value: 'acampamento', tone: 'success' },
      ],
    }];

  if (!campanhaAtiva || !exploracao) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography sx={{ color: 'var(--text-primary)' }}>Exploração não encontrada.</Typography>
        <Button onClick={() => navigate(ROUTE_PATHS.CARDFLUX)} sx={primaryButtonSx}>Voltar</Button>
      </Box>
    );
  }

  return (
    <Box className="page-container" sx={{ py: 4, px: { xs: 1, md: 2 } }}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(196, 58, 47, 0.28)',
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(18,21,29,0.96), rgba(12,15,21,0.96))',
          boxShadow: '0 24px 60px rgba(2, 6, 23, 0.38)',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(196,58,47,0.18), rgba(18,21,29,0.9)), rgba(13,17,24,0.96)',
            borderBottom: '1px solid rgba(196,58,47,0.2)',
            p: { xs: 2.5, md: 3 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: 'var(--color-accent)',
                  letterSpacing: '0.14em',
                  fontWeight: 800,
                  display: 'block',
                  mb: 1,
                }}
              >
                Exploração ativa
              </Typography>
              <Typography variant="h3" sx={{ color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.06 }}>
                {exploracao.nome}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center', flexWrap: 'wrap', ml: 'auto' }}>
              <Button variant="contained" onClick={handleSalvarExploracao} sx={primaryButtonSx}>
                Salvar exploração
              </Button>
              <Button variant="outlined" onClick={() => navigate(ROUTE_PATHS.CARDFLUX_EXPLORACOES)} sx={secondaryButtonSx}>
                Explorações
              </Button>
              <Button variant="outlined" onClick={() => navigate(ROUTE_PATHS.CARDFLUX)} sx={secondaryButtonSx}>
                Voltar
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.25,
              mt: 2.75,
            }}
          >
            <Chip label={`Campanha: ${campanhaAtiva.nome}`} sx={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }} />
            <Chip label={`Universo: ${universoAtualNome}`} sx={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }} />
            <Chip label={`Grid: ${exploracao.dimensoes?.linhas || 0}x${exploracao.dimensoes?.colunas || 0}`} sx={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }} />
            <Chip label={`Progresso: ${Math.round(percentual)}%`} sx={{ background: 'rgba(196,58,47,0.14)', color: 'var(--text-primary)' }} />
            <Chip label={`Acontecimentos: ${totalDescobertos}/${totalQuadrantes}`} sx={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)' }} />
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '290px minmax(0,1fr) 360px' }, gap: 2.5 }}>
            <Paper sx={{ ...panelSx, p: 2.25, background: 'rgba(15,18,24,0.96)', borderColor: 'rgba(196,58,47,0.2)' }}>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="overline" sx={{ color: 'var(--color-accent)', letterSpacing: '0.12em', fontWeight: 800 }}>
                  Exploração
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campanha</Typography>
                  <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 700 }}>{campanhaAtiva.nome}</Typography>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Universo</Typography>
                  <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 700 }}>{universoAtualNome}</Typography>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Baralhos</Typography>
                  <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 700 }}>{exploracao.baralhos?.join(', ') || 'Sem baralhos'}</Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 1.25 }}>
                  <Box sx={{ p: 1.25, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dimensão</Typography>
                    <Typography sx={{ mt: 0.6, color: 'var(--text-primary)', fontWeight: 800 }}>{exploracao.dimensoes?.linhas || 0}x{exploracao.dimensoes?.colunas || 0}</Typography>
                  </Box>
                  <Box sx={{ p: 1.25, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Progresso</Typography>
                    <Typography sx={{ mt: 0.6, color: 'var(--text-primary)', fontWeight: 800 }}>{Math.round(percentual)}%</Typography>
                  </Box>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acontecimentos</Typography>
                  <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 700 }}>{totalDescobertos} / {totalQuadrantes}</Typography>
                </Box>

                <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(196,58,47,0.08)', border: '1px solid rgba(196,58,47,0.2)' }}>
                  <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</Typography>
                  <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 700 }}>{exploracao.status || 'ativa'}</Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'grid', gap: 1.2 }}>
                <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 800 }}>
                  Ações gerais
                </Typography>
                <Button variant="contained" onClick={() => navigate(ROUTE_PATHS.CARDFLUX_EXPLORACAO_CONFIG)} sx={primaryButtonSx}>Nova exploração</Button>
                <Button variant="outlined" onClick={() => navigate(ROUTE_PATHS.CARDFLUX_EXPLORACOES)} sx={secondaryButtonSx}>Gerenciar explorações</Button>
                <Button variant="outlined" onClick={handleSalvarExploracao} sx={secondaryButtonSx}>Salvar agora</Button>
                <Button variant="outlined" onClick={() => navigate(ROUTE_PATHS.CARDFLUX)} sx={secondaryButtonSx}>Voltar ao CardFlux</Button>
              </Box>
            </Paper>

            <Paper
              sx={{
                ...panelSx,
                p: 2.5,
                background: 'rgba(15,18,24,0.96)',
                borderColor: 'rgba(196,58,47,0.2)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: { xs: '520px', md: '620px' },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>Grid</Typography>
                  <Tooltip title="Como utilizar o Grid de Exploração" arrow>
                    <IconButton
                      aria-label="Ajuda da Exploração"
                      onClick={() => setAjudaAberta(true)}
                      sx={{
                        width: 32,
                        height: 32,
                        border: '1px solid rgba(196, 58, 47, 0.35)',
                        background: 'rgba(196, 58, 47, 0.08)',
                        color: 'var(--color-accent)',
                        fontWeight: 900,
                        fontSize: '1rem',
                        '&:hover': {
                          background: 'rgba(196, 58, 47, 0.12)',
                          borderColor: 'rgba(196, 58, 47, 0.6)',
                        },
                      }}
                    >
                      ?
                    </IconButton>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Button type="button" onClick={handleZoomOut} aria-label="Zoom -" size="small" sx={{ minWidth: 40, borderRadius: 2 }}>-</Button>
                  <Button type="button" onClick={handleZoomIn} aria-label="Zoom +" size="small" sx={{ minWidth: 40, borderRadius: 2 }}>+</Button>
                  <Button type="button" onClick={handleAjustarTela} aria-label="Ajustar à tela" size="small" sx={{ borderRadius: 2, minHeight: 32 }}>
                    Ajustar à tela
                  </Button>
                  <Button type="button" onClick={abrirModalImagemFundo} aria-label="Configurar Fundo" size="small" sx={{ borderRadius: 2, minHeight: 32 }}>
                    Configurar Fundo
                  </Button>
                </Box>
              </Box>

              <Box
                ref={mapViewportRef}
                sx={{
                  position: 'relative',
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  height: '100%',
                  overflow: zoom > 1.05 ? 'auto' : 'hidden',
                  background: 'rgba(9,12,17,0.8)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 3,
                  p: 1.5,
                  display: 'block',
                }}
              >
                <Box
                  data-testid="exploracao-grid-stage"
                  data-grid-width={Math.max(1, Math.round(mapSurfaceSize.width))}
                  data-grid-height={Math.max(1, Math.round(mapSurfaceSize.height))}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minWidth: 0,
                    minHeight: 0,
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  {imagemFundoAtiva && (
                    <Box
                      component="img"
                      alt="Imagem de fundo da exploração"
                      src={imagemFundoAtiva.url}
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: imagemFundoAtiva.ajuste === 'contain' ? 'contain' : imagemFundoAtiva.ajuste === 'fill' ? '100% 100%' : 'cover',
                        objectPosition: 'center',
                        display: 'block',
                        borderRadius: 2,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${gridRows}, minmax(0, 1fr))`,
                      width: '100%',
                      height: '100%',
                      minWidth: 0,
                      minHeight: 0,
                      gap: 1,
                      alignItems: 'stretch',
                      justifyItems: 'stretch',
                    }}
                  >
                  {exploracao.quadrantes?.flat().map(quadrante => {
                    const selectedNow = selected.x === quadrante.x && selected.y === quadrante.y;
                    const visual = getQuadranteEstadoMeta(quadrante);
                    const estadoQuadrante = getEstadoQuadrante(quadrante).estado;
                    const marcadorAtual = getQuadranteMarcador(quadrante);
                    const isOcultoQuadrante = estadoQuadrante === 'oculto';
                    const marcadorManualPrincipal = !isOcultoQuadrante && Boolean(marcadorAtual);
                    const marcadorLabel = {
                      combate: 'Combate',
                      descoberta: 'Descoberta',
                      interacao: 'Interação',
                      perigo: 'Perigo',
                      objetivo: 'Objetivo',
                      ambiental: 'Ambiental',
                      acampamento: 'Acampamento',
                    }[marcadorAtual] || marcadorAtual || 'Marcador';
                    const categoriaMeta = marcadorAtual ? {
                      key: marcadorAtual,
                      src: TYPE_ICONS[marcadorAtual],
                      fallback: marcadorLabel.charAt(0).toUpperCase(),
                    } : null;
                    const principalMeta = getQuadrantePrincipalIconMeta(quadrante);
                    const principalIconSrc = principalMeta.src;
                    const principalFallback = principalMeta.fallback;
                    const principalAlt = principalMeta.alt;
                    const podeMostrarTipoBadge = Boolean(
                      quadrante?.cartaId &&
                      categoriaMeta &&
                      !marcadorManualPrincipal &&
                      !isOcultoQuadrante &&
                      ['revelado', 'em_andamento', 'resolvido'].includes(quadrante?.estado) &&
                      !quadrante?.bloqueado &&
                      quadrante?.estado !== 'vazio'
                    );
                    const cellTone = selectedNow
                      ? 'linear-gradient(135deg, rgba(89,171,255,0.18), rgba(15,23,42,0.8))'
                      : 'linear-gradient(135deg, rgba(15,23,42,0.72), rgba(15,23,42,0.88))';
                    const overlayColor = quadrante.bloqueado
                      ? 'rgba(15,23,42,0.78)'
                      : isOcultoQuadrante
                        ? 'rgba(2,6,23,0.74)'
                        : quadrante.resultado === 'sucesso'
                          ? 'rgba(16,185,129,0.18)'
                          : quadrante.resultado === 'falha'
                            ? 'rgba(239,68,68,0.18)'
                            : quadrante.resultado === 'pendente'
                              ? 'rgba(245,158,11,0.18)'
                              : quadrante.estado === 'revelado' || quadrante.estado === 'em_andamento'
                                ? 'rgba(15,23,42,0.2)'
                                : 'rgba(2,6,23,0.74)';

                    return (
                      <Button
                        key={`${quadrante.x}-${quadrante.y}`}
                        className="grid-cell-icon-slot"
                        variant={selectedNow ? 'contained' : 'outlined'}
                        onMouseDown={handleQuadranteMouseDown}
                        onTouchStart={handleQuadranteMouseDown}
                        onContextMenu={event => handleQuadranteContextMenu(event, quadrante)}
                        onClick={() => handleSelecionarQuadrante({ x: quadrante.x, y: quadrante.y })}
                        sx={{
                          position: 'relative',
                          minHeight: 0,
                          height: '100%',
                          minWidth: 0,
                          padding: 0,
                          background: 'transparent',
                          border: selectedNow
                            ? '1px solid rgba(89,171,255,0.88)'
                            : `1px solid ${visual.cellBorder}`,
                          borderRadius: 2.5,
                          color: visual.badgeColor,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          justifyContent: 'stretch',
                          fontSize: 'clamp(0.9rem, 1vw, 1.3rem)',
                          fontWeight: 800,
                          boxShadow: selectedNow ? '0 10px 24px rgba(89,171,255,0.14)' : '0 0 0 1px rgba(255,255,255,0.02)',
                          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                          overflow: 'hidden',
                          touchAction: 'manipulation',
                          userSelect: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          '&:hover': {
                            borderColor: selectedNow ? 'rgba(89,171,255,0.9)' : visual.badgeBorder,
                            boxShadow: selectedNow ? '0 12px 28px rgba(89,171,255,0.16)' : '0 6px 18px rgba(15,23,42,0.2)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: cellTone,
                            opacity: imagemFundoAtiva ? Number(imagemFundoAtiva.opacidadeQuadrantes ?? 20) / 100 : 0.96,
                            zIndex: 0,
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: overlayColor,
                            zIndex: 1,
                          }}
                        />
                        {quadrante.bloqueado && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: 'rgba(245,158,11,0.22)',
                              border: '1px solid rgba(245,158,11,0.45)',
                              fontSize: '0.68rem',
                              lineHeight: 1,
                              zIndex: 3,
                            }}
                          >
                            🔒
                          </Box>
                        )}
                        <Box
                          className="grid-cell-image-area"
                          sx={{
                            position: 'relative',
                            zIndex: 2,
                            display: 'flex',
                            flex: 1,
                            minHeight: 0,
                            width: '100%',
                            padding: '8px 8px 4px',
                            boxSizing: 'border-box',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {principalIconSrc && (
                            <Box
                              className="grid-cell-image-frame"
                              sx={{
                                width: '100%',
                                height: '100%',
                                maxWidth: '100%',
                                maxHeight: '100%',
                                pointerEvents: 'none',
                              }}
                            >
                              {buildIconElement({
                                src: principalIconSrc,
                                fallback: principalFallback,
                                alt: principalAlt,
                                size: '100%',
                                variant: 'cell-state',
                                sx: {
                                  filter: marcadorManualPrincipal
                                    ? 'drop-shadow(0 0 18px rgba(96,165,250,0.35))'
                                    : 'drop-shadow(0 0 18px rgba(89,171,255,0.42))',
                                  objectFit: 'contain',
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                },
                                boxSx: { width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' },
                              })}
                            </Box>
                          )}
                          {podeMostrarTipoBadge && (
                            <Box
                              sx={{
                                position: 'absolute',
                                right: 7,
                                top: 7,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 'clamp(24px, 18%, 32px)',
                                height: 'clamp(24px, 18%, 32px)',
                                borderRadius: 999,
                                background: 'rgba(15,23,42,0.72)',
                                border: '1px solid rgba(148,163,184,0.26)',
                                backdropFilter: 'blur(4px)',
                                zIndex: 3,
                                boxShadow: '0 8px 18px rgba(2,6,23,0.18)',
                              }}
                            >
                              {buildIconElement({
                                src: categoriaMeta.src,
                                fallback: categoriaMeta.fallback,
                                alt: categoriaMeta.key,
                                size: '100%',
                                variant: 'cell-category',
                                boxSx: { width: '100%', height: '100%' },
                              })}
                            </Box>
                          )}
                        </Box>
                        <Box
                          className="grid-cell-coordinates"
                          sx={{
                            position: 'relative',
                            zIndex: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '22px',
                            px: 0.75,
                            pb: 0.5,
                            pt: 0.25,
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="caption" sx={{ color: 'rgba(248,250,252,0.88)', letterSpacing: '0.08em', opacity: 0.9, lineHeight: 1.2 }}>
                            {quadrante.x},{quadrante.y}
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            <GridLegend groups={gridLegendGroups} />

            <CardFluxGridContextMenu
              open={contextMenu.open}
              anchorPoint={{ x: contextMenu.x, y: contextMenu.y }}
              options={gridLegendGroups.find(g => String(g.title).toUpperCase().includes('TIPO'))?.items || []}
              selectedValue={getQuadranteMarcador(contextMenu.quadrante)}
              onSelect={handleMarcarQuadrante}
              onClose={closeContextMenu}
            />
            </Paper>

            <Paper sx={{ ...panelSx, p: 2.5, background: 'rgba(15,18,24,0.96)', borderColor: 'rgba(196,58,47,0.2)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                <Typography variant="overline" sx={{ color: 'var(--color-accent)', letterSpacing: '0.12em', fontWeight: 800 }}>
                  Quadrante selecionado
                </Typography>
              </Box>

              {quadranteAtual ? (
                <Box sx={{ display: 'grid', gap: 2, mt: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coordenadas</Typography>
                    <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 800 }}>{selected.x},{selected.y}</Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: 1,
                      p: 1.5,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1,
                        minHeight: 36,
                      }}
                    >
                      {getQuadranteBadges(quadranteAtual).map((badge, index) => (
                        <QuadranteBadge
                          key={`${badge.label}-${index}`}
                          icon={badge.icon}
                          label={badge.label}
                          background={badge.badgeBackground}
                          border={badge.badgeBorder}
                          color={badge.badgeColor}
                          sx={{
                            transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
                            '@media (prefers-reduced-motion: reduce)': {
                              transition: 'none',
                            },
                          }}
                        />
                      ))}
                      {getQuadranteBadges(quadranteAtual).length === 0 && (
                        <QuadranteBadge
                          icon={STATE_META.oculto.icon}
                          label={quadranteStatusLabel || STATE_META.oculto.label}
                          background={STATE_META.oculto.badgeBackground}
                          border={STATE_META.oculto.badgeBorder}
                          color={STATE_META.oculto.badgeColor}
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Carta vinculada</Typography>
                    <Typography sx={{ mt: 0.5, color: 'var(--text-primary)', fontWeight: 800 }}>{cartaAtual?.nome || 'Sem carta atribuída'}</Typography>
                  </Box>

                  {cartaAtual && (
                    <Tooltip title="Abre os detalhes completos da carta vinculada." arrow>
                      <span>
                        <Button variant="outlined" onClick={() => setCartaVisualizada(cartaAtual)} sx={secondaryButtonSx}>
                          Abrir carta
                        </Button>
                      </span>
                    </Tooltip>
                  )}

                  <Box sx={{ display: 'grid', gap: 1.25 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 800 }}>
                      Anotações e resultado
                    </Typography>

                    <TextField
                      multiline
                      minRows={4}
                      label="Anotações"
                      value={anotacao}
                      onChange={event => setAnotacao(event.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          background: 'rgba(8,11,17,0.72)',
                          color: 'var(--text-primary)',
                          '& fieldset': { borderColor: 'var(--border-primary)' },
                          '&:hover fieldset': { borderColor: 'var(--border-hover)' },
                        },
                      }}
                    />

                    <FormControl fullWidth>
                      <InputLabel id="resultado-label">Resultado</InputLabel>
                      <Select
                        labelId="resultado-label"
                        label="Resultado"
                        value={resultadoSelecionado}
                        onChange={event => setResultadoSelecionado(event.target.value)}
                      >
                        <MenuItem value="sucesso">Sucesso</MenuItem>
                        <MenuItem value="falha">Falha</MenuItem>
                        <MenuItem value="pendente">Pendente</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 1.2 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 800 }}>
                      Ações do quadrante
                    </Typography>

                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <Tooltip title="Marca o quadrante como descoberto para a sessão atual." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="contained"
                            onClick={handleRevelar}
                            disabled={savingAction === 'revelar'}
                            sx={{ ...primaryButtonSx, width: '100%' }}
                          >
                            {savingAction === 'revelar' ? 'Revelando...' : 'Revelar'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Volta o quadrante ao estado oculto sem apagar a anotação ou a carta vinculada." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="outlined"
                            onClick={handleOcultar}
                            disabled={savingAction === 'ocultar'}
                            sx={{ ...secondaryButtonSx, width: '100%' }}
                          >
                            {savingAction === 'ocultar' ? 'Ocultando...' : 'Ocultar'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Salva o resultado escolhido para o quadrante e marca a ocorrência como resolvida." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="contained"
                            onClick={() => handleResultado(resultadoSelecionado)}
                            disabled={savingAction === 'resultado'}
                            sx={{ ...primaryButtonSx, width: '100%' }}
                          >
                            {savingAction === 'resultado' ? 'Salvando...' : 'Registrar resultado'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Persiste a anotação privada do mestre para este quadrante." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="outlined"
                            onClick={handleSalvarAnotacao}
                            disabled={savingAction === 'anotacao'}
                            sx={{ ...secondaryButtonSx, width: '100%' }}
                          >
                            {savingAction === 'anotacao' ? 'Salvando...' : 'Salvar anotação'}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Bloqueia ou desbloqueia a interação do quadrante sem remover o conteúdo dele." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="outlined"
                            onClick={handleBloquear}
                            disabled={savingAction === 'bloquear'}
                            sx={{ ...secondaryButtonSx, width: '100%' }}
                          >
                            {savingAction === 'bloquear'
                              ? (quadranteAtual?.bloqueado ? 'Desbloqueando...' : 'Bloqueando...')
                              : (quadranteAtual?.bloqueado ? 'Desbloquear' : 'Bloquear')}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gap: 1.2, mt: 0.5 }}>
                    <Typography variant="overline" sx={{ color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 800 }}>
                      Gerenciar carta
                    </Typography>

                    <TextField
                      label="Buscar carta"
                      value={cartaManualBusca}
                      onChange={event => setCartaManualBusca(event.target.value)}
                      placeholder="Nome, tipo ou baralho"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          background: 'rgba(8,11,17,0.72)',
                          color: 'var(--text-primary)',
                          '& fieldset': { borderColor: 'var(--border-primary)' },
                          '&:hover fieldset': { borderColor: 'var(--border-hover)' },
                        },
                      }}
                    />

                    {cartasRelacionadas.length > 0 && (
                      <FormControl fullWidth>
                        <InputLabel id="carta-manual-label">Carta selecionada</InputLabel>
                        <Select
                          labelId="carta-manual-label"
                          label="Carta selecionada"
                          value={cartaManualId || ''}
                          onChange={event => setCartaManualId(event.target.value || '')}
                        >
                          <MenuItem value="">Sem carta</MenuItem>
                          {cartasFiltradas.map(carta => (
                            <MenuItem key={carta.id} value={carta.id}>
                              {carta.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}

                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <Tooltip title="Selecione uma carta para atribuir manualmente a esta posição." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="contained"
                            onClick={handleAdicionarCarta}
                            disabled={!cartaManualId || savingAction === 'substituir'}
                            sx={{ ...primaryButtonSx, width: '100%' }}
                          >
                            {savingAction === 'substituir'
                              ? 'Salvando...'
                              : (quadranteAtual?.cartaId ? 'Substituir carta' : 'Adicionar carta')}
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove a carta vinculada sem excluir a original." arrow>
                        <span style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setConfirmarRemocaoOpen(true)}
                            disabled={!quadranteAtual?.cartaId || savingAction === 'remover'}
                            sx={{ ...dangerButtonSx, width: '100%' }}
                          >
                            {savingAction === 'remover' ? 'Removendo...' : 'Remover carta'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </Paper>
          </Box>
        </Box>
      </Paper>

      <CardFluxMapaSelectorModal
        open={imagemFundoModalAberta}
        onClose={() => setImagemFundoModalAberta(false)}
        onSave={salvarImagemFundo}
        onRemoveImage={removerImagemFundo}
        onSelectMap={handleSelecionarMapaFundo}
        draft={imagemFundoDraft}
        mapasDisponiveis={mapasDisponiveis}
        pastasDisponiveis={pastasDisponiveis}
        loadingMapas={loadingMapas}
        loadingPastas={loadingPastas}
      />

      <Dialog
        open={ajudaAberta}
        onClose={() => setAjudaAberta(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        aria-labelledby="cardflux-guia-titulo"
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(180deg, rgba(20,24,30,0.98), rgba(12,15,20,0.98))',
              border: '1px solid rgba(196,58,47,0.28)',
              borderRadius: 3,
              color: 'var(--text-primary)',
            },
          },
        }}
      >
        <DialogTitle id="cardflux-guia-titulo" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, color: 'var(--text-primary)', fontWeight: 800 }}>
          <Box>
            <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              Ajuda da Exploração
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mt: 0.5 }}>
              Entenda o grid, os estados dos quadrantes e os controles do mestre durante a sessão.
            </Typography>
          </Box>
          <IconButton
            aria-label="Fechar ajuda"
            onClick={() => setAjudaAberta(false)}
            size="small"
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': { background: 'rgba(196,58,47,0.10)', color: 'var(--text-primary)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ background: 'rgba(8,11,17,0.4)' }}>
          <Accordion defaultExpanded sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>1. O que é o Grid de Exploração?</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O Grid de Exploração é uma ferramenta narrativa do CardFlux para organizar acontecimentos em uma matriz de quadrantes.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Cada quadrante representa uma região do ambiente explorado pelos personagens, como uma sala, uma trilha, um setor da cidade ou qualquer ponto do cenário.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O mestre controla a exploração escolhendo os quadrantes que os jogadores alcançaram e decidindo como cada ponto do mapa será revelado, acessado ou resolvido.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                O sistema não move personagens automaticamente e não substitui a regra de movimentação do RPG. Ele organiza o contexto narrativo e o controle dos acontecimentos.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>2. Como utilizar o mapa?</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="ol" sx={{ pl: 2.5, mb: 0 }}>
                <li>Observe a matriz no centro da tela.</li>
                <li>Clique no quadrante que deseja administrar.</li>
                <li>Consulte as informações no painel direito.</li>
                <li>Use Revelar quando os personagens explorarem aquele local.</li>
                <li>Abra a carta vinculada, caso exista.</li>
                <li>Conduza o acontecimento com as regras da sessão.</li>
                <li>Registre anotações e o resultado.</li>
                <li>Marque o acontecimento como resolvido quando a conclusão for registrada.</li>
                <li>Continue a exploração normalmente.</li>
              </Typography>
              <Typography component="p" sx={{ mt: 1.5, mb: 0 }}>
                Selecionar um quadrante não o revela automaticamente. Essa decisão fica com o mestre.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>3. Estados dos quadrantes</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Oculto:</strong> ainda não foi explorado narrativamente. Pode possuir uma carta atribuída, dependendo da distribuição utilizada.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Revelado:</strong> já foi descoberto pelos personagens. Se houver carta vinculada, o mestre pode abri-la e usá-la.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Em andamento:</strong> este estado só deve ser usado quando existir na implementação real. Caso não esteja ativo, ele não será criado nesta tarefa.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Resolvido:</strong> o acontecimento foi concluído e teve desfecho registrado, podendo ser sucesso, falha ou outra conclusão permitida.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Vazio:</strong> o quadrante não possui acontecimento a ser executado e pode representar uma área tranquila ou sem carta sorteada.</Typography>
              <Typography component="p" sx={{ mb: 0 }}><strong>Bloqueado:</strong> indica uma restrição de interação. Bloqueio é uma propriedade adicional e não substitui necessariamente o estado da exploração.</Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>4. O que significam as cores e os ícones?</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Os indicadores visuais usados no grid refletem os estados efetivamente implementados: oculta em tom escuro, revelado em tom âmbar, resolvido em tom verde, vazio em neutro e bloqueado com ícone de cadeado.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                O quadrante selecionado recebe destaque próprio para identificar o painel de administração atual. Não foram criados novos padrões de cor fora do que já está implementado.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>5. Painel esquerdo</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Campanha:</strong> identifica a campanha associada.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Universo:</strong> identifica o universo das cartas.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Baralhos:</strong> lista os baralhos ativos.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Dimensão:</strong> informa linhas e colunas da matriz.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Progresso:</strong> indica a porcentagem de quadrantes explorados conforme o cálculo atual do motor.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Acontecimentos:</strong> mostra a quantidade de quadrantes com conteúdo vinculado ou resolvido de acordo com a implementação atual.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Status:</strong> indica se a exploração está ativa ou encerrada.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Nova Exploração:</strong> abre a configuração de um novo Grid.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Gerenciar Explorações:</strong> permite consultar e continuar explorações salvas.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Salvar Agora:</strong> executa o salvamento atual da exploração.</Typography>
              <Typography component="p" sx={{ mb: 0 }}><strong>Voltar ao CardFlux:</strong> retorna ao módulo principal.</Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>6. Painel direito</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Coordenadas:</strong> indicam a posição do quadrante selecionado.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Estado:</strong> mostra a situação atual do quadrante.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Carta vinculada:</strong> mostra a carta associada àquela posição. Quando não houver carta, a interface usa Sem carta atribuída.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Abrir Carta:</strong> abre o visualizador completo da carta do CardFlux.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Anotações:</strong> permitem registrar observações privadas do mestre, como lembretes da sessão.</Typography>
              <Typography component="p" sx={{ mb: 0 }}><strong>Resultado:</strong> define o desfecho do acontecimento conforme as opções disponíveis.</Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>7. Ações do quadrante</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Revelar:</strong> marca o quadrante como descoberto e pode ativar a lógica do acontecimento conforme o modo de distribuição.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Ocultar:</strong> retorna o quadrante ao estado oculto preservando dados existentes.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Registrar Resultado:</strong> salva o desfecho selecionado. O efeito de marcar o quadrante como resolvido depende da implementação real do motor.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Salvar Anotação:</strong> persiste o texto digitado para o quadrante selecionado.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Bloquear / Desbloquear:</strong> adiciona ou remove a restrição de interação do quadrante.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Adicionar Carta:</strong> permite atribuir manualmente uma carta disponível a um quadrante sem carta.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Substituir Carta:</strong> troca a carta atribuída por outra.</Typography>
              <Typography component="p" sx={{ mb: 0 }}><strong>Remover Carta:</strong> desvincula a carta do quadrante sem excluir a original no banco de dados.</Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>8. Atribuição manual de cartas</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O mestre pode decidir que determinado acontecimento deve ocorrer em um lugar específico. Exemplo: ele seleciona o quadrante (2,3) e atribui a carta “A Chuva de Mana”.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                A carta passa a ficar vinculada àquela casa e pode ser revelada quando os jogadores alcançarem o local. A atribuição manual não exclui a carta original, apenas liga a instância ao quadrante.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>9. Salvamento e continuidade</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                As explorações possuem registros independentes no Firestore. O mestre pode continuar a sessão em outro momento sem gerar um novo mapa.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Salvar Exploração:</strong> confirma o salvamento com a implementação atual.</Typography>
              <Typography component="p" sx={{ mb: 1.5 }}><strong>Explorações:</strong> abre o gerenciador de registros salvos.</Typography>
              <Typography component="p" sx={{ mb: 0 }}><strong>Voltar:</strong> retorna à navegação relevante. O gerenciador pode oferecer continuar, renomear, duplicar, encerrar ou excluir explorações conforme as funcionalidades existentes.</Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>10. Exemplo prático</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Imagine uma exploração em uma floresta. O mestre cria um grid 6×6 e, ao avançar com os jogadores, seleciona o quadrante (1,2). Em seguida usa Revelar e observa a carta vinculada, se houver.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Depois da ação, o mestre registra uma anotação: “Os jogadores identificaram pegadas próximas ao riacho”, e define o resultado do acontecimento conforme o desfecho da cena.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                O sistema salva esse contexto para a próxima sessão, mantendo o progresso da exploração sem reiniciar o mapa.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAjudaAberta(false)} sx={{ ...secondaryButtonSx, minWidth: 110 }}>
            Entendi
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
          severity={feedback.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={confirmarRemocaoOpen}
        onClose={() => setConfirmarRemocaoOpen(false)}
        aria-labelledby="cardflux-remocao-carta-title"
      >
        <DialogTitle id="cardflux-remocao-carta-title" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          Confirmar remoção
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
            A carta vinculada a este quadrante será removida. Essa ação não apaga o registro da carta no baralho, apenas desvincula este local da exploração.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid var(--border-primary)' }}>
          <Button onClick={() => setConfirmarRemocaoOpen(false)} variant="text" sx={{ color: 'var(--text-secondary)' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleRemoverCarta} sx={primaryButtonSx}>
            Confirmar remoção
          </Button>
        </DialogActions>
      </Dialog>

      {cartaVisualizada && (
        <CartaDetalheDialog
          open={Boolean(cartaVisualizada)}
          onClose={() => setCartaVisualizada(null)}
          carta={cartaVisualizada}
        />
      )}
    </Box>
  );
};

export default CardFluxExploracaoPage;
