import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import PersonagemCard from './PersonagemCard';

const PERSONAGEM = { id: 'p1', nome: 'Grumnak', descricao: 'Um orc rabugento' };
const CLONE = { id: 'clone1' };

const ATRIBUTOS_PRIMARIOS = [
  { label: 'FOR', aliases: ['forca'], icon: FitnessCenterOutlinedIcon },
];
const ATRIBUTOS_SECUNDARIOS = [{ label: 'AtK', aliases: ['ataque'] }];

const renderCard = props =>
  render(
    <PersonagemCard
      personagem={PERSONAGEM}
      atributosPrimarios={ATRIBUTOS_PRIMARIOS}
      atributosSecundarios={ATRIBUTOS_SECUNDARIOS}
      onVisualizar={vi.fn()}
      onEditarClone={vi.fn()}
      onRemoverClone={vi.fn()}
      {...props}
    />,
  );

describe('PersonagemCard', () => {
  it('chama onVisualizar ao clicar em "Ver ficha"', async () => {
    const onVisualizar = vi.fn();
    const user = userEvent.setup();
    renderCard({ onVisualizar });

    await user.click(screen.getByLabelText('Ver ficha de Grumnak'));

    expect(onVisualizar).toHaveBeenCalledWith(PERSONAGEM);
  });

  it('não mostra o botão de clonar quando onClonar não é passado (caso NPCs)', () => {
    renderCard({ podeEscrever: true });

    expect(screen.queryByLabelText('Clonar Grumnak')).not.toBeInTheDocument();
  });

  it('mostra o botão de clonar quando onClonar é passado e não há clone', async () => {
    const onClonar = vi.fn();
    const user = userEvent.setup();
    renderCard({ podeEscrever: true, onClonar });

    await user.click(screen.getByLabelText('Clonar Grumnak'));

    expect(onClonar).toHaveBeenCalledWith(PERSONAGEM);
  });

  it('mostra ações de editar/remover clone em vez de clonar quando já existe um clone', () => {
    renderCard({ podeEscrever: true, onClonar: vi.fn(), clone: CLONE });

    expect(screen.queryByLabelText('Clonar Grumnak')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Editar clone de Grumnak'),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Remover clone de Grumnak'),
    ).toBeInTheDocument();
  });

  it('não mostra nenhuma ação de escrita quando podeEscrever é falso', () => {
    renderCard({ podeEscrever: false, onClonar: vi.fn(), clone: CLONE });

    expect(screen.queryByLabelText('Clonar Grumnak')).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Editar clone de Grumnak'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Remover clone de Grumnak'),
    ).not.toBeInTheDocument();
  });

  it('mostra a legenda de texto de clone só quando seloCloneTopo/seloCloneRodape são true', () => {
    const { rerender } = render(
      <PersonagemCard
        personagem={PERSONAGEM}
        clone={CLONE}
        atributosPrimarios={ATRIBUTOS_PRIMARIOS}
        atributosSecundarios={ATRIBUTOS_SECUNDARIOS}
        onVisualizar={vi.fn()}
        onEditarClone={vi.fn()}
        onRemoverClone={vi.fn()}
      />,
    );
    expect(
      screen.queryByText('Clonado nesta campanha'),
    ).not.toBeInTheDocument();

    rerender(
      <PersonagemCard
        personagem={PERSONAGEM}
        clone={CLONE}
        atributosPrimarios={ATRIBUTOS_PRIMARIOS}
        atributosSecundarios={ATRIBUTOS_SECUNDARIOS}
        onVisualizar={vi.fn()}
        onEditarClone={vi.fn()}
        onRemoverClone={vi.fn()}
        seloCloneTopo
      />,
    );
    expect(screen.getByText('Clonado nesta campanha')).toBeInTheDocument();
  });

  it('mostra o selo de imagem sobreposto só quando seloCloneBadge é true e há clone', () => {
    renderCard({ clone: CLONE, seloCloneBadge: true });

    expect(screen.getByAltText('Clonado nesta campanha')).toBeInTheDocument();
  });

  it('não mostra a descrição por padrão, só quando exibirDescricao é true', () => {
    const { rerender } = renderCard({});
    expect(screen.queryByText('Um orc rabugento')).not.toBeInTheDocument();

    rerender(
      <PersonagemCard
        personagem={PERSONAGEM}
        atributosPrimarios={ATRIBUTOS_PRIMARIOS}
        atributosSecundarios={ATRIBUTOS_SECUNDARIOS}
        onVisualizar={vi.fn()}
        onEditarClone={vi.fn()}
        onRemoverClone={vi.fn()}
        exibirDescricao
      />,
    );
    expect(screen.getByText('Um orc rabugento')).toBeInTheDocument();
  });

  it('exibe o valor total do atributo priorizando `totais` sobre o campo base', () => {
    const personagemComTotal = {
      ...PERSONAGEM,
      forca: 8,
      totais: { forca: 31 },
    };
    render(
      <PersonagemCard
        personagem={personagemComTotal}
        atributosPrimarios={ATRIBUTOS_PRIMARIOS}
        atributosSecundarios={ATRIBUTOS_SECUNDARIOS}
        onVisualizar={vi.fn()}
        onEditarClone={vi.fn()}
        onRemoverClone={vi.fn()}
      />,
    );

    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });
});
