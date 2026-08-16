import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Formik, Form, FastField, Field } from 'formik';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import FormActions from 'components/FormActions/FormActions';
import { MAPA_SCHEMA, MAPA_CATEGORIA_OPCOES } from './mapaUtils';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    background: 'rgba(9, 12, 16, 0.36)',
    borderRadius: 1.5,
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
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

const textareaSx = {
  ...inputSx,
  '& .MuiOutlinedInput-root': {
    ...inputSx['& .MuiOutlinedInput-root'],
    minHeight: '120px',
  },
};

const selectSx = {
  color: 'var(--text-primary)',
  background: 'rgba(9, 12, 16, 0.36)',
  borderRadius: 1.5,
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-primary)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-accent)' },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const menuPropsSx = {
  paper: {
    sx: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-primary)',
      boxShadow: '0 16px 32px rgba(0,0,0,0.32)',
    },
  },
};

const sectionSx = {
  p: { xs: 2.5, md: 3 },
  background: 'linear-gradient(180deg, rgba(17, 20, 26, 0.96), rgba(12, 14, 19, 0.94))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 18px 40px rgba(4, 6, 12, 0.38)',
};

const MapaForm = ({ initialValues, onSubmit, onCancelar, labelSalvar, idPrefix }) => {
  const categoriaLabelId = `${idPrefix}-categoria-label`;

  return (
    <Formik initialValues={initialValues} validationSchema={MAPA_SCHEMA} onSubmit={onSubmit}>
      {({ values, errors, touched, isSubmitting }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={sectionSx}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2.5,
                  pb: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'var(--color-accent)',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                  }}
                >
                  Informações do Mapa
                </Typography>
                <Box sx={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.9fr) minmax(220px, 0.9fr)' },
                  gap: { xs: 2.5, md: 3 },
                  alignItems: 'start',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FastField name="nome">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Nome"
                        fullWidth
                        error={touched.nome && Boolean(errors.nome)}
                        helperText={touched.nome && errors.nome}
                        sx={inputSx}
                      />
                    )}
                  </FastField>

                  <Field name="categoria">
                    {({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel
                          id={categoriaLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Categoria
                        </InputLabel>
                        <Select
                          {...field}
                          labelId={categoriaLabelId}
                          label="Categoria"
                          sx={selectSx}
                          slotProps={menuPropsSx}
                        >
                          {MAPA_CATEGORIA_OPCOES.map(opcao => (
                            <MenuItem key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>

                  <FastField name="linkImagem">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Link da Imagem"
                        fullWidth
                        placeholder="https://..."
                        error={touched.linkImagem && Boolean(errors.linkImagem)}
                        helperText={touched.linkImagem && errors.linkImagem}
                        sx={inputSx}
                      />
                    )}
                  </FastField>

                  <FastField name="descricao">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Descrição"
                        fullWidth
                        multiline
                        rows={4}
                        error={touched.descricao && Boolean(errors.descricao)}
                        helperText={touched.descricao && errors.descricao}
                        sx={textareaSx}
                      />
                    )}
                  </FastField>
                </Box>

                <Box sx={{ width: '100%' }}>
                  <ImagePreviewPanel src={values.linkImagem} alt="Preview do mapa" />
                </Box>
              </Box>
            </Paper>

            <FormActions
              onCancelar={onCancelar}
              isSubmitting={isSubmitting}
              labelSalvar={labelSalvar}
            />
          </Box>
        </Form>
      )}
    </Formik>
  );
};

MapaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

export default MapaForm;
