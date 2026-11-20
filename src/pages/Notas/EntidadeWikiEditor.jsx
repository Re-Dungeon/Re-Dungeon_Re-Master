import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { ROUTE_PATHS } from 'common/constants/routes';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addRmNota,
  getRmNota,
  getRmTiposEntidadePorUniverso,
  updateRmNota,
} from 'service/storage';
import {
  LEGACY_ENTITY_TYPES,
  NOTA_INITIAL_VALUES,
  NOTA_SCHEMA,
  getEntityTypeOptions,
  normalizeNotaTags,
} from './notaUtils';
import EntidadeRichEditor from './EntidadeRichEditor';

const primeiroTexto = (objeto, campos) => {
  for (const campo of campos) {
    if (typeof objeto?.[campo] === 'string' && objeto[campo].trim()) {
      return objeto[campo].trim();
    }
  }
  return '';
};

const initialFromEntity = entity => {
  const tags = normalizeNotaTags(entity?.tags);
  return {
    titulo: primeiroTexto(entity, ['titulo', 'Titulo', 'nome', 'Nome']) || '',
    conteudo:
      primeiroTexto(entity, [
        'conteudo',
        'conteúdo',
        'descricao',
        'descrição',
        'Resumo',
      ]) || '',
    resumo: primeiroTexto(entity, ['resumo', 'Resumo']) || '',
    imagemUrl:
      primeiroTexto(entity, [
        'imagemUrl',
        'linkImagem',
        'foto',
        'image',
        'capa',
      ]) || '',
    tipo: primeiroTexto(entity, ['tipo', 'categoria', 'Tipo']) || 'Local',
    cenaId: entity?.cenaId ?? null,
    tags: tags.join(', '),
  };
};

const EntidadeWikiEditor = () => {
  const navigate = useNavigate();
  const { entidadeId } = useParams();
  const isEditing = Boolean(entidadeId);
  const { currentUser } = useAuth();
  const { campanhaAtiva } = useCampanha();
  const { notifyError, notifySuccess } = useSnackbar();
  const [entity, setEntity] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const promises = [];
        if (isEditing) promises.push(getRmNota(entidadeId));
        else promises.push(Promise.resolve(null));

        if (campanhaAtiva?.universoId && currentUser?.uid) {
          promises.push(
            getRmTiposEntidadePorUniverso(
              campanhaAtiva.universoId,
              currentUser.uid,
            ),
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        const [loadedEntity, loadedTypes] = await Promise.all(promises);
        if (!active) return;

        if (isEditing && !loadedEntity) {
          notifyError('Entidade não encontrada.');
          navigate(ROUTE_PATHS.UNIVERSO, { replace: true });
          return;
        }

        setEntity(loadedEntity);
        setTipos(Array.isArray(loadedTypes) ? loadedTypes : []);
      } catch {
        if (active) notifyError('Não foi possível carregar a entidade.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [
    campanhaAtiva?.universoId,
    currentUser?.uid,
    isEditing,
    entidadeId,
    navigate,
    notifyError,
  ]);

  const typeOptions = useMemo(
    () => getEntityTypeOptions(tipos, entity ? [entity] : []),
    [entity, tipos],
  );

  const availableTypes = typeOptions.length ? typeOptions : LEGACY_ENTITY_TYPES;

  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  const initialValues = entity
    ? initialFromEntity(entity)
    : { ...NOTA_INITIAL_VALUES, tipo: availableTypes[0] ?? 'Local' };

  const handleSave = async values => {
    if (saving) return;

    if (!campanhaAtiva?.id || !campanhaAtiva.universoId || !currentUser?.uid) {
      notifyError('Selecione uma campanha ativa antes de criar uma entidade.');
      return;
    }

    setSaving(true);
    try {
      const titulo = values.titulo.trim();
      const tags = normalizeNotaTags(values.tags);
      const payload = {
        titulo,
        nome: titulo,
        conteudo: values.conteudo.trim(),
        resumo: values.resumo.trim(),
        imagemUrl: values.imagemUrl.trim() || null,
        tipo: values.tipo.trim(),
        tags,
        cenaId: values.cenaId || null,
      };

      if (isEditing) {
        await updateRmNota(entidadeId, payload);
        notifySuccess('Entidade atualizada.');
        navigate(`/universo/${entidadeId}`);
      } else {
        const created = await addRmNota({
          ...payload,
          campanhaId: campanhaAtiva.id,
          universoId: campanhaAtiva.universoId,
          mestreId: currentUser.uid,
        });
        if (!created?.id) throw new Error('Entidade criada sem identificador.');
        notifySuccess('Entidade criada.');
        navigate(`/universo/${created.id}`);
      }
    } catch {
      notifyError(
        isEditing
          ? 'Não foi possível salvar as alterações.'
          : 'Não foi possível criar a entidade.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() =>
            navigate(
              isEditing ? `/universo/${entidadeId}` : ROUTE_PATHS.UNIVERSO,
            )
          }
          sx={{ color: 'var(--text-secondary)', textTransform: 'none' }}
        >
          {isEditing ? 'Voltar à entidade' : 'Voltar à Wiki'}
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,18,26,0.96)',
          p: { xs: 2, md: 3 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 0.5,
            fontFamily: 'Georgia, serif',
            fontWeight: 650,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
          }}
        >
          {isEditing ? 'Editar entidade' : 'Nova entidade'}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 3, color: 'var(--text-secondary)' }}
        >
          {isEditing
            ? 'Altere somente os campos necessários.'
            : 'Crie uma entidade na Wiki do universo ativo.'}
        </Typography>

        <Formik
          initialValues={initialValues}
          validationSchema={NOTA_SCHEMA}
          enableReinitialize
          onSubmit={handleSave}
        >
          {({ values, errors, touched, setFieldValue }) => (
            <Form>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 220px' },
                  gap: 2,
                }}
              >
                <Field
                  as={TextField}
                  name="titulo"
                  label="Nome da entidade"
                  fullWidth
                  required
                  error={touched.titulo && Boolean(errors.titulo)}
                  helperText={touched.titulo && errors.titulo}
                />
                <Field
                  as={TextField}
                  name="tipo"
                  label="Tipo"
                  select
                  fullWidth
                  error={touched.tipo && Boolean(errors.tipo)}
                  helperText={touched.tipo && errors.tipo}
                >
                  {availableTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Field>

                <Field
                  as={TextField}
                  name="imagemUrl"
                  label="Imagem de capa / perfil"
                  fullWidth
                  sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                  error={touched.imagemUrl && Boolean(errors.imagemUrl)}
                  helperText={touched.imagemUrl && errors.imagemUrl}
                />

                <Field
                  as={TextField}
                  name="resumo"
                  label="Resumo curto"
                  fullWidth
                  sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                  error={touched.resumo && Boolean(errors.resumo)}
                  helperText={touched.resumo && errors.resumo}
                />

                <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: 'var(--text-primary)',
                      fontWeight: 750,
                    }}
                  >
                    Conteúdo
                  </Typography>
                  <EntidadeRichEditor
                    value={values.conteudo}
                    onChange={value => setFieldValue('conteudo', value, false)}
                  />
                  {touched.conteudo && errors.conteudo && (
                    <Typography
                      variant="caption"
                      sx={{ color: 'error.main', mt: 0.75, display: 'block' }}
                    >
                      {errors.conteudo}
                    </Typography>
                  )}
                </Box>

                <TextField
                  label="Tags"
                  value={values.tags}
                  onChange={event => setFieldValue('tags', event.target.value)}
                  fullWidth
                  sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}
                  helperText="Separe as tags por vírgula."
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <SaveOutlinedIcon />
                    )
                  }
                  disabled={saving}
                  sx={{
                    borderRadius: '10px',
                    background:
                      'linear-gradient(135deg, #b84444 0%, #8f2f35 100%)',
                    textTransform: 'none',
                    fontWeight: 750,
                  }}
                >
                  {saving ? 'Salvando…' : 'Salvar entidade'}
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default EntidadeWikiEditor;
