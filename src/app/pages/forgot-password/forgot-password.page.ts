import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { SsoAuthService } from '../../services/sso-auth.service';

/** Recuperación de clave · pantalla completa · API b-sso (sin indexLogin). */
@Component({
  selector: 'app-forgot-password-page',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {
  loading = false;
  error = '';
  successMsg = '';
  captchaToken = '';
  captchaSrc = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nombreUsuario: [
      '',
      [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9]+$/)],
    ],
    captcha: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]],
  });

  constructor(private fb: FormBuilder, private sso: SsoAuthService) {}

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
    this.successMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const v = this.form.getRawValue();
    this.sso.validateCaptcha(this.captchaToken, String(v.captcha || '').trim()).subscribe({
      next: (ok) => {
        if (!ok) {
          this.loading = false;
          this.error = 'Código de verificación incorrecto';
          this.refreshCaptcha();
          return;
        }
        this.sso
          .changePasswordRequest({
            email: String(v.email || '').trim(),
            nombreUsuario: String(v.nombreUsuario || '').trim(),
          })
          .subscribe({
            next: (msg) => {
              this.loading = false;
              this.successMsg =
                msg ||
                'Se envió la solicitud. Revise su correo electrónico para continuar.';
            },
            error: (err) => {
              this.loading = false;
              this.error = err?.message || 'No se pudo procesar la solicitud';
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
