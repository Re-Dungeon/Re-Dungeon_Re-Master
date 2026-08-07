import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarBorder';
import CenaForm from './CenaForm';
import { CENA_INITIAL_VALUES } from './cenaUtils';

const CenaDetailPanel = ({
  cena = null,
  podeEscrever,
  ehCenaAtual = false,
  onClose,
  onSave,
  onDelete,
  onMarcarCenaAtual = () => {},
}) => {
  const aberto = Boolean(cena);

  const handleSubmit = async (values, formikHelpers) => {
    await onSave(cena.id, values);
    formikHelpers.setSubmitting(false);
  };

  return (
    <Modal
      open={aberto}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            bgcolor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          },
        },
      }}
      aria-labelledby="cena-modal-title"
      aria-describedby="cena-modal-description"
    >
      <Fade in={aberto} timeout={280}>
        <Box
          sx={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: 'calc(100% - 48px)', md: 1100 },
            maxWidth: 1300,
            maxHeight: '90vh',
            bgcolor: 'rgba(6,10,18,0.92)',
            borderRadius: '18px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            p: 3,
            outline: 'none',
            display: 'flex',
            flexDirection: 'column',
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
                  position: 'sticky',
                  top: 0,
                  zIndex: 6,
                  backdropFilter: 'blur(6px)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    id="cena-modal-title"
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 800 }}
                  >
                    {cena.titulo || 'Cena'}
                  </Typography>
                  <Typography sx={{ color: 'var(--text-secondary)' }}>
                    {cena?.campanhaNome}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box>
                    {ehCenaAtual ? (
                      <Chip
                        icon={<StarIcon sx={{ color: 'var(--bg-primary) !important' }} fontSize="small" />}
                        label="Cena Atual"
                        size="small"
                        sx={{
                          background: 'var(--color-accent)',
                          color: 'var(--bg-primary)',
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      podeEscrever && (
                        <Button
                          size="small"
                          startIcon={<StarOutlineIcon fontSize="small" />}
                          onClick={() => onMarcarCenaAtual(cena.id)}
                          sx={{ color: 'var(--color-accent)' }}
                        >
                          Marcar como Cena Atual
                        </Button>
                      )
                    )}
                  </Box>

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
                    aria-label="Fechar modal da cena"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
                {podeEscrever ? (
                  <CenaForm
                    key={cena.id}
                    initialValues={{ ...CENA_INITIAL_VALUES, ...cena }}
                    onSubmit={handleSubmit}
                    onCancelar={onClose}
                    labelSalvar="Salvar Alterações"
                    idPrefix={`cena-painel-${cena.id}`}
                    campanhaId={cena.campanhaId}
                    universoId={cena.universoId}
                    mestreId={cena.mestreId}
                  />
                ) : (
                  <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                      color: 'var(--color-accent)',
                      borderColor: 'var(--color-accent)',
                    }}
                  >
                    Fechar
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

CenaDetailPanel.propTypes = {
  cena: PropTypes.shape({
    id: PropTypes.string,
    titulo: PropTypes.string,
    campanhaId: PropTypes.string,
    universoId: PropTypes.string,
    mestreId: PropTypes.string,
  }),
  podeEscrever: PropTypes.bool.isRequired,
  ehCenaAtual: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMarcarCenaAtual: PropTypes.func,
};

export default CenaDetailPanel;
