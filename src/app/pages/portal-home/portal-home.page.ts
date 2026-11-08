import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { SsoAuthService, SsoMenuNode } from '../../services/sso-auth.service';

type MenuMode = 'side' | 'launcher';

@Component({
  selector: 'app-portal-home',
  templateUrl: './portal-home.page.html',
  styleUrls: ['./portal-home.page.scss'],
})
export class PortalHomePage implements OnInit, AfterViewInit, OnDestroy {
  usuario = '';
  nombre = '';
  tipo = '';
  perfil = '';
  initials = 'SU';
  menuMode: MenuMode = 'side';
  menuFilter = '';
  moduleFilter = '';
  menus: SsoMenuNode[] = [];
  loading = false;
  error = '';
  navOpen = false;
  /** Opción abierta dentro del shell (iframe), como el portal SUMA. */
  activeId: number | null = null;
  activeTitle = '';
  moduleHref = '';
  moduleUrl: SafeResourceUrl | null = null;
  moduleWarning = '';

  constructor(
    private router: Router,
    private sso: SsoAuthService,
    private sanitizer: DomSanitizer
  ) {}

  /** El legacy avisa que iba a sacar el shell al login SSO; nos quedamos en el portal. */
  @HostListener('window:message', ['$event'])
  onFrameMessage(ev: MessageEvent): void {
    if (!ev?.data || ev.data.type !== 'SUMA_LEGACY_LOGIN') return;
    this.seedLegacySessionCookies();
    this.moduleWarning =
      'El módulo intentó ir al login SSO. Se mantuvo la sesión del portal; reabrí la opción o usá «Abrir aparte».';
  }

  ngOnInit(): void {
    const token = sessionStorage.getItem('suma.token');
    this.usuario = sessionStorage.getItem('suma.usuario') || '';
    const raw = sessionStorage.getItem('suma.tipoUser') || '';
    if (raw === 'NO_HABITUAL') {
      this.router.navigateByUrl('/hub/no-habituales');
      return;
    }
    if (!token) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.tipo = raw;
    this.initials = (this.usuario || 'SU').slice(0, 2).toUpperCase();
    this.loading = true;
    this.sso.credentialPortal(token).subscribe({
      next: (session) => {
        this.loading = false;
        this.usuario = session.usuario || this.usuario;
        this.nombre = session.nombre;
        this.tipo = session.tipo || this.tipo;
        this.perfil = session.roles[0] || this.tipo || 'SUMA';
        this.menus = session.menus;
        this.initials = (this.usuario || 'SU').slice(0, 2).toUpperCase();
        if (session.tipo) sessionStorage.setItem('suma.tipoUser', session.tipo);
        if (session.usuario) sessionStorage.setItem('suma.usuario', session.usuario);
        document.documentElement.setAttribute('data-menu-mode', this.menuMode);
      },
      error: (err) => {
        this.loading = false;
        const msg = String(err?.message || '');
        if (/expir|no autorizada|sesión/i.test(msg)) {
          sessionStorage.clear();
          this.router.navigateByUrl('/login');
          return;
        }
        this.error = msg || 'No se pudo cargar el menú del SSO';
        document.documentElement.setAttribute('data-menu-mode', this.menuMode);
      },
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.mountEffects());
  }

  ngOnDestroy(): void {
    document.documentElement.removeAttribute('data-menu-mode');
  }

  private async mountEffects(): Promise<void> {
    try {
      window.SumaBannerHero?.mountAll?.();
    } catch {
      /* ignore */
    }
    try {
      if (window.ParticlesBg?.autoMount) {
        await window.ParticlesBg.autoMount();
      }
    } catch {
      /* ignore */
    }
  }

  setMenuMode(mode: MenuMode): void {
    this.menuMode = mode;
    document.documentElement.setAttribute('data-menu-mode', mode);
  }

  filteredMenu(): SsoMenuNode[] {
    const q = this.menuFilter.trim().toLowerCase();
    if (!q) return this.menus;
    return this.menus
      .map((item) => this.filterNode(item, q))
      .filter((item): item is SsoMenuNode => !!item);
  }

  launcherMenus(): SsoMenuNode[] {
    const q = this.moduleFilter.trim().toLowerCase();
    if (!q) return this.menus;
    return this.menus
      .map((item) => this.filterNode(item, q))
      .filter((item): item is SsoMenuNode => !!item);
  }

  leaves(item: SsoMenuNode): SsoMenuNode[] {
    if (!item.opciones.length) return [item];
    return item.opciones.reduce((acc, child) => acc.concat(this.leaves(child)), [] as SsoMenuNode[]);
  }

  initialsOf(titulo: string): string {
    const parts = (titulo || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '·';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  openNode(node: SsoMenuNode): void {
    let href = this.sso.resolveMenuUrl(node.url);
    if (!href) return;
    // Nunca cargar el módulo en origen suma-dev (rompe cookies y hace top→indexOce).
    href = href.replace(/^https?:\/\/suma-dev\.aduana\.gob\.bo/i, '');
    if (!href.startsWith('/')) href = '/' + href;
    this.moduleWarning = '';
    // Igual que portal SUMA (ListenerController): token en cookie path=/ y /sso
    // para que SSO admin / OCE lean la sesión tras el reload del listener.
    this.seedLegacySessionCookies();
    // Cache-bust ANTES del hash: si va después, Angular/AngularJS rompe el listener.
    const framed = this.withCacheBust(href);
    this.activeId = node.id;
    this.activeTitle = node.titulo || node.descripcion || 'Módulo';
    this.moduleHref = framed;
    this.moduleUrl = this.sanitizer.bypassSecurityTrustResourceUrl(framed);
    this.menuMode = 'side';
    document.documentElement.setAttribute('data-menu-mode', 'side');
    this.navOpen = false;
  }

  /**
   * Replica el seteo de cookies del portal legacy (path /, /sso, /oce).
   * Sin esto, Gestión de Usuarios (sso/admin) pierde Auth-Token tras el listener.
   */
  private seedLegacySessionCookies(): void {
    const token = sessionStorage.getItem('suma.token') || '';
    const user = sessionStorage.getItem('suma.usuario') || '';
    if (!token) return;
    const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
    const paths = ['/', '/sso', '/sso/', '/oce', '/oce/', '/portal', '/portal/'];
    for (const path of paths) {
      document.cookie = `token=${encodeURIComponent(token)}; path=${path}; expires=${expires}; SameSite=Lax`;
      if (user) {
        document.cookie = `username=${encodeURIComponent(user)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
    }
  }

  openExternal(): void {
    if (this.moduleHref) {
      window.open(this.moduleHref, '_blank', 'noopener');
    }
  }

  /**
   * Si el iframe cayó en login SSO legacy, no botamos el portal: re-sembramos cookies
   * y pedimos reabrir (antes onModuleFrameLoad hacía logout y “se salía”).
   */
  onModuleFrameLoad(ev: Event): void {
    const iframe = ev.target as HTMLIFrameElement;
    try {
      const href = iframe.contentWindow?.location?.href || '';
      if (!href || href === 'about:blank') return;
      if (/\/sso\/indexOce\.html|\/sso\/indexLogin\.html|\/login(?:\?|#|$)/i.test(href)) {
        this.seedLegacySessionCookies();
        this.moduleWarning =
          'Gestión de Usuarios perdió la sesión del módulo. Probá de nuevo o «Abrir aparte».';
      }
    } catch {
      /* cross-origin */
    }
  }

  /** Igual que el portal SUMA (setProject), pero sin ensuciar #/listener/... */
  private withCacheBust(href: string): string {
    const hashAt = href.indexOf('#');
    const path = hashAt >= 0 ? href.slice(0, hashAt) : href;
    const hash = hashAt >= 0 ? href.slice(hashAt) : '';
    const join = path.includes('?') ? '&' : '?';
    return `${path}${join}_=${Date.now()}${hash}`;
  }

  goHome(): void {
    this.activeId = null;
    this.activeTitle = '';
    this.moduleHref = '';
    this.moduleUrl = null;
  }

  isActive(node: SsoMenuNode): boolean {
    return this.activeId != null && node.id === this.activeId;
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigateByUrl('/login');
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  private filterNode(item: SsoMenuNode, q: string): SsoMenuNode | null {
    const kids = item.opciones
      .map((child) => this.filterNode(child, q))
      .filter((child): child is SsoMenuNode => !!child);
    const self =
      item.titulo.toLowerCase().includes(q) || item.descripcion.toLowerCase().includes(q);
    if (!self && !kids.length) return null;
    return { ...item, opciones: kids.length ? kids : item.opciones };
  }
}
