import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PerfilPageRoutingModule } from './perfil-routing.module';

import { PerfilPage } from './perfil.page';
import { CommonsModule } from '../../commons/commons.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [PerfilPage]
})
export class PerfilPageModule {}
