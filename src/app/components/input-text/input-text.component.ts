import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'an-input-text',
  templateUrl: './input-text.component.html',
  styleUrls: ['./input-text.component.scss']
})
export class InputTextComponent implements OnInit {

  ngOnInit(): void {
  }

  @Input() tipo: string = 'example-input-normal'; 
  @Input()  clase: string = '';
  @Input()  label: string = '';



}
