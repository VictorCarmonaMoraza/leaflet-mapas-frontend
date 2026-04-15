import { Routes } from '@angular/router';

export const ARGIS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/argis-page/argis-page.component').then((m) => m.ArgisPageComponent)
  },
  {
    path: '3d',
    loadComponent: () => import('./pages/argis-3d-page/argis-3d-page.component').then((m) => m.Argis3dPageComponent)
  }
];
