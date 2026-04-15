import { Injectable, signal, effect } from '@angular/core';

export interface AppTheme {
  id: string;
  label: string;
  swatch: string;
}

export const THEMES: AppTheme[] = [
  { id: 'blue',    label: 'Azul',      swatch: '#1d4ed8' },
  { id: 'dark',    label: 'Oscuro',    swatch: '#1e293b' },
  { id: 'emerald', label: 'Esmeralda', swatch: '#059669' },
  { id: 'purple',  label: 'Púrpura',   swatch: '#7c3aed' },
  { id: 'crimson', label: 'Carmín',    swatch: '#be123c' },
];

const STORAGE_KEY = 'geovistaTheme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly currentTheme = signal<string>(
    localStorage.getItem(STORAGE_KEY) ?? 'blue'
  );

  constructor() {
    this.applyTheme(this.currentTheme());

    effect(() => {
      const id = this.currentTheme();
      localStorage.setItem(STORAGE_KEY, id);
      this.applyTheme(id);
    });
  }

  setTheme(id: string): void {
    this.currentTheme.set(id);
  }

  private applyTheme(id: string): void {
    document.documentElement.setAttribute('data-theme', id);
  }
}
