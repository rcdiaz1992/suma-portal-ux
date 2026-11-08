import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { SsoAuthService } from '../../services/sso-auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  readonly useMock = environment.useMockAuth !== false;
  loading = false;
  error = '';
  captchaToken = '';
  captchaSrc = '';

  form = this.fb.group({
    nombreUsuario: ['', Validators.required],
    password: ['', Validators.required],
    captcha: [''],
    remember: [false],
  });

  constructor(
    private fb: FormBuilder,
    private sso: SsoAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.useMock) {
      this.form.controls.captcha.setValidators([Validators.required]);
      this.refreshCaptcha();
    }
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
    const v = this.form.getRawValue();
    this.sso
      .loginAuto(
        v.nombreUsuario || '',
        v.password || '',
        v.captcha || undefined,
        this.useMock ? undefined : this.captchaToken
      )
      .subscribe({
        next: (res) => {
          this.loading = false;
          sessionStorage.setItem('suma.tipoUser', res.tipo);
          sessionStorage.setItem('suma.token', res.token);
          sessionStorage.setItem('suma.usuario', res.usuario);
          this.router.navigateByUrl('/portal');
        },
        error: (err) => {
          this.loading = false;
          const body = err?.error;
          this.error =
            (typeof body?.result === 'string' && body.result) ||
            err?.message ||
            'No se pudo autenticar';
          if (!this.useMock) this.refreshCaptcha();
        },
      });
  }
}
