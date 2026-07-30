import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { Formik, Form, FastField, FieldArray } from 'formik';
import useStableListKeys from 'hooks/useStableListKeys';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { CRIATURA_SCHEMA } from './criaturaUtils';

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

const CriaturaForm = ({
  initialValues,
  personagem,
  onSubmit,
  onCancelar,
  labelSalvar,
}) => {
  const historicoKeys = useStableListKeys(
    initialValues.historicoEncontros.length,
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CRIATURA_SCHEMA}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, isSubmitting }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {personagem && (
              <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
                Clone de <strong>{personagem.nome}</strong> — os campos abaixo
                são específicos desta campanha e não alteram a ficha original do
                personagem.
              </Typography>
            )}

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Informações Gerais</SectionTitle>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 280px' },
                  gap: 3,
                  mt: 1.5,
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

                  <FastField name="descricaoBase">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Descrição Base"
                        fullWidth
                        multiline
                        rows={3}
                        error={
                          touched.descricaoBase && Boolean(errors.descricaoBase)
                        }
                        helperText={
                          touched.descricaoBase && errors.descricaoBase
                        }
                        sx={inputSx}
                      />
                    )}
                  </FastField>
                </Box>

                <ImagePreviewPanel
                  src={values.linkImagem}
                  alt="Preview da criatura"
                />
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Comportamento e Combate</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <FastField name="comportamento">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Comportamento"
                      fullWidth
                      multiline
                      rows={2}
                      error={
                        touched.comportamento && Boolean(errors.comportamento)
                      }
                      helperText={touched.comportamento && errors.comportamento}
                      sx={inputSx}
                    />
                  )}
                </FastField>
                <FastField name="estrategiasCombate">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Estratégias de Combate"
                      fullWidth
                      multiline
                      rows={2}
                      error={
                        touched.estrategiasCombate &&
                        Boolean(errors.estrategiasCombate)
                      }
                      helperText={
                        touched.estrategiasCombate && errors.estrategiasCombate
                      }
                      sx={inputSx}
                    />
                  )}
                </FastField>
                <FastField name="fraquezas">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Fraquezas"
                      fullWidth
                      multiline
                      rows={2}
                      error={touched.fraquezas && Boolean(errors.fraquezas)}
                      helperText={touched.fraquezas && errors.fraquezas}
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Habitat e Observações do Mestre</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <FastField name="habitat">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Habitat"
                      fullWidth
                      multiline
                      rows={2}
                      error={touched.habitat && Boolean(errors.habitat)}
                      helperText={touched.habitat && errors.habitat}
                      sx={inputSx}
                    />
                  )}
                </FastField>
                <FastField name="observacoesMestre">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Observações do Mestre"
                      fullWidth
                      multiline
                      rows={3}
                      error={
                        touched.observacoesMestre &&
                        Boolean(errors.observacoesMestre)
                      }
                      helperText={
                        touched.observacoesMestre && errors.observacoesMestre
                      }
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Histórico de Encontros</SectionTitle>
              <FieldArray name="historicoEncontros">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    {values.historicoEncontros.map((_, idx) => (
                      <Box
                        key={historicoKeys.keys[idx] ?? idx}
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <FastField name={`historicoEncontros.${idx}`}>
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              placeholder="Ex.: derrotada na Cena 'Emboscada na Ponte'"
                              sx={inputSx}
                            />
                          )}
                        </FastField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            historicoKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover entrada do histórico"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        historicoKeys.addKey();
                        push('');
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar encontro
                    </Button>
                  </Box>
                )}
              </FieldArray>
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

CriaturaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  personagem: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
};

export default CriaturaForm;
