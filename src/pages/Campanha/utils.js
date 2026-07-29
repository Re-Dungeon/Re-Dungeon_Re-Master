import * as Yup from 'yup';
import {
  nomeSchema,
  descricaoSchema,
  urlImagemSchema,
} from 'common/utils/yupSchemas';

export const CAMPANHA_SCHEMA = Yup.object({
  nome: nomeSchema,
  descricao: descricaoSchema,
  linkImagem: urlImagemSchema,
  universoId: Yup.string().required('Selecione um Universo'),
});

export const CAMPANHA_INITIAL_VALUES = {
  nome: '',
  descricao: '',
  linkImagem: '',
  universoId: '',
  cenaAtualId: null,
};
