import { ROUTE_PATHS } from 'common/constants/routes';

// Ignora maiúsculas/minúsculas e acentos na comparação — "acao" deve achar
// "Ação". Descarta os marcadores diacríticos (U+0300–U+036F) que a
// normalização NFD separa da letra base, sem depender de escrever esses
// caracteres combinantes soltos no código-fonte.
const normalizar = texto =>
  Array.from((texto ?? '').toString().toLowerCase().normalize('NFD'))
    .filter(caractere => {
      const codigo = caractere.codePointAt(0);
      return codigo < 0x0300 || codigo > 0x036f;
    })
    .join('');

// Achata as listas já carregadas de cada entidade da campanha ativa num
// único array de itens buscáveis, cada um já com a rota (e o `state` de
// navegação, quando a tela de destino suporta abrir direto no item — hoje só
// Cenas, via `selecionarCenaId`) prontos para `navigate(item.rota,
// { state: item.state })`.
export const montarItensBuscaveis = ({
  npcs = [],
  criaturas = [],
  cenas = [],
  mapas = [],
  missoes = [],
  notas = [],
} = {}) => [
  ...npcs.map(n => ({
    id: n.id,
    tipo: 'NPC',
    titulo: n.nome,
    rota: ROUTE_PATHS.NPCS,
  })),
  ...criaturas.map(c => ({
    id: c.id,
    tipo: 'Criatura',
    titulo: c.nome,
    rota: ROUTE_PATHS.CRIATURAS,
  })),
  ...cenas.map(c => ({
    id: c.id,
    tipo: 'Cena',
    titulo: c.titulo,
    rota: ROUTE_PATHS.CENAS,
    state: { selecionarCenaId: c.id },
  })),
  ...mapas.map(m => ({
    id: m.id,
    tipo: 'Mapa',
    titulo: m.nome,
    rota: ROUTE_PATHS.MAPAS,
  })),
  ...missoes.map(m => ({
    id: m.id,
    tipo: 'Missão',
    titulo: m.titulo,
    rota: ROUTE_PATHS.MISSOES,
  })),
  ...notas.map(n => ({
    id: n.id,
    tipo: 'Nota',
    titulo: n.titulo,
    rota: ROUTE_PATHS.NOTAS,
  })),
];

// Termos com menos de 2 caracteres não filtram nada — evita listar a
// campanha inteira a cada abertura da busca, antes do mestre digitar algo.
export const filtrarItensBuscaveis = (termo, itens) => {
  const termoNormalizado = normalizar(termo).trim();
  if (termoNormalizado.length < 2) return [];
  return itens.filter(item =>
    normalizar(item.titulo).includes(termoNormalizado),
  );
};
