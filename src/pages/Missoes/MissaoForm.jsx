import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { Formik, Form, FastField, Field, FieldArray } from 'formik';
import useStableListKeys from 'hooks/useStableListKeys';
import { getRmCampanhaNpcs, getRmCenas } from 'service/storage';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import {
  MISSAO_SCHEMA,
  STATUS_MISSAO_OPCOES,
  OBJETIVO_INICIAL,
} from './missaoUtils';

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

const MissaoForm = ({
  initialValues,
  campanhaId = null,
  universoId = null,
  mestreId = null,
  onSubmit,
  onCancelar,
  labelSalvar,
  idPrefix,
}) => {
  const objetivosKeys = useStableListKeys(initialValues.objetivos.length);
  const recompensasKeys = useStableListKeys(initialValues.recompensas.length);
  const statusLabelId = `${idPrefix}-status-label`;
  const npcsLabelId = `${idPrefix}-npcs-label`;
  const cenasLabelId = `${idPrefix}-cenas-label`;

  const [npcs, setNpcs] = useState([]);
  const [cenas, setCenas] = useState([]);

  useEffect(() => {
    if (!campanhaId) return;
    Promise.resolve().then(() =>
      Promise.all([
        getRmCampanhaNpcs(campanhaId, universoId, mestreId),
        getRmCenas(campanhaId, universoId, mestreId),
      ]).then(([todosNpcs, todasCenas]) => {
        setNpcs(todosNpcs);
        setCenas(todasCenas);
      }),
    );
  }, [campanhaId, universoId, mestreId]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={MISSAO_SCHEMA}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, setFieldValue, isSubmitting }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Informações Gerais</SectionTitle>
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

                <Field name="status">
                  {({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel
                        id={statusLabelId}
                        sx={{
                          color: 'var(--text-secondary)',
                          '&.Mui-focused': { color: 'var(--color-accent)' },
                        }}
                      >
                        Status
                      </InputLabel>
                      <Select
                        {...field}
                        labelId={statusLabelId}
                        label="Status"
                        sx={selectSx}
                        MenuProps={menuPropsSx}
                      >
                        {STATUS_MISSAO_OPCOES.map(opcao => (
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
                      rows={3}
                      error={touched.descricao && Boolean(errors.descricao)}
                      helperText={touched.descricao && errors.descricao}
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Objetivos</SectionTitle>
              <FieldArray name="objetivos">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      mt: 1.5,
                    }}
                  >
                    {values.objetivos.map((objetivo, idx) => (
                      <Box
                        key={objetivosKeys.keys[idx] ?? idx}
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <Field name={`objetivos.${idx}.concluido`}>
                          {({ field }) => (
                            <Checkbox
                              {...field}
                              checked={field.value}
                              sx={{
                                color: 'var(--text-muted)',
                                '&.Mui-checked': {
                                  color: 'var(--color-accent)',
                                },
                              }}
                            />
                          )}
                        </Field>
                        <FastField name={`objetivos.${idx}.texto`}>
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              placeholder="Descreva o objetivo"
                              error={Boolean(
                                touched.objetivos?.[idx]?.texto &&
                                errors.objetivos?.[idx]?.texto,
                              )}
                              helperText={
                                touched.objetivos?.[idx]?.texto &&
                                errors.objetivos?.[idx]?.texto
                              }
                              sx={{
                                ...inputSx,
                                textDecoration: objetivo.concluido
                                  ? 'line-through'
                                  : 'none',
                              }}
                            />
                          )}
                        </FastField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            objetivosKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover objetivo"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        objetivosKeys.addKey();
                        push({ ...OBJETIVO_INICIAL });
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar objetivo
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Recompensas</SectionTitle>
              <FieldArray name="recompensas">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      mt: 1.5,
                    }}
                  >
                    {values.recompensas.map((_, idx) => (
                      <Box
                        key={recompensasKeys.keys[idx] ?? idx}
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <FastField name={`recompensas.${idx}`}>
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              sx={inputSx}
                            />
                          )}
                        </FastField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            recompensasKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover recompensa"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        recompensasKeys.addKey();
                        push('');
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar recompensa
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>NPCs e Cenas Relacionados</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                {npcs.length > 0 ? (
                  <FormControl fullWidth size="small">
                    <InputLabel
                      id={npcsLabelId}
                      sx={{ color: 'var(--text-secondary)' }}
                    >
                      NPCs relacionados
                    </InputLabel>
                    <Select
                      multiple
                      labelId={npcsLabelId}
                      label="NPCs relacionados"
                      value={values.npcsRelacionados}
                      onChange={e =>
                        setFieldValue('npcsRelacionados', e.target.value)
                      }
                      sx={selectSx}
                      MenuProps={menuPropsSx}
                      renderValue={selecionados => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {selecionados.map(id => (
                            <Chip
                              key={id}
                              size="small"
                              label={npcs.find(n => n.id === id)?.nome ?? id}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {npcs.map(npc => (
                        <MenuItem key={npc.id} value={npc.id}>
                          {npc.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box
                    sx={{
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      p: 2,
                      background: 'var(--bg-secondary)',
                      borderRadius: 1,
                    }}
                  >
                    Nenhum NPC cadastrado nesta campanha ainda.
                  </Box>
                )}

                {cenas.length > 0 ? (
                  <FormControl fullWidth size="small">
                    <InputLabel
                      id={cenasLabelId}
                      sx={{ color: 'var(--text-secondary)' }}
                    >
                      Cenas vinculadas
                    </InputLabel>
                    <Select
                      multiple
                      labelId={cenasLabelId}
                      label="Cenas vinculadas"
                      value={values.cenasVinculadas}
                      onChange={e =>
                        setFieldValue('cenasVinculadas', e.target.value)
                      }
                      sx={selectSx}
                      MenuProps={menuPropsSx}
                      renderValue={selecionados => (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {selecionados.map(id => (
                            <Chip
                              key={id}
                              size="small"
                              label={cenas.find(c => c.id === id)?.titulo ?? id}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {cenas.map(cena => (
                        <MenuItem key={cena.id} value={cena.id}>
                          {cena.titulo}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Box
                    sx={{
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      p: 2,
                      background: 'var(--bg-secondary)',
                      borderRadius: 1,
                    }}
                  >
                    Nenhuma cena cadastrada nesta campanha ainda.
                  </Box>
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

MissaoForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  campanhaId: PropTypes.string,
  universoId: PropTypes.string,
  mestreId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

export default MissaoForm;
