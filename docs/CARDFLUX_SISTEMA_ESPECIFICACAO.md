# Sistema Cardflux — Especificação Técnica Completa

> Documento de referência extraído do sistema **Cardflux** do projeto Re: Dungeon - Ascensão Carmesim.
> Objetivo: servir de prompt/spec para um agente de IA implementar o **motor de execução e sorteio de cartas**
> (o cadastro das cartas já existe no projeto de destino com os mesmos campos).

---

## 1. Visão Geral

Cardflux é um sistema de **cartas de eventos narrativos** para RPG de mesa, sorteadas durante a "viagem"/exploração
dos jogadores. Cada carta representa um evento (emboscada, descoberta, evento social, etc.) que o mestre resolve
ao ser sorteado. O sistema tem duas partes bem separadas:

1. **Cadastro de Cartas (CRUD)** — já existe no projeto de destino, com os mesmos campos descritos na Seção 2.
2. **Motor de Execução (Cardflux Runtime)** — é o que falta implementar: uma "sessão de sorteio" onde o mestre
   configura parâmetros de viagem (distância, ritmo, sorte etc.), o sistema calcula quantas cartas serão compradas,
   filtra o pool de cartas elegíveis, sorteia com pesos, aplica cooldown/anti-repetição, e mostra o resultado com
   ações (descartar, retornar ao deck, comprar a próxima).

Não existe geração de cartas por IA neste sistema — todas as cartas são criadas manualmente pelo mestre e ficam
armazenadas localmente (localStorage). A IA aqui é só para *implementar o motor*, não para gerar conteúdo das cartas.

---

## 2. Modelo de Dados da Carta

Cada carta é um objeto simples (JSON), sem classes. Campos:

```ts
interface CardfluxCard {
  id: string;                 // ex: 'card_1730000000000_ab12cd3ef'
  nome: string;
  tipo: string;                // ver lista de tipos na Seção 4 (ex: 'Emboscada', 'Boss', 'Descoberta'...)
  intensidade: number;          // 1 a 10 — usado para filtro de "intensidade mínima" e para cor visual
  deck: string;                 // id de um dos decks temáticos (Seção 3), ex: 'floresta', 'dungeon'
  raridade: string;             // 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico' | 'Celestial'
  tags: string[];
  descricao: string;            // texto narrativo principal (o que o mestre lê em voz alta)
  contexto: string;              // contexto/gatilho de quando a carta se aplica
  testes: string;                // testes de atributo/perícia sugeridos
  sucessos: string;              // consequência em caso de sucesso no teste
  falhas: string;                 // consequência em caso de falha
  recompensas: string;
  consequencias: string;
  ganchos: string;                // ganchos de história/plot hooks
  imagemUrl: string;              // URL/base64 da arte da carta
  cooldown: number;               // nº de sorteios que a carta fica indisponível após ser puxada (0 = sem cooldown)
  pesoSorteio: number;            // peso relativo no sorteio ponderado (padrão 1)
  ativa: boolean;                 // se false, nunca entra no pool de sorteio
  dataCriacao: string;             // ISO string

  // Opcional — sistema de "Chain" (cartas encadeadas), ver Seção 15
  chain?: {
    ativa: boolean;
    tipoAtivacao: 'automatic' | 'optional' | 'chance';
    chancePorcentagem?: number;   // 0-100, só usado se tipoAtivacao === 'chance'
    cartas: Array<{
      cartaId: string;
      cartaNome: string;          // snapshot do nome (evita lookup se a carta original mudar)
      cartaTipo: string;
      cartaRaridade: string;
    }>;
    descricao?: string;            // texto narrativo mostrado quando a chain ativa
    ultimaModificacao?: number;
  };
}
```

Todas as cartas do usuário ficam num array simples: `armazenar.cardflux: CardfluxCard[]`.
Persistência: `localStorage.setItem('redungeon_cardflux', JSON.stringify(armazenar.cardflux))`.

Se o projeto de destino já tem as cartas criadas com os mesmos campos, **não recrie o modelo** — apenas
reaproveite o array/tabela existente como fonte do pool de sorteio.

---

## 3. Registro de Decks (categorias temáticas)

Os decks são só uma lista fixa de categorias (não precisam ser dinâmicos, mas podem ser). Cada carta pertence a
um deck via `carta.deck`. Exemplo de registro usado no projeto original:

```js
const DECKS_DISPONIVEIS = [
  { id: 'jornada', nome: '🛣️ Jornada', cor: '#4A90E2' },
  { id: 'floresta', nome: '🌲 Floresta', cor: '#2ECC71' },
  { id: 'tundra', nome: '❄️ Tundra / Gelo', cor: '#50E3C2' },
  { id: 'deserto', nome: '🏜️ Deserto', cor: '#F5A623' },
  { id: 'montanha', nome: '⛰️ Montanha', cor: '#95A5A6' },
  { id: 'pantano', nome: '🪱 Pântano', cor: '#8E7E6F' },
  { id: 'costa', nome: '🏖️ Costa / Praia', cor: '#3498DB' },
  { id: 'maraberto', nome: '🌊 Mar Aberto', cor: '#1E90FF' },
  { id: 'subterraneo', nome: '⛓️ Subterrâneo / Caverna', cor: '#34495E' },
  { id: 'vulcanico', nome: '🌋 Vulcânico / Infernal', cor: '#E74C3C' },
  { id: 'espiritual', nome: '✨ Plano Espiritual', cor: '#F8E71C' },
  { id: 'celestial', nome: '⭐ Plano Celestial', cor: '#FFD700' },
  { id: 'sombrio', nome: '🌑 Plano Sombrio / Abissal', cor: '#2C3E50' },
  { id: 'guerra', nome: '⚔️ Guerra', cor: '#C0392B' },
  { id: 'cerco', nome: '🏰 Cerco / Invasão', cor: '#D35400' },
  { id: 'perseguicao', nome: '🏃 Perseguição', cor: '#E67E22' },
  { id: 'boss', nome: '👹 Boss / Eventos Lendários', cor: '#8B0000' },
  { id: 'cidade', nome: '🏘️ Cidade / Urbano', cor: '#9013FE' },
  { id: 'dungeon', nome: '🗝️ Dungeon / Ruínas', cor: '#7B68EE' },
  { id: 'presagios', nome: '🔮 Presságios / Plot', cor: '#B19CD9' },
  { id: 'social', nome: '🤝 Social / Diplomacia', cor: '#6C5B7B' }
];
```

> Ajuste essa lista para o tema do novo projeto — o importante é manter a mesma **relação 1:N** (carta.deck aponta
> para o id de um item deste registro). O sorteio permite selecionar "todos" os decks juntos ou um deck específico.

---

## 4. Tipos e Raridades

```js
const TIPOS_CARTA = [
  'Emboscada', 'Obstáculo', 'Descoberta', 'Social', 'Catástrofe', 'Presságio', 'Boss',
  'Mistério', 'Perseguição', 'Sobrevivência', 'Exploração', 'Interação', 'Encontro',
  'Evento Ambiental', 'Evento Sobrenatural'
  // (no protótipo simplificado também aparece só ['Flash Event', 'Scene Event'] — escolha o nível de
  // granularidade que fizer sentido pro seu jogo; isso é só metadado, não afeta a lógica de sorteio)
];

const RARIDADES = ['Comum', 'Raro', 'Épico', 'Lendário', 'Mítico', 'Celestial'];

// Cor por raridade (usado em UI)
const CORES_RARIDADE = {
  'Comum': '#95A5A6',
  'Raro': '#3498DB',
  'Épico': '#9B59B6',
  'Lendário': '#F39C12',
  'Mítico': '#E74C3C',
  'Celestial': '#FFD700',
  'Encadeada': '#7ED321' // cor especial reservada para cartas exibidas via Chain (Seção 15)
};

// Cor por faixa de intensidade (1-10)
function obterCorIntensidade(intensidade) {
  if (intensidade <= 2) return '#3498DB'; // baixa
  if (intensidade <= 4) return '#2ECC71'; // moderada
  if (intensidade <= 6) return '#F39C12'; // média
  if (intensidade <= 8) return '#E74C3C'; // alta
  return '#8B0000';                        // muito alta
}
```

Raridade e tipo são **só metadados narrativos/visuais** — eles não entram na fórmula de sorteio (o sorteio usa
`pesoSorteio`, não raridade). Se quiser que raridade afete a chance de sorteio, o mais simples é derivar
`pesoSorteio` a partir da raridade no cadastro da carta (isso já é feito manualmente no projeto original).

---

## 5. Persistência

Duas chaves de localStorage (ou equivalente no storage do novo projeto — pode ser IndexedDB, arquivo, backend, etc.):

| Chave | Conteúdo | Quando salva |
|---|---|---|
| `redungeon_cardflux` (renomeie para o novo projeto) | Array completo de cartas cadastradas | Toda vez que uma carta é criada/editada/deletada |
| `cardfluxExecucao_estado` | Snapshot do estado da sessão de sorteio (Seção 6) | Ao fechar o modal/tela de execução |

O estado de execução é restaurado automaticamente se existir ao reabrir a tela — isso permite ao mestre fechar o
modal no meio de uma sessão e continuar depois sem perder histórico/cooldowns.

---

## 6. Estado de Execução (sessão de sorteio)

Um objeto global único que representa **a sessão atual** de sorteio (não é persistido por carta, é por sessão):

```js
let cardfluxExecucao = {
  // Configuração da sessão (inputs do mestre)
  deckAtivo: 'todos',           // id de deck ou 'todos'
  distanciaBase: 4,             // "quantidade base de cartas" da viagem
  ritmo: 0,                     // modificador por ritmo de viagem (pode ser negativo)
  modificadorSorte: 0,          // modificador manual de sorte (-5 a +5)
  atraso: 0,                    // aumenta o total de cartas (eventos que atrasam o grupo)
  acelerar: 0,                  // reduz o total de cartas (eventos que aceleram o grupo)
  intensidadeMinima: 1,         // filtra cartas com intensidade abaixo disso

  // Estado do sorteio
  cartasOrdenadas: [],          // pool filtrado e válido no momento (recalculado a cada sorteio)
  cartaSorteada: null,          // última carta sorteada
  cartasUsadas: [],             // ids de cartas já sorteadas nesta sessão (para anti-repetição)
  cartasDescartadas: [],        // ids de cartas descartadas manualmente (saem do pool até reembaralhar)

  // Gerenciamento
  cooldowns: {},                // { [cartaId]: turnosRestantes }
  historico: [],                // lista de sorteios já feitos nesta sessão
  totalCartasPlanejadas: 0,     // resultado da fórmula da Seção 8
  cartasCompradas: 0,           // quantas já foram sorteadas nesta sessão

  // Configurações avançadas
  evitarRepeticion: true,       // ativa a penalidade de peso para cartas já usadas
  penalidade_reuso: 0.5         // multiplicador de peso (0.5 = reduz peso em 50%) para cartas já usadas
};
```

Este objeto vive em memória durante a sessão e é serializado/restaurado inteiro do localStorage
(`JSON.stringify(cardfluxExecucao)` / `JSON.parse(...)`) ao abrir/fechar a tela de execução.

---

## 7. Fluxo de Uso (do ponto de vista do mestre)

1. Mestre abre a tela/modal de **"Sorteio de Cartas"**.
   - Se não existir sessão salva → começa uma sessão nova (zera histórico, cooldowns, contadores).
   - Se existir sessão salva no storage → restaura tudo (histórico, cooldowns, config dos campos).
2. Mestre configura:
   - **Deck** (ou "todos os decks").
   - **Distância base** (quantas cartas a viagem "vale" por padrão).
   - **Ritmo da viagem** (cauteloso aumenta cartas, rápido/voando reduz).
   - **Sorte** (modificador livre do mestre, -5 a +5).
   - **Atraso** (input livre que sempre aumenta o total).
   - **Acelerar** (input livre que sempre reduz o total).
   - **Intensidade mínima** (filtra cartas fracas se quiser só eventos fortes).
3. O sistema recalcula o **Total de Cartas Planejadas** (Seção 8) a cada mudança nesses campos.
4. Mestre clica em **"Comprar Carta"** → o sistema sorteia (Seção 10) uma carta do pool válido (Seção 9),
   mostra ela em destaque, registra no histórico, aplica cooldown se a carta tiver, e verifica chain (Seção 15).
5. Após ver a carta, o mestre pode:
   - **Descartar** — a carta sai do pool até reembaralhar (mas não conta cooldown).
   - **Retornar ao deck** — desfaz cooldown/descarte imediatamente (é um "oops, não vale").
   - **Comprar a próxima** — repete o sorteio, desde que `cartasCompradas < totalCartasPlanejadas`.
6. Quando atinge o total planejado, o sistema bloqueia novos sorteios e pede para "Reembaralhar" (Seção 13) para
   iniciar uma nova sessão/viagem.
7. Mestre pode a qualquer momento **"Limpar Cooldowns"** (zera todos os cooldowns sem resetar histórico) ou
   **"Reembaralhar"** (reset completo da sessão).

---

## 8. Fórmula do Total de Cartas

```
total = max(1, distanciaBase + ritmo + modificadorSorte + atraso - acelerar)
```

- `distanciaBase`: escolhida de uma lista de opções pré-definidas (ex.: 1, 3, 5, 7, 9 ... representando
  "poucos passos" até "distância incalculável"). Pode ser um número livre também.
- `ritmo`: positivo quando a viagem é mais cautelosa/lenta (mais eventos), negativo quando é rápida
  (menos eventos). Ex.: Peregrinação = +11, Normal = 0, Teleporte = -9.
- `modificadorSorte`: input manual livre do mestre.
- `atraso`: sempre soma (nunca é negativo na UI — é um input com `min="0"`).
- `acelerar`: sempre subtrai (também só aceita valores >= 0 na UI).
- O resultado nunca é menor que 1.

Esse total é só o **limite de quantas cartas podem ser compradas na sessão**; não define quais cartas serão
sorteadas (isso é o pool + peso, Seções 9 e 10).

---

## 9. Filtro do Pool de Cartas Válidas

Antes de cada sorteio, recalcule o pool a partir de **todas as cartas cadastradas**, aplicando em ordem:

1. `carta.ativa === true` (cartas desativadas nunca entram).
2. `carta.intensidade >= intensidadeMinima` selecionada na sessão.
3. Sem cooldown ativo: `cooldowns[carta.id]` inexistente ou `<= 0`.
4. Deck bate com o selecionado, **ou** deck selecionado é `'todos'`.
5. Carta não está na lista `cartasDescartadas` da sessão atual.

Se o pool resultante for vazio, avise o mestre (ex.: "nenhuma carta disponível, todas em cooldown") e não sorteie.

---

## 10. Algoritmo de Sorteio Ponderado com Anti-Repetição

```js
function sortearCarta(pool, sessao) {
  // 1. Calcular peso final de cada carta
  let cartas = pool.map(c => ({ ...c, pesoFinal: c.pesoSorteio || 1 }));

  // 2. Anti-repetição: se a carta já foi sorteada nesta sessão, reduzir peso
  if (sessao.evitarRepeticion) {
    cartas = cartas.map(c =>
      sessao.cartasUsadas.includes(c.id)
        ? { ...c, pesoFinal: (c.pesoSorteio || 1) * sessao.penalidade_reuso }
        : c
    );
  }

  // 3. Sorteio ponderado (roleta cumulativa)
  const pesoTotal = cartas.reduce((soma, c) => soma + c.pesoFinal, 0);
  let alvo = Math.random() * pesoTotal;
  let acumulado = 0;
  let sorteada = cartas[0];
  for (const c of cartas) {
    acumulado += c.pesoFinal;
    if (alvo <= acumulado) { sorteada = c; break; }
  }
  return sorteada;
}
```

Após sortear:
- Adicionar `sorteada.id` a `cartasUsadas` (se ainda não estiver lá) — isso é o que alimenta a penalidade de
  reuso nos próximos sorteios da mesma sessão.
- Se `sorteada.cooldown > 0`, setar `cooldowns[sorteada.id] = sorteada.cooldown`.
- Incrementar `cartasCompradas`.
- Adicionar entrada ao `historico` (ver Seção 14).
- Checar sistema de Chain (Seção 15).
- **Depois** de tudo isso, decrementar em 1 todos os cooldowns ativos de outras cartas (`decrementarCooldowns`) —
  isso simula "o tempo passa a cada carta sorteada", liberando cartas em cooldown progressivamente.

```js
function decrementarCooldowns(sessao) {
  Object.keys(sessao.cooldowns).forEach(id => {
    if (sessao.cooldowns[id] > 0) sessao.cooldowns[id]--;
  });
}
```

---

## 11. Sistema de Cooldown

- Cada carta tem um campo `cooldown` (número de sorteios que ela fica bloqueada depois de sair).
- `cooldown = 0` significa que a carta pode repetir livremente (sujeita só à penalidade de anti-repetição).
- O cooldown é **por sessão** (`sessao.cooldowns`), não altera o cadastro da carta.
- "Limpar Cooldowns" zera `sessao.cooldowns = {}` sem afetar histórico nem contadores.
- "Reembaralhar" (Seção 13) também zera cooldowns, como parte do reset total.

---

## 12. Ações Pós-Sorteio

Depois de exibir a carta sorteada, oferecer 3 botões:

- **🗑️ Descartar**: `sessao.cartasDescartadas.push(cartaSorteada.id)`. A carta sai do pool até o próximo
  "Reembaralhar". Não desfaz o cooldown nem o contador de cartas compradas (a compra já aconteceu).
- **↩️ Retornar ao Deck**: remove a carta de `cooldowns` e de `cartasDescartadas` imediatamente — usado quando o
  mestre decide que aquele sorteio "não valeu" e quer devolver a carta ao pool na hora.
- **🎲 Próxima**: chama o sorteio de novo (Seção 10), respeitando o limite de `totalCartasPlanejadas`.

---

## 13. Reembaralhar (Reset de Sessão)

Reset completo, usado para começar uma nova "viagem"/sessão de sorteio:

```js
function reembaralhar(sessao) {
  sessao.cartasDescartadas = [];
  sessao.cartasUsadas = [];
  sessao.cooldowns = {};
  sessao.historico = [];
  sessao.cartasCompradas = 0;
  // recalcular totalCartasPlanejadas com os campos de configuração atuais
}
```

Note que **não** reseta a configuração da sessão (deck, distância, ritmo etc.) — só o estado de progresso do
sorteio. Isso permite reembaralhar mantendo os mesmos parâmetros de viagem.

---

## 14. Histórico de Sorteios

Cada entrada do histórico é um registro leve (não a carta inteira, para casos de a carta original ser editada
depois):

```js
sessao.historico.push({
  cartaId: sorteada.id,
  carta: sorteada.nome,
  raridade: sorteada.raridade,
  deck: sorteada.deck,
  timestamp: new Date().toLocaleTimeString(),
  numero: sessao.cartasCompradas   // posição no sorteio (1, 2, 3...)
});
```

Ao clicar num item do histórico, buscar a carta completa atual pelo `cartaId` (`array.find`) e mostrar os
detalhes completos dela (descrição, contexto, testes, sucesso/falha/recompensas/consequências) — assim a
listagem do histórico sempre reflete o conteúdo atualizado da carta, mesmo que ela tenha sido editada depois do
sorteio.

O histórico e a carta sorteada atual devem ser restauráveis ao reabrir a tela (Seção 5/6), incluindo re-renderizar
os detalhes da última carta mostrada.

---

## 15. Sistema de Chain (Cartas Encadeadas) — opcional/avançado

Permite que uma carta, ao ser sorteada, "puxe" automaticamente outras cartas vinculadas (para criar sequências
narrativas, ex.: "Emboscada" sempre revela "Recompensa do Saque" em seguida). Implemente isso só se o novo projeto
quiser esse nível de sofisticação — não é essencial ao motor básico de sorteio.

Estrutura (repetida da Seção 2):

```ts
chain: {
  ativa: boolean;
  tipoAtivacao: 'automatic' | 'optional' | 'chance';
  chancePorcentagem?: number; // só para 'chance'
  cartas: { cartaId, cartaNome, cartaTipo, cartaRaridade }[];
  descricao?: string;
}
```

Ao sortear uma carta que tenha `chain.ativa === true`, decidir se exibe a chain conforme `tipoAtivacao`:

- **`automatic`**: sempre exibe as cartas vinculadas junto com a principal.
- **`chance`**: `Math.random() * 100 <= chancePorcentagem` decide se exibe.
- **`optional`**: mostra um modal de confirmação perguntando "Deseja visualizar os eventos encadeados?" — só
  exibe a chain se o mestre confirmar.

Cartas vinculadas são resolvidas por `cartaId` no array principal de cartas (filtrando as que ainda estão
`ativa !== false`). Se a chain apontar para uma carta apagada ou desativada, ela é ignorada silenciosamente.

Exibição sugerida: um modal separado listando as cartas encadeadas (nome, tipo, raridade, descrição) com um
selo indicando o motivo da ativação (⚡ automática / 🎲 chance / ✅ escolha do mestre).

---

## 16. Sugestão de UI (tela/modal de execução)

Layout usado no projeto original (adapte livremente ao design system do novo projeto):

- **Painel de configuração** no topo: selects de Deck, Distância, Ritmo; inputs numéricos de Sorte, Atraso,
  Acelerar, Intensidade Mínima; e um indicador "Total: X (compradas/planejadas)" atualizado em tempo real.
- Botões **"Limpar Cooldowns"** e **"Reembaralhar"** ao lado da configuração.
- Botão grande **"🎲 Comprar Carta"**.
- Duas colunas abaixo: **carta sorteada em destaque** (imagem, nome, tipo, intensidade, deck, raridade, badge de
  cooldown) à esquerda, e **histórico da sessão** (lista clicável) à direita.
- Painel expandido abaixo mostrando os detalhes completos da carta (descrição, contexto, testes, sucesso, falha,
  recompensas, consequências) quando uma carta do histórico (ou a atual) é selecionada.
- Botões de ação pós-sorteio (Descartar / Retornar / Próxima) logo abaixo da carta em destaque.

---

## 17. Passo a Passo Sugerido de Implementação

1. **Reaproveitar o array/tabela de cartas já existente** no novo projeto (mesmos campos da Seção 2) como fonte
   única de verdade — não duplicar dados.
2. Criar o registro de **decks** (Seção 3) — mesmo que seja só uma lista estática de categorias do novo jogo.
3. Implementar o objeto de **estado de sessão** (`cardfluxExecucao`, Seção 6) e sua persistência
   (salvar ao fechar/pausar, restaurar ao abrir).
4. Implementar `calcularTotalCartas()` (Seção 8) reagindo a mudanças nos campos de configuração.
5. Implementar `atualizarPoolValido()` (Seção 9) — filtro de cartas elegíveis.
6. Implementar `sortearCarta()` (Seção 10) com peso + anti-repetição, e o `decrementarCooldowns()` associado.
7. Implementar as ações pós-sorteio: descartar, retornar, próxima (Seção 12).
8. Implementar `reembaralhar()` e `limparCooldowns()` (Seção 13/11).
9. Implementar o histórico de sessão com detalhe expandido (Seção 14).
10. (Opcional) Implementar o sistema de Chain (Seção 15) só se o jogo precisar de eventos encadeados.
11. Construir a UI de execução (Seção 16) reaproveitando os componentes visuais que o novo projeto já usa.

Esse motor é **independente de framework** — toda a lógica das Seções 8 a 15 é JS puro operando sobre arrays e
objetos simples, então pode ser portada para React/Vue/vanilla/backend sem alterações conceituais, apenas
adaptando onde o estado vive (useState/store/etc.) e como a UI re-renderiza.
