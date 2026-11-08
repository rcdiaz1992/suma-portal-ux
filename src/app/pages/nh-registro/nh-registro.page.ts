import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SumaSessionService } from '../../services/suma-session.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-nh-registro',
  templateUrl: './nh-registro.page.html',
  styleUrls: ['./nh-registro.page.scss'],
})
export class NhRegistroPage implements OnInit {
  sent = false;
  form = this.fb.group({
    tipoDoc: ['CI', Validators.required],
    documento: ['', Validators.required],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    celular: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private session: SumaSessionService,
    private themeSvc: ThemeService
  ) {}

  get theme() {
    return this.themeSvc.theme;
  }

  toggleTheme(): void {
    this.themeSvc.toggle();
  }

  ngOnInit(): void {
    if (this.session.tipo !== 'NO_HABITUAL') {
      this.router.navigateByUrl('/login/no-habituales');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sent = true;
  }

  back(): void {
    this.router.navigateByUrl('/hub/no-habituales');
  }

  logout(): void {
    this.session.logout('logout');
  }
}
