import * as Yup from 'yup';
import { nomeSchema, descricaoSchema } from 'common/utils/yupSchemas';

export const STATUS_MISSAO_OPCOES = [
  { value: 'nao_iniciada', label: 'Não Iniciada', cor: '#6b7280' },
  { value: 'em_andamento', label: 'Em Andamento', cor: '#eab308' },
  { value: 'concluida', label: 'Concluída', cor: '#3b82f6' },
  { value: 'falhada', label: 'Falhada', cor: '#ef4444' },
  { value: 'abandonada', label: 'Abandonada', cor: '#111827' },
];

export const OBJETIVO_INICIAL = { texto: '', concluido: false };

export const MISSAO_SCHEMA = Yup.object({
  titulo: nomeSchema,
  descricao: descricaoSchema,
  status: Yup.string()
    .oneOf(STATUS_MISSAO_OPCOES.map(o => o.value))
    .required(),
  objetivos: Yup.array().of(
    Yup.object({
      texto: Yup.string().trim().required('Descreva o objetivo'),
      concluido: Yup.boolean(),
    }),
  ),
  recompensas: Yup.array().of(Yup.string()),
  npcsRelacionados: Yup.array().of(Yup.string()),
  cenasVinculadas: Yup.array().of(Yup.string()),
});

export const MISSAO_INITIAL_VALUES = {
  titulo: '',
  descricao: '',
  status: 'nao_iniciada',
  objetivos: [],
  recompensas: [],
  npcsRelacionados: [],
  cenasVinculadas: [],
};
