import React, { lazy } from 'react';
import { ROUTE_PATHS } from 'common/constants/routes';

const Dashboard = lazy(() => import('pages/Dashboard/Dashboard'));
const Campanha = lazy(() => import('pages/Campanha/Campanha'));
const NovaCampanha = lazy(() => import('pages/Campanha/NovaCampanha'));
const Cenas = lazy(() => import('pages/Campanha/Cenas'));
const NovaCena = lazy(() => import('pages/Campanha/NovaCena'));
const Npcs = lazy(() => import('pages/Npcs/Npcs'));
const NovoNpc = lazy(() => import('pages/Npcs/NovoNpc'));
const Criaturas = lazy(() => import('pages/Criaturas/Criaturas'));
const NovaCriatura = lazy(() => import('pages/Criaturas/NovaCriatura'));
const Mapas = lazy(() => import('pages/Mapas/Mapas'));
const NovoMapa = lazy(() => import('pages/Mapas/NovoMapa'));
const Missoes = lazy(() => import('pages/Missoes/Missoes'));
const NovaMissao = lazy(() => import('pages/Missoes/NovaMissao'));
const CardFlux = lazy(() => import('pages/CardFlux/CardFlux'));
const NovoBaralho = lazy(() => import('pages/CardFlux/NovoBaralho'));
const Cartas = lazy(() => import('pages/CardFlux/Cartas'));
const NovaCarta = lazy(() => import('pages/CardFlux/NovaCarta'));
const Notas = lazy(() => import('pages/Notas/Notas'));
const NovaNota = lazy(() => import('pages/Notas/NovaNota'));

export const ROUTES = [
  { index: true, element: <Dashboard /> },
  { path: ROUTE_PATHS.CAMPANHA.slice(1), element: <Campanha /> },
  { path: ROUTE_PATHS.NOVA_CAMPANHA.slice(1), element: <NovaCampanha /> },
  { path: ROUTE_PATHS.CENAS.slice(1), element: <Cenas /> },
  { path: ROUTE_PATHS.NOVA_CENA.slice(1), element: <NovaCena /> },
  { path: ROUTE_PATHS.NPCS.slice(1), element: <Npcs /> },
  { path: ROUTE_PATHS.NOVO_NPC.slice(1), element: <NovoNpc /> },
  { path: ROUTE_PATHS.CRIATURAS.slice(1), element: <Criaturas /> },
  { path: ROUTE_PATHS.NOVA_CRIATURA.slice(1), element: <NovaCriatura /> },
  { path: ROUTE_PATHS.MAPAS.slice(1), element: <Mapas /> },
  { path: ROUTE_PATHS.NOVO_MAPA.slice(1), element: <NovoMapa /> },
  { path: ROUTE_PATHS.MISSOES.slice(1), element: <Missoes /> },
  { path: ROUTE_PATHS.NOVA_MISSAO.slice(1), element: <NovaMissao /> },
  { path: ROUTE_PATHS.CARDFLUX.slice(1), element: <CardFlux /> },
  { path: ROUTE_PATHS.NOVO_BARALHO.slice(1), element: <NovoBaralho /> },
  { path: ROUTE_PATHS.CARDFLUX_CARTAS.slice(1), element: <Cartas /> },
  { path: ROUTE_PATHS.NOVA_CARTA.slice(1), element: <NovaCarta /> },
  { path: ROUTE_PATHS.NOTAS.slice(1), element: <Notas /> },
  { path: ROUTE_PATHS.NOVA_NOTA.slice(1), element: <NovaNota /> },
];
