import { Component, OnInit } from '@angular/core';
import { PedidosDataService, Pedido, PedidoEstado } from '../../services/pedidos-data.service';

type FiltroEstado = 'todos' | PedidoEstado;

@Component({
  selector: 'app-pedidos-hoy',
  templateUrl: './pedidos-hoy.component.html',
  styleUrls: ['./pedidos-hoy.component.scss']
})
export class PedidosHoyComponent implements OnInit {

  pedidos: Pedido[] = [];
  pedidosView: Pedido[] = [];

  // UI
  filtro: FiltroEstado = 'todos';
  busqueda = ''; // por teléfono / comercio / dirección / id
  soloNoEntregados = true;

  // para avisos bonitos
  private readonly numeroPalteria = '5491157325189';

  constructor(private pedidosData: PedidosDataService) {}

  ngOnInit(): void {
    this.refrescar();
  }

  refrescar(): void {
    this.pedidos = this.pedidosData.getPedidosHoy();
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    const q = (this.busqueda || '').trim().toLowerCase();

    let arr = [...this.pedidos];

    // 1) filtro por estado
    if (this.filtro !== 'todos') {
      arr = arr.filter(p => p.estado === this.filtro);
    }

    // 2) opcional: ocultar entregados/cancelados
    if (this.soloNoEntregados) {
      arr = arr.filter(p => p.estado !== 'entregado' && p.estado !== 'cancelado');
    }

    // 3) búsqueda full-text
    if (q) {
      arr = arr.filter(p => {
        const hay = [
          p.id,
          p.cliente.telefono,
          p.cliente.comercio || '',
          p.cliente.direccion,
          p.cliente.localidad
        ].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    // 4) orden de prioridad (sin geolocalizar todavía)
    //    - primero pendientes, luego preparando, luego en camino, luego entregado/cancelado
    //    - dentro del mismo estado: más viejos primero (para despachar FIFO)
    arr.sort((a, b) => {
      const pa = this.prioridadEstado(a.estado);
      const pb = this.prioridadEstado(b.estado);
      if (pa !== pb) return pa - pb;
      return a.creadoISO.localeCompare(b.creadoISO);
    });

    this.pedidosView = arr;
  }

  // ======= Acciones =======

  setEstado(p: Pedido, estado: PedidoEstado): void {
    this.pedidosData.setEstado(p.id, estado);
    this.refrescar();
  }

  siguienteEstado(p: Pedido): void {
    const next = this.next(p.estado);
    this.setEstado(p, next);
  }

  borrar(p: Pedido): void {
    if (!confirm(`¿Borrar pedido ${p.id}?`)) return;
    this.pedidosData.borrarPedido(p.id);
    this.refrescar();
  }

  // ======= WhatsApp “bonito” (al cliente) =======
  // Nota: hoy no tenemos WA business API, esto abre wa.me listo para enviar.
  avisarCliente(p: Pedido): void {
    const tel = this.normalizarTelParaWa(p.cliente.telefono);
    if (!tel) {
      alert('No pude armar el teléfono para WhatsApp. Revisá el número del cliente.');
      return;
    }

    const msg = this.mensajeEstado(p);
    const url = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  // ======= Helpers =======

  labelEstado(e: PedidoEstado): string {
    switch (e) {
      case 'pendiente': return 'Pendiente';
      case 'preparando': return 'Preparando';
      case 'en_camino': return 'En camino';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      default: return e;
    }
  }

  labelSiguiente(e: PedidoEstado): string {
    switch (e) {
      case 'pendiente': return 'Pasar a Preparando';
      case 'preparando': return 'Pasar a En camino';
      case 'en_camino': return 'Marcar Entregado';
      default: return 'Actualizar';
    }
  }

  private next(e: PedidoEstado): PedidoEstado {
    switch (e) {
      case 'pendiente': return 'preparando';
      case 'preparando': return 'en_camino';
      case 'en_camino': return 'entregado';
      default: return e;
    }
  }

  private prioridadEstado(e: PedidoEstado): number {
    switch (e) {
      case 'pendiente': return 1;
      case 'preparando': return 2;
      case 'en_camino': return 3;
      case 'entregado': return 9;
      case 'cancelado': return 10;
      default: return 50;
    }
  }

  private normalizarTelParaWa(raw: string): string {
    // Para Argentina: si te pasan 11 1234-5678 => 54911...
    // Si ya viene con 54... lo deja.
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';

    // si ya viene con 54 y tiene pinta de celular
    if (digits.startsWith('54')) return digits;

    // si es 11 dígitos (ej 11 + 8 dígitos), asumimos AMBA móvil
    // wa requiere 549 + area + numero (sin 15)
    // (es un heurístico, para “sin engorro”)
    if (digits.length >= 10) return '549' + digits;

    // último recurso: devolvemos tal cual
    return digits;
  }

  private mensajeEstado(p: Pedido): string {
    const nombre = p.cliente.comercio ? ` (${p.cliente.comercio})` : '';
    const total = `${p.totalCajones} cajones · ${p.totalEstimado} ARS`;
    const base = `Hola! Soy La Paltería${nombre}.`;

    switch (p.estado) {
      case 'preparando':
        return `${base}\n✅ Tu pedido ${p.id} está en preparación.\n📦 ${total}\nTe avisamos cuando salga a reparto.`;
      case 'en_camino':
        return `${base}\n🚚 Tu pedido ${p.id} ya está en camino.\n📍 Entrega: ${p.cliente.direccion}, ${p.cliente.localidad}\n📦 ${total}`;
      case 'entregado':
        return `${base}\n✅ Pedido ${p.id} entregado. ¡Gracias por comprar!\nSi querés repetir pedido, entrás al catálogo y en 1 minuto lo armás.`;
      case 'pendiente':
      default:
        return `${base}\n📩 Recibimos tu pedido ${p.id}.\n📦 ${total}\nEn breve lo confirmamos y lo preparamos.`;
    }
  }
}
