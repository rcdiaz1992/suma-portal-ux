import { AuthService, BreadCrumb, Respuesta, RolesService, SessionService } from '@aduana/an-core';
import { Generico } from '@aduana/an-core/lib/core/models/generico.model';
// import { ICrearEmpleadoDto, IEmpleado, IRecuperarEmpleadoDto } from '@aduana/sen-onion-demo-rest-dom-itf';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
// import { ObjRespuestaLista } from 'src/app/models/ObjetoRespuesta';
import { EmpleadoService } from 'src/app/services/empleado-service.service';
import { MiServicio } from 'src/app/services/mi-servicio.service';

@Component({
  selector: 'app-second-page',
  templateUrl: './second-page.component.html',
  styleUrls: ['./second-page.component.scss']
})
export class SecondPageComponent implements OnInit {
  userInfo : any = {};
  roles : any = {};
  constructor (
    private rolesService:RolesService, 
    private authService: AuthService,
    private miServicio:MiServicio,
    private empleadoService:EmpleadoService,
    private httpClient : HttpClient,
    private sessionService: SessionService
    ) {    
  }

  miDato:string= '';
  list?: any [] = [];
  
  listBread:BreadCrumb[] = [
    {
      link: '/asdas',
      titulo: 'Sistema'
    },
    {
      link: '/subsistema',
      titulo: 'Sub-sistema'
    }
  ];

  ngOnInit(): void {
    this.rolesService.data$.subscribe( data=>
      this.roles = data
    );

    this.userInfo =  this.authService.getLoggedUser();
    this.miServicio.data$.subscribe ( data => this.miDato = data);

    console.log('Session service', this.sessionService.getAduana());
    // llamada al servicio
    this.getValue();
  }

  getLista () {
    this.empleadoService
      .listaEmpleados()
      .subscribe(data=>{
        this.list = data.respuesta?.empleados;
      });
  }

  guardarEmpleado () {
    let empleado: any = {
      nombres: 'Juan',
      apellidos: 'Pinto P.',
      codigoEmpleado: '002'
    } as any;

    this.empleadoService
    .guardarEmpleado(empleado)
    .subscribe(data=>{
      console.log(data);
    });
  }


  /** Ejemplo de load  */

  getValue () {
    // https://jsonplaceholder.typicode.com/albums
    return this.httpClient.get('https://jsonplaceholder.typicode.com/albums').subscribe (data => {
       console.log('update --array');
        this.listaObj = this.parseArray(data);
    });
  }

  listArticle: any [] = [];
  dataWS: any = '';
  getToken () {
    return this.httpClient.get ('http://10.0.2.36:5000/sen-onion-demo-rest/roles/roles2').subscribe ( data => {
      console.log('...: LOG token :...\n', JSON.stringify(data, null ,4));
      this.dataWS = JSON.stringify(data, null ,4);
    });
  }

  parseArray (array: any) {
    const updatedOrderingData = array.map((item: any, index: number) => { return { valor: item.title, clave: item.id+'' }});
    return updatedOrderingData;
  }
  
  listaObj: Generico [] = [];
  keyValueSelected: Generico = {};

  otroCliente () {
    this.fetchData();
    let url = 'http://andesjboss.aduana.gob.bo:8463/wsUsuario/consulta/tecnico/rol/CONTRATACION_TEC';
    const options = {
      method: 'GET',
      // Permitir contenido mixto
      headers: { 'Content-Security-Policy': 'upgrade-insecure-requests' }
    };
    fetch(url, options)
      .then(async (res) => {
        console.log('OK 1', res);
      })
      .catch((error) => console.error("Error:", error))
      .then((response) => console.log("Success:", response));


  }

  fetchData() {
    const options = {
      headers: new HttpHeaders({
        'Content-Security-Policy': 'upgrade-insecure-requests'
      })
    };

    this.httpClient.get('http://andesjboss.aduana.gob.bo:8463/wsUsuario/consulta/tecnico/rol/CONTRATACION_TEC', options).subscribe(data=> {
      console.log('OK 2');
    });
  }

/*   openPDF () {
    let obj = {
      idDocumento: "53a7604c-094f-4322-99f7-055a42e9f5c1",
      marcaAgua: true
    };
    fetch(url, {
      method: "POST",
      body: JSON.stringify(obj),
      headers: {
        "Content-Type": "application/json",
        "Auth-Token": "123"
      },
    })
      .then(async (res) => {
        let datas = await res.arrayBuffer();
        let file = new Blob([datas], { type: 'application/pdf' });
        this.urlPDF = window.URL.createObjectURL(file);
      })
      .catch((error) => console.error("Error:", error))
      .then((response) => console.log("Success:", response));
  } */

}
