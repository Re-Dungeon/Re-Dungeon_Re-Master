import * as Yup from 'yup';

export const NOME_MAX = 100;
export const CAMPO_CURTO_MAX = 900;
export const DESCRICAO_MAX = 2000;
export const TEXTO_LONGO_MAX = 8000;

const maxCaracteresMessage = max => `Deve ter no máximo ${max} caracteres`;

export const nomeSchema = Yup.string()
  .trim()
  .max(NOME_MAX, maxCaracteresMessage(NOME_MAX))
  .required('Nome é obrigatório');

export const campoCurtoSchema = Yup.string()
  .trim()
  .max(CAMPO_CURTO_MAX, maxCaracteresMessage(CAMPO_CURTO_MAX));

export const descricaoSchema = Yup.string()
  .trim()
  .max(DESCRICAO_MAX, maxCaracteresMessage(DESCRICAO_MAX));

// Texto de narração de Cena, notas do mestre e o campo de improviso tendem a
// ser bem mais longos que uma descrição curta de item — teto maior que o do
// descricaoSchema, mas ainda limitado para evitar documentos Firestore gigantes.
export const textoLongoSchema = Yup.string()
  .trim()
  .max(TEXTO_LONGO_MAX, maxCaracteresMessage(TEXTO_LONGO_MAX));

export const urlImagemSchema = Yup.string()
  .trim()
  .url('Deve ser uma URL válida');
