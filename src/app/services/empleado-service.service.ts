// import { ICrearEmpleadoDto, IEmpleado } from '@aduana/sen-onion-demo-rest-dom-itf';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, retry, throwError } from 'rxjs';
import { URLEmpleados } from '../config/URLConfig';
import { Respuesta } from '@aduana/an-core';
// import { ObjRespuesta, ObjRespuestaLista } from '../models/ObjetoRespuesta';

/**
 *    ¯\_(ツ)_/¯
 */
@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  constructor(private httpClient : HttpClient) { }

  listaEmpleados() : Observable<Respuesta<any>> {
    return this.httpClient.get<Respuesta<any>>(URLEmpleados,).pipe(retry(0),catchError(this.handleError));
  }

  guardarEmpleado(empleado:any ) : Observable<Respuesta<any>> {
    return this.httpClient.post(URLEmpleados, empleado ).pipe( retry(0), catchError(this.handleError));
  }

  handleError(error: any, obs:any) {
    let errorMessage = '';
    if(error.error instanceof ErrorEvent) {
      // Get client-side error
      errorMessage = error.error.message;
    } else {
      // Get server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    window.alert(errorMessage); // esta linea se puede cambiar por otro componente de alerta

    return throwError(()=> new Error (errorMessage));
  }

}
