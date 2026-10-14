import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import { Field, FastField, Form, Formik } from 'formik';
import { MAPA_CATEGORIA_OPCOES, MAPA_SCHEMA, normalizeMapaTags } from './mapaUtils';

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

const dialogContentSx = {
  flex: '1 1 auto',
  minHeight: 0,
  background: 'rgba(8,11,17,0.4)',
  p: { xs: 2, md: 3 },
  overflowY: 'auto',
  overflowX: 'hidden',
  overscrollBehavior: 'contain',
  scrollbarWidth: 'thin',
  scrollbarColor: '#603039 #111722',
  '&::-webkit-scrollbar': {
    width: 7,
  },
  '&::-webkit-scrollbar-track': {
    background: '#111722',
    borderRadius: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#603039',
    borderRadius: 8,
    '&:hover': {
      background: '#a83a43',
    },
  },
};

const buildInitialValues = initialValues => {
  const baseValues = {
    nome: '',
    categoria: 'outro',
    descricao: '',
    linkImagem: '',
    tags: [],
    favorito: false,
    ...(initialValues || {}),
  };

  return {
    ...baseValues,
    categoria: baseValues.categoria || 'outro',
    tags: normalizeMapaTags(baseValues.tags),
    favorito: Boolean(baseValues.favorito),
  };
};

const MapaFormDialog = ({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  submitLabel,
  title,
}) => {
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  const initialFormValues = useMemo(
    () => buildInitialValues(initialValues),
    [initialValues],
  );

  const resetTransientState = () => {
    setConfirmDiscardOpen(false);
    setImageErrored(false);
    setIsImageLoading(false);
  };

  const handleCloseRequest = dirty => {
    if (!dirty) {
      resetTransientState();
      onClose();
      return;
    }
    setConfirmDiscardOpen(true);
  };

  const handleDiscardConfirmed = () => {
    resetTransientState();
    onClose();
  };

  const handleFieldSubmit = async (values, formikHelpers) => {
    resetTransientState();
    await onSubmit(values, formikHelpers);
  };

  const addTag = (tagValue, setFieldValue, currentTags) => {
    const nextTag = String(tagValue || '').trim();
    if (!nextTag) return;

    const existingTags = normalizeMapaTags(currentTags);
    const normalized = normalizeMapaTags([...existingTags, nextTag]);
    setFieldValue('tags', normalized);
    setFieldValue('novaTag', '');
  };

  return (
    <>
      <Formik
        enableReinitialize
        initialValues={initialFormValues}
        validationSchema={MAPA_SCHEMA}
        onSubmit={handleFieldSubmit}
      >
        {({ values, errors, touched, isSubmitting, dirty, setFieldValue }) => (
          <Dialog
            open={open}
            onClose={() => handleCloseRequest(dirty)}
            maxWidth="md"
            fullWidth
            aria-labelledby="mapa-form-dialog-title"
            sx={{
              '& .MuiDialog-container': {
                alignItems: 'center',
                padding: 3,
              },
            }}
            slotProps={{
              paper: {
                sx: {
                  width: 'min(100%, 900px)',
                  maxWidth: 'calc(100vw - 32px)',
                  maxHeight: 'calc(100dvh - 48px)',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(180deg, rgba(19, 23, 30, 0.98), rgba(10, 12, 17, 0.99))',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 3,
                  boxShadow: '0 20px 48px rgba(0,0,0,0.38)',
                  overflow: 'hidden',
                },
              },
            }}
          >
            <Form
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                width: '100%',
              }}
            >
              <DialogTitle
                id="mapa-form-dialog-title"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexShrink: 0,
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  py: 2,
                  px: { xs: 2, md: 3 },
                  borderBottom: '1px solid var(--border-primary)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      background: 'rgba(196,58,47,0.14)',
                      border: '1px solid rgba(196,58,47,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MapOutlinedIcon sx={{ color: 'var(--color-accent)', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                      {title || (mode === 'edit' ? 'Editar Mapa' : 'Novo Mapa')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      {mode === 'edit' ? 'Atualize as informações do mapa e mantenha a biblioteca sincronizada.' : 'Defina os dados do mapa e aproveite a prévia em tempo real.'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  aria-label="Fechar modal de mapa"
                  onClick={() => handleCloseRequest(dirty)}
                  sx={{ color: 'var(--text-primary)' }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent
                dividers
                sx={{
                  ...dialogContentSx,
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '1 1 auto',
                  minHeight: 0,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.5fr) minmax(300px, 0.9fr)' },
                    gap: 3,
                    alignItems: 'start',
                    minHeight: 0,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25 }}>
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
                          <InputLabel id="mapa-dialog-categoria-label">Categoria</InputLabel>
                          <Select
                            {...field}
                            labelId="mapa-dialog-categoria-label"
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

                    <Box sx={{ display: 'grid', gap: 1 }}>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        Tags
                      </Typography>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, minHeight: 40, p: 0.5 }}>
                        {normalizeMapaTags(values.tags).length > 0 ? (
                          normalizeMapaTags(values.tags).map(tag => (
                            <Chip
                              key={tag}
                              label={tag}
                              onDelete={() => {
                                const tags = normalizeMapaTags(values.tags).filter(item => item !== tag);
                                setFieldValue('tags', tags);
                              }}
                              sx={{
                                background: 'rgba(196,58,47,0.14)',
                                color: 'var(--text-primary)',
                                border: '1px solid rgba(196,58,47,0.32)',
                                '& .MuiChip-deleteIcon': { color: 'var(--text-primary)' },
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', px: 0.5, py: 0.5 }}>
                            Nenhuma tag adicionada.
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Field name="novaTag">
                          {({ field }) => (
                            <TextField
                              {...field}
                              label="Adicionar tag"
                              placeholder="Ex.: Caverna, Niflheim"
                              fullWidth
                              onKeyDown={event => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  addTag(field.value, setFieldValue, values.tags);
                                  return;
                                }

                                if (event.key === 'Backspace' && !field.value) {
                                  event.preventDefault();
                                  const nextTags = normalizeMapaTags(values.tags).slice(0, -1);
                                  setFieldValue('tags', nextTags);
                                }
                              }}
                              onChange={event => setFieldValue('novaTag', event.target.value)}
                              value={values.novaTag || ''}
                              sx={inputSx}
                            />
                          )}
                        </Field>

                        <Button
                          type="button"
                          variant="outlined"
                          onClick={() => addTag(values.novaTag, setFieldValue, values.tags)}
                          sx={{ minWidth: 120, color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                        >
                          Adicionar
                        </Button>
                      </Box>
                    </Box>

                    <FastField name="linkImagem">
                      {({ field }) => (
                        <TextField
                          {...field}
                          label="URL da imagem"
                          fullWidth
                          placeholder="https://..."
                          error={touched.linkImagem && Boolean(errors.linkImagem)}
                          helperText={touched.linkImagem && errors.linkImagem}
                          sx={inputSx}
                        />
                      )}
                    </FastField>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      alignContent: 'start',
                    }}
                  >
                    <Box
                      sx={{
                        border: '1px solid var(--border-primary)',
                        borderRadius: 3,
                        background: 'rgba(14, 17, 22, 0.9)',
                        overflow: 'hidden',
                        display: 'grid',
                        minHeight: 300,
                        position: 'relative',
                      }}
                    >
                      {isImageLoading && !imageErrored && (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', gap: 1, zIndex: 2, background: 'rgba(10, 12, 16, 0.42)', color: 'var(--text-secondary)' }}>
                          <CircularProgress size={26} sx={{ color: 'var(--color-accent)' }} />
                          <Typography variant="caption">Carregando imagem…</Typography>
                        </Box>
                      )}

                      {!imageErrored && values.linkImagem ? (
                        <Box
                          component="img"
                          src={values.linkImagem}
                          alt={values.nome || 'Prévia do mapa'}
                          onLoad={() => {
                            setIsImageLoading(false);
                            setImageErrored(false);
                          }}
                          onError={() => {
                            setIsImageLoading(false);
                            setImageErrored(true);
                          }}
                          onLoadStart={() => setIsImageLoading(true)}
                          sx={{
                            width: '100%',
                            height: 260,
                            objectFit: 'cover',
                            display: 'block',
                            background: 'rgba(255,255,255,0.02)',
                          }}
                        />
                      ) : (
                        <Box sx={{ height: 260, display: 'grid', placeItems: 'center', p: 4, textAlign: 'center', color: 'var(--text-secondary)' }}>
                          <Box sx={{ display: 'grid', placeItems: 'center', gap: 1 }}>
                            <MapOutlinedIcon sx={{ fontSize: 42, opacity: 0.8 }} />
                            <Typography variant="body2">Sem imagem cadastrada.</Typography>
                          </Box>
                        </Box>
                      )}

                      {imageErrored && (
                        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(10,12,16,0.72)', textAlign: 'center', px: 2 }}>
                          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                            Imagem indisponível no momento.
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'grid', gap: 0.75, px: 0.25 }}>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.05rem' }}>
                        {values.nome || 'Nome do mapa'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {MAPA_CATEGORIA_OPCOES.find(opcao => opcao.value === values.categoria)?.label || 'Outro'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                        {normalizeMapaTags(values.tags).slice(0, 3).length > 0 ? (
                          normalizeMapaTags(values.tags).slice(0, 3).map(tag => (
                            <Chip
                              key={`${tag}-preview`}
                              label={tag}
                              size="small"
                              sx={{
                                background: 'rgba(196,58,47,0.14)',
                                color: 'var(--text-primary)',
                                border: '1px solid rgba(196,58,47,0.32)',
                              }}
                            />
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                            Sem tags
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mt: 3, display: 'grid', gap: 1.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, border: '1px solid var(--border-primary)', borderRadius: 2, px: 1.5, py: 1, background: 'rgba(9,12,16,0.3)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center' }}>
                        <MapOutlinedIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        Adicionar aos favoritos
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={Boolean(values.favorito)}
                          onChange={event => setFieldValue('favorito', event.target.checked)}
                          color="warning"
                        />
                      }
                      label=""
                      aria-label="Adicionar aos favoritos"
                    />
                  </Box>

                  <FastField name="descricao">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Descrição completa"
                        fullWidth
                        multiline
                        minRows={7}
                        maxRows={12}
                        error={touched.descricao && Boolean(errors.descricao)}
                        helperText={touched.descricao && errors.descricao}
                        sx={{
                          ...textareaSx,
                          '& .MuiOutlinedInput-root': {
                            ...textareaSx['& .MuiOutlinedInput-root'],
                            minHeight: 150,
                            maxHeight: 210,
                            overflowY: 'auto',
                            resize: 'vertical',
                          },
                        }}
                      />
                    )}
                  </FastField>
                </Box>
              </DialogContent>

              <DialogActions
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 1.75,
                  flexShrink: 0,
                  borderTop: '1px solid var(--border-primary)',
                  background: 'rgba(8,11,17,0.76)',
                  justifyContent: 'flex-end',
                  gap: 1,
                }}
              >
                <Button onClick={() => handleCloseRequest(dirty)} sx={{ color: 'var(--text-secondary)' }}>
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
                    minWidth: 180,
                  }}
                >
                  {isSubmitting
                    ? 'Salvando...'
                    : submitLabel || (mode === 'edit' ? 'Salvar Alterações' : 'Salvar Mapa')}
                </Button>
              </DialogActions>
            </Form>
          </Dialog>
        )}
      </Formik>

      <Dialog
        open={confirmDiscardOpen}
        onClose={() => setConfirmDiscardOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          Descartar alterações?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
            Você possui alterações que ainda não foram salvas.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmDiscardOpen(false)} sx={{ color: 'var(--text-secondary)' }}>
            Continuar editando
          </Button>
          <Button
            onClick={handleDiscardConfirmed}
            variant="contained"
            color="error"
          >
            Descartar alterações
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

MapaFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValues: PropTypes.shape({
    nome: PropTypes.string,
    categoria: PropTypes.string,
    descricao: PropTypes.string,
    linkImagem: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    favorito: PropTypes.bool,
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string,
  title: PropTypes.string,
};

MapaFormDialog.defaultProps = {
  initialValues: {},
  submitLabel: null,
  title: null,
};

export default MapaFormDialog;
