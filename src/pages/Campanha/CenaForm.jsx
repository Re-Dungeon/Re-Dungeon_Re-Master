import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { Formik, Form, FastField, Field, FieldArray } from 'formik';
import useStableListKeys from 'hooks/useStableListKeys';
import ImagePreviewPanel from 'components/ImagePreviewPanel/ImagePreviewPanel';
import FormActions from 'components/FormActions/FormActions';
import SectionTitle from 'components/SectionTitle/SectionTitle';
import {
  getRmCampanhaNpcs,
  getRmCampanhaCriaturas,
  getRmMissoesPorCampanha,
} from 'service/storage';
import {
  CENA_SCHEMA,
  ESTADO_CENA_OPCOES,
  TIPO_CONSEQUENCIA_OPCOES,
  CONSEQUENCIA_INICIAL,
} from './cenaUtils';

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

const PlaceholderModulo = ({ children }) => (
  <Typography
    variant="body2"
    sx={{
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      p: 2,
      background: 'var(--bg-secondary)',
      borderRadius: 1,
    }}
  >
    {children}
  </Typography>
);

PlaceholderModulo.propTypes = {
  children: PropTypes.node.isRequired,
};

const CenaForm = ({
  initialValues,
  onSubmit,
  onCancelar,
  labelSalvar,
  idPrefix = 'cena-form',
  campanhaId = null,
  universoId = null,
  mestreId = null,
}) => {
  const pontosKeys = useStableListKeys(initialValues.pontosImportantes.length);
  const consequenciasKeys = useStableListKeys(
    initialValues.consequencias.length,
  );
  const estadoLabelId = `${idPrefix}-estado-label`;
  const npcsLabelId = `${idPrefix}-npcs-label`;
  const criaturasLabelId = `${idPrefix}-criaturas-label`;

  const [npcs, setNpcs] = useState([]);
  const [criaturas, setCriaturas] = useState([]);
  const [missoes, setMissoes] = useState([]);

  useEffect(() => {
    if (!campanhaId) return;
    Promise.resolve().then(() =>
      Promise.all([
        getRmCampanhaNpcs(campanhaId, universoId, mestreId),
        getRmCampanhaCriaturas(campanhaId, universoId, mestreId),
        getRmMissoesPorCampanha(campanhaId, universoId, mestreId),
      ]).then(([todosNpcs, todasCriaturas, todasMissoes]) => {
        setNpcs(todosNpcs);
        setCriaturas(todasCriaturas);
        setMissoes(todasMissoes);
      }),
    );
  }, [campanhaId, universoId, mestreId]);

  // Só-leitura: o vínculo Missão→Cena é gravado no array `cenasVinculadas`
  // da Missão (editado em MissaoForm) — a Cena não guarda seu próprio
  // `missoesRelacionadas` para não manter dois arrays em campos separados
  // que poderiam divergir (vincular pela Missão e a Cena não refletir, ou
  // vice-versa). `initialValues.id` só existe editando uma Cena já salva
  // (NovaCena sem edição não tem id ainda, então a lista fica vazia).
  const missoesVinculadas = missoes.filter(missao =>
    (missao.cenasVinculadas ?? []).includes(initialValues.id),
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CENA_SCHEMA}
      onSubmit={onSubmit}
    >
      {({ values, errors, touched, isSubmitting }) => (
        <Form>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  <FastField name="titulo">
                    {({ field }) => (
                      <TextField
                        {...field}
                        label="Título da Cena"
                        fullWidth
                        error={touched.titulo && Boolean(errors.titulo)}
                        helperText={touched.titulo && errors.titulo}
                        sx={inputSx}
                      />
                    )}
                  </FastField>

                  <Field name="estado">
                    {({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel
                          id={estadoLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Estado da Campanha
                        </InputLabel>
                        <Select
                          {...field}
                          labelId={estadoLabelId}
                          label="Estado da Campanha"
                          sx={selectSx}
                          MenuProps={menuPropsSx}
                        >
                          {ESTADO_CENA_OPCOES.map(opcao => (
                            <MenuItem key={opcao.value} value={opcao.value}>
                              {opcao.label}
                            </MenuItem>
                          ))}
                        </Select>
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
                </Box>

                <ImagePreviewPanel
                  src={values.linkImagem}
                  alt="Preview da cena"
                />
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Narrativa</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                <FastField name="objetivo">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Objetivo Principal"
                      fullWidth
                      multiline
                      rows={2}
                      error={touched.objetivo && Boolean(errors.objetivo)}
                      helperText={touched.objetivo && errors.objetivo}
                      sx={inputSx}
                    />
                  )}
                </FastField>

                <FastField name="resumo">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Resumo"
                      fullWidth
                      multiline
                      rows={2}
                      error={touched.resumo && Boolean(errors.resumo)}
                      helperText={touched.resumo && errors.resumo}
                      sx={inputSx}
                    />
                  )}
                </FastField>

                <FastField name="descricaoNarracao">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Descrição / Texto de Narração"
                      fullWidth
                      multiline
                      rows={6}
                      error={
                        touched.descricaoNarracao &&
                        Boolean(errors.descricaoNarracao)
                      }
                      helperText={
                        touched.descricaoNarracao && errors.descricaoNarracao
                      }
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Pontos Importantes para a Narração</SectionTitle>
              <FieldArray name="pontosImportantes">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    {values.pontosImportantes.map((_, idx) => (
                      <Box
                        key={pontosKeys.keys[idx] ?? idx}
                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                      >
                        <FastField name={`pontosImportantes.${idx}`}>
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
                            pontosKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover ponto importante"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        pontosKeys.addKey();
                        push('');
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar ponto importante
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>Consequências</SectionTitle>
              <FieldArray name="consequencias">
                {({ push, remove }) => (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    {values.consequencias.map((_, idx) => (
                      <Box
                        key={consequenciasKeys.keys[idx] ?? idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: '220px 1fr auto',
                          },
                          gap: 1,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Field name={`consequencias.${idx}.tipo`}>
                          {({ field }) => (
                            <FormControl size="small" fullWidth>
                              <Select
                                {...field}
                                sx={selectSx}
                                MenuProps={menuPropsSx}
                              >
                                {TIPO_CONSEQUENCIA_OPCOES.map(opcao => (
                                  <MenuItem
                                    key={opcao.value}
                                    value={opcao.value}
                                  >
                                    {opcao.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </Field>
                        <FastField name={`consequencias.${idx}.texto`}>
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              size="small"
                              placeholder="Descreva a consequência"
                              error={Boolean(
                                touched.consequencias?.[idx]?.texto &&
                                errors.consequencias?.[idx]?.texto,
                              )}
                              helperText={
                                touched.consequencias?.[idx]?.texto &&
                                errors.consequencias?.[idx]?.texto
                              }
                              sx={inputSx}
                            />
                          )}
                        </FastField>
                        <IconButton
                          size="small"
                          onClick={() => {
                            consequenciasKeys.removeKey(idx);
                            remove(idx);
                          }}
                          sx={{
                            color: 'var(--text-muted)',
                            '&:hover': { color: '#ef4444' },
                          }}
                          aria-label="Remover consequência"
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      onClick={() => {
                        consequenciasKeys.addKey();
                        push({ ...CONSEQUENCIA_INICIAL });
                      }}
                      sx={{
                        alignSelf: 'flex-start',
                        color: 'var(--color-accent)',
                      }}
                    >
                      + Adicionar consequência
                    </Button>
                  </Box>
                )}
              </FieldArray>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>
                Se os jogadores fizerem algo inesperado...
              </SectionTitle>
              <Box sx={{ mt: 1.5 }}>
                <FastField name="improvisacaoNotas">
                  {({ field }) => (
                    <TextField
                      {...field}
                      label="Notas de improviso"
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Caminhos alternativos, reações de NPCs, ganchos improvisados..."
                      error={
                        touched.improvisacaoNotas &&
                        Boolean(errors.improvisacaoNotas)
                      }
                      helperText={
                        touched.improvisacaoNotas && errors.improvisacaoNotas
                      }
                      sx={inputSx}
                    />
                  )}
                </FastField>
              </Box>
            </Paper>

            <Paper elevation={0} sx={sectionSx}>
              <SectionTitle>NPCs, Criaturas e Missões</SectionTitle>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mt: 1.5,
                }}
              >
                {npcs.length > 0 ? (
                  <Field name="npcsParticipantes">
                    {({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel
                          id={npcsLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          NPCs participantes
                        </InputLabel>
                        <Select
                          {...field}
                          multiple
                          labelId={npcsLabelId}
                          label="NPCs participantes"
                          sx={selectSx}
                          MenuProps={menuPropsSx}
                          renderValue={selecionados => (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {selecionados.map(id => (
                                <Chip
                                  key={id}
                                  size="small"
                                  label={
                                    npcs.find(n => n.id === id)?.nome ?? id
                                  }
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
                    )}
                  </Field>
                ) : (
                  <PlaceholderModulo>
                    Nenhum NPC cadastrado nesta campanha ainda — crie um no
                    módulo de NPCs para vinculá-lo a cenas.
                  </PlaceholderModulo>
                )}

                {criaturas.length > 0 ? (
                  <Field name="criaturasEnvolvidas">
                    {({ field }) => (
                      <FormControl fullWidth size="small">
                        <InputLabel
                          id={criaturasLabelId}
                          sx={{
                            color: 'var(--text-secondary)',
                            '&.Mui-focused': { color: 'var(--color-accent)' },
                          }}
                        >
                          Criaturas envolvidas
                        </InputLabel>
                        <Select
                          {...field}
                          multiple
                          labelId={criaturasLabelId}
                          label="Criaturas envolvidas"
                          sx={selectSx}
                          MenuProps={menuPropsSx}
                          renderValue={selecionados => (
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                              }}
                            >
                              {selecionados.map(id => (
                                <Chip
                                  key={id}
                                  size="small"
                                  label={
                                    criaturas.find(c => c.id === id)?.nome ?? id
                                  }
                                />
                              ))}
                            </Box>
                          )}
                        >
                          {criaturas.map(criatura => (
                            <MenuItem key={criatura.id} value={criatura.id}>
                              {criatura.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Field>
                ) : (
                  <PlaceholderModulo>
                    Nenhuma criatura cadastrada nesta campanha ainda — crie uma
                    no módulo de Criaturas para vinculá-la a cenas.
                  </PlaceholderModulo>
                )}

                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--text-secondary)',
                      display: 'block',
                      mb: 0.75,
                    }}
                  >
                    Missões que avançam nesta cena
                  </Typography>
                  {missoesVinculadas.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {missoesVinculadas.map(missao => (
                        <Chip
                          key={missao.id}
                          size="small"
                          label={missao.titulo}
                          sx={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--color-accent)',
                          }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <PlaceholderModulo>
                      Nenhuma missão vinculada a esta cena ainda — vincule pelo
                      campo &quot;Cenas vinculadas&quot; ao editar a missão no
                      módulo de Missões.
                    </PlaceholderModulo>
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

CenaForm.propTypes = {
  initialValues: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  labelSalvar: PropTypes.string.isRequired,
  idPrefix: PropTypes.string,
  campanhaId: PropTypes.string,
  universoId: PropTypes.string,
  mestreId: PropTypes.string,
};

export default CenaForm;
