import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ZonaPage } from './zona.page';

const routes: Routes = [
  {
    path: '',
    component: ZonaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ZonaPageRoutingModule {}
