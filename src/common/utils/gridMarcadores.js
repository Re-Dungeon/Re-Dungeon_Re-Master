// Marcadores do mapa do grid (Fase 3B), funções puras — cópia nos dois sites
// (mudou um, mude o outro). Estado em
// rmCampanhas/{id}/gridCenas/{cenaId}/marcadores/{id}:
//   { col, lin, icone, cor, titulo, texto, secreto, createdAt }
// `secreto: true` só o mestre lê (a regra exige `secreto == false` para o
// jogador). As constantes marcadas "regra" espelham o firestore.rules.
import { GRID_POSICAO_MAX } from 'common/utils/grid';

export const ICONES_MARCADOR = [
  { id: 'alfinete', rotulo: 'Alfinete' },
  { id: 'perigo', rotulo: 'Perigo' },
  { id: 'tesouro', rotulo: 'Tesouro' },
  { id: 'porta', rotulo: 'Porta' },
  { id: 'interrogacao', rotulo: 'Interrogação' },
  { id: 'caveira', rotulo: 'Caveira' },
];
export const ICONE_MARCADOR_PADRAO = 'alfinete';
export const CORES_MARCADOR = [
  '#e8cb85',
  '#e05555',
  '#4caf50',
  '#5b9bff',
  '#b57bff',
  '#ffffff',
];
export const COR_MARCADOR_PADRAO = CORES_MARCADOR[0];
export const MARCADOR_TITULO_MAX = 60; // regra
export const MARCADOR_TEXTO_MAX = 500; // regra
export const MARCADORES_POR_CENA_MAX = 100; // só cliente

const COR_HEX = /^#[0-9a-fA-F]{6}$/;

const inteiroEntre = (valor, min, max) =>
  Number.isInteger(valor) && valor >= min && valor <= max;

const iconeValido = icone => ICONES_MARCADOR.some(item => item.id === icone);

// Ordem de criação; marcador recém-criado (serverTimestamp pendente) por último.
const milissegundos = data => {
  if (!data) return Number.MAX_SAFE_INTEGER;
  if (typeof data.toMillis === 'function') return data.toMillis();
  if (data instanceof Date) return data.getTime();
  return Number(data) || 0;
};

// Payload de um marcador novo (sem createdAt — quem grava põe o timestamp).
export const montarMarcador = ({
  col,
  lin,
  icone,
  cor,
  titulo,
  texto = '',
  secreto = false,
}) => ({
  col,
  lin,
  icone: iconeValido(icone) ? icone : ICONE_MARCADOR_PADRAO,
  cor: COR_HEX.test(cor ?? '') ? cor : COR_MARCADOR_PADRAO,
  titulo: String(titulo ?? '')
    .trim()
    .slice(0, MARCADOR_TITULO_MAX),
  texto: String(texto ?? '')
    .trim()
    .slice(0, MARCADOR_TEXTO_MAX),
  secreto: secreto === true,
});

// Mensagem de erro ou null.
export const validarMarcador = marcador => {
  if (!marcador || typeof marcador !== 'object') return 'Marcador inválido.';
  if (!inteiroEntre(marcador.col, 0, GRID_POSICAO_MAX))
    return 'Coluna inválida.';
  if (!inteiroEntre(marcador.lin, 0, GRID_POSICAO_MAX))
    return 'Linha inválida.';
  if (!iconeValido(marcador.icone)) return 'Escolha um ícone.';
  if (!COR_HEX.test(marcador.cor ?? '')) return 'Escolha uma cor.';
  const titulo = String(marcador.titulo ?? '').trim();
  if (!titulo) return 'Dê um título ao marcador.';
  if (titulo.length > MARCADOR_TITULO_MAX)
    return `O título pode ter até ${MARCADOR_TITULO_MAX} caracteres.`;
  if (String(marcador.texto ?? '').length > MARCADOR_TEXTO_MAX)
    return `O texto pode ter até ${MARCADOR_TEXTO_MAX} caracteres.`;
  if (marcador.secreto !== undefined && typeof marcador.secreto !== 'boolean')
    return 'Marcador inválido.';
  return null;
};

// Doc do Firestore → marcador pronto para o mapa, ou null se inutilizável.
export const normalizarMarcador = doc => {
  if (!doc || typeof doc !== 'object') return null;
  if (!inteiroEntre(doc.col, 0, GRID_POSICAO_MAX)) return null;
  if (!inteiroEntre(doc.lin, 0, GRID_POSICAO_MAX)) return null;
  return {
    id: doc.id,
    col: doc.col,
    lin: doc.lin,
    icone: iconeValido(doc.icone) ? doc.icone : ICONE_MARCADOR_PADRAO,
    cor: COR_HEX.test(doc.cor ?? '') ? doc.cor : COR_MARCADOR_PADRAO,
    titulo:
      typeof doc.titulo === 'string'
        ? doc.titulo.slice(0, MARCADOR_TITULO_MAX)
        : '',
    texto:
      typeof doc.texto === 'string'
        ? doc.texto.slice(0, MARCADOR_TEXTO_MAX)
        : '',
    secreto: doc.secreto === true,
    createdAt: doc.createdAt ?? null,
  };
};

export const normalizarMarcadores = docs =>
  (docs ?? [])
    .map(normalizarMarcador)
    .filter(Boolean)
    .sort((a, b) => milissegundos(a.createdAt) - milissegundos(b.createdAt));
