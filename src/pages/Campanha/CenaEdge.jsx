import React from 'react';
import PropTypes from 'prop-types';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const CenaEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: 'rgba(196, 58, 47, 0.92)',
          strokeWidth: 2.8,
          filter: 'drop-shadow(0 0 18px rgba(196, 58, 47, 0.12))',
        }}
        markerEnd={markerEnd}
        label={label}
      />
      {data?.podeEscrever && (
        <EdgeLabelRenderer>
          <IconButton
            size="small"
            onClick={event => {
              event.stopPropagation();
              data.onDelete(id);
            }}
            sx={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              width: 24,
              height: 24,
              minWidth: 24,
              background: 'rgba(17, 21, 32, 0.94)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#ef4444',
              boxShadow: '0 12px 28px rgba(0,0,0,0.24)',
              '&:hover': {
                background: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(239,68,68,0.45)',
              },
            }}
            aria-label="Remover conexão entre cenas"
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

CenaEdge.propTypes = {
  id: PropTypes.string.isRequired,
  sourceX: PropTypes.number.isRequired,
  sourceY: PropTypes.number.isRequired,
  targetX: PropTypes.number.isRequired,
  targetY: PropTypes.number.isRequired,
  sourcePosition: PropTypes.string.isRequired,
  targetPosition: PropTypes.string.isRequired,
  style: PropTypes.object,
  markerEnd: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  label: PropTypes.string,
  data: PropTypes.shape({
    podeEscrever: PropTypes.bool,
    onDelete: PropTypes.func,
  }),
};

CenaEdge.defaultProps = {
  style: undefined,
  markerEnd: undefined,
  label: undefined,
  data: undefined,
};

export default CenaEdge;
