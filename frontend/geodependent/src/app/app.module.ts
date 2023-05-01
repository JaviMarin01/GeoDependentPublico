import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { IonicStorageModule } from '@ionic/storage-angular';
import { HttpClientModule } from '@angular/common/http';

import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';

import { Network } from '@ionic-native/network/ngx';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, IonicStorageModule.forRoot()],
  providers: [FCM, Network, SplashScreen, { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
