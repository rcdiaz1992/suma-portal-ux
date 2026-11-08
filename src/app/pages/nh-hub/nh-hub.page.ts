import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nh-hub',
  templateUrl: './nh-hub.page.html',
  styleUrls: ['./nh-hub.page.scss'],
})
export class NhHubPage implements OnInit, AfterViewInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    const token = sessionStorage.getItem('suma.token');
    const tipo = sessionStorage.getItem('suma.tipoUser');
    if (!token || tipo !== 'NO_HABITUAL') {
      this.router.navigateByUrl('/login/no-habituales');
    }
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      try {
        window.SumaBannerHero?.mountAll?.();
      } catch {
        /* ignore */
      }
      void window.ParticlesBg?.autoMount?.();
    });
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigateByUrl('/login');
  }
}
