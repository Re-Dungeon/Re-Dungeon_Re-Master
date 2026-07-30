import * as Yup from 'yup';
import {
  nomeSchema,
  urlImagemSchema,
  descricaoSchema,
  textoLongoSchema,
  campoCurtoSchema,
} from 'common/utils/yupSchemas';
import { getTipoPersonagem } from 'common/utils/personagemTipo';

// Um personagem do Re-Dungeon aparece na tela de Jogadores da campanha ativa
// quando é do tipo "Personagem Jogável", pertence ao mesmo Universo da
// campanha e está vinculado a ela pelo campo `campanhas` (array de ids de
// campanha) — mesmo padrão de `ehNpcDaCampanha` em pages/Npcs/npcUtils.js.
export const ehJogadorDaCampanha = (personagem, campanhaAtiva) =>
  getTipoPersonagem(personagem) === 'Personagem Jogável' &&
  personagem.universo === campanhaAtiva.universoId &&
  Array.isArray(personagem.campanhas) &&
  personagem.campanhas.includes(campanhaAtiva.id);

export const JOGADOR_SCHEMA = Yup.object({
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

export const JOGADOR_INITIAL_VALUES = {
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
