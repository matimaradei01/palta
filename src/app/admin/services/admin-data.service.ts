import { Injectable } from '@angular/core';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  kilosPorCajon: number;
  imagenUrl?: string;
  activo: boolean;
}

export interface StockHoy {
  productoId: number;
  fecha: string; // YYYY-MM-DD
  precioPorCajon: number;
  stockCajones: number;
  publicado: boolean;
}

export type PedidoEstado = 'pendiente' | 'en_camino' | 'entregado' | 'cancelado';

export interface PedidoGuardado {
  id: string;
  fecha: string;        // YYYY-MM-DD
  creadoISO: string;    // fecha/hora exacta
  clienteTelefono: string;

  comercio?: string;
  direccion: string;
  localidad: string;
  horario?: string;     // mañana|mediodia|tarde|''
  necesitaFactura?: boolean;
  cuit?: string;
  notas?: string;

  items: Array<{
    productoId: number;
    nombre: string;
    kilosPorCajon: number;
    precioPorCajon: number;
    cantidadCajones: number;
  }>;

  totalCajones: number;
  totalEstimado: number;

  estado: PedidoEstado;
}


@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private KEY_PROD = 'palteria_productos';
  private KEY_STOCK = 'palteria_stock';

  hoy(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  getProductos(): Producto[] {
    return this.read<Producto[]>(this.KEY_PROD, []);
  }

  // por ahora: si no hay productos, crea demo
  ensureDemoProductos(): void {
    const p = this.getProductos();
    if (p.length) return;
    this.write(this.KEY_PROD, [
      { id: 1, nombre: 'Cajón 10kg – Hass Export', descripcion: 'Selección premium.', kilosPorCajon: 10, imagenUrl: '', activo: true },
      { id: 2, nombre: 'Cajón 8kg – Hass Nacional', descripcion: 'Ideal verdulería.', kilosPorCajon: 8, imagenUrl: '', activo: true },
      { id: 3, nombre: 'Cajón 18kg – Industria', descripcion: 'Mix para industria.', kilosPorCajon: 18, imagenUrl: '', activo: true },
    ] as Producto[]);
  }

  getStockHoy(): StockHoy[] {
    const fecha = this.hoy();
    const all = this.read<StockHoy[]>(this.KEY_STOCK, []);
    return all.filter(s => s.fecha === fecha);
  }

  upsertStockHoy(row: Omit<StockHoy, 'fecha'>): void {
    const fecha = this.hoy();
    const all = this.read<StockHoy[]>(this.KEY_STOCK, []);
    const idx = all.findIndex(s => s.fecha === fecha && s.productoId === row.productoId);
    const value: StockHoy = { fecha, ...row };
    if (idx >= 0) all[idx] = value; else all.push(value);
    this.write(this.KEY_STOCK, all);
  }

  publicarHoy(): void {
    const fecha = this.hoy();
    const all = this.read<StockHoy[]>(this.KEY_STOCK, []);
    this.write(this.KEY_STOCK, all.map(s => s.fecha === fecha ? ({ ...s, publicado: true }) : s));
  }

  private read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  getCatalogoHoyPublicado(): Array<Producto & { precioPorCajon: number; stockCajones: number }> {
  const productos = this.getProductos().filter(p => p.activo);

  const fecha = this.hoy();
  const allStock = this.read<StockHoy[]>(this.KEY_STOCK, []);
  const stockHoyPublicado = allStock
    .filter(s => s.fecha === fecha && s.publicado);

  const byId = new Map(stockHoyPublicado.map(s => [s.productoId, s]));

  return productos
    .map(p => {
      const s = byId.get(p.id);
      if (!s) return null;
      return {
        ...p,
        precioPorCajon: s.precioPorCajon,
        stockCajones: s.stockCajones,
      };
    })
    .filter((x): x is (Producto & { precioPorCajon: number; stockCajones: number }) => !!x)
    .filter(x => x.stockCajones > 0 && x.precioPorCajon > 0);
}
private KEY_PEDIDOS = 'palteria_pedidos';

addPedido(p: Omit<PedidoGuardado, 'id' | 'fecha'>): void {
  const all = this.read<PedidoGuardado[]>(this.KEY_PEDIDOS, []);
  const pedido: PedidoGuardado = {
    ...p,
    id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
    fecha: this.hoy(),
  };
  all.push(pedido);
  this.write(this.KEY_PEDIDOS, all);
}

getPedidosHoy(): PedidoGuardado[] {
  const fecha = this.hoy();
  const all = this.read<PedidoGuardado[]>(this.KEY_PEDIDOS, []);
  // más nuevos arriba
  return all
    .filter(x => x.fecha === fecha)
    .sort((a, b) => b.creadoISO.localeCompare(a.creadoISO));
}

updatePedidoEstado(id: string, estado: PedidoEstado): void {
  const all = this.read<PedidoGuardado[]>(this.KEY_PEDIDOS, []);
  const idx = all.findIndex(p => p.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], estado };
    this.write(this.KEY_PEDIDOS, all);
  }
}

}
