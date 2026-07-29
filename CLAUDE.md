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

const NomeComponente = ({ prop1, prop2, onAcao }) => {
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

NomeComponente.defaultProps = {
  prop2: 0,
};

export default NomeComponente;
```

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
1. Escolha um nome de coleção prefixado com `rm` (ex.: `rmMapas`) — nunca reutilize um nome de coleção do Re-Dungeon, mesmo que pareça equivalente (ex.: o `cardflux` do Re-Dungeon é uma coleção diferente do `rmCardfluxCartas` do Re:Master).
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

A página `Campanha` usa `@xyflow/react` para o grafo de Cenas, com `@dagrejs/dagre` para o layout inicial (só aplicado a cenas sem `posicaoCanvas` salva — nunca reposiciona uma cena que o mestre já arrastou manualmente). As conexões entre cenas (`rmCenaConexoes`) mapeiam direto para o formato de aresta do React Flow (`origemCenaId`→`source`, `destinoCenaId`→`target`, `rotulo`→`label`). Mantenha a leitura dos dados do grafo como busca única (`getDocs`, ao montar a tela) em vez de listener em tempo real (`onSnapshot`), consistente com o resto do `storage.js`.

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
