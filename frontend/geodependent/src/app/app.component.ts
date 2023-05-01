import { Component } from '@angular/core';
import { Platform, NavController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { UsuarioService } from './services/usuario.service';
import { GrupoService } from './services/grupo.service';

import { FCM } from 'cordova-plugin-fcm-with-dependecy-updated/ionic/ngx';
import Swal from 'sweetalert2';

import { SplashScreen } from '@ionic-native/splash-screen/ngx';

import { Network } from '@ionic-native/network/ngx';
import { ConexionService } from './services/conexion.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  public mensajeModal = Swal.mixin({
    customClass: {
      confirmButton: 'botonAceptar',
      title: 'tituloModal',
      htmlContainer: 'textoModal'
    },
    buttonsStyling: false,
  })

  public tokenValidado=false;

  constructor(private storage: Storage, private usuarioService: UsuarioService, private platform: Platform, private grupoService: GrupoService,
              private fcm: FCM, private splashScreen: SplashScreen, private navController: NavController, private network: Network,
              private conexionService: ConexionService) {
  }

  ngOnInit() {
    this.initializeApp();
  }

  ngOnDestroy(){

  }

  async initializeApp(){
    await this.storage.create();
    await this.storage.get("token").then((token:any) => {
      console.log("token: ",token);
      if(token!=null){
        this.usuarioService.setToken(token);
      }else{
        this.usuarioService.setToken("");
      }
    });
    await this.storage.get("idGrupoActual").then((id:any) => {
      console.log("idGrupo: ",id);
      if(id!=null){
        this.grupoService.setIdGrupoActual(id);
      }else{
        this.grupoService.setIdGrupoActual("");
      }
    });
    await this.storage.get("grupoActual").then((nombre:any) => {
      console.log("nombreGrupo: ",nombre);
      if(nombre!=null){
        this.grupoService.setNombreGrupoActual(nombre);
      }else{
        this.grupoService.setNombreGrupoActual("");
      }
    });

    await this.platform.ready().then(async () => {
      //Comprobar el token solo al inicio de la aplicacion (asi no hay que hacerlo en cada cambio de pagina)
      let resul=await this.usuarioService.validarInicial();
      if(resul && this.usuarioService.rol=="ROL_CUIDADOR"){
        this.navController.navigateRoot("/cuidador-inicio");
      }else if(resul && this.usuarioService.rol=="ROL_DEPENDIENTE"){
        this.navController.navigateRoot("/dependiente-inicio");
      }else{
        this.navController.navigateRoot("/inicio");
      }
      this.tokenValidado=true;

      this.splashScreen.hide();

      this.network.onConnect().subscribe(() => {
        this.conexionService.hayConexion.next(true);
      });

      this.network.onDisconnect().subscribe(() => {
        this.conexionService.hayConexion.next(false);
      });

      //Obtener el token de FCM
      this.fcm.getToken().then(token => {
        console.log("fcm token: ", token);
        this.usuarioService.tokenDisp=token;
      });

      //Obtener y manejar notificaciones
      this.usuarioService.notif=this.fcm.onNotification().subscribe((data:any) => {
        this.usuarioService.actualizarNumNotif(this.usuarioService.numNotif.value+1);
      });
    });
  }
}
