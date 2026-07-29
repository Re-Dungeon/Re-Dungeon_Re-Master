import * as Yup from 'yup';
import { nomeSchema, descricaoSchema } from 'common/utils/yupSchemas';

export const TIPO_CARTA_OPCOES = [
  { value: 'evento', label: 'Evento', cor: '#3b82f6' },
  { value: 'recompensa', label: 'Recompensa', cor: '#22c55e' },
  { value: 'perigo', label: 'Perigo', cor: '#ef4444' },
  { value: 'outro', label: 'Outro', cor: '#6b7280' },
];

export const ESTADO_CARTA_OPCOES = [
  { value: 'no_baralho', label: 'No Baralho' },
  { value: 'comprada', label: 'Comprada' },
  { value: 'descartada', label: 'Descartada' },
];

export const CARTA_SCHEMA = Yup.object({
  titulo: nomeSchema,
  descricao: descricaoSchema,
  tipo: Yup.string()
    .oneOf(TIPO_CARTA_OPCOES.map(o => o.value))
    .required(),
});

export const CARTA_INITIAL_VALUES = {
  titulo: '',
  descricao: '',
  tipo: 'evento',
  estadoNoBaralho: 'no_baralho',
};
