import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SsoAuthService } from '../../services/sso-auth.service';
import { SumaSessionService } from '../../services/suma-session.service';

type CanalOpe = 'OPE2' | 'OPE3' | 'OPE8' | '';

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
  showPass = false;
  /**
   * Canal SSO (como indexOce):
   * OPE2 Habituales · OPE3 Otros · OPE8 ORF → captcha siempre.
   * vacío = Portal Gestión (ip) / interno.
   */
  canal: CanalOpe = '';
  showCaptcha = false;

  form = this.fb.group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required],
    captcha: [''],
  });

  constructor(
    private fb: FormBuilder,
    private sso: SsoAuthService,
    private session: SumaSessionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  get subtitle(): string {
    if (this.canal === 'OPE2') return 'Habituales · usuario, clave y verificación';
    if (this.canal === 'OPE3') return 'Otros operadores · usuario, clave y verificación';
    if (this.canal === 'OPE8') return 'Organizador ferial · usuario, clave y verificación';
    return 'Portal SUMA · operadores y técnicos';
  }

  /** Solo visible si entró por hub 1·3·4 (como indexLogin con OPE*, no Portal Gestión ip). */
  get showRegistrar(): boolean {
    return this.canal === 'OPE2' || this.canal === 'OPE3' || this.canal === 'OPE8';
  }

  get registroLink(): string {
    if (this.canal === 'OPE3') return '/login/registro/otros';
    if (this.canal === 'OPE8') return '/login/registro/orf';
    return '/login/registro/habituales';
  }

  ngOnInit(): void {
    const canalRaw = (this.route.snapshot.queryParamMap.get('canal') || '').toUpperCase();
    if (canalRaw === 'OPE2' || canalRaw === 'OPE3' || canalRaw === 'OPE8') {
      this.canal = canalRaw;
      this.setCaptchaVisible(true);
    }

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

  /**
   * Criterio SSO:
   * - OPE2/3/8: captcha siempre (como indexLogin).
   * - Portal Gestión (ip) / INTERNO: según captcha-required.
   */
  onUserBlur(): void {
    if (this.useMock) return;
    if (this.canal === 'OPE2' || this.canal === 'OPE3' || this.canal === 'OPE8') {
      this.setCaptchaVisible(true);
      return;
    }
    const user = (this.form.controls.nombreUsuario.value || '').trim();
    if (!user) {
      this.setCaptchaVisible(false);
      return;
    }
    forkJoin({
      externo: this.sso
        .captchaRequired(user, 'EXTERNO', 'ip')
        .pipe(catchError(() => of(null as boolean | null))),
      interno: this.sso
        .captchaRequired(user, 'INTERNO', '')
        .pipe(catchError(() => of(null as boolean | null))),
    }).subscribe(({ externo, interno }) => {
      if (externo === false) {
        this.setCaptchaVisible(false);
        return;
      }
      if (interno === false) {
        this.setCaptchaVisible(false);
        return;
      }
      this.setCaptchaVisible(true);
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
    const captcha = this.showCaptcha ? v.captcha || undefined : undefined;
    const captchaToken = this.showCaptcha && !this.useMock ? this.captchaToken : undefined;

    // Canal Habituales/Otros/ORF: autenticar con ese operador (como SSO).
    if (this.canal === 'OPE2' || this.canal === 'OPE3' || this.canal === 'OPE8') {
      this.sso
        .login({
          nombreUsuario: v.nombreUsuario || '',
          password: v.password || '',
          tipo: 'EXTERNO',
          captcha,
          captchaToken,
          operador: this.canal,
        })
        .subscribe({
          next: (res) => this.onLoginOk(res),
          error: (err) => this.onLoginErr(err),
        });
      return;
    }

    this.sso.loginAuto(v.nombreUsuario || '', v.password || '', captcha, captchaToken).subscribe({
      next: (res) => this.onLoginOk(res),
      error: (err) => this.onLoginErr(err),
    });
  }

  private onLoginOk(res: { token: string; url: string; jwt?: string; tipo: 'EXTERNO' | 'INTERNO'; usuario: string }): void {
    this.loading = false;
    this.session.establish(res);
    void this.router.navigateByUrl('/portal');
  }

  private onLoginErr(err: any): void {
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
