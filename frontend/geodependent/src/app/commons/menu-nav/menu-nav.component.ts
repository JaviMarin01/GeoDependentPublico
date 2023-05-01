import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NavController } from '@ionic/angular';
import { filter } from 'rxjs';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-menu-nav',
  templateUrl: './menu-nav.component.html',
  styleUrls: ['./menu-nav.component.scss'],
})
export class MenuNavComponent implements OnInit, OnDestroy {

  public rutaActual="";
  public numNotif=0;
  public subs:any;

  public anim=false;

  constructor(private router: Router, private navController: NavController, public usuarioService:UsuarioService) {
    this.router.events
        .pipe(filter((event:any) => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          if(event.url.includes("horario")){
            this.rutaActual="horario";
          }else if(event.url.includes("zona")){
            this.rutaActual="zona";
          }else if(event.url.includes("/premium")){
            this.rutaActual="premium";
          }else if(event.url.includes("/perfil")){
            this.rutaActual="perfil";
          }else if(event.url.includes("/cuidador-inicio")){
            this.rutaActual="cuidador-inicio";
          }else if(event.url.includes("/notificaciones")){
            this.rutaActual="notificaciones";
          }else if(event.url.includes("grupo")){
            this.rutaActual="grupo";
          }
        });
  }

  ngOnInit() {
    this.subs=this.usuarioService.numNotif.subscribe((res:any)=>{
      this.numNotif=res;
      if(this.usuarioService.nuevoNumNotif && !this.anim){
        this.usuarioService.nuevoNumNotif=false;
        this.anim=true;
        setTimeout(()=>{
          this.anim=false;
        }, 1000);
      }
    })
  }

  ngOnDestroy(){
    this.subs.unsubscribe();
  }

  irNotificaciones(){
    this.navController.navigateRoot("/notificaciones");
  }

  irPremium(){
    this.navController.navigateRoot("/premium");
  }

  irZonas(){
    this.navController.navigateRoot("/zonas");
  }

  irInicio(){
    this.navController.navigateRoot("/cuidador-inicio");
  }

  irHorarios(){
    this.navController.navigateRoot("/horarios");
  }

  irPerfil(){
    this.navController.navigateRoot("/perfil");
  }
}
