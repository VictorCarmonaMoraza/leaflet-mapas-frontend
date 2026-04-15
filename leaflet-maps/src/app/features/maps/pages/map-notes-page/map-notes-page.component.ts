import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguagePickerComponent } from '../../../../components/language-picker/language-picker.component';
import { ThemePickerComponent } from '../../../../components/theme-picker/theme-picker.component';
import { apiUrl } from '../../../../config/api.config';
import { AuthService } from '../../../../services/auth.service';
import { LanguageService } from '../../../../services/language.service';
import { SavedCity } from '../../models/maps.models';

@Component({
  selector: 'app-map-notes-page',
  standalone: true,
  imports: [CommonModule, RouterModule, LanguagePickerComponent, ThemePickerComponent],
  template: `
    <div class="notes-shell min-h-dvh bg-gray-50">
      <header class="app-navbar">
        <div class="app-navbar__inner px-6 py-4 flex items-center justify-between gap-4">
          <div class="app-navbar__brand">
            <h1 class="text-3xl font-bold">{{ title() }}</h1>
            <p class="text-sm">{{ language.t('maps.notesPageDescription') }}</p>
          </div>

          <nav class="app-navbar__nav flex items-center gap-2">
            <a
              routerLink="/home"
              class="nav-link nav-link--home"
              [title]="language.t('maps.backHomeTitle')"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="display:inline;vertical-align:middle;margin-right:4px">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
              {{ language.t('common.home') }}
            </a>
            <a routerLink="/maps" routerLinkActive="active-nav" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
              {{ language.t('common.maps') }}
            </a>
            <a routerLink="/maps/notes" routerLinkActive="active-nav" class="nav-link">
              {{ language.t('maps.viewAllNotes') }}
            </a>
            <a routerLink="/argis" routerLinkActive="active-nav" class="nav-link">
              {{ language.t('common.argis') }}
            </a>
            <app-language-picker></app-language-picker>
            <app-theme-picker></app-theme-picker>
          </nav>
        </div>
      </header>

      <main class="notes-main px-4 py-6 md:px-6">
        <section class="notes-hero rounded-3xl p-6 md:p-8">
          <div class="notes-hero__copy">
            <p class="notes-eyebrow">{{ language.t('maps.myNotes') }}</p>
            <h2 class="text-2xl font-bold text-gray-900">{{ language.t('maps.notesPageTitle') }}</h2>
            <p class="mt-2 text-sm text-gray-600">{{ language.t('maps.notesByUser', { username: username() }) }}</p>
          </div>
          <a routerLink="/maps" class="back-button">
            {{ language.t('maps.backToMap') }}
          </a>
        </section>

        @if (isLoading()) {
        <section class="notes-feedback rounded-3xl bg-white p-8 shadow-lg">
          <div class="loading-stack">
            <span class="spinner" aria-hidden="true"></span>
            <p class="text-sm font-semibold text-gray-700">{{ language.t('common.loading') }}</p>
          </div>
        </section>
        } @else if (error()) {
        <section class="notes-feedback rounded-3xl bg-white p-8 shadow-lg">
          <p class="text-sm font-semibold text-red-600">{{ error() }}</p>
        </section>
        } @else if (notes().length === 0) {
        <section class="notes-feedback rounded-3xl bg-white p-8 shadow-lg">
          <p class="text-sm font-semibold text-gray-700">{{ language.t('maps.noNotes') }}</p>
        </section>
        } @else {
        <section class="notes-grid mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          @for (note of notes(); track note.id ?? note.name + '-' + note.lat + '-' + note.lng) {
          <article class="note-card rounded-3xl bg-white p-5 shadow-lg">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">{{ language.t('maps.myNotes') }}</p>
                <h3 class="mt-2 text-xl font-bold text-gray-900">{{ note.name }}</h3>
              </div>
              <span class="note-badge">{{ note.username || username() }}</span>
            </div>

            <p class="mt-4 text-sm leading-6 text-gray-700">{{ note.comment }}</p>

            <div class="note-meta mt-5 space-y-2 text-sm text-gray-500">
              <p>Lat: {{ note.lat }}</p>
              <p>Lng: {{ note.lng }}</p>
              @if (note.created_at) {
              <p>{{ language.t('maps.noteSavedOn', { date: formatCreatedAt(note.created_at) }) }}</p>
              }
            </div>

            <div class="mt-4 flex justify-end">
              <button
                type="button"
                class="delete-note-button"
                [disabled]="deletingNoteId() === note.id"
                (click)="deleteNote(note)"
              >
                {{ deletingNoteId() === note.id ? language.t('common.loading') : language.t('maps.deleteNote') }}
              </button>
            </div>
          </article>
          }
        </section>
        }
      </main>

      <footer class="app-footer">
        <div class="px-6 py-3 text-center text-sm">
          {{ language.t('common.createdBy') }}
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .notes-shell {
      min-height: 100dvh;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 26%),
        radial-gradient(circle at top right, rgba(15, 23, 42, 0.08), transparent 28%),
        var(--app-bg);
    }

    .app-navbar__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      text-align: center;
    }

    .app-navbar__brand {
      min-width: 0;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      margin-bottom: 0.9rem;
      text-align: center;
    }

    .app-navbar__brand h1,
    .app-navbar__brand p {
      margin: 0;
      width: 100%;
      text-align: center;
    }

    .app-navbar__nav {
      flex-wrap: wrap;
      justify-content: center;
    }

    .app-navbar {
      background: linear-gradient(120deg, var(--navbar-start), var(--navbar-end));
      border-bottom: 1px solid rgba(148, 163, 184, 0.28);
      box-shadow: 0 12px 28px rgba(11, 31, 74, 0.22);
    }

    .app-navbar h1,
    .app-navbar p {
      color: var(--navbar-text);
    }

    .app-navbar p {
      opacity: 0.9;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0.4rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--nav-link-border);
      color: var(--nav-link-color);
      background: linear-gradient(180deg, color-mix(in srgb, var(--nav-link-bg) 78%, #ffffff 22%) 0%, var(--nav-link-bg) 100%);
      font-size: 0.85rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      backdrop-filter: blur(10px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 22px rgba(15, 23, 42, 0.12);
      transition: background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }

    .nav-link:hover {
      background: var(--nav-link-hover-bg);
      transform: translateY(-1px);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 12px 26px rgba(15, 23, 42, 0.18);
    }

    .active-nav {
      color: var(--nav-active-color);
      background: linear-gradient(180deg, #ffffff 0%, color-mix(in srgb, var(--nav-active-bg) 92%, #eef2ff 8%) 100%);
      border-color: color-mix(in srgb, var(--nav-active-bg) 78%, #cbd5e1 22%);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.94), 0 14px 28px rgba(15, 23, 42, 0.18);
    }

    .nav-link--home {
      color: color-mix(in srgb, var(--navbar-text) 92%, #ffffff 8%);
      border-color: color-mix(in srgb, var(--nav-link-border) 45%, rgba(255, 255, 255, 0.32) 55%);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.07) 100%);
    }

    .notes-main {
      max-width: 1280px;
      margin: 0 auto;
    }

    .notes-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.96));
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 22px 40px rgba(15, 23, 42, 0.1);
    }

    .notes-eyebrow {
      margin: 0;
      color: #0369a1;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.24em;
      text-transform: uppercase;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 3rem;
      padding: 0.8rem 1.2rem;
      border-radius: 999px;
      background: #0f172a;
      color: #fff;
      font-weight: 700;
      transition: transform 180ms ease, background-color 180ms ease;
    }

    .back-button:hover {
      background: #1e293b;
      transform: translateY(-1px);
    }

    .notes-feedback {
      margin-top: 1.5rem;
    }

    .loading-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 999px;
      border: 4px solid rgba(14, 165, 233, 0.18);
      border-top-color: #0284c7;
      animation: spin 0.85s linear infinite;
    }

    .note-card {
      border: 1px solid rgba(148, 163, 184, 0.18);
    }

    .note-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: #e0f2fe;
      color: #075985;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .note-meta p {
      margin: 0;
    }

    .delete-note-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.5rem;
      padding: 0.55rem 0.9rem;
      border-radius: 0.75rem;
      border: 1px solid #fecaca;
      background: #fff1f2;
      color: #b91c1c;
      font-size: 0.85rem;
      font-weight: 700;
      transition: background-color 180ms ease, color 180ms ease;
    }

    .delete-note-button:hover:not(:disabled) {
      background: #fee2e2;
      color: #991b1b;
    }

    .delete-note-button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .app-footer {
      background: var(--footer-bg);
      border-top: 1px solid rgba(148, 163, 184, 0.24);
      color: var(--footer-text);
      letter-spacing: 0.02em;
    }

    .bg-gray-50 {
      background-color: transparent;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 768px) {
      .app-navbar__inner {
        padding: 1rem;
      }

      .notes-hero {
        flex-direction: column;
        align-items: flex-start;
      }

      .back-button {
        width: 100%;
      }
    }
  `]
})
export class MapNotesPageComponent {
  readonly language = inject(LanguageService);
  readonly auth = inject(AuthService);

  readonly title = computed(() => this.language.t('maps.notesPageTitle'));
  readonly username = computed(() => this.auth.username() || 'anon');
  readonly notes = signal<SavedCity[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly deletingNoteId = signal<number | null>(null);

  constructor() {
    void this.loadNotes();
  }

  formatCreatedAt(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.language.currentLanguage(), {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  async deleteNote(note: SavedCity): Promise<void> {
    if (typeof note.id !== 'number') return;

    const shouldDelete = window.confirm(this.language.t('maps.deleteConfirm'));
    if (!shouldDelete) return;

    this.deletingNoteId.set(note.id);
    this.error.set('');

    try {
      const username = this.auth.username();
      const query = username ? `?username=${encodeURIComponent(username)}` : '';
      const response = await fetch(apiUrl(`/api/db/notas/${note.id}${query}`), {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('delete-note');
      }

      this.notes.update((list) => list.filter((item) => item.id !== note.id));
    } catch {
      this.error.set(this.language.t('maps.deleteError'));
    } finally {
      this.deletingNoteId.set(null);
    }
  }

  private async loadNotes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set('');

    try {
      const username = this.auth.username();
      const query = username ? `?username=${encodeURIComponent(username)}` : '';
      const response = await fetch(apiUrl(`/api/db/notas${query}`));

      if (!response.ok) {
        throw new Error('load-notes');
      }

      const notes = await response.json() as SavedCity[];
      this.notes.set(notes);
    } catch {
      this.error.set(this.language.t('maps.notesLoadError'));
    } finally {
      this.isLoading.set(false);
    }
  }
}