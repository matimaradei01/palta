import { Component, OnInit } from '@angular/core';
import { PedidoService, PedidoItem } from '../../services/pedido.service';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { AdminDataService } from '../../admin/services/admin-data.service';
import { PedidosDataService } from '../../admin/services/pedidos-data.service';


type Cliente = {
  id: string; // teléfono normalizado (solo dígitos)
  telefono: string; // guardamos normalizado también
  comercio?: string;
  direccion: string;
  localidad: string;
  horario?: string; // 'mañana' | 'mediodia' | 'tarde' | ''
  cuit?: string; // 11 dígitos
  ultimaCompraISO?: string;
};

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {

  items: PedidoItem[] = [];
  

  private readonly numeroPalteria = '5491157325189';

  // storage keys (sin backend)
  private readonly KEY_CLIENTES = 'palteria_clientes';
  private readonly KEY_LAST_PHONE = 'palteria_last_phone';

  // UI: bloquea teléfono si autocompleta cliente existente
  telefonoBloqueado = false;

  form = {
    // opcionales
    comercio: '',
    horario: '', // '' | 'mañana' | 'mediodia' | 'tarde'
    notas: '',

    // factura condicional
    cuit: '',

    // obligatorios
    telefono: '',
    direccion: '',
    localidad: '',

    // flags de UI
    mostrarOpcionales: false,
    necesitaFactura: false
  };

  formErrors: { [k: string]: string } = {};
  animandoResumen = false;

  constructor(
    private pedidosData: PedidosDataService,
    public pedidoService: PedidoService,
    private router: Router,
    private title: Title,
    private meta: Meta,
    private adminData: AdminDataService
  ) {}

  ngOnInit(): void {
    this.refrescarItems();

    if (this.items.length === 0) {
      this.router.navigate(['/']);
      return;
    }

    // si ya usó antes, precargamos el teléfono SOLO si existe el cliente
    const lastPhone = localStorage.getItem(this.KEY_LAST_PHONE);
    if (lastPhone && this.findClienteByTelefono(lastPhone)) {
      this.form.telefono = lastPhone;
      this.onTelefonoBlur(); // autocompleta y bloquea
    }

    this.title.setTitle('Paltería Mayorista · Confirmar pedido');
    this.meta.updateTag({
      name: 'description',
      content: 'Confirmá los datos mínimos de entrega y enviá tu pedido mayorista de paltas por WhatsApp.'
    });
  }

  // =====================
  //  PEDIDO (sync)
  // =====================

  private refrescarItems(): void {
    this.items = this.pedidoService.getItems();
  }

  sumar(item: PedidoItem): void {
    this.pedidoService.agregarProducto(item.producto);
    this.refrescarItems();
    this.dispararAnimacionResumen();
  }

  restar(item: PedidoItem): void {
    this.pedidoService.quitarProducto(item.producto);
    this.refrescarItems();
    this.dispararAnimacionResumen();

    if (this.items.length === 0) {
      this.router.navigate(['/']);
    }
  }

  eliminarItem(item: PedidoItem): void {
    this.pedidoService.eliminarProducto(item.producto.id);
    this.refrescarItems();
    this.dispararAnimacionResumen();

    if (this.items.length === 0) {
      this.router.navigate(['/']);
    }
  }

  volverAlCatalogo(): void {
    this.router.navigate(['/']);
  }

  private dispararAnimacionResumen(): void {
    this.animandoResumen = true;
    setTimeout(() => (this.animandoResumen = false), 220);
  }

  // =====================
  //  CLIENTES (storage)
  // =====================

  private normalizarTelefono(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  private normalizarCuit(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  private getClientes(): Cliente[] {
    try {
      const raw = localStorage.getItem(this.KEY_CLIENTES);
      return raw ? (JSON.parse(raw) as Cliente[]) : [];
    } catch {
      return [];
    }
  }

  private saveClientes(clientes: Cliente[]): void {
    localStorage.setItem(this.KEY_CLIENTES, JSON.stringify(clientes));
  }

  private findClienteByTelefono(telefono: string): Cliente | undefined {
    const id = this.normalizarTelefono(telefono);
    if (!id) return undefined;
    return this.getClientes().find(c => c.id === id);
  }

  private upsertClienteFromForm(): void {
    const id = this.normalizarTelefono(this.form.telefono);
    if (!id) return;

    const clientes = this.getClientes();
    const idx = clientes.findIndex(c => c.id === id);

    const cliente: Cliente = {
      id,
      telefono: id, // guardamos normalizado
      comercio: this.form.comercio?.trim() || undefined,
      direccion: (this.form.direccion || '').trim(),
      localidad: (this.form.localidad || '').trim(),
      horario: (this.form.horario || '').trim() || undefined,
      cuit: this.form.necesitaFactura ? (this.normalizarCuit(this.form.cuit) || undefined) : undefined,
      ultimaCompraISO: new Date().toISOString()
    };

    if (idx >= 0) clientes[idx] = { ...clientes[idx], ...cliente };
    else clientes.push(cliente);

    this.saveClientes(clientes);
    localStorage.setItem(this.KEY_LAST_PHONE, id); // guardamos normalizado
  }

  /**
   * Llamalo desde el input teléfono con (blur)="onTelefonoBlur()"
   * para autocompletar dirección/localidad y opcionales.
   */
  onTelefonoBlur(): void {
    const tel = this.form.telefono?.trim();
    if (!tel) return;

    const cliente = this.findClienteByTelefono(tel);
    if (!cliente) {
      this.telefonoBloqueado = false;
      return;
    }

    // guardamos el teléfono en formato normalizado
    this.form.telefono = cliente.telefono;

    // autocompleta solo si están vacíos
    if (!this.form.direccion?.trim()) this.form.direccion = cliente.direccion || '';
    if (!this.form.localidad?.trim()) this.form.localidad = cliente.localidad || '';

    if (cliente.comercio && !this.form.comercio?.trim()) {
      this.form.comercio = cliente.comercio;
      this.form.mostrarOpcionales = true;
    }

    if (cliente.horario && !this.form.horario?.trim()) {
      this.form.horario = cliente.horario;
      this.form.mostrarOpcionales = true;
    }

    if (cliente.cuit && !this.form.cuit?.trim()) {
      this.form.cuit = cliente.cuit;
    }

    this.telefonoBloqueado = true;
  }

  desbloquearTelefono(): void {
    this.telefonoBloqueado = false;
    this.form.telefono = '';
  }

  // =====================
  //  VALIDACIONES
  // =====================

  private limpiarErrores(): void {
    this.formErrors = {};
  }

  private validarTelefono(valor: string): boolean {
    const n = this.normalizarTelefono(valor);
    // Argentina: flexible pero razonable
    return n.length >= 10 && n.length <= 13;
  }

  private validarCuit(valor: string): boolean {
    const n = this.normalizarCuit(valor);
    return /^\d{11}$/.test(n);
  }

  validarFormulario(): boolean {
    this.limpiarErrores();

    // Teléfono obligatorio
    if (!this.form.telefono?.trim()) {
      this.formErrors.telefono = 'El teléfono es obligatorio.';
    } else if (!this.validarTelefono(this.form.telefono)) {
      this.formErrors.telefono = 'Ingresá un teléfono válido (10 a 13 dígitos).';
    }

    // Dirección obligatoria
    if (!this.form.direccion?.trim()) {
      this.formErrors.direccion = 'La dirección de entrega es obligatoria.';
    }

    // Localidad obligatoria
    if (!this.form.localidad?.trim()) {
      this.formErrors.localidad = 'La localidad es obligatoria.';
    }

    // CUIT solo si pide factura
    if (this.form.necesitaFactura) {
      if (!this.form.cuit?.trim()) {
        this.formErrors.cuit = 'El CUIT es obligatorio si pedís factura.';
      } else if (!this.validarCuit(this.form.cuit)) {
        this.formErrors.cuit = 'El CUIT debe tener 11 dígitos numéricos.';
      }
    }

    return Object.keys(this.formErrors).length === 0;
  }

  // =====================
  //  WHATSAPP MENSAJE
  // =====================

  private labelHorario(valor: string): string {
    switch (valor) {
      case 'mañana': return 'Mañana (9 a 12)';
      case 'mediodia': return 'Mediodía (12 a 15)';
      case 'tarde': return 'Tarde (15 a 18)';
      default: return 'Lo antes posible';
    }
  }

  confirmarPedido(): void {
    if (this.items.length === 0) return;
    if (!this.validarFormulario()) return;

    // guarda/actualiza cliente para próximas compras (sin backend)
    this.upsertClienteFromForm();

    const tel = this.form.telefono; // ya normalizado

    let mensaje =
      `*Nuevo pedido mayorista*%0A%0A` +
      `*Teléfono:* ${encodeURIComponent(tel)}%0A` +
      `*Dirección:* ${encodeURIComponent(this.form.direccion)}%0A` +
      `*Localidad:* ${encodeURIComponent(this.form.localidad)}%0A`;

    if (this.form.comercio?.trim()) {
      mensaje += `*Comercio:* ${encodeURIComponent(this.form.comercio)}%0A`;
    }
    if ((this.form.horario || '').trim()) {
      mensaje += `*Horario:* ${encodeURIComponent(this.labelHorario(this.form.horario))}%0A`;
    }
    if (this.form.necesitaFactura && this.form.cuit?.trim()) {
      mensaje += `*CUIT:* ${encodeURIComponent(this.normalizarCuit(this.form.cuit))}%0A`;
    }

    mensaje += `%0A*Detalle del pedido:*%0A`;

    this.items.forEach(it => {
      const kgTotales = it.producto.kilosPorCajon * it.cantidadCajones;
      const totalItem = it.producto.precioPorCajon * it.cantidadCajones;

      mensaje += `• ${it.cantidadCajones} x ${encodeURIComponent(it.producto.nombre)} `
        + `(${kgTotales} kg) - $${totalItem}%0A`;
    });

    mensaje += `%0A*Total estimado:* $${this.pedidoService.getTotalEstimado()}%0A`;

    if (this.form.notas?.trim()) {
      mensaje += `%0A*Notas:* ${encodeURIComponent(this.form.notas)}%0A`;
    }

    const url = `https://wa.me/${this.numeroPalteria}?text=${mensaje}`;

// ✅ Guardar pedido para el administrador (sin WhatsApp al negocio)
this.pedidosData.crearPedido({
  id: crypto?.randomUUID ? crypto.randomUUID() : `P-${Date.now()}`,
  creadoISO: new Date().toISOString(),
  estado: 'pendiente',
  cliente: {
    telefono: this.form.telefono,
    comercio: this.form.comercio || undefined,
    direccion: this.form.direccion,
    localidad: this.form.localidad,
    horario: this.form.horario || undefined,
    cuit: this.form.necesitaFactura ? (this.normalizarCuit(this.form.cuit) || undefined) : undefined,
  },
  items: this.items.map(it => ({
    productoId: it.producto.id,
    nombre: it.producto.nombre,
    kilosPorCajon: it.producto.kilosPorCajon,
    precioPorCajon: it.producto.precioPorCajon,
    cantidadCajones: it.cantidadCajones,
  })),
  totalCajones: this.pedidoService.getTotalCajones(),
  totalEstimado: this.pedidoService.getTotalEstimado(),
});


    this.pedidoService.limpiar();
    this.router.navigate(['/']);
  }
}
