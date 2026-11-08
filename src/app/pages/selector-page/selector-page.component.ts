import { Generico } from '@aduana/an-core/lib/core/models/generico.model';
import { Component } from '@angular/core';

@Component({
  selector: 'app-selector-page',
  templateUrl: './selector-page.component.html',
  styleUrls: ['./selector-page.component.scss']
})
export class SelectorPageComponent {
  
  lista:string[]=["Opcion 1","Opcion 2","Opcion 3", "Opcion 4"];
  // seleccionado: any= 'Opcion 3';
  seleccionado: any= undefined;

  // objSelected: Generico = {};
  objSelected: any = {};
  keyValueSelected: Generico = {   valor: 'Opcion 3',clave: '789'};

  
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
    {
      valor: 'Opcion 6',
      clave: '523'
    },
  ];

  frutas: string [] = ['Manzana', 'Banana', 'Naranja', 'Piña', 'Mango'];
  multipleSelected: Generico [] = [];

  dropdownValueChanged (evt: any) {
    console.log(JSON.stringify(evt));
  }

}
