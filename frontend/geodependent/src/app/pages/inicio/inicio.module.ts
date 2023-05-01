import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { InicioPageRoutingModule } from './inicio-routing.module';

import { InicioPage } from './inicio.page';
import { CommonsModule } from '../../commons/commons.module';

import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { LocationAccuracy } from '@ionic-native/location-accuracy/ngx';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation/ngx';
//import { FCM } from '@ionic-native/fcm/ngx';
//import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic';
//import { FCM } from "cordova-plugin-fcm-with-dependecy-updated/ionic/ngx"
import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    InicioPageRoutingModule,
    CommonsModule
  ],
  declarations: [InicioPage],
  providers: [
    Geolocation,
    Diagnostic,
    LocationAccuracy,
    BackgroundGeolocation,
    FCM
  ]
})
export class InicioPageModule {}
