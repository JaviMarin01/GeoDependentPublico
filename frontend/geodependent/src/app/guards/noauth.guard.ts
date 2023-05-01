import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoauthGuard implements CanActivate {

  constructor( private usuarioService: UsuarioService,
                private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot) {
      if(this.usuarioService.logueado){
        switch (this.usuarioService.rol) {
          case 'ROL_DEPENDIENTE':
            this.router.navigateByUrl('/dependiente-inicio');
            break;
          case 'ROL_CUIDADOR':
            this.router.navigateByUrl('/cuidador-inicio');
            break;
        }
      }
      return this.usuarioService.logueado;
  }
}
