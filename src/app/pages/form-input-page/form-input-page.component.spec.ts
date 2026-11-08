import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormInputPageComponent } from './form-input-page.component';

describe('FormInputPageComponent', () => {
  let component: FormInputPageComponent;
  let fixture: ComponentFixture<FormInputPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormInputPageComponent]
    });
    fixture = TestBed.createComponent(FormInputPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
