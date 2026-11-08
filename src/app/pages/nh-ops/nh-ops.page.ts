import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nh-ops',
  templateUrl: './nh-ops.page.html',
  styleUrls: ['./nh-ops.page.scss'],
})
export class NhOpsPage implements OnInit {
  tab: 'import' | 'export' = 'import';
  toast = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (sessionStorage.getItem('suma.tipoUser') !== 'NO_HABITUAL') {
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
    sessionStorage.clear();
    this.router.navigateByUrl('/login');
  }
}
