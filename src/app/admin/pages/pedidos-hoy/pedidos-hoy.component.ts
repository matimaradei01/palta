import { Component, OnInit } from '@angular/core';
import { AdminDataService, PedidoGuardado, PedidoEstado } from '../../services/admin-data.service';

@Component({
  selector: 'app-pedidos-hoy',
  templateUrl: './pedidos-hoy.component.html',
  styleUrls: ['./pedidos-hoy.component.scss']
})
export class PedidosHoyComponent implements OnInit {
  pedidos: PedidoGuardado[] = [];

  constructor(private adminData: AdminDataService) {}

  ngOnInit(): void {
    this.refrescar();
  }

  refrescar(): void {
    this.pedidos = this.adminData.getPedidosHoy();
  }

  setEstado(p: PedidoGuardado, estado: PedidoEstado): void {
    this.adminData.updatePedidoEstado(p.id, estado);
    this.refrescar();
  }

  mapaUrl(p: PedidoGuardado): string {
    const q = `${p.direccion}, ${p.localidad}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  }
}
