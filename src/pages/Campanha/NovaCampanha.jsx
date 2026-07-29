import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Paper from '@mui/material/Paper';
import { Formik, Form, FastField, Field } from 'formik';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCampanha, updateRmCampanha } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import useEntityFormGuard from 'hooks/useEntityFormGuard';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { CAMPANHA_SCHEMA, CAMPANHA_INITIAL_VALUES } from './utils';

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

const NovaCampanha = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { recarregarCampanhas, setCampanhaAtiva } = useCampanha();
  const campanhaParaEditar = location.state?.campanha ?? null;

  const { universos, loadingUniversos, isEditing } = useEntityFormGuard({
    itemParaEditar: campanhaParaEditar,
    universoDoItem: campanhaParaEditar?.universoId,
    routeOnDeny: ROUTE_PATHS.CAMPANHA,
  });

  const editInitialValues = campanhaParaEditar
    ? { ...CAMPANHA_INITIAL_VALUES, ...campanhaParaEditar }
    : CAMPANHA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCampanha(campanhaParaEditar.id, values);
    } else {
      const nova = await addRmCampanha({
        ...values,
        mestreId: currentUser.uid,
      });
      await recarregarCampanhas();
      setCampanhaAtiva(nova.id);
      setSubmitting(false);
      navigate(ROUTE_PATHS.CAMPANHA);
      return;
    }
    await recarregarCampanhas();
    setSubmitting(false);
    navigate(ROUTE_PATHS.CAMPANHA);
  };

  if (loadingUniversos) return null;

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar Campanha' : 'Nova Campanha'}
        subtitulo={
          isEditing
            ? `Editando os dados de ${campanhaParaEditar.nome}`
            : 'Preencha os dados da nova campanha'
        }
        onVoltar={() => navigate(ROUTE_PATHS.CAMPANHA)}
      />

      <Formik
        initialValues={editInitialValues}
        validationSchema={CAMPANHA_SCHEMA}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 2,
              }}
            >
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
                        label="Nome da Campanha"
                        fullWidth
                        error={touched.nome && Boolean(errors.nome)}
                        helperText={touched.nome && errors.nome}
                        sx={inputSx}
                      />
                    )}
                  </FastField>

                  <Field name="universoId">
                    {({ field }) => (
                      <FormControl
                        fullWidth
                        error={touched.universoId && Boolean(errors.universoId)}
                      >
                        <InputLabel
                          id="nova-campanha-universo-label"
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Universo
                        </InputLabel>
                        <Select
                          {...field}
                          labelId="nova-campanha-universo-label"
                          label="Universo"
                          sx={selectSx}
                          MenuProps={menuPropsSx}
                        >
                          {universos.map(universo => (
                            <MenuItem key={universo.id} value={universo.id}>
                              {universo.Nome}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.universoId && errors.universoId && (
                          <FormHelperText>{errors.universoId}</FormHelperText>
                        )}
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
                        sx={inputSx}
                      />
                    )}
                  </FastField>
                </Box>

                <ImagePreviewPanel
                  src={values.linkImagem}
                  alt="Preview da campanha"
                />
              </Box>
            </Paper>

            <Box sx={{ mt: 3 }}>
              <FormActions
                onCancelar={() => navigate(ROUTE_PATHS.CAMPANHA)}
                isSubmitting={isSubmitting}
                labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Campanha'}
              />
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default NovaCampanha;
