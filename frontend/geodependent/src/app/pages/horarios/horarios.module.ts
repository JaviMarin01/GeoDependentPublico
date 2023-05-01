import { NgModule, LOCALE_ID  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HorariosPageRoutingModule } from './horarios-routing.module';

import { HorariosPage } from './horarios.page';
import { CommonsModule } from 'src/app/commons/commons.module';

import { NgCalendarModule  } from 'ionic2-calendar';

import es from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';

    registerLocaleData(es);

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HorariosPageRoutingModule,
    CommonsModule,
    NgCalendarModule
  ],
  declarations: [HorariosPage],
  providers: [ { provide: LOCALE_ID, useValue: 'es-ES' } ]
})
export class HorariosPageModule {}
