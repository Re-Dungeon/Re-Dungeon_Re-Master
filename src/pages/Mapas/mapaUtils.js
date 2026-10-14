import * as Yup from 'yup';
import { nomeSchema, urlImagemSchema, descricaoSchema } from 'common/utils/yupSchemas';

export const MAPA_CATEGORIA_OPCOES = [
  { value: 'cidade', label: 'Cidade' },
  { value: 'masmorra', label: 'Masmorra' },
  { value: 'floresta', label: 'Floresta' },
  { value: 'caverna', label: 'Caverna' },
  { value: 'montanha', label: 'Montanha' },
  { value: 'deserto', label: 'Deserto' },
  { value: 'tundra', label: 'Tundra' },
  { value: 'interior', label: 'Interior' },
  { value: 'edificio', label: 'Edifício / Interior' },
  { value: 'regiao', label: 'Região / Mundo' },
  { value: 'outro', label: 'Outro' },
];

export const normalizeMapaCategoria = categoria => {
  const valor = typeof categoria === 'string' ? categoria.trim().toLowerCase() : '';
  return MAPA_CATEGORIA_OPCOES.some(opcao => opcao.value === valor)
    ? valor
    : 'outro';
};

export const normalizeMapaTags = tags => {
  const lista = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];

  return [...new Set(
    lista
      .map(tag => String(tag).trim())
      .filter(Boolean)
      .slice(0, 8),
  )];
};

export const MAPA_SCHEMA = Yup.object({
  nome: nomeSchema,
  categoria: Yup.string()
    .oneOf(MAPA_CATEGORIA_OPCOES.map(o => o.value))
    .required(),
  descricao: descricaoSchema,
  linkImagem: urlImagemSchema,
  tags: Yup.array().of(Yup.string().trim().max(30)),
  favorito: Yup.boolean(),
});

export const MAPA_INITIAL_VALUES = {
  nome: '',
  categoria: 'outro',
  descricao: '',
  linkImagem: '',
  tags: [],
  favorito: false,
};
