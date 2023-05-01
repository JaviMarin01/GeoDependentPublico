import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NuevazonaPageRoutingModule } from './nuevazona-routing.module';

import { NuevazonaPage } from './nuevazona.page';
import { CommonsModule } from '../../commons/commons.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NuevazonaPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [NuevazonaPage]
})
export class NuevazonaPageModule {}
