import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificacionesPageRoutingModule } from './notificaciones-routing.module';

import { NotificacionesPage } from './notificaciones.page';

import { CommonsModule } from '../../commons/commons.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificacionesPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [NotificacionesPage]
})
export class NotificacionesPageModule {}
