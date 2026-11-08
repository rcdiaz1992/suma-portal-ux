import { InputTextComponent } from '@aduana/an-core';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
// import { InputTextComponent } from 'src/app/core/forms/input-text/input-text.component';

@Component({
  selector: 'app-form-input-page',
  templateUrl: './form-input-page.component.html',
  styleUrls: ['./form-input-page.component.scss']
})
export class FormInputPage implements AfterViewInit {
  
  
  @ViewChild('nombre') nombre?: InputTextComponent;
  @ViewChild('edad') edad?: InputTextComponent;

  ngAfterViewInit(): void {
 /*    this.email?.addValidator(Validators.pattern("[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"))
    this.email?.addValidator(TextJose);
    this.edad?.addValidator(NoNegativeNumbers); */
    this.nombre?.addValidator(TextJose);
    
  }

  basicPerson:BasicPerson = {};

  formGroupObj:FormGroup = new FormGroup({ });

  validarForm () {

  }

  onClick () {

  }

  clickForm (lista:any) {
    this.basicPerson = lista;
  }
}

export interface BasicPerson {
  nombres?: string;
  telefono?: number;
  fechaNacimiento?: Date;
  descripcion?: string;
}

export interface User {
  name?: string ;
  phone?: number;
  age?: number;
  birthday?: Date;
  obs?: string
}

export function joseValidator (control: AbstractControl): ValidatorFn | null {
 
  console.log('Control: ', control.value);
  let v =control.value;

  /* if (isNaN(v)) {
    return { 'gte': true, 'requiredValue': 10 }
  }      

  if (v <= 10) {
    return { 'gte': true, 'requiredValue': 10 }
  } */
 
  if (v === 'jose') {
    console.log('es jose: ', control.value);
    //return { valid: true} as ValidationErrors;
  }

  return null
}


function ValidateIsJose() : ValidatorFn {
  return (c: AbstractControl) => {
    
    let isValid = c.value === 'Juri';

      if(isValid) {
          return null;
      } else {
          return {
              juriName: {
                  valid: false
              }
          };
    }
  }
}

/* export function NoNegativeNumbers(control: AbstractControl) {
  console.log('DATA', );
  return control.value === 'jose' ? { negativeNumber: true } : null;
} */

export function NoNegativeNumbers(control: AbstractControl) {
  return control.value < 0 ? { negative: true } : null;
}

export function TextJose (control: AbstractControl) {
  return control.value !== 'jose@gmail.com' ? { isJose: true } : null;
}