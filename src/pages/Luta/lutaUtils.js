// Configuração dos três status controlados na Luta — dirige tanto o
// render (label/cor) quanto os nomes dos campos no doc do participante
// (`${chave}Atual` / `${chave}Maxima`, ex.: vidaAtual/vidaMaxima).
export const STATS_LUTA = [
  { chave: 'vida', label: 'Vida', cor: '#ef4444' },
  { chave: 'fadiga', label: 'Fadiga', cor: '#f59e0b' },
  { chave: 'mana', label: 'Mana', cor: '#60a5fa' },
];

// A ficha de personagem do Re-Dungeon guarda vida/fadiga/mana em
// `status.{hp,fadiga,energia}.atual` e `statusMaximos.{hp,fadiga,energia}`
// quando o mestre preencheu esses campos — nem toda Criatura/NPC tem isso
// definido, então tudo aqui cai para 0 e fica editável na tela de Luta.
export const extrairStatusBase = personagem => ({
  vidaMaxima: personagem?.statusMaximos?.hp ?? 0,
  vidaAtual:
    personagem?.status?.hp?.atual ?? personagem?.statusMaximos?.hp ?? 0,
  fadigaMaxima: personagem?.statusMaximos?.fadiga ?? 0,
  fadigaAtual:
    personagem?.status?.fadiga?.atual ?? personagem?.statusMaximos?.fadiga ?? 0,
  manaMaxima: personagem?.statusMaximos?.energia ?? 0,
  manaAtual:
    personagem?.status?.energia?.atual ??
    personagem?.statusMaximos?.energia ??
    0,
});

// Gera "Nome", "Nome #2", "Nome #3"... a partir de quantos participantes já
// têm aquele nome na luta — permite ter várias cópias do mesmo NPC/Criatura
// (ex.: 5 "Rato Gigante") sem nomes duplicados na lista.
export const proximoNomeDuplicado = (nomeBase, participantesExistentes) => {
  const usados = new Set(participantesExistentes.map(p => p.nome));
  if (!usados.has(nomeBase)) return nomeBase;
  let indice = 2;
  while (usados.has(`${nomeBase} #${indice}`)) indice += 1;
  return `${nomeBase} #${indice}`;
};
