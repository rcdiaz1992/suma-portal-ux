import { Component, OnInit } from '@angular/core';
import { MiServicio } from 'src/app/services/mi-servicio.service';
import { DocBase64 } from '../document-page/doc.asset';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss']
})
export class MainPage implements OnInit{
    hello() {
      this.miServicio.setData("Nuevo valor");
    }

    constructor (private miServicio:MiServicio) {

    }
  ngOnInit(): void {
    this.src_pdf = DocBase64;
  }

  async  addFile (file: any) {
      console.log('FILE: ', file);
      // this.readFile(file);
      this.src_pdf = await this.fileToBase64 (file);
    }

    src_pdf: any = '';

  readFile (file:any) {
    console.log( '----- BASE64:-----');
    debugger
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      
      // Callback al cargar el archivo
      reader.onload = (e: any) => {
        // Extraer el Base64 (removiendo el prefijo data:application/pdf;base64)
        const base64 = e.target.result.split(',')[1];
        
        // Mostrar el resultado (los primeros 200 caracteres por brevedad)
        //document.getElementById('base64Output').textContent = 
        //`Base64 (partial): ${base64.substring(0, 200)}...`;
        console.log( 'BASE64:' , base64 );
        
      };
    }
  }

  fileToBase64 (file:any) {
    return new Promise((resolve, reject) => {
      const reader:any = new FileReader();
      
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String);
      };
      
      reader.onerror = (error:any) => {
        reject(error);
      };
      
      // Iniciar la lectura del archivo
      reader.readAsDataURL(file);
    });
  }

  
}
