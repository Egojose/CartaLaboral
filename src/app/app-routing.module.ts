import { NgModule, Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { CartaLaboralComponent } from './carta-laboral/carta-laboral.component';
import { NominaComponent } from './nomina/nomina.component';


const routes: Routes = [
  {path: 'CartaLaboral', component: CartaLaboralComponent},
  // { path: '', redirectTo: 'Carta-laboral/:id/:salario/:funciones/:dirigidoA', pathMatch: 'full' },
  // { path: 'Carta-laboral/:id/:salario/:funciones/:dirigidoA', component: CartaLaboralComponent },
  {path:'nomina', component: NominaComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
