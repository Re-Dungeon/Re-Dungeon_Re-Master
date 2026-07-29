import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import { Formik, Form, FastField, Field } from 'formik';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { CARTA_SCHEMA, TIPO_CARTA_OPCOES } from './cartaUtils';

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
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-primary)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-accent)' },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const menuPropsSx = {
  PaperProps: { sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' } },
};

const sectionSx = {
  p: 3,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const CartaForm = ({ initialValues, onSubmit, onCancelar, labelSalvar, idPrefix }) => {
  const tipoLabelId = `${idPrefix}-tipo-label`;

  return (
    <Formik initialValues={initialValues} validationSchema={CARTA_SCHEMA} onSubmit={onSubmit}>
      {({ errors, touched, isSubmitting }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Informações da Carta</SectionTitle>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}>
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

                <Field name="tipo">
                  {({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel
                        id={tipoLabelId}
                        sx={{
                          color: 'var(--text-secondary)',
                          '&.Mui-focused': { color: 'var(--color-accent)' },
                        }}
                      >
                        Tipo
                      </InputLabel>
                      <Select
                        {...field}
                        labelId={tipoLabelId}
                        label="Tipo"
                        sx={selectSx}
                        MenuProps={menuPropsSx}
                      >
                        {TIPO_CARTA_OPCOES.map(opcao => (
                          <MenuItem key={opcao.value} value={opcao.value}>
                            {opcao.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Field>

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
};

CartaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

export default CartaForm;
