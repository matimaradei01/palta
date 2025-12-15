import { Component } from '@angular/core';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-public-layout',
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss'],
})
export class PublicLayoutComponent {
  year = new Date().getFullYear();

  constructor(private pedidoService: PedidoService) {}
}
