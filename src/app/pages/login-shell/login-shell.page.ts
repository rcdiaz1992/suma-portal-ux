import { AfterViewInit, Component } from '@angular/core';

@Component({
  selector: 'app-login-shell',
  templateUrl: './login-shell.page.html',
  styleUrls: ['./login-shell.page.scss'],
})
export class LoginShellPage implements AfterViewInit {
  ngAfterViewInit(): void {
    // Scripts de angular.json ya cargaron; montar tras pintar el DOM del login
    queueMicrotask(() => this.mountEffects());
  }

  private async mountEffects(): Promise<void> {
    try {
      window.SumaBannerHero?.mountAll?.();
    } catch (e) {
      console.warn('[login-shell] banner hero', e);
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
