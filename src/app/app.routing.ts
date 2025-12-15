import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { CatalogoComponent } from './public/catalogo/catalogo.component';
import { CheckoutComponent } from './public/checkout/checkout.component';

const routes: Routes = [
  // ZONA PÚBLICA (con su propio layout)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: CatalogoComponent },
      { path: 'checkout', component: CheckoutComponent },
    ],
  },

  // ZONA ADMIN
{
  path: 'admin',
  component: AdminLayoutComponent,
  children: [
    {
      path: '',
      loadChildren: () =>
        import('./admin/admin.module').then((m) => m.AdminModule),
    },
  ],
},


  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
