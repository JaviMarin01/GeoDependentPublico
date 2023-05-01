import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NuevazonaPage } from './nuevazona.page';

const routes: Routes = [
  {
    path: '',
    component: NuevazonaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NuevazonaPageRoutingModule {}
