import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor( private usuarioService: UsuarioService,
               private router: Router, private storage:Storage) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {
      if(this.usuarioService.logueado){
        if (this.usuarioService.rol !== next.data['rol']) {
          switch (this.usuarioService.rol) {
            case 'ROL_DEPENDIENTE':
              this.router.navigateByUrl('/dependiente-inicio');
              break;
            case 'ROL_CUIDADOR':
              this.router.navigateByUrl('/cuidador-inicio');
              break;
          }
        }
      }else{
        this.router.navigateByUrl('/inicio');
      }
      return this.usuarioService.logueado;
  }

}
