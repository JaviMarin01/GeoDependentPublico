import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PremiumPageRoutingModule } from './premium-routing.module';

import { PremiumPage } from './premium.page';
import { CommonsModule } from '../../commons/commons.module';

import { Stripe } from '@ionic-native/stripe/ngx';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    PremiumPageRoutingModule,
    CommonsModule
  ],
  declarations: [PremiumPage],
  providers: [
    Stripe
  ]
})
export class PremiumPageModule {}
