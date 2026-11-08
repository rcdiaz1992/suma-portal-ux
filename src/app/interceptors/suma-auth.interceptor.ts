import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SumaSessionService } from '../services/suma-session.service';

/**
 * Si el SSO responde 401/403 o mensaje de sesión muerta, cierra la sesión local.
 */
@Injectable()
export class SumaAuthInterceptor implements HttpInterceptor {
  constructor(private session: SumaSessionService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && this.session.isLoggedIn()) {
          const msg =
            (typeof err.error?.result === 'string' && err.error.result) ||
            err.message ||
            '';
          const authFail = err.status === 401 || err.status === 403;
          if (authFail || this.session.isSessionDeadMessage(msg)) {
            const reason = /otro (equipo|dispositivo)|concurrente/i.test(msg)
              ? 'remote'
              : /expir|caduc|vigente/i.test(msg)
                ? 'expired'
                : 'http';
            this.session.logout(reason, this.session.messageFor(reason, msg));
          }
        }
        return throwError(() => err);
      })
    );
  }
}
