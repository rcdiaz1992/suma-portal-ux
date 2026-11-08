import { ContentLoadingService } from '@aduana/an-core';
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons-page',
  templateUrl: './buttons-page.component.html',
  styleUrls: ['./buttons-page.component.scss']
})
export class ButtonsPage {

  constructor (private contentLoadingService:ContentLoadingService) {

  }

  showLoading () {
    console.log('asdasda');
    this.contentLoadingService.showLoading();
    this.contentLoadingService.hideLoadingTimer(2000);
  }

}
