import { TestBed } from '@angular/core/testing';

import { PedidosDataService } from './pedidos-data.service';

describe('PedidosDataService', () => {
  let service: PedidosDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidosDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
