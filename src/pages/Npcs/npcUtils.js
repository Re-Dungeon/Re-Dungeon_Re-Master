import * as Yup from 'yup';
import {
  nomeSchema,
  urlImagemSchema,
  descricaoSchema,
  textoLongoSchema,
  campoCurtoSchema,
} from 'common/utils/yupSchemas';

export const NPC_SCHEMA = Yup.object({
  nome: nomeSchema,
  linkImagem: urlImagemSchema,
  descricaoBase: descricaoSchema,
  personalidade: descricaoSchema,
  maneirismos: campoCurtoSchema,
  objetivos: descricaoSchema,
  relacionamentos: descricaoSchema,
  informacoesSecretas: textoLongoSchema,
  estadoAtual: campoCurtoSchema,
  observacoesPessoais: textoLongoSchema,
});

export const NPC_INITIAL_VALUES = {
  origemPersonagemId: null,
  nome: '',
  linkImagem: '',
  descricaoBase: '',
  personalidade: '',
  maneirismos: '',
  objetivos: '',
  relacionamentos: '',
  informacoesSecretas: '',
  estadoAtual: '',
  observacoesPessoais: '',
};
