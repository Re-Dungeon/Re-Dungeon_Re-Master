import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ESTADO_CENA_OPCOES } from './cenaUtils';

const CenaNode = ({ data, selected = false }) => {
  const { cena, cor } = data;
  const estado = ESTADO_CENA_OPCOES.find(o => o.value === cena.estado);
  const concluido = cena.estado === 'concluido';

  return (
    <Box
      sx={{
        width: 220,
        p: 1.5,
        borderRadius: 2,
        background: 'var(--bg-card)',
        border: `2px solid ${selected ? 'var(--color-accent)' : cor}`,
        boxShadow: selected ? '0 0 0 2px var(--color-accent)' : 'none',
      }}
    >
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Top} id="top" />
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        {cena.linkImagem && (
          <Box
            component="img"
            src={cena.linkImagem}
            alt=""
            loading="lazy"
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              objectFit: 'cover',
              flexShrink: 0,
            }}
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={cena.titulo}
          >
            {`${concluido ? '✓ ' : ''}${cena.titulo || '(sem título ainda)'}`}
          </Typography>
          {estado && (
            <Typography
              variant="caption"
              sx={{ color: cor, fontWeight: 600, display: 'block' }}
            >
              {estado.label}
            </Typography>
          )}
        </Box>
      </Box>
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
    </Box>
  );
};

CenaNode.propTypes = {
  data: PropTypes.shape({
    cena: PropTypes.shape({
      titulo: PropTypes.string,
      estado: PropTypes.string,
      linkImagem: PropTypes.string,
    }).isRequired,
    cor: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
};

export default memo(CenaNode);
