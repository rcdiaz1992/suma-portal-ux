import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SsoAuthService } from '../../services/sso-auth.service';
import { SumaSessionService } from '../../services/suma-session.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  readonly useMock = environment.useMockAuth !== false;
  loading = false;
  error = '';
  sessionNotice = '';
  captchaToken = '';
  captchaSrc = '';
  /** Solo visible si el SSO lo exige (INTERNO / OPE2|3|8 / política captcha-required). */
  showCaptcha = false;

  form = this.fb.group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required],
    captcha: [''],
    remember: [false],
  });

  constructor(
    private fb: FormBuilder,
    private sso: SsoAuthService,
    private session: SumaSessionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const msg = this.route.snapshot.queryParamMap.get('msg');
    const razon = this.route.snapshot.queryParamMap.get('razon');
    if (msg) this.sessionNotice = msg;
    else if (razon === 'expired') this.sessionNotice = this.session.messageFor('expired');
    else if (razon === 'remote') this.sessionNotice = this.session.messageFor('remote');
    else if (razon === 'invalid' || razon === 'http')
      this.sessionNotice = this.session.messageFor('invalid');

    if (this.session.isLoggedIn() && !razon) {
      void this.router.navigateByUrl('/portal');
      return;
    }
  }

  /** Al salir del usuario: EXTERNO/ip (importador) vs INTERNO (técnico). */
  onUserBlur(): void {
    if (this.useMock) return;
    const user = (this.form.controls.nombreUsuario.value || '').trim();
    if (!user) {
      this.setCaptchaVisible(false);
      return;
    }
    forkJoin({
      externo: this.sso
        .captchaRequired(user, 'EXTERNO', 'ip')
        .pipe(catchError(() => of(false))),
      interno: this.sso
        .captchaRequired(user, 'INTERNO', '')
        .pipe(catchError(() => of(false))),
    }).subscribe(({ externo, interno }) => {
      this.setCaptchaVisible(!!externo || !!interno);
    });
  }

  refreshCaptcha(): void {
    this.captchaToken = String(Math.floor(Math.random() * 123456789));
    this.captchaSrc = this.sso.captchaImageUrl(this.captchaToken);
    this.form.controls.captcha.setValue('');
  }

  submit(): void {
    this.error = '';
    if (this.showCaptcha && !this.useMock) {
      this.form.controls.captcha.setValidators([Validators.required]);
      this.form.controls.captcha.updateValueAndValidity();
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const v = this.form.getRawValue();
    this.sso
      .loginAuto(
        v.nombreUsuario || '',
        v.password || '',
        this.showCaptcha ? v.captcha || undefined : undefined,
        this.showCaptcha && !this.useMock ? this.captchaToken : undefined
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.session.establish(res);
          this.router.navigateByUrl('/portal');
        },
        error: (err) => {
          this.loading = false;
          const body = err?.error;
          this.error =
            (typeof body?.result === 'string' && body.result) ||
            err?.message ||
            'No se pudo autenticar';
          if (!this.useMock && /verificaci[oó]n|captcha/i.test(this.error)) {
            this.setCaptchaVisible(true);
          } else if (this.showCaptcha && !this.useMock) {
            this.refreshCaptcha();
          }
        },
      });
  }

  private setCaptchaVisible(visible: boolean): void {
    const was = this.showCaptcha;
    this.showCaptcha = visible;
    if (visible) {
      this.form.controls.captcha.setValidators([Validators.required]);
      if (!was || !this.captchaSrc) this.refreshCaptcha();
    } else {
      this.form.controls.captcha.clearValidators();
      this.form.controls.captcha.setValue('');
      this.captchaToken = '';
      this.captchaSrc = '';
    }
    this.form.controls.captcha.updateValueAndValidity();
  }
}
