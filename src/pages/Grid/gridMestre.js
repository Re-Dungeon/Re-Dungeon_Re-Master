// Ajudas puras da tela Grid do mestre (o modelo do grid em si fica em
// common/utils/grid.js, compartilhado com o site dos jogadores).
import {
  AURA_RAIO_MAX,
  AURA_RAIO_MIN,
  MODOS_RECURSOS,
  GRID_TOKENS_POR_CENA_MAX,
  MULTIPLICADORES_CORRIDA,
  TIPOS_TOKEN,
  TRAVAMENTOS,
  montarToken,
  normalizarAura,
  normalizarRecurso,
  primeiraCelulaLivre,
} from 'common/utils/grid';
import { reacaoDaFicha } from 'common/utils/gridCombate';
import { ACOES_CAMADA } from 'common/utils/gridCamadas';

// Jogadores que podem receber tokens: um por uid (dono da ficha), com os
// nomes dos personagens dele na campanha. `donosAtuais` garante que um uid já
// atribuído continue aparecendo mesmo se a ficha saiu da campanha.
export const opcoesDeDonos = (jogadores, donosAtuais = []) => {
  const porUid = new Map();
  jogadores.forEach(jogador => {
    if (!jogador.uid) return;
    porUid.set(jogador.uid, [
      ...(porUid.get(jogador.uid) ?? []),
      jogador.label,
    ]);
  });
  const opcoes = [...porUid].map(([uid, nomes]) => ({
    uid,
    label: nomes.join(', '),
  }));
  donosAtuais
    .filter(uid => !porUid.has(uid))
    .forEach(uid => opcoes.push({ uid, label: 'Jogador fora da campanha' }));
  return opcoes.sort((a, b) => a.label.localeCompare(b.label));
};

export const OPCOES_TAMANHO_TOKEN = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}×${i + 1}`,
}));

// "Adicionar todos os jogadores": um token 1×1 por personagem jogável da
// campanha que ainda não tem token de jogador nesta cena, já atribuído ao
// dono da ficha, cada um na primeira célula livre (respeitando o limite de
// tokens por cena).
export const jogadoresSemToken = (jogadores, tokens) => {
  const presentes = new Set(
    tokens
      .filter(token => token.tipo === TIPOS_TOKEN.JOGADOR && token.refId)
      .map(token => token.refId),
  );
  return jogadores.filter(jogador => !presentes.has(jogador.refId));
};

export const tokensDeJogadoresFaltantes = (jogadores, tokens, limites) => {
  const vagas = Math.max(GRID_TOKENS_POR_CENA_MAX - tokens.length, 0);
  const ocupados = [...tokens];
  return jogadoresSemToken(jogadores, tokens)
    .slice(0, vagas)
    .map(jogador => {
      const token = montarToken({
        nome: jogador.label,
        imagemUrl: jogador.avatar,
        tipo: TIPOS_TOKEN.JOGADOR,
        refId: jogador.refId,
        donos: jogador.uid ? [jogador.uid] : [],
        ...primeiraCelulaLivre(ocupados, 1, limites),
      });
      ocupados.push(token);
      return token;
    });
};

// ── Combate do token (TokenCombate) ─────────────────────────────────────
// PV/Energia/Fadiga de npc/criatura/avulso ficam no token como
// `{atual, max}` (common/utils/grid.js — normalizarRecurso); null = sem barra.

// Botões −/+: muda `atual` e mantém dentro de 0..max.
export const ajustarRecurso = (recurso, delta) =>
  recurso
    ? normalizarRecurso({ ...recurso, atual: recurso.atual + delta })
    : null;

// Campo `atual` ou `max` digitado → recurso novo. `max` vazio ou 0 remove a
// barra (null); `atual` vazio = cheio. `max` menor que `atual` puxa o atual.
export const recursoDigitado = (recurso, campo, texto) => {
  const valor = String(texto ?? '').trim();
  // Texto que não é número não muda nada.
  if (valor !== '' && !Number.isFinite(Number(valor))) return recurso ?? null;
  if (campo === 'max') {
    if (valor === '' || Number(valor) === 0) return null;
    return normalizarRecurso({ atual: recurso?.atual ?? valor, max: valor });
  }
  if (!recurso) return null;
  return normalizarRecurso({ ...recurso, atual: valor });
};

export const OPCOES_MOSTRAR_RECURSOS = [
  { value: MODOS_RECURSOS.OCULTO, label: 'Ocultos' },
  { value: MODOS_RECURSOS.BARRA, label: 'Só barras' },
  { value: MODOS_RECURSOS.NUMEROS, label: 'Barras e números' },
];

// Aura escolhida no painel: cor '' = sem aura (null); raio digitado é
// limitado a AURA_RAIO_MIN..AURA_RAIO_MAX (vazio/inválido = 1).
export const auraEscolhida = (cor, raioTexto) => {
  if (!cor) return null;
  const raio = Math.round(Number(raioTexto));
  return normalizarAura({
    cor,
    raio: Number.isFinite(raio)
      ? Math.min(Math.max(raio, AURA_RAIO_MIN), AURA_RAIO_MAX)
      : AURA_RAIO_MIN,
  });
};

// ── Combate da cena (Fase 3A) ───────────────────────────────────────────
// "Movimento" da cena: quem pode mover tokens (também fora de combate).
export const OPCOES_TRAVAMENTO = [
  { value: TRAVAMENTOS.LIVRE, label: 'Livre' },
  { value: TRAVAMENTOS.TURNO, label: 'Só na sua vez' },
  { value: TRAVAMENTOS.CONGELADO, label: 'Congelado' },
];

// "Correr" da cena: quantas vezes o deslocamento (config do grid).
export const OPCOES_CORRIDA = MULTIPLICADORES_CORRIDA.map(valor => ({
  value: valor,
  label: `${String(valor).replace('.', ',')}×`,
}));

// Reação do token para a iniciativa: jogador pela ficha ao vivo
// (`fichas[refId]`), NPC/Criatura pela ficha do catálogo guardada na persona
// (`fontes.npcs/criaturas/jogadores`). null = sem dados (o mestre informa).
export const reacaoDoToken = (token, { fichas = {}, fontes = {} } = {}) => {
  if (!token?.refId) return null;
  const daFicha = reacaoDaFicha(fichas[token.refId]);
  if (daFicha !== null && daFicha !== undefined) return daFicha;
  const persona = [
    ...(fontes.npcs ?? []),
    ...(fontes.criaturas ?? []),
    ...(fontes.jogadores ?? []),
  ].find(fonte => fonte.refId === token.refId);
  return Number.isFinite(persona?.reacao) ? persona.reacao : null;
};

// ── Ferramentas do mapa (Fase 3B) ───────────────────────────────────────
// Seletor da barra do Grid: com outra ferramenta além de Mover, o mapa edita
// paredes, névoa ou marcadores em vez de mover tokens.
export const FERRAMENTAS = {
  MOVER: 'mover',
  PAREDES: 'paredes',
  NEVOA: 'nevoa',
  MARCADORES: 'marcadores',
};

export const OPCOES_FERRAMENTA = [
  { value: FERRAMENTAS.MOVER, label: 'Mover' },
  { value: FERRAMENTAS.PAREDES, label: 'Paredes' },
  { value: FERRAMENTAS.NEVOA, label: 'Névoa' },
  { value: FERRAMENTAS.MARCADORES, label: 'Marcadores' },
];

export const FORMAS_PINCEL = { PINCEL: 'pincel', RETANGULO: 'retangulo' };

export const OPCOES_FORMA = [
  { value: FORMAS_PINCEL.PINCEL, label: 'Pincel' },
  { value: FORMAS_PINCEL.RETANGULO, label: 'Retângulo' },
];

// Paredes: adicionar/apagar. Névoa: revelar = adicionar às células reveladas,
// cobrir = remover delas (ACOES_CAMADA em common/utils/gridCamadas.js).
export const OPCOES_ACAO = {
  [FERRAMENTAS.PAREDES]: [
    { value: ACOES_CAMADA.ADICIONAR, label: 'Adicionar' },
    { value: ACOES_CAMADA.REMOVER, label: 'Apagar' },
  ],
  [FERRAMENTAS.NEVOA]: [
    { value: ACOES_CAMADA.ADICIONAR, label: 'Revelar' },
    { value: ACOES_CAMADA.REMOVER, label: 'Cobrir' },
  ],
};

export const OPCOES_FERRAMENTA_PADRAO = {
  forma: FORMAS_PINCEL.PINCEL,
  acao: ACOES_CAMADA.ADICIONAR,
  tamanho: 1,
};
