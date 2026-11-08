import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PortalHomePage } from './pages/portal-home/portal-home.page';
import { NhHubPage } from './pages/nh-hub/nh-hub.page';
import { NhOpsPage } from './pages/nh-ops/nh-ops.page';
import { NhRegistroPage } from './pages/nh-registro/nh-registro.page';
import { environment } from 'src/environments/environment';
import { SumaAuthInterceptor } from './interceptors/suma-auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    PortalHomePage,
    NhHubPage,
    NhOpsPage,
    NhRegistroPage,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: 'ENV', useValue: environment },
    { provide: HTTP_INTERCEPTORS, useClass: SumaAuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
