import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuNavComponent } from './menu-nav/menu-nav.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [
    MenuNavComponent
  ],
  exports: [
    MenuNavComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class CommonsModule { }
