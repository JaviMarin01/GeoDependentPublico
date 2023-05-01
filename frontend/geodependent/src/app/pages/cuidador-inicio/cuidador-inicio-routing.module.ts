import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CuidadorInicioPage } from './cuidador-inicio.page';

const routes: Routes = [
  {
    path: '',
    component: CuidadorInicioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuidadorInicioPageRoutingModule {}
