import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PedidoService, Producto } from '../../services/pedido.service';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { AdminDataService } from '../../admin/services/admin-data.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss']
})
export class CatalogoComponent implements OnInit {

  @ViewChild('catalogoGrid') catalogoGrid?: ElementRef<HTMLElement>;

  productos: Producto[] = [];

  animandoProductoId: number | null = null;
  animandoTotal = false;

  hoyLabel = '';
  mostrarHeroGrande = false;

  private readonly KEY_HERO_VISTO = 'palteria_hero_visto';

  constructor(
    public pedidoService: PedidoService,
    private adminData: AdminDataService,
    private router: Router,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    // Catálogo: ya filtrado por “publicado hoy”
    this.productos = this.adminData.getCatalogoHoyPublicado() as unknown as Producto[];

    // Fecha visible “hoy”
    this.hoyLabel = this.formatHoy();

    // Hero: solo para primera visita (o si no hay stock)
    const heroVisto = localStorage.getItem(this.KEY_HERO_VISTO) === 'true';
    this.mostrarHeroGrande = !heroVisto && this.productos.length > 0;

    this.title.setTitle('Paltería Mayorista · Catálogo de paltas');
    this.meta.updateTag({
      name: 'description',
      content: 'Armá tu pedido mayorista de paltas Hass para tu verdulería o comercio. Precios por cajón y stock real.'
    });
  }

  // ========= UX helpers =========

  marcarHeroVistoYBajar(): void {
    localStorage.setItem(this.KEY_HERO_VISTO, 'true');
    this.mostrarHeroGrande = false;
    this.scrollToCatalog();
  }

  scrollToCatalog(): void {
    const el = this.catalogoGrid?.nativeElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // stock (si existe en el modelo publicado)
  stockDe(p: Producto): number | null {
    const s = (p as any)?.stockCajones;
    if (s === undefined || s === null) return null;
    const n = Number(s);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  // ========= carrito =========

  cantidadDe(p: Producto): number {
    return this.pedidoService.getItems()
      .find(i => i.producto.id === p.id)?.cantidadCajones || 0;
  }

  sumar(p: Producto): void {
    // si hay stock (y es 0) no sumar
    const stock = this.stockDe(p);
    if (stock === 0) return;

    this.pedidoService.agregarProducto(p);
    this.dispararAnimaciones(p.id);

    // después de la primera acción, ya lo consideramos “recurrente”
    localStorage.setItem(this.KEY_HERO_VISTO, 'true');
    this.mostrarHeroGrande = false;
  }

  restar(p: Producto): void {
    this.pedidoService.quitarProducto(p);
    this.dispararAnimaciones(p.id);
  }

  totalCajones(): number {
    return this.pedidoService.getTotalCajones();
  }

  totalEstimado(): number {
    return this.pedidoService.getTotalEstimado();
  }

  irAlCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  private dispararAnimaciones(productoId: number): void {
    this.animandoProductoId = productoId;
    this.animandoTotal = true;

    setTimeout(() => (this.animandoProductoId = null), 200);
    setTimeout(() => (this.animandoTotal = false), 220);
  }

  private formatHoy(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
}
