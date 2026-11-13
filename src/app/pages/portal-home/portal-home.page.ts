import { AfterViewInit, Component, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { menuIconClass } from '../../data/menu-icons';
import { SsoAuthService, SsoMenuNode } from '../../services/sso-auth.service';
import { SumaSessionService } from '../../services/suma-session.service';
import { ThemeService } from '../../services/theme.service';

const FAV_KEY = 'suma.menu.favorites';/** Máximo de favoritos en acceso rápido (antes 6). */
const FAV_SLOTS = 12;
/** Huecos vacíos visibles como guía (no llenar los 12). */
const FAV_EMPTY_HINT = 2;

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
  documento = '';
  correo = '';
  dependencia = '';
  menuFilter = '';
  homeFilter = '';
  menus: SsoMenuNode[] = [];
  loading = false;
  error = '';
  navOpen = false;
  userPanelOpen = false;
  /** Tab del banner: firma | soporte | seguimiento. */
  bannerTab: 'firma' | 'soporte' | 'seguimiento' = 'firma';
  private readonly bannerTabs: Array<'firma' | 'soporte' | 'seguimiento'> = [
    'firma',
    'soporte',
    'seguimiento',
  ];
  private readonly bannerRotateMs = 8500;
  private bannerRotateTimer: ReturnType<typeof setInterval> | null = null;
  /** Sección (cubo de 1.er nivel) activa → mini-menú lateral. */
  activeSection: SsoMenuNode | null = null;
  /** Cubo expandido en el home (submenú inline, estilo Impuestos). */
  expandedCubeId: number | null = null;
  favoriteIds = new Set<number>();
  /** Opción abierta dentro del shell (iframe), como el portal SUMA. */
  activeId: number | null = null;
  activeTitle = '';
  moduleHref = '';
  moduleUrl: SafeResourceUrl | null = null;
  moduleWarning = '';
  /** Charter / acceso directo: banner + iframe sin menú lateral. */
  directEmbed = false;
  private pendingEmbed = '';
  readonly favSlots = FAV_SLOTS;
  /** Zona de favoritos resaltada al arrastrar una opción. */
  favDropActive = false;
  private dragFavId: number | null = null;
  /** Arrastre táctil (HTML5 DnD no funciona bien en celular). */
  private touchDragId: number | null = null;
  private touchDragging = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchTimer: ReturnType<typeof setTimeout> | null = null;
  private touchListenersBound = false;
  private touchGhost: HTMLElement | null = null;
  private suppressClickUntil = 0;
  private readonly onTouchMoveBound = (ev: TouchEvent) => this.onFavTouchMove(ev);
  private readonly onTouchEndBound = (ev: TouchEvent) => this.onFavTouchEnd(ev);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private sso: SsoAuthService,
    private session: SumaSessionService,
    private themeSvc: ThemeService,
    private sanitizer: DomSanitizer,
    private zone: NgZone
  ) {}

  get theme() {
    return this.themeSvc.theme;
  }

  /**
   * El proxy (patchTopBreakout) convierte window.top → indexOce en postMessage.
   * Charter / REG_CHARTER (temporal): portal SUMA legacy #/home por ambiente.
   * Resto de módulos: mantener shell (aviso).
   */
  @HostListener('window:message', ['$event'])
  onFrameMessage(ev: MessageEvent): void {
    if (!ev?.data || ev.data.type !== 'SUMA_LEGACY_LOGIN') return;
    if (this.directEmbed || this.session.usuario === 'REG_CHARTER') {
      const dest =
        typeof ev.data.url === 'string' && ev.data.url
          ? ev.data.url
          : this.session.legacyPortalHomeUrl();
      this.session.logoutExternal(dest, 'logout');
      return;
    }
    this.seedLegacySessionCookies();
    this.moduleWarning =
      'El módulo intentó ir al login SSO. Se mantuvo la sesión del portal; reabrí la opción o usá «Abrir aparte».';
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.userPanelOpen) this.userPanelOpen = false;
  }

  ngOnInit(): void {
    // OCE (Charter y otros) llama parent.hideScroll / showScroll en modales Bootstrap.
    const w = window as Window & { hideScroll?: () => void; showScroll?: () => void };
    if (typeof w.hideScroll !== 'function') w.hideScroll = () => undefined;
    if (typeof w.showScroll !== 'function') w.showScroll = () => undefined;

    const token = this.session.token;
    this.usuario = this.session.usuario;
    const raw = this.session.tipo;
    if (raw === 'NO_HABITUAL') {
      this.router.navigateByUrl('/hub/no-habituales');
      return;
    }
    if (!token) {
      this.session.logout('missing');
      return;
    }
    this.capturePendingEmbed();
    this.tipo = raw;
    this.initials = this.makeInitials(this.usuario || 'SU');
    this.loadFavorites();
    this.session.startWatch();
    this.loading = true;
    this.sso.credentialPortal(token).subscribe({
      next: (session) => {
        this.loading = false;
        this.usuario = session.usuario || this.usuario;
        this.nombre = session.nombre;
        this.tipo = session.tipo || this.tipo;
        this.perfil = session.roles[0] || this.tipo || 'SUMA';
        this.documento = session.documento;
        this.correo = session.correo;
        this.dependencia = session.dependencia || this.perfil;
        this.menus = session.menus;
        this.initials = this.makeInitials(this.nombre || this.usuario || 'SU');
        if (session.tipo) sessionStorage.setItem('suma.tipoUser', session.tipo);
        if (session.usuario) sessionStorage.setItem('suma.usuario', session.usuario);
        this.session.setOperadorCookies(
          session.documento || undefined,
          session.tipoDocumento || 'NIT'
        );
        this.tryOpenPendingEmbed();
        this.syncPortalView();
      },
      error: (err) => {
        this.loading = false;
        const msg = String(err?.message || err?.error?.result || '');
        if (this.session.isSessionDeadMessage(msg) && !this.pendingEmbed) {
          this.session.logout(
            /otro (equipo|dispositivo)|concurrente/i.test(msg) ? 'remote' : 'expired',
            this.session.messageFor(
              /otro (equipo|dispositivo)|concurrente/i.test(msg) ? 'remote' : 'expired',
              msg
            )
          );
          return;
        }
        if (!this.pendingEmbed) {
          this.error = msg || 'No se pudo cargar el menú del SSO';
        }
        this.tryOpenPendingEmbed();
        this.syncPortalView();
      },
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.mountEffects());
  }

  ngOnDestroy(): void {
    this.stopBannerRotate();
    this.clearTouchDrag();
    this.session.stopWatch();
    document.documentElement.removeAttribute('data-portal-view');
    document.documentElement.removeAttribute('data-portal-embed');
  }

  private makeInitials(value: string): string {
    const parts = (value || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'SU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  toggleTheme(ev?: Event): void {
    ev?.stopPropagation();
    this.themeSvc.toggle();
  }

  toggleUserPanel(ev: Event): void {
    ev.stopPropagation();
    this.userPanelOpen = !this.userPanelOpen;
  }

  keepUserPanel(ev: Event): void {
    ev.stopPropagation();
  }

  goHomeFromPanel(): void {
    this.userPanelOpen = false;
    this.goHome();
  }

  get portalView(): 'home' | 'section' | 'module' {
    if (this.moduleUrl) return 'module';
    if (this.activeSection) return 'section';
    return 'home';
  }

  private syncPortalView(): void {
    document.documentElement.setAttribute('data-portal-view', this.portalView);
    if (this.directEmbed) {
      document.documentElement.setAttribute('data-portal-embed', '1');
    } else {
      document.documentElement.removeAttribute('data-portal-embed');
    }
    // Tras *ngIf del lateral: esperar layout real (altura > 0) antes de montar redes.
    setTimeout(() => void this.mountHomeParticles(), 0);
    setTimeout(() => void this.mountHomeParticles(), 120);
  }

  private capturePendingEmbed(): void {
    const raw = this.route.snapshot.queryParamMap.get('embed') || '';
    if (!raw) return;
    this.pendingEmbed = raw;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private tryOpenPendingEmbed(): void {
    if (!this.pendingEmbed) return;
    const href = this.normalizeEmbedHref(this.pendingEmbed);
    this.pendingEmbed = '';
    if (!href) return;
    const title = /oceCharter/i.test(href) ? 'Registro Charter' : 'Módulo';
    this.openEmbedUrl(href, title, true);
  }

  private normalizeEmbedHref(raw: string): string {
    let href = String(raw || '').trim();
    if (!href) return '';
    href = href.replace(/^https?:\/\/suma-dev\.aduana\.gob\.bo/i, '');
    href = href.replace(/^https?:\/\/[^/]+/i, '');
    if (!href.startsWith('/')) href = `/${href}`;
    return href;
  }

  openEmbedUrl(href: string, title: string, direct = false): void {
    this.moduleWarning = '';
    this.seedLegacySessionCookies();
    if (/oceCharter/i.test(href)) {
      this.session.seedCharterEntryCookies();
    }
    const framed = this.withCacheBust(href);
    this.directEmbed = direct;
    this.activeId = -1;
    this.activeTitle = title;
    this.moduleHref = framed;
    this.moduleUrl = this.sanitizer.bypassSecurityTrustResourceUrl(framed);
    this.navOpen = false;
    this.syncPortalView();
  }

  setBannerTab(tab: 'firma' | 'soporte' | 'seguimiento'): void {
    if (this.bannerTab === tab) {
      this.replayBannerSvg();
      this.startBannerRotate();
      return;
    }
    this.bannerTab = tab;
    queueMicrotask(() => this.replayBannerSvg());
    this.startBannerRotate();
  }

  private async mountEffects(): Promise<void> {
    this.replayBannerSvg();
    this.startBannerRotate();
    try {
      if (window.ParticlesBg?.autoMount) {
        await window.ParticlesBg.autoMount();
      }
    } catch {
      /* ignore */
    }
    // Mapa / autoformas = SVG stroke. Solo redes tsParticles.
    await this.mountHomeParticles(true);
  }

  private startBannerRotate(): void {
    this.stopBannerRotate();
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

  /** Reinicia stroke animation del SVG activo (mapa o autoformas). */
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

  /** Fondo de redes (tsParticles) en tablero, lateral, barra superior y banner. */
  private async mountHomeParticles(forceRemount = false): Promise<void> {
    try {
      const nodes = document.querySelectorAll<HTMLElement>(
        '.suma-banner-slot[data-particles], .home-board[data-particles], .shell-side-fx[data-particles], .shell-top[data-particles]'
      );
      for (const el of Array.from(nodes)) {
        const host = el as HTMLElement & {
          __particles?: { resize?: () => void; refresh?: () => void; destroy?: () => void };
        };
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) continue;

        if (host.__particles) {
          if (!forceRemount) {
            try {
              host.__particles.resize?.();
              host.__particles.refresh?.();
            } catch {
              /* ignore */
            }
            const canvas = el.querySelector(':scope > .tsparticles-bg canvas');
            if (canvas && canvas.clientHeight > 0) continue;
          }
          try {
            host.__particles.destroy?.();
          } catch {
            /* ignore */
          }
          delete host.__particles;
        }
        await window.ParticlesBg?.mount?.(el);
      }
      requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    } catch {
      /* ignore */
    }
  }

  /** Cubos del primer nivel (raíz del menú SSO). */
  rootCubes(): SsoMenuNode[] {
    const q = this.homeFilter.trim().toLowerCase();
    if (!q) return this.menus;
    return this.menus.filter(
      (item) =>
        this.nodeMatches(item, q) || this.leaves(item).some((leaf) => this.nodeMatches(leaf, q))
    );
  }

  /** Resultados planos del buscador (hojas). */
  searchLeaves(): SsoMenuNode[] {
    const q = this.homeFilter.trim().toLowerCase();
    if (!q) return [];
    return this.menus
      .reduce((acc, item) => acc.concat(this.leaves(item)), [] as SsoMenuNode[])
      .filter((leaf) => this.nodeMatches(leaf, q));
  }

  sideMenu(): SsoMenuNode[] {
    if (!this.activeSection) return [];
    const q = this.menuFilter.trim().toLowerCase();
    const kids = this.activeSection.opciones;
    if (!q) return kids;
    return kids
      .map((item) => this.filterNode(item, q))
      .filter((item): item is SsoMenuNode => !!item);
  }

  sectionChildren(): SsoMenuNode[] {
    return this.activeSection?.opciones || [];
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

  iconOf(item: SsoMenuNode): string {
    return menuIconClass(item.titulo, item.descripcion);
  }

  childCount(item: SsoMenuNode): number {
    return this.leaves(item).length;
  }

  hasChildren(item: SsoMenuNode): boolean {
    return !!item.opciones?.length;
  }

  /**
   * Cubo con lista de opciones → no navega (solo la flecha despliega).
   * Cubo hoja (sin opciones) → abre el módulo.
   */
  onCubeClick(item: SsoMenuNode): void {
    if (this.shouldSuppressNavClick()) return;
    if (this.hasChildren(item)) return;
    this.openNode(item);
  }

  /** Flecha: solo despliega / pliega las opciones del cubo. */
  toggleCubeOptions(item: SsoMenuNode, ev: Event): void {
    ev.stopPropagation();
    if (!this.hasChildren(item)) return;
    this.expandedCubeId = this.expandedCubeId === item.id ? null : item.id;
  }

  /** Opción hija: si tiene hijos → mini menú lateral; si es hoja → módulo. */
  onOptionClick(child: SsoMenuNode, parent: SsoMenuNode): void {
    if (this.shouldSuppressNavClick()) return;
    if (this.hasChildren(child)) {
      this.enterSection(child);
      return;
    }
    this.openFromHome(child, parent);
  }

  enterSection(item: SsoMenuNode): void {
    this.activeSection = item;
    this.expandedCubeId = null;
    this.homeFilter = '';
    this.menuFilter = '';
    this.moduleUrl = null;
    this.moduleHref = '';
    this.activeId = null;
    this.activeTitle = '';
    this.moduleWarning = '';
    this.navOpen = false;
    this.syncPortalView();
  }

  openFromHome(leaf: SsoMenuNode, section?: SsoMenuNode): void {
    if (this.shouldSuppressNavClick()) return;
    if (section) this.activeSection = section;
    else this.activeSection = this.findRootFor(leaf);
    this.openNode(leaf);
  }

  openNode(node: SsoMenuNode): void {
    let href = this.sso.resolveMenuUrl(node.url);
    if (!href) {
      if (node.opciones.length) {
        this.enterSection(node);
      }
      return;
    }
    href = href.replace(/^https?:\/\/suma-dev\.aduana\.gob\.bo/i, '');
    if (!href.startsWith('/')) href = '/' + href;
    this.moduleWarning = '';
    this.seedLegacySessionCookies();
    const framed = this.withCacheBust(href);
    this.activeId = node.id;
    this.activeTitle = node.titulo || node.descripcion || 'Módulo';
    this.moduleHref = framed;
    this.moduleUrl = this.sanitizer.bypassSecurityTrustResourceUrl(framed);
    if (!this.activeSection) {
      this.activeSection = this.findRootFor(node);
    }
    this.navOpen = false;
    this.syncPortalView();
  }

  private seedLegacySessionCookies(): void {
    this.session.seedCookies();
  }

  openExternal(): void {
    if (this.moduleHref) {
      window.open(this.moduleHref, '_blank', 'noopener');
    }
  }

  onModuleFrameLoad(ev: Event): void {
    // FRVMR (y otros) pueden limpiar storage del mismo origen; re-sembrar shell.
    this.seedLegacySessionCookies();
    const iframe = ev.target as HTMLIFrameElement;
    try {
      const href = iframe.contentWindow?.location?.href || '';
      if (!href || href === 'about:blank') return;
      if (
        /\/sso\/indexOce\.html|\/sso\/indexLogin\.html|\/login(?:\/portal)?(?:\?|#|$)/i.test(
          href
        ) ||
        /#\/login(?:\/portal)?(?:\?|$)/i.test(href)
      ) {
        if (this.directEmbed || this.session.usuario === 'REG_CHARTER') {
          this.leaveCharterToLegacyPortal();
          return;
        }
        this.seedLegacySessionCookies();
        this.moduleWarning =
          'Gestión de Usuarios perdió la sesión del módulo. Volvé a abrir la opción desde el menú.';
      }
      if (this.directEmbed) {
        this.fixEmbedFrameScroll(iframe);
      }
    } catch {
      /* cross-origin */
    }
  }

  /** Charter: scroll interno del iframe (sin auto-altura que deja huecos enormes). */
  private fixEmbedFrameScroll(iframe: HTMLIFrameElement): void {
    try {
      const win = iframe.contentWindow as (Window & {
        hideScroll?: () => void;
        showScroll?: () => void;
      }) | null;
      const doc = iframe.contentDocument || win?.document;
      if (!doc || !win) return;
      const noop = () => undefined;
      if (typeof win.hideScroll !== 'function') win.hideScroll = noop;
      if (typeof win.showScroll !== 'function') win.showScroll = noop;
      try {
        const p = win.parent as Window & { hideScroll?: () => void; showScroll?: () => void };
        if (p) {
          if (typeof p.hideScroll !== 'function') p.hideScroll = noop;
          if (typeof p.showScroll !== 'function') p.showScroll = noop;
        }
      } catch {
        /* ignore */
      }
      iframe.style.height = '';
      const styleId = 'suma-portal-embed-scroll';
      let style = doc.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = doc.createElement('style');
        style.id = styleId;
        (doc.head || doc.documentElement).appendChild(style);
      }
      style.textContent = `
        html {
          height: 100% !important;
          overflow: hidden !important;
        }
        body {
          height: 100% !important;
          max-height: 100% !important;
          min-height: 0 !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          margin: 0 !important;
        }
        .main-container, .page-content, #main-container, .container,
        .tab-content, .widget-body, .widget-main, .panel-body {
          overflow: visible !important;
          max-height: none !important;
        }
        /* Alertas OCE visibles dentro del iframe */
        .modal,
        .modal.modal-central {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
          overflow: auto !important;
          z-index: 10050 !important;
        }
        .modal-dialog,
        .modal-dialog-s {
          margin: 12vh auto !important;
          position: relative !important;
          z-index: 10051 !important;
        }
        .modal-backdrop {
          position: fixed !important;
          z-index: 10040 !important;
        }
      `;
    } catch {
      /* cross-origin */
    }
  }

  private withCacheBust(href: string): string {
    const hashAt = href.indexOf('#');
    const path = hashAt >= 0 ? href.slice(0, hashAt) : href;
    const hash = hashAt >= 0 ? href.slice(hashAt) : '';
    const join = path.includes('?') ? '&' : '?';
    return `${path}${join}_=${Date.now()}${hash}`;
  }

  /** Temporal: fin Charter → portal legacy #/home del ambiente. */
  private leaveCharterToLegacyPortal(): void {
    this.session.logoutExternal(this.session.legacyPortalHomeUrl(), 'logout');
  }

  goHome(): void {
    if (this.directEmbed) {
      this.leaveCharterToLegacyPortal();
      return;
    }
    this.activeSection = null;
    this.expandedCubeId = null;
    this.activeId = null;
    this.activeTitle = '';
    this.moduleHref = '';
    this.moduleUrl = null;
    this.moduleWarning = '';
    this.menuFilter = '';
    this.homeFilter = '';
    this.navOpen = false;
    this.directEmbed = false;
    this.syncPortalView();
  }

  closeModule(): void {
    if (this.directEmbed) {
      this.leaveCharterToLegacyPortal();
      return;
    }
    this.activeId = null;
    this.activeTitle = '';
    this.moduleHref = '';
    this.moduleUrl = null;
    this.moduleWarning = '';
    this.directEmbed = false;
    this.syncPortalView();
  }

  isActive(node: SsoMenuNode): boolean {
    return this.activeId != null && node.id === this.activeId;
  }

  isFavorite(node: SsoMenuNode): boolean {
    return this.favoriteIds.has(node.id);
  }

  toggleFavorite(node: SsoMenuNode, ev?: Event): void {
    ev?.stopPropagation();
    if (this.favoriteIds.has(node.id)) this.favoriteIds.delete(node.id);
    else this.addFavorite(node.id);
    this.persistFavorites();
  }

  /** Solo hojas (opción con URL / sin hijos) se pueden arrastrar a favoritos. */
  canDragToFav(node: SsoMenuNode): boolean {
    return !this.hasChildren(node);
  }

  /** Evita que el click post-touch abra el módulo tras soltar en favoritos. */
  shouldSuppressNavClick(): boolean {
    return Date.now() < this.suppressClickUntil;
  }

  onFavDragStart(node: SsoMenuNode, ev: DragEvent): void {
    if (!this.canDragToFav(node)) {
      ev.preventDefault();
      return;
    }
    this.dragFavId = node.id;
    ev.dataTransfer?.setData('text/plain', String(node.id));
    ev.dataTransfer?.setData('application/x-suma-fav', String(node.id));
    if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'copyMove';
    this.favDropActive = true;
  }

  onFavDragEnd(): void {
    this.dragFavId = null;
    this.favDropActive = false;
  }

  onFavDragOver(ev: DragEvent): void {
    if (!this.isFavDrag(ev) && this.dragFavId == null) return;
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'copy';
    this.favDropActive = true;
  }

  onFavDragLeave(ev: DragEvent): void {
    const t = ev.currentTarget as HTMLElement | null;
    const related = ev.relatedTarget as Node | null;
    if (t && related && t.contains(related)) return;
    this.favDropActive = false;
  }

  onFavDrop(ev: DragEvent, beforeId?: number): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.favDropActive = false;
    const raw =
      ev.dataTransfer?.getData('application/x-suma-fav') ||
      ev.dataTransfer?.getData('text/plain') ||
      (this.dragFavId != null ? String(this.dragFavId) : '');
    const id = Number(raw);
    this.dragFavId = null;
    if (!Number.isFinite(id) || id <= 0) return;
    const node = this.findNodeById(id);
    if (!node || this.hasChildren(node)) return;
    this.addFavorite(id, beforeId);
    this.persistFavorites();
  }

  /**
   * Celular: mantener ~0,2s y arrastrar hasta «Acceso rápido».
   * (drag HTML5 casi no existe en touch).
   */
  onFavTouchStart(node: SsoMenuNode, ev: TouchEvent): void {
    if (!this.canDragToFav(node) || !ev.touches.length) return;
    const t = ev.touches[0];
    this.clearTouchDrag(false);
    this.touchDragId = node.id;
    this.touchDragging = false;
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.bindTouchDragListeners();
    this.touchTimer = setTimeout(() => {
      this.zone.run(() => {
        if (this.touchDragId !== node.id) return;
        this.touchDragging = true;
        this.favDropActive = true;
        this.ensureFavStripVisible();
        this.mountTouchGhost(node, this.touchStartX, this.touchStartY);
        if (navigator.vibrate) {
          try {
            navigator.vibrate(18);
          } catch {
            /* ignore */
          }
        }
      });
    }, 220);
  }

  private onFavTouchMove(ev: TouchEvent): void {
    if (this.touchDragId == null || !ev.touches.length) return;
    const t = ev.touches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    if (!this.touchDragging) {
      if (Math.hypot(dx, dy) > 14) {
        this.zone.run(() => this.clearTouchDrag(false));
      }
      return;
    }
    ev.preventDefault();
    this.moveTouchGhost(t.clientX, t.clientY);
    const overFav = this.isPointOverFavStrip(t.clientX, t.clientY);
    if (this.favDropActive !== overFav) {
      this.zone.run(() => {
        this.favDropActive = overFav;
      });
    }
  }

  private onFavTouchEnd(ev: TouchEvent): void {
    if (this.touchDragId == null) {
      this.zone.run(() => this.clearTouchDrag());
      return;
    }
    const id = this.touchDragId;
    const wasDragging = this.touchDragging;
    this.zone.run(() => {
      if (wasDragging) {
        const touch = ev.changedTouches?.[0];
        const x = touch?.clientX ?? -1;
        const y = touch?.clientY ?? -1;
        if (this.isPointOverFavStrip(x, y)) {
          const node = this.findNodeById(id);
          if (node && !this.hasChildren(node)) {
            this.addFavorite(id);
            this.persistFavorites();
            this.suppressClickUntil = Date.now() + 500;
          }
        }
      }
      this.clearTouchDrag();
    });
  }

  private bindTouchDragListeners(): void {
    if (this.touchListenersBound) return;
    this.touchListenersBound = true;
    document.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
    document.addEventListener('touchend', this.onTouchEndBound);
    document.addEventListener('touchcancel', this.onTouchEndBound);
  }

  private unbindTouchDragListeners(): void {
    if (!this.touchListenersBound) return;
    this.touchListenersBound = false;
    document.removeEventListener('touchmove', this.onTouchMoveBound);
    document.removeEventListener('touchend', this.onTouchEndBound);
    document.removeEventListener('touchcancel', this.onTouchEndBound);
  }

  private clearTouchDrag(unbind = true): void {
    if (this.touchTimer) {
      clearTimeout(this.touchTimer);
      this.touchTimer = null;
    }
    this.touchDragId = null;
    this.touchDragging = false;
    this.favDropActive = false;
    this.removeTouchGhost();
    if (unbind) this.unbindTouchDragListeners();
  }

  private ensureFavStripVisible(): void {
    const strip = document.querySelector('.fav-strip') as HTMLElement | null;
    strip?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private isPointOverFavStrip(x: number, y: number): boolean {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    return !!el?.closest('.fav-strip');
  }

  private mountTouchGhost(node: SsoMenuNode, x: number, y: number): void {
    this.removeTouchGhost();
    const ghost = document.createElement('div');
    ghost.className = 'fav-drag-ghost';
    ghost.textContent = node.titulo || 'Favorito';
    document.body.appendChild(ghost);
    this.touchGhost = ghost;
    this.moveTouchGhost(x, y);
  }

  private moveTouchGhost(x: number, y: number): void {
    if (!this.touchGhost) return;
    this.touchGhost.style.transform = `translate(${x - 56}px, ${y - 28}px)`;
  }

  private removeTouchGhost(): void {
    this.touchGhost?.remove();
    this.touchGhost = null;
  }

  favoriteNodes(): SsoMenuNode[] {
    const all = this.menus.reduce(
      (acc, item) => acc.concat(this.leaves(item)),
      [] as SsoMenuNode[]
    );
    const byId = new Map(all.map((n) => [n.id, n]));
    return [...this.favoriteIds]
      .map((id) => byId.get(id))
      .filter((n): n is SsoMenuNode => !!n);
  }

  emptyFavSlots(): number[] {
    const used = this.favoriteNodes().length;
    const remaining = Math.max(0, FAV_SLOTS - used);
    const hint = Math.min(FAV_EMPTY_HINT, remaining);
    return Array.from({ length: hint }, (_, i) => i);
  }

  private isFavDrag(ev: DragEvent): boolean {
    const types = ev.dataTransfer?.types;
    if (!types) return false;
    return (
      Array.from(types as unknown as string[]).includes('application/x-suma-fav') ||
      Array.from(types as unknown as string[]).includes('text/plain')
    );
  }

  private addFavorite(id: number, beforeId?: number): void {
    const order = [...this.favoriteIds].filter((x) => x !== id);
    if (beforeId != null && order.includes(beforeId)) {
      const at = order.indexOf(beforeId);
      order.splice(at, 0, id);
    } else {
      order.push(id);
    }
    while (order.length > FAV_SLOTS) order.shift();
    this.favoriteIds = new Set(order);
  }

  private findNodeById(id: number): SsoMenuNode | null {
    const walk = (nodes: SsoMenuNode[]): SsoMenuNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n;
        const hit = walk(n.opciones || []);
        if (hit) return hit;
      }
      return null;
    };
    return walk(this.menus);
  }

  private loadFavorites(): void {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const ids = raw ? (JSON.parse(raw) as number[]) : [];
      this.favoriteIds = new Set(Array.isArray(ids) ? ids.slice(0, FAV_SLOTS) : []);
    } catch {
      this.favoriteIds = new Set();
    }
  }

  private persistFavorites(): void {
    localStorage.setItem(FAV_KEY, JSON.stringify([...this.favoriteIds]));
  }

  private findRootFor(node: SsoMenuNode): SsoMenuNode | null {
    for (const root of this.menus) {
      if (root.id === node.id) return root;
      if (this.containsNode(root, node.id)) return root;
    }
    return null;
  }

  private containsNode(root: SsoMenuNode, id: number): boolean {
    return root.opciones.some((c) => c.id === id || this.containsNode(c, id));
  }

  private nodeMatches(item: SsoMenuNode, q: string): boolean {
    return (
      (item.titulo || '').toLowerCase().includes(q) ||
      (item.descripcion || '').toLowerCase().includes(q)
    );
  }

  logout(): void {
    this.session.logout('logout');
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  private filterNode(item: SsoMenuNode, q: string): SsoMenuNode | null {
    const kids = item.opciones
      .map((child) => this.filterNode(child, q))
      .filter((child): child is SsoMenuNode => !!child);
    const self = this.nodeMatches(item, q);
    if (!self && !kids.length) return null;
    return { ...item, opciones: kids.length ? kids : item.opciones };
  }
}
