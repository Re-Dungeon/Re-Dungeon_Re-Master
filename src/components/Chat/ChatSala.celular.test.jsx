import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ChatSala from './ChatSala';

// Celular: o jsdom não aplica media query, então a consulta é simulada.
const mocks = vi.hoisted(() => ({ celular: true }));
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => mocks.celular }));

// O AudioDialog do Re:Master (dentro do ChatSala) importa storage/auth: sem
// estes mocks o teste inicializaria o Firebase de verdade.
vi.mock('context/AuthContext', () => ({
  useAuth: () => ({ currentUser: { uid: 'u1' } }),
}));

vi.mock('service/storage', () => ({
  getRmMusicasBibliotecaPorMestre: vi.fn(() => Promise.resolve([])),
  getRmMusicasPastasPorMestre: vi.fn(() => Promise.resolve([])),
  getRmPlaylistsPorMestre: vi.fn(() => Promise.resolve([])),
}));

const macrosFalsas = () => ({
  lista: [],
  carregando: false,
  podeGerenciar: false,
  rodando: null,
  pergunta: null,
  executar: vi.fn(),
  testar: vi.fn(),
  salvar: vi.fn(),
  apagar: vi.fn(),
  mover: vi.fn(),
});

const audioFalso = () => ({
  tocando: false,
  pausado: false,
  repetir: false,
  titulo: null,
  bloqueado: false,
  erroPlayer: null,
  podeControlar: false,
  volume: 50,
  mudo: false,
  setVolume: vi.fn(),
  setMudo: vi.fn(),
  liberarSom: vi.fn(),
  tocar: vi.fn(),
  pausar: vi.fn(),
  retomar: vi.fn(),
  parar: vi.fn(),
  setRepetir: vi.fn(),
});

const COMBATE = [
  { id: 'ataque', titulo: 'Ataque', itens: [] },
  { id: 'defesa', titulo: 'Defesa', itens: [] },
];

const renderSala = props =>
  render(
    <ChatSala
      mensagens={[]}
      currentUid="u1"
      onEnviarTexto={vi.fn()}
      onEnviarImagem={vi.fn()}
      onRolar={vi.fn()}
      onApagar={vi.fn()}
      {...props}
    />,
  );

describe('ChatSala — fileira de ações no celular', () => {
  beforeEach(() => {
    mocks.celular = true;
  });

  it('com poucas ações mostra todas direto, sem o menu "⋯"', () => {
    renderSala({ macros: macrosFalsas() });
    expect(screen.getByRole('button', { name: 'Macros' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mais ações' })).toBeNull();
  });

  it('com macros + música + combate, as secundárias vão para o menu "⋯"', () => {
    renderSala({ macros: macrosFalsas(), audio: audioFalso(), opcoesCombate: COMBATE });
    expect(screen.queryByRole('button', { name: 'Macros' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Música da mesa' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Combate' })).toBeNull();
    // As fixas continuam à vista.
    expect(screen.getByRole('button', { name: 'Enviar imagem' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rolar dados' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    expect(screen.getByRole('menuitem', { name: 'Macros' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Música da mesa' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Combate' })).toBeInTheDocument();
  });

  it('escolher um item do menu abre o diálogo correspondente', () => {
    renderSala({ macros: macrosFalsas(), audio: audioFalso(), opcoesCombate: COMBATE });
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Combate' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Combate');
  });

  it('no desktop nada muda: todos os botões ficam à vista e não há menu', () => {
    mocks.celular = false;
    renderSala({ macros: macrosFalsas(), audio: audioFalso(), opcoesCombate: COMBATE });
    expect(screen.getByRole('button', { name: 'Macros' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Música da mesa' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Combate' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mais ações' })).toBeNull();
  });
});
