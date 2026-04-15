import { Routes } from '@angular/router';

export const MAPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/maps-page/maps-page.component').then((m) => m.MapsPageComponent)
  },
  {
    path: 'notes',
    loadComponent: () => import('./pages/map-notes-page/map-notes-page.component').then((m) => m.MapNotesPageComponent)
  }
];
