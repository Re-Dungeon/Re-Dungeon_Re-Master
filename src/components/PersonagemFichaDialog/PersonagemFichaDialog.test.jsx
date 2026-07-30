import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const getPersonagemSubcolecao = vi.fn();
const getAptidao = vi.fn();
const getRaca = vi.fn();
const getClasse = vi.fn();
const getVeiaAstral = vi.fn();
vi.mock('service/storage', () => ({
  getPersonagemSubcolecao: (...args) => getPersonagemSubcolecao(...args),
  getAptidao: (...args) => getAptidao(...args),
  getRaca: (...args) => getRaca(...args),
  getClasse: (...args) => getClasse(...args),
  getVeiaAstral: (...args) => getVeiaAstral(...args),
}));

import PersonagemFichaDialog from './PersonagemFichaDialog';

const PERSONAGEM = {
  id: 'p1',
  nome: 'Grumnak, o Orc',
  descricao: 'Um orc rabugento',
  secundariosBase: { defesa: 0, prontidao: 2 },
  atributosBonus: { agilidade: 3, vitalidade: 1 },
  nosDesbloqueados: ['scXcrtWfvpAZNI6WKHAj', 'UYcKdf1pAfOCMck1ITM8'],
};

describe('PersonagemFichaDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPersonagemSubcolecao.mockResolvedValue([]);
    getAptidao.mockResolvedValue(null);
    getRaca.mockResolvedValue(null);
    getClasse.mockResolvedValue(null);
    getVeiaAstral.mockResolvedValue(null);
  });

  it('não busca subcoleções nem renderiza campos quando fechado', () => {
    render(
      <PersonagemFichaDialog
        open={false}
        onClose={() => {}}
        personagem={PERSONAGEM}
      />,
    );

    expect(getPersonagemSubcolecao).not.toHaveBeenCalled();
    expect(screen.queryByText('Secundarios Base')).not.toBeInTheDocument();
  });

  it('mostra os campos do personagem na aba "Ficha" como grade de label/valor, não JSON cru', async () => {
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Secundarios Base')).toBeInTheDocument(),
    );
    expect(screen.getByText('Defesa')).toBeInTheDocument();
    expect(screen.getByText('Prontidao')).toBeInTheDocument();
    expect(screen.queryByText(/"defesa":\s*0/)).not.toBeInTheDocument();
  });

  it('formata campo Timestamp do Firestore como data por extenso em pt-BR', async () => {
    const data = new Date(2026, 6, 29, 22, 34, 44);
    const personagemComTimestamp = {
      ...PERSONAGEM,
      ultimaAtualizacao: {
        seconds: Math.floor(data.getTime() / 1000),
        nanoseconds: 0,
      },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComTimestamp}
      />,
    );

    const offsetHoras = -data.getTimezoneOffset() / 60;
    const sinal = offsetHoras >= 0 ? '+' : '-';
    const esperado = `29 de julho de 2026 às 22:34:44 UTC${sinal}${Math.abs(offsetHoras)}`;

    await waitFor(() => expect(screen.getByText(esperado)).toBeInTheDocument());
  });

  it('renderiza lista de primitivos como chips', async () => {
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('scXcrtWfvpAZNI6WKHAj')).toBeInTheDocument(),
    );
    expect(screen.getByText('UYcKdf1pAfOCMck1ITM8')).toBeInTheDocument();
  });

  it('busca as subcoleções conhecidas quando o diálogo abre', async () => {
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(getPersonagemSubcolecao).toHaveBeenCalledWith(
        'p1',
        'aptidoesAdquiridas',
      ),
    );
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith('p1', 'arts');
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith(
      'p1',
      'historicoSorte',
    );
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith('p1', 'variantes');
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith('p1', 'nucleos');
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith(
      'p1',
      'itensInventario',
    );
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith(
      'p1',
      'materiaisInventario',
    );
    expect(getPersonagemSubcolecao).toHaveBeenCalledWith(
      'p1',
      'receitasInventario',
    );
  });

  it('mostra os docs de uma subcoleção com dados na aba correspondente', async () => {
    getPersonagemSubcolecao.mockImplementation((_id, subcolecao) =>
      subcolecao === 'arts'
        ? Promise.resolve([{ id: 'a1', nome: 'Golpe Sombrio', custo: 3 }])
        : Promise.resolve([]),
    );
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Artes (1)')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Artes (1)'));

    expect(screen.getByText('Golpe Sombrio')).toBeInTheDocument();
  });

  it('resolve raça, classes e nós desbloqueados da veia astral para os nomes (mesmo padrão de aptidão: id igual ao da coleção de referência)', async () => {
    const personagemComReferencias = {
      id: 'p2',
      nome: 'Xerath',
      raca: 'raca-1',
      classes: ['classe-1', 'classe-2'],
      veiasAstrais: { nosDesbloqueados: ['no-1', 'no-2'] },
    };
    getRaca.mockImplementation(id =>
      id === 'raca-1'
        ? Promise.resolve({ id, nome: 'Elfo' })
        : Promise.resolve(null),
    );
    getClasse.mockImplementation(id =>
      id === 'classe-1'
        ? Promise.resolve({ id, nome: 'Guerreiro' })
        : Promise.resolve(null),
    );
    getVeiaAstral.mockImplementation(id =>
      id === 'no-1'
        ? Promise.resolve({ id, nome: 'Chama Ancestral' })
        : Promise.resolve(null),
    );

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComReferencias}
      />,
    );

    await waitFor(() => expect(getRaca).toHaveBeenCalledWith('raca-1'));
    expect(getClasse).toHaveBeenCalledWith('classe-1');
    expect(getClasse).toHaveBeenCalledWith('classe-2');
    expect(getVeiaAstral).toHaveBeenCalledWith('no-1');
    expect(getVeiaAstral).toHaveBeenCalledWith('no-2');

    await waitFor(() => expect(screen.getByText('Elfo')).toBeInTheDocument());
    expect(screen.getByText('Guerreiro')).toBeInTheDocument();
    expect(screen.getByText('Chama Ancestral')).toBeInTheDocument();
    expect(screen.getAllByText('Não encontrado(a)')).toHaveLength(2);
    expect(screen.queryByText('raca-1')).not.toBeInTheDocument();
    expect(screen.queryByText('classe-1')).not.toBeInTheDocument();
    expect(screen.queryByText('no-1')).not.toBeInTheDocument();
  });

  it('resolve o id de cada doc em aptidoesAdquiridas para o nome da aptidão (mesmo id na coleção aptidoes)', async () => {
    getPersonagemSubcolecao.mockImplementation((_id, subcolecao) =>
      subcolecao === 'aptidoesAdquiridas'
        ? Promise.resolve([{ id: 'apt-1' }, { id: 'apt-2' }])
        : Promise.resolve([]),
    );
    getAptidao.mockImplementation(id =>
      id === 'apt-1'
        ? Promise.resolve({ id: 'apt-1', nome: 'Golpe Certeiro' })
        : Promise.resolve(null),
    );
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Aptidões Adquiridas (2)')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Aptidões Adquiridas (2)'));

    await waitFor(() => expect(getAptidao).toHaveBeenCalledWith('apt-1'));
    expect(getAptidao).toHaveBeenCalledWith('apt-2');

    await waitFor(() =>
      expect(screen.getByText('Golpe Certeiro')).toBeInTheDocument(),
    );
    expect(screen.getByText('Aptidão não encontrada')).toBeInTheDocument();
    expect(screen.queryByText('apt-1')).not.toBeInTheDocument();
  });

  it('mostra mensagem de acesso negado quando a subcoleção falha (ficha de outro usuário)', async () => {
    getPersonagemSubcolecao.mockImplementation((_id, subcolecao) =>
      subcolecao === 'historicoSorte'
        ? Promise.reject(new Error('permission-denied'))
        : Promise.resolve([]),
    );
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Histórico de Sorte')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Histórico de Sorte'));

    await waitFor(() =>
      expect(
        screen.getByText(/Sem acesso a "Histórico de Sorte"/),
      ).toBeInTheDocument(),
    );
  });
});
