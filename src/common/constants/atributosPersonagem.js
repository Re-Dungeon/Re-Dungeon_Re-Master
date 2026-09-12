import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

// Mesma grade de atributos exibida nos cards de NPCs, Criaturas e Jogadores
// (PersonagemCard) — os aliases cobrem as variações de nome de campo que já
// apareceram em docs de `personagens` (Re-Dungeon).
export const ATRIBUTOS_PRIMARIOS_PERSONAGEM = [
  {
    label: 'Força',
    aliases: ['forca', 'for', 'forcaBase'],
    icon: FitnessCenterOutlinedIcon,
  },
  {
    label: 'Vitalidade',
    aliases: ['vitalidade', 'vit', 'vitalidadeBase'],
    icon: FavoriteBorderOutlinedIcon,
  },
  {
    label: 'Agilidade',
    aliases: ['agilidade', 'agi', 'agilidadeBase'],
    icon: DirectionsRunOutlinedIcon,
  },
  {
    label: 'Inteligência',
    aliases: ['inteligencia', 'int', 'inteligenciaBase'],
    icon: PsychologyOutlinedIcon,
  },
  {
    label: 'Percepção',
    aliases: ['percepcao', 'per', 'percepcaoBase'],
    icon: VisibilityOutlinedIcon,
  },
  {
    label: 'Sorte',
    aliases: ['sorte', 'sor', 'sorteBase'],
    icon: AutoAwesomeOutlinedIcon,
  },
];

export const ATRIBUTOS_SECUNDARIOS_PERSONAGEM = [
  { label: 'Prontidão', aliases: ['prontidao', 'prontidaoBase', 'prontidaoBonus'] },
  { label: 'Ataque', aliases: ['ataque', 'ataqueBase', 'ataqueBonus'] },
  { label: 'Defesa', aliases: ['defesa', 'defesaBase', 'defesaBonus'] },
  { label: 'Precisão', aliases: ['precisao', 'precisaoBase', 'precisaoBonus'] },
  { label: 'Reação', aliases: ['reacao', 'reacaoBase', 'reacaoBonus'] },
  { label: 'Evasão', aliases: ['evasao', 'evasaoBase', 'evasaoBonus'] },
];
