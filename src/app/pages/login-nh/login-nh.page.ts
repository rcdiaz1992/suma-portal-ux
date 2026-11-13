import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SsoAuthService } from '../../services/sso-auth.service';

/**
 * Registro · No Habituales (indexOce): captcha → usuario/login/NP.
 */
@Component({
  selector: 'app-login-nh-page',
  templateUrl: './login-nh.page.html',
  styleUrls: ['./login-nh.page.scss'],
})
export class LoginNhPage implements OnInit {
  loading = false;
  error = '';
  captchaToken = '';
  captchaSrc = '';

  form = this.fb.group({
    captcha: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private sso: SsoAuthService
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
        this.sso.loginByCodigo('NP').subscribe({
          next: (res) => {
            this.loading = false;
            document.cookie = 'tipoIngreso=2; path=/oce/oceImpExpNp/; SameSite=Lax';
            document.cookie = 'tipoIngreso=2; path=/oce/oceImpExpNp; SameSite=Lax';
            window.location.href = this.sso.absoluteModuleUrl(res, '/oce/oceImpExpNp');
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.message || 'No se pudo ingresar (NP)';
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
}
