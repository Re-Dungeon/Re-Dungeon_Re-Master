// Ajudas puras da tela Grid do mestre (o modelo do grid em si fica em
// common/utils/grid.js, compartilhado com o site dos jogadores).

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
