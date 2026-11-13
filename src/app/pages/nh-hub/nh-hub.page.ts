import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SumaSessionService } from '../../services/suma-session.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-nh-hub',
  templateUrl: './nh-hub.page.html',
  styleUrls: ['./nh-hub.page.scss'],
})
export class NhHubPage implements OnInit {
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
    if (!this.session.isLoggedIn() || this.session.tipo !== 'NO_HABITUAL') {
      this.router.navigateByUrl('/login/no-habituales');
    }
  }

  /** Cubo 1: alta nuevo operador → portal SUMA legacy #/home por ambiente. */
  goRegistro(): void {
    const dest = this.session.legacyPortalHomeUrl();
    this.session.clearLocal();
    window.location.href = dest;
  }

  goOps(): void {
    void this.router.navigateByUrl('/hub/no-habituales/ops');
  }

  logout(): void {
    this.session.logout('logout');
  }
}
