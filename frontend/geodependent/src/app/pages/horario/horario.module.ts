import { NgModule, LOCALE_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HorarioPageRoutingModule } from './horario-routing.module';

import { HorarioPage } from './horario.page';
import { CommonsModule } from '../../commons/commons.module';

import { NgCalendarModule  } from 'ionic2-calendar';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HorarioPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule,
    NgCalendarModule
  ],
  declarations: [HorarioPage],
  providers: [ { provide: LOCALE_ID, useValue: 'es-ES' } ]
})
export class HorarioPageModule {}
