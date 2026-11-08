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
} as const;

const COOKIE_PATHS = ['/', '/sso', '/sso/', '/oce', '/oce/', '/portal', '/portal/', '/b-sso', '/b-sso/'];

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

  seedCookies(): void {
    const token = this.token;
    const user = this.usuario;
    if (!token) return;
    const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString();
    for (const path of COOKIE_PATHS) {
      document.cookie = `token=${encodeURIComponent(token)}; path=${path}; expires=${expires}; SameSite=Lax`;
      if (user) {
        document.cookie = `username=${encodeURIComponent(user)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
    }
  }

  clearCookies(): void {
    const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
    for (const path of COOKIE_PATHS) {
      document.cookie = `token=; path=${path}; expires=${past}; SameSite=Lax`;
      document.cookie = `username=; path=${path}; expires=${past}; SameSite=Lax`;
    }
  }

  /**
   * Valida el token contra credentialPortal (fuente de verdad del SSO).
   * Si el backend invalidó la sesión (expiró / otro equipo / logout), falla.
   */
  validateOnce(): Observable<boolean> {
    const token = this.token;
    if (!token) return of(false);

    if (environment.useMockAuth !== false && token.startsWith('demo-')) {
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
    const url = `${environment.ssoApi}/logout/${encodeURIComponent(token)}`;
    return this.http.post(url, {}).pipe(
      catchError(() =>
        this.http.get(`${environment.ssoApi}/cerrar-sesion/${encodeURIComponent(token)}`).pipe(
          catchError(() => of(null))
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
