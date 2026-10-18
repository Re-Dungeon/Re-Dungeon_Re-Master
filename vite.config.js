import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// O fengari (Lua das macros do chat, só usado dentro do Web Worker
// src/common/lua/macroWorker.js) requer módulos do Node atrás de
// `typeof process` — no navegador esses ramos nunca rodam. Trocamos esses
// imports por um módulo vazio só no build do worker: evita os avisos de
// "externalized for browser compatibility" e não embute readline-sync/tmp.
const MODULOS_NODE_DO_FENGARI = [
  'fs',
  'os',
  'path',
  'child_process',
  'crypto',
  'readline-sync',
  'tmp',
];
const ID_MODULO_VAZIO = '\0modulo-node-vazio';
const stubModulosNodeDoFengari = () => ({
  name: 'stub-modulos-node-do-fengari',
  enforce: 'pre',
  resolveId: id =>
    MODULOS_NODE_DO_FENGARI.includes(id) ? ID_MODULO_VAZIO : null,
  load: id => (id === ID_MODULO_VAZIO ? 'export default {};' : null),
});

export default defineConfig({
  base: '/Re-Dungeon_Re-Master/',
  plugins: [react()],
  worker: {
    plugins: () => [stubModulosNodeDoFengari()],
  },
  // fengari/src/luaconf.js lê `process.env.FENGARICONF` sem checar se
  // `process` existe. O build de produção já troca `process.env`, mas o
  // pré-empacotamento do dev não — sem isto o Worker das macros quebra no
  // `npm run dev` com "process is not defined". `include`: o fengari só é
  // importado dentro do Worker, então o Vite não o descobre no início e
  // recarregaria a página no primeiro uso de uma macro.
  optimizeDeps: {
    include: ['fengari'],
    rolldownOptions: {
      transform: {
        define: { 'process.env.FENGARICONF': 'undefined' },
      },
    },
  },
  resolve: {
    alias: {
      common: fileURLToPath(new URL('./src/common', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      context: fileURLToPath(new URL('./src/context', import.meta.url)),
      hooks: fileURLToPath(new URL('./src/hooks', import.meta.url)),
      pages: fileURLToPath(new URL('./src/pages', import.meta.url)),
      service: fileURLToPath(new URL('./src/service', import.meta.url)),
    },
  },
  server: {
    port: 8000,
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    testTimeout: 30000,
  },
});
