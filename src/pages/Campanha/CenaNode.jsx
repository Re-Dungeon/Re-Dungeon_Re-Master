import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ESTADO_CENA_OPCOES, HANDLE_SIDE_COLORS } from './cenaUtils';

const STATUS_SYMBOLS = {
  nao_iniciado: '○',
  em_andamento: '●',
  concluido: '✓',
  ignorado: '•',
  cancelado: '✕',
};

const defaultHandleStyle = {
  width: 16,
  height: 16,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.08)',
  boxShadow: '0 0 0 1px rgba(255,255,255,0.08)',
  transition: 'all 180ms ease',
  cursor: 'pointer',
  zIndex: 10,
};

const handleSideStyle = side => ({
  background: `${HANDLE_SIDE_COLORS[side]}22`,
  borderColor: HANDLE_SIDE_COLORS[side],
  boxShadow: `0 0 0 4px ${HANDLE_SIDE_COLORS[side]}22`,
});

const CenaNode = ({ data, selected = false }) => {
  const { cena } = data;

  const estado = useMemo(
    () => ESTADO_CENA_OPCOES.find(o => o.value === cena.estado),
    [cena.estado],
  );

  const statusSymbol = STATUS_SYMBOLS[cena.estado] ?? '●';
  const statusColor = estado?.cor ?? '#9CA3AF';
  const title = cena.titulo || '(sem título ainda)';
  const imageUrl = cena.linkImagem?.trim();
  const hasImage = Boolean(imageUrl);


  // Todo handle é "source": com connectionMode="loose" (CenaFlowCanvas) isso
  // faz a conexão sempre respeitar de onde o mestre arrastou (origem) para
  // onde soltou (destino), em vez de forçar a direção pelo lado do node.
  const renderHandle = (id, position) => (
    <Handle
      type="source"
      position={position}
      id={id}
      isConnectable
      style={{
        ...defaultHandleStyle,
        ...handleSideStyle(id),
      }}
    />
  );

  return (
    <Box
      sx={{
        width: 180,
        minHeight: 100,
        borderRadius: 8,
        overflow: 'visible',
        background: hasImage
          ? `linear-gradient(180deg, rgba(6,10,18,0.2), rgba(6,10,18,0.75)), url(${imageUrl})`
          : 'rgba(12, 16, 24, 0.98)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        border: selected
          ? '1px solid rgba(196, 58, 47, 0.9)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: selected
          ? '0 0 0 6px rgba(196, 58, 47, 0.12), 0 28px 58px rgba(0,0,0,0.28)'
          : '0 20px 40px rgba(0,0,0,0.22)',
        transition: 'transform 220ms ease, box-shadow 220ms ease, border 220ms ease',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 28px 62px rgba(0,0,0,0.28)',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: hasImage ? 'transparent' : 'rgba(30, 34, 45, 0.96)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(9, 12, 19, 0.06), rgba(9, 12, 19, 0.88) 52%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at top center, rgba(255,255,255,0.08), transparent 28%)',
            mixBlendMode: 'screen',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1.5,
            textAlign: 'center',
            color: 'var(--text-primary)',
          }}
        >
          <Box sx={{ width: '100%' }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.01em',
                textShadow: '0 8px 24px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
                width: '100%',
              }}
              title={title}
            >
              {title}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 8,
          transform: 'translateX(-50%)',
          px: 0.9,
          py: 0.4,
          borderRadius: '999px',
          minWidth: 94,
          background: 'rgba(5, 9, 16, 0.88)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          zIndex: 5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: statusColor,
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.08em',
          }}
        >
          {statusSymbol}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {estado?.label || 'Sem status'}
        </Typography>
      </Box>
      {renderHandle('left', Position.Left)}
      {renderHandle('top', Position.Top)}
      {renderHandle('right', Position.Right)}
      {renderHandle('bottom', Position.Bottom)}
    </Box>
  );
};

CenaNode.propTypes = {
  data: PropTypes.shape({
    cena: PropTypes.shape({
      id: PropTypes.string.isRequired,
      titulo: PropTypes.string,
      estado: PropTypes.string,
      linkImagem: PropTypes.string,
    }).isRequired,
  }).isRequired,
  selected: PropTypes.bool,
};

export default memo(CenaNode);
