// Ajudas puras da tela Grid do mestre (o modelo do grid em si fica em
// common/utils/grid.js, compartilhado com o site dos jogadores).
import {
  GRID_TOKENS_POR_CENA_MAX,
  TIPOS_TOKEN,
  montarToken,
  primeiraCelulaLivre,
} from 'common/utils/grid';

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
