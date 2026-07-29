import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import { Formik, Form, FastField } from 'formik';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { BARALHO_SCHEMA } from './baralhoUtils';

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

const sectionSx = {
  p: 3,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const BaralhoForm = ({ initialValues, onSubmit, onCancelar, labelSalvar }) => (
  <Formik initialValues={initialValues} validationSchema={BARALHO_SCHEMA} onSubmit={onSubmit}>
    {({ errors, touched, isSubmitting }) => (
      <Form>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper elevation={0} sx={sectionSx}>
            <SectionTitle>Informações Gerais</SectionTitle>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}>
              <FastField name="nome">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Nome do Baralho"
                    fullWidth
                    error={touched.nome && Boolean(errors.nome)}
                    helperText={touched.nome && errors.nome}
                    sx={inputSx}
                  />
                )}
              </FastField>

              <FastField name="categoria">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Categoria"
                    fullWidth
                    placeholder="Ex.: Eventos de Cidade, Encontros de Estrada..."
                    error={touched.categoria && Boolean(errors.categoria)}
                    helperText={touched.categoria && errors.categoria}
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
                    rows={3}
                    error={touched.descricao && Boolean(errors.descricao)}
                    helperText={touched.descricao && errors.descricao}
                    sx={inputSx}
                  />
                )}
              </FastField>
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

BaralhoForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
};

export default BaralhoForm;
