import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ZonaPageRoutingModule } from './zona-routing.module';

import { ZonaPage } from './zona.page';
import { CommonsModule } from 'src/app/commons/commons.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ZonaPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [ZonaPage]
})
export class ZonaPageModule {}
