import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

type BannerTab = 'firma' | 'soporte' | 'seguimiento';

@Component({
  selector: 'app-login-shell',
  templateUrl: './login-shell.page.html',
  styleUrls: ['./login-shell.page.scss'],
})
export class LoginShellPage implements AfterViewInit, OnDestroy {
  /** Tab del panel visual: firma | soporte | seguimiento. */
  bannerTab: BannerTab = 'firma';
  /** Registro / olvidé clave: pantalla completa (sin columna visual). */
  fullBleed = false;

  private readonly bannerTabs: BannerTab[] = ['firma', 'soporte', 'seguimiento'];
  private readonly bannerRotateMs = 8500;
  private bannerRotateTimer: ReturnType<typeof setInterval> | null = null;
  private routeSub?: Subscription;

  constructor(private themeSvc: ThemeService, private router: Router) {
    this.updateBleed(this.router.url);
    this.routeSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateBleed(e.urlAfterRedirects || e.url));
  }

  get theme() {
    return this.themeSvc.theme;
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
  }

  setBannerTab(tab: BannerTab): void {
    if (this.bannerTab === tab) {
      this.replayBannerSvg();
      this.startBannerRotate();
      return;
    }
    this.bannerTab = tab;
    queueMicrotask(() => this.replayBannerSvg());
    this.startBannerRotate();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.mountEffects());
  }

  ngOnDestroy(): void {
    this.stopBannerRotate();
    this.routeSub?.unsubscribe();
  }

  private updateBleed(url: string): void {
    const next =
      /\/login\/olvidar-clave/.test(url) ||
      /\/login\/reset\//.test(url) ||
      /\/login\/registro\/(habituales|otros|orf)/.test(url);
    const changed = next !== this.fullBleed;
    this.fullBleed = next;
    if (changed) {
      queueMicrotask(() => void this.mountEffects());
    }
  }

  private async mountEffects(): Promise<void> {
    this.replayBannerSvg();
    if (this.fullBleed) {
      this.stopBannerRotate();
    } else {
      this.startBannerRotate();
    }
    try {
      const hosts = Array.from(
        document.querySelectorAll<HTMLElement & { __particles?: { destroy?: () => void } }>(
          '.auth-shell [data-particles]'
        )
      );
      for (const host of hosts) {
        try {
          host.__particles?.destroy?.();
        } catch {
          /* ignore */
        }
        delete host.__particles;
        host.querySelectorAll(':scope > .tsparticles-bg').forEach((n) => n.remove());
      }
      if (window.ParticlesBg?.autoMount) {
        await window.ParticlesBg.autoMount();
      } else {
        for (const el of hosts) {
          void window.ParticlesBg?.mount?.(el);
        }
      }
    } catch (e) {
      console.warn('[login-shell] particles', e);
    }
  }

  private startBannerRotate(): void {
    this.stopBannerRotate();
    if (this.fullBleed) return;
    this.bannerRotateTimer = setInterval(() => this.advanceBannerTab(), this.bannerRotateMs);
  }

  private stopBannerRotate(): void {
    if (this.bannerRotateTimer) {
      clearInterval(this.bannerRotateTimer);
      this.bannerRotateTimer = null;
    }
  }

  private advanceBannerTab(): void {
    const i = this.bannerTabs.indexOf(this.bannerTab);
    const next = this.bannerTabs[(i + 1) % this.bannerTabs.length];
    this.bannerTab = next;
    queueMicrotask(() => this.replayBannerSvg());
  }

  private replayBannerSvg(): void {
    document
      .querySelectorAll<HTMLObjectElement>(
        'object.bolivia-svg, object.soporte-svg, object.seguimiento-svg'
      )
      .forEach((obj) => {
        const base = (obj.getAttribute('data') || obj.data || '').split('?')[0];
        if (!base) return;
        obj.data = `${base}?t=${Date.now()}`;
      });
  }
}
