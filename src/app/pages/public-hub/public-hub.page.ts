import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { menuIconClass } from '../../data/menu-icons';
import {
  PUBLIC_OCE_MENU,
  PublicMenuNode,
  findPublicNode,
} from '../../data/public-oce-menu';
import { SsoAuthService } from '../../services/sso-auth.service';
import { ThemeService } from '../../services/theme.service';
import { environment } from 'src/environments/environment';

const DOC_TIPOS = ['CI', 'NIT', 'CEX', 'PAS'] as const;

@Component({
  selector: 'app-public-hub',
  templateUrl: './public-hub.page.html',
  styleUrls: ['./public-hub.page.scss'],
})
export class PublicHubPage implements OnInit, AfterViewInit, OnDestroy {
  readonly menus = PUBLIC_OCE_MENU;
  readonly docTipos = DOC_TIPOS;

  activeSection: PublicMenuNode | null = null;
  expandedCubeId: string | null = null;
  activeLeaf: PublicMenuNode | null = null;
  activePanel = '';
  navOpen = false;
  menuFilter = '';
  homeFilter = '';
  error = '';
  loading = false;
  resultText = '';

  /** Modelos ops / consultas */
  form: Record<string, string> = {};
  captchaToken = '';
  captchaSrc = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private themeSvc: ThemeService,
    private sso: SsoAuthService,
    private http: HttpClient
  ) {}

  get theme() {
    return this.themeSvc.theme;
  }

  /**
   * Lateral solo cuando los hijos de la sección activa son hojas
   * (2.º nivel en árboles de 2; 3.er nivel en árboles de 3).
   */
  get showSide(): boolean {
    if (!this.activeSection?.opciones?.length) return false;
    return this.activeSection.opciones.every((c) => !c.opciones?.length);
  }

  get portalView(): 'home' | 'section' | 'module' {
    if (this.activePanel || this.activeLeaf) return 'module';
    if (this.activeSection) return 'section';
    return 'home';
  }

  /** Layout CSS: lateral solo en 2.º (hojas) o 3.er nivel; nivel intermedio a ancho completo. */
  get layoutView(): 'home' | 'section' | 'module' {
    if (this.activePanel || this.activeLeaf) return this.showSide ? 'module' : 'home';
    if (this.activeSection && this.showSide) return 'section';
    return 'home';
  }

  ngOnInit(): void {
    const section = this.route.snapshot.queryParamMap.get('s');
    const leaf = this.route.snapshot.queryParamMap.get('o');
    if (section) {
      const node = findPublicNode(section);
      if (node) this.enterSection(node);
    }
    if (leaf) {
      const node = findPublicNode(leaf);
      if (node) this.openLeaf(node);
    }
    this.syncPortalView();
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => void this.mountEffects());
  }

  ngOnDestroy(): void {
    document.documentElement.removeAttribute('data-portal-view');
  }

  toggleTheme(ev?: Event): void {
    ev?.stopPropagation();
    this.themeSvc.toggle();
  }

  toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  iconOf(item: PublicMenuNode): string {
    return menuIconClass(item.titulo, item.descripcion);
  }

  hasChildren(item: PublicMenuNode): boolean {
    return !!item.opciones?.length;
  }

  childCount(item: PublicMenuNode): number {
    return item.opciones?.length || 0;
  }

  rootCubes(): PublicMenuNode[] {
    const q = this.homeFilter.trim().toLowerCase();
    if (!q) return this.menus;
    return this.menus.filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) ||
        m.descripcion.toLowerCase().includes(q) ||
        m.opciones.some((c) => c.titulo.toLowerCase().includes(q))
    );
  }

  sectionChildren(): PublicMenuNode[] {
    return this.activeSection?.opciones || [];
  }

  sideMenu(): PublicMenuNode[] {
    const q = this.menuFilter.trim().toLowerCase();
    const list = this.activeSection?.opciones || [];
    if (!q) return list;
    return list.filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) || m.descripcion.toLowerCase().includes(q)
    );
  }

  isActive(item: PublicMenuNode): boolean {
    return this.activeLeaf?.id === item.id;
  }

  /** En sección: cubo con hijos → entra (3.er nivel + lateral); hoja → abre. */
  onCubeClick(item: PublicMenuNode): void {
    if (this.hasChildren(item)) {
      this.enterSection(item);
      return;
    }
    this.openLeaf(item);
  }

  toggleCubeOptions(item: PublicMenuNode, ev: Event): void {
    ev.stopPropagation();
    if (!this.hasChildren(item)) return;
    this.expandedCubeId = this.expandedCubeId === item.id ? null : item.id;
  }

  onOptionClick(child: PublicMenuNode, parent: PublicMenuNode): void {
    if (this.hasChildren(child)) {
      this.enterSection(child);
      return;
    }
    if (!this.activeSection) this.activeSection = parent;
    this.openLeaf(child);
  }

  /** Entrar a un cubo raíz o intermedio con hijos. */
  enterFromHome(item: PublicMenuNode): void {
    if (this.hasChildren(item)) {
      this.enterSection(item);
      return;
    }
    this.openLeaf(item);
  }

  enterSection(item: PublicMenuNode): void {
    this.activeSection = item;
    this.expandedCubeId = null;
    this.activeLeaf = null;
    this.activePanel = '';
    this.error = '';
    this.resultText = '';
    this.homeFilter = '';
    this.menuFilter = '';
    this.navOpen = false;
    this.syncPortalView();
  }

  goHome(): void {
    this.activeSection = null;
    this.activeLeaf = null;
    this.activePanel = '';
    this.expandedCubeId = null;
    this.error = '';
    this.resultText = '';
    this.navOpen = false;
    this.syncPortalView();
  }

  /** Volver un nivel: si la sección es 3.er nivel, subir al padre raíz. */
  goBack(): void {
    if (this.activePanel || this.activeLeaf) {
      this.activeLeaf = null;
      this.activePanel = '';
      this.error = '';
      this.resultText = '';
      this.syncPortalView();
      return;
    }
    if (!this.activeSection) {
      this.goHome();
      return;
    }
    const parent = this.findParent(this.activeSection.id);
    if (parent) {
      this.enterSection(parent);
    } else {
      this.goHome();
    }
  }

  openLeaf(leaf: PublicMenuNode): void {
    this.error = '';
    this.resultText = '';
    const action = leaf.action;
    if (!action) return;

    if (action.kind === 'route') {
      void this.router.navigate([action.path], { queryParams: action.query || {} });
      return;
    }
    if (action.kind === 'download') {
      window.location.href = this.absoluteUrl(action.path);
      return;
    }
    if (action.kind === 'external') {
      window.open(action.url, '_blank', 'noopener');
      return;
    }
    if (action.kind === 'ssoNotificacion') {
      window.location.href = `${this.sso.ssoHost()}/sso/indexLogin.html#/registroUsuarioNotificacion`;
      return;
    }
    if (action.kind === 'panel') {
      if (!this.activeSection || !this.showSide) {
        const parent = this.findParent(leaf.id);
        if (parent) this.activeSection = parent;
      }
      this.activeLeaf = leaf;
      this.activePanel = action.panel;
      this.form = { tipoDoc: 'CI', tipoId: 'CI' };
      if (action.panel.includes('socorro') || action.panel === 'oce-agencias') {
        this.refreshCaptcha();
      }
      this.navOpen = false;
      this.syncPortalView();
    }
  }

  private findParent(id: string, nodes: PublicMenuNode[] = this.menus): PublicMenuNode | null {
    for (const n of nodes) {
      if (n.opciones?.some((c) => c.id === id)) return n;
      const deeper = this.findParent(id, n.opciones || []);
      if (deeper) return deeper;
    }
    return null;
  }

  private absoluteUrl(path: string): string {
    const host = this.sso.ssoHost() || 'https://suma-dev.aduana.gob.bo';
    if (/^https?:\/\//i.test(path)) return path;
    return `${host}${path.startsWith('/') ? path : '/' + path}`;
  }

  private syncPortalView(): void {
    document.documentElement.setAttribute('data-portal-view', this.layoutView);
    setTimeout(() => void this.mountHomeParticles(), 0);
    setTimeout(() => void this.mountHomeParticles(), 120);
  }

  private async mountEffects(): Promise<void> {
    try {
      if ((window as any).ParticlesBg?.autoMount) {
        await (window as any).ParticlesBg.autoMount();
      }
    } catch {
      /* ignore */
    }
    await this.mountHomeParticles(true);
  }

  private async mountHomeParticles(_force = false): Promise<void> {
    try {
      const api = (window as any).ParticlesBg;
      if (api?.mountAll) await api.mountAll();
      else if (api?.autoMount) await api.autoMount();
    } catch {
      /* ignore */
    }
  }

  refreshCaptcha(): void {
    this.captchaToken = String(Math.floor(Math.random() * 123456789));
    this.captchaSrc = this.sso.captchaImageUrl(this.captchaToken);
    this.form['captcha'] = '';
  }

  private seedNhDoc(cod: string, doc?: string, tipoDoc?: string): void {
    const nro = String(doc || '').trim();
    const tip = String(tipoDoc || '').trim();
    if (!nro) return;
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
    for (const path of ['/', '/oce', '/oce/', '/oce/oceImpExpNp', '/oce/oceImpExpNp/']) {
      document.cookie = `NitExt=${encodeURIComponent(nro)}; path=${path}; expires=${expires}; SameSite=Lax`;
      if (tip) {
        document.cookie = `TipExt=${encodeURIComponent(tip)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
    }
    if (cod === 'MMC') {
      sessionStorage.setItem('agmNit', nro);
      if (tip) sessionStorage.setItem('agmTipoDocumentoIdentificacion', tip);
    }
    if (cod === 'VALIJA') {
      sessionStorage.setItem('vdNit', nro);
      if (tip) sessionStorage.setItem('vdTipoDocumentoIdentificacion', tip);
    }
    if (cod === 'DIMS') {
      localStorage.setItem('DimNitExtU', nro);
      if (tip) localStorage.setItem('DimTipExtU', tip);
    }
    if (cod === 'OCA' || cod === 'CHARTER') {
      localStorage.setItem(cod === 'CHARTER' ? 'chaNit' : 'ocaNit', nro);
      if (tip) {
        localStorage.setItem(
          cod === 'CHARTER' ? 'chaTipoDocumentoIdentificacion' : 'ocaTipoDocumentoIdentificacion',
          tip
        );
      }
    }
  }

  enterCodigo(cod: string, fallback: string, requireDoc = true): void {
    this.error = '';
    const doc = String(this.form['documento'] || '').trim();
    const tipoDoc = String(this.form['tipoDoc'] || 'CI').trim();
    if (requireDoc && !doc) {
      this.error = 'Complete el documento de identificación.';
      return;
    }
    this.loading = true;
    this.sso.loginByCodigo(cod).subscribe({
      next: (res) => {
        this.loading = false;
        this.seedNhDoc(cod, doc, tipoDoc);
        window.location.href = this.sso.absoluteModuleUrl(res, fallback);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || `No se pudo ingresar (${cod})`;
      },
    });
  }

  submitOpsPanel(): void {
    const p = this.activePanel;
    if (p === 'imp-dims') return this.enterCodigo('DIMS', '/oce/oceImpExpNp');
    if (p === 'exp-nh') return this.enterCodigo('NH', '/oce/oceImpExpNp');
    if (p === 'imp-oca' || p === 'exp-oca') return this.enterCodigo('OCA', '/oce/oceImpExpNp');
    if (p === 'imp-print' || p === 'exp-print') {
      if (!this.form['nroDoc']?.trim() || !this.form['nroId']?.trim()) {
        this.error = 'Complete número de documento e identificación.';
        return;
      }
      return this.enterCodigo('NH', '/oce/oceImpExpNp', false);
    }
    if (p === 'imp-mmc' || p === 'exp-mmc') return this.enterCodigo('MMC', '/oce/oceImpExpNp');
    if (p === 'imp-air' || p === 'exp-air') return this.enterCodigo('CHARTER', '/oce/oceCharter');
    if (p === 'imp-valija' || p === 'exp-valija') return this.enterCodigo('VALIJA', '/oce/oceImpExpNp');
    if (p === 'imp-socorro' || p === 'exp-socorro') {
      const code = String(this.form['captcha'] || '').trim();
      if (!code) {
        this.error = 'Ingrese el código de verificación.';
        return;
      }
      this.loading = true;
      this.sso.validateCaptcha(this.captchaToken, code).subscribe({
        next: (ok) => {
          if (!ok) {
            this.loading = false;
            this.error = 'Código de verificación incorrecto';
            this.refreshCaptcha();
            return;
          }
          this.sso.loginByCodigo('SOCORRO').subscribe({
            next: (res) => {
              this.loading = false;
              window.location.href = this.sso.absoluteModuleUrl(res, '/oce/oceImpExpNp');
            },
            error: (err) => {
              this.loading = false;
              this.error = err?.message || 'No se pudo ingresar a Envíos de socorro';
              this.refreshCaptcha();
            },
          });
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo validar el captcha';
          this.refreshCaptcha();
        },
      });
      return;
    }
  }

  /** Consultas públicas: APIs OCE / ingreso o login DEP. */
  submitConsulta(): void {
    this.error = '';
    this.resultText = '';
    const p = this.activePanel;
    const doc = String(this.form['documento'] || '').trim();
    const tipo = String(this.form['tipoDoc'] || 'NIT').trim();
    const host = this.sso.ssoHost() || 'https://suma-dev.aduana.gob.bo';

    if (p === 'oce-estado') {
      if (!doc) {
        this.error = 'Ingrese el documento.';
        return;
      }
      this.loading = true;
      this.http
        .get<any>(
          `${host}/b-oce/rest/gestor-transaccional/operadores/consulta-estado/tipo-suspension/${encodeURIComponent(doc)}/${encodeURIComponent(tipo)}`
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            if (!res?.success) {
              this.error = res?.result || 'Sin resultados';
              return;
            }
            this.resultText = JSON.stringify(res.result, null, 2);
          },
          error: () => {
            this.loading = false;
            this.error = 'No se pudo consultar el estado del operador.';
          },
        });
      return;
    }

    if (p === 'oce-datos') {
      window.open(`${host}/oce/reportes/#/operadoresExterno`, '_blank', 'noopener');
      return;
    }
    if (p === 'oce-medios') {
      window.open(`${host}/oce/reportes/#/mediosTransporteExterno`, '_blank', 'noopener');
      return;
    }
    if (p === 'oce-agencias') {
      const code = String(this.form['captcha'] || '').trim();
      if (!code) {
        this.error = 'Ingrese el captcha.';
        return;
      }
      this.loading = true;
      this.sso.validateCaptcha(this.captchaToken, code).subscribe({
        next: (ok) => {
          this.loading = false;
          if (!ok) {
            this.error = 'Captcha incorrecto';
            this.refreshCaptcha();
            return;
          }
          window.open(
            `${host}/b-oce/rest/reportes/consultaExterna/reporteOCEagenciaDespachantePortal`,
            '_blank',
            'noopener'
          );
        },
        error: () => {
          this.loading = false;
          this.error = 'No se pudo validar el captcha';
          this.refreshCaptcha();
        },
      });
      return;
    }
    if (p === 'oce-tramite') {
      if (!doc) {
        this.error = 'Ingrese el documento.';
        return;
      }
      this.loading = true;
      this.http
        .get<any>(
          `${host}/b-gestor-mensajeria/rest/tarea/estado/nit/${encodeURIComponent(doc)}/${encodeURIComponent(tipo)}`
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.resultText = JSON.stringify(res, null, 2);
          },
          error: () => {
            this.loading = false;
            this.error = 'No se pudo consultar el trámite.';
          },
        });
      return;
    }
    if (p === 'con-dam' || p === 'con-dim') {
      const num = String(this.form['numero'] || '').trim();
      if (!num || !doc) {
        this.error = 'Complete número y documento del importador.';
        return;
      }
      const path = p === 'con-dam' ? 'dam/consulta/publica' : 'dim/consulta/publica';
      this.loading = true;
      this.http
        .post<any>(`${host}/b-ingreso/api/json/${path}`, {
          'data.num': num,
          'data.imp.numDoc': doc,
          'data.imp.codTipDoc': tipo,
        })
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.resultText = JSON.stringify(res, null, 2);
          },
          error: () => {
            this.loading = false;
            this.error = 'No se encontró resultados o falló la consulta.';
          },
        });
      return;
    }
    if (p === 'con-prm') {
      this.enterCodigo('DEP', '/oce/oceImpExpNp', false);
      return;
    }
    if (p === 'con-mic') {
      const num = String(this.form['numero'] || '').trim();
      if (!num) {
        this.error = 'Ingrese el número de MIC.';
        return;
      }
      const estados = 'AUTORIZADO,CONCLUIDO,REGISTRADO,ANULADO,OBSERVADO';
      this.loading = true;
      this.http
        .get<any>(
          `${host}/b-ingreso/api/json/manifiesto/consulta/publica/${encodeURIComponent(num)}?estados=${estados}`
        )
        .subscribe({
          next: (res) => {
            this.loading = false;
            this.resultText = JSON.stringify(res, null, 2);
          },
          error: () => {
            this.loading = false;
            this.error = 'No se pudo consultar el MIC.';
          },
        });
    }
  }

  goLogin(): void {
    void this.router.navigateByUrl('/login');
  }

  /** Evita unused env warning if tree-shaken elsewhere */
  get envName(): string {
    return environment.environmentName || '';
  }
}
