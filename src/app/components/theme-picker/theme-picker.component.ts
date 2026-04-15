import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, THEMES, AppTheme } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-picker.component.html',
  styleUrl: './theme-picker.component.scss'
})
export class ThemePickerComponent {
  readonly themeService = inject(ThemeService);
  readonly language = inject(LanguageService);
  readonly themes: AppTheme[] = THEMES;
  readonly open = signal(false);

  toggle(): void {
    this.open.update(v => !v);
  }

  select(id: string): void {
    this.themeService.setTheme(id);
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('app-theme-picker')) {
      this.open.set(false);
    }
  }
}
