import { Injectable } from '@angular/core';

export type PedidoEstado =
  | 'pendiente'
  | 'preparando'
  | 'en_camino'
  | 'entregado'
  | 'cancelado';

export interface PedidoItem {
  productoId: number;
  nombre: string;
  kilosPorCajon: number;
  precioPorCajon: number;
  cantidadCajones: number;
}

export interface ClientePedido {
  telefono: string;
  comercio?: string;
  direccion: string;
  localidad: string;
  horario?: string;
  cuit?: string;
}

export interface Pedido {
  id: string;
  creadoISO: string;
  estado: PedidoEstado;
  cliente: ClientePedido;
  items: PedidoItem[];
  totalCajones: number;
  totalEstimado: number;
}

/**
 * Formato viejo (el que estabas guardando desde AdminDataService.addPedido)
 * Lo soportamos para migrar sin romper nada.
 */
type PedidoGuardadoViejo = {
  id: string;
  fecha?: string; // YYYY-MM-DD
  creadoISO: string;
  clienteTelefono?: string;

  comercio?: string;
  direccion?: string;
  localidad?: string;
  horario?: string;
  cuit?: string;
  notas?: string;

  items?: PedidoItem[];
  totalCajones?: number;
  totalEstimado?: number;
  estado?: PedidoEstado;
};

@Injectable({ providedIn: 'root' })
export class PedidosDataService {
  private readonly KEY = 'palteria_pedidos';

  // =====================
  //  CRUD BÁSICO
  // =====================

  getPedidosHoy(): Pedido[] {
    const hoy = this.hoyISO();
    const all = this.readNormalizado();
    // si querés: más nuevos arriba
    return all
      .filter(p => (p.creadoISO || '').startsWith(hoy))
      .sort((a, b) => b.creadoISO.localeCompare(a.creadoISO));
  }

  crearPedido(pedido: Pedido): void {
    const all = this.readNormalizado();
    all.push(pedido);
    this.write(all);
  }

  setEstado(id: string, estado: PedidoEstado): void {
    const all = this.readNormalizado();
    const idx = all.findIndex(x => x.id === id);
    if (idx < 0) return;
    all[idx] = { ...all[idx], estado };
    this.write(all);
  }

  borrarPedido(id: string): void {
    const all = this.readNormalizado().filter(p => p.id !== id);
    this.write(all);
  }

  // =====================
  //  HELPERS
  // =====================

  private hoyISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Lee de localStorage y:
   * - si ya está en formato Pedido -> OK
   * - si está en formato viejo -> lo convierte a Pedido
   */
  private readNormalizado(): Pedido[] {
    const raw = this.readAny();
    const normalizados: Pedido[] = raw
      .map((x: any) => this.toPedido(x))
      .filter((x): x is Pedido => !!x);

    // Si detecto que había viejos, re-escribo ya normalizado (migración)
    const habiaViejos = raw.some((x: any) => !x?.cliente && (x?.clienteTelefono || x?.direccion || x?.localidad));
    if (habiaViejos) {
      this.write(normalizados);
    }

    return normalizados;
  }

  private toPedido(x: any): Pedido | null {
    // Caso nuevo (correcto)
    if (x?.cliente && Array.isArray(x?.items)) {
      return {
        id: String(x.id || ''),
        creadoISO: String(x.creadoISO || new Date().toISOString()),
        estado: (x.estado as PedidoEstado) || 'pendiente',
        cliente: {
          telefono: String(x.cliente.telefono || ''),
          comercio: x.cliente.comercio || undefined,
          direccion: String(x.cliente.direccion || ''),
          localidad: String(x.cliente.localidad || ''),
          horario: x.cliente.horario || undefined,
          cuit: x.cliente.cuit || undefined,
        },
        items: (x.items as PedidoItem[]) || [],
        totalCajones: Number(x.totalCajones || 0),
        totalEstimado: Number(x.totalEstimado || 0),
      };
    }

    // Caso viejo (PedidoGuardadoViejo)
    const v = x as PedidoGuardadoViejo;
    const tel = (v.clienteTelefono || '').toString();

    // Si ni siquiera tengo dirección/localidad, igual lo dejo “como pueda”
    const direccion = (v.direccion || '').toString();
    const localidad = (v.localidad || '').toString();

    return {
      id: String(v.id || ''),
      creadoISO: String(v.creadoISO || new Date().toISOString()),
      estado: (v.estado as PedidoEstado) || 'pendiente',
      cliente: {
        telefono: tel,
        comercio: v.comercio || undefined,
        direccion,
        localidad,
        horario: v.horario || undefined,
        cuit: v.cuit || undefined,
      },
      items: Array.isArray(v.items) ? v.items : [],
      totalCajones: Number(v.totalCajones || 0),
      totalEstimado: Number(v.totalEstimado || 0),
    };
  }

  private readAny(): any[] {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? (JSON.parse(raw) as any[]) : [];
    } catch {
      return [];
    }
  }

  private write(value: Pedido[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(value));
  }
}
