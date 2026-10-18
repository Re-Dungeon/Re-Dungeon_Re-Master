// Rolagem de dados do chat de campanha — funções puras, mantidas em sincronia
// com a cópia do site dos jogadores (Ficha-RPG---Re-Dungeon-, mesmo arquivo/
// mesmos testes) e com o bloco do chat
// no `firestore.rules` (limites de grupos/dados/termos).
//
// Aleatoriedade: `crypto.getRandomValues` (CSPRNG do navegador) com rejeição
// das sobras — `x % faces` direto sobre 32 bits favoreceria as faces baixas.
// A rolagem acontece no cliente: a regra valida só a estrutura da mensagem
// (não há laços nas Firestore Rules para somar/conferir cada dado).

export const FACES_PERMITIDAS = [4, 6, 8, 10, 12, 20, 100];
export const MAX_DADOS = 100;
export const MAX_GRUPOS = 10;
export const MAX_TERMOS = 20;
export const MAX_VALOR_TERMO = 999;

const UINT32_RANGE = 2 ** 32;

export const randomUint32 = () => {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0];
};

// Inteiro uniforme em [1, faces]. `randomFn` (uint32) é injetável para testes.
export const rolarFace = (faces, randomFn = randomUint32) => {
  const limite = UINT32_RANGE - (UINT32_RANGE % faces);
  let valor = randomFn();
  while (valor >= limite) valor = randomFn();
  return (valor % faces) + 1;
};

const PREFIXO_COMANDO = /^\/(r|roll|rs|gr)(?=\s|$)/i;
const COMANDOS_SECRETOS = ['rs', 'gr'];
const TOKEN = /([+-]?)(\d*)(d?)(\d+)/iy;

export const EXEMPLO_COMANDO = '/r 1d20+5-2';

const erro = mensagem => ({ erro: `${mensagem} Ex.: ${EXEMPLO_COMANDO}` });

export const ehComandoRolagem = texto =>
  typeof texto === 'string' && PREFIXO_COMANDO.test(texto.trim());

// Garante os limites comuns aos dois fluxos (comando e modal).
export const validarEspecificacao = ({ grupos, termos }) => {
  if (grupos.length === 0) return 'Inclua ao menos um dado.';
  if (grupos.length > MAX_GRUPOS)
    return `No máximo ${MAX_GRUPOS} grupos de dados.`;
  if (grupos.some(g => !FACES_PERMITIDAS.includes(g.faces))) {
    return `Dados permitidos: ${FACES_PERMITIDAS.map(f => `d${f}`).join(', ')}.`;
  }
  if (grupos.some(g => !Number.isInteger(g.quantidade) || g.quantidade < 1)) {
    return 'A quantidade de cada dado deve ser ao menos 1.';
  }
  const totalDados = grupos.reduce((soma, g) => soma + g.quantidade, 0);
  if (totalDados > MAX_DADOS)
    return `No máximo ${MAX_DADOS} dados por rolagem.`;
  if (termos.length > MAX_TERMOS)
    return `No máximo ${MAX_TERMOS} bônus/obstáculos.`;
  if (termos.some(t => !Number.isInteger(t) || Math.abs(t) > MAX_VALOR_TERMO)) {
    return `Bônus/obstáculo vão de 0 a ${MAX_VALOR_TERMO}.`;
  }
  return null;
};

// "/r 2d6+1d4+3-1" → { secreta, grupos: [{quantidade, faces}], termos: [3, -1] }
// ou { erro }. Retorna null se o texto não é um comando de rolagem.
export const interpretarComandoRolagem = texto => {
  if (!ehComandoRolagem(texto)) return null;
  const valor = texto.trim();
  const [prefixo, comando] = valor.match(PREFIXO_COMANDO);
  const expressao = valor.slice(prefixo.length).replace(/\s+/g, '');
  if (!expressao) return erro('Informe os dados.');

  const grupos = [];
  const termos = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < expressao.length) {
    const inicio = TOKEN.lastIndex;
    const match = TOKEN.exec(expressao);
    if (!match) return erro(`Não entendi "${expressao.slice(inicio)}".`);
    const [, sinal, quantidadeTexto, d, numero] = match;
    if (inicio > 0 && !sinal)
      return erro(`Falta + ou - antes de "${match[0]}".`);
    if (d) {
      if (sinal === '-') return erro('Dados não podem ser subtraídos.');
      grupos.push({
        quantidade: quantidadeTexto ? Number(quantidadeTexto) : 1,
        faces: Number(numero),
      });
    } else {
      if (quantidadeTexto) return erro(`Não entendi "${match[0]}".`);
      termos.push(sinal === '-' ? -Number(numero) : Number(numero));
    }
  }

  const problema = validarEspecificacao({ grupos, termos });
  if (problema) return erro(problema);
  return {
    secreta: COMANDOS_SECRETOS.includes(comando.toLowerCase()),
    grupos,
    termos,
  };
};

// Fluxo do modal: linhas [{faces, quantidade}] + bônus/obstáculo (>= 0).
export const especificacaoDoModal = ({
  linhas,
  bonus = 0,
  obstaculo = 0,
  secreta = false,
}) => ({
  secreta: Boolean(secreta),
  grupos: linhas.map(({ faces, quantidade }) => ({ faces, quantidade })),
  termos: [...(bonus ? [bonus] : []), ...(obstaculo ? [-obstaculo] : [])],
});

// Rola a especificação → objeto gravado em `mensagem.rolagem`.
export const rolarEspecificacao = (
  { grupos, termos },
  randomFn = randomUint32,
) => {
  const gruposRolados = grupos.map(({ quantidade, faces }) => ({
    quantidade,
    faces,
    resultados: Array.from({ length: quantidade }, () =>
      rolarFace(faces, randomFn),
    ),
  }));
  const modificador = termos.reduce((soma, termo) => soma + termo, 0);
  const somaDados = gruposRolados.reduce(
    (soma, g) => soma + g.resultados.reduce((s, r) => s + r, 0),
    0,
  );
  return {
    grupos: gruposRolados,
    termos: [...termos],
    modificador,
    total: somaDados + modificador,
  };
};

const comSinal = valor => (valor < 0 ? ` - ${-valor}` : ` + ${valor}`);

// "2d6 + 1d4 + 2"
export const resumoRolagem = ({ grupos, modificador }) =>
  grupos.map(g => `${g.quantidade}d${g.faces}`).join(' + ') +
  (modificador ? comSinal(modificador) : '');

// "{[4, 3] + [2] + 3 - 1}"
export const detalheRolagem = ({ grupos, termos }) =>
  `{${grupos.map(g => `[${g.resultados.join(', ')}]`).join(' + ')}${termos.map(comSinal).join('')}}`;

// Destaque de crítico: só no d20 (20 natural / 1 natural).
export const criticoDoResultado = (faces, resultado) => {
  if (faces !== 20) return null;
  if (resultado === 20) return 'sucesso';
  if (resultado === 1) return 'falha';
  return null;
};
