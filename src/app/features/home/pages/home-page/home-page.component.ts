import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguagePickerComponent } from '../../../../components/language-picker/language-picker.component';
import { LanguageService } from '../../../../services/language.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, LanguagePickerComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  visible = signal(false);
  readonly language = inject(LanguageService);
  readonly auth = inject(AuthService);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Pequeño delay para que la animación de entrada se aprecie
    setTimeout(() => this.visible.set(true), 80);
  }

  goToMaps(): void {
    this.router.navigate(['/maps']);
  }

  goToArgis(): void {
    this.router.navigate(['/argis']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
