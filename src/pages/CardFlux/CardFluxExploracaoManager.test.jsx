import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CardFluxExploracaoManager from './CardFluxExploracaoManager';

const { navigateMock, storageMocks } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  storageMocks: {
    addRmCardfluxExploracao: vi.fn(),
    getRmCardfluxExploracoesPorCampanha: vi.fn(),
    removeRmCardfluxExploracao: vi.fn(),
    updateRmCardfluxExploracao: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({
    campanhaAtiva: {
      id: 'camp-1',
      nome: 'Campanha Teste',
      universoId: 'universo-1',
      mestreId: 'mestre-1',
    },
  }),
}));

vi.mock('context/SnackbarContext', () => ({
  useSnackbar: () => ({
    notifyError: vi.fn(),
  }),
}));

vi.mock('service/storage', () => storageMocks);

describe('CardFluxExploracaoManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageMocks.getRmCardfluxExploracoesPorCampanha.mockResolvedValue([
      {
        id: 'exp-1',
        nome: 'Exploração Alfa',
        status: 'ativa',
        dimensoes: { linhas: 3, colunas: 3 },
        baralhos: ['deck-1'],
        quadrantes: [[{ x: 0, y: 0, cartaId: 'c1' }]],
        configuracao: { modo: 'predefinida', densidade: 30 },
      },
    ]);
    storageMocks.updateRmCardfluxExploracao.mockResolvedValue();
    storageMocks.addRmCardfluxExploracao.mockResolvedValue({ id: 'exp-2' });
    storageMocks.removeRmCardfluxExploracao.mockResolvedValue();
  });

  it('renderiza a listagem e contadores da campanha', async () => {
    render(<CardFluxExploracaoManager />);

    expect(await screen.findByText('Explorações de CardFlux')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Ativas')).toBeInTheDocument();
    expect(screen.getByText('Campanha')).toBeInTheDocument();
    expect(screen.getByText('Exploração Alfa')).toBeInTheDocument();
  });

  it('volta para a tela do CardFlux sem criar exploração', async () => {
    const user = userEvent.setup();

    render(<CardFluxExploracaoManager />);

    await screen.findByText('Exploração Alfa');
    await user.click(screen.getByRole('button', { name: 'Voltar' }));

    expect(navigateMock).toHaveBeenCalledWith('/cardflux');
    expect(storageMocks.addRmCardfluxExploracao).not.toHaveBeenCalled();
  });

  it('renomeia uma exploração via modal e sem prompt nativo', async () => {
    const user = userEvent.setup();
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => 'Prompt inválido');
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<CardFluxExploracaoManager />);

    await screen.findByText('Exploração Alfa');
    await user.click(screen.getByRole('button', { name: 'Renomear' }));

    const input = await screen.findByLabelText('Novo nome da exploração');
    await user.clear(input);
    await user.type(input, 'Exploração Beta');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(storageMocks.updateRmCardfluxExploracao).toHaveBeenCalledWith('exp-1', expect.objectContaining({ nome: 'Exploração Beta' }));
    });

    expect(promptSpy).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('impede renomeação com nome vazio ou só espaços', async () => {
    const user = userEvent.setup();

    render(<CardFluxExploracaoManager />);

    await screen.findByText('Exploração Alfa');
    await user.click(screen.getByRole('button', { name: 'Renomear' }));

    const input = await screen.findByLabelText('Novo nome da exploração');
    await user.clear(input);
    await user.type(input, '   ');

    const confirmButton = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText('Informe um nome válido.')).toBeInTheDocument();
    expect(storageMocks.updateRmCardfluxExploracao).not.toHaveBeenCalled();
  });

  it('duplicata cria uma exploração independente com snapshot e nome de cópia', async () => {
    const user = userEvent.setup();

    render(<CardFluxExploracaoManager />);

    await screen.findByText('Exploração Alfa');
    await user.click(screen.getByRole('button', { name: 'Duplicar' }));

    const input = await screen.findByLabelText('Novo nome da exploração');
    expect(input).toHaveValue('Exploração Alfa (Cópia)');
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(storageMocks.addRmCardfluxExploracao).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Exploração Alfa (Cópia)',
          status: 'ativa',
          campanhaId: 'camp-1',
        }),
      );
    });
  });

  it('exclusão exige confirmação do modal e não usa window.confirm', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<CardFluxExploracaoManager />);

    await screen.findByText('Exploração Alfa');
    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText('Excluir exploração')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));

    await waitFor(() => {
      expect(storageMocks.removeRmCardfluxExploracao).toHaveBeenCalledWith('exp-1');
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
