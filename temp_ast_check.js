const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const src = fs.readFileSync(path.join('src','components','PersonagemFichaDialog','PersonagemFichaDialog.jsx'),'utf8');
const ast = parser.parse(src, {
  sourceType: 'module',
  plugins: ['jsx', 'classProperties', 'classPrivateProperties', 'decorators-legacy'],
});
let found = false;
traverse(ast, {
  VariableDeclarator(path) {
    if (path.node.id.name === 'PersonagemFichaDialog') {
      const loc = path.node.loc;
      console.log('found', loc.start.line, loc.start.column, 'end', loc.end.line, loc.end.column);
      found = true;
      path.stop();
    }
  },
});
if (!found) {
  console.error('PersonagemFichaDialog not found');
  process.exit(1);
}
