# Claude Instructions - Re:Master

## Visão Geral do Projeto

Esta é uma aplicação frontend para o **Re:Master**, o Centro de Comando do Mestre — um painel para conduzir sessões de RPG de mesa. Ele permite organizar o fluxograma de uma Campanha (cenas ramificadas, não lineares), NPCs, Criaturas, Mapas, Missões, CardFlux e Notas, entre outras informações relevantes para rodar uma sessão.

Re:Master é um projeto irmão do **Re-Dungeon** (banco de dados de campanha de RPG) e compartilha com ele o **mesmo projeto Firebase** (mesmo Firestore, mesmos usuários/Auth, mesmo modelo de permissão por Universo). O Re:Master consome dados que o Re-Dungeon gerencia (Universos, personagens) e adiciona suas próprias coleções por cima, todas prefixadas com `rm` (`rmCampanhas`, `rmCenas`, etc.) para nunca colidir com as coleções do Re-Dungeon.

### Tech Stack
- **React 19** com **Vite** como bundler
- **Material-UI (@mui/material)** para componentes de UI
- **Styled Components** para estilização customizada
- **React Router DOM v7** para navegação
- **Formik** com **Yup** para formulários e validação
- **@xyflow/react** (React Flow) + **Dagre** para o fluxograma da Campanha
- **Firebase/Firestore** como camada de persistência de dados (via `service/storage.js`)
- **Firebase Auth** para autenticação de usuários

### Persistência de Dados
Toda a persistência é feita via **Firebase/Firestore** através do serviço `src/service/storage.js`. Não há uso de `localStorage` no projeto — cada entidade nova do Re:Master (Campanhas, Cenas, Conexões de Cena, NPCs, Criaturas, Mapas, Missões, CardFlux, Notas) é uma coleção Firestore própria, prefixada com `rm`, acessada por funções CRUD (`get*`/`add*`/`remove*`/`update*`) que seguem o mesmo padrão genérico das entidades do Re-Dungeon já presentes em `storage.js`. As coleções `Universo` e `userPermissions` são geridas pelo Re-Dungeon e somente-leitura pelo Re:Master (`getUniversos`, `getUserPermissions`); a coleção `personagens` também pertence ao Re-Dungeon e é a fonte de importação de NPCs/Criaturas (filtrada por um campo `tipo`).

---

## Arquitetura

### Estrutura de Pastas
```
src/
├── assets/            # Imagens e recursos estáticos
├── common/
│   ├── constants/     # Constantes globais (rotas, itens de nav)
│   ├── styles/        # CSS global e estilos compartilhados
│   └── utils/         # Utilitários compartilhados (schemas Yup, ordenação)
├── components/        # Componentes reutilizáveis
│   ├── Header/, Layout/, Sidebar/                # Casca da aplicação
│   ├── LoginModal/, ProtectedRoute/, ErrorBoundary/  # Autenticação
│   └── EntityFilters/, EntityViewDialog/, FormActions/,
│       FormPageHeader/, ImagePreviewPanel/, SectionTitle/  # Padrões de lista/formulário
├── hooks/             # Hooks reutilizáveis (useUniversos, useEntityCRUD,
│                        useEntityFormGuard, useStableListKeys, usePermissions)
├── pages/             # Uma pasta por módulo
│   ├── Dashboard/
│   ├── Campanha/      # Fluxograma de cenas (React Flow)
│   ├── Npcs/
│   ├── Criaturas/
│   ├── Mapas/
│   ├── Missoes/
│   ├── CardFlux/
│   └── Notas/
├── routes/            # Definição das rotas
└── service/
    └── storage.js     # Camada de acesso ao Firestore
```

### Autenticação e Permissões

A aplicação usa **Firebase Auth** (`src/service/firebase.js`) com três fluxos de login: e-mail/senha, cadastro e Google (popup). Como o projeto Firebase é compartilhado com o Re-Dungeon, os mesmos usuários e o mesmo modelo de permissão por Universo valem aqui, sem nenhum código de autenticação adicional.

- **`src/context/AuthContext.jsx`** — `AuthProvider` + hook `useAuth()`. Expõe `{ currentUser, loading, login, signup, loginWithGoogle, logout, isAdmin, allowedUniversos, loadingPermissions, canCreate, canWrite }`.
- **`src/hooks/usePermissions.js`** — `usePermissions(currentUser)` calcula permissões a partir do documento `userPermissions/{uid}` no Firestore (mesmo documento usado pelo Re-Dungeon):
  - `isAdmin`: booleano.
  - `allowedUniversos`: lista de IDs de Universo em que o usuário pode escrever.
  - `canCreate()`: `true` se `isAdmin` ou `allowedUniversos.length > 0`.
  - `canWrite(universoId)`: `true` se `isAdmin` ou `universoId` está em `allowedUniversos`.
- **`src/hooks/useEntityFormGuard.js`** — hook que encapsula o padrão repetido em toda página `Nova*`/`Novo*`: busca os universos (via `useUniversos`), filtra por `allowedUniversos`/`isAdmin` e redireciona para uma rota de fallback caso o usuário não tenha permissão de criar/editar.
- **`src/components/ProtectedRoute/ProtectedRoute.jsx`** — guarda de rota (layout route) que bloqueia acesso enquanto `loading` é `true` ou quando não há `currentUser`; não valida `canCreate`/`canWrite` (isso é feito dentro de cada página).
- **`src/components/LoginModal/LoginModal.jsx`** — UI de login (e-mail/senha + Google), consumida via `useAuth()`.

Uma **Campanha** (`rmCampanhas`) pertence a um Universo (`universoId`) e a um mestre dono (`mestreId`, o `uid` de quem a criou). Diferente das coleções do Re-Dungeon (públicas para leitura de qualquer autenticado), todo o conteúdo do Re:Master é **privado ao mestre dono da campanha** — outro colaborador com acesso de escrita ao mesmo Universo não enxerga as campanhas de outro mestre. Ao criar uma página com operações de escrita, use `canCreate()`/`canWrite(universoId)` de `useAuth()` para exibir/ocultar botões de criar, editar e remover, e sempre grave `universoId` + `mestreId` no documento (ver seção Firestore Rules abaixo).

### Padrão de Arquivos por Página
Cada página pode conter:
- **`NomePagina.jsx`** — Componente principal da página
- **`styles.js`** — Styled components da página
- **`constants.js`** — Constantes específicas da página (listas, enums, etc.)
- **`utils.js`** — Funções utilitárias e schemas Yup

---

## Padrões de Código

### Convenções JavaScript/JSX

#### Regras Gerais
- Use **ES6+** (arrow functions, destructuring, template literals)
- Prefira **const** sobre let; evite var
- Use **async/await** quando aplicável
- Siga princípios de **programação funcional** onde possível

#### Nomenclatura
- **camelCase** para variáveis, funções e métodos
- **PascalCase** para componentes e classes
- **SCREAMING_SNAKE_CASE** para constantes
- **PascalCase** para nomes de arquivos de componentes

#### Organização de Imports
```javascript
// 1. Bibliotecas externas
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { Formik, Form } from 'formik';

// 2. Serviços e utilitários internos (use caminhos absolutos)
import { getRmNpcs, addRmNpc } from 'service/storage';
import { MINHA_CONSTANTE } from './constants';
import { meuSchema } from './utils';

// 3. Imports relativos (estilos, componentes locais)
import { MeuStyledComponent } from './styles';
```
- **Prefira caminhos absolutos** (ex: `import X from 'service/storage'`) sobre relativos quando possível.

---

### Estrutura de Componentes React

```jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';

const NomeComponente = ({ prop1, prop2 = 0, onAcao }) => {
  // 1. Hooks
  const [estado, setEstado] = useState(valorInicial);

  // 2. Handlers de eventos
  const handleAcao = () => {
    // implementação
  };

  // 3. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

NomeComponente.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  onAcao: PropTypes.func.isRequired,
};

export default NomeComponente;
```

**Valores padrão de props**: no destructuring (`({ prop2 = 0, itens = ITENS_VAZIOS, onAcao }) =>`), nunca `Componente.defaultProps` — o **React 19 ignora `defaultProps` em componentes de função** (o padrão some em silêncio). Padrão de array/objeto que entra em dependência de hook (`useMemo`/`useCallback`/`useEffect`) vira **constante de módulo** (`const ITENS_VAZIOS = []`), senão a referência muda a cada render.

---

### Estilização

#### Styled Components
- Crie componentes estilizados em arquivos `styles.js` separados.
- Use as variáveis CSS definidas em `src/common/styles/global.css`.
- Siga o padrão glassmorphism/dark theme do projeto.

```javascript
import styled from 'styled-components';
import Paper from '@mui/material/Paper';

export const MeuCard = styled(Paper)`
  padding: 20px !important;
  background: var(--bg-card) !important;
  border: 1px solid var(--border-primary) !important;
  border-radius: 12px !important;
  transition: all 0.25s ease !important;

  &:hover {
    border-color: var(--border-hover) !important;
    transform: translateY(-2px);
    box-shadow: var(--shadow-md) !important;
  }
`;
```

#### Variáveis CSS Globais Disponíveis
```css
/* Cores principais */
--color-primary: #6f2da8;
--color-accent: #00d9ff;

/* Backgrounds */
--bg-primary: #050816;
--bg-secondary: #0b1020;
--bg-card: #10182b;

/* Texto */
--text-primary
--text-secondary
--text-muted

/* Bordas e sombras */
--border-primary
--border-hover
--shadow-md
```

#### Integração com Material-UI
- Use componentes MUI como base (Box, Typography, Button, Dialog, etc.).
- Customize com prop `sx` ou styled-components.
- Mantenha o tema escuro e consistência visual em todas as páginas.

---

### Serviço de Armazenamento

Todas as operações de dados devem passar por `service/storage.js`:

```javascript
// Leitura
import { getRmCenas, getRmNpcs } from 'service/storage';

// Criação
import { addRmCena, addRmNpc } from 'service/storage';

// Remoção
import { removeRmCena, removeRmNpc } from 'service/storage';

// Atualização
import { updateRmCena, updateRmNpc } from 'service/storage';
```

Ao adicionar uma nova entidade ao sistema:
1. Escolha um nome de coleção prefixado com `rm` (ex.: `rmMapas`) — nunca reutilize um nome de coleção do Re-Dungeon ou de outro projeto irmão, mesmo que pareça equivalente.

> **Exceção — CardFlux**: o módulo CardFlux não cria baralhos nem cartas. Ele só lê a coleção `cardflux` (gerida por um projeto irmão, no mesmo Firestore, leitura liberada a qualquer autenticado) filtrando pelo campo `universo` (id do Universo). "Baralho" não é uma entidade própria — é só o agrupamento das cartas pelo campo `deck`. Uma carta cadastrada no projeto irmão para aquele Universo aparece no Re:Master automaticamente, sem sincronização. A única coisa que o Re:Master grava é o estado de sorteio de cada carta dentro de uma Campanha (no baralho / comprada / descartada), na coleção própria `rmCardfluxEstados` (um doc por par campanha+carta) — nunca escreva em `cardflux`.
> **Exceção — Chat da campanha** (`pages/Chat/`, rota `/chat`): primeiro conteúdo `rm*` compartilhado com jogadores. Subcoleções `rmCampanhas/{id}/chatMensagens` (mensagens) e `rmCampanhas/{id}/chatMembros` (ponteiro `{uid, personagemId}` gravado só pelo site dos jogadores). Os docs **não** denormalizam `universoId`/`mestreId` — a regra lê `mestreId` do doc pai e o personagem do jogador via `get()` (bloco do chat no fim de `firestore.rules`). Usa `onSnapshot` (`subscribeChatMensagens`, devolve o `unsubscribe`) — junto com o Grid, os únicos listeners em tempo real do projeto. O "Falando como" do mestre lista ele mesmo + os NPCs/Criaturas da campanha (`pages/Chat/chatPersonas.js`, mesma fonte das telas de NPCs/Criaturas, com nome/imagem do clone vencendo os do personagem); a mensagem grava `persona: 'mestre'|'npc'|'criatura'`. Rolagem de dados (botão d20 + comando `/r`, `/rs`/`/gr` secreta) vem de `common/utils/dados.js` (cópia); rolagens secretas ficam em `rmCampanhas/{id}/chatSecretas/{uid}/rolagens` e o mestre vê as de todos os membros. Macros Lua da campanha (ícone `</>` / `/m nome`, gerenciadas pelo mestre, executadas por todos): `rmCampanhas/{id}/macros`, runtime isolado em `common/lua/` (fengari num Web Worker, sem acesso ao Firebase), editor CodeMirror lazy — ver `vite.config.js` para o stub dos módulos Node do fengari no worker e o `optimizeDeps` do dev (Vite 8: `rolldownOptions.transform.define`). Escuta/envio/rolagem/macros ficam no hook `hooks/useChatCampanha.js` (+ `hooks/useMacrosCampanha.js`) — também cópia do site dos jogadores (por isso `storage.js` exporta `setChatMembro`, que o Re:Master nunca chama). `components/Chat/` e `common/utils/chat.js` são cópias dos do site dos jogadores (Ficha-RPG---Re-Dungeon-) — mudou um, mude o outro. **Música da mesa**: o ícone 🎵 do chat deixa o mestre tocar um vídeo do YouTube para todos com a mesa aberta (`rmCampanhas/{id}/audio/atual`, `subscribeAudioMesa`/`setAudioMesa`, `hooks/useAudioMesa.js` e o player escondido `components/Chat/PlayerAudioMesa.jsx` — montado no ChatMestre; no Grid o painel de chat só é escondido, nunca desmontado, para a música não parar). A sala do mestre fica em `pages/Chat/ChatMestre.jsx` (personas carregadas por `pages/Chat/useFontesDaMesa.js`), reaproveitada pelo Grid.

> **Exceção — Grid da campanha** (`pages/Grid/`, rota `/grid`): mapa tático em tempo real compartilhado com os jogadores (`/campanhas/:id/grid` no site deles). Organizado em **cenas** (independentes das Cenas narrativas `rmCenas`): `rmCampanhas/{id}/gridCenas/{cenaId}` guarda nome + imagem + grade (a imagem pode vir dos Mapas da campanha) e `metrosPorQuadrado` (opcional, 0,1–100, padrão 1,5 — editável no painel "Configurar grid"), e `gridCenas/{cenaId}/tokens` os tokens dela (posições e tamanho em células, `donos` = uids que podem mover, `oculto` = só o mestre vê, `rastro` = polilinha `[{col, lin}]` do último movimento (≤ 50 vértices, `montarRastro`) e `movidoEm` = `serverTimestamp()` desse movimento); `rmCampanhas/{id}/grid/atual` = `{cenaAtivaId}` é a cena que os jogadores veem (`setGridCenaAtiva`) — as outras ficam em segredo. Escritas: `addGridCena` (com tokens iniciais, em batch)/`updateGridCena`/`duplicarGridCena`/`removeGridCena` (apaga tokens, pings, camadas, marcadores, desenhos, templates e o combate junto) e `addGridTokens`/`updateGridToken`/`removeGridToken`. Também usa `onSnapshot` (`subscribeGridCenaAtiva`/`subscribeGridCenas`/`subscribeGridCena`/`subscribeGridTokens`/`subscribeGridPings`/`subscribeGridCombate`/`subscribePersonagem`; hooks `hooks/useGridCampanha.js` e `pages/Grid/useCenasDoGrid.js`). O jogador só altera `col`/`lin` + `rastro`/`movidoEm` dos tokens dele — regra no bloco do grid em `firestore.rules`. **Rastro + distância**: `moverGridToken(..., col, lin, rastro)` grava a posição, o rastro e `movidoEm` numa escrita só; todos os clientes mostram o caminho (distância Chebyshev, rótulo `"4 q · 6 m"`) por 10 s quando chega um `movidoEm` novo, encadeando movimentos seguidos. Token oculto não persiste rastro (só local); se a regra recusar o rastro (regras antigas), o hook regrava só `col`/`lin`. `duplicarGridCena` não copia `rastro`/`movidoEm`. A **régua** (botão "Régua" ou Shift+arrastar) é **local** — não grava nada nem aparece para os outros. **Fase 2 — combate, sinais e seguir**: o token ganhou `pv`/`energia`/`fadiga` (`{atual, max}` inteiros, 0 ≤ atual ≤ max, 1 ≤ max ≤ 99999; null/ausente = sem barra — só npc/criatura/avulso; o token novo de NPC/Criatura entra cheio a partir da ficha, `recursosIniciais` via `pages/Chat/chatPersonas.js`), `mostrarRecursos` (`'oculto'` padrão | `'barra'` | `'numeros'` — o que os jogadores veem), `condicoes` (ids do catálogo `condicoes` do universo, ≤ 20, carregado com `getCondicoes`) e `aura` (`{raio 1–999, cor #RRGGBB}` ou null; vale para todos os tipos). Só o mestre grava esses campos: `pages/Grid/TokenCombate.jsx` (no topo do TokenPainel; ajudas em `gridMestre.js`) grava **na hora** cada alteração via `updateGridToken` — independente do "Salvar token", e sem `Switch` (o teste do painel conta com um único switch). Token de **jogador** lê PV/Energia/Fadiga e `condicoesAtivas` da ficha ao vivo (`subscribePersonagem`, só leitura; `hooks/useFichasDoGrid.js`) — no painel aparece só o resumo. ⚠️ O sigilo de `mostrarRecursos: 'oculto'` é **só na interface** (o doc do token é legível pelo jogador). **Sinais (ping)**: segurar 3 s no mapa (ou Alt+clique) mostra um anel por 3 s para todos — um doc por pessoa em `gridCenas/{cenaId}/pings/{uid}` (`{x, y, puxar, nome?, criadoEm}`, sobrescrito; `setGridPing`/`subscribeGridPings`, `hooks/useGridPings.js`); o botão "Puxar vista" (ou Shift+Alt+clique) faz o próximo sinal do mestre centralizar a vista de todos (`puxar: true` só o mestre — regra). `removeGridCena` apaga também os pings; `duplicarGridCena` não os copia. O `TokenDetalhe`/`GridMapa` compartilhados aceitam `podeEditarRecursos`/`onAlterarRecurso` (o dono edita PV/Energia/Fadiga **atuais** da própria ficha pelo cartão — só no site dos jogadores; aqui as props não são ligadas e o cartão fica só leitura; helpers `ajustarRecursoAtual`/`recursoDigitadoAtual` em `grid.js`). Hover/toque num token mostra o cartão (`TokenDetalhe`) com recursos, condições e a distância borda a borda até o token selecionado; "Seguir token" recentraliza quando o token de referência se move. **Fase 3A — combate (2026-11)**: `gridCenas/{cenaId}/combate/atual` (`{ordem:[{tokenId, iniciativa, d20, reacao}], indice, rodada, inicioTurno:{col,lin}|null, turnoEm}`) existe enquanto há combate; só guarda ids/números (nomes ocultos só na interface). O mestre inicia (`iniciarGridCombate`: batch com o estado + a mensagem `tipo:'combate'` `inicio` no chat; **rola 1d20 + Reação** de cada participante — `IniciarCombateDialog`, `reacaoDoToken` em `gridMestre.js`: ficha ao vivo do jogador, `reacao` da persona de NPC/Criatura (`chatPersonas.montarGrupo` → `reacaoDaFicha`), senão o mestre informa, padrão 0), encerra (`encerrarGridCombate`: apaga o doc + mensagem `fim`) e altera tudo por `alterarGridCombate` (transação: Próximo/Anterior via `useGridCampanha().mudarTurno`, e em `pages/Grid/useCombateMestre.js` adicionar/tirar/subir/descer em `ParticipantesCombateDialog` — sem mensagem no chat; remover o token da cena também o tira do combate, o último encerra). As mensagens do mestre saem como `autorDaPersona(uid, PERSONA_MESTRE)`. Barra do Grid: select "Movimento" (`travamento` da cena: `livre` | `turno` — em combate só o token da vez — | `congelado` — só o mestre; vale no app **e** nas regras via `gridMovimentoLiberado`), "Iniciar combate"/"Participantes"/"Encerrar combate". `multiplicadorCorrida` (2 | 1,5, select "Correr" no painel Configurar grid, no `GRID_CONFIG_PADRAO`) e `deslocamento` do token (m, 0–999, padrão 9; campo "Deslocamento (m)" no `TokenCombate`) alimentam o **alcance de movimento** (células verdes até Mover, amarelas até Correr; só indicação, contorna as paredes da Fase 3B) mostrado ao jogador em combate. Com a faixa de iniciativa no topo, `TokenPainel`/`GridConfigPainel` descem (`abaixoDaFaixa`). **Central de Ações dos jogadores**: no site dos jogadores a `FaixaIniciativa` ganha o botão "Central de Ações" (chave opcional `acoes.centralAcoes`, entre "Restaurar PP" e "Encerrar meu turno"; o Re:Master nunca a passa) durante todo o combate. O botão "Ações no chat" da barra do Grid (sempre visível, `aria-pressed`, sem `Switch`) grava `rmCampanhas/{id}/grid/atual.avisarAcoesChat` (bool, padrão desligado; `setGridAvisarAcoesChat`/`subscribeGridAvisarAcoesChat`, hook compartilhado `hooks/useAvisarAcoesChat.js`): ligado, cada ação feita por essa Central vira mensagem `tipo: 'texto'` do personagem no chat. `setGridCenaAtiva` grava com `merge` para não apagar a opção, e a regra de `grid/atual` aceita o campo. O resumo do token de jogador mostra também PP (`detalhes[id].pp`). **Fase 3B — mapa (2026-11)**: três novos conjuntos de dados por cena. `gridCenas/{cenaId}/camadas/paredes` (`{trechos}`) e `camadas/nevoa` (`{ativa, trechos}`, `trechos` = células **reveladas**): um string por camada, em trechos por linha (`"3:5,8-12;4:0-99"`, `common/utils/gridCamadas.js`, limite 200000 caracteres), reescrito inteiro a cada edição (`setGridCamada`, um único listener `subscribeGridCamadas`); **só o mestre grava**, o jogador lê. `gridCenas/{cenaId}/marcadores/{id}` (`{col, lin, tamanho?, icone, cor, titulo, texto?, secreto}` (`tamanho` 1..10 como o token — ausente = 1; `col`/`lin` = canto superior esquerdo, cobre N×N células, ancorado dentro do mapa; escolhido no `MarcadorDialog`), `common/utils/gridMarcadores.js`, até 100 por cena): só o mestre cria/edita/apaga; o marcador `secreto` é **sigilo real nas regras** (a leitura do jogador exige `resource.data.secreto == false` e a consulta dele filtra `where('secreto', '==', false)` — `subscribeGridMarcadores(..., { incluirSecretos })`, como o `oculto` dos tokens). `gridCenas/{cenaId}/desenhos/{id}` (`{uid, cor, pontos, createdAt}`, `pontos` plano `[x0,y0,...]` em px do mundo, ≤ 200 pontos, `common/utils/gridDesenho.js`): **jogadores também gravam** (só os seus traços; só o autor ou o mestre apaga; sem update; o limite de 50 por pessoa é do cliente — `addGridDesenho` apaga o excedente no mesmo lote). ⚠️ Paredes e névoa são sigilo **só na interface** (o doc é legível pelo jogador; tokens "na névoa" somem do mapa dele, mas o chat pode citá-los). Paredes: o jogador não solta token em parede, o arrasto não atravessa e o alcance as contorna (`caminhoBloqueado`, `distanciasDeMovimento({ bloqueadas })`); o mestre ignora — só no app, nunca nas regras. Hooks `useGridCamadas`/`useGridMarcadores`/`useGridDesenhos`, compostos em `useGridCampanha` (`camadas`, `editarCamada`, `definirNevoaAtiva`, `preencherCamada`, `marcadores`, `criarMarcador`/`salvarMarcador`/`apagarMarcador`, `desenhos`, `desenhar`, `apagarMeusDesenhos`, `apagarTodosDesenhos`). `removeGridCena` agora apaga também camadas, marcadores, desenhos e o combate, em lotes de 450 (a cena por último); `duplicarGridCena` copia `camadas/paredes`, `camadas/nevoa` e os marcadores (sem datas), **não** os desenhos (`addGridCena(campanhaId, cena, tokens, extras)` aceita docs extras `[{ref, dados}]`). Na barra do Grid, `pages/Grid/FerramentasMapa.jsx` (Mover padrão / Paredes / Névoa / Marcadores; listas em `gridMestre.js`: `FERRAMENTAS`, `OPCOES_FORMA`, `OPCOES_ACAO`): o Switch "Névoa ativa" **só é renderizado com a ferramenta Névoa** (o teste do painel do token conta com um único switch); Revelar = `adicionar`, Cobrir = `remover`; fora de Mover o `TokenPainel` some e a seleção é limpa. `pages/Grid/MarcadorDialog.jsx` cria/edita/apaga marcadores (switch "Só o mestre vê"). Novas cópias compartilhadas com o site dos jogadores: `common/utils/gridCamadas.js`/`gridMarcadores.js`/`gridDesenho.js`, hooks `useGridCamadas`/`useGridMarcadores`/`useGridDesenhos`, `components/Grid/ParedesCamada`/`NevoaCamada`/`MarcadorPino`/`MarcadorCartao`/`CamadaAnotacoes`/`PaletaDesenho`/`IconeMarcador`/`stylesMapa.js`. **Fase 3C — templates de área e rolar do token (2026-11)**: `gridCenas/{cenaId}/templates/{id}` (`{uid, forma: raio|linha|cone|quadrado, metros, origem:{col,lin}, alvo?:{col,lin} (não vale para raio), cor, nome?, createdAt, updatedAt}`, `common/utils/gridAreas.js`; o doc guarda os **metros** e os quadrados afetados são derivados da escala `metrosPorQuadrado` da cena; limites 50/cena e 10/pessoa só na interface). **Jogadores também criam** os seus; só o autor ou o mestre edita/apaga (a regra deixa mudar só `origem`/`alvo`/`updatedAt`). Storage: `subscribeGridAreas`/`addGridArea`/`updateGridArea` (`alvo` null apaga o campo via `deleteField`)/`removeGridArea`/`removeGridAreas` (lotes de 400); hook `useGridAreas`, composto em `useGridCampanha` (`areas`, `acoesAreas` = `{criar, atualizar, remover, removerTodas}`); GridMapa recebe `areas`, `acoesAreas` e `podeEditarArea` (o mestre edita todas, `() => true`). `removeGridCena` apaga também a subcoleção `templates` (mesmo lote de 450); `duplicarGridCena` **não** copia templates (efêmeros, presos à posição da cena de origem). **Rolar a partir do token**: no token selecionado de NPC/criatura/avulso (`podeRolarToken = t => t.tipo !== 'jogador'`) o GridMapa chama `onRolarToken`; `pages/Grid/Grid.jsx` hospeda `components/Grid/RolarDoTokenDialog` (só "Rolagem livre" — `grupos=[]`, sem opções prontas) e `hooks/useRolarDoToken` posta a rolagem **pública** no chat (`chatMensagens`) como o token (`autorDoToken(..., {mestre: true, personas: [...npcs, ...criaturas]})` em `common/utils/gridRolagem.js`: nome do token, persona do tipo, avatar do token ou da persona) com o `rotulo` opcional (`montarMensagemRolagem(autor, rolagem, secreta, rotulo)`, ≤ 100 caracteres, `normalizarRotulo`; `RolagemMensagem` o exibe e a regra do chat aceita o campo). A **rolagem secreta** a partir do token existe só aqui: o `Grid.jsx` passa `permitirSecreta` ao `RolarDoTokenDialog` (checkbox "Secreta (só o mestre vê)"; o `onRolar` recebe `{ secreta }`) e o `useRolarDoToken` grava com `addChatRolagemSecreta`; o site dos jogadores não passa a prop. Sem mudança de regras. Cópias compartilhadas novas: `gridAreas.js`, `gridRolagem.js`, `useGridAreas`, `useRolarDoToken`, `components/Grid/AreasGrid`/`AreaRotulos`/`AreaPopover`/`TokenAcoes`/`RolarDoTokenDialog`/`stylesAcoes.js`. **Seleção múltipla e ações em lote (só no Re:Master)**: Shift/Ctrl/Cmd-clique num token chama o `onAlternarSelecao` opcional do `GridMapa` (o site dos jogadores não o passa e nada muda lá; `selecionadosIds` realça os escolhidos); `Grid.jsx` guarda `selecionadosIds` (sempre vazia ou com ≥ 2 — com 1 vale `selecionadoId`, `alternarSelecao` em `gridMestre.js`), Esc limpa, e com ≥ 2 mostra `pages/Grid/AcoesEmLote.jsx` no lugar do `TokenPainel`: dano/cura (`-7`/`+5`/`N`) no `pv` do token, adicionar/remover condição, ocultar/revelar, adicionar ao combate e excluir (com `useConfirmacao`). Token de jogador fica fora do dano e das condições (vêm da ficha). Os patches são puros (`patchesDe*EmLote`, `inserirVariosNoCombate`, `removerVariosDoCombate` em `gridMestre.js`) e gravam num `writeBatch` só (`updateGridTokensEmLote`/`removeGridTokensEmLote` em `storage.js`; combate numa transação por `useCombateMestre.adicionarVarios`/`removerVarios`). Backlog restante: grid hexagonal; descartado por ora: régua compartilhada. ⚠️ `D:\Repos\RPG\Banco-de-Dados---Re-Dungeon\firestore.rules` publica no mesmo projeto Firebase mas **não tem** as regras do grid: nunca faça deploy de regras por lá — só pelo Re:Master (com confirmação do usuário). `components/Grid/` (incl. `TokenEstado`/`TokenDetalhe`/`SinaisPing`/`FaixaIniciativa`/`AlcanceMovimento`; `components/Chat/CombateMensagem`), `common/utils/grid.js`, `common/utils/gridCombate.js` e os hooks `useGridCampanha`/`useGridPings`/`useFichasDoGrid`/`useGridCombate`/`useMembroDoChat` são cópias dos do site dos jogadores — mudou um, mude o outro.

> **QOL leva 2 (2026-11) — Grid/Chat do mestre**:
> - **Atalhos do Grid** (`Grid.jsx`, desligados enquanto o foco está num campo — `alvoEhDigitacao`): `N`/`Shift+N` próximo/anterior turno, `H` oculta/revela o(s) selecionado(s), `Delete` exclui (com confirmação), `V`/`W`/`F`/`M` ferramentas Mover/Paredes/Névoa/Marcadores, `Ctrl+Z` desfaz camada, `?` abre `AtalhosDialog`. Mapeamento puro em `acaoDoAtalho` (`gridMestre.js`, `ACOES_ATALHO`). O `TokenPainel` tem botão de olho (grava `oculto` na hora, `aria-pressed`).
> - **Painel "Grupo"** (`GrupoPainel.jsx`): personagens jogáveis da campanha ao vivo (barras, PP, condições; `useFontesDaMesa` + `useFichasDoGrid`, `linhasDoGrupo`/`chaveDasFichasDoGrupo` em `gridMestre.js`); clicar centraliza no token pela prop opcional `focoToken` `{tokenId, chave}` do `GridMapa` (cópia compartilhada; os jogadores não a passam).
> - **Duração de condição em NPC**: token `condicoesDuracao: {condicaoId: rodadaFim}` (`TokenCombate`: "dura N rodadas" a contar da rodada atual; `normalizarCondicoesDuracao`/`rodadasRestantes` em `grid.js`, e o `TokenDetalhe` compartilhado mostra as restantes). Quando `combate.rodada` passa do fim, o `Grid.jsx` remove as expiradas num `updateGridTokensEmLote` (`patchesDeExpiracaoDeCondicoes`; idempotente, com chave para não regravar). `gridTokenValido` em `firestore.rules` aceita o mapa (≤ 20) — ⚠️ **deploy de regras pendente, pelo Re:Master e com confirmação**.
> - **Desfazer camadas**: `useDesfazerCamadas` guarda, só na aba, até `DESFAZER_CAMADAS_MAX` (20) passos de paredes/névoa por cena e desfaz regravando a camada inteira (`setGridCamada`); ligar/desligar a névoa não entra. "Revelar em volta" (`FerramentasMapa`, névoa): revela o raio em metros em volta do token selecionado (`celulasDaArea`).
> - **Celular** (< 600px): a barra do Grid guarda as ações secundárias no `MaisAcoesMenu` ("Mais ações"); `painelLadoSx` (`styles.js`) vira folha na base da tela; o painel de chat do Grid fica em 35% da altura.
> - **Log da sessão** (`common/utils/sessaoLog.js`): novos tipos `CENA_GRID_ATIVADA`, `COMBATE_INICIADO` e `COMBATE_ENCERRADO` (Grid/`useCombateMestre`), e `CENA_ATUAL` agora é gravado ao marcar a cena atual em `CenaDetalhes`; todos best-effort (`registrarEventoSessao`). Falhas ao carregar Mapas/Condições no Grid e cenas em Notas agora avisam no Snackbar em vez de passar em silêncio.
> - **Fontes da mesa**: `useFontesDaMesa` devolve também `recarregar()`; botão "Recarregar fontes" no menu "Falando como" do `ChatMestre` e no `AdicionarTokenDialog` (props opcionais `onRecarregarFontes`). **Busca por nome** nas listas de NPCs e Criaturas: `common/utils/busca.js` (`filtrarPorNome`, sem acento/caixa) + `components/BuscaPorNome`.
> - **Chat (cópia compartilhada)**: pílula "Novas mensagens ↓" no `ChatSala` e "Carregar anteriores" (`getChatMensagensAntes` em `storage.js` — leitura pontual por `createdAt`; `mesclarComAntigas`, `CHAT_JANELA_MENSAGENS` 100 / `CHAT_PAGINA_ANTERIORES` 50 em `common/utils/chat.js`; `useChatCampanha` expõe `carregarAnteriores`/`temMaisAntigas`/`carregandoAntigas`). `hooks/useChatCampanha.test.jsx` entrou em `check-shared.mjs`.

2. Denormalize `universoId` e `mestreId` no documento (ver Firestore Rules abaixo) — evita `get()` extra nas regras de segurança.
3. Exporte as funções `get*`/`add*`/`remove*`/`update*` em `storage.js`, seguindo o mesmo padrão genérico já usado pelas entidades do Re-Dungeon (`getFirestoreItems`/`addFirestoreItem`/`updateFirestoreItem`/`removeFirestoreItem` com `createdAt`/`updatedAt` via `serverTimestamp()`) e pelas primeiras entidades do Re:Master.

---

### Firestore Rules — arquivo compartilhado com o Re-Dungeon

`firestore.rules` é **um único arquivo compartilhado** entre Re:Master e Re-Dungeon (mesmo projeto Firebase) — quem der `firebase deploy --only firestore:rules` por último decide as regras vigentes para os dois apps. **Nunca reescreva o arquivo do zero**: toda regra nova do Re:Master é adicionada ao final, sem tocar nenhuma linha das coleções do Re-Dungeon.

Todo `match` novo do Re:Master segue o mesmo padrão (reaproveitando `isAuth()`/`isAdmin()`/`canWriteUniverso()` já existentes, mais o helper `isCampanhaOwner()`):

```
allow read: if isAdmin() ||
  (canWriteUniverso(resource.data.universoId) && isCampanhaOwner(resource.data.mestreId));
allow create: if canWriteUniverso(request.resource.data.universoId)
              && isCampanhaOwner(request.resource.data.mestreId);
```

Antes de rodar `firebase deploy --only firestore:rules`, confirme com o usuário — é uma mudança em infraestrutura compartilhada que afeta o Re-Dungeon também.

---

### Formulários com Formik + Yup

```jsx
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { nomeSchema, descricaoSchema } from 'common/utils/yupSchemas';

const MINHA_SCHEMA = Yup.object({
  nome: nomeSchema,
  descricao: descricaoSchema,
});

const MeuFormulario = ({ onSubmit, initialValues }) => (
  <Formik
    initialValues={initialValues}
    validationSchema={MINHA_SCHEMA}
    onSubmit={onSubmit}
  >
    {({ errors, touched, isSubmitting }) => (
      <Form>
        {/* campos */}
      </Form>
    )}
  </Formik>
);
```

- Coloque o schema Yup específico da página no arquivo `utils.js` da página.
- Reutilize os validadores genéricos de `src/common/utils/yupSchemas.js` em vez de repetir `Yup.string()` cru em cada página:
  - `nomeSchema` — obrigatório, `trim()`, máximo `NOME_MAX` (100) caracteres.
  - `campoCurtoSchema` — opcional, `trim()`, máximo `CAMPO_CURTO_MAX` (300) caracteres.
  - `descricaoSchema` — opcional, `trim()`, máximo `DESCRICAO_MAX` (2000) caracteres.
  - `textoLongoSchema` — opcional, `trim()`, máximo `TEXTO_LONGO_MAX` (8000) caracteres. Use para texto de narração de Cena, notas do mestre e o campo de improviso — tendem a ser bem mais longos que uma descrição curta.
  - `urlImagemSchema` — opcional, `trim()`, valida formato de URL (usado em todo campo de imagem).
- Ao exibir um campo de URL de imagem, mostre erro/helperText de validação (`touched.imagemUrl && Boolean(errors.imagemUrl)`), assim como qualquer outro campo com schema próprio.
- Reaproveite `FormActions`, `FormPageHeader`, `ImagePreviewPanel`, `SectionTitle`, `EntityFilters` e `EntityViewDialog` (`src/components/`) em toda página de lista/formulário nova — são genéricos, parametrizados via props, e cobrem o footer de ações, cabeçalho com botão voltar, preview de imagem, título de seção, grade de filtros e dialog de visualização.
- Em listas dinâmicas via `FieldArray` (ex.: pontos importantes de uma Cena, objetivos de uma Missão), **nunca use o índice do array como `key`** do React — ao remover um item do meio da lista isso faz o conteúdo dos itens seguintes "colar" na posição errada, principalmente com `FastField`. Use o hook `src/hooks/useStableListKeys.js`, que gera um id estável por item:
  ```jsx
  const pontosKeys = useStableListKeys(values.pontosImportantes.length);
  // no map: key={pontosKeys.keys[idx] ?? idx}
  // ao adicionar: pontosKeys.addKey(); push('');
  // ao remover: pontosKeys.removeKey(idx); remove(idx);
  ```
  Para listas apenas de leitura (fora de um `FieldArray`), uma key derivada do conteúdo (ex.: `` `${item.nome}-${i}` ``) já resolve o problema sem precisar do hook.

---

### O fluxograma da Campanha (React Flow)

A página `Campanha` usa `@xyflow/react` para o grafo de Cenas, com `@dagrejs/dagre` para o layout inicial (só aplicado a cenas sem `posicaoCanvas` salva — nunca reposiciona uma cena que o mestre já arrastou manualmente). As conexões entre cenas (`rmCenaConexoes`) mapeiam direto para o formato de aresta do React Flow (`origemCenaId`→`source`, `destinoCenaId`→`target`, `rotulo`→`label`). Mantenha a leitura dos dados do grafo como busca única (`getDocs`, ao montar a tela) em vez de listener em tempo real (`onSnapshot`), consistente com o resto do `storage.js` (as únicas exceções são o Chat e o Grid, onde tempo real é o próprio objetivo).

---

### Rotas

Para adicionar uma nova rota:
1. Adicione o caminho em `src/common/constants/routes.js` (em `ROUTE_PATHS` e `PAGE_TITLES`)
2. Adicione o item de navegação em `src/common/constants/navItems.js`
3. Registre a rota em `src/routes/index.jsx`
4. Crie a pasta e o componente em `src/pages/NovaPagina/`

---

## Fluxo de Desenvolvimento

### Verificação de Qualidade
Antes de commitar, sempre execute:
```bash
# Verificar erros de lint
npm run eslint

# Corrigir automaticamente
npm run eslint-fix

# Formatar arquivos modificados
npx prettier --write "src/path/to/modified/file.jsx"
```

> Evite rodar `npm run prettier` em todo o projeto. Formate apenas os arquivos modificados.

**Cópias compartilhadas com o site dos jogadores** (chat, grid, `common/lua`, `components/ImageLightbox`, `components/ConfirmDialog` (+ `useConfirmacao`), utils `chat*`/`grid*` e os hooks do chat/grid — lista completa em `scripts/check-shared.mjs`): depois de mexer em qualquer uma, copie o arquivo para `../Ficha-RPG---Re-Dungeon-` e rode `npm run check:shared` (em qualquer um dos dois repos) — ele formata as duas cópias com as mesmas opções e acusa o que divergiu (`-- --diff` mostra as linhas). O `.prettierrc.json` daqui usa `printWidth: 90` só nesses caminhos, igual ao site dos jogadores, para os arquivos ficarem idênticos byte a byte. Diferença de comportamento entre os apps vira **prop** ou fica no arquivo específico de cada app — nunca uma edição divergente da cópia. Exceções documentadas no script: `AudioDialog.jsx` (biblioteca de músicas do mestre), `ChatSala.audio.test.jsx` e `context/AudioMesaContext.jsx` (cada app liga o áudio do seu jeito; o chat só usa `useAudioDoChat(campanhaId, { podeOuvir, podeControlar })`, de assinatura igual nos dois). O destaque do mestre no chat vem de `--chat-destaque-rgb` (`global.css`; vermelho aqui, dourado lá).

O ESLint (`eslint.config.js`) inclui `eslint-plugin-jsx-a11y` (regras de acessibilidade) e `eslint-config-prettier` (desativa regras de estilo que conflitam com o Prettier). `no-console` e `react-hooks/exhaustive-deps` são erros (não apenas avisos) — corrija antes de commitar em vez de suprimir.

### Comandos Principais
```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção
npm run preview   # Pré-visualizar o build
npm run eslint    # Verificar lint
npm run test      # Executar testes (Vitest + Testing Library)
```

Utilitários e hooks compartilhados (`src/common/utils/`, `src/hooks/`) devem ter um arquivo `*.test.js` correspondente (ex.: `yupSchemas.test.js`, `useStableListKeys.test.js`).

---

## Diretrizes de Performance

- Use `React.memo()` para componentes que recebem as mesmas props frequentemente.
- Use `useCallback` e `useMemo` quando evitar re-renders desnecessários for relevante.
- Inicialize estado com função lazy quando o valor inicial exigir cálculo custoso: `useState(() => calcularValorInicial())`.

---

## Considerações de Segurança

- Sanitize inputs do usuário antes de persistir no Firestore.
- A autorização de escrita é reforçada em duas camadas: no frontend, via `canCreate()`/`canWrite(universoId)` (`useAuth()`), usados para esconder ações não permitidas na UI; e no backend, via **regras de segurança do Firestore** (`firestore.rules`), que é a camada que efetivamente impede escrita não autorizada — nunca confie somente na checagem de UI.
- Valide dados no frontend com Yup antes de persistir.
- Toda coleção nova do Re:Master restringe leitura e escrita ao mestre dono da campanha (`mestreId`) — diferente do padrão público-para-leitura do Re-Dungeon, já que o conteúdo aqui é privado (segredos de NPC, consequências, notas).
- Siga as diretrizes OWASP para segurança no cliente.

---

## Acessibilidade (a11y)

- Use elementos HTML semânticos.
- Implemente atributos ARIA adequados.
- Garanta navegação por teclado nos modais e formulários.
- Mantenha contraste de cores suficiente (o tema atual usa fundo escuro com texto claro).
- O canvas do fluxograma da Campanha é uma exceção aceita e deliberada a essa diretriz — interfaces de grafo node-based têm suporte limitado a teclado/leitor de tela mesmo nas melhores bibliotecas disponíveis.

---

## Diretrizes de Code Review

### O Que Verificar
- Código segue os padrões e convenções estabelecidos
- Componentes possuem PropTypes definidos
- Dados são lidos e escritos via `service/storage.js`
- Imports usam caminhos absolutos por padrão
- Nenhum `console.log` em código de produção
- Estilos seguem o sistema de variáveis CSS globais
- Formulários usam Formik + Yup, reaproveitando os schemas de `common/utils/yupSchemas.js` quando aplicável
- Listas renderizadas a partir de `FieldArray` usam `useStableListKeys` (ou uma key derivada do conteúdo) em vez do índice do array
- Toda coleção nova grava `universoId` e `mestreId` no documento e tem o `match` correspondente em `firestore.rules`

### Ações Obrigatórias Antes do Merge
1. ✅ ESLint sem erros ou avisos
2. ✅ Prettier aplicado nos arquivos modificados
3. ✅ PropTypes definidos em todos os componentes
4. ✅ Sem `console.log` em código de produção
5. ✅ Testado manualmente no navegador
