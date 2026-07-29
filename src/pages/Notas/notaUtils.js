import * as Yup from 'yup';
import { nomeSchema, textoLongoSchema } from 'common/utils/yupSchemas';

export const NOTA_SCHEMA = Yup.object({
  titulo: nomeSchema,
  conteudo: textoLongoSchema,
  cenaId: Yup.string().nullable(),
});

export const NOTA_INITIAL_VALUES = {
  titulo: '',
  conteudo: '',
  cenaId: null,
};
