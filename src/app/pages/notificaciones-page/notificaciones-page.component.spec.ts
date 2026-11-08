import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionesPageComponent } from './notificaciones-page.component';

describe('NotificacionesPageComponent', () => {
  let component: NotificacionesPageComponent;
  let fixture: ComponentFixture<NotificacionesPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NotificacionesPageComponent]
    });
    fixture = TestBed.createComponent(NotificacionesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
