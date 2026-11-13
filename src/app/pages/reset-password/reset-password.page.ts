import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SsoAuthService } from '../../services/sso-auth.service';

/** Nueva contraseña desde el enlace del correo · APIs b-sso existentes. */
@Component({
  selector: 'app-reset-password-page',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  user = '';
  passwordToken = '';
  codigo = 'portal';
  loading = false;
  checking = true;
  tokenOk = false;
  error = '';
  successMsg = '';

  /** Mismo formato que ResetPasswordController SSO. */
  private readonly passPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[*,.%&()=\- $])[A-Za-z\d*,.%&()=\- $]{10,20}$/;

  form = this.fb.group(
    {
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(20),
          Validators.pattern(this.passPattern),
        ],
      ],
      password2: ['', Validators.required],
    },
    { validators: (g) => (g.value.password === g.value.password2 ? null : { mismatch: true }) }
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private sso: SsoAuthService
  ) {}

  ngOnInit(): void {
    this.user = this.route.snapshot.paramMap.get('user') || '';
    this.passwordToken = this.route.snapshot.paramMap.get('passwordToken') || '';
    this.codigo = this.route.snapshot.paramMap.get('codigo') || 'portal';

    if (!this.user || !this.passwordToken) {
      this.checking = false;
      this.tokenOk = false;
      this.error = 'Enlace incompleto. Solicite de nuevo el restablecimiento de contraseña.';
      return;
    }

    this.sso.verifyPasswordToken(this.user, this.passwordToken).subscribe({
      next: (ok) => {
        this.checking = false;
        this.tokenOk = ok;
        if (!ok) {
          this.error =
            'Este enlace ya no se puede utilizar. Probablemente solicitó otro restablecimiento; use el vínculo más reciente.';
        }
      },
      error: () => {
        this.checking = false;
        this.tokenOk = false;
        this.error = 'No se pudo validar el enlace.';
      },
    });
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('mismatch')) {
        this.error = 'La contraseña y su confirmación son diferentes.';
      } else if (this.form.controls.password.hasError('pattern')) {
        this.error =
          'La contraseña debe tener 10–20 caracteres, mayúscula, minúscula, número y un carácter especial (*,.%&()=- $).';
      }
      return;
    }
    this.loading = true;
    const password = String(this.form.value.password || '');
    this.sso.resetPasswordWithToken(this.user, this.passwordToken, this.codigo, password).subscribe({
      next: (msg) => {
        this.loading = false;
        this.successMsg = this.stripHtml(msg) || 'Su contraseña ha sido cambiada exitosamente.';
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || 'No se pudo cambiar la contraseña.';
      },
    });
  }

  private stripHtml(html: string): string {
    return String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
