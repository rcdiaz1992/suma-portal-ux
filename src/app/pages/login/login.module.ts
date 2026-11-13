import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoginShellPage } from '../login-shell/login-shell.page';
import { LoginPage } from './login.page';
import { LoginNhPage } from '../login-nh/login-nh.page';
import { LoginCharterPage } from '../login-charter/login-charter.page';
import { RegistroOpePage } from '../registro-ope/registro-ope.page';
import { ForgotPasswordPage } from '../forgot-password/forgot-password.page';
import { ResetPasswordPage } from '../reset-password/reset-password.page';

const routes: Routes = [
  {
    path: '',
    component: LoginShellPage,
    children: [
      { path: '', component: LoginPage },
      { path: 'olvidar-clave', component: ForgotPasswordPage },
      {
        path: 'reset/:user/:passwordToken/:codigo',
        component: ResetPasswordPage,
      },
      { path: 'registro', redirectTo: '/hub', pathMatch: 'full' },
      {
        path: 'registro/habituales',
        component: RegistroOpePage,
        data: { ope: 'habituales' },
      },
      {
        path: 'registro/otros',
        component: RegistroOpePage,
        data: { ope: 'otros' },
      },
      {
        path: 'registro/orf',
        component: RegistroOpePage,
        data: { ope: 'orf' },
      },
      { path: 'no-habituales', component: LoginNhPage },
      { path: 'charter', component: LoginCharterPage },
    ],
  },
];

@NgModule({
  declarations: [
    LoginShellPage,
    LoginPage,
    LoginNhPage,
    LoginCharterPage,
    RegistroOpePage,
    ForgotPasswordPage,
    ResetPasswordPage,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterModule.forChild(routes),
  ],
})
export class LoginModule {}
