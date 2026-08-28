import { Routes } from '@angular/router';

import { Inicio } from './pages/inicio/inicio';
import { Ruta } from './pages/ruta/ruta';
import { Mapa } from './pages/mapa/mapa.component';
import { Gastos } from './pages/gastos/gastos.component';
import { Maleta } from './pages/maleta/maleta.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'maleta',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    component: Inicio,
  },
  {
    path: 'ruta',
    component: Ruta,
  },
  {
    path: 'mapa',
    component: Mapa,
  },
  {
    path: 'gastos',
    component: Gastos,
  },
  {
    path: 'maleta',
    component: Maleta,
  },
];
