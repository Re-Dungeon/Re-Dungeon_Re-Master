# Copilot Instructions - Re:Master

> Guia completo em [`CLAUDE.md`](../CLAUDE.md) na raiz do projeto — este arquivo é um resumo para o GitHub Copilot; mantenha os dois em sincronia ao mudar convenções.

## Visão Geral

Re:Master é o Centro de Comando do Mestre: fluxograma de campanha (cenas ramificadas), NPCs, Criaturas, Mapas, Missões, CardFlux e Notas. Compartilha o mesmo projeto Firebase do Re-Dungeon (banco de dados de campanha) — mesmos usuários/Auth, mesmo modelo de permissão por Universo. Toda coleção nova do Re:Master é prefixada com `rm` (`rmCampanhas`, `rmCenas`, ...) para nunca colidir com as coleções do Re-Dungeon.

## Stack
React 19 + Vite, Material-UI, Styled Components, React Router DOM v7, Formik + Yup, `@xyflow/react` (React Flow) + Dagre para o fluxograma, Firebase Auth + Firestore.

## Regras principais
- Persistência **sempre** via `src/service/storage.js` (Firestore) — nunca `localStorage`.
- Caminhos de import absolutos (`service/storage`, `hooks/useUniversos`, etc.), não relativos.
- Reutilize os schemas de `common/utils/yupSchemas.js` (`nomeSchema`, `campoCurtoSchema`, `descricaoSchema`, `textoLongoSchema`, `urlImagemSchema`) em vez de `Yup.string()` cru.
- Reutilize os componentes genéricos de lista/formulário já existentes (`EntityFilters`, `EntityViewDialog`, `FormActions`, `FormPageHeader`, `ImagePreviewPanel`, `SectionTitle`) e os hooks (`useUniversos`, `useEntityCRUD`, `useEntityFormGuard`, `useStableListKeys`) em vez de recriar o padrão.
- Em listas de `FieldArray`, use `useStableListKeys` — nunca o índice do array como `key`.
- Toda coleção nova grava `universoId` e `mestreId` no documento, e tem o `match` correspondente em `firestore.rules` (arquivo **compartilhado** com o Re-Dungeon — nunca reescrever do zero, só adicionar).
- PropTypes em todo componente; sem `console.log` em produção; `npm run eslint` limpo antes de commitar.
