import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { descricaoSchema, nomeSchema, urlImagemSchema } from 'common/utils/yupSchemas';

const PASTA_SCHEMA = Yup.object({
  nome: nomeSchema,
  descricao: descricaoSchema,
  imagemCapa: urlImagemSchema,
});

const buildInitialValues = initialValues => ({
  nome: '',
  descricao: '',
  imagemCapa: '',
  ...(initialValues || {}),
});

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    background: 'rgba(9, 12, 16, 0.36)',
    borderRadius: 1.5,
    '& fieldset': {
      borderColor: 'var(--border-primary)',
      borderWidth: '1px',
    },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 3px rgba(196, 58, 47, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    fontSize: '0.95rem',
    paddingTop: '14px',
    paddingBottom: '14px',
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
  '& .MuiFormHelperText-root': { color: '#ef4444' },
};

const MapaPastaFormDialog = ({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  submitLabel,
  title,
}) => {
  const initialFormValues = useMemo(
    () => buildInitialValues(initialValues),
    [initialValues],
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="mapa-pasta-form-dialog-title"
      slotProps={{
        paper: {
          sx: {
            background: 'linear-gradient(180deg, rgba(19, 23, 30, 0.98), rgba(10, 12, 17, 0.99))',
            border: '1px solid var(--border-primary)',
            borderRadius: 3,
            boxShadow: '0 20px 48px rgba(0,0,0,0.38)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <Formik
        enableReinitialize
        initialValues={initialFormValues}
        validationSchema={PASTA_SCHEMA}
        onSubmit={onSubmit}
      >
        {({ values, errors, touched, isSubmitting, handleChange, handleBlur }) => (
          <Form>
            <DialogTitle
              id="mapa-pasta-form-dialog-title"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                color: 'var(--text-primary)',
                py: 2,
                px: 3,
                borderBottom: '1px solid var(--border-primary)',
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderOutlinedIcon sx={{ color: 'var(--color-accent)', fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 800 }}>
                {title || (mode === 'edit' ? 'Editar Pasta' : 'Nova Pasta')}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
              <Box sx={{ display: 'grid', gap: 2.5 }}>
                <TextField
                  id="nome-pasta"
                  name="nome"
                  label="Nome da pasta"
                  value={values.nome || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  sx={fieldSx}
                  error={Boolean(touched.nome && errors.nome)}
                  helperText={touched.nome && errors.nome ? errors.nome : ''}
                />

                <TextField
                  id="descricao-pasta"
                  name="descricao"
                  label="Descrição"
                  value={values.descricao || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  multiline
                  minRows={4}
                  sx={fieldSx}
                  error={Boolean(touched.descricao && errors.descricao)}
                  helperText={
                    touched.descricao && errors.descricao ? errors.descricao : ''
                  }
                />

                <TextField
                  id="imagem-capa-pasta"
                  name="imagemCapa"
                  label="URL da capa"
                  value={values.imagemCapa || ''}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  fullWidth
                  placeholder="https://..."
                  sx={fieldSx}
                  error={Boolean(touched.imagemCapa && errors.imagemCapa)}
                  helperText={
                    touched.imagemCapa && errors.imagemCapa
                      ? errors.imagemCapa
                      : 'Opcional. Quando vazia, a pasta usa a primeira imagem do mapa.'
                  }
                />
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid var(--border-primary)' }}>
              <Button onClick={onClose} sx={{ color: 'var(--text-secondary)' }}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{
                  background: 'linear-gradient(135deg, rgba(196,58,47,0.88), rgba(159,18,57,0.9))',
                  color: 'white',
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                {submitLabel || 'Salvar Pasta'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

MapaPastaFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']),
  initialValues: PropTypes.shape({
    nome: PropTypes.string,
    descricao: PropTypes.string,
    imagemCapa: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  title: PropTypes.string,
};

MapaPastaFormDialog.defaultProps = {
  mode: 'create',
  initialValues: {},
  submitLabel: 'Salvar Pasta',
  title: null,
};

export default MapaPastaFormDialog;
