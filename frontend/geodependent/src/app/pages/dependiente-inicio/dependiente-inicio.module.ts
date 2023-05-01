import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DependienteInicioPageRoutingModule } from './dependiente-inicio-routing.module';

import { DependienteInicioPage } from './dependiente-inicio.page';

import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DependienteInicioPageRoutingModule
  ],
  declarations: [DependienteInicioPage],
  providers: [
    Geolocation,
    LocationAccuracy,
    Diagnostic,
    BackgroundGeolocation,
    BackgroundMode
  ]
})
export class DependienteInicioPageModule {}
