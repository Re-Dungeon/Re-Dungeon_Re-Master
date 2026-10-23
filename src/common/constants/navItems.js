import {
  AssignmentOutlined,
  DashboardOutlined,
  GridOnOutlined,
  LibraryBooksOutlined,
  MapOutlined,
  MessageOutlined,
  MusicNoteOutlined,
  NotesOutlined,
  PeopleAltOutlined,
  PersonOutlineOutlined,
  ShieldOutlined,
  SportsMmaOutlined,
  ViewAgendaOutlined,
} from '@mui/icons-material';
import { ROUTE_PATHS } from './routes';

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.CAMPANHA, icon: MapOutlined, label: 'Campanha' },
  { path: ROUTE_PATHS.DASHBOARD, icon: DashboardOutlined, label: 'Dashboard' },
  { path: ROUTE_PATHS.NPCS, icon: PersonOutlineOutlined, label: 'NPCs' },
  { path: ROUTE_PATHS.JOGADORES, icon: PeopleAltOutlined, label: 'Jogadores' },
  { path: ROUTE_PATHS.CRIATURAS, icon: ShieldOutlined, label: 'Criaturas' },
  { path: ROUTE_PATHS.NOTAS, icon: NotesOutlined, label: 'Universo' },
  { path: ROUTE_PATHS.MAPAS, icon: MapOutlined, label: 'Mapas' },
  { path: ROUTE_PATHS.MISSOES, icon: AssignmentOutlined, label: 'Missões' },
  { path: ROUTE_PATHS.CARDFLUX, icon: LibraryBooksOutlined, label: 'CardFlux' },
  { path: ROUTE_PATHS.LUTA, icon: SportsMmaOutlined, label: 'Luta' },
  { path: ROUTE_PATHS.MUSICAS, icon: MusicNoteOutlined, label: 'Músicas' },
  { path: ROUTE_PATHS.CHAT, icon: MessageOutlined, label: 'Chat' },
  { path: ROUTE_PATHS.GRID, icon: GridOnOutlined, label: 'Grid' },
];

export const NAV_ITEMS_SECONDARY = [];

export const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: ROUTE_PATHS.DASHBOARD, icon: DashboardOutlined, label: 'Dashboard' },
      { path: ROUTE_PATHS.CAMPANHA, icon: MapOutlined, label: 'Campanha' },
    ],
  },
  {
    label: 'Gerenciamento do Mundo',
    items: [
      { path: ROUTE_PATHS.NOTAS, icon: NotesOutlined, label: 'Universo' },
      { path: ROUTE_PATHS.JOGADORES, icon: PeopleAltOutlined, label: 'Jogadores' },
      { path: ROUTE_PATHS.NPCS, icon: PersonOutlineOutlined, label: 'NPCs' },
      { path: ROUTE_PATHS.CRIATURAS, icon: ShieldOutlined, label: 'Criaturas' },
      { path: ROUTE_PATHS.MAPAS, icon: MapOutlined, label: 'Mapas' },
      { path: ROUTE_PATHS.MISSOES, icon: AssignmentOutlined, label: 'Missões' },
    ],
  },
  {
    label: 'Ferramentas de Sessão',
    items: [
      { path: ROUTE_PATHS.CARDFLUX, icon: LibraryBooksOutlined, label: 'CardFlux' },
      { path: ROUTE_PATHS.LUTA, icon: SportsMmaOutlined, label: 'Luta' },
      { path: ROUTE_PATHS.GRID, icon: GridOnOutlined, label: 'Grid' },
      { path: ROUTE_PATHS.CHAT, icon: MessageOutlined, label: 'Chat' },
      { path: ROUTE_PATHS.MUSICAS, icon: MusicNoteOutlined, label: 'Músicas' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { path: null, icon: ViewAgendaOutlined, label: 'Central de Recursos', action: 'resource-center' },
    ],
  },
];
