import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export type UserKind = 'EXTERNO' | 'INTERNO';

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
  tipo: UserKind;
  /** Código que el usuario escribe (header Captcha-Code). */
  captcha?: string;
  /** Id de la imagen (header Captcha-Token). */
  captchaToken?: string;
  /** Solo mock local. */
  captchaExpected?: number;
  /** EXTERNO habitual del portal = OPE2 (captcha siempre). */
  operador?: string;
}

export interface LoginResult {
  token: string;
  url: string;
  jwt?: string;
  tipo: UserKind;
  usuario: string;
}

/** Nodo de menú tal como lo devuelve GET /credentialPortal/{token}. */
export interface SsoMenuNode {
  id: number;
  orden: number;
  titulo: string;
  descripcion: string;
  url: string;
  opciones: SsoMenuNode[];
}

export interface SsoPortalSession {
  token: string;
  usuario: string;
  nombre: string;
  tipo: string;
  roles: string[];
  menus: SsoMenuNode[];
}

/**
 * Emisión / canje del token SUMA (b-sso).
 *
 * Estrategia del portal nuevo (híbrido, como SIAN residual):
 * - Identidad y Bearer: Keycloak (an-core / keycloak-js).
 * - Token de sesión SUMA: se mantiene (listener, menús y APIs legacy).
 *
 * EXTERNO: usuario OCE corto.
 * INTERNO: usuario corto; backend resuelve @aduana.gob.bo.
 *
 * Mock local o POST {ssoApi}/autenticar-captcha/portal (o canje post-Keycloak).
 */
@Injectable({ providedIn: 'root' })
export class SsoAuthService {
  private readonly demo = {
    EXTERNO: { user: 'Tecnopor', pass: 'password' },
    INTERNO: { user: 'jyampassi', pass: 'password' },
  };

  constructor(private http: HttpClient) {}

  /** Usuario que se envía al API (interno sigue corto; dominio lo aplica backend). */
  normalizeUsername(raw: string, tipo: UserKind): string {
    const u = (raw || '').trim();
    if (tipo === 'INTERNO' && u.includes('@')) {
      return u.split('@')[0];
    }
    return u;
  }

  login(req: LoginRequest): Observable<LoginResult> {
    const usuario = this.normalizeUsername(req.nombreUsuario, req.tipo);

    if (environment.useMockAuth !== false) {
      return this.mockLogin(usuario, req);
    }

    const operador = req.operador || (req.tipo === 'EXTERNO' ? 'ip' : '');
    const headersObj: Record<string, string> = {
      'Content-Type': 'application/json',
      User: usuario,
    };
    if (req.captchaToken) {
      headersObj['Captcha-Token'] = req.captchaToken;
      headersObj['Captcha-Code'] = req.captcha || '';
    }
    const headers = new HttpHeaders(headersObj);
    const url =
      `${environment.ssoApi}/autenticar-captcha/portal` +
      (operador ? `?operador=${encodeURIComponent(operador)}` : '');

    return this.http
      .post<any>(url, { nombreUsuario: usuario, password: req.password, tipo: req.tipo }, { headers })
      .pipe(
        map((data) => {
          if (!data?.success || !data?.result?.token) {
            const msg =
              typeof data?.result === 'string'
                ? data.result
                : 'Credenciales inválidas';
            throw new Error(msg);
          }
          return {
            token: data.result.token,
            url: '/portal',
            jwt: data.result.jwt,
            tipo: req.tipo,
            usuario,
          } as LoginResult;
        })
      );
  }

  /**
   * Un solo login: el usuario no elige tipo ni portal.
   * 1. EXTERNO perfil ip (Portal de Gestión Aduanera).
   * 2. Si el SSO pide el Registro de Operadores, reintenta EXTERNO OPE2.
   * 3. Si la clave no es de operador, reintenta INTERNO (GNS).
   * El captcha no se invalida al validar, así que el mismo código sirve para los intentos.
   */
  loginAuto(
    nombreUsuario: string,
    password: string,
    captcha?: string,
    captchaToken?: string
  ): Observable<LoginResult> {
    const attempt = (tipo: UserKind, operador: string) =>
      this.login({
        nombreUsuario,
        password,
        tipo,
        captcha,
        captchaToken,
        operador,
      });

    return attempt('EXTERNO', 'ip').pipe(
      catchError((err) => {
        const msg = String(err?.message || '');
        if (/verificación|captcha/i.test(msg)) {
          return throwError(() => err);
        }
        if (/registro de operadores/i.test(msg)) {
          return attempt('EXTERNO', 'OPE2');
        }
        return attempt('INTERNO', '');
      })
    );
  }

  /**
   * Menú del portal, el mismo que usa el SSO:
   * roles de la sesión → menus de modulo_role_menu → opciones con URL %ip.
   */
  credentialPortal(token: string): Observable<SsoPortalSession> {
    return this.http
      .get<any>(`${environment.ssoApi}/credentialPortal/${encodeURIComponent(token)}`)
      .pipe(
        map((data) => {
          if (!data?.success || !data?.result?.usuario) {
            const msg =
              typeof data?.result === 'string' ? data.result : 'No se pudo cargar el menú';
            throw new Error(msg);
          }
          const u = data.result.usuario;
          const nombre = [u.nombre, u.paterno, u.materno].filter(Boolean).join(' ').trim();
          return {
            token: String(data.result.token || token),
            usuario: String(u.nombreUsuario || ''),
            nombre,
            tipo: String(u.tipo || ''),
            roles: (Array.isArray(u.roles) ? u.roles : [])
              .map((r: { nombreRole?: string }) => r?.nombreRole)
              .filter((r: string | undefined): r is string => !!r),
            menus: (Array.isArray(u.menus) ? u.menus : []).map((m: unknown) => this.normalizeMenu(m)),
          };
        })
      );
  }

  /**
   * El SSO deja %ip + ruta del módulo + opción + código + token + rol.
   * Igual que OCE/portal: en local hostIp vacío → mismo origen vía proxy.
   */
  resolveMenuUrl(raw: string): string {
    const host = String((environment as { hostIp?: string }).hostIp ?? '').replace(/\/$/, '');
    let url = String(raw || '').replace(/%ip/gi, host).trim();
    if (!url || url === 'null') return '';
    if (/^https?:\/\//i.test(url)) {
      // En local preferimos path relativo para pasar por el proxy.
      if (!host) {
        try {
          const u = new URL(url);
          url = u.pathname + u.search + u.hash;
        } catch {
          /* keep absolute */
        }
      }
    } else if (!url.startsWith('/')) {
      url = '/' + url;
    }
    url = this.fixLegacyModulePath(url);
    return host && !url.startsWith('http') ? host + url : url;
  }

  /**
   * Rutas que en suma-dev ya no existen o movieron de módulo.
   * Ver certificado OCE: menú sigue apuntando a /oce/presencial (403);
   * la pantalla activa está en /oce/administracion.
   */
  private fixLegacyModulePath(url: string): string {
    let fixed = url.replace(/\/oce\/presencial(?=\/|#|\?|$)/gi, '/oce/administracion');
    // Firma Digital: menú /pki → front desplegado /oce/certificado
    fixed = fixed.replace(/\/pki(?=\/|#|\?|$)/gi, '/oce/certificado');
    // Alias de rutas del menú pki_solicitud → rutas reales de oce/certificado
    fixed = fixed.replace(
      /#\/listener\/solicitudExterno(\/|$)/i,
      '#/listener/solicitudCertificado$1'
    );
    if (/#\/listener\/verCertificado(_OP)?(\/|$)/i.test(fixed)) {
      fixed = fixed.replace(/\/oce\/[^/#?]+/i, '/oce/administracion');
    }
    return fixed;
  }

  private normalizeMenu(raw: any): SsoMenuNode {
    const opciones = Array.isArray(raw?.opciones) ? raw.opciones.map((o: unknown) => this.normalizeMenu(o)) : [];
    opciones.sort((a: SsoMenuNode, b: SsoMenuNode) => a.orden - b.orden);
    return {
      id: Number(raw?.id || 0),
      orden: Number(raw?.orden || 0),
      titulo: String(raw?.titulo || raw?.descripcion || 'Menú'),
      descripcion: String(raw?.descripcion || ''),
      url: raw?.url ? String(raw.url) : '',
      opciones,
    };
  }

  /** Imagen del captcha SSO: GET {ssoApi}/captcha-login/{token} */
  captchaImageUrl(token: string): string {
    return `${environment.ssoApi}/captcha-login/${token}?trash=${Math.random()}`;
  }

  /**
   * true si el SSO exige captcha.
   * OPE2/OPE3/OPE8 lo exigen siempre (mismo criterio que indexLogin).
   */
  captchaRequired(nombreUsuario: string, tipo: UserKind, operador?: string): Observable<boolean> {
    const op = (operador || '').toUpperCase();
    if (op === 'OPE2' || op === 'OPE3' || op === 'OPE8') {
      return of(true);
    }
    return this.http
      .post<any>(`${environment.ssoApi}/login-security/captcha-required`, {
        nombreUsuario,
        tipo,
        operador: operador || '',
      })
      .pipe(
        map((data) => !(data?.success === true && data?.result === false))
      );
  }

  private mockLogin(usuario: string, req: LoginRequest): Observable<LoginResult> {
    const expected = this.demo[req.tipo];
    if (req.tipo === 'INTERNO') {
      const okCaptcha =
        req.captchaExpected == null ||
        String(req.captcha).trim() === String(req.captchaExpected);
      if (!okCaptcha) {
        return throwError(() => new Error('Captcha incorrecto'));
      }
    }
    const ok =
      usuario.toLowerCase() === expected.user.toLowerCase() &&
      req.password === expected.pass;
    if (!ok) {
      return throwError(
        () =>
          new Error(
            req.tipo === 'INTERNO'
              ? 'Usuario o contraseña interno inválidos'
              : 'Usuario o contraseña externo inválidos'
          )
      );
    }
    return of({
      token: 'demo-' + req.tipo.toLowerCase() + '-' + Date.now(),
      url: '/portal',
      tipo: req.tipo,
      usuario,
    }).pipe(delay(400));
  }
}
