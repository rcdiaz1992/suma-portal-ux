import { ContentLoadingService } from '@aduana/an-core';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-table-page',
  templateUrl: './table-page.component.html',
  styleUrls: ['./table-page.component.scss']
})
export class TablePageComponent  implements OnInit {

  constructor (private httpClient : HttpClient, private contenLoadservice:ContentLoadingService) {}

  ngOnInit(): void {
    this.total =  this.list.length;
    console.log(this.total);
    // this.paginatedList = this.pageList (0, 2);
  }

  setPaginator (evt: any) {
    console.log('EVT: ' + JSON.stringify(evt));
    // this.paginatedList = [];  
    //  this.paginatedList = this.list;
    this.paginatedList = this.pageList ( this.list,evt.currentPage, evt.itemsPerPage);
  }
  paginatedList: any [] = [];
  total: number =  0;

  headers = [
    {
      texto: 'Dessert (100g serving)',
      align: 'start',
      sortable: false,
      value: 'name',
    },
    { texto: 'Calories', value: 'calories' },
    { texto: 'Fat (g)', value: 'fat' },
    { texto: 'Carbs (g)', value: 'carbs' },
    { texto: 'Protein (g)', value: 'protein' },
    { texto: 'Iron (%)', value: 'iron' },
  ];

  list = [
    {
      name: 'Frozen Yogurt',
      calories: 159,
      fat: 6.0,
      carbs: 24,
      protein: 4.0,
      iron: '1%',
    },
    {
      name: 'Ice cream sandwich',
      calories: 237,
      fat: 9.0,
      carbs: 37,
      protein: 4.3,
      iron: '1%',
    },
    {
      name: 'Eclair',
      calories: 262,
      fat: 16.0,
      carbs: 23,
      protein: 6.0,
      iron: '7%',
    },
    {
      name: 'Cupcake',
      calories: 305,
      fat: 3.7,
      carbs: 67,
      protein: 4.3,
      iron: '8%',
    },
    {
      name: 'Gingerbread',
      calories: 356,
      fat: 16.0,
      carbs: 49,
      protein: 3.9,
      iron: '16%',
    },
    {
      name: 'Jelly bean',
      calories: 375,
      fat: 0.0,
      carbs: 94,
      protein: 0.0,
      iron: '0%',
    },
    {
      name: 'Lollipop',
      calories: 392,
      fat: 0.2,
      carbs: 98,
      protein: 0,
      iron: '2%',
    },
    {
      name: 'Honeycomb',
      calories: 408,
      fat: 3.2,
      carbs: 87,
      protein: 6.5,
      iron: '45%',
    },
    {
      name: 'Donut',
      calories: 452,
      fat: 25.0,
      carbs: 51,
      protein: 4.9,
      iron: '22%',
    },
    {
      name: 'KitKat',
      calories: 518,
      fat: 26.0,
      carbs: 65,
      protein: 7,
      iron: '6%',
    },
    {
      name: 'ADSSS',
      calories: 518,
      fat: 26.0,
      carbs: 65,
      protein: 7,
      iron: '8%',
    },
  ];

  pageList (list: any,targetPage: number, itemsPerPage:number) {
    console.log('datos: ', itemsPerPage, targetPage );
    console.log('size: ', (targetPage ) * itemsPerPage, (targetPage + 1) * itemsPerPage );
    return list.slice((targetPage ) * itemsPerPage, (targetPage + 1) * itemsPerPage);
  }

  // ejemplo de tabla con paginador desde WebService
  headersWS = [
    { texto: 'IDE', value: 'rolId' },
    { texto: 'Rol', value: 'nombre' }
  ];
  listPage: any[] = [];
  totalWS: number = 100;
  
  async setPageWS (evt:any) {
    // this.paginatedList = [];
    // this.listPage = await 
/*     let ws = await this.getWS(evt.currentPage, evt.itemsPerPage);
    console.log( 'WS ', ws); */
    // this.paginatedList = this.pageList ( this.list,evt.currentPage, evt.itemsPerPage);
    console.log('DATA: ',  evt.currentPage, evt.itemsPerPage);

    this.httpClient
    // .get('http://10.0.2.36:5000/sen-onion-demo-rest/roles?limit=' + evt.itemsPerPage + '&page='+ (Number(evt.currentPage) +1))
    .get('http://10.0.2.164:3000/sao-mgd-sa-rest/documento?limit=' + evt.itemsPerPage + '&page='+ (Number(evt.currentPage) +1))
    

    .subscribe( (data: any) => {
      console.log('RESPONSE paginator: ', JSON.stringify(data,null,4));
      // this.parseData(JSON.stringify(data))
      this.listPage =data.respuesta.documentoList;
      this.totalWS = data.respuesta.metadatos.totalItems;
    });
  }

/*   getWS () {
    this.downloadRecords();
  } */

  getWS (page: number, itemsPorPagina: number)   {

    return new Promise ( (resolve, reject)=> {
      this.httpClient
      .get('http://10.0.2.36:5000/sen-onion-demo-rest/roles?limit='+itemsPorPagina+'&page='+ page)
      .subscribe( (data: any) => {
        console.log('RESPONSE paginator: ', JSON.stringify(data));
        // this.parseData(JSON.stringify(data))
        resolve(this.parseData(data.respuesta.roles));
      });

    });

  }

  parseData (data: any) {
    return [];
  }

}
