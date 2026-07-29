import React from 'react';
import PropTypes from 'prop-types';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CenaForm from './CenaForm';
import { CENA_INITIAL_VALUES } from './cenaUtils';

const CenaDetailPanel = ({ cena, podeEscrever, onClose, onSave, onDelete }) => {
  const aberto = Boolean(cena);

  const handleSubmit = async (values, formikHelpers) => {
    await onSave(cena.id, values);
    formikHelpers.setSubmitting(false);
  };

  return (
    <Drawer
      anchor="right"
      open={aberto}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 480 },
            background: 'var(--bg-primary)',
            p: 3,
          },
        },
      }}
    >
      {aberto && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
            >
              {cena.titulo || 'Cena'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {podeEscrever && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(cena.id)}
                  sx={{ color: '#ef4444' }}
                  aria-label={`Remover cena ${cena.titulo}`}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: 'var(--text-secondary)' }}
                aria-label="Fechar painel da cena"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {podeEscrever ? (
            <CenaForm
              key={cena.id}
              initialValues={{ ...CENA_INITIAL_VALUES, ...cena }}
              onSubmit={handleSubmit}
              onCancelar={onClose}
              labelSalvar="Salvar Alterações"
              idPrefix={`cena-painel-${cena.id}`}
              campanhaId={cena.campanhaId}
            />
          ) : (
            <Button
              variant="outlined"
              onClick={onClose}
              sx={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            >
              Fechar
            </Button>
          )}
        </>
      )}
    </Drawer>
  );
};

CenaDetailPanel.propTypes = {
  cena: PropTypes.shape({
    id: PropTypes.string,
    titulo: PropTypes.string,
    campanhaId: PropTypes.string,
  }),
  podeEscrever: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

CenaDetailPanel.defaultProps = {
  cena: null,
};

export default CenaDetailPanel;
