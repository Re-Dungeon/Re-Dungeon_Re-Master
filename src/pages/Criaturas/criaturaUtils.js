import * as Yup from 'yup';
import {
  nomeSchema,
  urlImagemSchema,
  descricaoSchema,
  textoLongoSchema,
} from 'common/utils/yupSchemas';
import { getTipoPersonagem } from 'common/utils/personagemTipo';

// Um personagem do Re-Dungeon aparece na tela de Criaturas da campanha ativa
// quando é do tipo "Criatura", pertence ao mesmo Universo da campanha e está
// vinculado a ela pelo campo `campanhas` (array de ids de campanha) — mesmo
// padrão de `ehNpcDaCampanha`/`ehJogadorDaCampanha`.
export const ehCriaturaDaCampanha = (personagem, campanhaAtiva) =>
  getTipoPersonagem(personagem) === 'Criatura' &&
  personagem.universo === campanhaAtiva.universoId &&
  Array.isArray(personagem.campanhas) &&
  personagem.campanhas.includes(campanhaAtiva.id);

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
