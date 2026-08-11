import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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

  const expandirTodosOsPainels = async user => {
    const botoesExpandir = screen.getAllByRole('button', { name: /Expandir/i });
    for (const botao of botoesExpandir) {
      await user.click(botao);
    }
  };

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
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await expandirTodosOsPainels(user);
    await waitFor(() =>
      expect(screen.getByText('Secundarios Base')).toBeInTheDocument(),
    );
    const defesaElements = screen.getAllByText(content => content === 'Defesa');
    expect(defesaElements.length).toBeGreaterThan(0);
    expect(
      screen.getByText(content => content === 'Defesa'),
    ).toBeInTheDocument();
    expect(screen.getByText('Prontidao')).toBeInTheDocument();
    expect(screen.queryByText(/"defesa":\s*0/)).not.toBeInTheDocument();
  });

  it('formata campo Timestamp do Firestore como data por extenso em pt-BR', async () => {
    const user = userEvent.setup();
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

    await expandirTodosOsPainels(user);

    const offsetHoras = -data.getTimezoneOffset() / 60;
    const sinal = offsetHoras >= 0 ? '+' : '-';
    const esperado = `29 de julho de 2026 às 22:34:44 UTC${sinal}${Math.abs(offsetHoras)}`;

    await waitFor(() => expect(screen.getByText(esperado)).toBeInTheDocument());
  });

  it('renderiza lista de primitivos como chips', async () => {
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await expandirTodosOsPainels(user);
    await waitFor(() =>
      expect(screen.getByText('scXcrtWfvpAZNI6WKHAj')).toBeInTheDocument(),
    );
    expect(screen.getByText('UYcKdf1pAfOCMck1ITM8')).toBeInTheDocument();
  });

  it('organiza atributos principais e status em grades separadas', async () => {
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Atributos Principais')).toBeInTheDocument(),
    );

    const gradeAtributos = screen.getByLabelText(
      'Grade de atributos principais',
    );
    const gradeStatus = screen.getByLabelText('Grade de status');

    expect(gradeAtributos.children).toHaveLength(6);
    expect(gradeStatus.children).toHaveLength(3);
  });

  it('permite colapsar e expandir painéis de atributos', async () => {
    const user = userEvent.setup();
    const personagemComAtributos = {
      ...PERSONAGEM,
      atributosBase: { forca: 15, inteligencia: 12, percepcao: 14 },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComAtributos}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Atributos Totais')).toBeInTheDocument(),
    );

    const botoesRetrair = screen.getAllByLabelText(/Retrair|Expandir/);
    expect(botoesRetrair.length).toBeGreaterThan(0);

    await user.click(botoesRetrair[0]);
    const atributosTotaisCard = screen
      .getByText('Atributos Totais')
      .closest('[class*="MuiPaper"]');
    expect(atributosTotaisCard).toHaveTextContent('Atributos Totais');
  });

  it('mostra o valor de "totais" em vez do campo base quando ambos existem (ex.: Sorte)', async () => {
    const personagemComTotal = {
      ...PERSONAGEM,
      sorte: 3,
      totais: { sorte: 31 },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComTotal}
      />,
    );

    const gradeAtributos = await screen.findByLabelText(
      'Grade de atributos principais',
    );
    expect(within(gradeAtributos).getByText('31')).toBeInTheDocument();
    expect(within(gradeAtributos).queryByText('3')).not.toBeInTheDocument();
  });

  it('mostra a coluna Base da tabela detalhada mesmo para atributos com label acentuado (Força/Inteligência/Percepção)', async () => {
    const user = userEvent.setup();
    const personagemComBase = {
      ...PERSONAGEM,
      atributosBase: { forca: 15, inteligencia: 12, percepcao: 14 },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComBase}
      />,
    );

    await expandirTodosOsPainels(user);

    const tabelaDetalhada = screen
      .getByText('Atributos Detalhados')
      .closest('[class*="MuiPaper"]');
    const linhaForca = within(tabelaDetalhada).getByText('Força').closest('tr');
    const linhaInteligencia = within(tabelaDetalhada)
      .getByText('Inteligência')
      .closest('tr');
    const linhaPercepcao = within(tabelaDetalhada)
      .getByText('Percepção')
      .closest('tr');
    // Antes da correção, `label.toLowerCase()` gerava a chave acentuada
    // ("força"/"inteligência"/"percepção"), que nunca batia com
    // atributosBase (chaves sem acento) — a coluna Base ficava sempre "—".
    // Sem bônus/extra cadastrados, a coluna Total repete o mesmo valor da
    // Base, por isso a checagem aceita 1+ ocorrências em vez de exatamente 1.
    expect(within(linhaForca).getAllByText('15').length).toBeGreaterThan(0);
    expect(within(linhaInteligencia).getAllByText('12').length).toBeGreaterThan(
      0,
    );
    expect(within(linhaPercepcao).getAllByText('14').length).toBeGreaterThan(0);
  });

  it('organiza atributos principais e status em grades separadas', async () => {
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Atributos Principais')).toBeInTheDocument(),
    );

    const gradeAtributos = screen.getByLabelText(
      'Grade de atributos principais',
    );
    const gradeStatus = screen.getByLabelText('Grade de status');

    expect(gradeAtributos.children).toHaveLength(6);
    expect(gradeStatus.children).toHaveLength(3);
  });

  it('usa os campos do clone da campanha no painel de Informações do Jogador', async () => {
    const user = userEvent.setup();
    const clone = {
      background: 'Nascido em uma cidade em ruínas, treinou sob um mestre silencioso.',
      notasAdicionais: 'Fala pouco, mas guarda rancor antigo.',
      titulo: 'Guardião do Pátio',
      afiliacao: 'Irmandade do Pórtico',
      statusNarrativo: 'Em vigilância',
    };

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={PERSONAGEM}
        clone={clone}
      />,
    );

    await expandirTodosOsPainels(user);

    await waitFor(() =>
      expect(screen.getByText('Informações do Jogador')).toBeInTheDocument(),
    );

    expect(screen.getByText('BACKGROUND')).toBeInTheDocument();
    expect(screen.getByText('NOTAS ADICIONAIS')).toBeInTheDocument();
    expect(screen.getByText('TÍTULO')).toBeInTheDocument();
    expect(screen.getByText('AFILIAÇÃO')).toBeInTheDocument();
    expect(screen.getByText('STATUS NARRATIVO')).toBeInTheDocument();
    expect(screen.getByText('Guardião do Pátio')).toBeInTheDocument();
    expect(screen.getByText('Irmandade do Pórtico')).toBeInTheDocument();
    expect(screen.getByText('Em vigilância')).toBeInTheDocument();
    expect(screen.getByText('Nascido em uma cidade em ruínas, treinou sob um mestre silencioso.')).toBeInTheDocument();
    expect(screen.getByText('Fala pouco, mas guarda rancor antigo.')).toBeInTheDocument();
  });

  it('aceita o bloco infoJogador aninhado do clone sem renderizar um objeto cru', async () => {
    const user = userEvent.setup();
    const clone = {
      infoJogador: {
        background: 'Nascido em uma cidade em ruínas, treinou sob um mestre silencioso.',
        notasAdicionais: 'Fala pouco, mas guarda rancor antigo.',
        titulo: 'Guardião do Pátio',
        afiliacao: 'Irmandade do Pórtico',
        statusNarrativo: 'Em vigilância',
      },
    };

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={PERSONAGEM}
        clone={clone}
      />,
    );

    await expandirTodosOsPainels(user);

    await waitFor(() =>
      expect(screen.getByText('Guardião do Pátio')).toBeInTheDocument(),
    );
    expect(screen.getByText('Irmandade do Pórtico')).toBeInTheDocument();
    expect(screen.getByText('Em vigilância')).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  it('lê aliases de campos do bloco infoJogador quando o banco usa nomes específicos', async () => {
    const user = userEvent.setup();
    const clone = {
      infoJogador: {
        backgroundJogador: 'Nascido sob uma antiga tradição.',
        notasAdicionaisJogador: 'Mantém segredos pessoais.',
        tituloJogador: 'O Último Guardião',
        afiliacaoJogador: 'Círculo das Sombras',
        statusNarrativoJogador: 'Vigente e observando',
      },
    };

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={PERSONAGEM}
        clone={clone}
      />,
    );

    await expandirTodosOsPainels(user);

    await waitFor(() =>
      expect(screen.getByText('O Último Guardião')).toBeInTheDocument(),
    );
    expect(screen.getByText('Círculo das Sombras')).toBeInTheDocument();
    expect(screen.getByText('Vigente e observando')).toBeInTheDocument();
    expect(screen.getByText('Nascido sob uma antiga tradição.')).toBeInTheDocument();
    expect(screen.getByText('Mantém segredos pessoais.')).toBeInTheDocument();
  });

  it('mostra a seção de nível quando o clone contém dados de progressão', async () => {
    const user = userEvent.setup();
    const clone = {
      nivel: 7,
      xp: 1280,
      pontosPrincipais: 4,
      pontosSecundarios: 2,
      historicoNivel: [
        { nivel: 6, data: '2026-07-29', descricao: 'Subiu de nível após o combate' },
      ],
    };

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={PERSONAGEM}
        clone={clone}
      />,
    );

    await expandirTodosOsPainels(user);

    await waitFor(() => expect(screen.getByText('Nível Atual')).toBeInTheDocument());
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1280')).toBeInTheDocument();
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('Subiu de nível após o combate')).toBeInTheDocument();
  });

  it('não usa um objeto de jogadorInfo como afiliacao quando existem campos separados', async () => {
    const user = userEvent.setup();
    const personagemComInfoAninhada = {
      ...PERSONAGEM,
      jogadorInfo: {
        title: 'O luminista',
        background: 'Uma história longa para o background.',
        additionalNotes: 'Notas do jogador.',
        affiliation: 'Ordem do Pórtico',
        narrativeStatus: 'Ativo na trama',
      },
    };

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComInfoAninhada}
      />,
    );

    await expandirTodosOsPainels(user);

    await waitFor(() => expect(screen.getByText('Ordem do Pórtico')).toBeInTheDocument());
    expect(screen.queryByText('A Última')).not.toBeInTheDocument();
    expect(screen.getByText('Uma história longa para o background.')).toBeInTheDocument();
    expect(screen.getByText('Notas do jogador.')).toBeInTheDocument();
    expect(screen.getByText('Ativo na trama')).toBeInTheDocument();
    expect(screen.getByText('O luminista')).toBeInTheDocument();
  });

  it('aplica rolagem interna aos campos longos de informação do jogador', async () => {
    const user = userEvent.setup();
    const clone = {
      background: 'Linha 1\nLinha 2\nLinha 3\nLinha 4\nLinha 5\nLinha 6\nLinha 7',
      notasAdicionais: 'Nota 1\nNota 2\nNota 3\nNota 4\nNota 5\nNota 6\nNota 7',
    };

    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={PERSONAGEM}
        clone={clone}
      />,
    );

    await expandirTodosOsPainels(user);

    const backgroundText = screen.getByText(content => content.includes('Linha 7'));
    const notasText = screen.getByText(content => content.includes('Nota 7'));

    expect(backgroundText).toHaveStyle({ overflowY: 'auto', maxHeight: 'calc(1.7em * 6)' });
    expect(notasText).toHaveStyle({ overflowY: 'auto', maxHeight: 'calc(1.7em * 6)' });
  });

  it('permite colapsar e expandir painéis de atributos', async () => {
    const user = userEvent.setup();
    const personagemComAtributos = {
      ...PERSONAGEM,
      atributosBase: { forca: 15, inteligencia: 12, percepcao: 14 },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComAtributos}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Atributos Totais')).toBeInTheDocument(),
    );

    const botoesRetrair = screen.getAllByLabelText(/Retrair|Expandir/);
    expect(botoesRetrair.length).toBeGreaterThan(0);

    await user.click(botoesRetrair[0]);
    const atributosTotaisCard = screen
      .getByText('Atributos Totais')
      .closest('[class*="MuiPaper"]');
    expect(atributosTotaisCard).toHaveTextContent('Atributos Totais');
  });

  it('mostra o valor de "totais" em vez do campo base quando ambos existem (ex.: Sorte)', async () => {
    const personagemComTotal = {
      ...PERSONAGEM,
      sorte: 3,
      totais: { sorte: 31 },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComTotal}
      />,
    );

    const gradeAtributos = await screen.findByLabelText(
      'Grade de atributos principais',
    );
    expect(within(gradeAtributos).getByText('31')).toBeInTheDocument();
    expect(within(gradeAtributos).queryByText('3')).not.toBeInTheDocument();
  });

  it('mostra a coluna Base da tabela detalhada mesmo para atributos com label acentuado (Força/Inteligência/Percepção)', async () => {
    const user = userEvent.setup();
    const personagemComBase = {
      ...PERSONAGEM,
      atributosBase: { forca: 15, inteligencia: 12, percepcao: 14 },
    };
    render(
      <PersonagemFichaDialog
        open
        onClose={() => {}}
        personagem={personagemComBase}
      />,
    );

    await expandirTodosOsPainels(user);

    const tabelaDetalhada = screen
      .getByText('Atributos Detalhados')
      .closest('[class*="MuiPaper"]');
    const linhaForca = within(tabelaDetalhada).getByText('Força').closest('tr');
    const linhaInteligencia = within(tabelaDetalhada)
      .getByText('Inteligência')
      .closest('tr');
    const linhaPercepcao = within(tabelaDetalhada)
      .getByText('Percepção')
      .closest('tr');
    // Antes da correção, `label.toLowerCase()` gerava a chave acentuada
    // ("força"/"inteligência"/"percepção"), que nunca batia com
    // atributosBase (chaves sem acento) — a coluna Base ficava sempre "—".
    // Sem bônus/extra cadastrados, a coluna Total repete o mesmo valor da
    // Base, por isso a checagem aceita 1+ ocorrências em vez de exatamente 1.
    expect(within(linhaForca).getAllByText('15').length).toBeGreaterThan(0);
    expect(within(linhaInteligencia).getAllByText('12').length).toBeGreaterThan(
      0,
    );
    expect(within(linhaPercepcao).getAllByText('14').length).toBeGreaterThan(0);
  });

  it('expande a tabela detalhada para ocupar a largura disponível', async () => {
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await expandirTodosOsPainels(user);

    const tabela = screen.getByText('Atributo').closest('table');

    expect(tabela).not.toBeNull();
    expect(window.getComputedStyle(tabela).width).toBe('100%');
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

  it('renderiza núcleos em cards com cabeçalho, essência e badge de artes', async () => {
    getPersonagemSubcolecao.mockImplementation((_id, subcolecao) =>
      subcolecao === 'nucleos'
        ? Promise.resolve([
            {
              id: 'n1',
              nome: 'Núcleo do Fogo',
              tipo: 'Ofensiva',
              essencia: 'A essência do conflito',
              bonus: 'Gera dano extra',
              artes: ['a1', 'a2'],
            },
          ])
        : Promise.resolve([]),
    );
    const user = userEvent.setup();
    render(
      <PersonagemFichaDialog open onClose={() => {}} personagem={PERSONAGEM} />,
    );

    await waitFor(() =>
      expect(screen.getByText('Núcleos (1)')).toBeInTheDocument(),
    );
    await user.click(screen.getByText('Núcleos (1)'));

    expect(screen.getByText('Núcleo do Fogo')).toBeInTheDocument();
    expect(screen.getByText('Tipo: Ofensiva')).toBeInTheDocument();
    expect(screen.getByText('A essência do conflito')).toBeInTheDocument();
    expect(screen.getByText('📜 2 art(s)')).toBeInTheDocument();
  });

  it('resolve raça, classes e nós desbloqueados da veia astral para os nomes (mesmo padrão de aptidão: id igual ao da coleção de referência)', async () => {
    const user = userEvent.setup();
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

    await expandirTodosOsPainels(user);
    await waitFor(() => expect(getRaca).toHaveBeenCalledWith('raca-1'));
    expect(getClasse).toHaveBeenCalledWith('classe-1');
    expect(getClasse).toHaveBeenCalledWith('classe-2');
    expect(getVeiaAstral).toHaveBeenCalledWith('no-1');
    expect(getVeiaAstral).toHaveBeenCalledWith('no-2');

    await waitFor(() => {
      expect(screen.getByText('Elfo')).toBeInTheDocument();
    });
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
