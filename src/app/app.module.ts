import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app.routing';
import { ComponentsModule } from './components/components.module';
import { AppComponent } from './app.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { CatalogoComponent } from './public/catalogo/catalogo.component';
import { CheckoutComponent } from './public/checkout/checkout.component';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { BrowserModule, Title, Meta } from '@angular/platform-browser';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';


@NgModule({
  imports: [
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ComponentsModule,
    RouterModule,
    AppRoutingModule,

        // 🔥 Firebase inicializado con environment
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
  ],
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    CatalogoComponent,
    CheckoutComponent,
    PublicLayoutComponent
  ],
  providers: [Title, Meta],
  bootstrap: [AppComponent]
})
export class AppModule { }
