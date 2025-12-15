import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StockHoyComponent } from './pages/stock-hoy/stock-hoy.component';
import { PedidosHoyComponent } from './pages/pedidos-hoy/pedidos-hoy.component';

const routes: Routes = [
  { path: 'stock-hoy', component: StockHoyComponent },
  { path: 'pedidos-hoy', component: PedidosHoyComponent },

  { path: '', redirectTo: 'stock-hoy', pathMatch: 'full' },
  { path: '**', redirectTo: 'stock-hoy' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
