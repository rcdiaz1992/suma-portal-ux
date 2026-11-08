import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { LoginShellPage } from '../login-shell/login-shell.page';
import { LoginPage } from './login.page';
import { LoginMfaPage } from '../login-mfa/login-mfa.page';

const routes: Routes = [
  {
    path: '',
    component: LoginShellPage,
    children: [
      { path: '', component: LoginPage },
      { path: 'no-habituales', component: LoginMfaPage },
    ],
  },
];

@NgModule({
  declarations: [LoginShellPage, LoginPage, LoginMfaPage],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes)],
})
export class LoginModule {}
