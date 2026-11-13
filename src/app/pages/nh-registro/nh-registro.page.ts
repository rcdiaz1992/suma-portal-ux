import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SumaSessionService } from '../../services/suma-session.service';

/** Compat: redirige al portal legacy #/home (mismo que cubo Registro del hub). */
@Component({
  selector: 'app-nh-registro',
  template: `<p class="section-note" style="padding: 2rem">Redirigiendo al portal SUMA…</p>`,
  styles: [':host { display: block; min-height: 40vh; }'],
})
export class NhRegistroPage implements OnInit {
  constructor(private router: Router, private session: SumaSessionService) {}

  ngOnInit(): void {
    if (this.session.tipo !== 'NO_HABITUAL') {
      void this.router.navigateByUrl('/login/no-habituales');
      return;
    }
    const dest = this.session.legacyPortalHomeUrl();
    this.session.clearLocal();
    window.location.href = dest;
  }
}
