import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortalHomePage } from './pages/portal-home/portal-home.page';
import { PublicHubPage } from './pages/public-hub/public-hub.page';
import { NhHubPage } from './pages/nh-hub/nh-hub.page';
import { NhOpsPage } from './pages/nh-ops/nh-ops.page';
import { NhRegistroPage } from './pages/nh-registro/nh-registro.page';
import { SumaAuthGuard } from './guards/suma-auth.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginModule),
  },
  /** indexOce público: 4 cubos (registro / ops NH / consultas / utilitarios). */
  { path: 'hub', component: PublicHubPage },
  { path: 'portal', component: PortalHomePage, canActivate: [SumaAuthGuard] },
  { path: 'hub/no-habituales', component: NhHubPage, canActivate: [SumaAuthGuard] },
  { path: 'hub/no-habituales/ops', component: NhOpsPage, canActivate: [SumaAuthGuard] },
  { path: 'hub/no-habituales/registro', component: NhRegistroPage, canActivate: [SumaAuthGuard] },
  { path: 'no-habituales', redirectTo: 'hub/no-habituales' },
  { path: 'registro', redirectTo: 'hub' },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
