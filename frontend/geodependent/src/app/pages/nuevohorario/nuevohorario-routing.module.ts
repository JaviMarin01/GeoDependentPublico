import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NuevohorarioPage } from './nuevohorario.page';

const routes: Routes = [
  {
    path: '',
    component: NuevohorarioPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NuevohorarioPageRoutingModule {}
