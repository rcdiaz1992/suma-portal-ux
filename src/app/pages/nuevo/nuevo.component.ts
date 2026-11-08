import { Component } from '@angular/core';

@Component({
  selector: 'app-nuevo',
  templateUrl: './nuevo.component.html',
  styleUrls: ['./nuevo.component.scss']
})
export class NuevoComponent {

  listaObj: any [] = [
    {
      valor: 'Opcion 1',
      clave: '123',
    },
    {
      valor: 'Opcion 2',
      clave: '456'
    },
    {
      valor: 'Opcion 3',
      clave: '789'
    },
  ];

  multipleSelected: any [] = [];
}
