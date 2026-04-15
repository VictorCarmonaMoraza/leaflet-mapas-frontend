import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { LanguagePickerComponent } from '../../../../components/language-picker/language-picker.component';
import { ThemePickerComponent } from '../../../../components/theme-picker/theme-picker.component';
import { LanguageService } from '../../../../services/language.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LanguagePickerComponent, ThemePickerComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly language = inject(LanguageService);

  readonly username = signal('');
  readonly password = signal('');
  readonly error = signal('');
  readonly isSubmitting = signal(false);
  readonly registerUsername = signal('');
  readonly registerPassword = signal('');
  readonly registerMessage = signal('');
  readonly registerError = signal('');
  readonly isRegisterSubmitting = signal(false);

  onSubmit(): void {
    this.error.set('');
    this.isSubmitting.set(true);

    const ok = this.auth.login(this.username(), this.password());
    if (!ok) {
      this.error.set(this.language.t('login.invalidCredentials'));
      this.isSubmitting.set(false);
      return;
    }

    this.router.navigateByUrl('/home');
  }

  onRegister(): void {
    this.registerMessage.set('');
    this.registerError.set('');
    this.isRegisterSubmitting.set(true);

    const result = this.auth.register(this.registerUsername(), this.registerPassword());
    if (!result.ok) {
      if (result.reason === 'exists') {
        this.registerError.set(this.language.t('login.registerExists'));
      } else {
        this.registerError.set(this.language.t('login.registerInvalid'));
      }
      this.isRegisterSubmitting.set(false);
      return;
    }

    this.registerMessage.set(this.language.t('login.registerSuccess'));
    this.username.set(this.registerUsername().trim());
    this.password.set('');
    this.registerPassword.set('');
    this.isRegisterSubmitting.set(false);
  }
}
