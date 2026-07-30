import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ROUTE_PATHS } from 'common/constants/routes';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const getRmCampanhaNpcs = vi.fn();
const getRmCampanhaCriaturas = vi.fn();
const getRmCenas = vi.fn();
const getRmMapasPorCampanha = vi.fn();
const getRmMissoesPorCampanha = vi.fn();
const getRmNotasPorCampanha = vi.fn();
vi.mock('service/storage', () => ({
  getRmCampanhaNpcs: (...args) => getRmCampanhaNpcs(...args),
  getRmCampanhaCriaturas: (...args) => getRmCampanhaCriaturas(...args),
  getRmCenas: (...args) => getRmCenas(...args),
  getRmMapasPorCampanha: (...args) => getRmMapasPorCampanha(...args),
  getRmMissoesPorCampanha: (...args) => getRmMissoesPorCampanha(...args),
  getRmNotasPorCampanha: (...args) => getRmNotasPorCampanha(...args),
}));

let campanhaAtiva = {
  id: 'c1',
  nome: 'Ascensão Carmesim',
  universoId: 'u1',
  mestreId: 'm1',
};
vi.mock('context/CampanhaContext', () => ({
  useCampanha: () => ({ campanhaAtiva }),
}));

import BuscaGlobal from './BuscaGlobal';

const renderBusca = () =>
  render(
    <MemoryRouter>
      <BuscaGlobal />
    </MemoryRouter>,
  );

describe('BuscaGlobal (busca cross-entidade da campanha ativa)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    campanhaAtiva = {
      id: 'c1',
      nome: 'Ascensão Carmesim',
      universoId: 'u1',
      mestreId: 'm1',
    };
    getRmCampanhaNpcs.mockResolvedValue([
      { id: 'npc1', nome: 'Grumnak, o Orc' },
    ]);
    getRmCampanhaCriaturas.mockResolvedValue([
      { id: 'crt1', nome: 'Rato Gigante' },
    ]);
    getRmCenas.mockResolvedValue([
      { id: 'cena1', campanhaId: 'c1', titulo: 'Chegada na Cidade' },
      { id: 'cenaOutra', campanhaId: 'outra', titulo: 'Fora da campanha' },
    ]);
    getRmMapasPorCampanha.mockResolvedValue([
      { id: 'mapa1', nome: 'Mapa da Cidade' },
    ]);
    getRmMissoesPorCampanha.mockResolvedValue([
      { id: 'missao1', titulo: 'Resgatar o Prefeito' },
    ]);
    getRmNotasPorCampanha.mockResolvedValue([
      { id: 'nota1', titulo: 'Ideia para a sessão' },
    ]);
  });

  it('não renderiza nada sem campanha ativa', () => {
    campanhaAtiva = null;
    const { container } = renderBusca();

    expect(container).toBeEmptyDOMElement();
  });

  it('carrega os dados da campanha ao abrir e busca por título/nome', async () => {
    const user = userEvent.setup();
    renderBusca();

    await user.click(screen.getByLabelText('Buscar na campanha'));
    await waitFor(() => expect(getRmCampanhaNpcs).toHaveBeenCalledWith('c1'));

    await user.type(screen.getByLabelText('Termo de busca'), 'gigante');

    await waitFor(() =>
      expect(screen.getByText('Rato Gigante')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Grumnak, o Orc')).not.toBeInTheDocument();
  });

  it('inclui só as cenas da campanha ativa (filtra outras campanhas)', async () => {
    const user = userEvent.setup();
    renderBusca();

    await user.click(screen.getByLabelText('Buscar na campanha'));
    await user.type(screen.getByLabelText('Termo de busca'), 'cidade');

    await waitFor(() =>
      expect(screen.getByText('Chegada na Cidade')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Fora da campanha')).not.toBeInTheDocument();
  });

  it('navega para a Cena selecionada com o state de seleção e fecha a busca', async () => {
    const user = userEvent.setup();
    renderBusca();

    await user.click(screen.getByLabelText('Buscar na campanha'));
    await user.type(screen.getByLabelText('Termo de busca'), 'cidade');
    await waitFor(() =>
      expect(screen.getByText('Chegada na Cidade')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Chegada na Cidade'));

    expect(navigate).toHaveBeenCalledWith(ROUTE_PATHS.CENAS, {
      state: { selecionarCenaId: 'cena1' },
    });
  });

  it('navega para a lista de NPCs ao selecionar um NPC (sem state)', async () => {
    const user = userEvent.setup();
    renderBusca();

    await user.click(screen.getByLabelText('Buscar na campanha'));
    await user.type(screen.getByLabelText('Termo de busca'), 'grumnak');
    await waitFor(() =>
      expect(screen.getByText('Grumnak, o Orc')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Grumnak, o Orc'));

    expect(navigate).toHaveBeenCalledWith(ROUTE_PATHS.NPCS, undefined);
  });

  it('mostra mensagem de nenhum resultado quando nada casa', async () => {
    const user = userEvent.setup();
    renderBusca();

    await user.click(screen.getByLabelText('Buscar na campanha'));
    await user.type(screen.getByLabelText('Termo de busca'), 'inexistente');

    await waitFor(() =>
      expect(
        screen.getByText('Nenhum resultado para "inexistente".'),
      ).toBeInTheDocument(),
    );
  });
});
