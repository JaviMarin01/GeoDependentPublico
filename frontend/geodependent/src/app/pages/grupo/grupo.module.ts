import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GrupoPageRoutingModule } from './grupo-routing.module';

import { GrupoPage } from './grupo.page';
import { CommonsModule } from '../../commons/commons.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GrupoPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [GrupoPage]
})
export class GrupoPageModule {}
