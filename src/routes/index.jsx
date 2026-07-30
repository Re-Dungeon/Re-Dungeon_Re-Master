import React, { lazy } from 'react';
import { ROUTE_PATHS } from 'common/constants/routes';

const Dashboard = lazy(() => import('pages/Dashboard/Dashboard'));
const Campanha = lazy(() => import('pages/Campanha/Campanha'));
const NovaCampanha = lazy(() => import('pages/Campanha/NovaCampanha'));
const Cenas = lazy(() => import('pages/Campanha/Cenas'));
const NovaCena = lazy(() => import('pages/Campanha/NovaCena'));
const Npcs = lazy(() => import('pages/Npcs/Npcs'));
const EditarNpcClone = lazy(() => import('pages/Npcs/EditarNpcClone'));
const Jogadores = lazy(() => import('pages/Jogadores/Jogadores'));
const EditarJogadorClone = lazy(
  () => import('pages/Jogadores/EditarJogadorClone'),
);
const Criaturas = lazy(() => import('pages/Criaturas/Criaturas'));
const EditarCriaturaClone = lazy(
  () => import('pages/Criaturas/EditarCriaturaClone'),
);
const Mapas = lazy(() => import('pages/Mapas/Mapas'));
const NovoMapa = lazy(() => import('pages/Mapas/NovoMapa'));
const Missoes = lazy(() => import('pages/Missoes/Missoes'));
const NovaMissao = lazy(() => import('pages/Missoes/NovaMissao'));
const CardFlux = lazy(() => import('pages/CardFlux/CardFlux'));
const Cartas = lazy(() => import('pages/CardFlux/Cartas'));
const Luta = lazy(() => import('pages/Luta/Luta'));
const Notas = lazy(() => import('pages/Notas/Notas'));
const NovaNota = lazy(() => import('pages/Notas/NovaNota'));

export const ROUTES = [
  { index: true, element: <Dashboard /> },
  { path: ROUTE_PATHS.CAMPANHA.slice(1), element: <Campanha /> },
  { path: ROUTE_PATHS.NOVA_CAMPANHA.slice(1), element: <NovaCampanha /> },
  { path: ROUTE_PATHS.CENAS.slice(1), element: <Cenas /> },
  { path: ROUTE_PATHS.NOVA_CENA.slice(1), element: <NovaCena /> },
  { path: ROUTE_PATHS.NPCS.slice(1), element: <Npcs /> },
  { path: ROUTE_PATHS.NPC_CLONE.slice(1), element: <EditarNpcClone /> },
  { path: ROUTE_PATHS.JOGADORES.slice(1), element: <Jogadores /> },
  {
    path: ROUTE_PATHS.JOGADOR_CLONE.slice(1),
    element: <EditarJogadorClone />,
  },
  { path: ROUTE_PATHS.CRIATURAS.slice(1), element: <Criaturas /> },
  {
    path: ROUTE_PATHS.CRIATURA_CLONE.slice(1),
    element: <EditarCriaturaClone />,
  },
  { path: ROUTE_PATHS.MAPAS.slice(1), element: <Mapas /> },
  { path: ROUTE_PATHS.NOVO_MAPA.slice(1), element: <NovoMapa /> },
  { path: ROUTE_PATHS.MISSOES.slice(1), element: <Missoes /> },
  { path: ROUTE_PATHS.NOVA_MISSAO.slice(1), element: <NovaMissao /> },
  { path: ROUTE_PATHS.CARDFLUX.slice(1), element: <CardFlux /> },
  { path: ROUTE_PATHS.CARDFLUX_CARTAS.slice(1), element: <Cartas /> },
  { path: ROUTE_PATHS.LUTA.slice(1), element: <Luta /> },
  { path: ROUTE_PATHS.NOTAS.slice(1), element: <Notas /> },
  { path: ROUTE_PATHS.NOVA_NOTA.slice(1), element: <NovaNota /> },
];
