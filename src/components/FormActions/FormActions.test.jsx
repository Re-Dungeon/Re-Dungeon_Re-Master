import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormActions from './FormActions';

describe('FormActions', () => {
  it('chama onCancelar ao clicar em Cancelar', async () => {
    const onCancelar = vi.fn();
    const user = userEvent.setup();
    render(
      <FormActions
        onCancelar={onCancelar}
        isSubmitting={false}
        labelSalvar="Salvar Item"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it('renderiza o label de salvar recebido e desabilita o botão quando isSubmitting é true', () => {
    render(
      <FormActions
        onCancelar={() => {}}
        isSubmitting
        labelSalvar="Salvar Alterações"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Salvar Alterações' }),
    ).toBeDisabled();
  });

  it('não desabilita o botão de salvar quando isSubmitting é false', () => {
    render(
      <FormActions
        onCancelar={() => {}}
        isSubmitting={false}
        labelSalvar="Salvar Item"
      />,
    );

    expect(screen.getByRole('button', { name: 'Salvar Item' })).toBeEnabled();
  });
});
