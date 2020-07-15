import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { CartaLaboralComponent } from './carta-laboral/carta-laboral.component';

const routes: Routes = [
  {path: 'CartaLaboral', component: CartaLaboralComponent}
  // { path: '', redirectTo: 'Carta-laboral/:id/:salario/:funciones/:dirigidoA', pathMatch: 'full' },
  // { path: 'Carta-laboral/:id/:salario/:funciones/:dirigidoA', component: CartaLaboralComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
