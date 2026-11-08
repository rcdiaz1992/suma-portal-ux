import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-upload-download',
  templateUrl: './upload-download.component.html',
  styleUrls: ['./upload-download.component.scss']
})
export class UploadDownloadComponent implements OnInit {

  constructor (private httpClient: HttpClient) {

  }

  ngOnInit(): void {
  }


  URL_SERVER = 'https://desa-servicios.aduana.gob.bo/str-mul-rest/documentos/uploads?repositorio=an.spf.mra.anpr.repo&path=%2FGNTI%2FDIDS%2FNOTA';
  

  async uploadFile(files: any) {
    console.log('uploadFile', files);
    const formData: FormData = new FormData();
    formData.append('file', files, files.name);
    files.forEach((file:File )=> {
      console.log('Upload', file);
      formData.append('file', file, file.name);  
    });


    await this.httpClient.post(this.URL_SERVER, formData)
      .subscribe(response => {
        console.log('Archivo cargado exitosamente', response);
      }, error => {
        console.error('Error al cargar el archivo', error);
      });
  }

  updateAddFile (files: any) {
    console.log('updateAddFile ', files);
  }

  uploadSingle (file: any) {
    console.log('updateAddFile ', file);
  }

  ejecuta () {

    /*     usuario: nopresencial
    clave: password */


    let headers = new HttpHeaders();
    headers = headers.set("usuario", "nopresencial");
    headers = headers.set("clave", "password");
    headers = headers.set("Accept", "*/*");
    headers = headers.set("Accept-Encoding", "gzip, deflate, br");
    headers = headers.set("Accept-Language", "es-MX,es;q=0.8,en-US;q=0.5,en;q=0.3");
    headers = headers.set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0");
    headers = headers.set("Sec-Fetch-Mode", "cors");
    headers = headers.set("Sec-Fetch-Dest", "empty");
    headers = headers.set("Sec-Fetch-Site", "same-origin");
    headers = headers.set("Host", "suma-test.aduana.gob.bo:6843");
    headers = headers.set("Connection", "keep-alive");

    headers = headers.set("Content-Type", "application/json;charset=UTF-8");

    
	
    
    
    
    

    this.httpClient
    .get('https://suma-test.aduana.gob.bo:6843/ws-proxy/api/consulta/bcpt/detalleDatosYMercanciaDim/DI-2024-101-2003203',{headers:headers})
    .subscribe( 
      data=>{

      }, err=> {

      });
  }


  otroCliente () {
    let url = 'https://suma-test.aduana.gob.bo:6843/ws-proxy/api/consulta/bcpt/detalleDatosYMercanciaDim/DI-2024-101-2003203';
/*     let obj = {
      idDocumento: "53a7604c-094f-4322-99f7-055a42e9f5c1", 
      marcaAgua:true
    }; */
    fetch(url, {
      method: "GET",
      // body: JSON.stringify(obj),
      headers: {
        "Content-Type": "application/json",
        "usuario": "nopresencial",
        "clave": "password"
      },
    })
    .then(async (res) =>  {
      console.log('Respuesta: ', res);
    })
    .catch((error) => console.error("Error:", error))
    .then((response) => console.log("Success:", response));
  }

}
