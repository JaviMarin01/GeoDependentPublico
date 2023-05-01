import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CuidadorInicioPageRoutingModule } from './cuidador-inicio-routing.module';

import { CuidadorInicioPage } from './cuidador-inicio.page';
import { CommonsModule } from '../../commons/commons.module';

import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CuidadorInicioPageRoutingModule,
    CommonsModule,
    ReactiveFormsModule
  ],
  declarations: [CuidadorInicioPage],
  providers: [
    FCM
  ]
})
export class CuidadorInicioPageModule {}
