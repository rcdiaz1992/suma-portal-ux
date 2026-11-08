import { DataOBJ } from '@aduana/an-core';
// import { IEmpleado } from '@aduana/sen-onion-demo-rest-dom-itf';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MiServicio extends DataOBJ<string> {

  constructor() {
    super();
    this.setData("Hola");
  }

  
}
