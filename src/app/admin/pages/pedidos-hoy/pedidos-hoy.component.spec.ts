import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosHoyComponent } from './pedidos-hoy.component';

describe('PedidosHoyComponent', () => {
  let component: PedidosHoyComponent;
  let fixture: ComponentFixture<PedidosHoyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PedidosHoyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PedidosHoyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
