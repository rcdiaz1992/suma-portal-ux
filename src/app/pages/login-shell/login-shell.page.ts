import { AfterViewInit, Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-login-shell',
  templateUrl: './login-shell.page.html',
  styleUrls: ['./login-shell.page.scss'],
})
export class LoginShellPage implements AfterViewInit {
  constructor(private themeSvc: ThemeService) {}

  get theme() {
    return this.themeSvc.theme;
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.mountEffects());
  }

  private async mountEffects(): Promise<void> {
    try {
      window.SumaBannerHero?.mountAll?.();
    } catch (e) {
      console.warn('[login-shell] banner galaxy', e);
    }
    try {
      if (window.ParticlesBg?.autoMount) {
        await window.ParticlesBg.autoMount();
      } else {
        document.querySelectorAll('[data-particles]').forEach((el) => {
          void window.ParticlesBg?.mount?.(el);
        });
      }
    } catch (e) {
      console.warn('[login-shell] particles', e);
    }
  }
}
