# Re:Master — Centro de Comando do Mestre

> v0.1.0

Painel para o mestre conduzir sessões de RPG de mesa: fluxograma de campanha com cenas ramificadas, NPCs, criaturas, mapas, missões, CardFlux e notas — tudo em um único lugar, sem interromper o ritmo da mesa.

Compartilha o mesmo projeto Firebase do Re-Dungeon (banco de dados de campanha), consumindo dados de lá (Universos, personagens) e adicionando suas próprias coleções (`rm*`) por cima.

---

## Requisitos

- [Node.js](https://nodejs.org/) v22 ou superior
- npm v10 ou superior

---

## Instalação

```bash
npm install
```

Copie `.env.example` para `.env` e preencha com as credenciais do projeto Firebase compartilhado (mesmas do Re-Dungeon).

---

## Comandos úteis

| Comando              | O que faz                                             |
| -------------------- | ------------------------------------------------------ |
| `npm install`        | Instala as dependências do projeto                     |
| `npm run dev`        | Inicia o servidor de desenvolvimento com hot-reload    |
| `npm run build`      | Gera o build otimizado para produção na pasta `dist/`  |
| `npm run preview`    | Serve o build de produção localmente para testes       |
| `npm run eslint`     | Analisa o código com ESLint                            |
| `npm run eslint-fix` | Corrige automaticamente problemas do ESLint            |
| `npm run prettier`   | Formata o código com Prettier                          |
| `npm run test`       | Executa os testes (Vitest + Testing Library)           |

---

## Desenvolvimento local

```bash
npm run dev
```

Acesse em: `http://localhost:8000`

---

## Módulos

| Rota          | Descrição                                              |
| ------------- | ------------------------------------------------------- |
| `/`           | Dashboard — cena atual, próximo evento, notas rápidas   |
| `/campanha`   | Fluxograma de cenas da campanha (não linear/ramificado) |
| `/npcs`       | NPCs da campanha (importáveis do Re-Dungeon)            |
| `/criaturas`  | Criaturas/monstros da campanha                          |
| `/mapas`      | Biblioteca de mapas de batalha                          |
| `/missoes`    | Acompanhamento de missões                                |
| `/cardflux`   | Baralhos de eventos da campanha                          |
| `/notas`      | Anotações livres do mestre                               |

---

## Estrutura do projeto

```
src/
├── App.jsx
├── main.jsx
├── common/
│   ├── constants/       # Rotas e itens de navegação
│   ├── styles/          # Estilos globais
│   └── utils/           # Utilitários (schemas Yup, ordenação)
├── components/
│   ├── Header/, Layout/, Sidebar/       # Casca da aplicação
│   ├── LoginModal/, ProtectedRoute/     # Autenticação
│   └── EntityFilters/, EntityViewDialog/, FormActions/,
│       FormPageHeader/, ImagePreviewPanel/, SectionTitle/  # Padrões de lista/formulário
├── context/              # AuthContext (Firebase Auth)
├── hooks/                # useUniversos, useEntityCRUD, useEntityFormGuard, useStableListKeys
├── pages/                # Uma pasta por módulo (Dashboard, Campanha, NPCs, ...)
├── routes/               # Configuração do React Router
└── service/              # storage.js (CRUD Firestore) e firebase.js
```

---

## Tecnologias

- [React 19](https://react.dev/)
- [React Router DOM 7](https://reactrouter.com/)
- [Vite 8](https://vitejs.dev/)
- [MUI (Material UI) 9](https://mui.com/)
- [Styled Components 6](https://styled-components.com/)
- [Formik](https://formik.org/) + [Yup](https://github.com/jquense/yup)
- [@xyflow/react](https://reactflow.dev/) (React Flow) + [Dagre](https://github.com/dagrejs/dagre) — fluxograma da Campanha
- [Firebase Auth + Firestore](https://firebase.google.com/)
- [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)
