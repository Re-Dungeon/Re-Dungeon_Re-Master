import * as Yup from 'yup';
import { nomeSchema, campoCurtoSchema, descricaoSchema } from 'common/utils/yupSchemas';

export const BARALHO_SCHEMA = Yup.object({
  nome: nomeSchema,
  categoria: campoCurtoSchema,
  descricao: descricaoSchema,
});

export const BARALHO_INITIAL_VALUES = {
  nome: '',
  categoria: '',
  descricao: '',
};
