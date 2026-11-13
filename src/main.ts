import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

/** OCE (Charter) llama parent.hideScroll / showScroll en modales Bootstrap. */
const w = window as Window & { hideScroll?: () => void; showScroll?: () => void };
w.hideScroll = w.hideScroll || (() => undefined);
w.showScroll = w.showScroll || (() => undefined);

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
