import { Injectable } from '@angular/core';

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precioPorCajon: number;
  kilosPorCajon: number;
  imagenUrl?: string;
}

export interface PedidoItem {
  producto: Producto;
  cantidadCajones: number;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  // mantenemos SIEMPRE la misma referencia del array
  private items: PedidoItem[] = [];
  // podés borrar esto si no lo usás más
  private minimoCajones = 0;

  getProductosMock(): Producto[] {
    return [
      {
        id: 1,
        nombre: 'Cajón 10kg – Hass Export',
        descripcion: 'Selección premium.',
        precioPorCajon: 25000,
        kilosPorCajon: 10,
        imagenUrl: 'assets/img/productos/palta.webp'
      },
      {
        id: 2,
        nombre: 'Cajón 8kg – Hass Nacional',
        descripcion: 'Ideal verdulería.',
        precioPorCajon: 20000,
        kilosPorCajon: 8,
        imagenUrl: 'assets/img/productos/palta.webp'
      },
      {
        id: 3,
        nombre: 'Cajón 18kg – Industria',
        descripcion: 'Mix para industria.',
        precioPorCajon: 35000,
        kilosPorCajon: 18,
        imagenUrl: 'assets/img/productos/palta.webp'
      }
    ];
  }

  getItems(): PedidoItem[] {
    return this.items;
  }

  agregarProducto(producto: Producto): void {
    const existente = this.items.find(i => i.producto.id === producto.id);
    if (existente) {
      existente.cantidadCajones++;
    } else {
      this.items.push({ producto, cantidadCajones: 1 });
    }
  }

  quitarProducto(producto: Producto): void {
    const index = this.items.findIndex(i => i.producto.id === producto.id);
    if (index === -1) return;

    this.items[index].cantidadCajones--;

    if (this.items[index].cantidadCajones <= 0) {
      // mutamos el array, NO lo reasignamos
      this.items.splice(index, 1);
    }
  }

  eliminarProducto(productoId: number): void {
    const index = this.items.findIndex(i => i.producto.id === productoId);
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  getTotalCajones(): number {
    return this.items.reduce((acc, it) => acc + it.cantidadCajones, 0);
  }

  getTotalEstimado(): number {
    return this.items.reduce(
      (acc, it) => acc + it.cantidadCajones * it.producto.precioPorCajon,
      0
    );
  }

  limpiar(): void {
    // vaciamos manteniendo la referencia del array
    this.items.splice(0, this.items.length);
  }
}
