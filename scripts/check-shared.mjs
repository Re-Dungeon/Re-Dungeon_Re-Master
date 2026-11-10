#!/usr/bin/env node
// Confere se as cópias compartilhadas entre o site dos jogadores
// (Ficha-RPG---Re-Dungeon-) e o Re:Master continuam iguais.
//
// Os dois repositórios mantêm à mão a mesma cópia do chat, do grid, do
// runtime Lua e de alguns utils/hooks ("mudou um, mude o outro"). Este script
// formata as duas cópias com as MESMAS opções do Prettier (para ignorar
// diferenças só de estilo) e acusa qualquer arquivo que divergiu ou que existe
// só de um lado. Este arquivo também é compartilhado: mantenha-o idêntico nos
// dois repositórios.
//
// Uso:  npm run check:shared            (repo irmão em ../<nome>)
//       SHARED_SIBLING=/caminho npm run check:shared
//       npm run check:shared -- --diff  (mostra as linhas que diferem)

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import * as prettier from 'prettier';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPOS = ['Ficha-RPG---Re-Dungeon-', 'Re-Dungeon_Re-Master'];

// Pastas/arquivos compartilhados, relativos a src/. Pastas são varridas
// inteiras (recursivo).
const COMPARTILHADOS = [
  'components/Chat',
  'components/Grid',
  'common/lua',
  'components/ConfirmDialog',
  'components/ImageLightbox',
  'common/utils/chat.js',
  'common/utils/chat.test.js',
  'common/utils/chatHistorico.js',
  'common/utils/chatHistorico.test.js',
  'common/utils/grid.js',
  'common/utils/grid.test.js',
  'common/utils/gridAreas.js',
  'common/utils/gridAreas.test.js',
  'common/utils/gridCamadas.js',
  'common/utils/gridCamadas.test.js',
  'common/utils/gridCombate.js',
  'common/utils/gridCombate.test.js',
  'common/utils/gridDesenho.js',
  'common/utils/gridDesenho.test.js',
  'common/utils/gridMarcadores.js',
  'common/utils/gridMarcadores.test.js',
  'common/utils/gridRolagem.js',
  'common/utils/gridRolagem.test.js',
  'context/AudioMesaContext.jsx',
  'hooks/useAudioMesa.js',
  'hooks/useAvisarAcoesChat.js',
  'hooks/useAvisarAcoesChat.test.js',
  'hooks/useChatCampanha.js',
  'hooks/useChatCampanha.test.jsx',
  'hooks/useFichasDoGrid.js',
  'hooks/useFichasDoGrid.test.js',
  'hooks/useGridAreas.js',
  'hooks/useGridAreas.test.js',
  'hooks/useGridCamadas.js',
  'hooks/useGridCamadas.test.js',
  'hooks/useGridCampanha.js',
  'hooks/useGridCampanha.test.js',
  'hooks/useGridCombate.js',
  'hooks/useGridCombate.test.js',
  'hooks/useGridDesenhos.js',
  'hooks/useGridDesenhos.test.js',
  'hooks/useGridMarcadores.js',
  'hooks/useGridMarcadores.test.js',
  'hooks/useGridPings.js',
  'hooks/useGridPings.test.js',
  'hooks/useMembroDoChat.js',
  'hooks/useRolarDoToken.js',
  'hooks/useRolarDoToken.test.js',
];

// Divergências intencionais e documentadas (CLAUDE.md dos dois repos).
// Cada entrada precisa de um motivo; não adicione arquivo aqui para "calar"
// o script — prefira prop/injeção para a diferença de comportamento.
const EXCECOES = {
  'components/Chat/AudioDialog.jsx':
    'Re:Master tem a biblioteca de músicas/playlists do mestre (lê service/storage).',
  'components/Chat/ChatSala.audio.test.jsx':
    'Mocks diferentes por causa do AudioDialog de cada lado.',
  'context/AudioMesaContext.jsx':
    'Fiação do áudio de cada app (player global aqui; provider da campanha ativa no Re:Master). Só a assinatura de useAudioDoChat precisa bater.',
};

// Opções fixas (independem do .prettierrc de cada repo).
const OPCOES = {
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 90,
  arrowParens: 'avoid',
};

const nomeAtual = basename(RAIZ);
const nomeIrmao = REPOS.find(nome => nome !== nomeAtual) ?? REPOS[1];
const IRMAO = resolve(process.env.SHARED_SIBLING ?? join(RAIZ, '..', nomeIrmao));
const mostrarDiff = process.argv.includes('--diff');

if (!existsSync(join(IRMAO, 'src'))) {
  process.stderr.write(
    `Repositório irmão não encontrado em ${IRMAO}. Use SHARED_SIBLING=<caminho>.\n`,
  );
  process.exit(2);
}

const listar = (raiz, caminho) => {
  const absoluto = join(raiz, 'src', caminho);
  if (!existsSync(absoluto)) return [];
  if (!statSync(absoluto).isDirectory()) return [caminho];
  return readdirSync(absoluto, { recursive: true })
    .map(String)
    .filter(nome => statSync(join(absoluto, nome)).isFile())
    .map(nome => join(caminho, nome).replaceAll('\\', '/'));
};

const formatar = async (arquivo, texto) => {
  if (!/\.(m?jsx?|json)$/.test(arquivo)) return texto.replace(/\r\n/g, '\n');
  try {
    return await prettier.format(texto, { ...OPCOES, filepath: arquivo });
  } catch {
    return texto.replace(/\r\n/g, '\n');
  }
};

// Diff de linhas bem simples (LCS) só para orientar quem está sincronizando.
const diffLinhas = (a, b) => {
  const x = a.split('\n');
  const y = b.split('\n');
  const m = x.length;
  const n = y.length;
  if (m * n > 4_000_000) return ['  (arquivo grande demais para o diff resumido)'];
  const lcs = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        x[i] === y[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const saida = [];
  let i = 0;
  let j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && x[i] === y[j]) {
      i += 1;
      j += 1;
    } else if (j < n && (i === m || lcs[i][j + 1] >= lcs[i + 1][j])) {
      saida.push(`  + ${String(j + 1).padStart(4)} | ${y[j]}`);
      j += 1;
    } else {
      saida.push(`  - ${String(i + 1).padStart(4)} | ${x[i]}`);
      i += 1;
    }
  }
  return saida
    .slice(0, 60)
    .concat(saida.length > 60 ? [`  … +${saida.length - 60} linhas`] : []);
};

const arquivos = new Set(
  COMPARTILHADOS.flatMap(caminho => [
    ...listar(RAIZ, caminho),
    ...listar(IRMAO, caminho),
  ]),
);

const problemas = [];
for (const arquivo of [...arquivos].sort()) {
  if (EXCECOES[arquivo]) continue;
  const aqui = join(RAIZ, 'src', arquivo);
  const la = join(IRMAO, 'src', arquivo);
  if (!existsSync(aqui) || !existsSync(la)) {
    problemas.push({
      arquivo,
      motivo: `só existe em ${existsSync(aqui) ? nomeAtual : basename(IRMAO)}`,
    });
    continue;
  }
  const [a, b] = await Promise.all([
    formatar(arquivo, readFileSync(aqui, 'utf8')),
    formatar(arquivo, readFileSync(la, 'utf8')),
  ]);
  if (a !== b) problemas.push({ arquivo, motivo: 'conteúdo diferente', a, b });
}

if (!problemas.length) {
  const ignorados = [...arquivos].filter(arquivo => EXCECOES[arquivo]).length;
  process.stdout.write(
    `✔ ${arquivos.size - ignorados} arquivos compartilhados iguais a ${relative(RAIZ, IRMAO)}` +
      ` (${ignorados} exceção(ões) documentada(s)).\n`,
  );
  process.exit(0);
}

process.stdout.write(
  `✘ ${problemas.length} arquivo(s) compartilhado(s) divergente(s) entre ${nomeAtual} (-) e ${basename(IRMAO)} (+):\n`,
);
for (const { arquivo, motivo, a, b } of problemas) {
  process.stdout.write(`  • src/${arquivo} — ${motivo}\n`);
  if (mostrarDiff && a !== undefined)
    process.stdout.write(`${diffLinhas(a, b).join('\n')}\n`);
}
process.exit(1);
