import { Component, OnInit } from '@angular/core';
import { AdminDataService, Producto, StockHoy } from '../../services/admin-data.service';

type Row = Producto & {
  precioPorCajon: number;
  stockCajones: number;
  publicado: boolean;
};

@Component({
  selector: 'app-stock-hoy',
  templateUrl: './stock-hoy.component.html',
})
export class StockHoyComponent implements OnInit {
  fecha = '';
  rows: Row[] = [];

  displayedColumns = ['producto', 'stock', 'precio', 'estado'];

  constructor(private data: AdminDataService) {}

  ngOnInit(): void {
    this.data.ensureDemoProductos();
    this.fecha = this.data.hoy();

    const productos = this.data.getProductos().filter(p => p.activo);
    const stock = this.data.getStockHoy();
    const byId = new Map(stock.map(s => [s.productoId, s]));

    this.rows = productos.map(p => {
      const s = byId.get(p.id);
      return {
        ...p,
        precioPorCajon: s?.precioPorCajon ?? 0,
        stockCajones: s?.stockCajones ?? 0,
        publicado: s?.publicado ?? false,
      };
    });
  }

onChange(row: Row): void {
  this.data.upsertStockHoy({
    productoId: row.id,
    stockCajones: Number(row.stockCajones) || 0,
    precioPorCajon: Number(row.precioPorCajon) || 0,
    publicado: row.publicado, // respeta el estado actual
  });
}


publicar(): void {
  for (const r of this.rows) {
    const stock = Number(r.stockCajones) || 0;
    const precio = Number(r.precioPorCajon) || 0;

    const valido = stock > 0 && precio > 0;
    r.publicado = valido;

    this.data.upsertStockHoy({
      productoId: r.id,
      stockCajones: stock,
      precioPorCajon: precio,
      publicado: r.publicado,
    });
  }
}

}
