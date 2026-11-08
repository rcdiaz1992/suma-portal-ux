import { NotificacionService } from '@aduana/an-core';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-notificaciones-page',
  templateUrl: './notificaciones-page.component.html',
  styleUrls: ['./notificaciones-page.component.scss']
})
export class NotificacionesPage implements OnInit {

  constructor( private notificacionService: NotificacionService){
  }

  ngOnInit(): void {
  }

  accion () {}

  showAlertInfo () {
    this.notificacionService.info(
      'Existen cambios no puede pasar al siguiente paso'
    );
  }

  showAlertSuccess () {
    this.notificacionService.success(
      'Existen cambios no puede pasar al siguiente paso'
    );
  }

  showAlertError () {
    this.notificacionService.error(
      'Existen cambios no puede pasar al siguiente paso', 1500
    );
  }
  
  showAlertWarning () {
    this.notificacionService.warning(
      'Existen cambios no puede pasar al siguiente paso'
    );
  }

}
