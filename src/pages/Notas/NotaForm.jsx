import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import { Formik, Form, FastField, Field } from 'formik';
import { getRmCenas } from 'service/storage';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { NOTA_SCHEMA } from './notaUtils';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-accent)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
  '& .MuiFormHelperText-root': { color: '#ef4444' },
};

const selectSx = {
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-primary)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-hover)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--color-accent)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const menuPropsSx = {
  PaperProps: {
    sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' },
  },
};

const sectionSx = {
  p: 3,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const NotaForm = ({
  initialValues,
  campanhaId = null,
  universoId = null,
  mestreId = null,
  onSubmit,
  onCancelar,
  labelSalvar,
  idPrefix,
}) => {
  const cenaLabelId = `${idPrefix}-cena-label`;
  const [cenas, setCenas] = useState([]);

  useEffect(() => {
    if (!campanhaId) return;
    Promise.resolve().then(() =>
      getRmCenas(campanhaId, universoId, mestreId).then(setCenas),
    );
  }, [campanhaId, universoId, mestreId]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={NOTA_SCHEMA}
      onSubmit={onSubmit}
    >
      {({ errors, touched, isSubmitting }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Nota</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <FastField name="titulo">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Título"
                      fullWidth
                      error={touched.titulo && Boolean(errors.titulo)}
                      helperText={touched.titulo && errors.titulo}
                      sx={inputSx}
                    />
                  )}
                </FastField>

                <FastField name="conteudo">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Conteúdo"
                      fullWidth
                      multiline
                      rows={8}
                      error={touched.conteudo && Boolean(errors.conteudo)}
                      helperText={touched.conteudo && errors.conteudo}
                      sx={inputSx}
                    />
                  )}
                </FastField>

                {cenas.length > 0 && (
                  <Field name="cenaId">
                    {({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel
                          id={cenaLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Vincular a uma Cena (opcional)
                        </InputLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          labelId={cenaLabelId}
                          label="Vincular a uma Cena (opcional)"
                          sx={selectSx}
                          MenuProps={menuPropsSx}
                        >
                          <MenuItem value="">Nenhuma</MenuItem>
                          {cenas.map(cena => (
                            <MenuItem key={cena.id} value={cena.id}>
                              {cena.titulo}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>
                )}
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

NotaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  campanhaId: PropTypes.string,
  universoId: PropTypes.string,
  mestreId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

export default NotaForm;
