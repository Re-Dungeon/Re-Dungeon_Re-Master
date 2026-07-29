import * as Yup from 'yup';
import { nomeSchema, urlImagemSchema, descricaoSchema } from 'common/utils/yupSchemas';

export const MAPA_CATEGORIA_OPCOES = [
  { value: 'cidade', label: 'Cidade' },
  { value: 'masmorra', label: 'Masmorra' },
  { value: 'floresta', label: 'Floresta / Natureza' },
  { value: 'edificio', label: 'Edifício / Interior' },
  { value: 'regiao', label: 'Região / Mundo' },
  { value: 'outro', label: 'Outro' },
];

export const MAPA_SCHEMA = Yup.object({
  nome: nomeSchema,
  categoria: Yup.string()
    .oneOf(MAPA_CATEGORIA_OPCOES.map(o => o.value))
    .required(),
  descricao: descricaoSchema,
  linkImagem: urlImagemSchema,
});

export const MAPA_INITIAL_VALUES = {
  nome: '',
  categoria: 'outro',
  descricao: '',
  linkImagem: '',
};
