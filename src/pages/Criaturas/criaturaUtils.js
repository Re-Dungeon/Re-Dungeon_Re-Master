import * as Yup from 'yup';
import {
  nomeSchema,
  urlImagemSchema,
  descricaoSchema,
  textoLongoSchema,
} from 'common/utils/yupSchemas';

export const CRIATURA_SCHEMA = Yup.object({
  nome: nomeSchema,
  linkImagem: urlImagemSchema,
  descricaoBase: descricaoSchema,
  comportamento: descricaoSchema,
  estrategiasCombate: descricaoSchema,
  habitat: descricaoSchema,
  fraquezas: descricaoSchema,
  observacoesMestre: textoLongoSchema,
  historicoEncontros: Yup.array().of(Yup.string()),
});

export const CRIATURA_INITIAL_VALUES = {
  origemPersonagemId: null,
  nome: '',
  linkImagem: '',
  descricaoBase: '',
  comportamento: '',
  estrategiasCombate: '',
  habitat: '',
  fraquezas: '',
  observacoesMestre: '',
  historicoEncontros: [],
};
