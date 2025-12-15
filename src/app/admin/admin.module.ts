import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';

import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { StockHoyComponent } from './pages/stock-hoy/stock-hoy.component';
import { PedidosHoyComponent } from './pages/pedidos-hoy/pedidos-hoy.component';


@NgModule({
  declarations: [
    StockHoyComponent,
    PedidosHoyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AdminRoutingModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class AdminModule {}
