import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NuevohorarioPageRoutingModule } from './nuevohorario-routing.module';

import { NuevohorarioPage } from './nuevohorario.page';
import { CommonsModule } from '../../commons/commons.module';

import { NgCalendarModule  } from 'ionic2-calendar';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NuevohorarioPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule,
    NgCalendarModule
  ],
  declarations: [NuevohorarioPage],
  providers: [ { provide: LOCALE_ID, useValue: 'es-ES' } ]
})
export class NuevohorarioPageModule {}
