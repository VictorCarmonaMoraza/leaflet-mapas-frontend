import { Injectable, signal } from '@angular/core';

const AUTH_STORAGE_KEY = 'leafletAuthSession';
const USERS_STORAGE_KEY = 'leafletAuthUsers';

type UserSession = {
  username: string;
};

type LocalUser = {
  username: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal(false);
  readonly username = signal('');

  constructor() {
    this.restoreSession();
  }

  login(username: string, password: string): boolean {
    const user = username.trim();
    const pass = password.trim();

    // Credenciales iniciales simples para entorno local.
    if (user.toLowerCase() === 'admin' && pass === 'Admin123!') {
      this.isAuthenticated.set(true);
      this.username.set('admin');
      const payload: UserSession = { username: 'admin' };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      return true;
    }

    const users = this.getUsers();
    const found = users.find((u) => u.username.toLowerCase() === user.toLowerCase() && u.password === pass);
    if (found) {
      this.isAuthenticated.set(true);
      this.username.set(found.username);
      const payload: UserSession = { username: found.username };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
      return true;
    }

    return false;
  }

  register(username: string, password: string): { ok: boolean; reason?: 'exists' | 'invalid' } {
    const user = username.trim();
    const pass = password.trim();

    if (user.length < 3 || pass.length < 6) {
      return { ok: false, reason: 'invalid' };
    }

    const users = this.getUsers();
    const exists = users.some((u) => u.username.toLowerCase() === user.toLowerCase());
    if (exists) {
      return { ok: false, reason: 'exists' };
    }

    users.push({ username: user, password: pass });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return { ok: true };
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.username.set('');
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  private restoreSession(): void {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;

    try {
      const session = JSON.parse(raw) as UserSession;
      if (session?.username) {
        this.isAuthenticated.set(true);
        this.username.set(session.username);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  private getUsers(): LocalUser[] {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw) as LocalUser[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem(USERS_STORAGE_KEY);
      return [];
    }
  }
}
