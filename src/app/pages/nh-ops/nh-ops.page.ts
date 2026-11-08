import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SumaSessionService } from '../../services/suma-session.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-nh-ops',
  templateUrl: './nh-ops.page.html',
  styleUrls: ['./nh-ops.page.scss'],
})
export class NhOpsPage implements OnInit {
  tab: 'import' | 'export' = 'import';
  toast = '';

  constructor(
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

  setTab(tab: 'import' | 'export'): void {
    this.tab = tab;
  }

  go(label: string): void {
    this.toast = `Prototipo: abriría «${label}» (SUMA PRE / profile).`;
    setTimeout(() => (this.toast = ''), 2800);
  }

  back(): void {
    this.router.navigateByUrl('/hub/no-habituales');
  }

  logout(): void {
    this.session.logout('logout');
  }
}
