import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SsoAuthService } from '../../services/sso-auth.service';

type OpeKind = 'habituales' | 'otros' | 'orf';

interface OpeCopy {
  kind: OpeKind;
  operador: 'OPE2' | 'OPE3' | 'OPE8';
  badge: string;
  title: string;
  sub: string;
}

const COPY: Record<OpeKind, OpeCopy> = {
  habituales: {
    kind: 'habituales',
    operador: 'OPE2',
    badge: '01',
    title: 'Registro · Habituales',
    sub: 'Importadores / exportadores · empresas y entidades',
  },
  otros: {
    kind: 'otros',
    operador: 'OPE3',
    badge: '03',
    title: 'Registro · Otros operadores',
    sub: 'ADA, transporte, courier, zonas francas y afines',
  },
  orf: {
    kind: 'orf',
    operador: 'OPE8',
    badge: '04',
    title: 'Registro · Organizador ferial',
    sub: 'Usuario ORF sin ser OCE habilitado',
  },
};

/** Alta de usuario 100% en este portal (API b-sso, sin indexLogin). */
@Component({
  selector: 'app-registro-ope-page',
  templateUrl: './registro-ope.page.html',
  styleUrls: ['./registro-ope.page.scss'],
})
export class RegistroOpePage implements OnInit {
  copy: OpeCopy = COPY.habituales;
  loading = false;
  error = '';
  success = false;
  captchaToken = '';
  captchaSrc = '';

  form = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      paterno: ['', [Validators.required, Validators.minLength(2)]],
      materno: [''],
      email: ['', [Validators.required, Validators.email]],
      telefonoCelular: ['', [Validators.required, Validators.pattern(/^(6|7)\d{7,10}$/)]],
      nombreUsuario: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', Validators.required],
      captcha: ['', Validators.required],
    },
    { validators: (g) => (g.value.password === g.value.password2 ? null : { mismatch: true }) }
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private sso: SsoAuthService
  ) {}

  /** Vuelve al login del mismo canal (OPE2 / OPE3 / OPE8). */
  get loginBackQuery(): { canal: string } {
    return { canal: this.copy.operador };
  }

  ngOnInit(): void {
    const kind = (this.route.snapshot.data['ope'] || 'habituales') as OpeKind;
    this.copy = COPY[kind] || COPY.habituales;
    this.refreshCaptcha();
  }

  refreshCaptcha(): void {
    this.captchaToken = String(Math.floor(Math.random() * 123456789));
    this.captchaSrc = this.sso.captchaImageUrl(this.captchaToken);
    this.form.controls.captcha.setValue('');
  }

  resetForm(): void {
    this.error = '';
    this.form.reset({
      nombre: '',
      paterno: '',
      materno: '',
      email: '',
      telefonoCelular: '',
      nombreUsuario: '',
      password: '',
      password2: '',
      captcha: '',
    });
    this.refreshCaptcha();
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.hasError('mismatch')) {
        this.error = 'Las contraseñas no coinciden';
      }
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
          .registerUsuario(this.copy.operador, {
            nombre: String(v.nombre || '').trim(),
            paterno: String(v.paterno || '').trim(),
            materno: String(v.materno || '').trim(),
            email: String(v.email || '').trim(),
            telefonoCelular: String(v.telefonoCelular || '').trim(),
            nombreUsuario: String(v.nombreUsuario || '').trim(),
            password: String(v.password || ''),
            password2: String(v.password2 || ''),
          })
          .subscribe({
            next: () => {
              this.loading = false;
              this.success = true;
            },
            error: (err) => {
              this.loading = false;
              this.error = err?.message || 'No se pudo registrar el usuario';
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
