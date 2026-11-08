import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

type MfaMethod = 'qr' | 'email' | 'whatsapp';

@Component({
  selector: 'app-login-mfa-page',
  templateUrl: './login-mfa.page.html',
  styleUrls: ['./login-mfa.page.scss'],
})
export class LoginMfaPage {
  readonly demoOtp = '123456';
  method: MfaMethod = 'qr';
  error = '';
  loading = false;

  form = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  constructor(private fb: FormBuilder, private router: Router) {}

  pick(method: MfaMethod): void {
    this.method = method;
    this.error = '';
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const code = String(this.form.value.code || '').trim();
    if (code !== this.demoOtp) {
      this.error = 'Código inválido. Demo: 123456';
      return;
    }
    this.loading = true;
    sessionStorage.setItem('suma.tipoUser', 'NO_HABITUAL');
    sessionStorage.setItem('suma.usuario', 'no-habitual');
    sessionStorage.setItem('suma.token', 'demo-mfa-' + Date.now());
    setTimeout(() => {
      this.loading = false;
      this.router.navigateByUrl('/hub/no-habituales');
    }, 350);
  }
}
