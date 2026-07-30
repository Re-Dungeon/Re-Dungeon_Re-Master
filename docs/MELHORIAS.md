# Re:Master — Análise Técnica e Roadmap de Melhorias

> Documento de análise gerado a partir da leitura do código atual (`src/`), das
> Firestore Rules e do CLAUDE.md do projeto. Organizado em duas partes:
> **(1) melhorias técnicas** no que já existe, e **(2) funcionalidades novas**
> pensadas do ponto de vista de quem masteriza uma sessão de RPG de mesa.
>
> Prioridades: 🔴 alta · 🟡 média · 🟢 baixa/nice-to-have. Itens marcados com
> **✅ Implementado** já foram desenvolvidos (código + testes + lint
> passando); o restante segue como material de planejamento.

---

## Parte 1 — Melhorias Técnicas


### 1.2 Arquitetura e padrões de dados

#### 🟢 ✅ Implementado — `getFirestoreItemsWhere` + `useAsyncEffect` (parcial)

`Mapas`, `Missões` e `Notas` (lista e Dashboard) agora buscam só os
documentos da campanha ativa via `query(..., where('campanhaId', '==', id))`
(`getRmMapasPorCampanha`/`getRmMissoesPorCampanha`/`getRmNotasPorCampanha` em
`storage.js`, sobre o novo helper `getFirestoreItemsWhere`), em vez de baixar
a coleção inteira do mestre e filtrar no cliente. `CenaForm.jsx` também
passou a usar `getRmMissoesPorCampanha`. O padrão `Promise.resolve().then()`
foi extraído para `src/hooks/useAsyncEffect.js` e aplicado nos pontos mais
simples (`Dashboard`, `Luta`, `CardFlux`, `useCampanhaGrafo`,
`CampanhaContext`) — os casos com cancelamento via `active` flag
(`useEntityCRUD`, `Npcs`/`Jogadores`/`Criaturas`, `PersonagemFichaDialog`)
não foram mexidos, por já terem uma solução própria e mais elaborada.

#### 🟡 Denormalização de `universoId`/`mestreId` sem `get()` nas Rules cria risco de dessincronia

O padrão adotado — gravar `universoId`/`mestreId` em cada documento para
evitar `get()` extra nas regras — é uma boa escolha de performance/custo, mas
depende de **toda** rota de escrita do cliente preencher esses dois campos
corretamente. Não há nenhum teste que garanta isso: um `add*` novo em
`storage.js` que esqueça de gravar `mestreId` passaria despercebido em
desenvolvimento (o form ainda funcionaria) e só quebraria em produção, na
regra de segurança, com um erro de permissão pouco óbvio para debugar.
Sugestão: um teste de integração (ou pelo menos um lint/convenção documentada)
que verifique que todo payload passado para `addFirestoreItem` de uma coleção
`rm*` contém `universoId` e `mestreId`.

#### 🟡 `getFirestoreItems`/`getRmCenas`/`getRmMapas`/etc. sempre buscam a coleção inteira e filtram no cliente

Praticamente toda tela de listagem (`Mapas.jsx`, `Missoes`, `Notas`,
`Dashboard` para notas, etc.) chama `getRmX()` sem filtro e depois faz
`.filter(x => x.campanhaId === campanhaAtiva.id)` no cliente. Isso funciona
bem para o volume de dados de uma campanha de RPG hoje, mas:
- baixa documentos de **todas** as campanhas do mestre a cada troca de tela,
  não só da campanha ativa;
- não escala bem se um mestre acumular várias campanhas antigas com muitos
  mapas/notas/missões cada;
- gera leituras faturáveis desnecessárias no Firestore.

Como `mestreId`/`universoId` (e em alguns casos `campanhaId`) já estão
denormalizados nos documentos, a maioria dessas telas poderia trocar o filtro
client-side por uma `query(collection(...), where('campanhaId', '==', id))`
com um índice composto (`firestore.indexes.json` já existe no projeto, então
o padrão de manter índices já está estabelecido). Ganho maior quanto mais
campanhas/dados o mestre acumular ao longo do tempo.

#### 🟢 Padrão de `Promise.resolve().then(() => carregar())` repetido em quase toda tela

O comentário em `CampanhaContext.jsx` explica bem o motivo (evitar `setState`
síncrono no corpo do efeito), mas esse padrão está copiado manualmente em
`Luta.jsx`, `Dashboard.jsx`, `CardFlux.jsx` e provavelmente outras telas.
Seria um bom candidato a um hook pequeno (`useAsyncEffect(fn, deps)`) que
encapsula o `Promise.resolve().then(...)` uma única vez — reduz a chance de
alguém esquecer o wrapper numa tela nova e reintroduzir o bug que ele evita.

#### 🟢 `Campanha.jsx`/`CenaForm.jsx` concentram bastante lógica (657 linhas em `CenaForm.jsx`)

`CenaForm.jsx` é o maior arquivo do projeto de longe. Vale uma passada futura
para extrair seções do formulário (ex.: bloco de "pontos importantes",
bloco de conexões de saída) em subcomponentes — não é um problema hoje, mas
tende a crescer junto com o número de campos da Cena.

---

### 1.3 Qualidade, testes e DX

#### 🟡 ✅ Implementado — Snackbar de erro em ações de escrita críticas

`ListLoadError` já cobria falha ao *carregar* uma lista, mas não havia
padrão equivalente para falhas de **escrita** — o dado simplesmente não era
salvo, silenciosamente, no meio de uma sessão ao vivo. Agora existe
`src/context/SnackbarContext.jsx` (`SnackbarProvider` + `useSnackbar()`,
montado uma vez em `main.jsx`) com um `notifyError(mensagem)` genérico.
Aplicado em `Luta.jsx` (`commitStat`, adicionar/duplicar/remover
participante — com rollback do valor otimista em caso de falha) e em
`useCampanhaGrafo.js` (`persistirPosicaoCena`, `createConexao`,
`removeConexao`, `updateCena`, `removeCena` — usado pelo canvas de Cenas).

---

### 1.4 Performance e UX técnica

#### 🟢 ✅ Implementado — `loading="lazy"` nas imagens

Todo `<Box component="img">` do projeto (NPCs, Criaturas, Jogadores, Mapas,
Campanha, Luta, CardFlux, CenaNode, EntityViewDialog) ganhou `loading="lazy"`.

#### 🟢 `React.memo`/`useMemo` aplicados de forma pontual

O CLAUDE.md já orienta usar `React.memo`/`useCallback`/`useMemo` "quando
relevante" — não vi sinais de over-rendering hoje (o app não parece pesado o
suficiente para isso importar), então é só um item para observar se o
fluxograma de Cenas crescer muito (dezenas de nós) — `CenaFlowCanvas`/
`CenaNode` seriam os primeiros candidatos a revisar.

---

## Parte 2 — Funcionalidades Novas (foco: o mestre durante a sessão)

O Re:Master já cobre bem o "antes da sessão" (organizar cenas, NPCs, mapas,
missões) e parte do "durante" (fluxograma, Luta, CardFlux, Notas). As
sugestões abaixo miram lacunas que aparecem especificamente **na mesa, ao
vivo**, onde cada segundo de fricção interrompe o ritmo do grupo.

### 2.3 🟡 ✅ Implementado — Marcadores de condição (status effects) na Luta

`storage.js` ganhou `getCondicoes(universoId)` (lê a coleção `condicoes` do
Re-Dungeon, mesclando os campos `universos`/`universo` legado). Na tela de
Luta, cada participante mostra suas condições aplicadas como chips
removíveis, com um seletor "+ Condição" para adicionar (só as ainda não
aplicadas). Persistido no array `condicoes: [{id, nome}]` do doc do
participante, com rollback otimista em caso de falha de escrita (mesmo
padrão do 1.3).

### 2.4 🟡 ✅ Implementado — Timer/cronômetro de sessão e temporizadores em jogo

Novo componente `src/components/SessionTimers/SessionTimers.jsx`, acionado
por um ícone no Header (disponível em qualquer tela): cronômetro de sessão
(iniciar/pausar/zerar) + temporizadores nomeados avulsos com contagem
regressiva, pausar/reiniciar/remover, e destaque visual ("Esgotado!") ao
chegar em zero. Estado 100% local/efêmero, sem coleção Firestore — de
propósito, conforme já apontado neste documento.

### 2.5 🟡 ✅ Implementado — Registro/histórico automático da sessão

Nova coleção `rmSessaoLogs` (append-only — só `read`/`create` em
`firestore.rules`, sem `update`/`delete`; ver `storage.js` e
`src/common/utils/sessaoLog.js`). Três telas gravam um evento
automaticamente: marcar uma Cena como atual (`Cenas.jsx`), sortear uma carta
(`CardFlux.jsx`) e adicionar um participante à Luta (`Luta.jsx`) — sempre em
modo *best-effort* (uma falha ao gravar o log não interrompe nem avisa sobre
a ação principal). O Dashboard ganhou um card "Registro da Sessão" com os 6
eventos mais recentes, ícone por tipo e hora formatada.

> **Nota para deploy:** a regra nova de `rmSessaoLogs` já está em
> `firestore.rules`, mas **não foi implantada** — falta rodar
> `firebase deploy --only firestore:rules` (com confirmação prévia, por ser
> infraestrutura compartilhada com o Re-Dungeon) antes de gravar logs em
> produção.

### 2.8 🟢 ✅ Implementado — Busca global

Novo componente `src/components/BuscaGlobal/BuscaGlobal.jsx` (ícone de lupa
no Header): carrega NPCs/Criaturas/Cenas/Mapas/Missões/Notas da campanha
ativa na primeira abertura (não a cada tecla) e filtra em memória, ignorando
acentuação. Selecionar um resultado navega para a tela certa — no caso de
Cena, abre direto no painel de detalhes (reaproveita o `state:
{selecionarCenaId}` que o Dashboard já usava).

### 2.9 🟢 ✅ Implementado — Vínculo Missão ↔ Cena

A investigação confirmou a suspeita do documento original: `MissaoForm.jsx`
já tinha `cenasVinculadas`/`npcsRelacionados` (editável), e `CenaForm.jsx`
tinha um `missoesRelacionadas` **próprio e independente** — os dois arrays
nunca eram sincronizados entre si (vincular pela Missão não refletia na Cena
e vice-versa). Correção: `Cena.missoesRelacionadas` foi removido do
schema/Formik; a tela de Cena agora mostra, só-leitura, as Missões cujo
`cenasVinculadas` contém aquela Cena — Missão passou a ser a única fonte da
verdade do vínculo, eliminando o risco de divergência. (Vínculo com NPC não
teve alteração — já é só de mão única, a partir da Missão, e não havia pedido
de view reversa para NPC.)

### 2.11 🟢 ✅ Implementado — Atalhos de teclado na tela de Luta

O campo "atual" de cada stat (vida/fadiga/mana) responde às teclas `+`/`-`
quando focado, ajustando em 1 sem precisar mirar no botão
(`handleStatKeyDown` em `Luta.jsx`). Navegação por `Tab` entre os cards já
funcionava de graça (ordem natural do DOM entre campos/botões focáveis), não
precisou de código adicional.
