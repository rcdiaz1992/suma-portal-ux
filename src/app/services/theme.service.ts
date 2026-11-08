import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PortalTheme = 'oscuro' | 'claro';

const THEME_KEY = 'suma.portal.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly theme$ = new BehaviorSubject<PortalTheme>(this.readStored());

  constructor() {
    this.apply(this.theme$.value);
  }

  get theme(): PortalTheme {
    return this.theme$.value;
  }

  get changes$() {
    return this.theme$.asObservable();
  }

  toggle(): void {
    this.set(this.theme === 'oscuro' ? 'claro' : 'oscuro');
  }

  set(theme: PortalTheme): void {
    this.theme$.next(theme);
    localStorage.setItem(THEME_KEY, theme);
    this.apply(theme);
  }

  private readStored(): PortalTheme {
    try {
      return localStorage.getItem(THEME_KEY) === 'claro' ? 'claro' : 'oscuro';
    } catch {
      return 'oscuro';
    }
  }

  private apply(theme: PortalTheme): void {
    document.documentElement.setAttribute('data-portal-theme', theme);
  }
}
