import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageCode, LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-picker.component.html',
  styleUrl: './language-picker.component.scss'
})
export class LanguagePickerComponent {
  readonly language = inject(LanguageService);
  readonly open = signal(false);
  readonly options: Array<{ code: LanguageCode; label: string }> = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' }
  ];

  toggle(): void {
    this.open.update((value) => !value);
  }

  select(code: LanguageCode): void {
    this.language.setLanguage(code);
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-language-picker')) {
      this.open.set(false);
    }
  }
}
