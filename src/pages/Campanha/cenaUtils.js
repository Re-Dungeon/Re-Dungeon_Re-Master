import * as Yup from 'yup';
import {
  nomeSchema,
  campoCurtoSchema,
  descricaoSchema,
  textoLongoSchema,
  urlImagemSchema,
} from 'common/utils/yupSchemas';

// Estado da Campanha (acompanhamento de progresso de cada Cena no fluxograma).
export const ESTADO_CENA_OPCOES = [
  { value: 'nao_iniciado', label: 'Não Iniciado', cor: '#22c55e' },
  { value: 'em_andamento', label: 'Em Andamento', cor: '#eab308' },
  { value: 'concluido', label: 'Concluído', cor: '#facc15' },
  { value: 'ignorado', label: 'Ignorado pelos Jogadores', cor: '#111827' },
  { value: 'cancelado', label: 'Cancelado', cor: '#6b7280' },
];

export const TIPO_CONSEQUENCIA_OPCOES = [
  { value: 'npc_morto', label: 'NPC morto' },
  { value: 'npc_salvo', label: 'NPC salvo' },
  { value: 'cidade_destruida', label: 'Cidade destruída' },
  { value: 'alianca_formada', label: 'Aliança formada' },
  { value: 'faccao_hostil', label: 'Facção hostil' },
  { value: 'item_obtido', label: 'Item importante obtido' },
  { value: 'evento_desencadeado', label: 'Evento que alterou o mundo' },
  { value: 'novo_gancho', label: 'Novo gancho narrativo' },
  { value: 'outro', label: 'Outro' },
];

export const CONSEQUENCIA_INICIAL = { tipo: 'outro', texto: '' };

// Cor placeholder por lado do handle de onde a conexão entre Cenas parte
// (fluxograma da Campanha) — troque os valores livremente.
export const HANDLE_SIDE_COLORS = {
  left: '#38BDF8',
  top: '#A78BFA',
  right: '#FB923C',
  bottom: '#4ADE80',
};

export const HANDLE_SIDE_COLOR_FALLBACK = 'var(--color-accent)';

export const CENA_SCHEMA = Yup.object({
  titulo: nomeSchema,
  linkImagem: urlImagemSchema,
  objetivo: descricaoSchema,
  resumo: campoCurtoSchema,
  descricaoNarracao: textoLongoSchema,
  pontosImportantes: Yup.array().of(Yup.string()),
  estado: Yup.string()
    .oneOf(ESTADO_CENA_OPCOES.map(o => o.value))
    .required(),
  consequencias: Yup.array().of(
    Yup.object({
      tipo: Yup.string().required(),
      texto: Yup.string().trim().required('Descreva a consequência'),
    }),
  ),
  improvisacaoNotas: textoLongoSchema,
  posicaoCanvas: Yup.object({ x: Yup.number(), y: Yup.number() }).nullable(),
  npcsParticipantes: Yup.array().of(Yup.string()),
  criaturasEnvolvidas: Yup.array().of(Yup.string()),
});

export const CENA_INITIAL_VALUES = {
  titulo: '',
  linkImagem: '',
  objetivo: '',
  resumo: '',
  descricaoNarracao: '',
  pontosImportantes: [],
  estado: 'nao_iniciado',
  consequencias: [],
  improvisacaoNotas: '',
  posicaoCanvas: null,
  npcsParticipantes: [],
  criaturasEnvolvidas: [],
};
