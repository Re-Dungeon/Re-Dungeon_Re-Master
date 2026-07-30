import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Formik, Form, FastField } from 'formik';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { JOGADOR_SCHEMA } from './jogadoresUtils';

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

const JogadorForm = ({
  initialValues,
  personagem,
  onSubmit,
  onCancelar,
  labelSalvar,
}) => (
  <Formik
    initialValues={initialValues}
    validationSchema={JOGADOR_SCHEMA}
    onSubmit={onSubmit}
  >
    {({ values, errors, touched, isSubmitting }) => (
      <Form>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {personagem && (
            <Typography variant="body2" sx={{ color: 'var(--text-muted)' }}>
              Clone de <strong>{personagem.nome}</strong> — os campos abaixo são
              específicos desta campanha e não alteram a ficha original do
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
                      helperText={touched.descricaoBase && errors.descricaoBase}
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>

              <ImagePreviewPanel
                src={values.linkImagem}
                alt="Preview do Jogador"
              />
            </Box>
          </Paper>

          <Paper elevation={0} sx={sectionSx}>
            <SectionTitle>Personalidade</SectionTitle>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}
            >
              <FastField name="personalidade">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Personalidade"
                    fullWidth
                    multiline
                    rows={2}
                    error={
                      touched.personalidade && Boolean(errors.personalidade)
                    }
                    helperText={touched.personalidade && errors.personalidade}
                    sx={inputSx}
                  />
                )}
              </FastField>
              <FastField name="maneirismos">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Maneirismos"
                    fullWidth
                    error={touched.maneirismos && Boolean(errors.maneirismos)}
                    helperText={touched.maneirismos && errors.maneirismos}
                    sx={inputSx}
                  />
                )}
              </FastField>
            </Box>
          </Paper>

          <Paper elevation={0} sx={sectionSx}>
            <SectionTitle>Papel na Trama</SectionTitle>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}
            >
              <FastField name="objetivos">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Objetivos"
                    fullWidth
                    multiline
                    rows={2}
                    error={touched.objetivos && Boolean(errors.objetivos)}
                    helperText={touched.objetivos && errors.objetivos}
                    sx={inputSx}
                  />
                )}
              </FastField>
              <FastField name="relacionamentos">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Relacionamentos"
                    fullWidth
                    multiline
                    rows={2}
                    error={
                      touched.relacionamentos && Boolean(errors.relacionamentos)
                    }
                    helperText={
                      touched.relacionamentos && errors.relacionamentos
                    }
                    sx={inputSx}
                  />
                )}
              </FastField>
              <FastField name="informacoesSecretas">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Informações Secretas (só o mestre vê)"
                    fullWidth
                    multiline
                    rows={3}
                    error={
                      touched.informacoesSecretas &&
                      Boolean(errors.informacoesSecretas)
                    }
                    helperText={
                      touched.informacoesSecretas && errors.informacoesSecretas
                    }
                    sx={inputSx}
                  />
                )}
              </FastField>
            </Box>
          </Paper>

          <Paper elevation={0} sx={sectionSx}>
            <SectionTitle>Estado Atual</SectionTitle>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1.5 }}
            >
              <FastField name="estadoAtual">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Estado atual (vivo, ferido, preso...)"
                    fullWidth
                    error={touched.estadoAtual && Boolean(errors.estadoAtual)}
                    helperText={touched.estadoAtual && errors.estadoAtual}
                    sx={inputSx}
                  />
                )}
              </FastField>
              <FastField name="observacoesPessoais">
                {({ field }) => (
                  <TextField
                    {...field}
                    label="Observações do Mestre"
                    fullWidth
                    multiline
                    rows={3}
                    error={
                      touched.observacoesPessoais &&
                      Boolean(errors.observacoesPessoais)
                    }
                    helperText={
                      touched.observacoesPessoais && errors.observacoesPessoais
                    }
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

JogadorForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  personagem: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
};

export default JogadorForm;
