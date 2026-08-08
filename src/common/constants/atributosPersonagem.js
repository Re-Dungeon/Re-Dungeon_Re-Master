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
    label: 'FOR',
    aliases: ['forca', 'for', 'forcaBase'],
    icon: FitnessCenterOutlinedIcon,
  },
  {
    label: 'VIT',
    aliases: ['vitalidade', 'vit', 'vitalidadeBase'],
    icon: FavoriteBorderOutlinedIcon,
  },
  {
    label: 'AGI',
    aliases: ['agilidade', 'agi', 'agilidadeBase'],
    icon: DirectionsRunOutlinedIcon,
  },
  {
    label: 'INT',
    aliases: ['inteligencia', 'int', 'inteligenciaBase'],
    icon: PsychologyOutlinedIcon,
  },
  {
    label: 'PER',
    aliases: ['percepcao', 'per', 'percepcaoBase'],
    icon: VisibilityOutlinedIcon,
  },
  {
    label: 'SOR',
    aliases: ['sorte', 'sor', 'sorteBase'],
    icon: AutoAwesomeOutlinedIcon,
  },
];

export const ATRIBUTOS_SECUNDARIOS_PERSONAGEM = [
  { label: 'PronT', aliases: ['prontidao', 'prontidaoBase', 'prontidaoBonus'] },
  { label: 'AtK', aliases: ['ataque', 'ataqueBase', 'ataqueBonus'] },
  { label: 'DeF', aliases: ['defesa', 'defesaBase', 'defesaBonus'] },
  { label: 'PreC', aliases: ['precisao', 'precisaoBase', 'precisaoBonus'] },
  { label: 'ReA', aliases: ['reacao', 'reacaoBase', 'reacaoBonus'] },
  { label: 'EvA', aliases: ['evasao', 'evasaoBase', 'evasaoBonus'] },
];
