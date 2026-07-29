import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const getRmNpcs = vi.fn(() => Promise.resolve([]));
const getRmCriaturas = vi.fn(() => Promise.resolve([]));
const getRmMissoes = vi.fn(() => Promise.resolve([]));
vi.mock('service/storage', () => ({
  getRmNpcs: (...args) => getRmNpcs(...args),
  getRmCriaturas: (...args) => getRmCriaturas(...args),
  getRmMissoes: (...args) => getRmMissoes(...args),
}));

import CenaDetailPanel from './CenaDetailPanel';

const CENA = { id: 'cena1', titulo: 'Chegada na Cidade', campanhaId: 'c1' };

describe('CenaDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza nada quando cena é null', () => {
    render(
      <CenaDetailPanel
        cena={null}
        podeEscrever
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText('Chegada na Cidade')).not.toBeInTheDocument();
  });

  it('mostra o botão "Marcar como Cena Atual" quando a cena não é a atual e o usuário pode escrever', () => {
    render(
      <CenaDetailPanel
        cena={CENA}
        podeEscrever
        ehCenaAtual={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onMarcarCenaAtual={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Marcar como Cena Atual' }),
    ).toBeInTheDocument();
  });

  it('chama onMarcarCenaAtual com o id da cena ao clicar no botão', async () => {
    const onMarcarCenaAtual = vi.fn();
    const user = userEvent.setup();
    render(
      <CenaDetailPanel
        cena={CENA}
        podeEscrever
        ehCenaAtual={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onMarcarCenaAtual={onMarcarCenaAtual}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Marcar como Cena Atual' }));
    expect(onMarcarCenaAtual).toHaveBeenCalledWith('cena1');
  });

  it('mostra o chip "Cena Atual" em vez do botão quando ehCenaAtual é true', () => {
    render(
      <CenaDetailPanel
        cena={CENA}
        podeEscrever
        ehCenaAtual
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onMarcarCenaAtual={vi.fn()}
      />,
    );

    expect(screen.getByText('Cena Atual')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Marcar como Cena Atual' }),
    ).not.toBeInTheDocument();
  });

  it('não mostra o botão de marcar/remover quando podeEscrever é false', () => {
    render(
      <CenaDetailPanel
        cena={CENA}
        podeEscrever={false}
        ehCenaAtual={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Marcar como Cena Atual' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Remover cena Chegada na Cidade'),
    ).not.toBeInTheDocument();
  });
});
