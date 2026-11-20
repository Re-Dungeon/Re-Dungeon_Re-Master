import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { ROUTE_PATHS } from 'common/constants/routes';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import ImagemUrlDialog from 'components/Chat/ImagemUrlDialog';
import {
  addRmNota,
  addRmTipoEntidade,
  addRmTipoVinculo,
  addRmVinculo,
  getPersonagens,
  getPersonagensJogaveis,
  getRmCampanhaCriaturas,
  getRmCampanhaJogadores,
  getRmCampanhaNpcs,
  getRmNota,
  getRmNotasPorCampanha,
  getRmTiposEntidadePorUniverso,
  getRmTiposVinculoPorUniverso,
  getRmVinculosPorEntidade,
  removeRmVinculo,
  updateRmNota,
  updateRmTipoVinculo,
  updateRmVinculo,
} from 'service/storage';
import {
  LEGACY_ENTITY_TYPES,
  NOTA_INITIAL_VALUES,
  NOTA_SCHEMA,
  getEntityTypeOptions,
  normalizeEntityTypeName,
  normalizeNotaTags,
} from './notaUtils';
import EntidadeRichEditor from './EntidadeRichEditor';
import VinculosPanel from './VinculosPanel';
import { montarOpcoesVinculo } from './vinculosUtils';
import useStableListKeys from 'hooks/useStableListKeys';

const primeiroTexto = (objeto, campos) => {
  for (const campo of campos) {
    if (typeof objeto?.[campo] === 'string' && objeto[campo].trim()) {
      return objeto[campo].trim();
    }
  }
  return '';
};

const atributosIniciais = entidade => {
  const fonte =
    entidade?.atributos ?? entidade?.attributes ?? entidade?.propriedades ?? {};
  if (!fonte || typeof fonte !== 'object' || Array.isArray(fonte)) return [];
  return Object.entries(fonte)
    .filter(([, valor]) => valor !== null && valor !== undefined)
    .map(([nome, valor]) => ({
      nome,
      valor: typeof valor === 'object' ? JSON.stringify(valor) : String(valor),
    }));
};

const EntidadeWikiEditorRebuild = () => {
  const navigate = useNavigate();
  const { entidadeId } = useParams();
  const isEditing = Boolean(entidadeId);
  const { currentUser } = useAuth();
  const { campanhaAtiva } = useCampanha();
  const { notifyError, notifySuccess } = useSnackbar();
  const [entity, setEntity] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [tiposVinculo, setTiposVinculo] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [destinosVinculo, setDestinosVinculo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [portraitDialogOpen, setPortraitDialogOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [pendingVinculos, setPendingVinculos] = useState([]);
  const atributosKeys = useStableListKeys(atributosIniciais(entity).length);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [
          loadedEntity,
          loadedTypes,
          loadedTiposVinculo,
          loadedVinculos,
          notasDaCampanha,
          personagens,
          npcClones,
          jogadorClones,
          criaturaClones,
          personagensJogaveis,
        ] = await Promise.all([
          isEditing ? getRmNota(entidadeId) : Promise.resolve(null),
          campanhaAtiva?.universoId && currentUser?.uid
            ? getRmTiposEntidadePorUniverso(
                campanhaAtiva.universoId,
                currentUser.uid,
              )
            : Promise.resolve([]),
          campanhaAtiva?.universoId && currentUser?.uid
            ? getRmTiposVinculoPorUniverso(
                campanhaAtiva.universoId,
                currentUser.uid,
              )
            : Promise.resolve([]),
          isEditing &&
          campanhaAtiva?.id &&
          campanhaAtiva?.universoId &&
          currentUser?.uid
            ? getRmVinculosPorEntidade(
                campanhaAtiva.id,
                campanhaAtiva.universoId,
                currentUser.uid,
                entidadeId,
              )
            : Promise.resolve([]),
          isEditing
            ? getRmNotasPorCampanha(
                campanhaAtiva.id,
                campanhaAtiva.universoId,
                currentUser.uid,
              )
            : Promise.resolve([]),
          campanhaAtiva?.universoId
            ? getPersonagens(campanhaAtiva.universoId)
            : Promise.resolve([]),
          campanhaAtiva?.id
            ? getRmCampanhaNpcs(
                campanhaAtiva.id,
                campanhaAtiva.universoId,
                currentUser?.uid,
              )
            : Promise.resolve([]),
          campanhaAtiva?.id
            ? getRmCampanhaJogadores(
                campanhaAtiva.id,
                campanhaAtiva.universoId,
                currentUser?.uid,
              )
            : Promise.resolve([]),
          campanhaAtiva?.id
            ? getRmCampanhaCriaturas(
                campanhaAtiva.id,
                campanhaAtiva.universoId,
                currentUser?.uid,
              )
            : Promise.resolve([]),
          campanhaAtiva?.universoId
            ? getPersonagensJogaveis(campanhaAtiva.universoId)
            : Promise.resolve([]),
        ]);

        if (!active) return;
        if (isEditing && !loadedEntity) {
          notifyError('Entidade não encontrada.');
          navigate(ROUTE_PATHS.UNIVERSO, { replace: true });
          return;
        }
        setEntity(loadedEntity);
        setTipos(Array.isArray(loadedTypes) ? loadedTypes : []);
        setTiposVinculo(
          Array.isArray(loadedTiposVinculo) ? loadedTiposVinculo : [],
        );
        setVinculos(Array.isArray(loadedVinculos) ? loadedVinculos : []);
        setDestinosVinculo(
          montarOpcoesVinculo({
            campanhaId: campanhaAtiva?.id,
            mestreId: currentUser?.uid,
            universoId: campanhaAtiva?.universoId,
            notas: notasDaCampanha,
            personagens: [
              ...(personagens || []),
              ...(personagensJogaveis || []),
            ],
            npcs: npcClones,
            jogadores: jogadorClones,
            criaturas: criaturaClones,
            origemId: isEditing ? entidadeId : null,
          }),
        );
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
    campanhaAtiva?.id,
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

  const tags = normalizeNotaTags(entity?.tags);
  const initialAtributos = atributosIniciais(entity);
  const initialValues = entity
    ? {
        titulo:
          primeiroTexto(entity, ['titulo', 'Titulo', 'nome', 'Nome']) || '',
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
            'imagemCapa',
            'banner',
          ]) || '',
        imagemPerfil:
          primeiroTexto(entity, [
            'imagemPerfil',
            'perfil',
            'avatar',
            'imagemRetrato',
            'retrato',
            'fotoPerfil',
            'profileImage',
          ]) || '',
        tipo:
          primeiroTexto(entity, ['tipo', 'categoria', 'Tipo']) ||
          availableTypes[0] ||
          'Local',
        cenaId: entity?.cenaId ?? null,
        tags,
        atributos: initialAtributos,
      }
    : {
        ...NOTA_INITIAL_VALUES,
        tipo: availableTypes[0] ?? 'Local',
        tags: [],
        atributos: [],
      };

  const handleSave = async values => {
    if (saving) return;
    if (!campanhaAtiva?.id || !campanhaAtiva.universoId || !currentUser?.uid) {
      notifyError('Selecione uma campanha ativa antes de salvar a entidade.');
      return;
    }

    setSaving(true);
    try {
      const titulo = String(values.titulo ?? '').trim();
      if (!titulo) {
        notifyError('Informe o nome da entidade antes de salvar.');
        return;
      }

      const cleanTags = normalizeNotaTags(values.tags);
      const cleanAttributes = (
        Array.isArray(values.atributos) ? values.atributos : []
      ).reduce((acc, item) => {
        const name = String(item?.nome ?? '').trim();
        const value = String(item?.valor ?? '').trim();
        if (name && value) acc[name] = value;
        return acc;
      }, {});

      const tipo = String(values.tipo ?? '').trim() || 'Outro';
      const payload = {
        titulo,
        nome: titulo,
        conteudo: String(values.conteudo ?? ''),
        resumo: String(values.resumo ?? '').trim(),
        imagemUrl: String(values.imagemUrl ?? '').trim() || null,
        imagemPerfil: String(values.imagemPerfil ?? '').trim() || null,
        tipo,
        tags: cleanTags,
        cenaId: values.cenaId || null,
      };

      if (Object.keys(cleanAttributes).length > 0 || entity?.atributos) {
        payload.atributos = cleanAttributes;
      }

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
        if (pendingVinculos.length) {
          try {
            await Promise.all(
              pendingVinculos.map(vinculo => {
                const dadosPersistidos = { ...vinculo };
                delete dadosPersistidos._pendingId;
                return addRmVinculo(campanhaAtiva.id, {
                  ...dadosPersistidos,
                  origemId: created.id,
                  campanhaId: campanhaAtiva.id,
                  universoId: campanhaAtiva.universoId,
                  mestreId: currentUser.uid,
                });
              }),
            );
          } catch (error) {
            throw new Error(
              `Entidade criada, mas vínculos não persistiram: ${error?.message || error}`,
            );
          }
        }
        notifySuccess('Entidade criada.');
        navigate(`/universo/${created.id}`);
      }
    } catch (erroSalvar) {
      // eslint-disable-next-line no-console
      console.error('[Wiki] Falha ao salvar entidade:', erroSalvar);
      const codigo = String(erroSalvar?.code ?? '');
      if (codigo.includes('permission-denied')) {
        notifyError('Você não tem permissão para salvar esta entidade.');
      } else if (codigo.includes('unavailable') || codigo.includes('network')) {
        notifyError('Falha de conexão ao salvar a entidade. Tente novamente.');
      } else {
        notifyError(
          isEditing
            ? 'Não foi possível salvar as alterações. Verifique os dados e tente novamente.'
            : 'Não foi possível criar a entidade. Verifique os dados e tente novamente.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const recarregarVinculos = async origemId => {
    if (!campanhaAtiva?.id || !campanhaAtiva?.universoId || !currentUser?.uid)
      return;
    const loaded = await getRmVinculosPorEntidade(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      currentUser.uid,
      origemId,
    );
    setVinculos(Array.isArray(loaded) ? loaded : []);
  };

  const criarTipoVinculo = async dados => {
    try {
      const created = await addRmTipoVinculo({
        ...dados,
        universoId: campanhaAtiva.universoId,
        mestreId: currentUser.uid,
      });
      setTiposVinculo(current => {
        const exists = current.some(
          tipo =>
            normalizeEntityTypeName(tipo.name) ===
            normalizeEntityTypeName(created.name),
        );
        return exists ? current : [...current, created];
      });
      notifySuccess('Tipo de vínculo criado.');
      return created;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wiki] Falha ao criar tipo de vínculo:', error);
      notifyError('Não foi possível criar o tipo de vínculo.');
      return null;
    }
  };

  const adicionarVinculo = async dados => {
    try {
      if (!isEditing) {
        const pendingId = `pendente-${Date.now()}-${currentUser.uid}`;
        setPendingVinculos(current => [
          ...current,
          { ...dados, _pendingId: pendingId },
        ]);
        setVinculos(current => [...current, { id: pendingId, ...dados }]);
        notifySuccess('Vínculo preparado para salvar com a entidade.');
        return;
      }
      const created = await addRmVinculo(campanhaAtiva.id, {
        ...dados,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: currentUser.uid,
      });
      setVinculos(current => [...current, { ...dados, id: created.id }]);
      notifySuccess('Vínculo adicionado.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wiki] Falha ao adicionar vínculo:', error);
      notifyError('Não foi possível salvar o vínculo.');
    }
  };

  const atualizarVinculo = async (id, dados) => {
    try {
      if (!isEditing && id.startsWith('pendente-')) {
        setPendingVinculos(current =>
          current.map(item =>
            item._pendingId === id ? { ...dados, _pendingId: id } : item,
          ),
        );
        setVinculos(current =>
          current.map(item => (item.id === id ? { ...item, ...dados } : item)),
        );
        return;
      }
      await updateRmVinculo(campanhaAtiva.id, id, dados);
      await recarregarVinculos(entidadeId);
      notifySuccess('Vínculo atualizado.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wiki] Falha ao atualizar vínculo:', error);
      notifyError('Não foi possível atualizar o vínculo.');
    }
  };

  const removerVinculo = async id => {
    try {
      if (!isEditing && id.startsWith('pendente-')) {
        setVinculos(current => current.filter(item => item.id !== id));
        setPendingVinculos(current =>
          current.filter(item => item._pendingId !== id),
        );
        return;
      }
      await removeRmVinculo(campanhaAtiva.id, id);
      setVinculos(current => current.filter(item => item.id !== id));
      notifySuccess('Vínculo removido.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wiki] Falha ao remover vínculo:', error);
      notifyError('Não foi possível remover o vínculo.');
    }
  };

  const atualizarTipoVinculo = async (id, dados) => {
    try {
      await updateRmTipoVinculo(id, dados);
      setTiposVinculo(current =>
        current.map(tipo => (tipo.id === id ? { ...tipo, ...dados } : tipo)),
      );
      notifySuccess('Tipo de vínculo atualizado.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Wiki] Falha ao atualizar tipo de vínculo:', error);
      notifyError('Não foi possível atualizar o tipo de vínculo.');
    }
  };

  const removeTag = (values, setFieldValue, tag) => {
    setFieldValue(
      'tags',
      values.tags.filter(item => item !== tag),
    );
  };

  const addTag = (values, setFieldValue) => {
    const tag = tagDraft.trim();
    if (!tag) return;
    const next = normalizeNotaTags([...values.tags, tag]);
    setFieldValue('tags', next);
    setTagDraft('');
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1500, mx: 'auto' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2,
          flexWrap: 'wrap',
        }}
      >
        <Button
          startIcon={<ArrowBackOutlinedIcon />}
          onClick={() =>
            navigate(
              isEditing ? `/universo/${entidadeId}` : ROUTE_PATHS.UNIVERSO,
            )
          }
          sx={{
            color: 'var(--text-secondary)',
            textTransform: 'none',
            px: 0.5,
          }}
        >
          {isEditing ? 'Voltar à entidade' : 'Voltar à Wiki'}
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
            {isEditing ? 'Editando entidade' : 'Nova entidade'}
          </Typography>
        </Box>
      </Box>

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
                gridTemplateColumns: {
                  xs: '1fr',
                  lg: 'minmax(0, 1fr) 360px',
                  xl: 'minmax(0, 1fr) 390px',
                },
                gap: 2,
                alignItems: 'start',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    p: { xs: 1.25, md: 2 },
                  }}
                >
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
                </Paper>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.25,
                  minWidth: 0,
                  position: 'sticky',
                  top: 16,
                  alignSelf: 'start',
                  maxHeight: { lg: 'calc(100vh - 170px)' },
                  overflowY: { lg: 'auto' },
                  pr: { lg: 0.5 },
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    p: 2,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, mb: 1.25 }}
                  >
                    Salvar
                  </Typography>
                  <Button
                    type="submit"
                    fullWidth
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
                      height: 42,
                      background:
                        'linear-gradient(135deg, #b84444 0%, #8f2f35 100%)',
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {saving ? 'Salvando…' : 'Salvar entidade'}
                  </Button>
                </Paper>

                <Accordion
                  defaultExpanded
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>
                      Identificação
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
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
                    <Autocomplete
                      freeSolo
                      selectOnFocus
                      clearOnBlur
                      handleHomeEndKeys
                      options={availableTypes}
                      value={values.tipo || ''}
                      getOptionLabel={option => {
                        if (typeof option === 'string') return option;
                        return option?.inputValue || option?.title || '';
                      }}
                      filterOptions={(options, params) => {
                        const filtered = createFilterOptions()(options, params);
                        const typedName = params.inputValue.trim();
                        if (!typedName) return filtered;

                        const normalizedTypedName =
                          normalizeEntityTypeName(typedName);
                        const exactMatch = options.some(
                          option =>
                            normalizeEntityTypeName(option) ===
                            normalizedTypedName,
                        );
                        if (!exactMatch) {
                          filtered.push({
                            inputValue: typedName,
                            title: `+ Criar "${typedName}"`,
                          });
                        }
                        return filtered;
                      }}
                      onChange={async (_event, newValue) => {
                        const isCreateOption =
                          typeof newValue === 'object' && newValue?.inputValue;
                        let selectedName = isCreateOption
                          ? newValue.inputValue.trim()
                          : typeof newValue === 'string'
                            ? newValue.trim()
                            : '';

                        if (!selectedName) {
                          setFieldValue('tipo', '', false);
                          return;
                        }

                        selectedName = selectedName.replace(/\s+/g, ' ').trim();
                        const normalizedName =
                          normalizeEntityTypeName(selectedName);
                        const existingName = availableTypes.find(
                          option =>
                            normalizeEntityTypeName(option) === normalizedName,
                        );

                        if (existingName) {
                          setFieldValue('tipo', existingName, false);
                          return;
                        }

                        if (isCreateOption) {
                          try {
                            await addRmTipoEntidade({
                              name: selectedName,
                              universoId: campanhaAtiva.universoId,
                              mestreId: currentUser.uid,
                            });
                            setTipos(current => {
                              const jaExiste = current.some(
                                tipo =>
                                  normalizeEntityTypeName(
                                    tipo?.name ?? tipo,
                                  ) === normalizedName,
                              );
                              if (jaExiste) return current;
                              return [
                                ...current,
                                {
                                  name: selectedName,
                                  normalizedName,
                                },
                              ];
                            });
                            setFieldValue('tipo', selectedName, false);
                          } catch {
                            notifyError(
                              'Não foi possível criar o tipo de entidade.',
                            );
                          }
                        } else {
                          try {
                            await addRmTipoEntidade({
                              name: selectedName,
                              universoId: campanhaAtiva.universoId,
                              mestreId: currentUser.uid,
                            });
                            setTipos(current => {
                              const jaExiste = current.some(
                                tipo =>
                                  normalizeEntityTypeName(
                                    tipo?.name ?? tipo,
                                  ) === normalizedName,
                              );
                              if (jaExiste) return current;
                              return [
                                ...current,
                                {
                                  name: selectedName,
                                  normalizedName,
                                },
                              ];
                            });
                            setFieldValue('tipo', selectedName, false);
                          } catch {
                            notifyError(
                              'Não foi possível criar o tipo de entidade.',
                            );
                          }
                        }
                      }}
                      renderOption={(props, option) => {
                        if (typeof option === 'object' && option?.inputValue) {
                          return (
                            <li {...props} key={`criar-${option.inputValue}`}>
                              {option.title}
                            </li>
                          );
                        }
                        return (
                          <li {...props} key={option}>
                            {option}
                          </li>
                        );
                      }}
                      noOptionsText="Nenhum tipo encontrado"
                      slotProps={{
                        listbox: {
                          sx: {
                            maxHeight: 6 * 48,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            scrollbarWidth: 'thin',
                            scrollbarColor:
                              'rgba(184, 60, 53, 0.8) rgba(255,255,255,0.04)',
                            '&::-webkit-scrollbar': { width: 8 },
                            '&::-webkit-scrollbar-track': {
                              background: 'rgba(255,255,255,0.04)',
                              borderRadius: 999,
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background:
                                'linear-gradient(180deg, rgba(184,60,53,0.82), rgba(120,35,35,0.9))',
                              borderRadius: 999,
                            },
                          },
                        },
                      }}
                      renderInput={params => (
                        <TextField {...params} label="Tipo" fullWidth />
                      )}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  defaultExpanded
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>
                      Imagem de capa
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {values.imagemUrl ? (
                      <Box
                        component="img"
                        src={values.imagemUrl}
                        alt="Prévia da capa"
                        sx={{
                          width: '100%',
                          aspectRatio: '16 / 9',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          mb: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          aspectRatio: '16 / 9',
                          borderRadius: '10px',
                          border: '1px dashed rgba(255,255,255,0.12)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--text-secondary)',
                          mb: 1,
                        }}
                      >
                        <ImageOutlinedIcon />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ImageOutlinedIcon />}
                        onClick={() => setImageDialogOpen(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        Selecionar
                      </Button>
                      {values.imagemUrl && (
                        <IconButton
                          aria-label="Remover capa"
                          onClick={() => setFieldValue('imagemUrl', '')}
                          sx={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>Retrato</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {values.imagemPerfil ? (
                      <Box
                        component="img"
                        src={values.imagemPerfil}
                        alt="Prévia do retrato"
                        sx={{
                          width: 128,
                          height: 128,
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '4px solid var(--bg-primary)',
                          boxShadow: '0 12px 26px rgba(0,0,0,0.38)',
                          display: 'block',
                          mx: 'auto',
                          mb: 1,
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 128,
                          height: 128,
                          borderRadius: '50%',
                          border: '1px dashed rgba(255,255,255,0.16)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--text-secondary)',
                          mx: 'auto',
                          mb: 1,
                        }}
                      >
                        <ImageOutlinedIcon />
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<ImageOutlinedIcon />}
                        onClick={() => setPortraitDialogOpen(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        Selecionar retrato
                      </Button>
                      {values.imagemPerfil && (
                        <IconButton
                          aria-label="Remover retrato"
                          onClick={() => setFieldValue('imagemPerfil', '')}
                          sx={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>Resumo</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Field
                      as={TextField}
                      name="resumo"
                      label="Resumo curto"
                      multiline
                      minRows={4}
                      fullWidth
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  defaultExpanded
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>Tags</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 0.75,
                        mb: 1,
                      }}
                    >
                      {values.tags.map(tag => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => removeTag(values, setFieldValue, tag)}
                          size="small"
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        fullWidth
                        value={tagDraft}
                        onChange={event => setTagDraft(event.target.value)}
                        onKeyDown={event => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addTag(values, setFieldValue);
                          }
                        }}
                        label="Nova tag"
                      />
                      <IconButton
                        aria-label="Adicionar tag"
                        onClick={() => addTag(values, setFieldValue)}
                        sx={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <AddOutlinedIcon />
                      </IconButton>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  defaultExpanded
                  disableGutters
                  elevation={0}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15,18,26,0.96)',
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                    <Typography sx={{ fontWeight: 800 }}>Atributos</Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                  >
                    {values.atributos.map((atributo, index) => (
                      <Box
                        key={atributosKeys.keys[index] ?? `atributo-${index}`}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 36px',
                          gap: 0.75,
                          alignItems: 'center',
                        }}
                      >
                        <TextField
                          size="small"
                          label="Nome"
                          value={atributo.nome}
                          onChange={event =>
                            setFieldValue(
                              `atributos.${index}.nome`,
                              event.target.value,
                              false,
                            )
                          }
                        />
                        <TextField
                          size="small"
                          label="Valor"
                          value={atributo.valor}
                          onChange={event =>
                            setFieldValue(
                              `atributos.${index}.valor`,
                              event.target.value,
                            )
                          }
                        />
                        <IconButton
                          aria-label="Remover atributo"
                          onClick={() => {
                            atributosKeys.removeKey(index);
                            setFieldValue(
                              'atributos',
                              values.atributos.filter(
                                (_, idx) => idx !== index,
                              ),
                            );
                          }}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      startIcon={<AddOutlinedIcon />}
                      onClick={() => {
                        atributosKeys.addKey();
                        setFieldValue('atributos', [
                          ...values.atributos,
                          { nome: '', valor: '' },
                        ]);
                      }}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                      Adicionar atributo
                    </Button>
                  </AccordionDetails>
                </Accordion>

                <VinculosPanel
                  origemId={isEditing ? entidadeId : 'nova-entidade'}
                  vinculos={vinculos}
                  tipos={tiposVinculo}
                  destinos={destinosVinculo}
                  universoId={campanhaAtiva?.universoId}
                  onAdicionar={adicionarVinculo}
                  onAtualizar={atualizarVinculo}
                  onRemover={removerVinculo}
                  onCriarTipo={criarTipoVinculo}
                  onAtualizarTipo={atualizarTipoVinculo}
                  notifyError={notifyError}
                />
              </Box>
            </Box>

            <ImagemUrlDialog
              open={imageDialogOpen}
              onClose={() => setImageDialogOpen(false)}
              onConfirmar={url => {
                setFieldValue('imagemUrl', url);
                setImageDialogOpen(false);
              }}
            />
            <ImagemUrlDialog
              open={portraitDialogOpen}
              onClose={() => setPortraitDialogOpen(false)}
              onConfirmar={url => {
                setFieldValue('imagemPerfil', url);
                setPortraitDialogOpen(false);
              }}
            />
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default EntidadeWikiEditorRebuild;
