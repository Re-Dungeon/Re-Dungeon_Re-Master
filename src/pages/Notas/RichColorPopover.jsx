import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const HEX_PATTERN = /^#[0-9A-F]{6}$/i;

const familyTitle = (title, families, onSelectColor) => (
  <Box key={title} sx={{ mb: 0.75 }}>
    <Typography
      sx={{ mb: 0.35, fontSize: '0.68rem', color: 'var(--text-secondary)' }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 28px)',
        gap: '5px',
      }}
    >
      {families.map(color => (
        <Tooltip key={color} title={color} placement="top">
          <Box
            component="button"
            type="button"
            aria-label={`Aplicar cor ${color}`}
            onPointerDown={event => event.preventDefault()}
            onClick={() => onSelectColor(color)}
            sx={{
              width: 28,
              height: 28,
              p: 0,
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '6px',
              backgroundColor: color,
              cursor: 'pointer',
              '&:hover': { borderColor: '#fff', filter: 'brightness(1.08)' },
              '&:focus-visible': {
                outline: '2px solid #fff',
                outlineOffset: 1,
              },
            }}
          />
        </Tooltip>
      ))}
    </Box>
  </Box>
);

const RichColorPopover = ({
  anchorEl,
  open,
  onClose,
  onSelectColor,
  families,
  title,
  allowRemove = false,
  onRemove,
}) => {
  const [customColor, setCustomColor] = useState('#E63946');
  const isValid = HEX_PATTERN.test(customColor);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            p: 1,
            mt: 0.75,
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(10,13,22,0.98)',
          },
        },
      }}
    >
      <Box onPointerDown={event => event.stopPropagation()}>
        <Typography sx={{ mb: 1, fontWeight: 800, fontSize: '0.78rem' }}>
          {title}
        </Typography>
        {families.map(group =>
          familyTitle(group.title, group.colors, onSelectColor),
        )}
        <Box
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            pt: 0.75,
            mt: 0.5,
          }}
        >
          <Typography
            sx={{
              mb: 0.75,
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
            }}
          >
            Cor personalizada
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <input
              aria-label="Selecionar cor personalizada"
              type="color"
              value={isValid ? customColor : '#E63946'}
              onPointerDown={event => event.preventDefault()}
              onChange={event =>
                setCustomColor(event.target.value.toUpperCase())
              }
              style={{
                width: 42,
                height: 42,
                border: 0,
                padding: 2,
                cursor: 'pointer',
              }}
            />
            <TextField
              size="small"
              label="HEX"
              value={customColor}
              onChange={event =>
                setCustomColor(event.target.value.toUpperCase())
              }
              error={!isValid}
              sx={{ flex: 1 }}
            />
            <Box
              aria-label="Pré-visualização da cor"
              sx={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.16)',
                backgroundColor: isValid ? customColor : 'transparent',
              }}
            />
          </Box>
          <Button
            fullWidth
            variant="contained"
            disabled={!isValid}
            onPointerDown={event => event.preventDefault()}
            onClick={() => onSelectColor(customColor)}
            sx={{ mt: 1, textTransform: 'none' }}
          >
            Aplicar cor personalizada
          </Button>
          {allowRemove && (
            <Button
              fullWidth
              onPointerDown={event => event.preventDefault()}
              onClick={onRemove}
              sx={{
                mt: 0.5,
                textTransform: 'none',
                color: 'var(--text-secondary)',
              }}
            >
              Remover realce
            </Button>
          )}
        </Box>
      </Box>
    </Popover>
  );
};

RichColorPopover.propTypes = {
  anchorEl: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectColor: PropTypes.func.isRequired,
  families: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  title: PropTypes.string.isRequired,
  allowRemove: PropTypes.bool,
  onRemove: PropTypes.func,
};

export default RichColorPopover;
