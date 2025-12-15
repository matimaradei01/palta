import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockHoyComponent } from './stock-hoy.component';

describe('StockHoyComponent', () => {
  let component: StockHoyComponent;
  let fixture: ComponentFixture<StockHoyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StockHoyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockHoyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
