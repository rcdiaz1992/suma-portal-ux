import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SumaSessionService } from '../services/suma-session.service';

@Injectable({ providedIn: 'root' })
export class SumaAuthGuard implements CanActivate {
  constructor(private session: SumaSessionService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | boolean | UrlTree {
    if (!this.session.isLoggedIn()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { razon: 'missing', msg: 'Debe iniciar sesión.' },
      });
    }
    return this.session.validateOnce().pipe(
      map((ok) =>
        ok
          ? true
          : this.router.createUrlTree(['/login'], {
              queryParams: {
                razon: 'invalid',
                msg: 'La sesión ya no es válida.',
              },
            })
      ),
      catchError(() => of(true))
    );
  }
}
