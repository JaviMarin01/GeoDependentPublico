import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DependienteInicioPage } from './dependiente-inicio.page';

const routes: Routes = [
  {
    path: '',
    component: DependienteInicioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DependienteInicioPageRoutingModule {}
