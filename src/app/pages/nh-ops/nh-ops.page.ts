import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SsoAuthService } from '../../services/sso-auth.service';
import { SumaSessionService } from '../../services/suma-session.service';
import { ThemeService } from '../../services/theme.service';

type NhTab = 'import' | 'export';

const DOC_TIPOS = ['CI', 'NIT', 'CEX', 'PAS'] as const;

@Component({
  selector: 'app-nh-ops',
  templateUrl: './nh-ops.page.html',
  styleUrls: ['./nh-ops.page.scss'],
})
export class NhOpsPage implements OnInit {
  tab: NhTab = 'import';
  toast = '';
  error = '';
  loading = false;
  readonly docTipos = DOC_TIPOS;

  /** Modelos por operación (import). */
  imp = {
    dims: { tipoDoc: 'CI', documento: '', tipoAduana: '', aduana: '' },
    oca: { tipoDoc: 'NIT', documento: '' },
    print: { tipoDoc: '', nroDoc: '', nroId: '', tipoId: 'CI' },
    mmc: { tipoDoc: 'NIT', documento: '' },
    charter: { tipoDoc: 'NIT', documento: '' },
    valija: { tipoDoc: 'CI', documento: '' },
    socorro: { captcha: '', captchaToken: '', captchaSrc: '' },
    dav: { tipoDoc: 'CI', documento: '' },
  };

  exp = {
    nh: { tipoDoc: 'CI', documento: '' },
    oca: { tipoDoc: 'NIT', documento: '' },
    print: { tipoDoc: '', nroDoc: '', nroId: '', tipoId: 'CI' },
    mmc: { tipoDoc: 'NIT', documento: '' },
    charter: { tipoDoc: 'NIT', documento: '' },
    valija: { tipoDoc: 'CI', documento: '' },
    socorro: { captcha: '', captchaToken: '', captchaSrc: '' },
    dav: { tipoDoc: 'CI', documento: '' },
  };

  constructor(
    private router: Router,
    private session: SumaSessionService,
    private themeSvc: ThemeService,
    private sso: SsoAuthService
  ) {}

  get theme() {
    return this.themeSvc.theme;
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
  }

  ngOnInit(): void {
    if (this.session.tipo !== 'NO_HABITUAL') {
      void this.router.navigateByUrl('/login/no-habituales');
      return;
    }
    this.refreshSocorroCaptcha('import');
    this.refreshSocorroCaptcha('export');
  }

  setTab(tab: NhTab): void {
    this.tab = tab;
    this.error = '';
    this.toast = '';
  }

  refreshSocorroCaptcha(side: 'import' | 'export'): void {
    const token = String(Math.floor(Math.random() * 123456789));
    const src = this.sso.captchaImageUrl(token);
    if (side === 'import') {
      this.imp.socorro.captchaToken = token;
      this.imp.socorro.captchaSrc = src;
      this.imp.socorro.captcha = '';
    } else {
      this.exp.socorro.captchaToken = token;
      this.exp.socorro.captchaSrc = src;
      this.exp.socorro.captcha = '';
    }
  }

  back(): void {
    void this.router.navigateByUrl('/hub/no-habituales');
  }

  logout(): void {
    this.session.logout('logout');
  }

  /** Notificación electrónica → registro OPE7 en SSO. */
  goNotificacion(): void {
    const url = `${this.sso.ssoHost()}/sso/indexLogin.html#/registroUsuarioNotificacion`;
    window.location.href = url;
  }

  private seedNhDoc(cod: string, doc?: string, tipoDoc?: string): void {
    const nro = String(doc || '').trim();
    const tip = String(tipoDoc || '').trim();
    if (!nro) return;
    const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toUTCString();
    for (const path of ['/', '/oce', '/oce/', '/oce/oceImpExpNp', '/oce/oceImpExpNp/', '/salida', '/salida/']) {
      document.cookie = `NitExt=${encodeURIComponent(nro)}; path=${path}; expires=${expires}; SameSite=Lax`;
      if (tip) {
        document.cookie = `TipExt=${encodeURIComponent(tip)}; path=${path}; expires=${expires}; SameSite=Lax`;
        document.cookie = `tipoDoc2=${encodeURIComponent(tip)}; path=${path}; expires=${expires}; SameSite=Lax`;
      }
    }
    sessionStorage.setItem('nroDocumento', nro);
    if (tip) sessionStorage.setItem('tipoDocumentoIdentificacion', tip);
    if (cod === 'OCA' || cod === 'CHARTER') {
      localStorage.setItem(cod === 'CHARTER' ? 'chaNit' : 'ocaNit', nro);
      if (tip) {
        localStorage.setItem(
          cod === 'CHARTER' ? 'chaTipoDocumentoIdentificacion' : 'ocaTipoDocumentoIdentificacion',
          tip
        );
      }
    }
    if (cod === 'MMC') {
      sessionStorage.setItem('agmNit', nro);
      if (tip) sessionStorage.setItem('agmTipoDocumentoIdentificacion', tip);
      sessionStorage.setItem('agmRol', 'AGE_MAR');
    }
    if (cod === 'VALIJA') {
      sessionStorage.setItem('vdNit', nro);
      if (tip) sessionStorage.setItem('vdTipoDocumentoIdentificacion', tip);
    }
    if (cod === 'DAV') {
      sessionStorage.setItem('davNit', nro);
      if (tip) sessionStorage.setItem('davTipoDocumentoIdentificacion', tip);
    }
    if (cod === 'DIMS') {
      localStorage.setItem('DimNitExtU', nro);
      if (tip) localStorage.setItem('DimTipExtU', tip);
    }
  }

  enterCodigo(
    cod: string,
    fallbackPath: string,
    opts?: { requireDoc?: boolean; doc?: string; tipoDoc?: string; label?: string }
  ): void {
    this.error = '';
    this.toast = '';
    if (opts?.requireDoc && !String(opts.doc || '').trim()) {
      this.error = `Complete el documento para «${opts.label || cod}».`;
      return;
    }
    this.loading = true;
    this.sso.loginByCodigo(cod).subscribe({
      next: (res) => {
        this.loading = false;
        this.seedNhDoc(cod, opts?.doc, opts?.tipoDoc);
        window.location.href = this.sso.absoluteModuleUrl(res, fallbackPath);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message || `No se pudo ingresar a ${opts?.label || cod}`;
      },
    });
  }

  enterDims(): void {
    this.enterCodigo('DIMS', '/oce/oceImpExpNp', {
      requireDoc: true,
      doc: this.imp.dims.documento,
      tipoDoc: this.imp.dims.tipoDoc,
      label: 'DIMS',
    });
  }

  enterExportNh(): void {
    this.enterCodigo('NH', '/oce/oceImpExpNp', {
      requireDoc: true,
      doc: this.exp.nh.documento,
      tipoDoc: this.exp.nh.tipoDoc,
      label: 'Exportación simplificada',
    });
  }

  enterOca(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.oca : this.exp.oca;
    this.enterCodigo('OCA', '/oce/oceImpExpNp', {
      requireDoc: true,
      doc: m.documento,
      tipoDoc: m.tipoDoc,
      label: 'Permiso ocasional',
    });
  }

  enterPrint(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.print : this.exp.print;
    if (!m.nroDoc.trim() || !m.nroId.trim()) {
      this.error = 'Complete número de documento e identificación.';
      return;
    }
    this.enterCodigo('NH', '/oce/oceImpExpNp', { label: 'Imprimir documento' });
  }

  enterMmc(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.mmc : this.exp.mmc;
    this.enterCodigo('MMC', '/oce/oceImpExpNp', {
      requireDoc: true,
      doc: m.documento,
      tipoDoc: m.tipoDoc,
      label: 'Agencia marítima',
    });
  }

  enterCharterAir(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.charter : this.exp.charter;
    this.enterCodigo('CHARTER', '/oce/oceCharter', {
      requireDoc: true,
      doc: m.documento,
      tipoDoc: m.tipoDoc,
      label: 'Permiso ocasional aéreo',
    });
  }

  enterValija(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.valija : this.exp.valija;
    this.enterCodigo('VALIJA', '/oce/oceImpExpNp', {
      requireDoc: true,
      doc: m.documento,
      tipoDoc: m.tipoDoc,
      label: 'Valija diplomática',
    });
  }

  enterSocorro(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.socorro : this.exp.socorro;
    const code = String(m.captcha || '').trim();
    if (!code) {
      this.error = 'Ingrese el código de verificación.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.sso.validateCaptcha(m.captchaToken, code).subscribe({
      next: (ok) => {
        if (!ok) {
          this.loading = false;
          this.error = 'Código de verificación incorrecto';
          this.refreshSocorroCaptcha(side);
          return;
        }
        this.sso.loginByCodigo('SOCORRO').subscribe({
          next: (res) => {
            this.loading = false;
            window.location.href = this.sso.absoluteModuleUrl(res, '/oce/oceImpExpNp');
          },
          error: (err) => {
            this.loading = false;
            this.error = err?.message || 'No se pudo ingresar a Envíos de socorro';
            this.refreshSocorroCaptcha(side);
          },
        });
      },
      error: () => {
        this.loading = false;
        this.error = 'No se pudo validar el captcha';
        this.refreshSocorroCaptcha(side);
      },
    });
  }

  enterDav(side: 'import' | 'export'): void {
    const m = side === 'import' ? this.imp.dav : this.exp.dav;
    this.enterCodigo('DAV', '/oce/oceImpExpNp', {
      requireDoc: true,
      doc: m.documento,
      tipoDoc: m.tipoDoc,
      label: 'DAV',
    });
  }
}
