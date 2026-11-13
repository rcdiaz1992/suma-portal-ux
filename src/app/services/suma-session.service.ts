import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject, Subscription, of, timer } from 'rxjs';
import { catchError, finalize, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { LoginResult, SsoAuthService } from './sso-auth.service';

export type SessionEndReason =
  | 'logout'
  | 'expired'
  | 'invalid'
  | 'remote'
  | 'missing'
  | 'http';

const STORAGE = {
  token: 'suma.token',
  usuario: 'suma.usuario',
  tipo: 'suma.tipoUser',
  jwt: 'suma.jwt',
  nit: 'suma.nit',
  tipoDoc: 'suma.tipoDocumentoIdentificacion',
} as const;

const COOKIE_PATHS = [
  '/',
  '/sso',
  '/sso/',
  '/oce',
  '/oce/',
  '/oce/oceCharter',
  '/oce/oceCharter/',
  '/oce/reportes',
  '/oce/reportes/',
  '/oce/administracion',
  '/oce/administracion/',
  '/portal',
  '/portal/',
  '/frvmr',
  '/frvmr/',
  '/b-sso',
  '/b-sso/',
  '/b-oce',
  '/b-oce/',
];

/** Intervalo de verificación del token (como el portal SSO). */
const WATCH_MS = 45_000;

@Injectable({ providedIn: 'root' })
export class SumaSessionService implements OnDestroy {
  private readonly stop$ = new Subject<void>();
  private watchSub: Subscription | null = null;
  private ending = false;
  private visibilityBound = false;

  /** Emite cuando la sesión se cierra de forma forzada (expiró / otro equipo / inválido). */
  readonly sessionEnded$ = new Subject<{ reason: SessionEndReason; message: string }>();

  constructor(
    private http: HttpClient,
    private sso: SsoAuthService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    this.stopWatch();
    this.stop$.next();
    this.stop$.complete();
    this.unbindVisibility();
  }

  get token(): string {
    return sessionStorage.getItem(STORAGE.token) || '';
  }

  get usuario(): string {
    return sessionStorage.getItem(STORAGE.usuario) || '';
  }

  get tipo(): string {
    return sessionStorage.getItem(STORAGE.tipo) || '';
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  /** Tras login OK: guarda token y siembra cookies legacy. */
  establish(res: LoginResult): void {
    this.ending = false;
    sessionStorage.setItem(STORAGE.token, res.token);
    sessionStorage.setItem(STORAGE.usuario, res.usuario);
    sessionStorage.setItem(STORAGE.tipo, res.tipo);
    if (res.jwt) sessionStorage.setItem(STORAGE.jwt, res.jwt);
    else sessionStorage.removeItem(STORAGE.jwt);
    this.seedCookies();
  }

  /** Guarda NIT / tipodoc para módulos OCE (Mis Datos, certificado). */
  setOperadorCookies(nit?: string, tipoDocumento?: string): void {
    if (nit) sessionStorage.setItem(STORAGE.nit, nit);
    if (tipoDocumento) sessionStorage.setItem(STORAGE.tipoDoc, tipoDocumento);
    this.seedCookies();
  }

  /**
   * Claves que leen módulos Angular (FRVMR) en el mismo origen.
   * Sin `jwt`, el interceptor de FRVMR navega a `/` y Solicitudes queda en blanco.
   */
  private seedLegacyModuleStorage(): void {
    const token = this.token;
    const user = this.usuario;
    const jwt = sessionStorage.getItem(STORAGE.jwt) || '';
    const nit = sessionStorage.getItem(STORAGE.nit) || '';
    const tipoDoc = sessionStorage.getItem(STORAGE.tipoDoc) || '';
    if (jwt) {
      sessionStorage.setItem('jwt', jwt);
      localStorage.setItem('jwt', jwt);
    }
    if (token) {
      sessionStorage.setItem('Auth-Token', token);
      localStorage.setItem('Auth-Token', token);
    }
    if (user) {
      sessionStorage.setItem('username', user);
      localStorage.setItem('username', user);
    }
    if (nit) {
      sessionStorage.setItem('nit', nit);
      sessionStorage.setItem('nroDocumento', nit);
    }
    if (tipoDoc) {
      sessionStorage.setItem('tipoDocumentoIdentificacion', tipoDoc);
    }
  }

  seedCookies(): void {
    const token = this.token;
    const user = this.usuario;
    if (!token) return;
    this.seedLegacyModuleStorage();
    const nit = sessionStorage.getItem(STORAGE.nit) || '';
    const tipoDoc = sessionStorage.getItem(STORAGE.tipoDoc) || '';
    // 8h: evita que las cookies del módulo caduquen a la 1h mientras el token SSO sigue vivo.
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
    for (const path of COOKIE_PATHS) {
      document.cookie = `token=${encodeURIComponent(token)}; path=${path}; expires=${expires}; SameSite=Lax`;
      if (user) {
        document.cookie = `username=${encodeURIComponent(user)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
      if (nit) {
        document.cookie = `nit=${encodeURIComponent(nit)}; path=${path}; expires=${expires}; SameSite=Lax`;
        // Alias que leen HelperFactory / Mis Datos / certificado OCE
        document.cookie = `nroDocumento=${encodeURIComponent(nit)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
      if (tipoDoc) {
        document.cookie = `tipoDocumentoIdentificacion=${encodeURIComponent(tipoDoc)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
    }
  }

  /** Cookies que el SSO pone antes de abrir oceCharter (tipoIngreso=2). */
  seedCharterEntryCookies(): void {
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
    const user = this.usuario || 'REG_CHARTER';
    for (const path of ['/', '/oce', '/oce/', '/oce/oceCharter', '/oce/oceCharter/']) {
      document.cookie = `tipoIngreso=2; path=${path}; expires=${expires}; SameSite=Lax`;
      document.cookie = `usuarioperfil=${encodeURIComponent('REG_CHARTER')}; path=${path}; expires=${expires}; SameSite=Lax`;
      document.cookie = `username=${encodeURIComponent(user)}; path=${path}; expires=${expires}; SameSite=Lax`;
    }
    this.seedCookies();
  }

  clearCookies(): void {
    const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    for (const path of COOKIE_PATHS) {
      document.cookie = `token=; path=${path}; expires=${past}; SameSite=Lax`;
      document.cookie = `username=; path=${path}; expires=${past}; SameSite=Lax`;
      document.cookie = `nit=; path=${path}; expires=${past}; SameSite=Lax`;
      document.cookie = `nroDocumento=; path=${path}; expires=${past}; SameSite=Lax`;
      document.cookie = `tipoDocumentoIdentificacion=; path=${path}; expires=${past}; SameSite=Lax`;
      document.cookie = `tipoIngreso=; path=${path}; expires=${past}; SameSite=Lax`;
    }
    sessionStorage.removeItem(STORAGE.nit);
    sessionStorage.removeItem(STORAGE.tipoDoc);
  }

  /**
   * Valida el token contra credentialPortal (fuente de verdad del SSO).
   * Si el backend invalidó la sesión (expiró / otro equipo / logout), falla.
   */
  validateOnce(): Observable<boolean> {
    const token = this.token;
    if (!token) return of(false);

    // Gate local No Habituales (captcha OK, sin token SSO de menú).
    if (
      token.startsWith('demo-') ||
      token.startsWith('nh-gate-') ||
      this.tipo === 'NO_HABITUAL'
    ) {
      return of(true);
    }

    return this.sso.credentialPortal(token).pipe(
      tap((session) => {
        if (session.usuario) sessionStorage.setItem(STORAGE.usuario, session.usuario);
        if (session.tipo) sessionStorage.setItem(STORAGE.tipo, session.tipo);
        this.seedCookies();
      }),
      map(() => true),
      catchError((err) => {
        const msg = this.extractMessage(err);
        if (this.isSessionDeadMessage(msg) || this.isHttpAuthFailure(err)) {
          const reason = this.classifyReason(msg, err);
          this.endSession(reason, this.messageFor(reason, msg));
          return of(false);
        }
        // Error de red / proxy: no expulsar de inmediato
        return of(true);
      })
    );
  }

  /** Watch periódico + al volver a la pestaña. */
  startWatch(): void {
    this.stopWatch();
    this.bindVisibility();
    this.watchSub = timer(8_000, WATCH_MS)
      .pipe(
        takeUntil(this.stop$),
        switchMap(() => this.validateOnce())
      )
      .subscribe();
  }

  stopWatch(): void {
    this.watchSub?.unsubscribe();
    this.watchSub = null;
    this.unbindVisibility();
  }

  /**
   * Cierre de sesión (usuario o forzado).
   * Intenta invalidar en SSO y limpia storage/cookies.
   */
  logout(reason: SessionEndReason = 'logout', message?: string): void {
    this.endSession(reason, message || this.messageFor(reason));
  }

  /** Portal legacy por ambiente (Charter temporal). */
  legacyPortalHomeUrl(): string {
    const configured = String(
      (environment as { legacyPortalHome?: string }).legacyPortalHome || ''
    ).trim();
    if (configured) return configured;
    const host = String(environment.hostIp || 'https://suma-dev.aduana.gob.bo').replace(
      /\/$/,
      ''
    );
    return `${host}/portal/index.html#/home`;
  }

  /**
   * Cierra sesión y sale a URL absoluta (p.ej. portal SUMA legacy tras Charter).
   * No navega a /login Angular.
   */
  logoutExternal(url: string, reason: SessionEndReason = 'logout'): void {
    if (this.ending) return;
    this.ending = true;
    this.stopWatch();
    const token = this.token;
    const dest = String(url || '').trim() || this.legacyPortalHomeUrl();
    const finish = () => {
      this.clearLocal();
      this.sessionEnded$.next({ reason, message: this.messageFor(reason) });
      window.location.href = dest;
      this.ending = false;
    };
    if (!token || environment.useMockAuth !== false) {
      finish();
      return;
    }
    this.invalidateRemote(token).pipe(finalize(finish)).subscribe();
  }

  private endSession(reason: SessionEndReason, message: string): void {
    if (this.ending) return;
    this.ending = true;
    this.stopWatch();

    const token = this.token;
    const finish = () => {
      this.clearLocal();
      this.sessionEnded$.next({ reason, message });
      const q =
        reason === 'logout'
          ? ''
          : `?razon=${encodeURIComponent(reason)}&msg=${encodeURIComponent(message)}`;
      void this.router.navigateByUrl('/login' + q);
      this.ending = false;
    };

    if (!token || environment.useMockAuth !== false) {
      finish();
      return;
    }

    this.invalidateRemote(token)
      .pipe(finalize(finish))
      .subscribe();
  }

  /** Best-effort: el SSO invalida el token (logout / otro equipo). */
  private invalidateRemote(token: string): Observable<unknown> {
    const t = encodeURIComponent(token);
    // Misma ruta que OCE Charter: GET autenticar/logout/{token}
    return this.http.get(`${environment.ssoApi}/autenticar/logout/${t}`).pipe(
      catchError(() =>
        this.http.post(`${environment.ssoApi}/logout/${t}`, {}).pipe(
          catchError(() =>
            this.http
              .get(`${environment.ssoApi}/cerrar-sesion/${t}`)
              .pipe(catchError(() => of(null)))
          )
        )
      )
    );
  }

  clearLocal(): void {
    this.clearCookies();
    sessionStorage.removeItem(STORAGE.token);
    sessionStorage.removeItem(STORAGE.usuario);
    sessionStorage.removeItem(STORAGE.tipo);
    sessionStorage.removeItem(STORAGE.jwt);
    // Claves legacy compartidas con FRVMR / módulos Angular
    for (const k of [
      'jwt',
      'Auth-Token',
      'username',
      'nit',
      'nroDocumento',
      'tipoDocumentoIdentificacion',
      'role',
      'usuarioNombres',
    ]) {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    }
  }

  isSessionDeadMessage(msg: string): boolean {
    return /expir|no autorizad|sesi[oó]n|inv[aá]lid|otro (equipo|dispositivo)|concurrente|cerrad|token.*(no|in)|no.*token|no.*vigente|revo[ck]/i.test(
      msg || ''
    );
  }

  private isHttpAuthFailure(err: any): boolean {
    const status = Number(err?.status || err?.error?.status || 0);
    return status === 401 || status === 403;
  }

  private classifyReason(msg: string, err?: any): SessionEndReason {
    if (/otro (equipo|dispositivo)|concurrente|nueva sesi/i.test(msg)) return 'remote';
    if (/expir|vigente|caduc/i.test(msg)) return 'expired';
    if (this.isHttpAuthFailure(err)) return 'http';
    return 'invalid';
  }

  messageFor(reason: SessionEndReason, detail = ''): string {
    switch (reason) {
      case 'expired':
        return 'Su sesión expiró. Vuelva a iniciar sesión.';
      case 'remote':
        return 'Su sesión se cerró porque el usuario ingresó en otro equipo.';
      case 'invalid':
      case 'http':
        return detail || 'La sesión ya no es válida. Vuelva a iniciar sesión.';
      case 'missing':
        return 'No hay sesión activa.';
      default:
        return 'Sesión finalizada.';
    }
  }

  private extractMessage(err: any): string {
    const body = err?.error;
    if (typeof body?.result === 'string') return body.result;
    if (typeof body?.message === 'string') return body.message;
    if (typeof err?.message === 'string') return err.message;
    return String(err || '');
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'visible' && this.isLoggedIn()) {
      this.validateOnce().subscribe();
    }
  };

  private bindVisibility(): void {
    if (this.visibilityBound) return;
    document.addEventListener('visibilitychange', this.onVisibility);
    this.visibilityBound = true;
  }

  private unbindVisibility(): void {
    if (!this.visibilityBound) return;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.visibilityBound = false;
  }
}
