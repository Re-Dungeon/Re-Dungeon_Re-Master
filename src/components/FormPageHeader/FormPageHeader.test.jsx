import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormPageHeader from './FormPageHeader';

describe('FormPageHeader', () => {
  it('renderiza título e subtítulo recebidos por prop', () => {
    render(
      <FormPageHeader
        titulo="Nova Veia Astral"
        subtitulo="Preencha os dados da nova veia astral"
        onVoltar={() => {}}
      />,
    );

    expect(screen.getByText('Nova Veia Astral')).toBeInTheDocument();
    expect(
      screen.getByText('Preencha os dados da nova veia astral'),
    ).toBeInTheDocument();
  });

  it('chama onVoltar ao clicar no botão Voltar', async () => {
    const onVoltar = vi.fn();
    const user = userEvent.setup();
    render(
      <FormPageHeader titulo="Título" subtitulo="Sub" onVoltar={onVoltar} />,
    );

    await user.click(screen.getByRole('button', { name: '← Voltar' }));

    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});
