import { Component } from '@angular/core';
import { BreadCrumb } from 'src/app/core/models/breadCrumb.model';
import { IFindMenuDto } from 'src/app/core/models/menu.model';
import { Usuario } from 'src/app/core/models/usuario.model';
import { MenuService } from 'src/app/core/services/menu.service';
import { SessionService } from 'src/app/core/services/session.service';
import { UserInfoService } from 'src/app/core/services/userInfo.service';
import { UsuarioService } from 'src/app/core/services/usuario.service';

@Component({
  selector: 'main-app',
  templateUrl: './main-app.component.html',
  styleUrls: ['./main-app.component.scss']
})
export class MainAppComponent {
  constructor (
    private userInfoService :UserInfoService,
    private sessionService:SessionService,
    private usuarioService:UsuarioService,
    private menuService: MenuService
    ) {

  }
  ngOnInit(): void {

    //    this.title = this.userInfoService.getData();
    this.userInfoService.setData('hola test');

    /*this.userInfoService.getObservable().subscribe(data=>{
      this.title = data;
    });*/

    this.userInfoService.data$.subscribe(data => this.title = data);

    this.sessionService.data$.subscribe( data=> this.usuario = data);

    this.usuarioService.data$.subscribe(data => this.datos_usuario= data);
    // this.menuService.setData(this.menus);

    this.menuService.downloadMenu('DEMO','DEMOANGULAR');
  }

  menus: IFindMenuDto[] = 
  [
    {
      "menuId": "10",
      "titulo": "Ejemplos de componentes de angular",
      "descripcion": "Ejemplos de componentes de angular",
      "url": "componentes",
      "orden": "10",
      "icon": "ti ti-circle",
      "opciones": [
        {
        },
        {
        }
      ]
    },
    {
      "menuId": "30",
      "titulo": "Informaci�n de sesi�n",
      "descripcion": "Informaci�n de sesi�n",
      "url": "sesion",
      "orden": "30",
      "icon": "ti ti-circle",
      "opciones": [
        {
          "opcionId": "31",
          "codigo": "31",
          "descripcion": "Datos de usuario",
          "url": "usuario",
          "icon": "ti ti-circle",
          "orden": "31"
        },
        {
          "opcionId": "32",
          "codigo": "32",
          "descripcion": "token",
          "url": "token",
          "icon": "ti ti-circle",
          "orden": "32"
        }
      ]
    }
  ]; 

  title: string = 'an-demo';
  datos_usuario: string = 'vacio!';
  usuario?: Usuario;

  listBread:BreadCrumb[] = [
    {
      link: '/asdas',
      titulo: 'Sistemas'
    },
    {
      link: '/subsistema',
      titulo: 'Sub-sistema'
    }
  ];

  saveUser () {
    this.sessionService.setData({nombres: 'JUAN', primerAp:'perez', segundoAp: 'Segundo', correo: 'asd@gmail.com'});
    this.usuarioService.downloadRecords();
  }

  hello ( ){
    console.log('Hola');
  }

  btnApps () {
    console.log('Hello');
  }
}
