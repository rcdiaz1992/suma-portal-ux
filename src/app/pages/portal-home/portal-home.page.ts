import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { menuIconClass } from '../../data/menu-icons';
import { SsoAuthService, SsoMenuNode } from '../../services/sso-auth.service';
import { SumaSessionService } from '../../services/suma-session.service';
import { ThemeService } from '../../services/theme.service';

const FAV_KEY = 'suma.menu.favorites';
const FAV_SLOTS = 6;

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
  readonly favSlots = FAV_SLOTS;

  constructor(
    private router: Router,
    private sso: SsoAuthService,
    private session: SumaSessionService,
    private themeSvc: ThemeService,
    private sanitizer: DomSanitizer
  ) {}

  get theme() {
    return this.themeSvc.theme;
  }

  /** El legacy avisa que iba a sacar el shell al login SSO; nos quedamos en el portal. */
  @HostListener('window:message', ['$event'])
  onFrameMessage(ev: MessageEvent): void {
    if (!ev?.data || ev.data.type !== 'SUMA_LEGACY_LOGIN') return;
    this.seedLegacySessionCookies();
    this.moduleWarning =
      'El módulo intentó ir al login SSO. Se mantuvo la sesión del portal; reabrí la opción o usá «Abrir aparte».';
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.userPanelOpen) this.userPanelOpen = false;
  }

  ngOnInit(): void {
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
        this.session.seedCookies();
        this.syncPortalView();
      },
      error: (err) => {
        this.loading = false;
        const msg = String(err?.message || err?.error?.result || '');
        if (this.session.isSessionDeadMessage(msg)) {
          this.session.logout(
            /otro (equipo|dispositivo)|concurrente/i.test(msg) ? 'remote' : 'expired',
            this.session.messageFor(
              /otro (equipo|dispositivo)|concurrente/i.test(msg) ? 'remote' : 'expired',
              msg
            )
          );
          return;
        }
        this.error = msg || 'No se pudo cargar el menú del SSO';
        this.syncPortalView();
      },
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.mountEffects());
  }

  ngOnDestroy(): void {
    this.session.stopWatch();
    document.documentElement.removeAttribute('data-portal-view');
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
    queueMicrotask(() => void this.mountHomeParticles());
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
    await this.mountHomeParticles();
  }

  /** Fondo en movimiento del login sobre el tablero de cubos. */
  private async mountHomeParticles(): Promise<void> {
    try {
      const boards = document.querySelectorAll<HTMLElement>('.home-board[data-particles]');
      for (const el of Array.from(boards)) {
        if ((el as HTMLElement & { __particles?: unknown }).__particles) continue;
        await window.ParticlesBg?.mount?.(el);
      }
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

  /** Cubo sin opciones → abre el módulo. Con opciones → no navega (solo la flecha despliega). */
  onCubeClick(item: SsoMenuNode): void {
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

  private withCacheBust(href: string): string {
    const hashAt = href.indexOf('#');
    const path = hashAt >= 0 ? href.slice(0, hashAt) : href;
    const hash = hashAt >= 0 ? href.slice(hashAt) : '';
    const join = path.includes('?') ? '&' : '?';
    return `${path}${join}_=${Date.now()}${hash}`;
  }

  goHome(): void {
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
    this.syncPortalView();
  }

  closeModule(): void {
    this.activeId = null;
    this.activeTitle = '';
    this.moduleHref = '';
    this.moduleUrl = null;
    this.moduleWarning = '';
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
    else {
      if (this.favoriteIds.size >= FAV_SLOTS) {
        const first = this.favoriteIds.values().next().value as number;
        this.favoriteIds.delete(first);
      }
      this.favoriteIds.add(node.id);
    }
    this.persistFavorites();
  }

  favoriteNodes(): SsoMenuNode[] {
    const all = this.menus.reduce(
      (acc, item) => acc.concat(this.leaves(item)),
      [] as SsoMenuNode[]
    );
    return all.filter((n) => this.favoriteIds.has(n.id));
  }

  emptyFavSlots(): number[] {
    const used = this.favoriteNodes().length;
    return Array.from({ length: Math.max(0, FAV_SLOTS - used) }, (_, i) => i);
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
