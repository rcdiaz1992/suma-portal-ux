import { Component } from '@angular/core';
import { APP_VERSION } from 'src/environments/version';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'SUMA Portal';
  _appVersion: string = APP_VERSION;
}
