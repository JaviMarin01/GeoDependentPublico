import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NuevogrupoPage } from './nuevogrupo.page';

const routes: Routes = [
  {
    path: '',
    component: NuevogrupoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NuevogrupoPageRoutingModule {}
