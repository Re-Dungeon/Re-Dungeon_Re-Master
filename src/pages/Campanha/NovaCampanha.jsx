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
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Formik, Form, FastField, Field } from 'formik';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCampanha, updateRmCampanha } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import useEntityFormGuard from 'hooks/useEntityFormGuard';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import SaveAsOutlinedIcon from '@mui/icons-material/SaveAsOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import { CAMPANHA_SCHEMA, CAMPANHA_INITIAL_VALUES } from './utils';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '18px',
    padding: '4px',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.14)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-accent)', boxShadow: '0 0 0 4px rgba(196,58,47,0.08)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)', fontWeight: 600 },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
  '& .MuiFormHelperText-root': { color: '#ef4444', marginLeft: 0 },
  '& .MuiOutlinedInput-input': { padding: '18px 14px' },
};

const selectSx = {
  color: 'var(--text-primary)',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: '18px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.14)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--color-accent)',
    boxShadow: '0 0 0 4px rgba(196,58,47,0.08)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const menuPropsSx = {
  PaperProps: {
    sx: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      border: '1px solid rgba(255,255,255,0.08)',
    },
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography
            variant="h4"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {isEditing ? 'Editar Campanha' : 'Nova Campanha'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', maxWidth: 640 }}
          >
            {isEditing
              ? `Editando os dados de ${campanhaParaEditar.nome}`
              : 'Preencha os dados da nova campanha'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            onClick={() => navigate(ROUTE_PATHS.CAMPANHA)}
            startIcon={<ArrowBackIosNewIcon fontSize="small" />}
            sx={{
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.03)',
              px: 2,
              py: 1,
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                background: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            Voltar
          </Button>
        </Box>
      </Box>

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
                p: { xs: 3, md: 4 },
                background: 'rgba(15, 18, 26, 0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 4,
                boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' },
                  gap: 3,
                }}
              >
                <Box sx={{ display: 'grid', gap: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 3,
                    }}
                  >
                    <SectionTitle>Informações Gerais</SectionTitle>
                    <Box sx={{ display: 'grid', gap: 3, mt: 2 }}>
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
                            rows={6}
                            error={touched.descricao && Boolean(errors.descricao)}
                            helperText={touched.descricao && errors.descricao}
                            sx={inputSx}
                          />
                        )}
                      </FastField>
                    </Box>
                  </Paper>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    justifyContent: 'space-between',
                    maxWidth: { xs: '100%', md: 420 },
                    mx: { md: 'auto' },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'var(--color-accent)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.18em',
                      mb: 1,
                    }}
                  >
                    Preview da Campanha
                  </Typography>
                  <ImagePreviewPanel
                    src={values.linkImagem}
                    alt="Preview da campanha"
                  />
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Typography sx={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      Visualização responsiva em tempo real.
                    </Typography>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      Mantenha o link válido para ver a imagem.
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Paper>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
              <Button
                onClick={() => navigate(ROUTE_PATHS.CAMPANHA)}
                startIcon={<CancelOutlinedIcon />}
                sx={{
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  px: 3,
                  py: 1.2,
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 700,
                  '&:hover': { background: 'rgba(255,255,255,0.08)' },
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={<SaveAsOutlinedIcon />}
                sx={{
                  color: 'var(--bg-primary)',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  px: 3,
                  py: 1.2,
                  borderRadius: '14px',
                  textTransform: 'none',
                  fontWeight: 700,
                  boxShadow: '0 14px 30px rgba(143, 35, 28, 0.22)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))',
                  },
                }}
              >
                {isEditing ? 'Salvar Alterações' : 'Salvar Campanha'}
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default NovaCampanha;
