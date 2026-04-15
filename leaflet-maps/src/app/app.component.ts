import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  loading = signal(false);
  private router = inject(Router);
  readonly language = inject(LanguageService);
  private readonly minimumLoadingMs = 2000;
  private loadingStartedAt = 0;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.beginLoading();
    this.finishLoading();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.beginLoading();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finishLoading();
      }
    });
  }

  private beginLoading(): void {
    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }

    this.loadingStartedAt = Date.now();
    this.loading.set(true);
  }

  private finishLoading(): void {
    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = Math.max(this.minimumLoadingMs - elapsed, 0);

    if (this.hideTimeoutId) {
      clearTimeout(this.hideTimeoutId);
    }

    this.hideTimeoutId = setTimeout(() => {
      this.loading.set(false);
      this.hideTimeoutId = null;
    }, remaining);
  }
}
