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
import Typography from '@mui/material/Typography';
import { Formik, Form, FastField, Field, FieldArray } from 'formik';
import useStableListKeys from 'hooks/useStableListKeys';
import { getRmCampanhaNpcs, getRmCenas } from 'service/storage';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import {
  MISSAO_SCHEMA,
  STATUS_MISSAO_OPCOES,
  OBJETIVO_INICIAL,
  IMPORTANCIA_MISSAO_OPCOES,
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
  paper: { sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' } },
};

const sectionSx = {
  p: 2.5,
  background:
    'linear-gradient(180deg, rgba(22, 26, 32, 0.96), rgba(15, 18, 23, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  transition: 'border-color 180ms ease',
};

const sectionHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  mb: 1.5,
};

const addActionButtonSx = {
  alignSelf: 'flex-start',
  color: 'var(--color-accent)',
  borderRadius: 1.5,
  px: 1.25,
  py: 0.75,
  minHeight: 'auto',
  border: '1px solid rgba(196, 58, 47, 0.2)',
  background: 'rgba(196, 58, 47, 0.05)',
  transition: 'all 180ms ease',
  '&:hover': {
    background: 'rgba(196, 58, 47, 0.12)',
    borderColor: 'rgba(196, 58, 47, 0.36)',
  },
};

const emptyStateSx = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0.75,
  textAlign: 'center',
  minHeight: 120,
  border: '1px dashed rgba(255,255,255,0.08)',
  borderRadius: 2,
  background: 'rgba(255,255,255,0.015)',
  color: 'var(--text-muted)',
  p: 2,
};

const itemCardSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  p: 1.25,
  borderRadius: 2,
  border: '1px solid var(--border-primary)',
  background: 'rgba(255,255,255,0.015)',
  transition: 'all 180ms ease',
  '&:hover': {
    borderColor: 'rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.02)',
  },
};

const relationPanelSx = {
  flex: 1,
  minWidth: 0,
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
  background: 'rgba(255,255,255,0.015)',
  p: 1.5,
};

const relationHeaderSx = {
  color: 'var(--text-primary)',
  fontWeight: 700,
  fontSize: '0.77rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  mb: 1,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Paper elevation={0} sx={sectionSx}>
              <Box sx={sectionHeaderSx}>
                <SectionTitle>Informações da Missão</SectionTitle>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 160px 160px 160px' },
                    gap: 2,
                    alignItems: 'center',
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
                          slotProps={menuPropsSx}
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

                  

                  <Field name="importancia">
                    {({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel
                          id={`${idPrefix}-importancia-label`}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Importância
                        </InputLabel>
                        <Select
                          {...field}
                          labelId={`${idPrefix}-importancia-label`}
                          label="Importância"
                          sx={selectSx}
                          slotProps={menuPropsSx}
                        >
                          {IMPORTANCIA_MISSAO_OPCOES.map(opcao => (
                            <MenuItem key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>

                  <Field name="exp">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Exp"
                        fullWidth
                        error={touched.exp && Boolean(errors.exp)}
                        helperText={touched.exp && errors.exp}
                        sx={inputSx}
                      />
                    )}
                  </Field>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 2 }}>
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
                      sx={{
                        ...inputSx,
                        '& .MuiInputBase-root': {
                          minHeight: 120,
                        },
                      }}
                    />
                  )}
                </FastField>

                  
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <FieldArray name="objetivos">
                {({ push, remove }) => (
                  <>
                    <Box sx={sectionHeaderSx}>
                      <SectionTitle>Objetivos</SectionTitle>
                      <Button
                        onClick={() => {
                          objetivosKeys.addKey();
                          push({ ...OBJETIVO_INICIAL });
                        }}
                        sx={addActionButtonSx}
                      >
                        + Adicionar objetivo
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {values.objetivos.length === 0 ? (
                        <Box sx={emptyStateSx}>
                          <Box sx={{ fontSize: '1.6rem', lineHeight: 1 }}>◈</Box>
                          <Box sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Nenhum objetivo adicionado
                          </Box>
                          <Box sx={{ maxWidth: 420 }}>
                            Adicione objetivos para definir a progressão desta
                            missão.
                          </Box>
                        </Box>
                      ) : (
                        values.objetivos.map((objetivo, idx) => (
                          <Box
                            key={objetivosKeys.keys[idx] ?? idx}
                            sx={{
                              ...itemCardSx,
                              borderColor: objetivo.concluido
                                ? 'rgba(74, 222, 128, 0.24)'
                                : 'var(--border-primary)',
                            }}
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
                                    '& .MuiInputBase-root': {
                                      background: 'rgba(10,12,16,0.2)',
                                    },
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
                        ))
                      )}
                    </Box>
                  </>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <FieldArray name="recompensas">
                {({ push, remove }) => (
                  <>
                    <Box sx={sectionHeaderSx}>
                      <SectionTitle>Recompensas</SectionTitle>
                      <Button
                        onClick={() => {
                          recompensasKeys.addKey();
                          push('');
                        }}
                        sx={addActionButtonSx}
                      >
                        + Adicionar recompensa
                      </Button>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {values.recompensas.length === 0 ? (
                        <Box sx={emptyStateSx}>
                          <Box sx={{ fontSize: '1.4rem', lineHeight: 1 }}>◈</Box>
                          <Box sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            Nenhuma recompensa adicionada
                          </Box>
                          <Box sx={{ maxWidth: 420 }}>
                            Adicione recompensas que os jogadores receberão ao
                            concluir esta missão.
                          </Box>
                        </Box>
                      ) : (
                        values.recompensas.map((_, idx) => (
                          <Box
                            key={recompensasKeys.keys[idx] ?? idx}
                            sx={itemCardSx}
                          >
                            <Box
                              sx={{
                                color: 'var(--color-accent)',
                                fontSize: '0.9rem',
                              }}
                            >
                              ◈
                            </Box>
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
                        ))
                      )}
                    </Box>
                  </>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <Box sx={sectionHeaderSx}>
                <SectionTitle>Relacionamentos da Missão</SectionTitle>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                }}
              >
                <Box sx={relationPanelSx}>
                  <Typography sx={relationHeaderSx}>NPCs relacionados</Typography>
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
                        slotProps={menuPropsSx}
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
                    <Box sx={emptyStateSx}>
                      <Box sx={{ fontSize: '1.1rem' }}>◈</Box>
                      <Box sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Nenhum NPC cadastrado
                      </Box>
                      <Box>Esta campanha ainda não possui NPCs vinculados.</Box>
                    </Box>
                  )}
                </Box>

                <Box sx={relationPanelSx}>
                  <Typography sx={relationHeaderSx}>Cenas vinculadas</Typography>
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
                        slotProps={menuPropsSx}
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
                    <Box sx={emptyStateSx}>
                      <Box sx={{ fontSize: '1.1rem' }}>◈</Box>
                      <Box sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Nenhuma cena cadastrada
                      </Box>
                      <Box>Adicione cenas para vincular esta missão.</Box>
                    </Box>
                  )}
                </Box>
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
