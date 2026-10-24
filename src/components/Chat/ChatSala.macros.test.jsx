import React from 'react';
import PropTypes from 'prop-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

vi.mock('service/storage', () => ({
  getRmMusicasBibliotecaPorMestre: vi.fn(),
  getRmMusicasPastasPorMestre: vi.fn(),
  getRmPlaylistsPorMestre: vi.fn(),
}));

import ChatSala from './ChatSala';

// O CodeMirror real não roda bem no jsdom — no teste o editor é um textarea.
vi.mock('./LuaEditor', () => {
  const LuaEditorFake = ({ valorInicial, onChange }) => (
    <textarea
      aria-label="Código Lua"
      defaultValue={valorInicial}
      onChange={e => onChange(e.target.value)}
    />
  );
  LuaEditorFake.propTypes = {
    valorInicial: PropTypes.string,
    onChange: PropTypes.func,
  };
  return { default: LuaEditorFake };
});

const MACROS = [
  {
    id: 'm1',
    nome: 'dano_impacto',
    descricao: 'Queda, arremesso ou colisão',
    codigo: 'enviar(1)',
    somenteMestre: false,
    ordem: 1,
  },
  {
    id: 'm2',
    nome: 'encontros',
    descricao: '',
    codigo: 'enviar(2)',
    somenteMestre: true,
    ordem: 2,
  },
];

const criarMacros = (extra = {}) => ({
  lista: MACROS,
  carregando: false,
  podeGerenciar: false,
  rodando: null,
  pergunta: null,
  executar: vi.fn(),
  testar: vi.fn(),
  salvar: vi.fn(() => Promise.resolve()),
  apagar: vi.fn(() => Promise.resolve()),
  mover: vi.fn(() => Promise.resolve()),
  ...extra,
});

const renderSala = macros =>
  render(
    <ChatSala
      mensagens={[]}
      currentUid="u1"
      onEnviarTexto={vi.fn()}
      onEnviarImagem={vi.fn()}
      onRolar={vi.fn()}
      onApagar={vi.fn()}
      macros={macros}
    />,
  );

const abrirMacros = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Macros' }));

describe('ChatSala — macros', () => {
  beforeEach(() => vi.clearAllMocks());

  it('jogador vê só nome/descrição e Usar', async () => {
    const macros = criarMacros();
    renderSala(macros);
    abrirMacros();

    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('dano_impacto')).toBeInTheDocument();
    expect(
      within(dialogo).getByText('Queda, arremesso ou colisão'),
    ).toBeInTheDocument();
    expect(
      within(dialogo).queryByText(/adicionar macro/i),
    ).not.toBeInTheDocument();
    expect(
      within(dialogo).queryByRole('button', { name: /editar/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(dialogo).getByRole('button', { name: 'Usar dano_impacto' }),
    );
    expect(macros.executar).toHaveBeenCalledWith(MACROS[0]);
  });

  it('sem macros, ícone não aparece', () => {
    renderSala(null);
    expect(
      screen.queryByRole('button', { name: 'Macros' }),
    ).not.toBeInTheDocument();
  });

  it('mestre adiciona macro pelo editor e pode testar antes', async () => {
    const macros = criarMacros({
      podeGerenciar: true,
      testar: vi.fn(() =>
        Promise.resolve([
          { tipo: 'texto', texto: 'DANO FINAL: 32' },
          {
            tipo: 'rolagem',
            rolagem: {
              grupos: [{ quantidade: 1, faces: 20, resultados: [7] }],
              termos: [],
              modificador: 0,
              total: 7,
            },
          },
        ]),
      ),
    });
    renderSala(macros);
    abrirMacros();

    const dialogo = await screen.findByRole('dialog');
    expect(within(dialogo).getByText('só mestre')).toBeInTheDocument();
    fireEvent.click(
      within(dialogo).getByRole('button', { name: /adicionar macro/i }),
    );

    fireEvent.change(await screen.findByLabelText(/nome \(usado em/i), {
      target: { value: 'cura' },
    });
    fireEvent.change(await screen.findByLabelText('Código Lua'), {
      target: { value: 'enviar("curou")' },
    });

    fireEvent.click(screen.getByRole('button', { name: /testar/i }));
    const previa = await screen.findByRole('status', { name: /prévia/i });
    expect(previa).toHaveTextContent('DANO FINAL: 32');
    expect(previa).toHaveTextContent('🎲 1d20 = 7 {[7]}');
    expect(macros.testar).toHaveBeenCalledWith({
      nome: 'cura',
      codigo: 'enviar("curou")',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(macros.salvar).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'cura',
          codigo: 'enviar("curou")',
          somenteMestre: false,
          id: undefined,
        }),
      ),
    );
  });

  it('teste com erro mostra a mensagem do Lua', async () => {
    const macros = criarMacros({
      podeGerenciar: true,
      testar: vi.fn(() => Promise.reject(new Error('macro:3: boom'))),
    });
    renderSala(macros);
    abrirMacros();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Editar dano_impacto' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: /testar/i }));

    expect(
      await screen.findByRole('status', { name: /prévia/i }),
    ).toHaveTextContent('Erro: macro:3: boom');
  });

  it('mestre edita, apaga e reordena', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const macros = criarMacros({ podeGerenciar: true });
    renderSala(macros);
    abrirMacros();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Descer dano_impacto' }),
    );
    expect(macros.mover).toHaveBeenCalledWith(0, 1);
    expect(
      screen.getByRole('button', { name: 'Subir dano_impacto' }),
    ).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Apagar encontros' }));
    expect(macros.apagar).toHaveBeenCalledWith(MACROS[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Editar encontros' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(macros.salvar).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'm2',
          nome: 'encontros',
          somenteMestre: true,
        }),
      ),
    );
  });

  it('/m nome executa a macro; nome inexistente mostra erro', () => {
    const macros = criarMacros();
    renderSala(macros);
    const campo = screen.getByLabelText('Mensagem');

    fireEvent.change(campo, { target: { value: '/m DANO_IMPACTO' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(macros.executar).toHaveBeenCalledWith(MACROS[0]);
    expect(campo).toHaveValue('');

    fireEvent.change(campo, { target: { value: '/m nada' } });
    fireEvent.click(screen.getByRole('button', { name: /enviar mensagem/i }));
    expect(
      screen.getByText('Macro "nada" não encontrada.'),
    ).toBeInTheDocument();
  });
});

describe('ChatSala — perguntas da macro', () => {
  it('inputQuery mostra o padrão e responde o texto', () => {
    const responder = vi.fn();
    renderSala(
      criarMacros({
        pergunta: {
          id: 1,
          macroNome: 'dano_impacto',
          pedido: { tipo: 'input', pergunta: 'VIT:', padrao: '0' },
          responder,
          cancelar: vi.fn(),
        },
      }),
    );
    const campo = screen.getByLabelText('VIT:');
    expect(campo).toHaveValue('0');
    fireEvent.change(campo, { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(responder).toHaveBeenCalledWith('40');
  });

  it('choose marca o padrão, responde o índice e pode cancelar a macro', () => {
    const responder = vi.fn();
    const cancelar = vi.fn();
    renderSala(
      criarMacros({
        pergunta: {
          id: 2,
          macroNome: 'dano_impacto',
          pedido: {
            tipo: 'choose',
            titulo: 'Superfície:',
            opcoes: ['Água', 'Pedra', 'Metal'],
            padrao: 2,
          },
          responder,
          cancelar,
        },
      }),
    );
    const lista = screen.getByRole('list', { name: 'Superfície:' });
    expect(
      within(lista).getByText('Pedra').closest('[role="button"]'),
    ).toHaveClass('Mui-selected');
    fireEvent.click(within(lista).getByText('Metal'));
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(responder).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole('button', { name: /cancelar macro/i }));
    expect(cancelar).toHaveBeenCalled();
  });
});
