import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SsoAuthService } from '../../services/sso-auth.service';
import { SumaSessionService } from '../../services/suma-session.service';

/**
 * Charter: captcha → REG_CHARTER → redirect absoluto a oceCharter del ambiente.
 * No deja sesión Angular abierta (el token viaja en la URL).
 */
@Component({
  selector: 'app-login-charter-page',
  templateUrl: './login-charter.page.html',
  styleUrls: ['./login-charter.page.scss'],
})
export class LoginCharterPage implements OnInit {
  loading = false;
  error = '';
  captchaToken = '';
  captchaSrc = '';

  form = this.fb.group({
    captcha: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private sso: SsoAuthService,
    private session: SumaSessionService
  ) {}

  ngOnInit(): void {
    this.refreshCaptcha();
  }

  refreshCaptcha(): void {
    this.captchaToken = String(Math.floor(Math.random() * 123456789));
    this.captchaSrc = this.sso.captchaImageUrl(this.captchaToken);
    this.form.controls.captcha.setValue('');
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const code = String(this.form.value.captcha || '').trim();
    this.sso.validateCaptcha(this.captchaToken, code).subscribe({
      next: (ok) => {
        if (!ok) {
          this.loading = false;
          this.error = 'Código de verificación incorrecto';
          this.refreshCaptcha();
          return;
        }
        this.sso.loginCharter().subscribe({
          next: (res) => {
            this.loading = false;
            // No persistir REG_CHARTER en el shell Angular (quedaba sesión abierta).
            this.session.clearLocal();
            window.location.href = this.charterAbsoluteUrl(res);
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.message || 'No se pudo ingresar a Charter';
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
  }

  /** URL absoluta oceCharter en el host del ambiente (local → suma-dev). */
  private charterAbsoluteUrl(res: { url: string; token: string }): string {
    const host = this.sso.ssoHost();
    let base = String(res.url || '').trim();
    if (base) {
      if (/^https?:\/\//i.test(base)) {
        return `${base.replace(/\/$/, '')}/${res.token}`;
      }
      base = base.replace(/\/$/, '');
      if (!base.startsWith('/')) base = `/${base}`;
      return `${host}${base}/${res.token}`;
    }
    return `${host}/oce/oceCharter/${res.token}`;
  }
}
