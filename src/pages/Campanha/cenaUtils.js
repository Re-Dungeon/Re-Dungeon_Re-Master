import * as Yup from 'yup';
import {
  nomeSchema,
  descricaoSchema,
  textoLongoSchema,
  urlImagemSchema,
} from 'common/utils/yupSchemas';

// Estado da Campanha (acompanhamento de progresso de cada Cena no fluxograma).
export const ESTADO_CENA_OPCOES = [
  { value: 'nao_iniciado', label: 'Não Iniciado', cor: '#22c55e', icone: '⏳' },
  { value: 'em_andamento', label: 'Em Andamento', cor: '#f59e0b', icone: '⚔️' },
  { value: 'concluido', label: 'Concluído', cor: '#facc15', icone: '✅' },
  { value: 'ignorado', label: 'Ignorado pelos Jogadores', cor: '#7c3aed', icone: '🕶️' },
  { value: 'cancelado', label: 'Cancelado', cor: '#ef4444', icone: '⛔' },
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

export const CONSEQUENCIA_INICIAL = { tipo: 'outro', texto: '', icone: '' };

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
  numeroCena: Yup.number()
    .nullable()
    .transform((value, originalValue) =>
      String(originalValue).trim() === '' ? null : value,
    )
    .integer('Número da cena deve ser um inteiro')
    .min(1, 'Número da cena deve ser maior que 0')
    .max(9999, 'Número da cena é muito alto'),
  linkImagem: urlImagemSchema,
  objetivo: descricaoSchema,
  resumo: Yup.string().trim(),
  descricaoNarracao: Yup.string().trim(),
  localCena: Yup.string().trim(),
  horarioCena: Yup.string().trim(),
  climaCena: Yup.string().trim(),
  situacaoCena: Yup.string().trim(),
  informacaoJogadores: Yup.string().trim(),
  pontosImportantes: Yup.array().of(Yup.string()),
  estado: Yup.string()
    .oneOf(ESTADO_CENA_OPCOES.map(o => o.value))
    .required(),
  consequencias: Yup.array().of(
    Yup.object({
      tipo: Yup.string().required(),
      texto: Yup.string().trim().required('Descreva a consequência'),
      icone: urlImagemSchema,
    }),
  ),
  improvisacaoNotas: textoLongoSchema,
  posicaoCanvas: Yup.object({ x: Yup.number(), y: Yup.number() }).nullable(),
  npcsParticipantes: Yup.array().of(Yup.string()),
  criaturasEnvolvidas: Yup.array().of(Yup.string()),
});

export const CENA_INITIAL_VALUES = {
  titulo: '',
  numeroCena: 1,
  linkImagem: '',
  objetivo: '',
  resumo: '',
  descricaoNarracao: '',
  localCena: '',
  horarioCena: '',
  climaCena: '',
  situacaoCena: '',
  informacaoJogadores: '',
  pontosImportantes: [],
  estado: 'nao_iniciado',
  consequencias: [],
  improvisacaoNotas: '',
  posicaoCanvas: null,
  npcsParticipantes: [],
  criaturasEnvolvidas: [],
};
