import { MinIOFileClient } from '@aduana/an-core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DocBase64 } from "./doc.asset";

@Component({
  selector: 'app-document-page',
  templateUrl: './document-page.component.html',
  styleUrls: ['./document-page.component.scss']
})
export class DocumentPageComponent implements OnInit{

  constructor (private httpClient: HttpClient, private minIOFileClient:MinIOFileClient) {}
  ngOnInit(): void {
    this.loadContent ();
    this.getWSPDF();
  }
  doc64: string = '';
  url: string =  '';

  /**
   * Ejemplo de consumo de pdf para MinIO
   */
  async getWSPDF () {
    // minio path
    //http://10.0.2.152:3000/file/dowload?id=an.sen.repo/2023/Agosto/c12aa6664acb4609cf840af3f83eb715.pdf
    // let URL = 'http://10.0.2.152:3000/file/dowload?id=an.sen.repo/2023/Agosto/c12aa6664acb4609cf840af3f83eb715.pdf';
    // let URL = 'http://10.0.2.152:3000/file/dowload?id=an.sen.repo/2023/Agosto/c12aa6664acb4609cf840af3f83eb715.pdf';
    
    let URL = 'https://desa-servicios.aduana.gob.bo/str-mul-repo-rest/reporte';
    let urlPATH = await this.minIOFileClient.getPdfDoc (URL,this.objDoc);

    // window.open(urlPATH);
    this.url = urlPATH ;
  }
  
// minIOs  
// http://10.101.1.44:9000/an.sco.repo/fcb3d29a568e24967067a6ce7ce8cb68.pdf
// http://10.0.2.152:3000/file/dowload/an.sco.repo/fcb3d29a568e24967067a6ce7ce8cb68.pdf
  loadContent (){
    setTimeout (() => {
      this.doc64 = DocBase64; 
    },1000);
  }
  
  objDoc = {
      "templateId": "an-str-mul-repo/templates/AR-FAP/template-AR-FAP.odt",
      "formatter": "pdf",
      "data": {
        "numf": 22,
        "version": 2,
        "fecha": "11-08-23",
        "gnf": "Nombre de gnf sdfasfafdasfasfa asdf asdf adf",
        "jdgr": "Nombre de jdgr",
        "raram": "Nombre de raram",
        "ar-fap": [
          {"razon_social" : "Juan", "nit": 21321, "estado_nit": "AC", "dom_tri": "Junin #1", "tipo_mer": "A", "obs_ggnf": ""},
          {"razon_social" : "Esteban", "nit": 10352635014, "estado_nit": "AC", "dom_tri": "Junin #1", "tipo_mer": "A", "obs_ggnf": ""},
          {"razon_social" : "Daniel", "nit": 21321, "estado_nit": "AN", "dom_tri": "Junin #2", "tipo_mer": "A", "obs_ggnf": "RECHAZADO"},
          {"razon_social" : "Rolando", "nit": 21321, "estado_nit": "AN", "dom_tri": "Junin #3", "tipo_mer": "A", "obs_ggnf": ""},
          {"razon_social" : "Dennys", "nit": 21321, "estado_nit": "AN", "dom_tri": "Junin #323", "tipo_mer": "A", "obs_ggnf": ""}
        ]
      }
    };

}
