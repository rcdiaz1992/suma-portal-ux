import { Component } from '@angular/core';
import { APP_VERSION } from 'src/environments/version';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'SUMA Portal';
  _appVersion: string = APP_VERSION;

  constructor(private theme: ThemeService) {
    // Aplica tema claro/oscuro global al arrancar (login, portal, hub…).
    void this.theme.theme;
  }
}
