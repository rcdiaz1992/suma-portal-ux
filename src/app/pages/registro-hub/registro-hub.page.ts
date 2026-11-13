import { Component } from '@angular/core';

/** Hub de altas / accesos especiales (mismo shell que /login). */
@Component({
  selector: 'app-registro-hub-page',
  templateUrl: './registro-hub.page.html',
  styleUrls: ['./registro-hub.page.scss'],
})
export class RegistroHubPage {
  readonly paths = [
    {
      ord: '1',
      title: 'Importadores / Exportadores habituales',
      desc: 'Ingresar → login (usuario, clave, captcha). Registro nuevo abajo.',
      link: '/login',
      query: { canal: 'OPE2' },
    },
    {
      ord: '2',
      title: 'Importadores / Exportadores no habituales',
      desc: 'Sin usuario ni clave · captcha, luego registro u operaciones.',
      link: '/login/no-habituales',
      query: null as Record<string, string> | null,
    },
    {
      ord: '3',
      title: 'Otros operadores de comercio',
      desc: 'Ingresar → mismo login (canal OPE3). Registro nuevo abajo.',
      link: '/login',
      query: { canal: 'OPE3' },
    },
    {
      ord: '4',
      title: 'Usuario organizador ferial',
      desc: 'Ingresar → mismo login (canal ORF). Registro nuevo abajo.',
      link: '/login',
      query: { canal: 'OPE8' },
    },
    {
      ord: '5',
      title: 'Registro de empresas Charter',
      desc: 'Sin usuario ni clave · captcha e ingreso Charter.',
      link: '/login/charter',
      query: null,
    },
  ];
}
