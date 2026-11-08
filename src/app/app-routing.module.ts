import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalHomePage } from './pages/portal-home/portal-home.page';
import { NhHubPage } from './pages/nh-hub/nh-hub.page';
import { NhOpsPage } from './pages/nh-ops/nh-ops.page';
import { NhRegistroPage } from './pages/nh-registro/nh-registro.page';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginModule),
  },
  { path: 'portal', component: PortalHomePage },
  { path: 'hub/no-habituales', component: NhHubPage },
  { path: 'hub/no-habituales/ops', component: NhOpsPage },
  { path: 'hub/no-habituales/registro', component: NhRegistroPage },
  { path: 'no-habituales', redirectTo: 'hub/no-habituales' },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
