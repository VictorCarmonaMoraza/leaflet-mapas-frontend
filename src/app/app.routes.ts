import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guards';

export const routes: Routes = [
	{
		path: '',
		pathMatch: 'full',
		redirectTo: 'login'
	},
	{
		path: 'login',
		canMatch: [loginGuard],
		loadComponent: () => import('./features/auth/pages/login-page/login-page.component').then((m) => m.LoginPageComponent)
	},
	{
		path: 'home',
		canMatch: [authGuard],
		loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES)
	},
	{
		path: 'maps',
		canMatch: [authGuard],
		loadChildren: () => import('./features/maps/maps.routes').then((m) => m.MAPS_ROUTES)
	},
	{
		path: 'argis',
		canMatch: [authGuard],
		loadChildren: () => import('./features/argis/argis.routes').then((m) => m.ARGIS_ROUTES)
	},
	{
		path: '**',
		redirectTo: 'login'
	}
];
