import { describe, expect, it } from 'vitest';

import { LIMITE_ENVIAR, criarExecucao } from './luaRuntime';
import danoImpacto from './__fixtures__/dano_impacto.lua?raw';

// uint32 fixo: rolarFace(n) = (2 % n) + 1 → 3 para qualquer dado de 3+ faces.
const randomFixo = () => 2;

// Roda a macro até o fim respondendo os pedidos na ordem dada.
const executar = (codigo, respostas = [], opcoes = {}) => {
  const execucao = criarExecucao(codigo, { randomFn: randomFixo, ...opcoes });
  const pedidos = [];
  let passo = execucao.iniciar();
  while (passo.pedido) {
    pedidos.push(passo.pedido);
    passo = execucao.responder(respostas[pedidos.length - 1]);
  }
  return { ...passo, pedidos };
};

describe('criarExecucao — API da macro', () => {
  it('enviar acumula mensagens na ordem', () => {
    const { fim } = executar('enviar("olá") enviar(1 + 2)');
    expect(fim.saidas).toEqual([
      { tipo: 'texto', texto: 'olá' },
      { tipo: 'texto', texto: '3' },
    ]);
  });

  it('inputQuery pausa, mostra pergunta/padrão e retoma com a resposta', () => {
    const { fim, pedidos } = executar(
      'local n = inputQuery("Nome:", "Fulano") enviar("oi " .. n)',
      ['Wesley'],
    );
    expect(pedidos).toEqual([{ tipo: 'input', pergunta: 'Nome:', padrao: 'Fulano' }]);
    expect(fim.saidas).toEqual([{ tipo: 'texto', texto: 'oi Wesley' }]);
  });

  it('choose devolve índice e texto (padrão limitado à lista)', () => {
    const { fim, pedidos } = executar(
      'local i, t = choose("Arma:", {"Espada", "Arco"}, 9) enviar(i .. "=" .. t)',
      [2],
    );
    expect(pedidos[0]).toEqual({ tipo: 'choose', titulo: 'Arma:', opcoes: ['Espada', 'Arco'], padrao: 2 });
    expect(fim.saidas[0].texto).toBe('2=Arco');
  });

  it('resposta nula vira nil no Lua', () => {
    const { fim } = executar('local r = inputQuery("?") enviar(tostring(r))', [null]);
    expect(fim.saidas[0].texto).toBe('nil');
  });

  it('rolar publica a rolagem e devolve o total; rolarLocal é silencioso', () => {
    const { fim } = executar('local a = rolar("2d6+1") local b = rolarLocal("1d4") local c = rolarLocal("") enviar(a .. "/" .. b .. "/" .. c)');
    expect(fim.saidas).toHaveLength(2);
    expect(fim.saidas[0]).toMatchObject({ tipo: 'rolagem', rolagem: { total: 7, termos: [1] } });
    expect(fim.saidas[1].texto).toBe('7/3/0');
  });

  it('rolarLocal aceita expressão só com números', () => {
    const { fim } = executar('enviar(rolarLocal("5-2"))');
    expect(fim.saidas[0].texto).toBe('3');
  });

  it('expressão de rolagem inválida vira erro Lua', () => {
    expect(executar('rolar("1d7")').erro).toMatch(/rolar\("1d7"\): Dados permitidos/);
  });

  it('math.random usa o gerador injetado e respeita a faixa', () => {
    const { fim } = executar('enviar(math.random(1, 6) .. "," .. math.random(10) .. "," .. tostring(math.random() < 1))');
    expect(fim.saidas[0].texto).toBe('3,3,true');
  });
});

describe('criarExecucao — isolamento e limites', () => {
  it.each(['os', 'io', 'require', 'load', 'loadstring', 'dofile', 'loadfile', 'debug', 'package', 'print', 'coroutine'])(
    '%s não existe para a macro',
    nome => {
      const { fim } = executar(`enviar(tostring(${nome}))`);
      expect(fim.saidas[0].texto).toBe('nil');
    },
  );

  it('laço infinito é interrompido', () => {
    const { erro } = executar('while true do end', [], { limiteInstrucoes: 100_000 });
    expect(erro).toMatch(/limite de processamento/);
  });

  it('erro de sintaxe e de execução trazem a linha', () => {
    expect(executar('local x = \n x +').erro).toMatch(/^macro:2:/);
    expect(executar('local t = nil\nlocal y = t.campo').erro).toMatch(/^macro:2:.*index a nil value/);
  });

  it(`no máximo ${LIMITE_ENVIAR} enviar por execução`, () => {
    expect(executar('for i = 1, 6 do enviar(i) end').erro).toMatch(/no máximo 5 mensagens/);
  });

  it('pcall captura erros dentro da macro', () => {
    const { fim } = executar('local ok = pcall(function() error("x") end) enviar(tostring(ok))');
    expect(fim.saidas[0].texto).toBe('false');
  });
});

describe('macro de exemplo dano_impacto (sem alterações)', () => {
  it('roda do início ao fim e envia o resultado', () => {
    const respostas = ['Wesley', 'queda', '6', 12, '2', '1', '40', '1d6+2', '0'];
    const { fim, pedidos, erro } = executar(danoImpacto, respostas);

    expect(erro).toBeUndefined();
    expect(pedidos.map(p => p.tipo)).toEqual([
      'input', 'input', 'input', 'choose', 'input', 'input', 'input', 'input', 'input',
    ]);
    expect(pedidos[3]).toMatchObject({ titulo: 'Escolha a superficie do impacto:', padrao: 10 });
    expect(pedidos[3].opcoes).toHaveLength(21);
    expect(pedidos[7]).toMatchObject({ padrao: '0' });

    expect(fim.saidas).toHaveLength(1);
    const { texto } = fim.saidas[0];
    // 6 m em pedra: 25 + 5d8 (3 cada) = 40; reação 3+2+1=6 vs obstáculo 11 →
    // falha grave (100%); reduções: VIT 40 → 3, armadura 1d6+2 → 5, extras 0.
    expect(texto).toContain('DANO DE IMPACTO - wesley');
    expect(texto).toContain('>>> DANO FINAL: 32 <<<');
    expect(texto).toContain('Altura equivalente: 6.0 m');
    expect(texto).toContain('Bruto: 25 + 5d8 = 40 [3, 3, 3, 3, 3]');
    expect(texto).toContain('Rolagem: 6 | Obstaculo: 11');
    expect(texto).toContain('Defesa da armadura: 1d6+2 = 5');
    expect(texto).toContain('Multiplicador da reacao: 100%');
  });
});
