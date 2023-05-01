import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NuevogrupoPageRoutingModule } from './nuevogrupo-routing.module';

import { NuevogrupoPage } from './nuevogrupo.page';
import { CommonsModule } from '../../commons/commons.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NuevogrupoPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [NuevogrupoPage]
})
export class NuevogrupoPageModule {}
